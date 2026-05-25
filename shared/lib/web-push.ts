/**
 * Web Push helper — VAPID + arka plan bildirim.
 *
 * FAZ 9.6 — sayfa kapalıyken bile bildirim gelir.
 *
 * NOT: VAPID anahtarları olmadan modül sessizce devre dışı kalır
 *      (foreground polling FAZ 9.5'teki gibi çalışmaya devam eder).
 */

import webpush from "web-push";
import { prisma } from "@/shared/lib/prisma";

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@tilbehome.com";

let vapidYukluMu = false;
if (VAPID_PUBLIC && VAPID_PRIVATE) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
    vapidYukluMu = true;
  } catch (e) {
    console.error("[web-push] VAPID yapılandırma hatası:", e);
  }
}

export function vapidHazirMi(): boolean {
  return vapidYukluMu;
}

export interface PushPayload {
  baslik: string;
  govde: string;
  url?: string;
  etiket?: string;
  gorsel?: string;
  onemli?: boolean;
  bildirimId?: string;
  eylemler?: Array<{ action: string; title: string; icon?: string }>;
}

export interface PushSonuc {
  basarili: boolean;
  hata?: string;
}

/** Tek abonelige push gönder */
export async function pushGonder(
  abonelikId: string,
  payload: PushPayload,
  kullaniciId?: string,
): Promise<PushSonuc> {
  if (!vapidYukluMu) {
    return { basarili: false, hata: "VAPID anahtarları yapılandırılmamış" };
  }

  const abonelik = await prisma.pushAbonelik.findUnique({
    where: { id: abonelikId },
  });
  if (!abonelik) {
    return { basarili: false, hata: "Abonelik bulunamadı" };
  }
  if (!abonelik.aktif) {
    return { basarili: false, hata: "Abonelik pasif" };
  }
  if (!abonelik.p256dh || !abonelik.auth) {
    return {
      basarili: false,
      hata: "Abonelikte p256dh/auth eksik (eski kayıt)",
    };
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: abonelik.endpoint,
        keys: {
          p256dh: abonelik.p256dh,
          auth: abonelik.auth,
        },
      },
      JSON.stringify(payload),
    );

    await prisma.bildirimLog.create({
      data: {
        musteriId: abonelik.musteriId,
        abonelikId,
        kullaniciId,
        kanal: "push",
        sablon: payload.etiket,
        baslik: payload.baslik,
        mesaj: payload.govde,
        durum: "gonderildi",
      },
    });

    return { basarili: true };
  } catch (hata: unknown) {
    const e = hata as { statusCode?: number; message?: string };
    // 410 Gone / 404 = abonelik geçersiz, pasif yap
    if (e.statusCode === 410 || e.statusCode === 404) {
      await prisma.pushAbonelik.update({
        where: { id: abonelikId },
        data: { aktif: false },
      });
    }

    await prisma.bildirimLog.create({
      data: {
        musteriId: abonelik.musteriId,
        abonelikId,
        kullaniciId,
        kanal: "push",
        sablon: payload.etiket,
        baslik: payload.baslik,
        mesaj: payload.govde,
        durum: "hata",
        hata: e.message ?? String(hata),
      },
    });

    return { basarili: false, hata: e.message ?? "Bilinmeyen hata" };
  }
}

/** Birden fazla abonelige paralel push */
export async function pushTopluGonder(
  abonelikIdleri: string[],
  payload: PushPayload,
  kullaniciId?: string,
): Promise<{ basarili: number; hata: number }> {
  const sonuclar = await Promise.allSettled(
    abonelikIdleri.map((id) => pushGonder(id, payload, kullaniciId)),
  );
  const basarili = sonuclar.filter(
    (s) => s.status === "fulfilled" && s.value.basarili,
  ).length;
  const hata = sonuclar.length - basarili;
  return { basarili, hata };
}

/**
 * Filtreyle topluca push gönder.
 * - musteriId verilirse o müşteriye ait tüm aktif abonelikler
 * - oturumKey verilirse (kurban takip) o kayda ait aboneliler
 * - hicbiri yoksa tüm aktif abonelikler (broadcast — admin yetki gerektirir)
 */
export async function pushFiltreliGonder(
  filtre: {
    musteriId?: string;
    oturumKey?: string;
    tumune?: boolean;
  },
  payload: PushPayload,
  kullaniciId?: string,
): Promise<{ basarili: number; hata: number; toplam: number }> {
  // GUARD: en az bir filtre VEYA tumune=true zorunlu — kazara broadcast engellendi
  if (!filtre.tumune && !filtre.musteriId && !filtre.oturumKey) {
    console.error(
      "[web-push] pushFiltreliGonder filtresiz çağrıldı — broadcast engellendi",
    );
    return { basarili: 0, hata: 0, toplam: 0 };
  }

  const where: Record<string, unknown> = { aktif: true };
  if (filtre.musteriId) where.musteriId = filtre.musteriId;
  if (filtre.oturumKey) where.oturumKey = filtre.oturumKey;

  const abonelikler = await prisma.pushAbonelik.findMany({
    where,
    select: { id: true },
  });
  if (abonelikler.length === 0) {
    return { basarili: 0, hata: 0, toplam: 0 };
  }
  const sonuc = await pushTopluGonder(
    abonelikler.map((a) => a.id),
    payload,
    kullaniciId,
  );
  return { ...sonuc, toplam: abonelikler.length };
}
