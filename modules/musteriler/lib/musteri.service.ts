/**
 * Müşteri sorgulamaları ve özet hesaplama.
 * Geriye uyumlu: musterileriListele() eski parametrelerle de çalışır.
 */

import { prisma } from "@/shared/lib/prisma";
import { topla, yuvarla } from "@/shared/lib/para";
import { alfabeHarfi } from "./avatar";

export interface MusteriOzet {
  id: number;
  adSoyad: string;
  telefon: string | null;
  hisseSayisi: number;
  toplamBedel: number;
  toplamOdenen: number;
  kalan: number;
  durum: "odendi" | "kismi" | "odenmedi" | "yok";
  kayitTarihi: Date;
  ilkKurbanNo: number | null;
  ilkHisseNo: number | null;
}

export interface ListeFiltreleri {
  arama?: string;
  durum?: "hepsi" | "borclu" | "odendi" | "kismi";
  /** Belirli harfle başlayan müşteriler (örn. "A", "Ç") */
  harf?: string;
  limit?: number;
  offset?: number;
}

export interface ListeSonucu {
  liste: MusteriOzet[];
  toplam: number;
  /** Veritabanındaki tüm müşterilerin baş harfleri (alfabe şeridi için) */
  doluHarfler: Set<string>;
}

export async function musterileriListele(
  filtreler: ListeFiltreleri = {},
): Promise<ListeSonucu> {
  const where: Record<string, unknown> = {};

  if (filtreler.arama && filtreler.arama.trim().length >= 2) {
    const q = filtreler.arama.trim();
    where.OR = [
      { adSoyad: { contains: q } },
      { telefon: { contains: q } },
      { tcKimlik: { contains: q } },
    ];
  }

  if (filtreler.harf) {
    where.adSoyad = { startsWith: filtreler.harf };
  }

  // Önce tüm baş harflere bak (alfabe şeridi için, filtreden bağımsız)
  const tumMusteriIsimleri = await prisma.musteri.findMany({
    select: { adSoyad: true },
  });
  const doluHarfler = new Set<string>();
  for (const m of tumMusteriIsimleri) {
    doluHarfler.add(alfabeHarfi(m.adSoyad));
  }

  const [musteriler, toplam] = await Promise.all([
    prisma.musteri.findMany({
      where,
      orderBy: { adSoyad: "asc" },
      take: filtreler.limit ?? 200,
      skip: filtreler.offset ?? 0,
      include: {
        hisseler: {
          include: {
            kurban: { select: { kesimSirasi: true } },
            odemeler: { where: { iptal: false } },
          },
          orderBy: [{ kurban: { kesimSirasi: "asc" } }, { no: "asc" }],
        },
      },
    }),
    prisma.musteri.count({ where }),
  ]);

  const liste: MusteriOzet[] = musteriler.map((m) => {
    const ozet = musteriOzetiBul(m.hisseler);
    const ilkHisse = m.hisseler[0];
    return {
      id: m.id,
      adSoyad: m.adSoyad,
      telefon: m.telefon,
      kayitTarihi: m.createdAt,
      ilkKurbanNo: ilkHisse?.kurban.kesimSirasi ?? null,
      ilkHisseNo: ilkHisse?.no ?? null,
      ...ozet,
    };
  });

  const filtreli =
    filtreler.durum && filtreler.durum !== "hepsi"
      ? liste.filter((l) => {
          if (filtreler.durum === "borclu") return l.kalan > 0 && l.toplamOdenen === 0;
          if (filtreler.durum === "kismi")
            return l.kalan > 0 && l.toplamOdenen > 0;
          if (filtreler.durum === "odendi")
            return l.kalan <= 0 && l.hisseSayisi > 0;
          return true;
        })
      : liste;

  return { liste: filtreli, toplam, doluHarfler };
}

interface HisseIle {
  hisseFiyati: number;
  odemeler: { toplamTutar: number }[];
}

function musteriOzetiBul(hisseler: HisseIle[]): {
  hisseSayisi: number;
  toplamBedel: number;
  toplamOdenen: number;
  kalan: number;
  durum: MusteriOzet["durum"];
} {
  const hisseSayisi = hisseler.length;
  const toplamBedel = yuvarla(topla(...hisseler.map((h) => h.hisseFiyati)));
  const toplamOdenen = yuvarla(
    topla(...hisseler.flatMap((h) => h.odemeler.map((o) => o.toplamTutar))),
  );
  const kalan = yuvarla(toplamBedel - toplamOdenen);

  let durum: MusteriOzet["durum"];
  if (hisseSayisi === 0) durum = "yok";
  else if (kalan <= 0) durum = "odendi";
  else if (toplamOdenen > 0) durum = "kismi";
  else durum = "odenmedi";

  return { hisseSayisi, toplamBedel, toplamOdenen, kalan, durum };
}

export async function musteriDetayi(id: number) {
  return prisma.musteri.findUnique({
    where: { id },
    include: {
      hisseler: {
        include: {
          kurban: true,
          odemeler: { where: { iptal: false }, orderBy: { tarih: "desc" } },
        },
        orderBy: [{ kurban: { kesimSirasi: "asc" } }, { no: "asc" }],
      },
    },
  });
}

/** İsmi verilen müşterinin ilk kelimesiyle aynı başlayan diğer müşterilerin sayısı */
export async function ayniIsimSayisi(adSoyad: string): Promise<number> {
  const ilkKelime = adSoyad.trim().split(/\s+/)[0];
  if (!ilkKelime || ilkKelime.length < 3) return 0;
  return prisma.musteri.count({
    where: { adSoyad: { startsWith: ilkKelime } },
  });
}
