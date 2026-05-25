/**
 * TASARIM-BRIEF.md §3 renk paleti — TEK KAYNAK.
 *
 * Tüm dashboard component'leri buradan import eder.
 * SVG/inline-style için raw hex değerleri, Tailwind sınıfları için class adı.
 */

// =============================================================================
// Birincil (Brand) — Tilbe Orange
// =============================================================================
export const TILBE_ORANGE = "#ea580c";
export const TILBE_ORANGE_LIGHT = "#fed7aa";
export const TILBE_ORANGE_DARK = "#c2410c";

// =============================================================================
// İkincil — Kurban Yeşil (doğa, başarı)
// =============================================================================
export const KURBAN_YESIL = "#16a34a";
export const KURBAN_YESIL_DARK = "#15803d";

// =============================================================================
// Brand mavisi (info, chart line)
// =============================================================================
export const BRAND_BLUE = "#2563eb";

// =============================================================================
// Anlamsal renkler (TASARIM-BRIEF §3 Anlamsal Renkler)
// =============================================================================
export const RENK_BASARI = "#16a34a"; // yeşil
export const RENK_UYARI = "#f59e0b"; // sarı
export const RENK_HATA = "#dc2626"; // kırmızı
export const RENK_BILGI = "#2563eb"; // mavi

// =============================================================================
// Nötr — arka plan
// =============================================================================
export const GRI_KOYU = "#1e293b";
export const GRI_ORTA = "#64748b";
export const GRI_ACIK = "#f1f5f9";
export const BEYAZ = "#ffffff";

// =============================================================================
// Bayram tarihi + dinamik tema durumları
// =============================================================================
// Diyanet onaylı 2026 Kurban Bayramı tarihleri:
//   Arife: 26 Mayıs 2026 Salı
//   1. Gün: 27 Mayıs 2026 Çarşamba
//   2. Gün: 28 Mayıs 2026 Perşembe
//   3. Gün: 29 Mayıs 2026 Cuma
//   4. Gün: 30 Mayıs 2026 Cumartesi
export const BAYRAM_TARIHI = new Date("2026-05-27T00:00:00+03:00");
export const BAYRAM_ARIFE = new Date("2026-05-26T00:00:00+03:00");
export const BAYRAM_SON_GUN = new Date("2026-05-30T23:59:59+03:00");

export type BayramDurumu =
  | "uzak" // > 14 gün
  | "yakin" // 4-14 gün
  | "cok-yakin" // 1-3 gün
  | "bugun" // bayram günü (27-30 Mayıs)
  | "sonra"; // > 30 Mayıs

/**
 * Bugüne göre bayram durumunu hesapla.
 * Dashboard tema yoğunluğu bu değere göre değişir.
 */
export function bayramDurumu(bugun: Date = new Date()): BayramDurumu {
  const farkMs = BAYRAM_TARIHI.getTime() - bugun.getTime();
  const farkGun = Math.ceil(farkMs / (1000 * 60 * 60 * 24));

  if (farkGun > 14) return "uzak";
  if (farkGun > 3) return "yakin";
  if (farkGun >= 1) return "cok-yakin";
  // Bayram 4 gün: 27-30 Mayıs (farkGun 0, -1, -2, -3)
  if (farkGun >= -3) return "bugun";
  return "sonra";
}

/** Bayram günü stil paketi — TopBilgiSeridi ve KPI vurguları için */
export interface BayramTemasi {
  durum: BayramDurumu;
  /** Top şerit gradient sınıfı */
  topSerit: string;
  /** Top şerit kenar çizgisi */
  topSeritBorder: string;
  /** Yardımcı metin renk sınıfı */
  topSeritText: string;
  /** Kart başlığı tonu (turuncu yoğunluğu) */
  baslikRenk: string;
  /** Vurgu butonu rengi (renk yoğunluğu durum ile artar) */
  vurguButon: string;
  /** Bayram günü mü? */
  bayramMi: boolean;
  /** "Bayram öncesi", "Bayramınız mübarek" gibi banner mesajı */
  banner: string;
  /** Kalan/geçen gün mesajı */
  altMesaj: string;
}

/**
 * Bayram durumuna göre tema paketi üret.
 * Bayrama yaklaştıkça turuncu daha yoğun, bayram günü kutlama tonu.
 */
export function bayramTemasi(bugun: Date = new Date()): BayramTemasi {
  const durum = bayramDurumu(bugun);
  const farkMs = BAYRAM_TARIHI.getTime() - bugun.getTime();
  const kalan = Math.ceil(farkMs / (1000 * 60 * 60 * 24));

  switch (durum) {
    case "uzak":
      return {
        durum,
        topSerit: "from-orange-50 to-amber-50",
        topSeritBorder: "border-l-orange-400",
        topSeritText: "text-orange-800",
        baslikRenk: "text-orange-700",
        vurguButon: "bg-orange-500 hover:bg-orange-600",
        bayramMi: false,
        banner: `Kurban Bayramına ${kalan} gün`,
        altMesaj: "27 Mayıs 2026 · Hazırlığa devam",
      };
    case "yakin":
      return {
        durum,
        topSerit: "from-orange-100 to-amber-100",
        topSeritBorder: "border-l-orange-500",
        topSeritText: "text-orange-900",
        baslikRenk: "text-orange-700",
        vurguButon: "bg-orange-500 hover:bg-orange-600",
        bayramMi: false,
        banner: `⏳ Kurban Bayramına ${kalan} gün kaldı`,
        altMesaj: "27 Mayıs 2026 · Son hazırlık dönemi",
      };
    case "cok-yakin":
      return {
        durum,
        topSerit: "from-orange-200 to-red-100",
        topSeritBorder: "border-l-red-500",
        topSeritText: "text-red-900",
        baslikRenk: "text-red-700",
        vurguButon: "bg-red-500 hover:bg-red-600",
        bayramMi: false,
        banner: `🔥 Bayrama ${kalan} gün! Son hazırlıklar`,
        altMesaj: "Borçlu listesini kontrol edin, vekaletleri tamamlayın",
      };
    case "bugun":
      return {
        durum,
        topSerit: "from-emerald-100 via-green-100 to-emerald-100",
        topSeritBorder: "border-l-emerald-600",
        topSeritText: "text-emerald-900",
        baslikRenk: "text-emerald-700",
        vurguButon: "bg-emerald-600 hover:bg-emerald-700",
        bayramMi: true,
        banner: "🎉 Bayramınız Mübarek Olsun",
        altMesaj: "Operasyon günü · TV ekranı + kesim akışı aktif",
      };
    case "sonra":
      return {
        durum,
        topSerit: "from-stone-50 to-blue-50",
        topSeritBorder: "border-l-blue-400",
        topSeritText: "text-blue-900",
        baslikRenk: "text-blue-700",
        vurguButon: "bg-blue-600 hover:bg-blue-700",
        bayramMi: false,
        banner: "Bayram sonrası dönem",
        altMesaj: "Raporları kapatın, kasayı sonlandırın",
      };
  }
}
