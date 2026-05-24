/**
 * wa.me Click-to-Chat link üretici (TR telefonları için).
 *
 * Format: "0532 123 45 67" → "905321234567"
 * Sonuç:  "https://wa.me/905321234567?text=..."
 *
 * NOT: Otomatik gönderme YOK. Sadece kullanıcının WhatsApp Web/uygulamasında
 * mesajı önceden dolu olarak açar — kullanıcı "Send" tuşuna basar.
 * (WhatsApp ToS uyumlu)
 */

/** TR telefon numarasını normalize et: "0XXX..." veya "+90..." → "90XXXXXXXXXX" */
export function telefonNormalize(telefon: string | null | undefined): string | null {
  if (!telefon) return null;
  const rakam = telefon.replace(/\D/g, "");
  if (rakam.length === 0) return null;

  // +90 ile başlıyorsa
  if (rakam.startsWith("90") && rakam.length === 12) return rakam;

  // 0 ile başlıyorsa (yerel format)
  if (rakam.startsWith("0") && rakam.length === 11) return "90" + rakam.slice(1);

  // 5XXXXXXXXX (10 hane, başında 0 yok)
  if (rakam.length === 10 && rakam.startsWith("5")) return "90" + rakam;

  // Diğer durumlar — geçersiz
  return null;
}

/** Telefon TR mobil mi? (5XX ile başlıyor mu — 90 prefix sonrası) */
export function gecerliMobil(normalize: string | null): boolean {
  if (!normalize) return false;
  return /^905\d{9}$/.test(normalize);
}

/** wa.me linki üret */
export function urettWaLink(telefon: string | null, mesaj: string): string | null {
  const n = telefonNormalize(telefon);
  if (!n || !gecerliMobil(n)) return null;
  const encoded = encodeURIComponent(mesaj);
  return `https://wa.me/${n}?text=${encoded}`;
}

/** Görsel format: "+90 532 123 4567" */
export function formatTelefon(telefon: string | null | undefined): string {
  const n = telefonNormalize(telefon);
  if (!n) return "—";
  // 905321234567 → +90 532 123 45 67
  return `+${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5, 8)} ${n.slice(8, 10)} ${n.slice(10)}`;
}
