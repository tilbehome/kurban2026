/**
 * Teslime hazır kurbanlar — TeslimAnaClient için.
 *
 * GET /api/kesim/teslim-hazir
 *
 * kesimDurumu in (paketleme, teslime_hazir, tamamlandi) olan kurbanların
 * hisseleri (müşteri + telefon + paket/teslim durumu).
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
      kesimDurumu: { in: ["paketleme", "teslime_hazir", "tamamlandi"] },
    },
    select: {
      id: true,
      kesimSirasi: true,
      hisseGrubu: true,
      kesimDurumu: true,
      toplamKg: true,
      hisseler: {
        where: { silindiMi: false, musteriId: { not: null } },
        select: {
          id: true,
          no: true,
          paketDurumu: true,
          paketKg: true,
          teslimDurumu: true,
          musteri: {
            select: { id: true, adSoyad: true, telefon: true },
          },
        },
        orderBy: { no: "asc" },
      },
    },
    orderBy: [{ operasyonSira: "asc" }, { kesimSirasi: "asc" }],
  });

  return NextResponse.json({ kurbanlar });
}
