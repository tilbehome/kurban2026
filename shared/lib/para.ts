/**
 * TL para formatlama yardımcıları.
 * Tüm hesaplamalarda Math.round ile kuruşa yuvarlanır (float artifact engellemek için).
 */

const TL_FORMATTER = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  // Muhasebe standardı — her zaman 2 ondalık (₺139.000,00)
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const SAYI_FORMATTER = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * 44000 → "₺44.000,00"
 * 44000.5 → "₺44.000,50"
 *
 * Her zaman 2 ondalık basamak (muhasebe standardı).
 * KPI kartları gibi kompakt yer için formatParaKisa() kullan.
 */
export function formatPara(deger: number | null | undefined): string {
  if (deger == null || Number.isNaN(deger)) return "₺0,00";
  return TL_FORMATTER.format(yuvarla(deger));
}

/**
 * 44000 → "44.000,00"  (sembol olmadan, 2 ondalık)
 */
export function formatSayi(deger: number | null | undefined): string {
  if (deger == null || Number.isNaN(deger)) return "0,00";
  return SAYI_FORMATTER.format(yuvarla(deger));
}

/**
 * Büyük sayılar için kompakt format (Dashboard KPI kartları).
 *
 * 25.000.000 → "₺25,0M"
 * 1.500.000  → "₺1,5M"
 * 500.000    → "₺500K"
 * 50.000     → "₺50.000,00" (formatPara'ya devreder)
 */
export function formatParaKisa(deger: number | null | undefined): string {
  if (deger == null || Number.isNaN(deger)) return "₺0,00";
  const n = yuvarla(deger);
  if (n >= 1_000_000) {
    return "₺" + (n / 1_000_000).toFixed(1).replace(".", ",") + "M";
  }
  if (n >= 100_000) {
    return "₺" + Math.round(n / 1_000).toLocaleString("tr-TR") + "K";
  }
  return formatPara(n);
}

/**
 * Kullanıcının yazdığı "44.000,50" → 44000.50
 * Türkçe locale: nokta binlik, virgül ondalık
 */
export function parsePara(metin: string): number {
  if (!metin) return 0;
  const temiz = metin
    .toString()
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const sayi = parseFloat(temiz);
  return Number.isNaN(sayi) ? 0 : yuvarla(sayi);
}

/**
 * Float artifact engellemek için kuruşa yuvarla.
 * 400000.00000000006 → 400000
 */
export function yuvarla(deger: number): number {
  return Math.round(deger * 100) / 100;
}

/**
 * İki para tutarını güvenli topla (float artifact yok).
 */
export function topla(...degerler: number[]): number {
  return yuvarla(degerler.reduce((a, b) => a + b, 0));
}

/**
 * İki para tutarını güvenli çıkar.
 */
export function cikar(a: number, b: number): number {
  return yuvarla(a - b);
}
