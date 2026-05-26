/**
 * Sidebar bildirim sayıları — borçlu, boş hisse, vekalet bekleyen vs.
 *
 * KAYNAK: tek-DB sorgu (parallel), API'den çağırılır.
 * Cache: client-side 30 saniye (server-side cache yok — anlık veri).
 */

import { prisma } from "@/shared/lib/prisma";
import type { BildirimAnahtari } from "@/shared/lib/sidebar-config";

export type SidebarBildirimleri = Record<BildirimAnahtari, number>;

/**
 * Tüm sidebar bildirim sayılarını paralel hesapla.
 */
export async function sidebarBildirimleri(): Promise<SidebarBildirimleri> {
  const [
    borcluSayisi,
    bosHisseSayisi,
    eksikVekaletSayisi,
    bekleyenMesajSayisi,
    kasaKapanisAcik,
    kritikBorcSayisi,
  ] = await Promise.all([
    borcluHesapla(),
    bosHisseHesapla(),
    eksikVekaletHesapla(),
    bekleyenMesajHesapla(),
    kasaKapanisUyari(),
    kritikBorcHesapla(),
  ]);

  return {
    borclu: borcluSayisi,
    bosHisse: bosHisseSayisi,
    eksikVekalet: eksikVekaletSayisi,
    bekleyenMesaj: bekleyenMesajSayisi,
    kasaUyari: kasaKapanisAcik ? 1 : 0,
    kritikBorc: kritikBorcSayisi,
  };
}

/**
 * Borçlu müşteri sayısı:
 *  - silinmemiş aktif hisseleri olan
 *  - tahsilatı hisse fiyatından az olan müşteri
 */
async function borcluHesapla(): Promise<number> {
  const musteriler = await prisma.musteri.findMany({
    where: { silindiMi: false },
    select: {
      id: true,
      hisseler: {
        where: { silindiMi: false, musteriId: { not: null } },
        select: {
          hisseFiyati: true,
          odemeler: {
            where: { iptal: false },
            select: { toplamTutar: true },
          },
        },
      },
    },
  });

  let borclu = 0;
  for (const m of musteriler) {
    if (m.hisseler.length === 0) continue;
    const bedel = m.hisseler.reduce((s, h) => s + h.hisseFiyati, 0);
    const odenen = m.hisseler.reduce(
      (s, h) => s + h.odemeler.reduce((a, o) => a + o.toplamTutar, 0),
      0,
    );
    if (bedel - odenen > 0.01) borclu++;
  }
  return borclu;
}

/**
 * Boş hisse: musteriId === null olan aktif hisseler.
 */
async function bosHisseHesapla(): Promise<number> {
  return prisma.hisse.count({
    where: { silindiMi: false, musteriId: null },
  });
}

/**
 * Vekalet eksik: müşterisi var ama vekalet yüklenmemiş hisseler.
 */
async function eksikVekaletHesapla(): Promise<number> {
  return prisma.hisse.count({
    where: {
      silindiMi: false,
      musteriId: { not: null },
      vekalet: null,
    },
  });
}

/**
 * Bekleyen mesaj — WhatsApp tablosu henüz yok, 0 dön.
 * Faz 5+ için placeholder.
 */
async function bekleyenMesajHesapla(): Promise<number> {
  return 0;
}

/**
 * Kasa kapanış uyarısı — son 24 saat içinde kapanış yapılmamışsa true.
 * Şimdilik basit: hiçbir AuditLog kayıt yoksa false.
 */
async function kasaKapanisUyari(): Promise<boolean> {
  // Gerçek kontrol Faz 6'da gelir; şimdilik false.
  return false;
}

/**
 * Kritik borç: 30 günden fazla bekleyen borçlu sayısı.
 * Şimdilik basit yerine 0 — Faz 6'da gerçek hesap.
 */
async function kritikBorcHesapla(): Promise<number> {
  return 0;
}

// Görsel format helper'ı `shared/lib/sidebar-bildirim-format.ts`'e taşındı —
// bu modülde prisma import'u olduğu için client component'lerin import etmesi
// browser bundle'a prisma'yı çekiyordu. Eski yer için re-export tutulmuyor;
// kullanan yerler doğrudan sidebar-bildirim-format'tan import etmeli.
