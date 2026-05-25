"use client";

import { UserCheck, Scissors, Slice, Scale, Truck, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { OperasyonIstatistik, TvTema } from "@/modules/tv/types";

interface TvOperasyonAkisProps {
  istatistik: OperasyonIstatistik;
  tema: TvTema;
}

interface AsamaTanim {
  id: keyof OperasyonIstatistik;
  ad: string;
  ikon: LucideIcon;
  renk: string; // light bg
  renkDark: string;
  iconLight: string;
  iconDark: string;
}

const ASAMALAR: AsamaTanim[] = [
  {
    id: "vekalet",
    ad: "Vekalet",
    ikon: UserCheck,
    renk: "bg-purple-100 text-purple-700 border-purple-300",
    renkDark: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    iconLight: "text-purple-600",
    iconDark: "text-purple-300",
  },
  {
    id: "kesim",
    ad: "Kesim",
    ikon: Scissors,
    renk: "bg-orange-100 text-orange-700 border-orange-300",
    renkDark: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    iconLight: "text-orange-600",
    iconDark: "text-orange-300",
  },
  {
    id: "parcalama",
    ad: "Parçalama",
    ikon: Slice,
    renk: "bg-pink-100 text-pink-700 border-pink-300",
    renkDark: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    iconLight: "text-pink-600",
    iconDark: "text-pink-300",
  },
  {
    id: "tartim",
    ad: "Tartım",
    ikon: Scale,
    renk: "bg-blue-100 text-blue-700 border-blue-300",
    renkDark: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    iconLight: "text-blue-600",
    iconDark: "text-blue-300",
  },
  {
    id: "teslim",
    ad: "Teslim",
    ikon: Truck,
    renk: "bg-green-100 text-green-700 border-green-300",
    renkDark: "bg-green-500/20 text-green-300 border-green-500/30",
    iconLight: "text-green-600",
    iconDark: "text-green-300",
  },
];

export function TvOperasyonAkis({
  istatistik,
  tema,
}: TvOperasyonAkisProps) {
  const koyuMu = tema === "dark";

  return (
    <div
      className={cn(
        "mx-6 my-3 rounded-xl border p-4",
        koyuMu
          ? "border-slate-700 bg-slate-800/40"
          : "border-slate-200 bg-white",
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3
          className={cn(
            "text-sm font-extrabold tracking-wider uppercase",
            koyuMu ? "text-slate-300" : "text-slate-700",
          )}
        >
          Operasyon Aşamaları
        </h3>
        <span
          className={cn(
            "text-[11px]",
            koyuMu ? "text-slate-400" : "text-slate-500",
          )}
        >
          Anlık doluluk
        </span>
      </div>

      <div className="flex items-stretch justify-between gap-2 overflow-x-auto pb-1">
        {ASAMALAR.map((a, i) => {
          const Ikon = a.ikon;
          const sayi = istatistik[a.id];
          const aktif = sayi > 0;
          return (
            <div key={a.id} className="flex flex-1 items-center gap-1.5">
              <div
                className={cn(
                  "flex min-w-[110px] flex-1 flex-col items-center gap-1.5 rounded-lg border p-3 transition-all",
                  koyuMu ? a.renkDark : a.renk,
                  !aktif && "opacity-60",
                )}
              >
                <Ikon
                  size={24}
                  strokeWidth={2}
                  className={cn(koyuMu ? a.iconDark : a.iconLight)}
                />
                <span className="text-[11px] font-semibold tracking-wider uppercase">
                  {a.ad}
                </span>
                <span className="font-tabular text-xl font-extrabold">
                  {sayi}
                </span>
              </div>
              {i < ASAMALAR.length - 1 && (
                <ChevronRight
                  size={18}
                  className={cn(
                    "shrink-0",
                    koyuMu ? "text-slate-600" : "text-slate-400",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
