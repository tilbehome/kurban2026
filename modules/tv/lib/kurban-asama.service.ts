/**
 * Kurban aşama yönetimi — FAZ 9.5.
 *
 * MANTIK:
 *  - Tartıma kadar: Kurban.kesimDurumu değişir, tüm hisseleri de senkronize edilir
 *  - Paketleme'den sonra: HER HİSSE ayrı yönetilir (hisseAsamaGuncelle)
 *
 * Otomatik tamamlayıcılar:
 *  - "kesimde" → kesimBaslama = now
 *  - "teslime_hazir" → kesimBitis = now, Hisse.paketDurumu = "Teslim Hazır"
 *  - "tamamlandi" → tüm hisselerin paketDurumu = "Teslim Edildi"
 */

import { prisma } from "@/shared/lib/prisma";
import {
  DURUMA_GORE_ASAMA,
  sonrakiAsama,
  type KurbanKesimDurumu,
} from "./asama-akisi";

export interface AsamaGuncelleParams {
  kurbanId: string;
  yeniDurum: KurbanKesimDurumu;
  operasyonSira?: number | null;
  asama?: string | null;
  ilerlemeYuzde?: number;
  kalanSureDk?: number | null;
  toplamKg?: number | null;
}

/**
 * Kurban aşamasını günceller. Tartıma kadar tüm hisseleri senkronize eder.
 */
export async function kurbanAsamaGuncelle(
  params: AsamaGuncelleParams,
): Promise<{
  eskiDurum: KurbanKesimDurumu;
  yeniDurum: KurbanKesimDurumu;
  etkilenenHisse: number;
}> {
  const mevcut = await prisma.kurban.findUnique({
    where: { id: params.kurbanId },
    select: {
      id: true,
      kesimDurumu: true,
      kesimBaslama: true,
      kesimBitis: true,
      asama: true,
    },
  });
  if (!mevcut) {
    throw new Error("Kurban bulunamadı");
  }

  const eskiDurum = mevcut.kesimDurumu as KurbanKesimDurumu;
  const yeniDurum = params.yeniDurum;

  // Otomatik aşama metni (override edilmediyse)
  const asama =
    params.asama !== undefined
      ? params.asama
      : DURUMA_GORE_ASAMA[yeniDurum] ?? mevcut.asama;

  // Kurban update data
  const kurbanData: Record<string, unknown> = {
    kesimDurumu: yeniDurum,
    asama,
  };
  if (params.operasyonSira !== undefined)
    kurbanData.operasyonSira = params.operasyonSira;
  if (params.ilerlemeYuzde !== undefined)
    kurbanData.ilerlemeYuzde = params.ilerlemeYuzde;
  if (params.kalanSureDk !== undefined)
    kurbanData.kalanSureDk = params.kalanSureDk;
  if (params.toplamKg !== undefined) kurbanData.toplamKg = params.toplamKg;

  // Zaman damgaları
  if (yeniDurum === "kesimde" && !mevcut.kesimBaslama) {
    kurbanData.kesimBaslama = new Date();
  }
  if (
    (yeniDurum === "teslime_hazir" || yeniDurum === "tamamlandi") &&
    !mevcut.kesimBitis
  ) {
    kurbanData.kesimBitis = new Date();
  }

  // Kurban kaydet
  await prisma.kurban.update({
    where: { id: params.kurbanId },
    data: kurbanData,
  });

  // Hisselere senkronize et (tartıma kadar tüm hisseler aynı durum)
  const hisseUpdate: Record<string, unknown> = {
    kesimDurumu: yeniDurum,
    asama,
  };
  if (params.ilerlemeYuzde !== undefined)
    hisseUpdate.ilerlemeYuzde = params.ilerlemeYuzde;
  if (params.kalanSureDk !== undefined)
    hisseUpdate.kalanSureDk = params.kalanSureDk;

  if (kurbanData.kesimBaslama) hisseUpdate.kesimBaslama = kurbanData.kesimBaslama;
  if (kurbanData.kesimBitis) hisseUpdate.kesimBitis = kurbanData.kesimBitis;

  // Paket alanlarını otomatik tetikle
  if (yeniDurum === "paketleme") {
    hisseUpdate.paketDurumu = "Paketlendi";
  } else if (yeniDurum === "teslime_hazir") {
    hisseUpdate.paketDurumu = "Teslim Hazır";
    hisseUpdate.teslimDurumu = "Hazır";
    if (!hisseUpdate.teslimNoktasi)
      hisseUpdate.teslimNoktasi = "Teslim Noktası 1";
  } else if (yeniDurum === "tamamlandi") {
    hisseUpdate.paketDurumu = "Teslim Edildi";
    hisseUpdate.teslimDurumu = "Teslim Edildi";
    hisseUpdate.teslimTarihi = new Date();
  }

  const result = await prisma.hisse.updateMany({
    where: {
      kurbanId: params.kurbanId,
      silindiMi: false,
      musteriId: { not: null },
    },
    data: hisseUpdate,
  });

  return {
    eskiDurum,
    yeniDurum,
    etkilenenHisse: result.count,
  };
}

/**
 * Kurban'ı bir sonraki aşamaya geçir (otomatik bul).
 */
export async function kurbanSonrakiAsama(
  kurbanId: string,
): Promise<{ eskiDurum: KurbanKesimDurumu; yeniDurum: KurbanKesimDurumu } | null> {
  const k = await prisma.kurban.findUnique({
    where: { id: kurbanId },
    select: { kesimDurumu: true },
  });
  if (!k) return null;
  const eski = k.kesimDurumu as KurbanKesimDurumu;
  const yeni = sonrakiAsama(eski);
  if (!yeni) return null;

  const sonuc = await kurbanAsamaGuncelle({
    kurbanId,
    yeniDurum: yeni,
  });
  return { eskiDurum: sonuc.eskiDurum, yeniDurum: sonuc.yeniDurum };
}

/**
 * Sıraya alınan kurbanların operasyon sırasını günceller.
 * Drag-drop ile kullanılır.
 */
export async function siralamaGuncelle(
  sira: Array<{ kurbanId: string; operasyonSira: number }>,
): Promise<number> {
  let etkilenenSayi = 0;
  for (const item of sira) {
    await prisma.kurban.update({
      where: { id: item.kurbanId },
      data: { operasyonSira: item.operasyonSira },
    });
    etkilenenSayi++;
  }
  return etkilenenSayi;
}

/**
 * Bir hissenin paket/teslim durumunu günceller (tartım sonrası bireysel).
 */
export async function hissePaketGuncelle(
  hisseId: string,
  data: {
    paketDurumu?: string;
    paketKg?: number | null;
    teslimNoktasi?: string | null;
    teslimDurumu?: string | null;
    teslimTarihi?: Date | null;
  },
): Promise<void> {
  await prisma.hisse.update({
    where: { id: hisseId },
    data,
  });
}
