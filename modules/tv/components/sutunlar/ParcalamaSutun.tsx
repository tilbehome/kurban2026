"use client";

import { Drumstick, Clock } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { IslemKart, TvTema } from "@/modules/tv/types";
import { useAutoScroll } from "@/modules/tv/hooks/useAutoScroll";

interface Props {
  kartlar: IslemKart[];
  tema: TvTema;
}

export function ParcalamaSutun({ kartlar, tema }: Props) {
  const koyuMu = tema === "dark";
  const listeRef = useAutoScroll(5500, 80);

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-2xl border-2 p-4 shadow-sm",
        koyuMu
          ? "border-purple-500/40 bg-slate-800"
          : "border-purple-200 bg-white",
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <Drumstick className="h-5 w-5 text-purple-500" />
        <h3
          className={cn(
            "text-base font-bold tracking-wide",
            koyuMu ? "text-white" : "text-stone-900",
          )}
        >
          PARÇALAMADA
        </h3>
        <span className="ml-auto rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
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
          Şu an parçalamada kurban yok
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
                koyuMu ? "bg-purple-500/15" : "bg-purple-50",
              )}
            >
              {/* Sol: mor badge */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-500 shadow">
                <span className="font-tabular text-lg font-extrabold text-white">
                  {k.kurbanNo}
                </span>
              </div>

              {/* Sağ: bilgi */}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                    Aşama: {k.asama}
                  </span>
                  {k.kalanSureDk !== null && (
                    <div className="flex items-center gap-1 text-xs">
                      <span
                        className={cn(
                          "text-[10px]",
                          koyuMu ? "text-slate-400" : "text-stone-500",
                        )}
                      >
                        Kalan Süre:
                      </span>
                      <span className="font-tabular font-bold text-purple-600">
                        {k.kalanSureDk} dk
                      </span>
                    </div>
                  )}
                </div>

                <div className="mb-1 flex items-center justify-between gap-2">
                  {k.baslangicSaati && (
                    <span
                      className={cn(
                        "flex items-center gap-1 text-[11px]",
                        koyuMu ? "text-slate-400" : "text-stone-500",
                      )}
                    >
                      <Clock className="h-3 w-3" />
                      Başlangıç:{" "}
                      <span
                        className={cn(
                          "font-mono font-semibold",
                          koyuMu ? "text-slate-200" : "text-stone-700",
                        )}
                      >
                        {k.baslangicSaati}
                      </span>
                    </span>
                  )}
                  <span
                    className={cn(
                      "font-tabular ml-auto text-xs font-bold",
                      koyuMu ? "text-slate-200" : "text-stone-700",
                    )}
                  >
                    %{k.ilerlemeYuzde}
                  </span>
                </div>

                <div
                  className={cn(
                    "h-1.5 overflow-hidden rounded-full",
                    koyuMu ? "bg-slate-700" : "bg-stone-200",
                  )}
                >
                  <div
                    className="h-full bg-purple-500 transition-all duration-500"
                    style={{ width: `${k.ilerlemeYuzde}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
