/**
 * Telefon normalize + maskeleme yardımcıları.
 *
 * TR mobil formatları (5XX): "+90 5XX...", "05XX...", "5XX..." hepsi
 * 10 haneli normalize edilmiş forma indirilir.
 */

/**
 * Türkçe telefon formatlarından 10-haneli mobil numarayı çıkarır.
 * Tanır:
 *   "0532 123 45 67" / "0532-123-45-67" / "05321234567"
 *   "+90 532 ..." / "+905321234567"
 *   "5321234567"
 *
 * Döner: 10 haneli numara (5XX-XXXXXXX) veya null.
 */
export function telefonNormalize(input: string | null | undefined): string | null {
  if (!input) return null;
  const rakam = String(input).replace(/\D/g, "");
  if (rakam.length === 10 && rakam.startsWith("5")) return rakam;
  if (rakam.length === 11 && rakam.startsWith("05")) return rakam.slice(1);
  if (rakam.length === 12 && rakam.startsWith("905")) return rakam.slice(2);
  if (rakam.length === 13 && rakam.startsWith("0905")) return rakam.slice(3);
  return null;
}

/**
 * Telefonu KVKK uyumlu maskeler.
 *   "05321234567" → "0532****567"
 *   ilk 4 + son 3 karakter görünür, ortası yıldız.
 */
export function telefonMaskele(tel: string | null | undefined): string | null {
  if (!tel) return null;
  const s = String(tel);
  const rakam = s.replace(/\D/g, "");
  if (rakam.length < 7) return s;
  const ilk4 = rakam.slice(0, 4);
  const son3 = rakam.slice(-3);
  return `${ilk4}****${son3}`;
}
