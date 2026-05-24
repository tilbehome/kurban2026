/**
 * Kasa raporları.
 */

import { prisma } from "@/shared/lib/prisma";
import { topla, yuvarla } from "@/shared/lib/para";

export interface GunlukKasaRapor {
  tarih: Date;
  toplam: number;
  nakit: number;
  havale: number;
  kart: number;
  islemSayisi: number;
  iptalSayisi: number;
  iptalTutar: number;
  hareketler: KasaHareketSatiri[];
}

export interface KasaHareketSatiri {
  id: string;
  saat: string;
  dekontNo: string | null;
  musteri: string;
  yontem: string;
  tutar: number;
  iptal: boolean;
}

export async function gunlukRapor(tarih: Date = new Date()): Promise<GunlukKasaRapor> {
  const baslangic = new Date(tarih);
  baslangic.setHours(0, 0, 0, 0);
  const bitis = new Date(tarih);
  bitis.setHours(23, 59, 59, 999);

  const odemeler = await prisma.odeme.findMany({
    where: { tarih: { gte: baslangic, lte: bitis } },
    orderBy: { tarih: "desc" },
    include: {
      hisse: {
        select: {
          no: true,
          kurban: { select: { kesimSirasi: true } },
          musteri: { select: { adSoyad: true } },
        },
      },
    },
  });

  const aktif = odemeler.filter((o) => !o.iptal);
  const iptaller = odemeler.filter((o) => o.iptal);

  return {
    tarih: baslangic,
    toplam: yuvarla(topla(...aktif.map((o) => o.toplamTutar))),
    nakit: yuvarla(topla(...aktif.map((o) => o.nakit))),
    havale: yuvarla(topla(...aktif.map((o) => o.havale))),
    kart: yuvarla(topla(...aktif.map((o) => o.kart))),
    islemSayisi: aktif.length,
    iptalSayisi: iptaller.length,
    iptalTutar: yuvarla(topla(...iptaller.map((o) => o.toplamTutar))),
    hareketler: odemeler.map((o) => ({
      id: o.id,
      saat: o.tarih.toISOString().slice(11, 16),
      dekontNo: o.dekontNo,
      musteri: o.hisse.musteri?.adSoyad ?? "—",
      yontem: o.yontem,
      tutar: o.toplamTutar,
      iptal: o.iptal,
    })),
  };
}
