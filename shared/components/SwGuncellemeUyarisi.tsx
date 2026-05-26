"use client";

/**
 * Service Worker güncelleme uyarısı — SPRINT-P1 İŞ 6.
 *
 * - `/sw-version.json`'u periyodik olarak (5 dk) kontrol eder
 * - Version alanı ilk yüklemedeki değerden farklılaşırsa toast gösterir
 * - Kullanıcı "Şimdi Yenile" derse sayfa reload edilir, yeni SW devreye girer
 *
 * Not: next-pwa zaten skipWaiting yapıyor, ama kullanıcı eski sürümde
 * takılı kalabilir (özellikle PWA yüklü cihazlarda). Bu kart açıkça uyarır.
 */

import { useEffect, useRef } from "react";
import { toast } from "sonner";

const KONTROL_MS = 5 * 60 * 1000; // 5 dakika
const TOAST_ID = "sw-guncelleme";

interface SwVersion {
  version: string;
  buildTime?: string;
}

async function versionGetir(): Promise<string | null> {
  try {
    const r = await fetch("/sw-version.json", { cache: "no-store" });
    if (!r.ok) return null;
    const j = (await r.json()) as SwVersion;
    return j.version ?? null;
  } catch {
    return null;
  }
}

export function SwGuncellemeUyarisi() {
  const ilkVersionRef = useRef<string | null>(null);
  const uyarildiRef = useRef(false);

  useEffect(() => {
    let iptal = false;

    async function ilkKurulum() {
      const v = await versionGetir();
      if (iptal) return;
      ilkVersionRef.current = v;
    }

    async function kontrol() {
      if (uyarildiRef.current) return;
      const yeni = await versionGetir();
      if (iptal || !yeni) return;
      if (
        ilkVersionRef.current &&
        yeni !== ilkVersionRef.current
      ) {
        uyarildiRef.current = true;
        toast.info("Yeni sürüm hazır", {
          id: TOAST_ID,
          description:
            "Uygulamanın yeni bir sürümü yüklendi. Yenilemek için butona tıklayın.",
          duration: Infinity,
          action: {
            label: "Şimdi Yenile",
            onClick: () => {
              // SW'yi update et, ardından reload
              if ("serviceWorker" in navigator) {
                navigator.serviceWorker.getRegistration().then((reg) => {
                  reg?.update().finally(() => {
                    window.location.reload();
                  });
                });
              } else {
                window.location.reload();
              }
            },
          },
        });
      }
    }

    ilkKurulum();
    const i = setInterval(kontrol, KONTROL_MS);

    // Sekme öne gelince de bir kez kontrol et
    function visibilityChange() {
      if (document.visibilityState === "visible") kontrol();
    }
    document.addEventListener("visibilitychange", visibilityChange);

    return () => {
      iptal = true;
      clearInterval(i);
      document.removeEventListener("visibilitychange", visibilityChange);
    };
  }, []);

  return null;
}
