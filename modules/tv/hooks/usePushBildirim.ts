"use client";

import { useCallback, useEffect, useState } from "react";

export type BildirimDestek = "bilinmiyor" | "destek-yok" | "izin-yok" | "izin-var";

/**
 * Browser Notification API yöneticisi (Web Push paketi yok).
 * Sayfa açıkken bildirim gösterir. Polling ile yeni bildirimleri çeker.
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
   * Kullanıcı tıkladığında izin iste + DB'ye endpoint kaydet.
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

      // Endpoint olarak deterministik bir kimlik üret (cuid yok burada)
      const endpoint = `local-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

      try {
        await fetch("/api/tv/push-abonelik", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint,
            musteriId: opts?.musteriId ?? null,
            kurbanId: opts?.kurbanId ?? null,
            userAgent: navigator.userAgent.slice(0, 200),
          }),
        });
        // Endpoint'i localStorage'a kaydet (yeniden bağlanma için)
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

  /**
   * Lokal bildirim göster (sayfa açıkken).
   */
  const goster = useCallback(
    (baslik: string, mesaj: string, url?: string) => {
      if (destek !== "izin-var") return;
      try {
        const n = new Notification(baslik, {
          body: mesaj,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: "kurban-bildirim",
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
