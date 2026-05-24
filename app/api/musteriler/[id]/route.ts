import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { auditLog, ipCikar } from "@/shared/lib/audit";
import { izinKontrol } from "@/shared/lib/izinler";

interface RouteParams {
  params: Promise<{ id: string }>;
}

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
