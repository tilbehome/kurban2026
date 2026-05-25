"use client";

import { useCallback, useEffect, useState } from "react";

export type BildirimDestek = "bilinmiyor" | "destek-yok" | "izin-yok" | "izin-var";

/**
 * Push bildirim yöneticisi — FAZ 9.6 PWA destekli.
 *
 * Akış:
 *  1. Notification.requestPermission() ile izin
 *  2. Service Worker hazır olunca PushManager.subscribe() ile gerçek abonelik
 *  3. Endpoint + p256dh + auth → /api/tv/push-abonelik
 *  4. Server web-push ile arka plan bildirim gönderebilir
 *
 * Fallback: SW yoksa eski davranış (Notification API + local endpoint).
 */
export function usePushBildirim() {
  const [destek, setDestek] = useState<BildirimDestek>("bilinmiyor");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setDestek("destek-yok");
      return;
    }
    if (Notification.permission === "granted") setDestek("izin-var");
    else if (Notification.permission === "denied") setDestek("izin-yok");
    else setDestek("izin-yok");
  }, []);

  /**
   * Kullanıcı tıkladığında izin iste + (varsa) SW push abonelik + DB kayıt.
   */
  const izinIste = useCallback(
    async (opts?: { musteriId?: string | null; kurbanId?: string | null }) => {
      if (typeof window === "undefined" || !("Notification" in window)) {
        return false;
      }
      const sonuc = await Notification.requestPermission();
      if (sonuc !== "granted") {
        setDestek("izin-yok");
        return false;
      }
      setDestek("izin-var");

      // Gerçek SW push subscription (varsa)
      let endpoint: string;
      let p256dh = "";
      let auth = "";

      const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      const swDestek =
        "serviceWorker" in navigator && "PushManager" in window;

      if (swDestek && vapidPublic) {
        try {
          const reg = await navigator.serviceWorker.ready;
          // Var olan aboneliği kontrol et
          let subscription = await reg.pushManager.getSubscription();
          if (!subscription) {
            subscription = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              // TS 5+ ArrayBuffer strict tip uyarısı — BufferSource cast
              applicationServerKey: urlBase64ToUint8Array(
                vapidPublic,
              ) as BufferSource,
            });
          }
          const json = subscription.toJSON();
          endpoint = json.endpoint ?? "";
          p256dh = json.keys?.p256dh ?? "";
          auth = json.keys?.auth ?? "";
        } catch (e) {
          console.warn(
            "[push] SW subscribe başarısız, fallback local endpoint:",
            e,
          );
          endpoint = lokalEndpoint();
        }
      } else {
        // Fallback — SW veya VAPID yoksa
        endpoint = lokalEndpoint();
      }

      try {
        await fetch("/api/tv/push-abonelik", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint,
            p256dh,
            auth,
            musteriId: opts?.musteriId ?? null,
            kurbanId: opts?.kurbanId ?? null,
            userAgent: navigator.userAgent.slice(0, 200),
          }),
        });
        try {
          localStorage.setItem("tilbe.tv.pushEndpoint", endpoint);
        } catch {
          // sessiz geç
        }
      } catch {
        // ağ hatası — bildirim yine de çalışır (sadece DB log polling olmaz)
      }
      return true;
    },
    [],
  );

  /** Sayfa açıkken lokal bildirim göster */
  const goster = useCallback(
    (baslik: string, mesaj: string, url?: string) => {
      if (destek !== "izin-var") return;
      try {
        const n = new Notification(baslik, {
          body: mesaj,
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-96.png",
          tag: "tilbe-bildirim",
        });
        if (url) {
          n.onclick = () => {
            window.focus();
            window.location.href = url;
          };
        }
      } catch {
        // bazı tarayıcılarda blok edilebilir
      }
    },
    [destek],
  );

  return { destek, izinIste, goster };
}

// =============================================================================
// İç yardımcılar
// =============================================================================

function lokalEndpoint(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** VAPID public key (base64url) → Uint8Array */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const cleaned = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(cleaned);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
