import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { auditLog, ipCikar } from "@/shared/lib/audit";
import { izinKontrol } from "@/shared/lib/izinler";

const IptalSchema = z.object({
  sebep: z.string().trim().min(3).max(500),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/hisseler/[id]/iptal
 *
 * Hissenin müşteri ataması iptal edilir (hisse soft-delete YAPILMAZ — hisse
 * tekrar başka müşteriye atanabilsin diye boş hale getirilir).
 *
 * Yan etki: hissenin önceki ödemeleri korunur ama uyarı olarak audit'e
 * yazılır (manuel iade gerekirse kasiyer dekontlar listesinden iptal etmeli).
 */
export async function POST(req: Request, { params }: RouteParams) {
  const oturum = await aktifOturum();
  if (!oturum || !izinKontrol(oturum, "hisseler.iptal")) {
    return NextResponse.json({ basarili: false, hata: "Yetki yok" }, { status: 403 });
  }
  const { id } = await params;

  let veri: z.infer<typeof IptalSchema>;
  try {
    const govde = (await req.json()) as unknown;
    veri = IptalSchema.parse(govde);
  } catch (e) {
    const m = e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz veri";
    return NextResponse.json({ basarili: false, hata: m }, { status: 400 });
  }

  const hisse = await prisma.hisse.findFirst({
    where: { id, silindiMi: false },
    include: {
      odemeler: { where: { iptal: false }, select: { toplamTutar: true } },
    },
  });
  if (!hisse) {
    return NextResponse.json(
      { basarili: false, hata: "Hisse bulunamadı" },
      { status: 404 },
    );
  }
  if (hisse.musteriId === null) {
    return NextResponse.json(
      { basarili: false, hata: "Bu hisse zaten boş" },
      { status: 400 },
    );
  }

  const odenenToplam = hisse.odemeler.reduce((s, o) => s + o.toplamTutar, 0);

  // Hisse boşaltılır — vekalet de varsa kaldırılır
  await prisma.hisse.update({
    where: { id },
    data: {
      musteriId: null,
      vekaletAlindi: false,
      vekaletTarihi: null,
      notlar: `İPTAL: ${veri.sebep} (önceki sahip ${hisse.musteriId})`,
    },
  });

  // Vekalet varsa soft-delete
  await prisma.vekalet.updateMany({
    where: { hisseId: id, silindiMi: false },
    data: { silindiMi: true, silinmeTarihi: new Date() },
  });

  await auditLog({
    eylem: "sil",
    model: "Hisse",
    kayitId: id,
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: {
      sebep: veri.sebep,
      eskiMusteriId: hisse.musteriId,
      odenenToplam,
      uyari:
        odenenToplam > 0
          ? "Bu hissede mevcut ödemeler vardı — manuel iade gerekebilir"
          : null,
    },
  });

  return NextResponse.json({
    basarili: true,
    veri: { hisseId: id, odenenToplam },
  });
}
