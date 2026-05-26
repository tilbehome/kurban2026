/**
 * TV Kesim Takip Ekranı — FAZ 9 + SPRINT-12 (görsel referanslı rewrite).
 *
 * Server'dan client'a serialize edilebilir saf veri tipleri (LucideIcon yok).
 */

// =============================================================================
// Kesim durumu — Kurban.kesimDurumu string union (schema ile aligned)
// =============================================================================

export type KesimDurumu =
  | "beklemede"
  | "vekalet_bekliyor"
  | "siradaki"
  | "hazirlik"
  | "kesimde"
  | "deri_yuzme"
  | "parcalama"
  | "tartimda"
  | "paketleme"
  | "teslime_hazir"
  | "tamamlandi"
  | "iptal";

/** Geçerli aşama metinleri (Kurban.asama / Hisse.asama) */
export type Asama =
  | "Kesim"
  | "Deri Yüzme"
  | "Parçalama Hazırlık"
  | "Parçalama"
  | "Tartım"
  | "Paketleme"
  | "Teslim";

/** 4 ana TV sütunu */
export type TvSutunGrup =
  | "siradakiler"
  | "kesimdekiler"
  | "parcalamada"
  | "teslimeHazir";

// =============================================================================
// KPI şeridi (5 kart)
// =============================================================================

export interface TvKpi {
  /** Tüm kurban sayısı (silindiMi=false) — başlıkta veya rezerv olarak */
  toplamKurban: number;
  /** beklemede + hazirlik + siradaki */
  siradakiler: number;
  /** vekalet_bekliyor + kesimde + deri_yuzme */
  kesimdekiler: number;
  /** parcalama + tartimda */
  parcalamada: number;
  /** paketleme + teslime_hazir */
  teslimHazir: number;
  /** tamamlandi */
  tamamlanan: number;
}

// =============================================================================
// 4 ana sütun — KVKK uyumlu (müşteri adı YOK)
// =============================================================================

/** Sıradakiler sütununda tek satır (kompakt liste) */
export interface SiradakiSatir {
  kurbanId: string;
  /** Kurban kesim sırası (DANA-NN) — hisse no değil */
  kurbanNo: number;
  /** "Beklemede" | "Hazırlık" | "Hazır" */
  durumEtiket: string;
  /** Renkli nokta indikatörü */
  durumRengi: "mavi" | "sari" | "yesil";
}

/** Kesimdekiler / Parçalamada — büyük renkli kart */
export interface IslemKart {
  kurbanId: string;
  kurbanNo: number;
  asama: string;
  /** 0-100 */
  ilerlemeYuzde: number;
  /** ISO datetime — aşamaya geçilen an (canlı sayaç için) */
  asamaBaslangic: string | null;
  /** "09:30" formatında — UI'da hızlı göstermek için */
  baslangicSaati: string | null;
  /** Tahmini kalan süre dakika */
  kalanSureDk: number | null;
}

/** Teslime hazır — yeşil kart */
export interface TeslimKart {
  kurbanId: string;
  kurbanNo: number;
  teslimNoktasi: string;
  /** Teslime hazır olalı kaç dakika geçti */
  hazirBeklemeDk: number;
}

export interface TvSutunlar {
  siradakiler: SiradakiSatir[];
  kesimdekiler: IslemKart[];
  parcalamada: IslemKart[];
  teslimeHazir: TeslimKart[];
}

// =============================================================================
// Operasyon akışı (5 aşama — alt bant için)
// =============================================================================

export interface OperasyonIstatistik {
  vekalet: number;
  kesim: number;
  parcalama: number;
  tartim: number;
  teslim: number;
}

// =============================================================================
// Alt bilgi şeridi (TvAyari)
// =============================================================================

export interface TvAyariKisa {
  duyuru: string;
  siraHatirlatma: string;
  hijyen: string;
  whatsappTel: string;
  lokasyon: string;
  /** Üst barda gösterilen firma adı (Ayar.firma_adi) */
  firmaAdi: string;
}

// =============================================================================
// SSE payload — tüm veriler tek pakette
// =============================================================================

export interface TvAcilDurum {
  aktif: boolean;
  mesaj: string | null;
}

export interface TvTumVeri {
  kpi: TvKpi;
  sutunlar: TvSutunlar;
  operasyonIstatistik: OperasyonIstatistik;
  ayarlar: TvAyariKisa;
  acilDurum: TvAcilDurum;
  /** Server-side timestamp (canlı saat senkronu) */
  serverZamani: string; // ISO
}

// =============================================================================
// KPI renk tokenları — tasarım referansından
// =============================================================================

export const KPI_RENKLERI = {
  siradakiler: {
    bg: "bg-blue-500",
    text: "text-blue-700",
    light: "bg-blue-50",
  },
  kesimdekiler: {
    bg: "bg-orange-500",
    text: "text-orange-700",
    light: "bg-orange-50",
  },
  parcalamada: {
    bg: "bg-purple-500",
    text: "text-purple-700",
    light: "bg-purple-50",
  },
  teslimHazir: {
    bg: "bg-green-500",
    text: "text-green-700",
    light: "bg-green-50",
  },
  tamamlanan: {
    bg: "bg-cyan-500",
    text: "text-cyan-700",
    light: "bg-cyan-50",
  },
} as const;

/** Geçerli durum→aşama eşlemesi (default aşama) */
export const DURUM_VARSAYILAN_ASAMA: Record<KesimDurumu, string | null> = {
  beklemede: null,
  vekalet_bekliyor: null,
  siradaki: null,
  hazirlik: "Hazırlık",
  kesimde: "Kesim",
  deri_yuzme: "Deri Yüzme",
  parcalama: "Parçalama",
  tartimda: "Tartım",
  paketleme: "Paketleme",
  teslime_hazir: "Teslim",
  tamamlandi: null,
  iptal: null,
};

/** Tema türü */
export type TvTema = "light" | "dark";
