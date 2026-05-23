import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { adminMi } from "@/shared/lib/permissions";

const YeniKullaniciSchema = z.object({
  kullaniciAdi: z
    .string()
    .min(3, "En az 3 karakter")
    .max(50)
    .regex(/^[a-zA-Z0-9._-]+$/, "Geçersiz karakter"),
  adSoyad: z.string().min(1).max(120),
  sifre: z.string().min(6, "Şifre en az 6 karakter"),
  rol: z.enum(["admin", "kasiyer"]),
  aktif: z.boolean().default(true),
});

export async function POST(req: Request) {
  const oturum = await aktifOturum();
  if (!oturum || !adminMi(oturum.rol)) {
    return NextResponse.json({ basarili: false, hata: "Yetki yok" }, { status: 403 });
  }

  let veri: z.infer<typeof YeniKullaniciSchema>;
  try {
    const govde = (await req.json()) as unknown;
    veri = YeniKullaniciSchema.parse(govde);
  } catch (e) {
    const m = e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz veri";
    return NextResponse.json({ basarili: false, hata: m }, { status: 400 });
  }

  const mevcut = await prisma.kullanici.findUnique({
    where: { kullaniciAdi: veri.kullaniciAdi },
  });
  if (mevcut) {
    return NextResponse.json(
      { basarili: false, hata: "Bu kullanıcı adı zaten kayıtlı" },
      { status: 409 },
    );
  }

  const sifreHash = await bcrypt.hash(veri.sifre, 10);
  const yeni = await prisma.kullanici.create({
    data: {
      kullaniciAdi: veri.kullaniciAdi,
      adSoyad: veri.adSoyad,
      sifreHash,
      rol: veri.rol,
      aktif: veri.aktif,
    },
  });

  return NextResponse.json({ basarili: true, id: yeni.id });
}
