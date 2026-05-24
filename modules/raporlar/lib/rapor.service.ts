/**
 * Rapor sorguları.
 */

import { prisma } from "@/shared/lib/prisma";
import { topla, yuvarla } from "@/shared/lib/para";

export interface BorcluSatir {
  musteriId: string;
  adSoyad: string;
  telefon: string | null;
  hisseSayisi: number;
  toplamBedel: number;
  toplamOdenen: number;
  kalan: number;
}

export async function borclular(): Promise<BorcluSatir[]> {
  const musteriler = await prisma.musteri.findMany({
    where: { silindiMi: false },
    include: {
      hisseler: {
        where: { silindiMi: false },
        include: {
          odemeler: { where: { iptal: false }, select: { toplamTutar: true } },
        },
      },
    },
  });

  return musteriler
    .map((m) => {
      const toplamBedel = yuvarla(topla(...m.hisseler.map((h) => h.hisseFiyati)));
      const toplamOdenen = yuvarla(
        topla(
          ...m.hisseler.flatMap((h) => h.odemeler.map((o) => o.toplamTutar)),
        ),
      );
      return {
        musteriId: m.id,
        adSoyad: m.adSoyad,
        telefon: m.telefon,
        hisseSayisi: m.hisseler.length,
        toplamBedel,
        toplamOdenen,
        kalan: yuvarla(toplamBedel - toplamOdenen),
      };
    })
    .filter((m) => m.kalan > 0 && m.hisseSayisi > 0)
    .sort((a, b) => b.kalan - a.kalan);
}

export interface KurbanRaporSatir {
  kurbanId: string;
  kesimSirasi: number;
  hisseSayisi: number;
  dolu: number;
  satisBedeli: number;
  odenen: number;
  kalan: number;
  hissedarlar: { ad: string; kalan: number }[];
}

export async function kurbanRaporu(): Promise<KurbanRaporSatir[]> {
  const kurbanlar = await prisma.kurban.findMany({
    where: { silindiMi: false },
    orderBy: { kesimSirasi: "asc" },
    include: {
      hisseler: {
        where: { silindiMi: false },
        include: {
          musteri: { select: { adSoyad: true } },
          odemeler: { where: { iptal: false }, select: { toplamTutar: true } },
        },
      },
    },
  });

  return kurbanlar.map((k) => {
    const odenen = yuvarla(
      topla(
        ...k.hisseler.flatMap((h) => h.odemeler.map((o) => o.toplamTutar)),
      ),
    );
    return {
      kurbanId: k.id,
      kesimSirasi: k.kesimSirasi,
      hisseSayisi: k.hisseSayisi,
      dolu: k.hisseler.filter((h) => h.musteriId !== null).length,
      satisBedeli: yuvarla(k.satisBedeli),
      odenen,
      kalan: yuvarla(k.satisBedeli - odenen),
      hissedarlar: k.hisseler
        .filter((h) => h.musteri)
        .map((h) => {
          const odenmis = yuvarla(
            topla(...h.odemeler.map((o) => o.toplamTutar)),
          );
          return {
            ad: h.musteri!.adSoyad,
            kalan: yuvarla(h.hisseFiyati - odenmis),
          };
        }),
    };
  });
}
