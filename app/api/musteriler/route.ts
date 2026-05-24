import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { yayinla } from "@/shared/lib/events";
import { auditLog, ipCikar } from "@/shared/lib/audit";
import { musterileriListele } from "@/modules/musteriler/lib/musteri.service";

const MusteriSchema = z.object({
  adSoyad: z.string().trim().min(2, "Ad soyad en az 2 karakter"),
  telefon: z
    .string()
    .trim()
    .max(30)
    .optional()
    .transform((v) => (v ? v : null)),
  tcKimlik: z
    .string()
    .trim()
    .max(11)
    .optional()
    .transform((v) => (v ? v : null)),
  adres: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v ? v : null)),
  notlar: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v ? v : null)),
});

export async function GET(req: Request) {
  const oturum = await aktifOturum();
  if (!oturum) return NextResponse.json({ hata: "Yetki yok" }, { status: 401 });

  const url = new URL(req.url);
  const arama = url.searchParams.get("arama") ?? undefined;
  const limit = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);

  const { liste, toplam } = await musterileriListele({
    arama,
    durum: "hepsi",
    limit: Math.min(Math.max(limit, 1), 200),
  });
  return NextResponse.json({ liste, toplam });
}

export async function POST(req: Request) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json({ basarili: false, hata: "Yetki yok" }, { status: 401 });
  }

  let veri: z.infer<typeof MusteriSchema>;
  try {
    const govde = (await req.json()) as unknown;
    veri = MusteriSchema.parse(govde);
  } catch (e) {
    const m = e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz veri";
    return NextResponse.json({ basarili: false, hata: m }, { status: 400 });
  }

  const yeni = await prisma.musteri.create({
    data: {
      adSoyad: veri.adSoyad.toUpperCase(),
      telefon: veri.telefon,
      tcKimlik: veri.tcKimlik,
      adres: veri.adres,
      notlar: veri.notlar,
      olusturanId: oturum.kullaniciId,
    },
  });

  await auditLog({
    eylem: "olustur",
    model: "Musteri",
    kayitId: yeni.id,
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: { adSoyad: yeni.adSoyad, telefon: yeni.telefon },
  });

  yayinla("musteri:olusturuldu", { id: yeni.id, adSoyad: yeni.adSoyad });
  return NextResponse.json({ basarili: true, id: yeni.id });
}
