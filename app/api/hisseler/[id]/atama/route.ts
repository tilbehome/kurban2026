/**
 * Hisseye müşteri ata / çıkar.
 *
 * POST   /api/hisseler/{hisseId}/atama  body: { musteriId }
 * DELETE /api/hisseler/{hisseId}/atama
 *
 * Atama:
 *   - Hisse boş olmalı (musteriId === null)
 *   - Yetki: hisseler.atama veya admin
 *
 * Çıkarma:
 *   - Hisseye bağlı iptal edilmemiş ödeme yoksa
 *   - Aksi halde 400 "Önce ödemeleri iptal et"
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { prisma } from "@/shared/lib/prisma";
import { auditLog, ipCikar } from "@/shared/lib/audit";
import { yayinla } from "@/shared/lib/events";

const AtamaBody = z.object({ musteriId: z.string().min(1) });

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });
  }
  if (!izinKontrol(oturum, "hisseler.ata")) {
    return NextResponse.json({ hata: "Yetki yok" }, { status: 403 });
  }

  const { id: hisseId } = await params;
  if (!hisseId) {
    return NextResponse.json({ hata: "Geçersiz id" }, { status: 400 });
  }

  let body: z.infer<typeof AtamaBody>;
  try {
    body = AtamaBody.parse(await req.json());
  } catch (e) {
    const m = e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz veri";
    return NextResponse.json({ hata: m }, { status: 400 });
  }

  const [hisse, musteri] = await Promise.all([
    prisma.hisse.findFirst({
      where: { id: hisseId, silindiMi: false },
      select: { id: true, no: true, musteriId: true, kurbanId: true },
    }),
    prisma.musteri.findFirst({
      where: { id: body.musteriId, silindiMi: false },
      select: { id: true, adSoyad: true, telefon: true },
    }),
  ]);

  if (!hisse) {
    return NextResponse.json({ hata: "Hisse bulunamadı" }, { status: 404 });
  }
  if (hisse.musteriId) {
    return NextResponse.json(
      { hata: "Hisse zaten atanmış. Önce mevcut müşteriyi çıkar." },
      { status: 400 },
    );
  }
  if (!musteri) {
    return NextResponse.json({ hata: "Müşteri bulunamadı" }, { status: 404 });
  }

  await prisma.hisse.update({
    where: { id: hisseId },
    data: { musteriId: musteri.id },
  });

  await auditLog({
    eylem: "hisse-atama",
    model: "Hisse",
    kayitId: hisseId,
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: {
      kurbanId: hisse.kurbanId,
      hisseNo: hisse.no,
      musteriId: musteri.id,
      adSoyad: musteri.adSoyad,
    },
  });

  yayinla("hisse:atandi", {
    hisseId,
    musteriId: musteri.id,
    kurbanId: hisse.kurbanId,
  });

  return NextResponse.json({
    basarili: true,
    hisse: {
      id: hisse.id,
      no: hisse.no,
      musteri: {
        id: musteri.id,
        adSoyad: musteri.adSoyad,
        telefon: musteri.telefon,
      },
    },
  });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });
  }
  if (!izinKontrol(oturum, "hisseler.ata")) {
    return NextResponse.json({ hata: "Yetki yok" }, { status: 403 });
  }

  const { id: hisseId } = await params;

  const hisse = await prisma.hisse.findFirst({
    where: { id: hisseId, silindiMi: false },
    select: {
      id: true,
      no: true,
      musteriId: true,
      kurbanId: true,
      odemeler: { where: { iptal: false }, select: { id: true } },
    },
  });

  if (!hisse) {
    return NextResponse.json({ hata: "Hisse bulunamadı" }, { status: 404 });
  }
  if (!hisse.musteriId) {
    return NextResponse.json({ hata: "Hisse zaten boş" }, { status: 400 });
  }
  if (hisse.odemeler.length > 0) {
    return NextResponse.json(
      {
        hata: `Bu hisseye ${hisse.odemeler.length} ödeme bağlı. Önce ödemeleri iptal et.`,
      },
      { status: 400 },
    );
  }

  const eskiMusteriId = hisse.musteriId;
  await prisma.hisse.update({
    where: { id: hisseId },
    data: { musteriId: null },
  });

  await auditLog({
    eylem: "hisse-iptal",
    model: "Hisse",
    kayitId: hisseId,
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: {
      kurbanId: hisse.kurbanId,
      hisseNo: hisse.no,
      eskiMusteriId,
    },
  });

  yayinla("hisse:cikarildi", {
    hisseId,
    eskiMusteriId,
    kurbanId: hisse.kurbanId,
  });

  return NextResponse.json({ basarili: true });
}
