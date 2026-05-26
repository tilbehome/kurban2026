"use client";

import { useEffect, useState } from "react";
import { Scissors } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { IslemKart, TvTema } from "@/modules/tv/types";
import { useAutoScroll } from "@/modules/tv/hooks/useAutoScroll";

interface Props {
  kartlar: IslemKart[];
  tema: TvTema;
}

/** Aşama başlangıcından geçen dakikayı canlı gösterir (1 dakikada güncellenir). */
function GecenDk({ baslangic }: { baslangic: string | null }) {
  const [dk, setDk] = useState<number | null>(null);

  useEffect(() => {
    if (!baslangic) {
      setDk(null);
      return;
    }
    const baslangicMs = new Date(baslangic).getTime();
    if (Number.isNaN(baslangicMs)) {
      setDk(null);
      return;
    }
    const tick = () => {
      setDk(Math.max(0, Math.floor((Date.now() - baslangicMs) / 60000)));
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [baslangic]);

  if (dk === null) return <span className="text-stone-400">—</span>;
  return <>{dk} dk</>;
}

export function KesimdekilerSutun({ kartlar, tema }: Props) {
  const koyuMu = tema === "dark";
  const listeRef = useAutoScroll(6000, 96);

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-2xl border-2 p-4 shadow-sm",
        koyuMu
          ? "border-orange-500/40 bg-slate-800"
          : "border-orange-200 bg-white",
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <Scissors className="h-5 w-5 text-orange-500" />
        <h3
          className={cn(
            "text-base font-bold tracking-wide",
            koyuMu ? "text-white" : "text-stone-900",
          )}
        >
          KESİMDEKİLER
        </h3>
        <span className="ml-auto rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
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
          Şu an kesimde kurban yok
        </p>
      ) : (
        <div
          ref={listeRef}
          className="kesim-scroll min-h-0 flex-1 space-y-3 overflow-y-auto pr-1"
          style={{ maxHeight: "640px" }}
        >
          {kartlar.map((k) => (
            <div
              key={k.kurbanId}
              className={cn(
                "flex items-center gap-3 rounded-xl p-3",
                koyuMu ? "bg-orange-500/15" : "bg-orange-50",
              )}
            >
              {/* Sol: BÜYÜK turuncu kurban no */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-orange-500 shadow">
                <span className="font-tabular text-2xl font-extrabold text-white">
                  {k.kurbanNo}
                </span>
              </div>

              {/* Sağ: bilgi */}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "text-[10px] font-semibold tracking-wider uppercase",
                      koyuMu ? "text-slate-400" : "text-stone-500",
                    )}
                  >
                    NoLu Kurban
                  </span>
                  <span className="rounded-full bg-orange-200 px-2 py-0.5 text-[10px] font-bold text-orange-800">
                    Aşama: {k.asama}
                  </span>
                </div>

                <div className="mb-2 flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "text-[10px] font-semibold tracking-wider uppercase",
                      koyuMu ? "text-slate-400" : "text-stone-500",
                    )}
                  >
                    Geçen Süre
                  </span>
                  <span className="font-tabular text-lg font-extrabold text-orange-600">
                    <GecenDk baslangic={k.asamaBaslangic} />
                  </span>
                </div>

                {/* İlerleme barı + yüzde */}
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "h-2 flex-1 overflow-hidden rounded-full",
                      koyuMu ? "bg-slate-700" : "bg-stone-200",
                    )}
                  >
                    <div
                      className="h-full bg-orange-500 transition-all duration-500"
                      style={{ width: `${k.ilerlemeYuzde}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      "font-tabular text-xs font-bold",
                      koyuMu ? "text-slate-200" : "text-stone-700",
                    )}
                  >
                    %{k.ilerlemeYuzde}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
