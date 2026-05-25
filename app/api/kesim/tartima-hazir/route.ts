/**
 * Tartıma hazır kurban listesi — tartım sayfası için.
 *
 * GET /api/kesim/tartima-hazir
 *
 * kesimDurumu === "tartimda" olan kurbanları döner.
 */

import { NextResponse } from "next/server";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { prisma } from "@/shared/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });
  }
  if (!izinKontrol(oturum, "tv.kontrol")) {
    return NextResponse.json({ hata: "Yetki yok" }, { status: 403 });
  }

  const kurbanlar = await prisma.kurban.findMany({
    where: {
      silindiMi: false,
      kesimDurumu: "tartimda",
    },
    select: {
      id: true,
      kesimSirasi: true,
      hisseGrubu: true,
      hisseSayisi: true,
      operasyonSira: true,
    },
    orderBy: [{ operasyonSira: "asc" }, { kesimSirasi: "asc" }],
  });

  return NextResponse.json({ kurbanlar });
}
