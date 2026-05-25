/**
 * Personel sorun bildirimi.
 *
 * POST /api/tv/sorun-bildir
 * Body: { kurbanId: string, sorun: string }
 *
 * Kurban.notlar'a satır ekler + AuditLog.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { prisma } from "@/shared/lib/prisma";
import { auditLog, ipCikar } from "@/shared/lib/audit";

const Body = z.object({
  kurbanId: z.string().min(1),
  sorun: z.string().min(3).max(500),
});

export async function POST(req: NextRequest) {
  const oturum = await aktifOturum();
  if (!oturum) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });
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

  const kurban = await prisma.kurban.findUnique({
    where: { id: body.kurbanId },
    select: { id: true, kesimSirasi: true, notlar: true },
  });
  if (!kurban) {
    return NextResponse.json({ hata: "Kurban bulunamadı" }, { status: 404 });
  }

  const zamanDamga = new Date().toISOString();
  const yeniNot = `[SORUN ${zamanDamga} — ${oturum.adSoyad}] ${body.sorun}`;
  const guncel = kurban.notlar ? `${kurban.notlar}\n${yeniNot}` : yeniNot;

  await prisma.kurban.update({
    where: { id: body.kurbanId },
    data: { notlar: guncel },
  });

  await auditLog({
    eylem: "guncelle",
    model: "Kurban",
    kayitId: body.kurbanId,
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: {
      alan: "sorun-bildir",
      kesimSirasi: kurban.kesimSirasi,
      sorun: body.sorun,
    },
  });

  return NextResponse.json({ basarili: true });
}
