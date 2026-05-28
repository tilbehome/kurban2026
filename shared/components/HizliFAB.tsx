"use client";

/**
 * Mobil hızlı işlem FAB — sağ alt köşede yüzen buton.
 *
 * Tıklanınca 3 hızlı kısayol açar:
 *   - Yeni Müşteri (en sık ihtiyaç — bayram günü kayıt)
 *   - Hızlı Tahsilat (saha personelinin ana iş akışı)
 *   - Müşteri Ara (borçlu/teslim alacak müşteriyi bul)
 *
 * Sadece <lg ekranlarda görünür. Alt navigasyonun ÜZERİNDE konumlanır
 * (bottom-20 + safe-area ile).
 *
 * İkonlar: lucide-react temel set (Plus, UserPlus, Wallet, Search, X).
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus, Search, ShoppingCart, UserPlus, Wallet, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface FabAksiyon {
  ad: string;
  yol: string;
  ikon: typeof Plus;
  /** Buton rengi (Tailwind) */
  arkaRenk: string;
}

const AKSIYONLAR: ReadonlyArray<FabAksiyon> = [
  {
    ad: "Saha Satış",
    yol: "/saha-satis",
    ikon: ShoppingCart,
    arkaRenk: "bg-orange-600 hover:bg-orange-700",
  },
  {
    ad: "Hızlı Tahsilat",
    yol: "/tahsilat",
    ikon: Wallet,
    arkaRenk: "bg-emerald-600 hover:bg-emerald-700",
  },
  {
    ad: "Yeni Müşteri",
    yol: "/musteriler/yeni",
    ikon: UserPlus,
    arkaRenk: "bg-blue-600 hover:bg-blue-700",
  },
  {
    ad: "Müşteri Ara",
    yol: "/musteriler",
    ikon: Search,
    arkaRenk: "bg-slate-700 hover:bg-slate-800",
  },
];

export function HizliFAB() {
  const [acik, setAcik] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dışarı tıklanınca kapat
  useEffect(() => {
    if (!acik) return;
    function disarTik(e: MouseEvent | TouchEvent) {
      const node = containerRef.current;
      if (!node) return;
      if (e.target instanceof Node && !node.contains(e.target)) {
        setAcik(false);
      }
    }
    document.addEventListener("pointerdown", disarTik);
    return () => document.removeEventListener("pointerdown", disarTik);
  }, [acik]);

  // ESC ile kapat
  useEffect(() => {
    if (!acik) return;
    function escKapat(e: KeyboardEvent) {
      if (e.key === "Escape") setAcik(false);
    }
    document.addEventListener("keydown", escKapat);
    return () => document.removeEventListener("keydown", escKapat);
  }, [acik]);

  return (
    <div
      ref={containerRef}
      className="fixed right-4 z-50 flex flex-col items-end gap-3 lg:hidden"
      style={{
        bottom: `calc(env(safe-area-inset-bottom, 0px) + 5rem)`,
      }}
    >
      {/* Aksiyon mini-butonları (yukarıdan aşağıya görünür sırayla) */}
      {acik &&
        AKSIYONLAR.map((a) => {
          const Icon = a.ikon;
          return (
            <Link
              key={a.yol}
              href={a.yol}
              onClick={() => setAcik(false)}
              className="flex items-center gap-2"
            >
              <span className="bg-background rounded-full border px-3 py-1 text-xs font-semibold shadow-md">
                {a.ad}
              </span>
              <span
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform active:scale-95",
                  a.arkaRenk,
                )}
              >
                <Icon size={20} />
              </span>
            </Link>
          );
        })}

      {/* Ana FAB */}
      <button
        type="button"
        onClick={() => setAcik((v) => !v)}
        aria-label={acik ? "Hızlı işlem menüsünü kapat" : "Hızlı işlem menüsü"}
        aria-expanded={acik}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-all active:scale-95",
          acik
            ? "bg-slate-700 hover:bg-slate-800 rotate-45"
            : "bg-orange-500 hover:bg-orange-600",
        )}
      >
        {acik ? <X size={26} /> : <Plus size={28} />}
      </button>
    </div>
  );
}
