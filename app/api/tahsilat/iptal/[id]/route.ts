/**
 * Ödeme iptal endpoint'i.
 *
 * POST /api/tahsilat/iptal/{odemeId}
 * Body: { sebep: string }
 *
 * İşleyiş (atomik transaction):
 *   1. Yetki kontrolü (tahsilat.olustur)
 *   2. Ödeme bulunmalı + iptal=false olmalı
 *   3. Odeme.iptal=true + iptalSebep + iptalTarihi + iptalKulId
 *   4. KasaHareketi ters kayıt (-toplamTutar, tip="iptal-tahsilat")
 *   5. Otomatik yedek
 *   6. AuditLog "odeme-iptal"
 *   7. Olay yayını
 *
 * Soft mark — kayıt SİLİNMEZ. Aynı ödeme 2 kez iptal edilemez.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { prisma } from "@/shared/lib/prisma";
import { auditLog, ipCikar } from "@/shared/lib/audit";
import { yedekAl } from "@/shared/lib/backup";
import { yayinla } from "@/shared/lib/events";

const Body = z.object({
  sebep: z.string().min(2).max(500),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });
  }
  if (!izinKontrol(oturum, "tahsilat.olustur")) {
    return NextResponse.json({ hata: "Yetki yok" }, { status: 403 });
  }

  const { id: odemeId } = await params;
  if (!odemeId) {
    return NextResponse.json({ hata: "Geçersiz id" }, { status: 400 });
  }

  let payload: z.infer<typeof Body>;
  try {
    payload = Body.parse(await req.json());
  } catch (e) {
    const m = e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz veri";
    return NextResponse.json({ hata: m }, { status: 400 });
  }

  const odeme = await prisma.odeme.findUnique({
    where: { id: odemeId },
    include: { hisse: { select: { musteriId: true } } },
  });

  if (!odeme) {
    return NextResponse.json({ hata: "Ödeme bulunamadı" }, { status: 404 });
  }
  if (odeme.iptal) {
    return NextResponse.json(
      { hata: "Bu ödeme zaten iptal edilmiş" },
      { status: 400 },
    );
  }

  const simdi = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.odeme.update({
        where: { id: odemeId },
        data: {
          iptal: true,
          iptalSebep: payload.sebep,
          iptalTarihi: simdi,
          iptalKulId: oturum.kullaniciId,
        },
      });

      // Bu ödemeye bağlı kasa hareketleri — ters kayıt
      const hareketler = await tx.kasaHareketi.findMany({
        where: { odemeId, silindiMi: false },
      });

      for (const h of hareketler) {
        await tx.kasaHareketi.create({
          data: {
            tip: "iptal-tahsilat",
            tutar: -Math.abs(h.tutar),
            yontem: h.yontem,
            aciklama: `İptal — ${h.aciklama} (${odeme.dekontNo})`,
            odemeId,
            kullaniciId: oturum.kullaniciId,
            tarih: simdi,
          },
        });
      }
    });
  } catch (e) {
    console.error("[tahsilat/iptal] Transaction hatası:", e);
    return NextResponse.json(
      { hata: "İptal işlemi sırasında hata oluştu" },
      { status: 500 },
    );
  }

  // Otomatik yedek + audit + event — hata atsalar bile akış kesilmesin
  yedekAl(`iptal-${odemeId}`).catch((e) => console.error("[yedek]", e));

  await auditLog({
    eylem: "odeme-iptal",
    model: "Odeme",
    kayitId: odemeId,
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: {
      dekontNo: odeme.dekontNo,
      iptalTutar: odeme.toplamTutar,
      sebep: payload.sebep,
      hisseId: odeme.hisseId,
      musteriId: odeme.hisse.musteriId,
    },
  });

  yayinla("odeme:iptal", {
    odemeId,
    hisseId: odeme.hisseId,
    musteriId: odeme.hisse.musteriId,
    tutar: odeme.toplamTutar,
  });

  return NextResponse.json({
    basarili: true,
    iptalTarihi: simdi.toISOString(),
  });
}
