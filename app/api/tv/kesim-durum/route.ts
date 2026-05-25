import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { auditLog, ipCikar } from "@/shared/lib/audit";
import { DURUM_VARSAYILAN_ASAMA } from "@/modules/tv/types";
import type { KesimDurumu } from "@/modules/tv/types";

const KesimDurumuSchema = z.enum([
  "beklemede",
  "vekalet_onay",
  "siradaki",
  "kesimde",
  "parcalama",
  "tartimda",
  "teslime_hazir",
  "teslim_edildi",
  "iptal",
]);

const DurumDegisikligiSchema = z.object({
  hisseId: z.string().min(1),
  yeniDurum: KesimDurumuSchema,
  siraNo: z.number().int().nullable().optional(),
  asama: z.string().nullable().optional(),
  teslimNoktasi: z.string().nullable().optional(),
});

/**
 * Hissenin kesim durumunu değiştir (admin/kasiyer).
 *
 * Otomatik tamamlayıcı:
 * - "kesimde" → kesimBaslama = now (ilk geçişte)
 * - "teslime_hazir" → kesimBitis = now
 * - "asama" verilmemişse durumdan otomatik atama
 */
export async function POST(req: Request) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok" },
      { status: 401 },
    );
  }
  if (!izinKontrol(oturum, "tv.kontrol")) {
    return NextResponse.json(
      { basarili: false, hata: "TV kontrol yetkiniz yok" },
      { status: 403 },
    );
  }

  let veri: z.infer<typeof DurumDegisikligiSchema>;
  try {
    const govde = (await req.json()) as unknown;
    veri = DurumDegisikligiSchema.parse(govde);
  } catch (e) {
    const m = e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz veri";
    return NextResponse.json({ basarili: false, hata: m }, { status: 400 });
  }

  const mevcut = await prisma.hisse.findUnique({
    where: { id: veri.hisseId },
    select: {
      id: true,
      kesimDurumu: true,
      kesimBaslama: true,
      kesimBitis: true,
      asama: true,
    },
  });
  if (!mevcut) {
    return NextResponse.json(
      { basarili: false, hata: "Hisse bulunamadı" },
      { status: 404 },
    );
  }

  const eskiDurum = mevcut.kesimDurumu as KesimDurumu;
  const yeniDurum = veri.yeniDurum;

  // Otomatik aşama (eğer override edilmediyse)
  const varsayilanAsama = DURUM_VARSAYILAN_ASAMA[yeniDurum];
  const asama =
    veri.asama !== undefined
      ? veri.asama
      : varsayilanAsama ?? mevcut.asama;

  // Zaman damgaları
  const data: Record<string, unknown> = {
    kesimDurumu: yeniDurum,
    asama,
  };
  if (veri.siraNo !== undefined) data.siraNo = veri.siraNo;
  if (veri.teslimNoktasi !== undefined)
    data.teslimNoktasi = veri.teslimNoktasi;

  // Kesime ilk geçişte başlama zamanı
  if (yeniDurum === "kesimde" && !mevcut.kesimBaslama) {
    data.kesimBaslama = new Date();
  }
  // Teslime hazır olunca bitiş zamanı
  if (yeniDurum === "teslime_hazir" && !mevcut.kesimBitis) {
    data.kesimBitis = new Date();
    data.teslimDurumu = "Hazır";
  }
  if (yeniDurum === "teslim_edildi") {
    data.teslimDurumu = "Teslim Edildi";
  }

  const guncel = await prisma.hisse.update({
    where: { id: veri.hisseId },
    data,
  });

  await auditLog({
    eylem: "tv-durum-degisikligi",
    model: "Hisse",
    kayitId: veri.hisseId,
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: { eskiDurum, yeniDurum, asama, siraNo: veri.siraNo },
  });

  return NextResponse.json({ basarili: true, veri: guncel });
}
