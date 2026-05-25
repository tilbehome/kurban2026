"use client";

import { useEffect, useState } from "react";
import { Sparkles, PartyPopper, Flame } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import {
  bayramTemasi,
  type BayramTemasi,
} from "@/modules/dashboard/lib/tema-tokens";

interface SidebarBayramSayaciProps {
  daraltilmis: boolean;
}

/**
 * Sidebar bayram sayacı — TASARIM-BRIEF dinamik tema'ya bağlı.
 * Bayrama 1-3 gün kala kırmızı uyarı, bayram günü yeşil kutlama.
 */
export function SidebarBayramSayaci({
  daraltilmis,
}: SidebarBayramSayaciProps) {
  const [tema, setTema] = useState<BayramTemasi | null>(null);
  const [kalanGun, setKalanGun] = useState<number | null>(null);

  useEffect(() => {
    function hesapla() {
      setTema(bayramTemasi());
      const fark =
        new Date("2026-05-27T00:00:00+03:00").getTime() - Date.now();
      setKalanGun(Math.max(0, Math.ceil(fark / (1000 * 60 * 60 * 24))));
    }
    hesapla();
    const i = setInterval(hesapla, 60 * 60 * 1000);
    return () => clearInterval(i);
  }, []);

  if (!tema || kalanGun === null) return null;

  const renkPaket = sayacRenkleri(tema.durum);

  if (daraltilmis) {
    return (
      <div
        className={cn(
          "border-sidebar-border flex flex-col items-center gap-0.5 border-t px-1 py-3 transition-colors",
          renkPaket.daraltlmisBg,
        )}
      >
        {tema.bayramMi ? (
          <PartyPopper size={14} className={renkPaket.ikonRenk} />
        ) : tema.durum === "cok-yakin" ? (
          <Flame size={14} className={cn(renkPaket.ikonRenk, "animate-pulse")} />
        ) : (
          <Sparkles size={14} className={renkPaket.ikonRenk} />
        )}
        <div className={cn("text-sm leading-none font-bold", renkPaket.sayiRenk)}>
          {tema.bayramMi ? "🎉" : kalanGun}
        </div>
        <div className="text-muted-foreground text-[9px] leading-none">
          {tema.bayramMi ? "" : "gün"}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-sidebar-border flex flex-col items-center gap-1 border-t bg-linear-to-b px-3 py-3 text-center transition-colors",
        renkPaket.genisBg,
      )}
    >
      {tema.bayramMi ? (
        <>
          <PartyPopper size={20} className="text-emerald-600" />
          <div className="text-base font-bold text-emerald-700">
            Bayramınız Mübarek
          </div>
          <div className="text-muted-foreground text-[11px]">
            Hayırlı bayramlar 🐂
          </div>
        </>
      ) : (
        <>
          <div className="text-muted-foreground flex items-center gap-1 text-[10px] font-medium tracking-wider uppercase">
            {tema.durum === "cok-yakin" ? (
              <Flame
                size={10}
                className={cn(renkPaket.ikonRenk, "animate-pulse")}
              />
            ) : (
              <Sparkles size={10} className={renkPaket.ikonRenk} />
            )}
            Kurban Bayramına
          </div>
          <div
            className={cn(
              "text-2xl leading-none font-extrabold transition-colors",
              renkPaket.sayiRenk,
            )}
          >
            {kalanGun}
          </div>
          <div className="text-muted-foreground text-[11px] leading-tight">
            gün kaldı
          </div>
          <div className="text-muted-foreground/70 mt-0.5 text-[10px]">
            27 Mayıs 2026
          </div>
        </>
      )}
    </div>
  );
}

interface SayacRenkPaketi {
  daraltlmisBg: string;
  genisBg: string;
  ikonRenk: string;
  sayiRenk: string;
}

function sayacRenkleri(
  durum: BayramTemasi["durum"],
): SayacRenkPaketi {
  switch (durum) {
    case "uzak":
      return {
        daraltlmisBg: "",
        genisBg: "from-orange-50/60 to-orange-100/60",
        ikonRenk: "text-orange-500",
        sayiRenk: "text-orange-600",
      };
    case "yakin":
      return {
        daraltlmisBg: "bg-orange-50",
        genisBg: "from-orange-100 to-amber-100",
        ikonRenk: "text-orange-600",
        sayiRenk: "text-orange-700",
      };
    case "cok-yakin":
      return {
        daraltlmisBg: "bg-red-50",
        genisBg: "from-red-100 to-orange-100",
        ikonRenk: "text-red-600",
        sayiRenk: "text-red-700",
      };
    case "bugun":
      return {
        daraltlmisBg: "bg-emerald-50",
        genisBg: "from-emerald-100 to-green-100",
        ikonRenk: "text-emerald-600",
        sayiRenk: "text-emerald-700",
      };
    case "sonra":
      return {
        daraltlmisBg: "bg-blue-50",
        genisBg: "from-blue-50 to-stone-50",
        ikonRenk: "text-blue-500",
        sayiRenk: "text-blue-700",
      };
  }
}
