/**
 * Hisse teslim durumu.
 *
 * PATCH /api/hisseler/{id}/teslim
 * Body: { teslim: boolean }
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { prisma } from "@/shared/lib/prisma";
import { auditLog, ipCikar } from "@/shared/lib/audit";

const Body = z.object({ teslim: z.boolean() });

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const oturum = await aktifOturum();
  if (!oturum) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });
  if (!izinKontrol(oturum, "tv.kontrol")) {
    return NextResponse.json({ hata: "Yetki yok" }, { status: 403 });
  }

  const { id } = await params;
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (e) {
    const m = e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz veri";
    return NextResponse.json({ hata: m }, { status: 400 });
  }

  const hisse = await prisma.hisse.findFirst({
    where: { id, silindiMi: false },
    select: { id: true, no: true, kurbanId: true },
  });
  if (!hisse) {
    return NextResponse.json({ hata: "Hisse bulunamadı" }, { status: 404 });
  }

  await prisma.hisse.update({
    where: { id },
    data: {
      teslimDurumu: body.teslim ? "Teslim Edildi" : "Hazır",
      paketDurumu: body.teslim ? "Teslim Edildi" : "Teslim Hazır",
      teslimTarihi: body.teslim ? new Date() : null,
    },
  });

  await auditLog({
    eylem: "guncelle",
    model: "Hisse",
    kayitId: id,
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: {
      alan: "teslim",
      hisseNo: hisse.no,
      kurbanId: hisse.kurbanId,
      teslim: body.teslim,
    },
  });

  return NextResponse.json({ basarili: true });
}
