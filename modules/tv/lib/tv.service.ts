/**
 * TV servisleri — DB sorguları.
 *
 * Tüm veriler salt-okunur (sorgu), SSE her 3sn'de bir çağırır.
 * KUTSAL: mevcut Hisse alanlarını bozmaz; sadece yeni kesim takip alanlarını okur.
 */

import { prisma } from "@/shared/lib/prisma";
import type {
  IslemKart,
  OperasyonIstatistik,
  SiradakiSatir,
  TeslimSatir,
  TvAyariKisa,
  TvKpi,
  TvSutunlar,
  TvTumVeri,
} from "../types";

// =============================================================================
// 1) 6 KPI hesapla
// =============================================================================

export async function getKpiVerileri(): Promise<TvKpi> {
  const hisseler = await prisma.hisse.findMany({
    where: { silindiMi: false, musteriId: { not: null } },
    select: { kesimDurumu: true },
  });

  let kesimde = 0;
  let siradaki = 0;
  let teslimHazir = 0;
  let tamamlanan = 0;
  let bekleyen = 0;

  for (const h of hisseler) {
    switch (h.kesimDurumu) {
      case "kesimde":
      case "parcalama":
      case "tartimda":
        kesimde++;
        break;
      case "siradaki":
      case "vekalet_onay":
        siradaki++;
        break;
      case "teslime_hazir":
        teslimHazir++;
        break;
      case "teslim_edildi":
        tamamlanan++;
        break;
      case "beklemede":
        bekleyen++;
        break;
      // iptal sayılmaz
    }
  }

  return {
    toplamKurban: await prisma.kurban.count({ where: { silindiMi: false } }),
    kesimde,
    siradaki,
    teslimHazir,
    tamamlanan,
    bekleyen,
  };
}

// =============================================================================
// 2) 4 sütun verileri
// =============================================================================

export async function getSutunVerileri(): Promise<TvSutunlar> {
  // Sıradakiler — siradaki + vekalet_onay (kompakt liste, max 8)
  const siradakiHisseler = await prisma.hisse.findMany({
    where: {
      silindiMi: false,
      kesimDurumu: { in: ["siradaki", "vekalet_onay"] },
      siraNo: { not: null },
    },
    orderBy: { siraNo: "asc" },
    take: 8,
    select: {
      id: true,
      siraNo: true,
      kesimDurumu: true,
      musteri: { select: { adSoyad: true } },
      kurban: { select: { asamaBaslangic: true } },
    },
  });

  // Kesimde — büyük kartlar (max 3)
  const kesimHisseler = await prisma.hisse.findMany({
    where: {
      silindiMi: false,
      kesimDurumu: { in: ["kesimde", "parcalama"] },
    },
    orderBy: { kesimBaslama: "asc" },
    take: 3,
    select: {
      id: true,
      siraNo: true,
      asama: true,
      ilerlemeYuzde: true,
      kalanSureDk: true,
      musteri: { select: { adSoyad: true } },
      kurban: { select: { asamaBaslangic: true } },
    },
  });

  // Tartımda — büyük kartlar (max 3)
  const tartimHisseler = await prisma.hisse.findMany({
    where: { silindiMi: false, kesimDurumu: "tartimda" },
    orderBy: { kesimBaslama: "asc" },
    take: 3,
    select: {
      id: true,
      siraNo: true,
      asama: true,
      ilerlemeYuzde: true,
      kalanSureDk: true,
      musteri: { select: { adSoyad: true } },
      kurban: { select: { asamaBaslangic: true } },
    },
  });

  // Teslime Hazır — liste (max 8)
  const teslimHisseler = await prisma.hisse.findMany({
    where: { silindiMi: false, kesimDurumu: "teslime_hazir" },
    orderBy: { kesimBitis: "desc" },
    take: 8,
    select: {
      id: true,
      siraNo: true,
      teslimNoktasi: true,
      teslimDurumu: true,
      musteri: { select: { adSoyad: true } },
      kurban: { select: { asamaBaslangic: true } },
    },
  });

  const isoOrNull = (d: Date | null | undefined) =>
    d ? d.toISOString() : null;

  const siradakiler: SiradakiSatir[] = siradakiHisseler.map((h) => ({
    hisseId: h.id,
    siraNo: h.siraNo ?? 0,
    durumEtiket:
      h.kesimDurumu === "vekalet_onay"
        ? "Vekalet Bekliyor"
        : "Kesime Hazır",
    musteriKisaltma: kisaltMusteri(h.musteri?.adSoyad ?? null),
    asamaBaslangic: isoOrNull(h.kurban.asamaBaslangic),
  }));

  const kesimde: IslemKart[] = kesimHisseler.map((h) => ({
    hisseId: h.id,
    siraNo: h.siraNo ?? 0,
    asama: h.asama ?? "Kesim",
    ilerlemeYuzde: h.ilerlemeYuzde,
    kalanSureDk: h.kalanSureDk,
    musteriKisaltma: kisaltMusteri(h.musteri?.adSoyad ?? null),
    asamaBaslangic: isoOrNull(h.kurban.asamaBaslangic),
  }));

  const tartimda: IslemKart[] = tartimHisseler.map((h) => ({
    hisseId: h.id,
    siraNo: h.siraNo ?? 0,
    asama: h.asama ?? "Tartım",
    ilerlemeYuzde: h.ilerlemeYuzde,
    kalanSureDk: h.kalanSureDk,
    musteriKisaltma: kisaltMusteri(h.musteri?.adSoyad ?? null),
    asamaBaslangic: isoOrNull(h.kurban.asamaBaslangic),
  }));

  const teslimeHazir: TeslimSatir[] = teslimHisseler.map((h, i) => ({
    hisseId: h.id,
    teslimNo: h.siraNo ?? i + 1,
    teslimNoktasi: h.teslimNoktasi ?? "Teslim Noktası 1",
    durum: h.teslimDurumu ?? "Hazır",
    musteriKisaltma: kisaltMusteri(h.musteri?.adSoyad ?? null),
    asamaBaslangic: isoOrNull(h.kurban.asamaBaslangic),
  }));

  return { siradakiler, kesimde, tartimda, teslimeHazir };
}

// =============================================================================
// 3) Operasyon istatistikleri (5 aşama)
// =============================================================================

export async function getOperasyonIstatistik(): Promise<OperasyonIstatistik> {
  const hisseler = await prisma.hisse.findMany({
    where: { silindiMi: false, musteriId: { not: null } },
    select: { kesimDurumu: true },
  });

  let vekalet = 0;
  let kesim = 0;
  let parcalama = 0;
  let tartim = 0;
  let teslim = 0;

  for (const h of hisseler) {
    switch (h.kesimDurumu) {
      case "vekalet_onay":
      case "siradaki":
        vekalet++;
        break;
      case "kesimde":
        kesim++;
        break;
      case "parcalama":
        parcalama++;
        break;
      case "tartimda":
        tartim++;
        break;
      case "teslime_hazir":
      case "teslim_edildi":
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
  const ayarlar = await prisma.tvAyari.findMany({
    where: { aktif: true },
    select: { anahtarKey: true, deger: true },
  });
  const map = new Map(ayarlar.map((a) => [a.anahtarKey, a.deger]));
  return {
    duyuru:
      map.get("duyuru") ?? "Kesim alanında anonsları takip ediniz.",
    siraHatirlatma:
      map.get("sira_hatirlatma") ??
      "Sıranız geldiğinde ekranda bilgilendirileceksiniz.",
    hijyen:
      map.get("hijyen") ??
      "Hijyen kurallarına uyalım, sağlığımızı koruyalım.",
    whatsappTel: map.get("whatsapp_tel") ?? "",
    lokasyon: map.get("lokasyon") ?? "Merkez Kesim Alanı",
  };
}

// =============================================================================
// 5) Tek seferde tüm veriler (SSE payload)
// =============================================================================

/** Acil durum mesajı + durumu (TV ekranında MOLA gösterimi) */
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

/**
 * Public display güvenliği — müşteri tam adı yerine kısaltma.
 * Örn. "Mehmet Yılmaz" → "M. Yılmaz"
 *      "Ali" → "Ali"
 *      null → "—"
 */
function kisaltMusteri(adSoyad: string | null): string {
  if (!adSoyad) return "—";
  const parts = adSoyad
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0];
  // İlk ad: ilk harf, soyad: tam
  return `${parts[0][0]}. ${parts[parts.length - 1]}`;
}
