"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

/**
 * Bayram sayacı — alt panelde duygusal bağ kurar.
 * Kurban Bayramı: 5-7 Haziran 2026 (1. gün = 5 Haziran)
 */
const BAYRAM_TARIHI = new Date("2026-06-05T00:00:00+03:00");

interface SidebarBayramSayaciProps {
  daraltilmis: boolean;
}

export function SidebarBayramSayaci({
  daraltilmis,
}: SidebarBayramSayaciProps) {
  const [kalanGun, setKalanGun] = useState<number | null>(null);

  useEffect(() => {
    function hesapla() {
      const fark = BAYRAM_TARIHI.getTime() - Date.now();
      setKalanGun(Math.max(0, Math.ceil(fark / (1000 * 60 * 60 * 24))));
    }
    hesapla();
    // Her gün gece yarısı güncellenecek diye 1 saatte bir hesapla
    const i = setInterval(hesapla, 60 * 60 * 1000);
    return () => clearInterval(i);
  }, []);

  if (kalanGun === null) return null;

  const bayramGectiMi = kalanGun === 0;

  if (daraltilmis) {
    return (
      <div className="border-sidebar-border flex flex-col items-center gap-0.5 border-t px-1 py-3">
        <Sparkles size={14} className="text-primary" />
        <div className="text-foreground text-sm leading-none font-bold">
          {bayramGectiMi ? "🎉" : kalanGun}
        </div>
        <div className="text-muted-foreground text-[9px] leading-none">
          {bayramGectiMi ? "" : "gün"}
        </div>
      </div>
    );
  }

  return (
    <div className="from-primary/5 to-primary/10 border-sidebar-border flex flex-col items-center gap-1 border-t bg-linear-to-b px-3 py-3 text-center">
      {bayramGectiMi ? (
        <>
          <div className="text-lg font-bold">🎉 Bayramınız Mübarek</div>
          <div className="text-muted-foreground text-[11px]">
            Hayırlı bayramlar
          </div>
        </>
      ) : (
        <>
          <div className="text-muted-foreground flex items-center gap-1 text-[10px] font-medium tracking-wider uppercase">
            <Sparkles size={10} className="text-primary" />
            Kurban Bayramına
          </div>
          <div className="text-primary text-2xl leading-none font-extrabold">
            {kalanGun}
          </div>
          <div className="text-muted-foreground text-[11px] leading-tight">
            gün kaldı
          </div>
          <div className="text-muted-foreground/70 mt-0.5 text-[10px]">
            5 Haziran 2026
          </div>
        </>
      )}
    </div>
  );
}
