/**
 * Müşteri aktivite / etiket pure utility'leri.
 *
 * CLIENT-SAFE — prisma içermez. Hem server hem client component'lerden
 * güvenle import edilebilir. aktivite.service.ts içindeki prisma import'unu
 * client bundle'a çekmemek için ayrıldı (PrismaClient browser hatası).
 */

export interface AktiviteSatir {
  id: string;
  tip: "tahsilat" | "hisse-atama" | "not" | "etiket" | "guncelle" | "diger";
  baslik: string;
  detay?: string;
  tarih: Date;
  kullaniciAd?: string;
}

/**
 * Müşteri etiketlerini JSON string'den array'e dönüştürür.
 */
export function etiketleriParse(etiketler: string | null): string[] {
  if (!etiketler) return [];
  try {
    const parsed = JSON.parse(etiketler) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((s): s is string => typeof s === "string");
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Etiket array'ini JSON string'e çevirir (DB'ye yazılırken).
 */
export function etiketleriSerilizle(etiketler: string[]): string {
  return JSON.stringify(etiketler.filter((e) => e.trim().length > 0));
}

/** Audit log "eylem" değerinden UI tip belirler. */
export function aktiviteTipTan(eylem: string): AktiviteSatir["tip"] {
  if (eylem === "odeme") return "tahsilat";
  if (eylem === "hisse-atama") return "hisse-atama";
  if (eylem === "olustur" || eylem === "guncelle") return "guncelle";
  if (eylem === "not-eklendi") return "not";
  if (eylem === "etiket") return "etiket";
  return "diger";
}

/** Audit log eylem + model kombinasyonundan Türkçe başlık. */
export function aktiviteBaslikTan(
  eylem: string,
  model: string | null,
): string {
  if (eylem === "odeme") return "Tahsilat alındı";
  if (eylem === "hisse-atama") return "Hisse atandı";
  if (eylem === "olustur" && model === "Musteri") return "Müşteri oluşturuldu";
  if (eylem === "olustur" && model === "Not") return "Not eklendi";
  if (eylem === "guncelle" && model === "Musteri") return "Müşteri güncellendi";
  if (eylem === "sil" && model === "Not") return "Not silindi";
  return `${model ?? "Sistem"} - ${eylem}`;
}

/** Audit log JSON detayını kısa metne çevirir. */
export function aktiviteDetayKisalt(detaylar: string): string | undefined {
  try {
    const obj = JSON.parse(detaylar) as Record<string, unknown>;
    if (typeof obj.toplam === "number") {
      return `${obj.toplam.toLocaleString("tr-TR")} ₺ (${obj.yontem ?? ""})`;
    }
    if (typeof obj.adSoyad === "string") {
      return String(obj.adSoyad);
    }
    return undefined;
  } catch {
    return undefined;
  }
}
