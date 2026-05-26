"use client";

import {
  UserCheck,
  Beef,
  Scissors,
  Slice,
  Scale,
  Package,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/shared/lib/utils";
import {
  KESIM_RENKLERI,
  type KesimAkisi,
  type KesimAsamasi,
} from "@/modules/dashboard/types";

const IKONLAR: Record<KesimAsamasi["id"], LucideIcon> = {
  vekalet: UserCheck,
  "kesim-alani": Beef,
  kesimde: Scissors,
  parcalama: Slice,
  tartim: Scale,
  paketleniyor: Package,
  "teslim-hazir": CheckCircle,
};

interface KesimOperasyonAkisiProps {
  akis: KesimAkisi;
}

/**
 * Bayram günü "kalp atışı" — 7 aşamalı pipeline.
 * Her aşamada o anki sayım + progress bar.
 *
 * Veri kaynağı: Kurban.kesimDurumu (SPRINT-12 sonrası gerçek DB durumları,
 * SPRINT-P2 İŞ 8 ile dashboard.service'te 7 aşamaya grupkanır).
 */
export function KesimOperasyonAkisi({ akis }: KesimOperasyonAkisiProps) {
  const sonGuncellemeStr = new Date(akis.sonGuncelleme).toLocaleTimeString(
    "tr-TR",
    { hour: "2-digit", minute: "2-digit", second: "2-digit" },
  );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <span className="from-orange-500 to-amber-500 flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br text-white">
            <Sparkles size={14} />
          </span>
          <div>
            <CardTitle className="text-base">
              Canlı Kesim Operasyon Akışı
            </CardTitle>
            <p className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
              {akis.canli && (
                <span className="bg-emerald-500 inline-block h-1.5 w-1.5 animate-pulse rounded-full" />
              )}
              {akis.canli ? "Canlı" : "Donmuş"} · Son güncelleme:{" "}
              {sonGuncellemeStr}
            </p>
          </div>
        </div>
        <span className="bg-emerald-100 text-emerald-800 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-emerald-200">
          CANLI
        </span>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {akis.asamalar.map((asama) => (
            <AsamaKart key={asama.id} asama={asama} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AsamaKart({ asama }: { asama: KesimAsamasi }) {
  const Ikon = IKONLAR[asama.id];
  const renkSinifi = KESIM_RENKLERI[asama.renk];

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-stone-200 bg-white p-3 transition-colors hover:border-stone-300">
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg text-white",
          renkSinifi,
        )}
      >
        <Ikon size={16} />
      </span>
      <div className="flex flex-col gap-0.5">
        <p className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
          {asama.ad}
        </p>
        <p className="font-tabular text-xl font-bold leading-tight">
          {asama.sayi}
        </p>
        <p className="text-muted-foreground text-[11px]">
          {asama.sayi}/{asama.toplam} kurban
        </p>
      </div>
      <div className="mt-1">
        <div className="mb-1 flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground font-semibold">Doluluk</span>
          <span className="font-tabular font-bold">{asama.yuzde}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
          <div
            className={cn("h-full rounded-full transition-all", renkSinifi)}
            style={{ width: `${asama.yuzde}%` }}
          />
        </div>
      </div>
    </div>
  );
}
