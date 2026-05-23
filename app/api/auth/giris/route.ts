import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import { prisma } from "@/shared/lib/prisma";
import { getOturum } from "@/shared/lib/session";
import type { Rol } from "@/shared/types/module.types";

const GirisSchema = z.object({
  kullaniciAdi: z.string().min(1, "Kullanıcı adı zorunlu"),
  sifre: z.string().min(1, "Şifre zorunlu"),
});

export async function POST(req: Request) {
  let veri: z.infer<typeof GirisSchema>;
  try {
    const govde = (await req.json()) as unknown;
    veri = GirisSchema.parse(govde);
  } catch {
    return NextResponse.json(
      { basarili: false, hata: "Geçersiz istek." },
      { status: 400 },
    );
  }

  const kullanici = await prisma.kullanici.findUnique({
    where: { kullaniciAdi: veri.kullaniciAdi.trim() },
  });

  if (!kullanici || !kullanici.aktif) {
    return NextResponse.json(
      { basarili: false, hata: "Kullanıcı adı veya şifre hatalı." },
      { status: 401 },
    );
  }

  const dogru = await bcrypt.compare(veri.sifre, kullanici.sifreHash);
  if (!dogru) {
    return NextResponse.json(
      { basarili: false, hata: "Kullanıcı adı veya şifre hatalı." },
      { status: 401 },
    );
  }

  await prisma.kullanici.update({
    where: { id: kullanici.id },
    data: { sonGiris: new Date() },
  });

  const session = await getOturum();
  session.oturum = {
    kullaniciId: kullanici.id,
    kullaniciAdi: kullanici.kullaniciAdi,
    adSoyad: kullanici.adSoyad,
    rol: kullanici.rol as Rol,
    girisTarihi: new Date().toISOString(),
  };
  await session.save();

  return NextResponse.json({
    basarili: true,
    kullanici: {
      id: kullanici.id,
      kullaniciAdi: kullanici.kullaniciAdi,
      adSoyad: kullanici.adSoyad,
      rol: kullanici.rol,
    },
  });
}
