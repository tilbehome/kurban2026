import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import { prisma } from "@/shared/lib/prisma";
import { getOturum } from "@/shared/lib/session";
import { auditLog, ipCikar } from "@/shared/lib/audit";
import { rateLimitKontrol, rateLimitSifirla } from "@/shared/lib/rate-limit";
import type { Rol } from "@/shared/types/module.types";

// Brute-force koruması: aynı IP'den 5 dakikada en çok 5 deneme.
const LOGIN_MAX_DENEME = 5;
const LOGIN_PENCERE_SN = 5 * 60;

const GirisSchema = z.object({
  kullaniciAdi: z.string().min(1, "Kullanıcı adı zorunlu"),
  sifre: z.string().min(1, "Şifre zorunlu"),
});

export async function POST(req: Request) {
  const ip = ipCikar(req);
  const rateAnahtar = `login:${ip ?? "bilinmiyor"}`;

  // Rate limit — sliding window: pencere aşıldıysa istek 401 değil, 429 döner.
  // rateLimitKontrol başarısız olarak sayıldığı için "test" amaçlı bir deneme
  // ekler. Bu yüzden başarılı login'de sayaç sıfırlanır.
  const rl = rateLimitKontrol(rateAnahtar, LOGIN_MAX_DENEME, LOGIN_PENCERE_SN);
  if (!rl.izinli) {
    await auditLog({
      eylem: "giris-rate-limit",
      ip,
      detaylar: { kalanSn: rl.kalanSn ?? null },
    });
    return NextResponse.json(
      {
        basarili: false,
        hata: `Çok fazla deneme. ${Math.ceil((rl.kalanSn ?? 60) / 60)} dakika sonra tekrar deneyin.`,
        kilitliKalan: rl.kalanSn ?? null,
      },
      { status: 429 },
    );
  }

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
    await auditLog({
      eylem: "giris-basarisiz",
      ip,
      detaylar: { kullaniciAdi: veri.kullaniciAdi, sebep: "kullanici-yok-veya-pasif" },
    });
    return NextResponse.json(
      { basarili: false, hata: "Kullanıcı adı veya şifre hatalı." },
      { status: 401 },
    );
  }

  const dogru = await bcrypt.compare(veri.sifre, kullanici.sifreHash);
  if (!dogru) {
    await auditLog({
      eylem: "giris-basarisiz",
      kullaniciId: kullanici.id,
      ip,
      detaylar: { kullaniciAdi: veri.kullaniciAdi, sebep: "yanlis-sifre" },
    });
    return NextResponse.json(
      { basarili: false, hata: "Kullanıcı adı veya şifre hatalı." },
      { status: 401 },
    );
  }

  // Başarılı kimlik doğrulama — rate limit sayacını sıfırla
  rateLimitSifirla(rateAnahtar);

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

  await auditLog({
    eylem: "giris",
    kullaniciId: kullanici.id,
    model: "Kullanici",
    kayitId: kullanici.id,
    ip,
  });

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
