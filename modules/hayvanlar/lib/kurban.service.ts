/**
 * Kurban (hayvan) + hisseleri için sorgu/özet servisi.
 */

import { prisma } from "@/shared/lib/prisma";
import { topla, yuvarla } from "@/shared/lib/para";

export interface KurbanOzet {
  id: number;
  kesimSirasi: number;
  kupeNo: string | null;
  kesimSaati: string | null;
  hisseSayisi: number;
  bosHisseSayisi: number;
  satisBedeli: number;
  toplamOdenen: number;
  kalan: number;
  durum: string;
  ilerlemeYuzde: number;
}

export async function kurbanlariListele(): Promise<KurbanOzet[]> {
  const kurbanlar = await prisma.kurban.findMany({
    orderBy: { kesimSirasi: "asc" },
    include: {
      hisseler: {
        include: {
          odemeler: { where: { iptal: false }, select: { toplamTutar: true } },
        },
      },
    },
  });

  return kurbanlar.map((k) => {
    const hisseToplamBedel = yuvarla(topla(...k.hisseler.map((h) => h.hisseFiyati)));
    const toplamOdenen = yuvarla(
      topla(
        ...k.hisseler.flatMap((h) => h.odemeler.map((o) => o.toplamTutar)),
      ),
    );
    const satisBedeli = yuvarla(k.satisBedeli || hisseToplamBedel);
    const kalan = yuvarla(satisBedeli - toplamOdenen);
    const bosHisseSayisi = k.hisseler.filter((h) => h.musteriId === null).length;
    const ilerlemeYuzde =
      satisBedeli > 0
        ? Math.min(100, Math.round((toplamOdenen / satisBedeli) * 100))
        : 0;

    return {
      id: k.id,
      kesimSirasi: k.kesimSirasi,
      kupeNo: k.kupeNo,
      kesimSaati: k.kesimSaati,
      hisseSayisi: k.hisseSayisi,
      bosHisseSayisi,
      satisBedeli,
      toplamOdenen,
      kalan,
      durum: k.durum,
      ilerlemeYuzde,
    };
  });
}

export async function kurbanDetayi(id: number) {
  return prisma.kurban.findUnique({
    where: { id },
    include: {
      hisseler: {
        include: {
          musteri: true,
          odemeler: { where: { iptal: false }, select: { toplamTutar: true } },
        },
        orderBy: { no: "asc" },
      },
    },
  });
}
