import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { adminMi } from "@/shared/lib/izinler";
import { auditLog, ipCikar } from "@/shared/lib/audit";

export const dynamic = "force-dynamic";

const AyarGuncelleSchema = z.object({
  anahtarKey: z.enum([
    "duyuru",
    "sira_hatirlatma",
    "hijyen",
    "whatsapp_tel",
    "lokasyon",
  ]),
  deger: z.string().min(1, "Değer boş olamaz").max(500),
  aktif: z.boolean().optional(),
});

/** GET: tüm TvAyari kayıtları */
export async function GET() {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok" },
      { status: 401 },
    );
  }

  const ayarlar = await prisma.tvAyari.findMany({
    orderBy: { anahtarKey: "asc" },
  });

  return NextResponse.json({ basarili: true, veri: ayarlar });
}

/** PATCH: TvAyari güncelle/oluştur (sadece admin) */
export async function PATCH(req: Request) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok" },
      { status: 401 },
    );
  }
  if (!adminMi(oturum.rol)) {
    return NextResponse.json(
      { basarili: false, hata: "Sadece admin TV ayarlarını değiştirebilir" },
      { status: 403 },
    );
  }

  let veri: z.infer<typeof AyarGuncelleSchema>;
  try {
    const govde = (await req.json()) as unknown;
    veri = AyarGuncelleSchema.parse(govde);
  } catch (e) {
    const m = e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz veri";
    return NextResponse.json({ basarili: false, hata: m }, { status: 400 });
  }

  const guncel = await prisma.tvAyari.upsert({
    where: { anahtarKey: veri.anahtarKey },
    update: {
      deger: veri.deger,
      aktif: veri.aktif ?? true,
      guncelleyenId: oturum.kullaniciId,
    },
    create: {
      anahtarKey: veri.anahtarKey,
      deger: veri.deger,
      aktif: veri.aktif ?? true,
      guncelleyenId: oturum.kullaniciId,
    },
  });

  await auditLog({
    eylem: "tv-ayar-guncelle",
    model: "TvAyari",
    kayitId: guncel.id,
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: { anahtarKey: veri.anahtarKey, deger: veri.deger.slice(0, 100) },
  });

  return NextResponse.json({ basarili: true, veri: guncel });
}
