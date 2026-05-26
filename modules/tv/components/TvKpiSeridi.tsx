"use client";

import {
  Beef,
  Scissors,
  Drumstick,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { TvKpi, TvTema } from "@/modules/tv/types";

interface TvKpiSeridiProps {
  kpi: TvKpi;
  tema: TvTema;
}

interface KartTanim {
  id: keyof Pick<
    TvKpi,
    "siradakiler" | "kesimdekiler" | "parcalamada" | "teslimHazir" | "tamamlanan"
  >;
  baslik: string;
  ikon: LucideIcon;
  /** Sol ikon kutusu rengi (görsele uygun) */
  ikonBg: string;
  /** Numara rengi */
  numara: string;
}

const KARTLAR: KartTanim[] = [
  {
    id: "siradakiler",
    baslik: "Sıradakiler",
    ikon: Beef,
    ikonBg: "bg-blue-500",
    numara: "text-blue-600",
  },
  {
    id: "kesimdekiler",
    baslik: "Kesimdekiler",
    ikon: Scissors,
    ikonBg: "bg-orange-500",
    numara: "text-orange-600",
  },
  {
    id: "parcalamada",
    baslik: "Parçalamada",
    ikon: Drumstick,
    ikonBg: "bg-purple-500",
    numara: "text-purple-600",
  },
  {
    id: "teslimHazir",
    baslik: "Teslime Hazır",
    ikon: CheckCircle2,
    ikonBg: "bg-green-500",
    numara: "text-green-600",
  },
  {
    id: "tamamlanan",
    baslik: "Tamamlanan",
    ikon: TrendingUp,
    ikonBg: "bg-cyan-500",
    numara: "text-cyan-600",
  },
];

export function TvKpiSeridi({ kpi, tema }: TvKpiSeridiProps) {
  const koyuMu = tema === "dark";

  return (
    <div className="grid grid-cols-2 gap-3 px-4 py-3 sm:grid-cols-3 xl:grid-cols-5">
      {KARTLAR.map((kart) => {
        const Icon = kart.ikon;
        const deger = kpi[kart.id];
        return (
          <div
            key={kart.id}
            className={cn(
              "flex items-center gap-3 rounded-2xl border p-4 shadow-sm",
              koyuMu
                ? "border-slate-700 bg-slate-800"
                : "border-stone-200 bg-white",
            )}
          >
            <div
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl",
                kart.ikonBg,
              )}
            >
              <Icon className="h-7 w-7 text-white" />
            </div>
            <div className="flex min-w-0 flex-col leading-tight">
              <span
                className={cn(
                  "text-xs font-medium tracking-wider uppercase",
                  koyuMu ? "text-slate-300" : "text-stone-500",
                )}
              >
                {kart.baslik}
              </span>
              <span
                className={cn(
                  "font-tabular mt-1 text-4xl leading-none font-extrabold",
                  koyuMu ? "text-white" : kart.numara,
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
