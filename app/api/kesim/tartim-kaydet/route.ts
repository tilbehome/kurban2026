/**
 * Tartım kaydet — kurbanı paketleme aşamasına geçirir.
 *
 * POST /api/kesim/tartim-kaydet
 * Body: { kurbanId: string, toplamKg: number }
 *
 * Atomik transaction:
 *   1. Kurban.toplamKg + karkasKg = toplamKg
 *   2. Kurban.kesimDurumu = "paketleme", ilerlemeYuzde = 70
 *   3. Tüm hisseler: kesimDurumu = "paketleme", paketDurumu = "Bekliyor",
 *      paketKg = toplamKg / hisseSayisi
 *   4. AuditLog "tartim-kaydet"
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { prisma } from "@/shared/lib/prisma";
import { auditLog, ipCikar } from "@/shared/lib/audit";
import { yayinla } from "@/shared/lib/events";

const Body = z.object({
  kurbanId: z.string().min(1),
  toplamKg: z.number().positive().max(1000),
});

export async function POST(req: NextRequest) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });
  }
  if (!izinKontrol(oturum, "tv.kontrol")) {
    return NextResponse.json({ hata: "Yetki yok" }, { status: 403 });
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (e) {
    const m = e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz veri";
    return NextResponse.json({ hata: m }, { status: 400 });
  }

  const kurban = await prisma.kurban.findFirst({
    where: { id: body.kurbanId, silindiMi: false },
    include: {
      hisseler: { where: { silindiMi: false }, select: { id: true } },
    },
  });
  if (!kurban) {
    return NextResponse.json({ hata: "Kurban bulunamadı" }, { status: 404 });
  }

  const hisseSayisi = kurban.hisseler.length || kurban.hisseSayisi || 7;
  const hisseBasiKg = body.toplamKg / hisseSayisi;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.kurban.update({
        where: { id: body.kurbanId },
        data: {
          kesimDurumu: "paketleme",
          toplamKg: body.toplamKg,
          karkasKg: body.toplamKg,
          ilerlemeYuzde: 70,
        },
      });

      await tx.hisse.updateMany({
        where: { kurbanId: body.kurbanId, silindiMi: false },
        data: {
          kesimDurumu: "paketleme",
          paketDurumu: "Bekliyor",
          paketKg: hisseBasiKg,
        },
      });
    });
  } catch (e) {
    console.error("[tartim-kaydet]", e);
    return NextResponse.json({ hata: "Kaydedilemedi" }, { status: 500 });
  }

  await auditLog({
    eylem: "guncelle",
    model: "Kurban",
    kayitId: body.kurbanId,
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: {
      alan: "tartim-kaydet",
      kesimSirasi: kurban.kesimSirasi,
      toplamKg: body.toplamKg,
      hisseBasiKg,
    },
  });

  yayinla("kurban:asama", {
    kurbanId: body.kurbanId,
    yeniDurum: "paketleme",
  });

  return NextResponse.json({
    basarili: true,
    toplamKg: body.toplamKg,
    hisseBasiKg,
  });
}
