/**
 * Müşterinin atanmış hisselerini listele.
 *
 * GET /api/musteriler/[id]/hisseler
 *
 * Hisse Transfer sayfası için: kullanıcı bir müşteri seçtiğinde,
 * o müşterinin sahip olduğu hisseleri görüp birini devretmek için.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const oturum = await aktifOturum();
  if (!oturum || !izinKontrol(oturum, "musteriler.goruntule")) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok" },
      { status: 403 },
    );
  }

  const { id } = await params;

  const hisseler = await prisma.hisse.findMany({
    where: {
      musteriId: id,
      silindiMi: false,
    },
    select: {
      id: true,
      no: true,
      hisseFiyati: true,
      kurban: { select: { kesimSirasi: true, kupeNo: true } },
      odemeler: {
        where: { iptal: false },
        select: { toplamTutar: true },
      },
    },
    orderBy: [{ kurban: { kesimSirasi: "asc" } }, { no: "asc" }],
  });

  const liste = hisseler.map((h) => {
    const odenen = h.odemeler.reduce((s, o) => s + o.toplamTutar, 0);
    return {
      id: h.id,
      no: h.no,
      hisseFiyati: h.hisseFiyati,
      kesimSirasi: h.kurban.kesimSirasi,
      kupeNo: h.kurban.kupeNo,
      odenenTutar: Math.round(odenen * 100) / 100,
      kalan: Math.round((h.hisseFiyati - odenen) * 100) / 100,
    };
  });

  return NextResponse.json({ basarili: true, veri: liste });
}
