"use client";

import {
  Beef,
  Scissors,
  Users,
  CheckCircle2,
  Trophy,
  Clock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { TvKpi, TvTema } from "@/modules/tv/types";

interface TvKpiSeridiProps {
  kpi: TvKpi;
  tema: TvTema;
}

interface KartTanim {
  id: keyof TvKpi;
  baslik: string;
  ikon: LucideIcon;
  renkLight: { bg: string; iconBg: string; iconText: string; numara: string };
  renkDark: { bg: string; iconBg: string; iconText: string; numara: string };
}

const KARTLAR: KartTanim[] = [
  {
    id: "toplamKurban",
    baslik: "Toplam Kurban",
    ikon: Beef,
    renkLight: {
      bg: "bg-white border-slate-200",
      iconBg: "bg-blue-100",
      iconText: "text-blue-600",
      numara: "text-blue-700",
    },
    renkDark: {
      bg: "bg-slate-800 border-slate-700",
      iconBg: "bg-blue-500/20",
      iconText: "text-blue-300",
      numara: "text-blue-300",
    },
  },
  {
    id: "kesimde",
    baslik: "Şu An Kesimde",
    ikon: Scissors,
    renkLight: {
      bg: "bg-white border-slate-200",
      iconBg: "bg-orange-100",
      iconText: "text-orange-600",
      numara: "text-orange-700",
    },
    renkDark: {
      bg: "bg-slate-800 border-slate-700",
      iconBg: "bg-orange-500/20",
      iconText: "text-orange-300",
      numara: "text-orange-300",
    },
  },
  {
    id: "siradaki",
    baslik: "Sıradakiler",
    ikon: Users,
    renkLight: {
      bg: "bg-white border-slate-200",
      iconBg: "bg-purple-100",
      iconText: "text-purple-600",
      numara: "text-purple-700",
    },
    renkDark: {
      bg: "bg-slate-800 border-slate-700",
      iconBg: "bg-purple-500/20",
      iconText: "text-purple-300",
      numara: "text-purple-300",
    },
  },
  {
    id: "teslimHazir",
    baslik: "Teslime Hazır",
    ikon: CheckCircle2,
    renkLight: {
      bg: "bg-white border-slate-200",
      iconBg: "bg-green-100",
      iconText: "text-green-600",
      numara: "text-green-700",
    },
    renkDark: {
      bg: "bg-slate-800 border-slate-700",
      iconBg: "bg-green-500/20",
      iconText: "text-green-300",
      numara: "text-green-300",
    },
  },
  {
    id: "tamamlanan",
    baslik: "Tamamlanan",
    ikon: Trophy,
    renkLight: {
      bg: "bg-white border-slate-200",
      iconBg: "bg-cyan-100",
      iconText: "text-cyan-600",
      numara: "text-cyan-700",
    },
    renkDark: {
      bg: "bg-slate-800 border-slate-700",
      iconBg: "bg-cyan-500/20",
      iconText: "text-cyan-300",
      numara: "text-cyan-300",
    },
  },
  {
    id: "bekleyen",
    baslik: "Bekleyen",
    ikon: Clock,
    renkLight: {
      bg: "bg-white border-slate-200",
      iconBg: "bg-yellow-100",
      iconText: "text-yellow-600",
      numara: "text-yellow-700",
    },
    renkDark: {
      bg: "bg-slate-800 border-slate-700",
      iconBg: "bg-yellow-500/20",
      iconText: "text-yellow-300",
      numara: "text-yellow-300",
    },
  },
];

export function TvKpiSeridi({ kpi, tema }: TvKpiSeridiProps) {
  return (
    <div className="grid grid-cols-2 gap-3 px-6 py-4 md:grid-cols-3 xl:grid-cols-6">
      {KARTLAR.map((k) => {
        const Ikon = k.ikon;
        const renk = tema === "dark" ? k.renkDark : k.renkLight;
        const deger = kpi[k.id];
        return (
          <div
            key={k.id}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-3 transition-all sm:p-4",
              renk.bg,
            )}
          >
            <span
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                renk.iconBg,
                renk.iconText,
              )}
            >
              <Ikon size={22} strokeWidth={2} />
            </span>
            <div className="flex min-w-0 flex-col leading-tight">
              <span
                className={cn(
                  "text-[11px] font-semibold tracking-wider uppercase",
                  tema === "dark" ? "text-slate-400" : "text-slate-500",
                )}
              >
                {k.baslik}
              </span>
              <span
                className={cn(
                  "font-tabular text-2xl font-extrabold sm:text-3xl",
                  renk.numara,
                )}
              >
                {deger}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
