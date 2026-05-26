/**
 * Dekont doğrulama kodu üretici — HMAC-SHA256 ile imzalı.
 *
 * Dekont no + tarih + tutar girdileri SECRET ile HMAC'lenir ve ilk 10 hex
 * karakter dekont kodu olarak kullanılır. Repo public olsa bile secret
 * `.env`'de tutulduğu için sahte dekont kodu üretilemez.
 *
 * Format: ABH-XXXXXXXXXX (10 hex karakter, 16^10 ≈ 1 trilyon olasılık)
 * Eski format ABH-XXXX (4 hex) güvensiz olduğu için kaldırıldı.
 */

import { createHmac } from "node:crypto";

const SECRET = process.env.DEKONT_DOGRULAMA_SECRET;

if (!SECRET || SECRET.length < 32) {
  throw new Error(
    "DEKONT_DOGRULAMA_SECRET .env'de tanımlı değil veya 32 karakterden kısa.\n" +
      'Üretmek için: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
  );
}

export interface DogrulamaGirdisi {
  dekontNo: string;
  tarih: Date;
  toplamTutar: number;
}

export function dogrulamaKoduUret(g: DogrulamaGirdisi): string {
  const veri = [
    g.dekontNo,
    g.tarih.toISOString().slice(0, 10), // YYYY-MM-DD
    Math.round(g.toplamTutar * 100).toString(), // kuruş
  ].join("|");

  const hash = createHmac("sha256", SECRET!).update(veri).digest("hex");
  return `ABH-${hash.slice(0, 10).toUpperCase()}`;
}

/**
 * Timing-safe karşılaştırma — uzunluk veya içerik farkı olsa bile
 * sabit zamanda çalışır (timing attack koruması).
 */
export function dogrulamaKoduGecerliMi(
  girdi: DogrulamaGirdisi,
  beklenenKod: string,
): boolean {
  const uretilen = dogrulamaKoduUret(girdi);
  const a = uretilen.toUpperCase();
  const b = beklenenKod.trim().toUpperCase();
  if (a.length !== b.length) return false;
  let fark = 0;
  for (let i = 0; i < a.length; i++) {
    fark |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return fark === 0;
}
