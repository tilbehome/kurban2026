/**
 * Müşteri sorgulamaları ve özet hesaplama.
 */

import { prisma } from "@/shared/lib/prisma";
import { topla, yuvarla } from "@/shared/lib/para";

export interface MusteriOzet {
  id: number;
  adSoyad: string;
  telefon: string | null;
  hisseSayisi: number;
  toplamBedel: number;
  toplamOdenen: number;
  kalan: number;
  durum: "odendi" | "kismi" | "odenmedi" | "yok";
}

interface ListeFiltreleri {
  arama?: string;
  durum?: "hepsi" | "borclu" | "odendi";
  limit?: number;
  offset?: number;
}

export async function musterileriListele(filtreler: ListeFiltreleri = {}): Promise<{
  liste: MusteriOzet[];
  toplam: number;
}> {
  const where: Record<string, unknown> = {};

  if (filtreler.arama && filtreler.arama.trim().length >= 2) {
    const q = filtreler.arama.trim();
    where.OR = [
      { adSoyad: { contains: q } },
      { telefon: { contains: q } },
      { tcKimlik: { contains: q } },
    ];
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
            odemeler: { where: { iptal: false } },
          },
        },
      },
    }),
    prisma.musteri.count({ where }),
  ]);

  const liste: MusteriOzet[] = musteriler.map((m) => {
    const ozetiHesapla = musteriOzetiBul(m.hisseler);
    return {
      id: m.id,
      adSoyad: m.adSoyad,
      telefon: m.telefon,
      ...ozetiHesapla,
    };
  });

  const filtreli = filtreler.durum
    ? liste.filter((l) => {
        if (filtreler.durum === "borclu") return l.kalan > 0;
        if (filtreler.durum === "odendi")
          return l.kalan <= 0 && l.hisseSayisi > 0;
        return true;
      })
    : liste;

  return { liste: filtreli, toplam };
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
