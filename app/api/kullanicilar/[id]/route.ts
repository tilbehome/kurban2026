import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { adminMi } from "@/shared/lib/permissions";

const GuncelleSchema = z.object({
  kullaniciAdi: z.string().min(3).max(50).optional(),
  adSoyad: z.string().min(1).max(120).optional(),
  sifre: z.string().optional(),
  rol: z.enum(["admin", "kasiyer"]).optional(),
  aktif: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const oturum = await aktifOturum();
  if (!oturum || !adminMi(oturum.rol)) {
    return NextResponse.json({ basarili: false, hata: "Yetki yok" }, { status: 403 });
  }

  const { id: kullaniciId } = await params;
  if (!kullaniciId) {
    return NextResponse.json({ basarili: false, hata: "Geçersiz id" }, { status: 400 });
  }

  let veri: z.infer<typeof GuncelleSchema>;
  try {
    const govde = (await req.json()) as unknown;
    veri = GuncelleSchema.parse(govde);
  } catch {
    return NextResponse.json(
      { basarili: false, hata: "Geçersiz veri" },
      { status: 400 },
    );
  }

  const guncelle: Record<string, unknown> = {};
  if (veri.kullaniciAdi) guncelle.kullaniciAdi = veri.kullaniciAdi;
  if (veri.adSoyad) guncelle.adSoyad = veri.adSoyad;
  if (veri.rol) guncelle.rol = veri.rol;
  if (typeof veri.aktif === "boolean") guncelle.aktif = veri.aktif;
  if (veri.sifre && veri.sifre.length >= 6) {
    guncelle.sifreHash = await bcrypt.hash(veri.sifre, 10);
  }

  await prisma.kullanici.update({
    where: { id: kullaniciId },
    data: guncelle,
  });

  return NextResponse.json({ basarili: true });
}
