"use client";

import { Users } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { SiradakiSatir, TvTema } from "@/modules/tv/types";
import { AsamaSayaci } from "@/modules/tv/components/shared/AsamaSayaci";

interface SiradakilerSutunProps {
  satirlar: SiradakiSatir[];
  tema: TvTema;
}

export function SiradakilerSutun({ satirlar, tema }: SiradakilerSutunProps) {
  const koyuMu = tema === "dark";

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-xl border p-3",
        koyuMu
          ? "border-purple-700/40 bg-slate-800/40"
          : "border-purple-200 bg-purple-50/50",
      )}
    >
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            koyuMu
              ? "bg-purple-500/30 text-purple-300"
              : "bg-purple-500 text-white",
          )}
        >
          <Users size={18} />
        </span>
        <div className="flex flex-col leading-tight">
          <h3
            className={cn(
              "text-base font-extrabold tracking-tight",
              koyuMu ? "text-purple-300" : "text-purple-700",
            )}
          >
            SIRADAKİLER
          </h3>
          <span
            className={cn(
              "text-[11px] font-semibold",
              koyuMu ? "text-slate-400" : "text-slate-500",
            )}
          >
            {satirlar.length} hisse
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
        {satirlar.length === 0 ? (
          <p
            className={cn(
              "py-8 text-center text-xs",
              koyuMu ? "text-slate-500" : "text-slate-400",
            )}
          >
            Sırada hisse yok
          </p>
        ) : (
          satirlar.map((s, i) => (
            <div
              key={s.hisseId}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-2.5",
                koyuMu
                  ? "border-slate-700 bg-slate-800/60"
                  : "border-slate-200 bg-white",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  koyuMu
                    ? "bg-purple-500/30 text-purple-200"
                    : "bg-purple-500 text-white",
                )}
              >
                {i + 1}
              </span>
              <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <span
                  className={cn(
                    "text-sm font-bold",
                    koyuMu ? "text-white" : "text-slate-900",
                  )}
                >
                  Sıra {s.siraNo}
                </span>
                <span
                  className={cn(
                    "truncate text-[11px]",
                    koyuMu ? "text-slate-400" : "text-slate-500",
                  )}
                >
                  {s.musteriKisaltma}
                </span>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    koyuMu
                      ? "bg-purple-500/20 text-purple-200"
                      : "bg-purple-100 text-purple-700",
                  )}
                >
                  {s.durumEtiket}
                </span>
                <AsamaSayaci
                  baslangic={s.asamaBaslangic}
                  boyut="kompakt"
                  tema={koyuMu ? "koyu" : "acik"}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
