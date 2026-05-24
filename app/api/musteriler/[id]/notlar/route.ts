import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { auditLog, ipCikar } from "@/shared/lib/audit";
import { izinKontrol } from "@/shared/lib/izinler";

const YeniNotSchema = z.object({
  icerik: z.string().trim().min(1).max(1000),
  renk: z.enum(["bilgi", "uyari", "onemli", "hatirlat"]).default("bilgi"),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const oturum = await aktifOturum();
  if (!oturum || !izinKontrol(oturum, "musteriler.notlar.oku")) {
    return NextResponse.json({ basarili: false, hata: "Yetki yok" }, { status: 403 });
  }
  const { id } = await params;

  const notlar = await prisma.not.findMany({
    where: { musteriId: id, silindiMi: false },
    orderBy: [{ sabitlendiMi: "desc" }, { createdAt: "desc" }],
  });

  // Kullanıcı adlarını topla
  const ids = Array.from(new Set(notlar.map((n) => n.olusturanId)));
  const kullanicilar = await prisma.kullanici.findMany({
    where: { id: { in: ids } },
    select: { id: true, adSoyad: true },
  });
  const kMap = new Map(kullanicilar.map((k) => [k.id, k.adSoyad]));

  return NextResponse.json({
    basarili: true,
    veri: notlar.map((n) => ({
      ...n,
      olusturanAdSoyad: kMap.get(n.olusturanId) ?? "—",
    })),
  });
}

export async function POST(req: Request, { params }: RouteParams) {
  const oturum = await aktifOturum();
  if (!oturum || !izinKontrol(oturum, "musteriler.notlar.yaz")) {
    return NextResponse.json({ basarili: false, hata: "Yetki yok" }, { status: 403 });
  }
  const { id } = await params;

  let veri: z.infer<typeof YeniNotSchema>;
  try {
    const govde = (await req.json()) as unknown;
    veri = YeniNotSchema.parse(govde);
  } catch (e) {
    const m = e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz veri";
    return NextResponse.json({ basarili: false, hata: m }, { status: 400 });
  }

  const musteri = await prisma.musteri.findFirst({
    where: { id, silindiMi: false },
  });
  if (!musteri) {
    return NextResponse.json(
      { basarili: false, hata: "Müşteri bulunamadı" },
      { status: 404 },
    );
  }

  const yeni = await prisma.not.create({
    data: {
      musteriId: id,
      icerik: veri.icerik,
      renk: veri.renk,
      olusturanId: oturum.kullaniciId,
    },
  });

  await auditLog({
    eylem: "olustur",
    model: "Not",
    kayitId: id, // müşteri id (aktivite feed'i için)
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: { notId: yeni.id, renk: veri.renk, icerikUzunluk: veri.icerik.length },
  });

  return NextResponse.json({ basarili: true, veri: yeni });
}
