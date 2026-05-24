/**
 * Tahsilat servisi — ödeme, kasa, dekont numarası vb.
 */

import { prisma } from "@/shared/lib/prisma";
import { topla, yuvarla } from "@/shared/lib/para";
import { ayarOku } from "@/modules/_core/ayarlar/ayar.service";

export interface BugunkuOzet {
  toplam: number;
  nakit: number;
  havale: number;
  kart: number;
  islemSayisi: number;
  ortalama: number;
  enBuyuk: { tutar: number; musteri: string } | null;
}

export interface BugunkuTahsilatSatiri {
  id: string;
  dekontNo: string;
  saat: string;
  musteriAdi: string;
  kurban: string;
  toplam: number;
  yontem: string;
  iptal: boolean;
}

export async function bugunkuOzet(): Promise<BugunkuOzet> {
  const baslangic = gunBaslangici();
  const bitis = gunSonu();

  const odemeler = await prisma.odeme.findMany({
    where: {
      tarih: { gte: baslangic, lte: bitis },
      iptal: false,
    },
    select: {
      toplamTutar: true,
      nakit: true,
      havale: true,
      kart: true,
      hisse: { select: { musteri: { select: { adSoyad: true } } } },
    },
  });

  const toplam = yuvarla(topla(...odemeler.map((o) => o.toplamTutar)));
  const nakit = yuvarla(topla(...odemeler.map((o) => o.nakit)));
  const havale = yuvarla(topla(...odemeler.map((o) => o.havale)));
  const kart = yuvarla(topla(...odemeler.map((o) => o.kart)));
  const islemSayisi = odemeler.length;
  const ortalama = islemSayisi > 0 ? yuvarla(toplam / islemSayisi) : 0;
  const enBuyukOdeme = odemeler.reduce<
    (typeof odemeler)[number] | null
  >((a, b) => (a && a.toplamTutar > b.toplamTutar ? a : b), null);

  return {
    toplam,
    nakit,
    havale,
    kart,
    islemSayisi,
    ortalama,
    enBuyuk: enBuyukOdeme
      ? {
          tutar: enBuyukOdeme.toplamTutar,
          musteri: enBuyukOdeme.hisse.musteri?.adSoyad ?? "—",
        }
      : null,
  };
}

export async function bugunkuTahsilatlar(): Promise<BugunkuTahsilatSatiri[]> {
  const baslangic = gunBaslangici();
  const bitis = gunSonu();

  const odemeler = await prisma.odeme.findMany({
    where: { tarih: { gte: baslangic, lte: bitis } },
    orderBy: { tarih: "desc" },
    take: 50,
    include: {
      hisse: {
        include: {
          musteri: true,
          kurban: { select: { kesimSirasi: true } },
        },
      },
    },
  });

  return odemeler.map((o) => ({
    id: o.id,
    dekontNo: o.dekontNo,
    saat: o.tarih.toISOString().slice(11, 16),
    musteriAdi: o.hisse.musteri?.adSoyad ?? "—",
    kurban: `#${o.hisse.kurban.kesimSirasi}.${o.hisse.no}`,
    toplam: o.toplamTutar,
    yontem: o.yontem,
    iptal: o.iptal,
  }));
}

export interface MusteriTahsilatVerisi {
  musteri: {
    id: string;
    adSoyad: string;
    telefon: string | null;
  };
  hisseler: {
    id: string;
    no: number;
    kurbanKesimSirasi: number;
    hisseFiyati: number;
    odenmis: number;
    kalan: number;
  }[];
  toplamBedel: number;
  toplamOdenen: number;
  kalanBakiye: number;
  oncekiOdemeler: {
    id: string;
    dekontNo: string;
    tarih: Date;
    toplam: number;
    yontem: string;
    hisseEtiket: string;
  }[];
}

export async function musteriTahsilatVerisi(
  musteriId: string,
): Promise<MusteriTahsilatVerisi | null> {
  const musteri = await prisma.musteri.findFirst({
    where: { id: musteriId, silindiMi: false },
    include: {
      hisseler: {
        orderBy: [{ kurban: { kesimSirasi: "asc" } }, { no: "asc" }],
        include: {
          kurban: { select: { kesimSirasi: true } },
          odemeler: {
            where: { iptal: false },
            orderBy: { tarih: "desc" },
          },
        },
      },
    },
  });

  if (!musteri) return null;

  const hisseler = musteri.hisseler.map((h) => {
    const odenmis = yuvarla(topla(...h.odemeler.map((o) => o.toplamTutar)));
    return {
      id: h.id,
      no: h.no,
      kurbanKesimSirasi: h.kurban.kesimSirasi,
      hisseFiyati: yuvarla(h.hisseFiyati),
      odenmis,
      kalan: yuvarla(h.hisseFiyati - odenmis),
    };
  });

  const toplamBedel = yuvarla(topla(...hisseler.map((h) => h.hisseFiyati)));
  const toplamOdenen = yuvarla(topla(...hisseler.map((h) => h.odenmis)));
  const kalanBakiye = yuvarla(toplamBedel - toplamOdenen);

  const oncekiOdemeler = musteri.hisseler
    .flatMap((h) =>
      h.odemeler.map((o) => ({
        id: o.id,
        dekontNo: o.dekontNo,
        tarih: o.tarih,
        toplam: o.toplamTutar,
        yontem: o.yontem,
        hisseEtiket: `#${h.kurban.kesimSirasi}.${h.no}`,
      })),
    )
    .sort((a, b) => b.tarih.getTime() - a.tarih.getTime());

  return {
    musteri: {
      id: musteri.id,
      adSoyad: musteri.adSoyad,
      telefon: musteri.telefon,
    },
    hisseler,
    toplamBedel,
    toplamOdenen,
    kalanBakiye,
    oncekiOdemeler,
  };
}

function gunBaslangici(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function gunSonu(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Sıradaki dekont no'yu üretir (atomik).
 * Format: TKR-2026-NNNNNN
 */
export async function sonrakiDekontNo(): Promise<string> {
  const prefix = await ayarOku("dekont_prefix", "TKR-2026-");
  const son = await prisma.odeme.findFirst({
    where: { dekontNo: { startsWith: prefix } },
    orderBy: { id: "desc" },
    select: { dekontNo: true },
  });

  let sira = 1;
  if (son?.dekontNo) {
    const m = son.dekontNo.slice(prefix.length).match(/^(\d+)$/);
    if (m) sira = parseInt(m[1]!, 10) + 1;
  }

  return prefix + String(sira).padStart(6, "0");
}
