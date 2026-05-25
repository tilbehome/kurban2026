"use client";

import { CheckCircle2, MapPin } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { TeslimSatir, TvTema } from "@/modules/tv/types";

interface TeslimeHazirSutunProps {
  satirlar: TeslimSatir[];
  tema: TvTema;
}

export function TeslimeHazirSutun({
  satirlar,
  tema,
}: TeslimeHazirSutunProps) {
  const koyuMu = tema === "dark";

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-xl border p-3",
        koyuMu
          ? "border-green-700/40 bg-slate-800/40"
          : "border-green-200 bg-green-50/50",
      )}
    >
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            koyuMu
              ? "bg-green-500/30 text-green-300"
              : "bg-green-500 text-white",
          )}
        >
          <CheckCircle2 size={18} />
        </span>
        <div className="flex flex-col leading-tight">
          <h3
            className={cn(
              "text-base font-extrabold tracking-tight",
              koyuMu ? "text-green-300" : "text-green-700",
            )}
          >
            TESLİME HAZIR
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

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {satirlar.length === 0 ? (
          <p
            className={cn(
              "py-8 text-center text-xs",
              koyuMu ? "text-slate-500" : "text-slate-400",
            )}
          >
            Henüz teslime hazır hisse yok
          </p>
        ) : (
          satirlar.map((s, i) => (
            <div
              key={s.hisseId}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-2.5",
                koyuMu
                  ? "border-slate-700 bg-slate-800/60"
                  : "border-green-200 bg-white",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold",
                  koyuMu
                    ? "bg-green-500/30 text-green-200"
                    : "bg-green-500 text-white",
                )}
              >
                {i + 1}
              </span>
              <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <span
                  className={cn(
                    "font-tabular text-sm font-extrabold",
                    koyuMu ? "text-white" : "text-slate-900",
                  )}
                >
                  Teslim No: {s.teslimNo}
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1 text-[11px]",
                    koyuMu ? "text-slate-400" : "text-slate-500",
                  )}
                >
                  <MapPin size={10} />
                  {s.teslimNoktasi}
                </span>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  s.durum === "Hazır"
                    ? koyuMu
                      ? "bg-green-500/20 text-green-200"
                      : "bg-green-100 text-green-700"
                    : koyuMu
                      ? "bg-slate-700 text-slate-300"
                      : "bg-slate-100 text-slate-600",
                )}
              >
                {s.durum}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
