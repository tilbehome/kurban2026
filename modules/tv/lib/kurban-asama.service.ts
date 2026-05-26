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
import { DURUM_VARSAYILAN_YUZDE } from "./asama-grup";

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
  const simdi = new Date();
  const asamaDegisti = eskiDurum !== yeniDurum;

  // Otomatik aşama metni (override edilmediyse)
  const asama =
    params.asama !== undefined
      ? params.asama
      : DURUMA_GORE_ASAMA[yeniDurum] ?? mevcut.asama;

  // Otomatik ilerleme yüzdesi: aşama değişiminde varsayılan atanır,
  // params.ilerlemeYuzde verilirse o öncelikli (manuel override).
  const otomatikYuzde = DURUM_VARSAYILAN_YUZDE[yeniDurum];

  // Kurban update data
  const kurbanData: Record<string, unknown> = {
    kesimDurumu: yeniDurum,
    asama,
  };
  if (params.operasyonSira !== undefined)
    kurbanData.operasyonSira = params.operasyonSira;
  if (params.ilerlemeYuzde !== undefined) {
    kurbanData.ilerlemeYuzde = params.ilerlemeYuzde;
  } else if (asamaDegisti && otomatikYuzde !== undefined) {
    kurbanData.ilerlemeYuzde = otomatikYuzde;
  }
  if (params.kalanSureDk !== undefined)
    kurbanData.kalanSureDk = params.kalanSureDk;
  if (params.toplamKg !== undefined) kurbanData.toplamKg = params.toplamKg;

  // Aşama değişiminde sayaç sıfırlanır (TV ekranında "bu aşamada ne kadar")
  if (asamaDegisti) {
    kurbanData.asamaBaslangic = simdi;
  }

  // Zaman damgaları
  if (yeniDurum === "kesimde" && !mevcut.kesimBaslama) {
    kurbanData.kesimBaslama = simdi;
  }
  if (
    (yeniDurum === "teslime_hazir" || yeniDurum === "tamamlandi") &&
    !mevcut.kesimBitis
  ) {
    kurbanData.kesimBitis = simdi;
  }

  // Hisseye senkronize edilecek alanlar
  const hisseUpdate: Record<string, unknown> = {
    kesimDurumu: yeniDurum,
    asama,
  };
  if (params.ilerlemeYuzde !== undefined) {
    hisseUpdate.ilerlemeYuzde = params.ilerlemeYuzde;
  } else if (asamaDegisti && otomatikYuzde !== undefined) {
    hisseUpdate.ilerlemeYuzde = otomatikYuzde;
  }
  if (params.kalanSureDk !== undefined)
    hisseUpdate.kalanSureDk = params.kalanSureDk;

  if (kurbanData.kesimBaslama) hisseUpdate.kesimBaslama = kurbanData.kesimBaslama;
  if (kurbanData.kesimBitis) hisseUpdate.kesimBitis = kurbanData.kesimBitis;

  // SPRINT-P2 İŞ 7: Paket etiketi mantıksal düzeltme.
  // "paketleme" aşamasında hisseler hâlâ paketlenmekte → "Paketleniyor"
  // "teslime_hazir" aşamasında paketleme bitmiş → "Paketlendi"
  if (yeniDurum === "paketleme") {
    hisseUpdate.paketDurumu = "Paketleniyor";
  } else if (yeniDurum === "teslime_hazir") {
    hisseUpdate.paketDurumu = "Paketlendi";
    hisseUpdate.teslimDurumu = "Hazır";
    if (!hisseUpdate.teslimNoktasi)
      hisseUpdate.teslimNoktasi = "Teslim Noktası 1";
  } else if (yeniDurum === "tamamlandi") {
    hisseUpdate.paketDurumu = "Teslim Edildi";
    hisseUpdate.teslimDurumu = "Teslim Edildi";
    hisseUpdate.teslimTarihi = new Date();
  }

  // SPRINT-P2 İŞ 5: Kurban + hisseler atomik tek transaction'da güncellenir.
  // Önceden iki ayrı write idi; ilkinden sonra hata olursa kurban yeni
  // durumda ama hisseler eski durumda kalabiliyordu (tutarsız state).
  const result = await prisma.$transaction(async (tx) => {
    await tx.kurban.update({
      where: { id: params.kurbanId },
      data: kurbanData,
    });

    return tx.hisse.updateMany({
      where: {
        kurbanId: params.kurbanId,
        silindiMi: false,
        musteriId: { not: null },
      },
      data: hisseUpdate,
    });
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
 *
 * SPRINT-P2 İŞ 6: Tüm sıra güncellemeleri atomik tek transaction'da.
 * Önceden for-loop içinde tek tek update'lerdi; ortadaki bir update
 * başarısız olursa yarı-uygulanmış sıra kalıyordu. Duplicate sıra
 * numarası da kontrol edilir.
 */
export async function siralamaGuncelle(
  sira: Array<{ kurbanId: string; operasyonSira: number }>,
): Promise<number> {
  if (sira.length === 0) return 0;

  const uniqSira = new Set(sira.map((x) => x.operasyonSira));
  if (uniqSira.size !== sira.length) {
    throw new Error("Operasyon sıra numaraları tekrar edemez");
  }
  const uniqKurban = new Set(sira.map((x) => x.kurbanId));
  if (uniqKurban.size !== sira.length) {
    throw new Error("Aynı kurban birden fazla kez listelenemez");
  }

  await prisma.$transaction(
    sira.map((item) =>
      prisma.kurban.update({
        where: { id: item.kurbanId },
        data: { operasyonSira: item.operasyonSira },
      }),
    ),
  );

  return sira.length;
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
