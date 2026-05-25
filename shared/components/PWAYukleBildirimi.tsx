"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_RED_KEY = "tilbe.pwa.red";
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 saat

/**
 * Akıllı PWA install bildirimi.
 *
 * - beforeinstallprompt event'ini yakalar
 * - 24 saat içinde reddedildiyse tekrar gösterilmez (localStorage)
 * - Yüklendiyse otomatik gizlenir (appinstalled event)
 * - Body root'unda render edilir (AppShell'in dışında)
 */
export function PWAYukleBildirimi() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [gizli, setGizli] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 24 saat içinde reddetmiş mi?
    try {
      const red = localStorage.getItem(STORAGE_RED_KEY);
      if (red && Date.now() - parseInt(red, 10) < COOLDOWN_MS) {
        setGizli(true);
        return;
      }
    } catch {
      // localStorage yoksa devam
    }

    // Zaten yüklenmiş mi? (standalone mod)
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone
    ) {
      return;
    }

    const promptHandler = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
      setGizli(false);
    };

    const installedHandler = () => {
      setEvent(null);
      setGizli(true);
      try {
        localStorage.removeItem(STORAGE_RED_KEY);
      } catch {
        // sessiz geç
      }
    };

    window.addEventListener("beforeinstallprompt", promptHandler);
    window.addEventListener("appinstalled", installedHandler);
    return () => {
      window.removeEventListener("beforeinstallprompt", promptHandler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  if (!event || gizli) return null;

  const yukle = async () => {
    try {
      await event.prompt();
      const sonuc = await event.userChoice;
      if (sonuc.outcome === "accepted") {
        // Opsiyonel telemetri — başarısız olursa sessizce geç
        fetch("/api/audit/pwa-yukleme", { method: "POST" }).catch(() => {});
      } else {
        // İptal — cooldown başlat
        try {
          localStorage.setItem(STORAGE_RED_KEY, String(Date.now()));
        } catch {
          // sessiz geç
        }
      }
    } finally {
      setEvent(null);
      setGizli(true);
    }
  };

  const reddet = () => {
    try {
      localStorage.setItem(STORAGE_RED_KEY, String(Date.now()));
    } catch {
      // sessiz geç
    }
    setEvent(null);
    setGizli(true);
  };

  return (
    <div className="border-stone-200 fixed right-4 bottom-4 left-4 z-50 flex items-start gap-3 rounded-xl border bg-white p-4 shadow-2xl md:left-auto md:w-96">
      <Image
        src="/icons/icon-192.png"
        alt="Ada Bereket"
        width={48}
        height={48}
        className="shrink-0 rounded-lg"
        unoptimized
      />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-slate-900">
          Ada Bereket Uygulaması
        </div>
        <div className="text-muted-foreground mt-0.5 text-xs">
          Telefonunuza yükleyin — kurbanınızı kolayca takip edin
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={yukle}
            className="bg-red-600 hover:bg-red-700 flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors"
          >
            <Download size={13} />
            Yükle
          </button>
          <button
            type="button"
            onClick={reddet}
            className="hover:bg-stone-100 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors"
          >
            Daha Sonra
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={reddet}
        aria-label="Kapat"
        className="text-slate-400 hover:text-slate-600 shrink-0 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}
