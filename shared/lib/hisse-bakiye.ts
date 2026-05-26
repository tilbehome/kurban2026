/**
 * Hisse bazlı borç durumu hesaplama.
 *
 * Tek hissenin bedelinden iptal edilmemiş ödemeleri çıkarır,
 * sonucu 3 kategoriden birine eşler:
 *   - tam-borc:   hiç ödeme yok
 *   - kismi-borc: kısmen ödenmiş
 *   - borc-yok:   tamamı (veya fazlası) ödenmiş
 *
 * Float toleransı 0.01 TL — yuvarlama farklarına karşı.
 */

export type BorcDurumu = "borc-yok" | "kismi-borc" | "tam-borc";

const FLOAT_TOLERANSI = 0.01;

export function hisseBorcDurumu(
  hisseFiyati: number,
  odemeler: ReadonlyArray<{ toplamTutar: number }>,
): BorcDurumu {
  const toplamOdeme = odemeler.reduce(
    (acc, o) => acc + Number(o.toplamTutar),
    0,
  );
  if (toplamOdeme === 0) return "tam-borc";
  if (Number(hisseFiyati) - toplamOdeme <= FLOAT_TOLERANSI) return "borc-yok";
  return "kismi-borc";
}
