/**
 * Müşteri son aktivite servisi — Genel Bakış tab'ı için.
 *
 * Audit log'dan ve ödemelerden son N aktiviteyi birleştirir.
 */

import { prisma } from "@/shared/lib/prisma";

export interface AktiviteSatir {
  id: string;
  tip: "tahsilat" | "hisse-atama" | "not" | "etiket" | "guncelle" | "diger";
  baslik: string;
  detay?: string;
  tarih: Date;
  kullaniciAd?: string;
}

/**
 * Müşteri için son aktiviteleri timeline'a uygun olarak döner.
 *
 * - Audit log kayıtlarından (kayitId === musteriId)
 * - Müşteriye ait hisseler için (model=Hisse, kayitId hisse id)
 * - Ödemelerden (hisseId üzerinden)
 *
 * MIMARI §12 uyumlu.
 */
export async function musteriAktiviteleri(
  musteriId: string,
  limit = 5,
): Promise<AktiviteSatir[]> {
  // Önce müşteriye ait hisse id'lerini al
  const hisseler = await prisma.hisse.findMany({
    where: { musteriId, silindiMi: false },
    select: { id: true },
  });
  const hisseIds = hisseler.map((h) => h.id);

  // Audit log: musteri kayıtları + bu müşteriye ait hisse/ödeme kayıtları
  const odemeIds = await prisma.odeme.findMany({
    where: { hisseId: { in: hisseIds }, iptal: false, silindiMi: false },
    select: { id: true },
  });

  const auditlar = await prisma.auditLog.findMany({
    where: {
      OR: [
        { model: "Musteri", kayitId: musteriId },
        { model: "Hisse", kayitId: { in: hisseIds } },
        { model: "Odeme", kayitId: { in: odemeIds.map((o) => o.id) } },
        { model: "Not", kayitId: musteriId },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { kullanici: { select: { adSoyad: true } } },
  });

  return auditlar.map((a) => ({
    id: a.id,
    tip: tipTan(a.eylem),
    baslik: baslikTan(a.eylem, a.model),
    detay: a.detaylar ? kisaltDetay(a.detaylar) : undefined,
    tarih: a.createdAt,
    kullaniciAd: a.kullanici?.adSoyad,
  }));
}

function tipTan(eylem: string): AktiviteSatir["tip"] {
  if (eylem === "odeme") return "tahsilat";
  if (eylem === "hisse-atama") return "hisse-atama";
  if (eylem === "olustur" || eylem === "guncelle") return "guncelle";
  if (eylem === "not-eklendi") return "not";
  if (eylem === "etiket") return "etiket";
  return "diger";
}

function baslikTan(eylem: string, model: string | null): string {
  if (eylem === "odeme") return "Tahsilat alındı";
  if (eylem === "hisse-atama") return "Hisse atandı";
  if (eylem === "olustur" && model === "Musteri") return "Müşteri oluşturuldu";
  if (eylem === "olustur" && model === "Not") return "Not eklendi";
  if (eylem === "guncelle" && model === "Musteri") return "Müşteri güncellendi";
  if (eylem === "sil" && model === "Not") return "Not silindi";
  return `${model ?? "Sistem"} - ${eylem}`;
}

function kisaltDetay(detaylar: string): string | undefined {
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
