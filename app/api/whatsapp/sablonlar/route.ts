import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol, adminMi } from "@/shared/lib/izinler";
import { auditLog, ipCikar } from "@/shared/lib/audit";
import { SABLON_KARAKTER_LIMIT } from "@/modules/whatsapp/types";

export const dynamic = "force-dynamic";

const KategoriSchema = z.enum(["tahsilat", "bayram", "kesim", "genel"]);

const SablonOlusturSchema = z.object({
  ad: z.string().min(1, "Ad zorunlu").max(80),
  kategori: KategoriSchema,
  icerik: z
    .string()
    .min(1, "İçerik boş olamaz")
    .max(SABLON_KARAKTER_LIMIT, `En fazla ${SABLON_KARAKTER_LIMIT} karakter`),
});

/** GET: tüm şablonlar (varsayılan önce, sonra alfabetik) */
export async function GET() {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok" },
      { status: 401 },
    );
  }
  if (!izinKontrol(oturum, "whatsapp.gecmis")) {
    return NextResponse.json(
      { basarili: false, hata: "Görüntüleme yetkiniz yok" },
      { status: 403 },
    );
  }

  const sablonlar = await prisma.whatsAppSablonu.findMany({
    where: { silindiMi: false },
    orderBy: [{ varsayilan: "desc" }, { ad: "asc" }],
  });

  return NextResponse.json({ basarili: true, veri: sablonlar });
}

/** POST: yeni şablon oluştur (sadece admin) */
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
      { basarili: false, hata: "Sadece admin şablon ekleyebilir" },
      { status: 403 },
    );
  }

  let veri: z.infer<typeof SablonOlusturSchema>;
  try {
    const govde = (await req.json()) as unknown;
    veri = SablonOlusturSchema.parse(govde);
  } catch (e) {
    const m = e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz veri";
    return NextResponse.json({ basarili: false, hata: m }, { status: 400 });
  }

  const sablon = await prisma.whatsAppSablonu.create({
    data: {
      ad: veri.ad,
      kategori: veri.kategori,
      icerik: veri.icerik,
      aktifMi: true,
      varsayilan: false,
      olusturanId: oturum.kullaniciId,
    },
  });

  await auditLog({
    eylem: "whatsapp-sablon-olustur",
    model: "WhatsAppSablonu",
    kayitId: sablon.id,
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: { ad: veri.ad, kategori: veri.kategori },
  });

  return NextResponse.json({ basarili: true, veri: sablon });
}
