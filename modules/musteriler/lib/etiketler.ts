/**
 * Müşteri etiketleri — önceden tanımlı 6 etiket + parse/serialize helper.
 *
 * DB'de `Musteri.etiketler` JSON string olarak saklanır (Prisma schema'da
 * String? alanı). BorclularClient gibi mevcut tüketicilerle uyumlu kalmak
 * için JSON.stringify(array) formatını koruyoruz.
 */

export interface MusteriEtiket {
  ad: string;
  renk: string;
  ikon: string;
  aciklama: string;
}

export const MUSTERI_ETIKETLERI: Record<string, MusteriEtiket> = {
  VIP: {
    ad: "VIP",
    renk: "bg-purple-100 text-purple-800 border-purple-300",
    ikon: "⭐",
    aciklama: "Öncelikli müşteri, özel ilgi",
  },
  Aile: {
    ad: "Aile",
    renk: "bg-blue-100 text-blue-800 border-blue-300",
    ikon: "👨‍👩‍👧",
    aciklama: "Aynı aileden birden çok hisse",
  },
  "Geçen Yıl": {
    ad: "Geçen Yıl",
    renk: "bg-green-100 text-green-800 border-green-300",
    ikon: "🔁",
    aciklama: "Geçen yıl da müşterimizdi (sadakat)",
  },
  Yeni: {
    ad: "Yeni",
    renk: "bg-yellow-100 text-yellow-800 border-yellow-300",
    ikon: "🆕",
    aciklama: "İlk kez bizden alıyor",
  },
  Toptan: {
    ad: "Toptan",
    renk: "bg-orange-100 text-orange-800 border-orange-300",
    ikon: "📦",
    aciklama: "Birden fazla kurban/hisse",
  },
  Şüpheli: {
    ad: "Şüpheli",
    renk: "bg-red-100 text-red-800 border-red-300",
    ikon: "⚠️",
    aciklama: "Ödeme problemi yaşanmış",
  },
};

export const ETIKET_KEYS = Object.keys(MUSTERI_ETIKETLERI);

/** DB'deki JSON string'i array'e çevir. Bozuk/eski format için fallback. */
export function etiketleriParse(metin: string | null | undefined): string[] {
  if (!metin) return [];
  try {
    const j = JSON.parse(metin) as unknown;
    if (Array.isArray(j)) {
      return j.filter((s): s is string => typeof s === "string");
    }
  } catch {
    // Virgülle ayrılmış eski format
    return metin
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  return [];
}

/** Array → JSON string (DB'ye yazım) */
export function etiketleriSerialize(etiketler: ReadonlyArray<string>): string {
  return JSON.stringify(etiketler);
}
