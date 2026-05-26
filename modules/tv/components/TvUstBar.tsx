"use client";

import { useEffect, useState } from "react";
import { Beef, MapPin } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { TvTemaToggle } from "./TvTemaToggle";
import type { TvTema } from "@/modules/tv/types";

interface TvUstBarProps {
  firmaAdi: string;
  lokasyon: string;
  canli: boolean;
  tema: TvTema;
  onTemaToggle: () => void;
}

const GUNLER = [
  "Pazar",
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
];

const AYLAR = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

export function TvUstBar({
  firmaAdi,
  lokasyon,
  canli,
  tema,
  onTemaToggle,
}: TvUstBarProps) {
  const [zaman, setZaman] = useState<Date | null>(null);

  useEffect(() => {
    setZaman(new Date());
    const t = setInterval(() => setZaman(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const tarihStr = zaman
    ? `${zaman.getDate()} ${AYLAR[zaman.getMonth()]} ${zaman.getFullYear()} ${GUNLER[zaman.getDay()]}`
    : "—";

  const saatStr = zaman
    ? `${pad(zaman.getHours())}:${pad(zaman.getMinutes())}:${pad(zaman.getSeconds())}`
    : "—";

  return (
    <header
      className={cn(
        "flex flex-col gap-3 px-6 py-4 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-6",
        tema === "dark"
          ? "border-b border-slate-800 bg-slate-900 text-white"
          : "border-b border-slate-200 bg-slate-900 text-white",
      )}
    >
      {/* Sol: Logo + marka */}
      <div className="flex items-center gap-3">
        <div className="from-orange-500 to-amber-500 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br shadow-lg ring-2 ring-orange-400/30">
          <Beef size={26} strokeWidth={2} />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-xl font-extrabold tracking-tight">
            {firmaAdi}
          </span>
          <span className="text-xs text-slate-300">
            Kurban Yönetim Sistemi
          </span>
        </div>
      </div>

      {/* Orta: Başlık */}
      <div className="flex flex-col items-center leading-tight text-center">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          CANLI KESİM TAKİP EKRANI
        </h1>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-300 sm:text-sm">
          <MapPin size={12} />
          {lokasyon}
        </p>
      </div>

      {/* Sağ: Tarih + saat + canlı + tema */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end leading-tight">
          <span className="text-xs text-slate-300">{tarihStr}</span>
          <span className="font-tabular text-2xl font-extrabold tracking-tight sm:text-3xl">
            {saatStr}
          </span>
          <span
            className={cn(
              "mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold",
              canli ? "text-emerald-300" : "text-slate-400",
            )}
          >
            <span
              className={cn(
                "inline-block h-1.5 w-1.5 rounded-full",
                canli ? "animate-pulse bg-emerald-400" : "bg-slate-500",
              )}
            />
            {canli ? "CANLI" : "Bağlanıyor..."}
          </span>
        </div>
        <TvTemaToggle tema={tema} onToggle={onTemaToggle} />
      </div>
    </header>
  );
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}
