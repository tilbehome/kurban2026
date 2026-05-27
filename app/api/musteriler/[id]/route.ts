import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { auditLog, ipCikar } from "@/shared/lib/audit";
import { izinKontrol } from "@/shared/lib/izinler";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Müşteri kısmi güncelleme.
 *
 * SPRINT-11: Bayram günü "İSİMSİZ DANA-X" gibi placeholder müşterileri
 * gerçek hissedar bilgileriyle değiştirmek için. Hisse/Ödeme/Vekalet
 * bağları korunur (sadece Musteri kaydının alanları güncellenir).
 */
const PatchBody = z.object({
  adSoyad: z.string().trim().min(3).max(120).optional(),
  telefon: z.string().trim().max(30).nullable().optional(),
  tcKimlik: z.string().trim().max(11).nullable().optional(),
  adres: z.string().trim().max(500).nullable().optional(),
  notlar: z.string().trim().max(500).nullable().optional(),
  etiketler: z.string().trim().max(500).nullable().optional(),
});

export async function GET(_req: Request, { params }: RouteParams) {
  const oturum = await aktifOturum();
  if (!oturum || !izinKontrol(oturum, "musteriler.goruntule")) {
    return NextResponse.json({ basarili: false, hata: "Yetki yok" }, { status: 403 });
  }
  const { id } = await params;

  const musteri = await prisma.musteri.findFirst({
    where: { id, silindiMi: false },
    select: {
      id: true,
      adSoyad: true,
      telefon: true,
      tcKimlik: true,
      adres: true,
      notlar: true,
      etiketler: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!musteri) {
    return NextResponse.json(
      { basarili: false, hata: "Müşteri bulunamadı" },
      { status: 404 },
    );
  }

  return NextResponse.json({ basarili: true, veri: musteri });
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const oturum = await aktifOturum();
  if (!oturum || !izinKontrol(oturum, "musteriler.guncelle")) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok" },
      { status: 403 },
    );
  }
  const { id } = await params;

  let veri: z.infer<typeof PatchBody>;
  try {
    const govde = (await req.json()) as unknown;
    veri = PatchBody.parse(govde);
  } catch (e) {
    const m = e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz veri";
    return NextResponse.json({ basarili: false, hata: m }, { status: 400 });
  }

  const mevcut = await prisma.musteri.findFirst({
    where: { id, silindiMi: false },
    select: {
      id: true,
      adSoyad: true,
      telefon: true,
      tcKimlik: true,
      adres: true,
      notlar: true,
      etiketler: true,
    },
  });
  if (!mevcut) {
    return NextResponse.json(
      { basarili: false, hata: "Müşteri bulunamadı" },
      { status: 404 },
    );
  }

  // Sadece gönderilen alanları güncelle (kısmi update)
  const guncelleme: Record<string, unknown> = {};
  if (veri.adSoyad !== undefined) {
    guncelleme.adSoyad = veri.adSoyad.toLocaleUpperCase("tr-TR");
  }
  if (veri.telefon !== undefined) guncelleme.telefon = veri.telefon || null;
  if (veri.tcKimlik !== undefined) guncelleme.tcKimlik = veri.tcKimlik || null;
  if (veri.adres !== undefined) guncelleme.adres = veri.adres || null;
  if (veri.notlar !== undefined) guncelleme.notlar = veri.notlar || null;
  if (veri.etiketler !== undefined) {
    guncelleme.etiketler = veri.etiketler || null;
  }

  if (Object.keys(guncelleme).length === 0) {
    return NextResponse.json(
      { basarili: false, hata: "Güncellenecek alan yok" },
      { status: 400 },
    );
  }

  const guncel = await prisma.musteri.update({
    where: { id },
    data: guncelleme,
    select: {
      id: true,
      adSoyad: true,
      telefon: true,
      tcKimlik: true,
      adres: true,
      notlar: true,
      etiketler: true,
    },
  });

  await auditLog({
    eylem: "guncelle",
    model: "Musteri",
    kayitId: id,
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: {
      onceki: {
        adSoyad: mevcut.adSoyad,
        telefon: mevcut.telefon,
        tcKimlik: mevcut.tcKimlik,
        adres: mevcut.adres,
        notlar: mevcut.notlar,
        etiketler: mevcut.etiketler,
      },
      yeni: guncelleme,
    },
  });

  return NextResponse.json({ basarili: true, veri: guncel });
}

/**
 * Müşteri soft delete (MIMARI §5.3).
 * Hisseleri korunur (boşaltılmaz) — silinen müşterinin geçmişi audit'te.
 */
export async function DELETE(req: Request, { params }: RouteParams) {
  const oturum = await aktifOturum();
  if (!oturum || !izinKontrol(oturum, "musteriler.guncelle")) {
    // sil için admin gerekli olabilir; kasiyer guncelle/sil ayırt etmeli ama şimdilik guncelle
    return NextResponse.json({ basarili: false, hata: "Yetki yok" }, { status: 403 });
  }
  const { id } = await params;

  const musteri = await prisma.musteri.findFirst({
    where: { id, silindiMi: false },
    include: { hisseler: { where: { silindiMi: false }, select: { id: true } } },
  });
  if (!musteri) {
    return NextResponse.json(
      { basarili: false, hata: "Müşteri bulunamadı" },
      { status: 404 },
    );
  }

  await prisma.musteri.update({
    where: { id },
    data: { silindiMi: true, silinmeTarihi: new Date() },
  });

  await auditLog({
    eylem: "sil",
    model: "Musteri",
    kayitId: id,
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: {
      adSoyad: musteri.adSoyad,
      hisseSayisi: musteri.hisseler.length,
      not: "Soft delete — hisseler ve ödeme geçmişi korundu",
    },
  });

  return NextResponse.json({ basarili: true });
}
