/**
 * Dashboard veri tipleri — modules/dashboard.
 *
 * Tüm API endpoint'leri ApiYanit<T> formatında dönüş yapar (shared/types/api).
 * Bu dosya sadece veri payload tiplerini tutar.
 */

import type { LucideIcon } from "lucide-react";

/** 6 KPI kartının tek bir kart verisi */
export interface DashboardKpiKart {
  id:
    | "musteri"
    | "kurban"
    | "hisse-doluluk"
    | "tahsilat"
    | "borc"
    | "kasa";
  baslik: string;
  sayi: number;
  /** "₺" / "" / "%" — display only */
  birim: string;
  /** "1.248 müşteri" gibi alt yazı */
  altMetin: string;
  /** ör. +12 → bu ay artış, -5 → düşüş; null ise rozet gösterilmez */
  trend?: { yon: "yukari" | "asagi"; yuzde: number; pozitifMi: boolean };
  /** Tailwind renk anahtarı (KART_RENKLERI'nden) */
  renk: KartRengi;
  /** Tıklama hedefi (yoksa tıklanamaz) */
  href?: string;
  /** Hisse doluluk için ek progress yüzdesi */
  progressYuzde?: number;
}

export type KartRengi =
  | "yesil"
  | "mavi"
  | "mor"
  | "turuncu"
  | "kirmizi"
  | "sari";

/** Tahsilat trend grafiği — saatlik veya günlük */
export interface TahsilatTrendNoktasi {
  /** Etiket: "08", "12" (bugün) veya "Pzt", "Sal" (7 gün) veya "01.06" (30 gün) */
  etiket: string;
  /** Tutar (₺) */
  tutar: number;
  /** İşlem sayısı */
  islem: number;
}

export interface TahsilatTrend {
  noktalar: TahsilatTrendNoktasi[];
  toplam: number;
  ortalama: number;
  basariOrani: number;
  /** Önceki dönemle karşılaştırma yüzdesi (+/- %) */
  trend: number;
}

export type TrendAraligi = "bugun" | "7gun" | "30gun";

/** Kesim operasyon akışı — 7 aşama (Faz 2'de gerçek kesim modülü) */
export interface KesimAsamasi {
  id:
    | "vekalet"
    | "kesim-alani"
    | "kesimde"
    | "parcalama"
    | "tartim"
    | "paketleniyor"
    | "teslim-hazir";
  ad: string;
  sayi: number;
  toplam: number;
  yuzde: number;
  renk:
    | "turuncu"
    | "sari"
    | "kirmizi"
    | "mor"
    | "mavi"
    | "yesil-koyu"
    | "yesil";
}

export interface KesimAkisi {
  asamalar: KesimAsamasi[];
  sonGuncelleme: string; // ISO timestamp
  canli: boolean;
}

/** Son işlemler feed — son 10 ödeme */
export interface SonIslem {
  id: string;
  musteriId: string;
  musteriAdSoyad: string;
  musteriBashar: string;
  /** "+tahsilat" | "iade" | "vip" | "havale" | "kart" etiketleri */
  rozetler: string[];
  tutar: number;
  yontem: "nakit" | "havale" | "kart" | "karisik";
  hisseEtiket: string; // "#17.3"
  dekontNo: string;
  tarih: string; // ISO
}

/** Kasa durumu — nakit + banka + POS dağılımı */
export interface KasaDurumu {
  nakit: number;
  banka: number;
  pos: number;
  toplam: number;
  bugunkuGiris: number;
  bugunkuCikis: number;
}

/** WhatsApp bildirim merkezi metrikleri */
export interface WhatsAppMetrik {
  yeniMesaj: number;
  kuyruk: number;
  basarili: number;
  hata: number;
}

/** Hızlı kart başına Tailwind renk sınıfları */
export const KART_RENKLERI: Record<
  KartRengi,
  { bg: string; text: string; iconBg: string; trendUp: string; trendDown: string }
> = {
  yesil: {
    bg: "bg-green-50",
    text: "text-green-700",
    iconBg: "bg-green-100 text-green-600",
    trendUp: "text-green-600",
    trendDown: "text-red-600",
  },
  mavi: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    iconBg: "bg-blue-100 text-blue-600",
    trendUp: "text-blue-600",
    trendDown: "text-red-600",
  },
  mor: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    iconBg: "bg-purple-100 text-purple-600",
    trendUp: "text-purple-600",
    trendDown: "text-red-600",
  },
  turuncu: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    iconBg: "bg-orange-100 text-orange-600",
    trendUp: "text-orange-600",
    trendDown: "text-red-600",
  },
  kirmizi: {
    bg: "bg-red-50",
    text: "text-red-700",
    iconBg: "bg-red-100 text-red-600",
    trendUp: "text-red-600",
    trendDown: "text-green-600",
  },
  sari: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    iconBg: "bg-amber-100 text-amber-600",
    trendUp: "text-amber-600",
    trendDown: "text-red-600",
  },
};

/** Kesim aşaması Tailwind progress bar sınıfları */
export const KESIM_RENKLERI: Record<KesimAsamasi["renk"], string> = {
  turuncu: "bg-orange-500",
  sari: "bg-amber-500",
  kirmizi: "bg-red-500",
  mor: "bg-purple-500",
  mavi: "bg-blue-500",
  "yesil-koyu": "bg-emerald-600",
  yesil: "bg-green-500",
};

/** Avatar gradient — ID hash'inden deterministik üretir */
export const AVATAR_GRADIENTLERI: { from: string; to: string }[] = [
  { from: "from-orange-400", to: "to-amber-500" },
  { from: "from-blue-400", to: "to-indigo-500" },
  { from: "from-emerald-400", to: "to-green-500" },
  { from: "from-pink-400", to: "to-rose-500" },
  { from: "from-purple-400", to: "to-fuchsia-500" },
  { from: "from-cyan-400", to: "to-sky-500" },
  { from: "from-yellow-400", to: "to-orange-500" },
  { from: "from-teal-400", to: "to-cyan-500" },
];

/** Verilen string'den deterministik avatar gradient seç */
export function avatarGradient(id: string): { from: string; to: string } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_GRADIENTLERI[Math.abs(hash) % AVATAR_GRADIENTLERI.length];
}

/** İkon getter — sidebar-config gibi LucideIcon referansı taşımayalım, name string */
export type IkonAdi =
  | "Users"
  | "Beef"
  | "PieChart"
  | "Banknote"
  | "AlertCircle"
  | "Wallet"
  | "UserCheck"
  | "Scissors"
  | "Slice"
  | "Scale"
  | "Package"
  | "CheckCircle";

export interface KesimAsamasiIkonu {
  id: KesimAsamasi["id"];
  ikon: LucideIcon;
}
