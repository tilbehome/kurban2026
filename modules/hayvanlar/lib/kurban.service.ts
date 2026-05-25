/**
 * Kurban (hayvan) + hisseleri için sorgu/özet servisi.
 */

import { prisma } from "@/shared/lib/prisma";
import { topla, yuvarla } from "@/shared/lib/para";

export interface KurbanHissedar {
  hisseNo: number;
  musteriId: string | null;
  adSoyad: string | null;
  telefon: string | null;
}

export interface KurbanOzet {
  id: string;
  kesimSirasi: number;
  kupeNo: string | null;
  kesimSaati: string | null;
  canliAgirlik: number | null;
  hisseSayisi: number;
  bosHisseSayisi: number;
  satisBedeli: number;
  toplamOdenen: number;
  kalan: number;
  durum: string;
  kesimDurumu: string;
  ilerlemeYuzde: number;
  hissedarlar: KurbanHissedar[];
  /** Filtre/arama için düzleştirilmiş büyük harf metin */
  aramaIndeks: string;
}

export async function kurbanlariListele(): Promise<KurbanOzet[]> {
  const kurbanlar = await prisma.kurban.findMany({
    where: { silindiMi: false },
    orderBy: { kesimSirasi: "asc" },
    include: {
      hisseler: {
        where: { silindiMi: false },
        orderBy: { no: "asc" },
        include: {
          musteri: { select: { id: true, adSoyad: true, telefon: true } },
          odemeler: { where: { iptal: false }, select: { toplamTutar: true } },
        },
      },
    },
  });

  return kurbanlar.map((k) => {
    const hisseToplamBedel = yuvarla(
      topla(...k.hisseler.map((h) => h.hisseFiyati)),
    );
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

    const hissedarlar: KurbanHissedar[] = k.hisseler.map((h) => ({
      hisseNo: h.no,
      musteriId: h.musteri?.id ?? null,
      adSoyad: h.musteri?.adSoyad ?? null,
      telefon: h.musteri?.telefon ?? null,
    }));

    const aramaIndeks = [
      `#${k.kesimSirasi}`,
      String(k.kesimSirasi),
      k.kupeNo ?? "",
      ...hissedarlar.map((h) => h.adSoyad ?? ""),
      ...hissedarlar.map((h) => h.telefon ?? ""),
    ]
      .join(" ")
      .toUpperCase();

    return {
      id: k.id,
      kesimSirasi: k.kesimSirasi,
      kupeNo: k.kupeNo,
      kesimSaati: k.kesimSaati,
      canliAgirlik: k.canliAgirlik ?? null,
      hisseSayisi: k.hisseSayisi,
      bosHisseSayisi,
      satisBedeli,
      toplamOdenen,
      kalan,
      durum: k.durum,
      kesimDurumu: k.kesimDurumu,
      ilerlemeYuzde,
      hissedarlar,
      aramaIndeks,
    };
  });
}

export async function kurbanDetayi(id: string) {
  return prisma.kurban.findFirst({
    where: { id, silindiMi: false },
    include: {
      hisseler: {
        where: { silindiMi: false },
        include: {
          musteri: true,
          odemeler: { where: { iptal: false }, select: { toplamTutar: true } },
        },
        orderBy: { no: "asc" },
      },
    },
  });
}
