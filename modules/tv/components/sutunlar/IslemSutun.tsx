"use client";

import { Scissors, Scale } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { IslemKart, TvTema } from "@/modules/tv/types";

interface IslemSutunProps {
  baslik: string;
  kartlar: IslemKart[];
  renk: "turuncu" | "mavi";
  tema: TvTema;
}

export function IslemSutun({ baslik, kartlar, renk, tema }: IslemSutunProps) {
  const koyuMu = tema === "dark";
  const Ikon = renk === "turuncu" ? Scissors : Scale;

  const palette =
    renk === "turuncu"
      ? {
          border: koyuMu ? "border-orange-700/40" : "border-orange-200",
          bg: koyuMu ? "bg-slate-800/40" : "bg-orange-50/50",
          iconBg: koyuMu
            ? "bg-orange-500/30 text-orange-300"
            : "bg-orange-500 text-white",
          baslik: koyuMu ? "text-orange-300" : "text-orange-700",
          numara: koyuMu
            ? "bg-orange-500/30 text-orange-200"
            : "bg-orange-500 text-white",
          kartBorder: koyuMu ? "border-slate-700" : "border-orange-200",
          kartBg: koyuMu ? "bg-slate-800/60" : "bg-white",
          asamaBadge: koyuMu
            ? "bg-orange-500/20 text-orange-200"
            : "bg-orange-100 text-orange-700",
          barBg: koyuMu ? "bg-slate-700" : "bg-orange-100",
          barFill: "bg-orange-500",
          sureRenk: koyuMu ? "text-orange-300" : "text-orange-700",
        }
      : {
          border: koyuMu ? "border-blue-700/40" : "border-blue-200",
          bg: koyuMu ? "bg-slate-800/40" : "bg-blue-50/50",
          iconBg: koyuMu
            ? "bg-blue-500/30 text-blue-300"
            : "bg-blue-500 text-white",
          baslik: koyuMu ? "text-blue-300" : "text-blue-700",
          numara: koyuMu
            ? "bg-blue-500/30 text-blue-200"
            : "bg-blue-500 text-white",
          kartBorder: koyuMu ? "border-slate-700" : "border-blue-200",
          kartBg: koyuMu ? "bg-slate-800/60" : "bg-white",
          asamaBadge: koyuMu
            ? "bg-blue-500/20 text-blue-200"
            : "bg-blue-100 text-blue-700",
          barBg: koyuMu ? "bg-slate-700" : "bg-blue-100",
          barFill: "bg-blue-500",
          sureRenk: koyuMu ? "text-blue-300" : "text-blue-700",
        };

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-xl border p-3",
        palette.border,
        palette.bg,
      )}
    >
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            palette.iconBg,
          )}
        >
          <Ikon size={18} />
        </span>
        <div className="flex flex-col leading-tight">
          <h3
            className={cn(
              "text-base font-extrabold tracking-tight",
              palette.baslik,
            )}
          >
            {baslik}
          </h3>
          <span
            className={cn(
              "text-[11px] font-semibold",
              koyuMu ? "text-slate-400" : "text-slate-500",
            )}
          >
            {kartlar.length} hisse
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {kartlar.length === 0 ? (
          <p
            className={cn(
              "py-8 text-center text-xs",
              koyuMu ? "text-slate-500" : "text-slate-400",
            )}
          >
            Aktif işlem yok
          </p>
        ) : (
          kartlar.map((k, i) => (
            <div
              key={k.hisseId}
              className={cn(
                "flex flex-col gap-2 rounded-lg border p-3",
                palette.kartBorder,
                palette.kartBg,
              )}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-extrabold",
                    palette.numara,
                  )}
                >
                  {i + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span
                    className={cn(
                      "font-tabular text-lg font-extrabold",
                      koyuMu ? "text-white" : "text-slate-900",
                    )}
                  >
                    Sıra No: {k.siraNo}
                  </span>
                  <span
                    className={cn(
                      "truncate text-[11px]",
                      koyuMu ? "text-slate-400" : "text-slate-500",
                    )}
                  >
                    {k.musteriKisaltma}
                  </span>
                </div>
                {k.kalanSureDk !== null && (
                  <span
                    className={cn(
                      "font-tabular shrink-0 text-base font-extrabold",
                      palette.sureRenk,
                    )}
                  >
                    {k.kalanSureDk} dk
                  </span>
                )}
              </div>

              <span
                className={cn(
                  "self-start rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  palette.asamaBadge,
                )}
              >
                Aşama: {k.asama}
              </span>

              {/* İlerleme barı */}
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-2 flex-1 overflow-hidden rounded-full",
                    palette.barBg,
                  )}
                >
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      palette.barFill,
                    )}
                    style={{ width: `${k.ilerlemeYuzde}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "font-tabular shrink-0 text-xs font-bold",
                    palette.sureRenk,
                  )}
                >
                  %{k.ilerlemeYuzde}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
