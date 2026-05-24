/**
 * Müşteri özet istatistikleri.
 * Tek query ile tüm müşterileri çekip hesaplar (240 müşteri için ~50ms).
 */

import { prisma } from "@/shared/lib/prisma";
import { topla, yuvarla } from "@/shared/lib/para";

export interface MusteriIstatistik {
  toplam: number;
  odendi: number;
  kismi: number;
  borclu: number;
  hissesiz: number;
  toplamBedel: number;
  toplamOdenmis: number;
  toplamKalan: number;
  tahsilatYuzdesi: number;
  telefonsuz: number;
}

export async function musteriIstatistik(): Promise<MusteriIstatistik> {
  const musteriler = await prisma.musteri.findMany({
    include: {
      hisseler: {
        select: {
          hisseFiyati: true,
          odemeler: { where: { iptal: false }, select: { toplamTutar: true } },
        },
      },
    },
  });

  let toplam = 0;
  let odendi = 0;
  let kismi = 0;
  let borclu = 0;
  let hissesiz = 0;
  let toplamBedel = 0;
  let toplamOdenmis = 0;
  let telefonsuz = 0;

  for (const m of musteriler) {
    toplam += 1;
    if (!m.telefon) telefonsuz += 1;

    const mBedel = topla(...m.hisseler.map((h) => h.hisseFiyati));
    const mOdenen = topla(
      ...m.hisseler.flatMap((h) => h.odemeler.map((o) => o.toplamTutar)),
    );

    toplamBedel += mBedel;
    toplamOdenmis += mOdenen;

    if (m.hisseler.length === 0) hissesiz += 1;
    else if (mBedel - mOdenen <= 0) odendi += 1;
    else if (mOdenen > 0) kismi += 1;
    else borclu += 1;
  }

  const yBedel = yuvarla(toplamBedel);
  const yOdenmis = yuvarla(toplamOdenmis);
  const tahsilatYuzdesi = yBedel > 0 ? Math.round((yOdenmis / yBedel) * 100) : 0;

  return {
    toplam,
    odendi,
    kismi,
    borclu,
    hissesiz,
    toplamBedel: yBedel,
    toplamOdenmis: yOdenmis,
    toplamKalan: yuvarla(yBedel - yOdenmis),
    tahsilatYuzdesi,
    telefonsuz,
  };
}
