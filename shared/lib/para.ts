/**
 * TL para formatlama yardımcıları.
 * Tüm hesaplamalarda Math.round ile kuruşa yuvarlanır (float artifact engellemek için).
 */

const TL_FORMATTER = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const SAYI_FORMATTER = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * 44000 → "44.000 ₺"
 * 44000.5 → "44.000,50 ₺"
 */
export function formatPara(deger: number | null | undefined): string {
  if (deger == null || Number.isNaN(deger)) return "0 ₺";
  return TL_FORMATTER.format(yuvarla(deger));
}

/**
 * 44000 → "44.000"  (sembol olmadan)
 */
export function formatSayi(deger: number | null | undefined): string {
  if (deger == null || Number.isNaN(deger)) return "0";
  return SAYI_FORMATTER.format(yuvarla(deger));
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
