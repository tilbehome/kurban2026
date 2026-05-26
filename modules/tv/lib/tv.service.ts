/**
 * TV servisleri — SPRINT-12 rewrite (kurban bazlı, KVKK uyumlu).
 *
 * Tüm veriler salt-okunur. SSE her 3sn'de bir çağırır.
 * KUTSAL: Hisse/Odeme tablolarına yazma yok, sadece okuma.
 *
 * SPRINT-12 değişiklikleri:
 *   - Hisse bazlı sayım → Kurban bazlı (toplam dana sayısı)
 *   - 6 KPI → 5 KPI (görsel referans)
 *   - 4 sütun yeni grup mapping (asama-grup.ts tvSutunaGrupla)
 *   - Müşteri adı/kısaltma KALDIRILDI (KVKK)
 *   - Sıra numaraları KURBAN no (kesimSirasi), hisse no değil
 */

import { prisma } from "@/shared/lib/prisma";
import { tvSutunaGrupla } from "./asama-grup";
import type {
  IslemKart,
  OperasyonIstatistik,
  SiradakiSatir,
  TeslimKart,
  TvAyariKisa,
  TvKpi,
  TvSutunlar,
  TvTumVeri,
} from "../types";

// =============================================================================
// 1) 5 KPI hesapla — kurban bazlı (1 dana = 1 sayım)
// =============================================================================

export async function getKpiVerileri(): Promise<TvKpi> {
  const kurbanlar = await prisma.kurban.findMany({
    where: { silindiMi: false },
    select: { kesimDurumu: true },
  });

  let siradakiler = 0;
  let kesimdekiler = 0;
  let parcalamada = 0;
  let teslimHazir = 0;
  let tamamlanan = 0;

  for (const k of kurbanlar) {
    const grup = tvSutunaGrupla(k.kesimDurumu);
    switch (grup) {
      case "siradakiler":
        siradakiler++;
        break;
      case "kesimdekiler":
        kesimdekiler++;
        break;
      case "parcalamada":
        parcalamada++;
        break;
      case "teslimeHazir":
        teslimHazir++;
        break;
      default:
        if (k.kesimDurumu === "tamamlandi") tamamlanan++;
        // iptal sayılmaz
    }
  }

  return {
    toplamKurban: kurbanlar.length,
    siradakiler,
    kesimdekiler,
    parcalamada,
    teslimHazir,
    tamamlanan,
  };
}

// =============================================================================
// 2) 4 sütun verileri — KURBAN bazlı (1 satır = 1 dana), KVKK uyumlu
// =============================================================================

export async function getSutunVerileri(): Promise<TvSutunlar> {
  const kurbanlar = await prisma.kurban.findMany({
    where: {
      silindiMi: false,
      kesimDurumu: { notIn: ["tamamlandi", "iptal"] },
    },
    orderBy: [{ operasyonSira: "asc" }, { kesimSirasi: "asc" }],
    select: {
      id: true,
      kesimSirasi: true,
      kesimDurumu: true,
      asama: true,
      ilerlemeYuzde: true,
      kalanSureDk: true,
      asamaBaslangic: true,
    },
  });

  const siradakiler: SiradakiSatir[] = [];
  const kesimdekiler: IslemKart[] = [];
  const parcalamada: IslemKart[] = [];
  const teslimeHazir: TeslimKart[] = [];

  for (const k of kurbanlar) {
    const grup = tvSutunaGrupla(k.kesimDurumu);
    if (!grup) continue;

    if (grup === "siradakiler") {
      siradakiler.push({
        kurbanId: k.id,
        kurbanNo: k.kesimSirasi,
        durumEtiket: siradakiEtiket(k.kesimDurumu),
        durumRengi: siradakiRengi(k.kesimDurumu),
      });
    } else if (grup === "kesimdekiler") {
      kesimdekiler.push({
        kurbanId: k.id,
        kurbanNo: k.kesimSirasi,
        asama: k.asama ?? "Kesim",
        ilerlemeYuzde: k.ilerlemeYuzde,
        asamaBaslangic: k.asamaBaslangic?.toISOString() ?? null,
        baslangicSaati: saatFormat(k.asamaBaslangic),
        kalanSureDk: k.kalanSureDk,
      });
    } else if (grup === "parcalamada") {
      parcalamada.push({
        kurbanId: k.id,
        kurbanNo: k.kesimSirasi,
        asama: k.asama ?? "Parçalama",
        ilerlemeYuzde: k.ilerlemeYuzde,
        asamaBaslangic: k.asamaBaslangic?.toISOString() ?? null,
        baslangicSaati: saatFormat(k.asamaBaslangic),
        kalanSureDk: k.kalanSureDk,
      });
    } else if (grup === "teslimeHazir") {
      teslimeHazir.push({
        kurbanId: k.id,
        kurbanNo: k.kesimSirasi,
        teslimNoktasi: "Teslim Noktası 1",
        hazirBeklemeDk: dakikaFarki(k.asamaBaslangic),
      });
    }
  }

  return { siradakiler, kesimdekiler, parcalamada, teslimeHazir };
}

// =============================================================================
// 3) Operasyon istatistikleri (alt bant için, 5 aşama)
// =============================================================================

export async function getOperasyonIstatistik(): Promise<OperasyonIstatistik> {
  const kurbanlar = await prisma.kurban.findMany({
    where: { silindiMi: false },
    select: { kesimDurumu: true },
  });

  let vekalet = 0;
  let kesim = 0;
  let parcalama = 0;
  let tartim = 0;
  let teslim = 0;

  for (const k of kurbanlar) {
    switch (k.kesimDurumu) {
      case "vekalet_bekliyor":
        vekalet++;
        break;
      case "hazirlik":
      case "kesimde":
      case "deri_yuzme":
        kesim++;
        break;
      case "parcalama":
        parcalama++;
        break;
      case "tartimda":
        tartim++;
        break;
      case "paketleme":
      case "teslime_hazir":
      case "tamamlandi":
        teslim++;
        break;
    }
  }

  return { vekalet, kesim, parcalama, tartim, teslim };
}

// =============================================================================
// 4) TvAyari'dan alt şerit metinleri
// =============================================================================

export async function getTvAyarlari(): Promise<TvAyariKisa> {
  const [tvAyarlar, firmaWa, firmaTel, firmaAdiRow] = await Promise.all([
    prisma.tvAyari.findMany({
      where: { aktif: true },
      select: { anahtarKey: true, deger: true },
    }),
    prisma.ayar.findUnique({ where: { anahtar: "firma_whatsapp" } }),
    prisma.ayar.findUnique({ where: { anahtar: "firma_telefon" } }),
    prisma.ayar.findUnique({ where: { anahtar: "firma_adi" } }),
  ]);

  const map = new Map(tvAyarlar.map((a) => [a.anahtarKey, a.deger]));

  // WhatsApp telefonu: TvAyari > Ayar.firma_whatsapp > Ayar.firma_telefon
  const whatsappTel =
    map.get("whatsapp_tel") ||
    firmaWa?.deger ||
    firmaTel?.deger ||
    "";

  return {
    duyuru:
      map.get("duyuru") ?? "Sıra numaranızı ekrandan takip ediniz.",
    siraHatirlatma:
      map.get("sira_hatirlatma") ??
      "Yoğunluk durumunda listeler yavaşça yukarı kayar.",
    hijyen:
      map.get("hijyen") ??
      "Teslime hazır olan numaralar sağ sütunda gösterilir.",
    whatsappTel,
    lokasyon: map.get("lokasyon") ?? "Merkez Kesim Alanı",
    firmaAdi: firmaAdiRow?.deger ?? "Ada Bereket Hayvancılık",
  };
}

// =============================================================================
// 5) Acil durum + tüm veriler (SSE payload)
// =============================================================================

export async function getAcilDurum(): Promise<{
  aktif: boolean;
  mesaj: string | null;
}> {
  const [k, m] = await Promise.all([
    prisma.tvAyari.findUnique({ where: { anahtarKey: "acil_durum_aktif" } }),
    prisma.tvAyari.findUnique({ where: { anahtarKey: "acil_durum_mesaj" } }),
  ]);
  return {
    aktif: k?.deger === "true",
    mesaj: m?.deger ?? null,
  };
}

export async function getTumVeriler(): Promise<TvTumVeri> {
  const [kpi, sutunlar, operasyonIstatistik, ayarlar, acilDurum] =
    await Promise.all([
      getKpiVerileri(),
      getSutunVerileri(),
      getOperasyonIstatistik(),
      getTvAyarlari(),
      getAcilDurum(),
    ]);

  return {
    kpi,
    sutunlar,
    operasyonIstatistik,
    ayarlar,
    acilDurum,
    serverZamani: new Date().toISOString(),
  };
}

// =============================================================================
// İç yardımcılar
// =============================================================================

function siradakiEtiket(durum: string): string {
  switch (durum) {
    case "beklemede":
      return "Beklemede";
    case "hazirlik":
      return "Hazırlık";
    case "siradaki":
      return "Hazır";
    default:
      return "Beklemede";
  }
}

function siradakiRengi(durum: string): "mavi" | "sari" | "yesil" {
  switch (durum) {
    case "siradaki":
      return "yesil";
    case "hazirlik":
      return "sari";
    case "beklemede":
    default:
      return "mavi";
  }
}

function saatFormat(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function dakikaFarki(d: Date | null | undefined): number {
  if (!d) return 0;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
}
