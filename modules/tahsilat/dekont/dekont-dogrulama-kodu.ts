/**
 * Dekont doğrulama kodu üretici.
 *
 * Dekont no + tarih + tutar'dan deterministik kısa hash üretir.
 * Müşteri /dogrula sayfasında bu kodu girerek dekontun gerçek
 * olduğunu doğrulayabilir.
 *
 * Format: ABH-XXXX (4 hex karakter)
 */

import { createHash } from "node:crypto";

const HASH_GIZLI_TUZ = "ada-bereket-dekont-2026";

export interface DogrulamaGirdisi {
  dekontNo: string;
  tarih: Date;
  toplamTutar: number;
}

export function dogrulamaKoduUret(g: DogrulamaGirdisi): string {
  const veri = [
    g.dekontNo,
    g.tarih.toISOString().slice(0, 10),
    Math.round(g.toplamTutar * 100).toString(),
    HASH_GIZLI_TUZ,
  ].join("|");

  const hash = createHash("sha256").update(veri).digest("hex");
  const kod = hash.slice(0, 4).toUpperCase();
  return `ABH-${kod}`;
}

export function dogrulamaKoduGecerliMi(
  girdi: DogrulamaGirdisi,
  beklenenKod: string,
): boolean {
  const uretilen = dogrulamaKoduUret(girdi);
  return uretilen.toUpperCase() === beklenenKod.trim().toUpperCase();
}
