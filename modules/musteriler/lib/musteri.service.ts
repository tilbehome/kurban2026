/**
 * Müşteri sorgulamaları ve özet hesaplama.
 * Geriye uyumlu: musterileriListele() eski parametrelerle de çalışır.
 */

import { prisma } from "@/shared/lib/prisma";
import { topla, yuvarla } from "@/shared/lib/para";
import { alfabeHarfi } from "./avatar";

export interface MusteriOzet {
  id: string;
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
  // Soft delete: silinenler hariç (MIMARI §5.3)
  const where: Record<string, unknown> = { silindiMi: false };

  // SPRINT-MUSTERILER-PANEL İŞ 1+2: akıllı arama.
  //   - 1-3 hane saf rakam → kurban sıra no araması (o danadaki hissedarlar)
  //   - Diğer durumda → ad/telefon/tc içinde geçme. SQLite LIKE ASCII'de
  //     büyük/küçük harf duyarsızdır ama Türkçe İ/ı için değildir. O yüzden
  //     orijinal + Türkçe upper + Türkçe lower kombinasyonu (ALİ KÜÇÜK
  //     müşterisi "ali" yazan kullanıcıya da çıksın).
  if (filtreler.arama && filtreler.arama.trim().length >= 1) {
    const q = filtreler.arama.trim();
    const sadeceRakam = /^\d+$/.test(q);

    if (sadeceRakam && q.length <= 3) {
      const kurbanNo = parseInt(q, 10);
      const hisseler = await prisma.hisse.findMany({
        where: {
          silindiMi: false,
          kurban: { kesimSirasi: kurbanNo, silindiMi: false },
          musteriId: { not: null },
        },
        select: { musteriId: true },
      });
      const musteriIds = Array.from(
        new Set(
          hisseler
            .map((h) => h.musteriId)
            .filter((x): x is string => x !== null),
        ),
      );
      if (musteriIds.length > 0) {
        where.id = { in: musteriIds };
      } else {
        // Kurban no var ama o danada hissedar yok → boş sonuç döndür
        where.id = "__bulunamadi__";
      }
    } else {
      const qLower = q.toLocaleLowerCase("tr");
      const qUpper = q.toLocaleUpperCase("tr");
      const varyantlar = Array.from(new Set([q, qLower, qUpper]));
      where.OR = [
        ...varyantlar.map((v) => ({ adSoyad: { contains: v } })),
        { telefon: { contains: q } },
        { tcKimlik: { contains: q } },
      ];
    }
  }

  if (filtreler.harf) {
    where.adSoyad = { startsWith: filtreler.harf };
  }

  // Önce tüm baş harflere bak (alfabe şeridi için, filtreden bağımsız)
  const tumMusteriIsimleri = await prisma.musteri.findMany({
    where: { silindiMi: false },
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

export async function musteriDetayi(id: string) {
  return prisma.musteri.findFirst({
    where: { id, silindiMi: false },
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
    where: { adSoyad: { startsWith: ilkKelime }, silindiMi: false },
  });
}
