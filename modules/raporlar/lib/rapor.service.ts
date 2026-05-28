/**
 * Rapor sorguları.
 */

import { prisma } from "@/shared/lib/prisma";
import { formatPara, topla, yuvarla } from "@/shared/lib/para";
import { formatTarih } from "@/shared/lib/tarih";

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

// ===========================================================================
// SPRINT-14 — Master Muhasebe Denetim Defteri
//
// Tüm kurban/hisse/ödeme verisini tek raporda gösterir, 14 otomatik
// tutarsızlık kontrolüyle kırmızı/sarı işaretler.
// ===========================================================================

export interface DenetimUyari {
  /** kritik = kırmızı (gerçek hata); bilgi = sarı (dikkat çekici durum) */
  seviye: "kritik" | "bilgi";
  /** Uyarı kategorisi (Bölüm 3'te gruplama için) */
  kategori: string;
  /** Hangi kurban — 0 ise sistem geneli (örn. dekont tekrarı) */
  kesimSirasi: number;
  /** Hangi hisse — null ise hayvan veya sistem seviyesi */
  hisseNo: number | null;
  mesaj: string;
  beklenen?: string;
  gercek?: string;
}

export interface DefterOdeme {
  dekontNo: string;
  tarih: string;
  nakit: number;
  havale: number;
  kart: number;
  toplamTutar: number;
  iptal: boolean;
  uyarilar: DenetimUyari[];
}

export interface DefterHisse {
  hisseNo: number;
  musteriAdi: string | null;
  telefon: string | null;
  hisseFiyati: number;
  toplamOdenen: number;
  kalan: number;
  vekaletAlindi: boolean;
  odemeler: DefterOdeme[];
  uyarilar: DenetimUyari[];
}

export interface DefterKurban {
  kesimSirasi: number;
  kupeNo: string | null;
  hisseSayisi: number;
  satisBedeli: number;
  toplamOdenen: number;
  kalan: number;
  toplamNakit: number;
  toplamHavale: number;
  toplamKart: number;
  vekaletAlinan: number;
  hisseler: DefterHisse[];
  uyarilar: DenetimUyari[];
}

export interface MuhasebeDefteri {
  kurbanlar: DefterKurban[];
  ozet: {
    kurbanSayisi: number;
    hisseSayisi: number;
    doluHisse: number;
    bosHisse: number;
    toplamBedel: number;
    toplamOdenen: number;
    toplamKalan: number;
    toplamNakit: number;
    toplamHavale: number;
    toplamKart: number;
    vekaletAlinan: number;
    vekaletBekleyen: number;
  };
  tumUyarilar: DenetimUyari[];
  uyariSayisi: { kritik: number; bilgi: number };
}

export async function muhasebeDefteri(): Promise<MuhasebeDefteri> {
  const bugun = new Date();
  bugun.setHours(23, 59, 59, 999);

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
              iptal: true,
            },
          },
        },
      },
    },
  });

  const tumUyarilar: DenetimUyari[] = [];
  // KONTROL 10 — dekont no tekrarı (sadece iptal edilmemiş ödemelerde)
  const dekontGorulen = new Map<string, number>();

  const defterKurbanlar: DefterKurban[] = kurbanlar.map((k) => {
    const hayvanUyarilari: DenetimUyari[] = [];

    const defterHisseler: DefterHisse[] = k.hisseler.map((h) => {
      const hisseUyarilari: DenetimUyari[] = [];
      const gecerliOdemeler = h.odemeler.filter((o) => !o.iptal);
      const toplamOdenen = yuvarla(
        topla(...gecerliOdemeler.map((o) => o.toplamTutar)),
      );
      const kalan = yuvarla(h.hisseFiyati - toplamOdenen);

      // KONTROL 1+2 — Fazla ödeme / negatif kalan
      if (kalan < -1) {
        const u: DenetimUyari = {
          seviye: "kritik",
          kategori: "Fazla Ödeme",
          kesimSirasi: k.kesimSirasi,
          hisseNo: h.no,
          mesaj: `Fazla ödeme: ${formatPara(Math.abs(kalan))} fazla alınmış`,
          beklenen: formatPara(h.hisseFiyati),
          gercek: formatPara(toplamOdenen),
        };
        hisseUyarilari.push(u);
        tumUyarilar.push(u);
      }

      // KONTROL 3 — Boş hisseye ödeme
      if (!h.musteriId && gecerliOdemeler.length > 0) {
        const u: DenetimUyari = {
          seviye: "kritik",
          kategori: "Sahipsiz Hisseye Ödeme",
          kesimSirasi: k.kesimSirasi,
          hisseNo: h.no,
          mesaj: `Hisse boş ama ${formatPara(toplamOdenen)} ödeme var`,
        };
        hisseUyarilari.push(u);
        tumUyarilar.push(u);
      }

      // KONTROL 4 — Fiyatsız hisseye ödeme
      if (h.hisseFiyati === 0 && toplamOdenen > 0) {
        const u: DenetimUyari = {
          seviye: "kritik",
          kategori: "Fiyatsız Hisseye Ödeme",
          kesimSirasi: k.kesimSirasi,
          hisseNo: h.no,
          mesaj: `Hisse fiyatı 0 ama ${formatPara(toplamOdenen)} ödeme var`,
        };
        hisseUyarilari.push(u);
        tumUyarilar.push(u);
      }

      // KONTROL 5 — Boş hissede vekalet
      if (h.vekaletAlindi && !h.musteriId) {
        const u: DenetimUyari = {
          seviye: "kritik",
          kategori: "Boş Hissede Vekalet",
          kesimSirasi: k.kesimSirasi,
          hisseNo: h.no,
          mesaj: `Hisse boş ama vekalet alınmış işaretli`,
        };
        hisseUyarilari.push(u);
        tumUyarilar.push(u);
      }

      // KONTROL 13 — Telefonsuz borçlu (bilgi/sarı)
      if (kalan > 1 && h.musteriId && !h.musteri?.telefon) {
        const u: DenetimUyari = {
          seviye: "bilgi",
          kategori: "Telefonsuz Borçlu",
          kesimSirasi: k.kesimSirasi,
          hisseNo: h.no,
          mesaj: `${h.musteri?.adSoyad ?? "Bilinmeyen"} borçlu ama telefonu yok (${formatPara(kalan)})`,
        };
        hisseUyarilari.push(u);
        tumUyarilar.push(u);
      }

      // KONTROL 14 — İsimsiz hissedar borçlu (bilgi/sarı)
      if (h.musteri?.adSoyad?.toLocaleUpperCase("tr-TR").includes("İSİMSİZ") && kalan > 1) {
        const u: DenetimUyari = {
          seviye: "bilgi",
          kategori: "İsimsiz Hissedar",
          kesimSirasi: k.kesimSirasi,
          hisseNo: h.no,
          mesaj: `Bilinmeyen hissedar, ${formatPara(kalan)} borçlu — gerçek bilgi girilmeli`,
        };
        hisseUyarilari.push(u);
        tumUyarilar.push(u);
      }

      // Ödeme bazlı kontroller
      const defterOdemeler: DefterOdeme[] = h.odemeler.map((o) => {
        const odemeUyarilari: DenetimUyari[] = [];

        // KONTROL 6 — Ödeme kalemleri toplamı yanlış
        const kalemToplam = yuvarla(o.nakit + o.havale + o.kart);
        if (!o.iptal && Math.abs(kalemToplam - o.toplamTutar) > 1) {
          const u: DenetimUyari = {
            seviye: "kritik",
            kategori: "Ödeme Kalemleri Hatalı",
            kesimSirasi: k.kesimSirasi,
            hisseNo: h.no,
            mesaj: `Dekont ${o.dekontNo}: Nakit+Havale+Kart (${formatPara(kalemToplam)}) ≠ Toplam (${formatPara(o.toplamTutar)})`,
          };
          odemeUyarilari.push(u);
          tumUyarilar.push(u);
        }

        // KONTROL 10 — Dekont tekrarı taraması (sadece iptal edilmemişler)
        if (!o.iptal) {
          dekontGorulen.set(
            o.dekontNo,
            (dekontGorulen.get(o.dekontNo) ?? 0) + 1,
          );
        }

        // KONTROL 12 — Gelecek tarihli ödeme
        if (!o.iptal && o.tarih > bugun) {
          const u: DenetimUyari = {
            seviye: "kritik",
            kategori: "Gelecek Tarihli Ödeme",
            kesimSirasi: k.kesimSirasi,
            hisseNo: h.no,
            mesaj: `Dekont ${o.dekontNo}: Ödeme tarihi gelecekte (${formatTarih(o.tarih)})`,
          };
          odemeUyarilari.push(u);
          tumUyarilar.push(u);
        }

        return {
          dekontNo: o.dekontNo,
          tarih: o.tarih.toISOString(),
          nakit: o.nakit,
          havale: o.havale,
          kart: o.kart,
          toplamTutar: o.toplamTutar,
          iptal: o.iptal,
          uyarilar: odemeUyarilari,
        };
      });

      return {
        hisseNo: h.no,
        musteriAdi: h.musteri?.adSoyad ?? null,
        telefon: h.musteri?.telefon ?? null,
        hisseFiyati: yuvarla(h.hisseFiyati),
        toplamOdenen,
        kalan,
        vekaletAlindi: h.vekaletAlindi,
        odemeler: defterOdemeler,
        uyarilar: hisseUyarilari,
      };
    });

    // Hayvan seviyesi hesaplar
    const gecerliOdemelerTum = k.hisseler.flatMap((h) =>
      h.odemeler.filter((o) => !o.iptal),
    );
    const toplamNakit = yuvarla(
      topla(...gecerliOdemelerTum.map((o) => o.nakit)),
    );
    const toplamHavale = yuvarla(
      topla(...gecerliOdemelerTum.map((o) => o.havale)),
    );
    const toplamKart = yuvarla(topla(...gecerliOdemelerTum.map((o) => o.kart)));
    const toplamOdenen = yuvarla(toplamNakit + toplamHavale + toplamKart);
    const kalan = yuvarla(k.satisBedeli - toplamOdenen);
    const vekaletAlinan = k.hisseler.filter((h) => h.vekaletAlindi).length;

    // KONTROL 7 — Hisse fiyatları toplamı ≠ satış bedeli
    const hisseFiyatToplam = yuvarla(
      topla(...k.hisseler.map((h) => h.hisseFiyati)),
    );
    if (Math.abs(hisseFiyatToplam - k.satisBedeli) > 1 && k.satisBedeli > 0) {
      const u: DenetimUyari = {
        seviye: "kritik",
        kategori: "Hisse Toplamı ≠ Bedel",
        kesimSirasi: k.kesimSirasi,
        hisseNo: null,
        mesaj: `Hisse fiyatları toplamı satış bedeline eşit değil`,
        beklenen: formatPara(k.satisBedeli),
        gercek: formatPara(hisseFiyatToplam),
      };
      hayvanUyarilari.push(u);
      tumUyarilar.push(u);
    }

    // KONTROL 8 — Hisse sayısı uyumsuz
    if (k.hisseSayisi !== k.hisseler.length) {
      const u: DenetimUyari = {
        seviye: "kritik",
        kategori: "Hisse Sayısı Yanlış",
        kesimSirasi: k.kesimSirasi,
        hisseNo: null,
        mesaj: `Kayıtlı hisse sayısı (${k.hisseSayisi}) ile gerçek hisse adedi (${k.hisseler.length}) farklı`,
      };
      hayvanUyarilari.push(u);
      tumUyarilar.push(u);
    }

    // KONTROL 9 — Dolu hisse > hisse sayısı
    const doluSayisi = k.hisseler.filter((h) => h.musteriId !== null).length;
    if (doluSayisi > k.hisseSayisi) {
      const u: DenetimUyari = {
        seviye: "kritik",
        kategori: "Dolu Hisse Aşımı",
        kesimSirasi: k.kesimSirasi,
        hisseNo: null,
        mesaj: `Atanan hissedar sayısı (${doluSayisi}) kayıtlı hisse sayısını (${k.hisseSayisi}) aşıyor`,
      };
      hayvanUyarilari.push(u);
      tumUyarilar.push(u);
    }

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
      vekaletAlinan,
      hisseler: defterHisseler,
      uyarilar: hayvanUyarilari,
    };
  });

  // KONTROL 10 — Dekont tekrarı (tüm tarama bitince)
  for (const [dekont, sayi] of dekontGorulen.entries()) {
    if (sayi > 1) {
      tumUyarilar.push({
        seviye: "kritik",
        kategori: "Dekont No Tekrarı",
        kesimSirasi: 0,
        hisseNo: null,
        mesaj: `Dekont ${dekont} ${sayi} kez kullanılmış (benzersiz olmalı)`,
      });
    }
  }

  // Genel özet
  const tumHisseler = defterKurbanlar.flatMap((k) => k.hisseler);
  const ozet = {
    kurbanSayisi: defterKurbanlar.length,
    hisseSayisi: tumHisseler.length,
    doluHisse: tumHisseler.filter((h) => h.musteriAdi).length,
    bosHisse: tumHisseler.filter((h) => !h.musteriAdi).length,
    toplamBedel: yuvarla(topla(...defterKurbanlar.map((k) => k.satisBedeli))),
    toplamOdenen: yuvarla(topla(...defterKurbanlar.map((k) => k.toplamOdenen))),
    toplamKalan: yuvarla(topla(...defterKurbanlar.map((k) => k.kalan))),
    toplamNakit: yuvarla(topla(...defterKurbanlar.map((k) => k.toplamNakit))),
    toplamHavale: yuvarla(
      topla(...defterKurbanlar.map((k) => k.toplamHavale)),
    ),
    toplamKart: yuvarla(topla(...defterKurbanlar.map((k) => k.toplamKart))),
    vekaletAlinan: tumHisseler.filter((h) => h.vekaletAlindi).length,
    vekaletBekleyen: tumHisseler.filter(
      (h) => h.musteriAdi && !h.vekaletAlindi,
    ).length,
  };

  return {
    kurbanlar: defterKurbanlar,
    ozet,
    tumUyarilar,
    uyariSayisi: {
      kritik: tumUyarilar.filter((u) => u.seviye === "kritik").length,
      bilgi: tumUyarilar.filter((u) => u.seviye === "bilgi").length,
    },
  };
}
