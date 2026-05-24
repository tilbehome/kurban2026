import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { adminMi } from "@/shared/lib/izinler";
import { auditLog, ipCikar } from "@/shared/lib/audit";
import { SABLON_KARAKTER_LIMIT } from "@/modules/whatsapp/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const KategoriSchema = z.enum(["tahsilat", "bayram", "kesim", "genel"]);

const SablonGuncelleSchema = z.object({
  ad: z.string().min(1).max(80).optional(),
  kategori: KategoriSchema.optional(),
  icerik: z
    .string()
    .min(1)
    .max(SABLON_KARAKTER_LIMIT)
    .optional(),
  aktifMi: z.boolean().optional(),
});

/** PATCH: şablon güncelle (sadece admin) */
export async function PATCH(req: Request, { params }: RouteParams) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok" },
      { status: 401 },
    );
  }
  if (!adminMi(oturum.rol)) {
    return NextResponse.json(
      { basarili: false, hata: "Sadece admin şablon düzenleyebilir" },
      { status: 403 },
    );
  }

  const { id } = await params;

  const mevcut = await prisma.whatsAppSablonu.findUnique({ where: { id } });
  if (!mevcut || mevcut.silindiMi) {
    return NextResponse.json(
      { basarili: false, hata: "Şablon bulunamadı" },
      { status: 404 },
    );
  }

  let veri: z.infer<typeof SablonGuncelleSchema>;
  try {
    const govde = (await req.json()) as unknown;
    veri = SablonGuncelleSchema.parse(govde);
  } catch (e) {
    const m = e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz veri";
    return NextResponse.json({ basarili: false, hata: m }, { status: 400 });
  }

  const guncel = await prisma.whatsAppSablonu.update({
    where: { id },
    data: veri,
  });

  await auditLog({
    eylem: "whatsapp-sablon-guncelle",
    model: "WhatsAppSablonu",
    kayitId: id,
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: { degisen: Object.keys(veri) },
  });

  return NextResponse.json({ basarili: true, veri: guncel });
}

/** DELETE: şablon sil (soft) — varsayilan şablonlar silinemez */
export async function DELETE(req: Request, { params }: RouteParams) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok" },
      { status: 401 },
    );
  }
  if (!adminMi(oturum.rol)) {
    return NextResponse.json(
      { basarili: false, hata: "Sadece admin şablon silebilir" },
      { status: 403 },
    );
  }

  const { id } = await params;
  const mevcut = await prisma.whatsAppSablonu.findUnique({ where: { id } });
  if (!mevcut || mevcut.silindiMi) {
    return NextResponse.json(
      { basarili: false, hata: "Şablon bulunamadı" },
      { status: 404 },
    );
  }
  if (mevcut.varsayilan) {
    return NextResponse.json(
      {
        basarili: false,
        hata: "Sistem şablonları silinemez (sadece pasifleştirilebilir)",
      },
      { status: 400 },
    );
  }

  await prisma.whatsAppSablonu.update({
    where: { id },
    data: { silindiMi: true, silinmeTarihi: new Date(), aktifMi: false },
  });

  await auditLog({
    eylem: "whatsapp-sablon-sil",
    model: "WhatsAppSablonu",
    kayitId: id,
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: { ad: mevcut.ad },
  });

  return NextResponse.json({ basarili: true });
}
