"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect } from "react";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { MUSTERI_TABS, type MusteriTabId } from "../types";

interface MusteriTabBarProps {
  /** Hangi tab'lar görünür (izinli olanlar) */
  gorunenTabIdleri: MusteriTabId[];
  /** Aktif tab (genel default) */
  aktif: MusteriTabId;
}

/**
 * Müşteri detay sayfasının tab bar'ı.
 *
 * URL state: ?tab=hisseler (paylaşılabilir link).
 * Klavye: 1-5 ile tab seçimi, Tab ile navigasyon.
 */
export function MusteriTabBar({ gorunenTabIdleri, aktif }: MusteriTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Klavye kısayolları (1-5)
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      const tusIdx = ["1", "2", "3", "4", "5"].indexOf(e.key);
      if (tusIdx === -1) return;
      const hedef = gorunenTabIdleri[tusIdx];
      if (!hedef) return;
      gitTab(hedef);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gorunenTabIdleri]);

  function gitTab(tabId: MusteriTabId): void {
    const yeni = new URLSearchParams(searchParams.toString());
    if (tabId === "genel") {
      yeni.delete("tab");
    } else {
      yeni.set("tab", tabId);
    }
    const url = `${pathname}${yeni.toString() ? `?${yeni}` : ""}`;
    router.replace(url, { scroll: false });
  }

  const gorunenTablar = MUSTERI_TABS.filter((t) =>
    gorunenTabIdleri.includes(t.id),
  );

  return (
    <nav className="border-b bg-white sticky top-0 z-10" aria-label="Müşteri detay sekmeleri">
      <div className="flex gap-1 overflow-x-auto px-4 sm:px-6">
        {gorunenTablar.map((tab, idx) => {
          const Icon =
            (Icons as unknown as Record<string, LucideIcon | undefined>)[tab.ikon] ??
            Icons.Square;
          const aktifMi = aktif === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => gitTab(tab.id)}
              className={cn(
                "flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors",
                aktifMi
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted",
              )}
              aria-current={aktifMi ? "page" : undefined}
              title={`${tab.ad} (kısayol: ${idx + 1})`}
            >
              <Icon size={16} />
              {tab.ad}
              <kbd className="bg-muted/70 text-muted-foreground hidden rounded border px-1 py-0.5 text-[10px] sm:inline">
                {idx + 1}
              </kbd>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
