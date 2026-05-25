/**
 * TV Kesim Takip Ekranı — FAZ 9
 *
 * Server'dan client'a serialize edilebilir saf veri tipleri (LucideIcon yok).
 */

// =============================================================================
// Kesim durumu — Hisse.kesimDurumu string union
// =============================================================================

export type KesimDurumu =
  | "beklemede"
  | "vekalet_onay"
  | "siradaki"
  | "kesimde"
  | "parcalama"
  | "tartimda"
  | "teslime_hazir"
  | "teslim_edildi"
  | "iptal";

/** Geçerli aşama metinleri (Hisse.asama) */
export type Asama =
  | "Kesim"
  | "Deri Yüzme"
  | "Parçalama Hazırlık"
  | "Parçalama"
  | "Tartım"
  | "Paketleme"
  | "Teslim";

// =============================================================================
// KPI şeridi (6 kart)
// =============================================================================

export interface TvKpi {
  toplamKurban: number;
  kesimde: number;
  siradaki: number;
  teslimHazir: number;
  tamamlanan: number;
  bekleyen: number;
}

// =============================================================================
// 4 ana sütun
// =============================================================================

/** Sıradaki müşteri/hisse kompakt görünüm */
export interface SiradakiSatir {
  hisseId: string;
  siraNo: number;
  /** "Kesime Hazır" | "Parçalama Bekliyor" gibi durum */
  durumEtiket: string;
  /** Müşteri başharfleri (PII korunması) — örn. "M.Y." */
  musteriKisaltma: string;
}

/** Kesimde / Tartımda büyük kart */
export interface IslemKart {
  hisseId: string;
  siraNo: number;
  asama: string; // "Kesim" | "Deri Yüzme" vs.
  ilerlemeYuzde: number; // 0-100
  kalanSureDk: number | null;
  musteriKisaltma: string;
}

/** Teslime hazır satır */
export interface TeslimSatir {
  hisseId: string;
  teslimNo: number; // = siraNo
  teslimNoktasi: string;
  durum: string; // "Hazır" | "Teslim Edildi"
  musteriKisaltma: string;
}

export interface TvSutunlar {
  siradakiler: SiradakiSatir[];
  kesimde: IslemKart[];
  tartimda: IslemKart[];
  teslimeHazir: TeslimSatir[];
}

// =============================================================================
// Operasyon akışı (5 aşama)
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
  toplamKurban: { bg: "bg-blue-100", text: "text-blue-700", icon: "bg-blue-500" },
  kesimde: { bg: "bg-orange-100", text: "text-orange-700", icon: "bg-orange-500" },
  siradaki: { bg: "bg-purple-100", text: "text-purple-700", icon: "bg-purple-500" },
  teslimHazir: { bg: "bg-green-100", text: "text-green-700", icon: "bg-green-500" },
  tamamlanan: { bg: "bg-cyan-100", text: "text-cyan-700", icon: "bg-cyan-500" },
  bekleyen: { bg: "bg-yellow-100", text: "text-yellow-700", icon: "bg-yellow-500" },
} as const;

/** Aşama label'ları — DB'de kısa string olabilir, UI'de güzelleştir */
export const ASAMA_LABEL: Record<string, string> = {
  Kesim: "Kesim",
  "Deri Yüzme": "Deri Yüzme",
  "Parçalama Hazırlık": "Parçalama Hazırlık",
  Parçalama: "Parçalama",
  Tartım: "Tartım",
  Paketleme: "Paketleme",
  Teslim: "Teslim",
};

/** Geçerli durum→aşama eşlemesi (default aşama) */
export const DURUM_VARSAYILAN_ASAMA: Record<KesimDurumu, string | null> = {
  beklemede: null,
  vekalet_onay: null,
  siradaki: null,
  kesimde: "Kesim",
  parcalama: "Parçalama",
  tartimda: "Tartım",
  teslime_hazir: "Teslim",
  teslim_edildi: null,
  iptal: null,
};

/** Tema türü */
export type TvTema = "light" | "dark";
