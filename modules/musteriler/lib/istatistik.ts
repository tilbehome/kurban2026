/**
 * Müşteri özet istatistikleri.
 * Tek query ile tüm müşterileri çekip hesaplar (240 müşteri için ~50ms).
 */

import { prisma } from "@/shared/lib/prisma";
import { topla, yuvarla } from "@/shared/lib/para";
import { aktifOturum } from "@/shared/lib/session";
import { masterDataMode, tenantActiveSeasonId, tenantMasterDataService, tenantUseCaseContext } from "@/shared/lib/tenant-master-data-adapter";

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
  if (masterDataMode() === "postgres") {
    const oturum = await aktifOturum();
    if (!oturum) return { toplam: 0, odendi: 0, kismi: 0, borclu: 0, hissesiz: 0, toplamBedel: 0, toplamOdenmis: 0, toplamKalan: 0, tahsilatYuzdesi: 0, telefonsuz: 0 };
    const sonuc = await tenantMasterDataService().searchCustomers(tenantUseCaseContext(oturum, { readOnly: true }), { seasonId: tenantActiveSeasonId(), limit: 200 });
    const accounts = sonuc.items.map((m) => ({ phone: m.phone, shareCount: m.shareCount, debit: Number(m.seasonAccount?.debitTotal ?? 0), credit: Number(m.seasonAccount?.creditTotal ?? 0), balance: Number(m.seasonAccount?.balance ?? 0) }));
    const toplamBedel = accounts.reduce((sum, item) => sum + item.debit, 0);
    const toplamOdenmis = accounts.reduce((sum, item) => sum + item.credit, 0);
    return {
      toplam: sonuc.total,
      odendi: accounts.filter((item) => item.debit > 0 && item.balance <= 0).length,
      kismi: accounts.filter((item) => item.balance > 0 && item.credit > 0).length,
      borclu: accounts.filter((item) => item.balance > 0 && item.credit === 0).length,
      hissesiz: accounts.filter((item) => item.shareCount === 0).length,
      toplamBedel,
      toplamOdenmis,
      toplamKalan: accounts.reduce((sum, item) => sum + item.balance, 0),
      tahsilatYuzdesi: toplamBedel > 0 ? Math.round((toplamOdenmis / toplamBedel) * 100) : 0,
      telefonsuz: accounts.filter((item) => !item.phone).length,
    };
  }
  const musteriler = await prisma.musteri.findMany({
    where: { silindiMi: false },
    include: {
      hisseler: {
        where: { silindiMi: false },
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
