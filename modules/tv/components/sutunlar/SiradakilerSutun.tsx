"use client";

import { Users } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { SiradakiSatir, TvTema } from "@/modules/tv/types";
import { useAutoScroll } from "@/modules/tv/hooks/useAutoScroll";

interface SiradakilerSutunProps {
  satirlar: SiradakiSatir[];
  tema: TvTema;
}

const NOKTA_RENGI: Record<SiradakiSatir["durumRengi"], string> = {
  mavi: "bg-blue-500",
  sari: "bg-amber-500",
  yesil: "bg-green-500",
};

export function SiradakilerSutun({ satirlar, tema }: SiradakilerSutunProps) {
  const koyuMu = tema === "dark";
  const listeRef = useAutoScroll(5000, 64);

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-2xl border p-4 shadow-sm",
        koyuMu ? "border-slate-700 bg-slate-800" : "border-stone-200 bg-white",
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <Users
          className={cn("h-5 w-5", koyuMu ? "text-blue-300" : "text-blue-500")}
        />
        <h3
          className={cn(
            "text-base font-bold tracking-wide",
            koyuMu ? "text-white" : "text-stone-900",
          )}
        >
          SIRADAKİLER
        </h3>
        <span
          className={cn(
            "ml-auto rounded-full px-2 py-0.5 text-xs font-semibold",
            koyuMu
              ? "bg-slate-700 text-slate-300"
              : "bg-stone-100 text-stone-600",
          )}
        >
          {satirlar.length}
        </span>
      </div>

      {satirlar.length === 0 ? (
        <p
          className={cn(
            "py-8 text-center text-sm",
            koyuMu ? "text-slate-400" : "text-stone-400",
          )}
        >
          Sırada kurban yok
        </p>
      ) : (
        <div
          ref={listeRef}
          className="kesim-scroll min-h-0 flex-1 space-y-1 overflow-y-auto pr-1"
          style={{ maxHeight: "640px" }}
        >
          {satirlar.map((s) => (
            <div
              key={s.kurbanId}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2 py-2",
                koyuMu ? "hover:bg-slate-700/50" : "hover:bg-stone-50",
              )}
            >
              {/* Mavi sıra badge (kurban no) */}
              <div className="flex h-9 w-12 shrink-0 items-center justify-center rounded-md bg-blue-500">
                <span className="text-sm font-bold text-white">
                  {s.kurbanNo}
                </span>
              </div>

              {/* Durum metni */}
              <span
                className={cn(
                  "flex-1 truncate text-sm font-medium",
                  koyuMu ? "text-slate-200" : "text-stone-700",
                )}
              >
                {s.durumEtiket}
              </span>

              {/* Renkli nokta */}
              <div
                className={cn(
                  "h-2.5 w-2.5 shrink-0 rounded-full",
                  NOKTA_RENGI[s.durumRengi],
                )}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
