/**
 * Yeni müşteri formu için telefon helper'ları.
 *
 * NOT: shared/lib/telefon.ts başka bir kullanım için var (10 haneli
 * "5XXXXXXXXX" döndürür — DB normalize). Bu dosya form-spesifik:
 *  - `telefonNormalize` 11 haneli "05XXXXXXXXX" döndürür (form girdisi)
 *  - `telefonGoster` "0532 123 45 67" görsel format üretir
 *  - `telefonGecerli` doğrulama
 *  - `telefonApiFormat` API'ye gönderim için (rakamlar, 11 hane)
 *
 * İki dosyanın aynı isimli `telefonNormalize` çıktısı FARKLIDIR — import
 * yolu ile ayırt edin.
 */

/** Tüm girdileri 11 haneli "0XXXXXXXXXX" forma getirir (5XX ile başlayan). */
export function telefonNormalize(tel: string): string {
  if (!tel) return "";
  let sade = tel.replace(/\D/g, "");

  // +90 veya 90 prefix temizle
  if (sade.startsWith("90") && sade.length > 10) {
    sade = sade.slice(2);
  }

  // Başında 0 yoksa ve 5 ile başlıyorsa "0" ekle
  if (sade.length === 10 && sade.startsWith("5")) {
    sade = "0" + sade;
  }

  // Maksimum 11 hane
  return sade.slice(0, 11);
}

/** Görsel format: "0532 123 45 67" */
export function telefonGoster(tel: string): string {
  const sade = telefonNormalize(tel);
  if (sade.length < 5) return sade;
  if (sade.length < 8) return `${sade.slice(0, 4)} ${sade.slice(4)}`;
  if (sade.length < 10)
    return `${sade.slice(0, 4)} ${sade.slice(4, 7)} ${sade.slice(7)}`;
  return `${sade.slice(0, 4)} ${sade.slice(4, 7)} ${sade.slice(7, 9)} ${sade.slice(9, 11)}`;
}

/** TR mobil (05XXXXXXXXX, 11 hane) geçerli mi? */
export function telefonGecerli(tel: string): boolean {
  const sade = telefonNormalize(tel);
  return /^05\d{9}$/.test(sade);
}

/** API'ye gönderim için sadece rakamlar (11 hane). */
export function telefonApiFormat(tel: string): string {
  return telefonNormalize(tel);
}
