/**
 * Türkiye TC Kimlik No algoritma doğrulama.
 *
 * Kurallar:
 *  - 11 hane rakam
 *  - 1. hane 0 olamaz
 *  - 10. hane: (tek_haneler_toplamı*7 - çift_haneler_toplamı) mod 10
 *  - 11. hane: ilk 10 hanenin toplamının mod 10'u
 */

export function tcKimlikGecerli(tc: string): boolean {
  if (!/^\d{11}$/.test(tc)) return false;

  const h = tc.split("").map(Number) as number[];

  // İlk hane 0 olamaz
  if (h[0] === 0) return false;

  // 10. hane kontrolü
  const tek = (h[0]! + h[2]! + h[4]! + h[6]! + h[8]!) * 7;
  const cift = h[1]! + h[3]! + h[5]! + h[7]!;
  const onuncu = (tek - cift) % 10;
  if (onuncu !== h[9]) return false;

  // 11. hane kontrolü
  const ilk10 = h.slice(0, 10).reduce((a, b) => a + b, 0);
  if (ilk10 % 10 !== h[10]) return false;

  return true;
}
