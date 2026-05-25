"use client";

import { WifiOff, RefreshCw } from "lucide-react";

/**
 * Offline fallback — internet bağlantısı yokken Service Worker bu sayfayı gösterir.
 * Workbox `fallbacks.document` ile yapılandırıldı (next.config.ts).
 */
export default function OfflineSayfa() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        {/* Logo + ikon */}
        <div className="from-red-600 to-red-700 ring-red-300/40 mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-linear-to-br text-white shadow-2xl ring-4">
          <WifiOff size={42} strokeWidth={1.5} />
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          İnternet Bağlantısı Yok
        </h1>
        <p className="mt-3 text-base text-slate-600">
          Şu an çevrimdışısınız. İnternet bağlantısı geri geldiğinde sayfa
          otomatik yenilenecek.
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="bg-red-600 hover:bg-red-700 mt-8 flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-white shadow-md transition-colors"
        >
          <RefreshCw size={16} />
          Tekrar Dene
        </button>

        <p className="mt-12 text-xs text-slate-400">
          TilbeCore Kurban 2026 · Adabereket Hayvancılık
        </p>
      </div>
    </div>
  );
}
