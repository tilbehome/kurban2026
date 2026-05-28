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
  etiketler: string[];
  // SPRINT-12 — tahsilat odaklı yeni alanlar
  /** Ödenme yüzdesi (0-100, tamsayı) */
  odenmeYuzdesi: number;
  /** Borç durumu kategorisi — sekme filtresi için */
  borcDurumu: "hic-odeme" | "kismi" | "yakin-tamamlanan";
  /** Tahsilat önceliği (0-100, yüksek = öncelikli) */
  oncelikSkoru: number;
  /** Son ödeme tarihi (ISO string), hiç ödeme yoksa null */
  sonOdemeTarihi: string | null;
  /** Son ödemeden bu yana geçen gün; hiç ödeme yoksa 9999 */
  gunlukYaslandirma: number;
  /** Müşterinin hissedarı olduğu kurban listesi — "DANA-1", "DANA-3" */
  kurbanlar: string[];
}

export async function borclular(): Promise<BorcluSatir[]> {
  const musteriler = await prisma.musteri.findMany({
    where: { silindiMi: false },
    include: {
      hisseler: {
        where: { silindiMi: false },
        include: {
          odemeler: {
            where: { iptal: false },
            select: { toplamTutar: true, tarih: true },
          },
          kurban: { select: { kesimSirasi: true } },
        },
      },
    },
  });

  const simdi = Date.now();

  return musteriler
    .map((m) => {
      const toplamBedel = yuvarla(
        topla(...m.hisseler.map((h) => h.hisseFiyati)),
      );
      const toplamOdenen = yuvarla(
        topla(
          ...m.hisseler.flatMap((h) => h.odemeler.map((o) => o.toplamTutar)),
        ),
      );
      const kalan = yuvarla(toplamBedel - toplamOdenen);

      const odenmeYuzdesi =
        toplamBedel > 0 ? Math.round((toplamOdenen / toplamBedel) * 100) : 0;

      // Durum kategorisi
      let borcDurumu: BorcluSatir["borcDurumu"];
      if (odenmeYuzdesi === 0) {
        borcDurumu = "hic-odeme";
      } else if (odenmeYuzdesi >= 90) {
        borcDurumu = "yakin-tamamlanan";
      } else {
        borcDurumu = "kismi";
      }

      // Son ödeme tarihi (tüm hisselerin tüm ödemelerinden max)
      const tumOdemeTarihleri = m.hisseler.flatMap((h) =>
        h.odemeler.map((o) => new Date(o.tarih).getTime()),
      );
      const sonOdemeMs =
        tumOdemeTarihleri.length > 0 ? Math.max(...tumOdemeTarihleri) : null;
      const gunlukYaslandirma =
        sonOdemeMs !== null
          ? Math.floor((simdi - sonOdemeMs) / (1000 * 60 * 60 * 24))
          : 9999;

      // Öncelik skoru (0-100) — sprint planı algoritması
      let oncelikSkoru = 0;
      if (odenmeYuzdesi >= 95) oncelikSkoru += 60;
      else if (odenmeYuzdesi >= 50) oncelikSkoru += 40;
      else if (odenmeYuzdesi >= 20) oncelikSkoru += 25;
      else if (odenmeYuzdesi >= 1) oncelikSkoru += 15;

      if (m.telefon) oncelikSkoru += 20;
      if (gunlukYaslandirma < 30 && sonOdemeMs !== null) oncelikSkoru += 20;
      if (kalan > 50000) oncelikSkoru -= 10;

      oncelikSkoru = Math.max(0, Math.min(100, oncelikSkoru));

      // Kurban listesi (uniq + numerik sıralı)
      const kurbanSet = new Set(
        m.hisseler.map((h) => `DANA-${h.kurban.kesimSirasi}`),
      );
      const kurbanlar = Array.from(kurbanSet).sort((a, b) => {
        const noA = parseInt(a.replace("DANA-", ""), 10);
        const noB = parseInt(b.replace("DANA-", ""), 10);
        return noA - noB;
      });

      return {
        musteriId: m.id,
        adSoyad: m.adSoyad,
        telefon: m.telefon,
        hisseSayisi: m.hisseler.length,
        toplamBedel,
        toplamOdenen,
        kalan,
        etiketler: etiketleriParse(m.etiketler),
        odenmeYuzdesi,
        borcDurumu,
        oncelikSkoru,
        sonOdemeTarihi: sonOdemeMs !== null
          ? new Date(sonOdemeMs).toISOString()
          : null,
        gunlukYaslandirma,
        kurbanlar,
      };
    })
    .filter((m) => m.kalan > 0 && m.hisseSayisi > 0)
    .sort((a, b) => b.kalan - a.kalan);
}

function etiketleriParse(metin: string | null): string[] {
  if (!metin) return [];
  try {
    const j = JSON.parse(metin) as unknown;
    if (Array.isArray(j))
      return j.filter((s): s is string => typeof s === "string");
  } catch {
    return metin
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  return [];
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

// ===========================================================================
// SPRINT-13 — Kesim sırası detaylı muhasebe raporu
// ===========================================================================

export interface KesimMuhasebeOdeme {
  dekontNo: string;
  /** ISO 8601 datetime — client'ta `new Date()` ile parse */
  tarih: string;
  nakit: number;
  havale: number;
  kart: number;
  toplamTutar: number;
  yontem: string;
  iptal: boolean;
}

export interface KesimMuhasebeHisse {
  hisseNo: number;
  musteriAdi: string | null;
  telefon: string | null;
  hisseFiyati: number;
  toplamOdenen: number;
  kalan: number;
  vekaletAlindi: boolean;
  odemeler: KesimMuhasebeOdeme[];
}

export interface KesimMuhasebeKurban {
  kesimSirasi: number;
  kupeNo: string | null;
  hisseSayisi: number;
  satisBedeli: number;
  toplamOdenen: number;
  kalan: number;
  /** Hayvan bazında yöntem toplamları (iptal edilmemiş ödemelerden) */
  toplamNakit: number;
  toplamHavale: number;
  toplamKart: number;
  hisseler: KesimMuhasebeHisse[];
}

/**
 * Kesim sırası bazında detaylı muhasebe raporu.
 *
 * Her kurban için: hisseler + hissedarlar + her ödemenin tarih/dekont/yöntem
 * dökümü. İptal edilen ödemeler de döner (UI'da çizik gösterilir) ama hisse
 * bazlı toplamlara dahil edilmez.
 */
export async function kesimMuhasebeRaporu(): Promise<KesimMuhasebeKurban[]> {
  const kurbanlar = await prisma.kurban.findMany({
    where: { silindiMi: false },
    orderBy: { kesimSirasi: "asc" },
    include: {
      hisseler: {
        where: { silindiMi: false },
        orderBy: { no: "asc" },
        include: {
          musteri: { select: { adSoyad: true, telefon: true } },
          odemeler: {
            orderBy: { tarih: "asc" },
            select: {
              dekontNo: true,
              tarih: true,
              nakit: true,
              havale: true,
              kart: true,
              toplamTutar: true,
              yontem: true,
              iptal: true,
            },
          },
        },
      },
    },
  });

  return kurbanlar.map((k) => {
    const hisseler: KesimMuhasebeHisse[] = k.hisseler.map((h) => {
      const gecerliOdemeler = h.odemeler.filter((o) => !o.iptal);
      const toplamOdenen = yuvarla(
        topla(...gecerliOdemeler.map((o) => o.toplamTutar)),
      );
      const kalan = yuvarla(h.hisseFiyati - toplamOdenen);

      return {
        hisseNo: h.no,
        musteriAdi: h.musteri?.adSoyad ?? null,
        telefon: h.musteri?.telefon ?? null,
        hisseFiyati: yuvarla(h.hisseFiyati),
        toplamOdenen,
        kalan,
        vekaletAlindi: h.vekaletAlindi,
        odemeler: h.odemeler.map((o) => ({
          dekontNo: o.dekontNo,
          tarih: o.tarih.toISOString(),
          nakit: o.nakit,
          havale: o.havale,
          kart: o.kart,
          toplamTutar: o.toplamTutar,
          yontem: o.yontem,
          iptal: o.iptal,
        })),
      };
    });

    // Hayvan seviyesi toplamlar — sadece iptal edilmemiş ödemelerden
    const tumGecerliOdemeler = k.hisseler.flatMap((h) =>
      h.odemeler.filter((o) => !o.iptal),
    );
    const toplamNakit = yuvarla(
      topla(...tumGecerliOdemeler.map((o) => o.nakit)),
    );
    const toplamHavale = yuvarla(
      topla(...tumGecerliOdemeler.map((o) => o.havale)),
    );
    const toplamKart = yuvarla(
      topla(...tumGecerliOdemeler.map((o) => o.kart)),
    );
    const toplamOdenen = yuvarla(toplamNakit + toplamHavale + toplamKart);
    const kalan = yuvarla(k.satisBedeli - toplamOdenen);

    return {
      kesimSirasi: k.kesimSirasi,
      kupeNo: k.kupeNo,
      hisseSayisi: k.hisseSayisi,
      satisBedeli: yuvarla(k.satisBedeli),
      toplamOdenen,
      kalan,
      toplamNakit,
      toplamHavale,
      toplamKart,
      hisseler,
    };
  });
}
