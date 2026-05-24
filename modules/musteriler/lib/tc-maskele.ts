/**
 * TC kimlik numarası maskeleme — KVKK uyumu için.
 *
 * "12345678901" → "***6789***1"
 * Hover'da admin görebilir.
 */

export function tcMaskele(tc: string | null | undefined): string {
  if (!tc) return "—";
  const temiz = tc.replace(/\D/g, "");
  if (temiz.length !== 11) return "—";
  return `***${temiz.slice(3, 7)}***${temiz.slice(10)}`;
}

/** TC kimlik validasyon (11 hane, son hane checksum) */
export function tcKimlikGecerliMi(tc: string): boolean {
  const temiz = tc.replace(/\D/g, "");
  if (!/^[1-9][0-9]{10}$/.test(temiz)) return false;

  const haneler = temiz.split("").map(Number);
  const tekToplam = haneler[0]! + haneler[2]! + haneler[4]! + haneler[6]! + haneler[8]!;
  const ciftToplam = haneler[1]! + haneler[3]! + haneler[5]! + haneler[7]!;
  const onuncuHane = (tekToplam * 7 - ciftToplam) % 10;
  if (onuncuHane !== haneler[9]) return false;
  const onbirinciHane =
    (haneler.slice(0, 10).reduce((a, b) => a + b, 0)) % 10;
  return onbirinciHane === haneler[10];
}
