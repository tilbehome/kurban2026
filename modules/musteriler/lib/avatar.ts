/**
 * Müşteri avatarı için yardımcılar.
 * - İlk harfler (Ahmet Yılmaz → AY)
 * - ID'ye göre tutarlı gradient renk (her oturumda aynı)
 */

export interface AvatarRenk {
  bg: string;
  text: string;
}

export const AVATAR_RENKLERI: AvatarRenk[] = [
  { bg: "from-red-100 to-red-200", text: "text-red-900" },
  { bg: "from-blue-100 to-blue-200", text: "text-blue-900" },
  { bg: "from-green-100 to-green-200", text: "text-green-900" },
  { bg: "from-amber-100 to-amber-200", text: "text-amber-900" },
  { bg: "from-purple-100 to-purple-200", text: "text-purple-900" },
  { bg: "from-cyan-100 to-cyan-200", text: "text-cyan-900" },
];

/** Müşteri ID'sine göre tutarlı renk seçer (string cuid veya number). */
export function avatarRenk(musteriId: string | number): AvatarRenk {
  const idx = idHash(musteriId) % AVATAR_RENKLERI.length;
  return AVATAR_RENKLERI[idx]!;
}

/** String/number ID'yi pozitif int'e hash'ler (renk seçimi için deterministik). */
function idHash(id: string | number): number {
  if (typeof id === "number") return Math.abs(id);
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Ad-Soyad'dan ilk harfleri çıkarır (max 2 harf). */
export function ilkHarfler(adSoyad: string): string {
  if (!adSoyad) return "?";
  const parcalar = adSoyad
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0);
  if (parcalar.length === 0) return "?";
  if (parcalar.length === 1) {
    return parcalar[0]!.substring(0, 2).toUpperCase();
  }
  const ilk = parcalar[0]!.charAt(0).toUpperCase();
  const son = parcalar[parcalar.length - 1]!.charAt(0).toUpperCase();
  return ilk + son;
}

/** Bir ad-soyad'ın ilk büyük harfini döner (alfabe filtresi için). */
export function alfabeHarfi(adSoyad: string): string {
  if (!adSoyad) return "#";
  const ilkChar = adSoyad.trim().charAt(0).toLocaleUpperCase("tr-TR");
  if (/^[A-ZÇĞİÖŞÜ]$/u.test(ilkChar)) return ilkChar;
  return "#";
}
