/**
 * Müşteri son aktivite servisi — Genel Bakış tab'ı için.
 *
 * SERVER-ONLY: prisma kullanır. Client component'lerden ASLA import edilmez
 * (yoksa PrismaClient browser bundle hatası verir).
 *
 * Pure utility'ler ve tipler `./aktivite-format` dosyasında.
 */

import { prisma } from "@/shared/lib/prisma";
import {
  aktiviteTipTan,
  aktiviteBaslikTan,
  aktiviteDetayKisalt,
  type AktiviteSatir,
} from "./aktivite-format";

// Re-export — server tarafı bu service.ts'i import etmeye devam edebilir
export type { AktiviteSatir } from "./aktivite-format";
export {
  etiketleriParse,
  etiketleriSerilizle,
} from "./aktivite-format";

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
  const hisseler = await prisma.hisse.findMany({
    where: { musteriId, silindiMi: false },
    select: { id: true },
  });
  const hisseIds = hisseler.map((h) => h.id);

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
    tip: aktiviteTipTan(a.eylem),
    baslik: aktiviteBaslikTan(a.eylem, a.model),
    detay: a.detaylar ? aktiviteDetayKisalt(a.detaylar) : undefined,
    tarih: a.createdAt,
    kullaniciAd: a.kullanici?.adSoyad,
  }));
}
