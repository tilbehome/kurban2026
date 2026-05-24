/**
 * Hisse atama UI veri tipleri — FAZ 7
 *
 * Server'dan client'a serileştirilebilir saf veri tipleri (LucideIcon yok).
 */

export type HisseDolulukDurum = "bos" | "dolu" | "onayli";

/** Stable grid'de tek bir hisse kutusu */
export interface HisseKutusuVeri {
  id: string;
  no: number;
  musteriId: string | null;
  musteriAdSoyad: string | null;
  musteriBashar: string | null;
  hisseFiyati: number;
  /** İlgili odeme toplamı; >= hisseFiyati ise onayli */
  odenenToplam: number;
  durum: HisseDolulukDurum;
}

/** Stable grid'de bir kurban kartı */
export interface KurbanKartVeri {
  id: string;
  kesimSirasi: number;
  kupeNo: string | null;
  cins: string;
  agirlik: number | null;
  hisseSayisi: number;
  bosHisseSayisi: number;
  doluHisseSayisi: number;
  dolulukYuzde: number;
  /** "kesime-hazir" | "beklemede" | "yarim" | "bos" */
  durumRozeti: KurbanDurumRozeti;
  /** Hisse başı önerilen fiyat (ilk boş hisseden) */
  onerilenFiyat: number;
  hisseler: HisseKutusuVeri[];
}

export type KurbanDurumRozeti =
  | "kesime-hazir" // 7/7 dolu + ödemeler tamam
  | "beklemede" // 1-6 dolu
  | "yarim" // 1-6 dolu (alternatif)
  | "bos" // 0/7
  | "sorunlu"; // veteriner notu

/** Sol panel müşteri kartı — eksik hisseli müşteriler */
export interface EksikHisseliMusteri {
  id: string;
  adSoyad: string;
  telefon: string | null;
  bashar: string;
  etiketler: string[];
  vipMi: boolean;
  atananHisseSayisi: number;
  /** Müşterinin geçmiş atamalarındaki kurban kesim sıraları */
  atananKurbanlar: number[];
  toplamBedel: number;
  odenenToplam: number;
  /** Henüz atanmamış kalan hisse ihtiyacı — şu an her zaman 0 olabilir,
   *  tasarımda her müşteri için "kaç hisse daha ister?" hesabı yok.
   *  Bu alan tutulur çünkü filtre/sıralama için gerekli olabilir. */
  beklenenEksikHisse: number;
}

/** Üst KPI şeridi için istatistik */
export interface AtamaIstatistik {
  toplamKurban: number;
  toplamHisse: number;
  doluHisse: number;
  bosHisse: number;
  dolulukYuzde: number;
  eksikMusteri: number; // hiç atanmamış müşteri sayısı
}

/** Drag-drop esnasında transfer edilen payload */
export interface DragPayload {
  tip: "musteri";
  musteriId: string;
  musteriAdSoyad: string;
  musteriBashar: string;
}

/** Atama paneli state (sağ sticky) */
export interface AtamaPaneliState {
  musteriId: string | null;
  musteriAdSoyad: string | null;
  kurbanId: string | null;
  kurbanKesimSirasi: number | null;
  hisseId: string | null;
  hisseNo: number | null;
  hisseFiyati: number;
  not: string;
}

export const BOS_ATAMA_STATE: AtamaPaneliState = {
  musteriId: null,
  musteriAdSoyad: null,
  kurbanId: null,
  kurbanKesimSirasi: null,
  hisseId: null,
  hisseNo: null,
  hisseFiyati: 0,
  not: "",
};

/** View mode toggle */
export type AtamaGorunum = "stable" | "liste" | "hizli";

/** Renk paleti — TASARIM-BRIEF uyumlu */
export const HISSE_RENKLERI = {
  bos: "border-dashed border-stone-300 bg-stone-50",
  dolu: "border-orange-300 bg-orange-50",
  onayli: "border-green-400 bg-green-50",
  dragOver: "ring-2 ring-orange-500 bg-orange-100 border-orange-500",
  invalidDragOver: "ring-2 ring-red-500 bg-red-50 border-red-500",
} as const;

export const KURBAN_DURUM_RENKLERI: Record<
  KurbanDurumRozeti,
  { bg: string; text: string; ring: string; etiket: string; emoji: string }
> = {
  "kesime-hazir": {
    bg: "bg-green-100",
    text: "text-green-800",
    ring: "ring-green-300",
    etiket: "Kesime Hazır",
    emoji: "🟢",
  },
  beklemede: {
    bg: "bg-amber-100",
    text: "text-amber-800",
    ring: "ring-amber-300",
    etiket: "Beklemede",
    emoji: "🟡",
  },
  yarim: {
    bg: "bg-amber-100",
    text: "text-amber-800",
    ring: "ring-amber-300",
    etiket: "Yarım Dolu",
    emoji: "🟡",
  },
  bos: {
    bg: "bg-stone-100",
    text: "text-stone-700",
    ring: "ring-stone-300",
    etiket: "Boş",
    emoji: "⚪",
  },
  sorunlu: {
    bg: "bg-red-100",
    text: "text-red-800",
    ring: "ring-red-300",
    etiket: "Sorunlu",
    emoji: "🔴",
  },
};
