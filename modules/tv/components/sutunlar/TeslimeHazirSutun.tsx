"use client";

import { CheckCircle2, MapPin } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { TeslimKart, TvTema } from "@/modules/tv/types";
import { useAutoScroll } from "@/modules/tv/hooks/useAutoScroll";

interface Props {
  kartlar: TeslimKart[];
  tema: TvTema;
}

export function TeslimeHazirSutun({ kartlar, tema }: Props) {
  const koyuMu = tema === "dark";
  const listeRef = useAutoScroll(5500, 72);

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-2xl border-2 p-4 shadow-sm",
        koyuMu
          ? "border-green-500/40 bg-slate-800"
          : "border-green-200 bg-white",
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-green-500" />
        <h3
          className={cn(
            "text-base font-bold tracking-wide",
            koyuMu ? "text-white" : "text-stone-900",
          )}
        >
          TESLİME HAZIR
        </h3>
        <span className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
          {kartlar.length}
        </span>
      </div>

      {kartlar.length === 0 ? (
        <p
          className={cn(
            "py-8 text-center text-sm",
            koyuMu ? "text-slate-400" : "text-stone-400",
          )}
        >
          Teslime hazır kurban yok
        </p>
      ) : (
        <div
          ref={listeRef}
          className="kesim-scroll min-h-0 flex-1 space-y-2 overflow-y-auto pr-1"
          style={{ maxHeight: "640px" }}
        >
          {kartlar.map((k) => (
            <div
              key={k.kurbanId}
              className={cn(
                "flex items-center gap-3 rounded-xl p-2.5",
                koyuMu ? "bg-green-500/15" : "bg-green-50",
              )}
            >
              {/* Sol: yeşil kurban no */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-green-500 shadow">
                <span className="font-tabular text-lg font-extrabold text-white">
                  {k.kurbanNo}
                </span>
              </div>

              {/* Orta: durum + teslim noktası */}
              <div className="min-w-0 flex-1">
                <div
                  className={cn(
                    "text-sm font-bold",
                    koyuMu ? "text-white" : "text-stone-900",
                  )}
                >
                  Hazır
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    koyuMu ? "text-slate-400" : "text-stone-500",
                  )}
                >
                  <MapPin className="h-3 w-3" />
                  {k.teslimNoktasi}
                </div>
              </div>

              {/* Sağ: bekleme süresi */}
              <div className="shrink-0 text-right">
                <div className="font-tabular text-lg font-extrabold text-green-600">
                  {k.hazirBeklemeDk} dk
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
