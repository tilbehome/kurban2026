import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { adminMi } from "@/shared/lib/izinler";
import { auditLog, ipCikar } from "@/shared/lib/audit";

const AcilDurumSchema = z.object({
  aktif: z.boolean(),
  mesaj: z.string().max(200).optional(),
});

const ACIL_KEY = "acil_durum_aktif";
const ACIL_MESAJ_KEY = "acil_durum_mesaj";

/**
 * Acil durum modu — TV ekranında "MOLA" gösterir, tüm işlemleri durdurur.
 * TvAyari'da "acil_durum_aktif" anahtarı tutar ("true" | "false").
 *
 * Sadece admin tetikleyebilir.
 */
export async function POST(req: Request) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok" },
      { status: 401 },
    );
  }
  if (!adminMi(oturum.rol)) {
    return NextResponse.json(
      { basarili: false, hata: "Sadece admin acil durum tetikleyebilir" },
      { status: 403 },
    );
  }

  let veri: z.infer<typeof AcilDurumSchema>;
  try {
    const govde = (await req.json()) as unknown;
    veri = AcilDurumSchema.parse(govde);
  } catch (e) {
    const m = e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz veri";
    return NextResponse.json({ basarili: false, hata: m }, { status: 400 });
  }

  // TvAyari upsert
  await prisma.tvAyari.upsert({
    where: { anahtarKey: ACIL_KEY },
    update: {
      deger: veri.aktif ? "true" : "false",
      aktif: true,
      guncelleyenId: oturum.kullaniciId,
    },
    create: {
      anahtarKey: ACIL_KEY,
      deger: veri.aktif ? "true" : "false",
      aktif: true,
      guncelleyenId: oturum.kullaniciId,
    },
  });

  if (veri.mesaj !== undefined) {
    await prisma.tvAyari.upsert({
      where: { anahtarKey: ACIL_MESAJ_KEY },
      update: {
        deger: veri.mesaj,
        aktif: true,
        guncelleyenId: oturum.kullaniciId,
      },
      create: {
        anahtarKey: ACIL_MESAJ_KEY,
        deger: veri.mesaj,
        aktif: true,
        guncelleyenId: oturum.kullaniciId,
      },
    });
  }

  await auditLog({
    eylem: "tv-acil-durum",
    model: "TvAyari",
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: { aktif: veri.aktif, mesaj: veri.mesaj },
  });

  return NextResponse.json({ basarili: true, aktif: veri.aktif });
}

/**
 * GET: acil durum durumunu döndür.
 *
 * SPRINT-P4 İŞ 4: Public TV ekranı acil durumu zaten `/api/tv/yayin` (SSE)
 * üzerinden alıyor. Bu GET sadece admin paneli AcilDurumKart için. Auth
 * zorunlu (middleware whitelist'inden çıkarıldı).
 */
export async function GET() {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok" },
      { status: 401 },
    );
  }

  const k = await prisma.tvAyari.findUnique({
    where: { anahtarKey: ACIL_KEY },
  });
  const m = await prisma.tvAyari.findUnique({
    where: { anahtarKey: ACIL_MESAJ_KEY },
  });
  return NextResponse.json({
    basarili: true,
    aktif: k?.deger === "true",
    mesaj: m?.deger ?? null,
  });
}
