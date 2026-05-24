"use client";

import Link from "next/link";
import {
  Users,
  Beef,
  PieChart,
  Banknote,
  AlertCircle,
  Wallet,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { formatPara } from "@/shared/lib/para";
import {
  KART_RENKLERI,
  type DashboardKpiKart,
} from "@/modules/dashboard/types";

interface KpiKartlariProps {
  kartlar: DashboardKpiKart[];
}

const IKONLAR: Record<DashboardKpiKart["id"], LucideIcon> = {
  musteri: Users,
  kurban: Beef,
  "hisse-doluluk": PieChart,
  tahsilat: Banknote,
  borc: AlertCircle,
  kasa: Wallet,
};

export function KpiKartlari({ kartlar }: KpiKartlariProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {kartlar.map((k) => (
        <KpiKart key={k.id} kart={k} />
      ))}
    </div>
  );
}

function KpiKart({ kart }: { kart: DashboardKpiKart }) {
  const renk = KART_RENKLERI[kart.renk];
  const Ikon = IKONLAR[kart.id];
  const TrendIkon = kart.trend?.yon === "yukari" ? TrendingUp : TrendingDown;

  const govde = (
    <div
      className={cn(
        "group relative flex flex-col gap-2.5 rounded-xl border border-stone-200 bg-white p-3.5 transition-all",
        kart.href && "hover:border-stone-300 hover:shadow-sm",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            renk.iconBg,
          )}
        >
          <Ikon size={18} />
        </span>
        {kart.trend && (
          <span
            className={cn(
              "flex items-center gap-0.5 rounded-full bg-stone-50 px-1.5 py-0.5 text-[11px] font-semibold",
              kart.trend.pozitifMi ? renk.trendUp : renk.trendDown,
            )}
          >
            <TrendIkon size={11} />%{kart.trend.yuzde}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
          {kart.baslik}
        </p>
        <p
          className={cn(
            "font-tabular text-xl leading-tight font-bold sm:text-2xl",
            renk.text,
          )}
        >
          {formatDeger(kart)}
        </p>
        <p className="text-muted-foreground truncate text-[11px]">
          {kart.altMetin}
        </p>
      </div>

      {kart.progressYuzde !== undefined && (
        <div className="mt-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
            <div
              className={cn("h-full rounded-full transition-all", renk.iconBg)}
              style={{ width: `${kart.progressYuzde}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );

  if (kart.href) {
    return <Link href={kart.href}>{govde}</Link>;
  }
  return govde;
}

function formatDeger(kart: DashboardKpiKart): string {
  if (kart.birim === "₺") return formatPara(kart.sayi);
  if (kart.birim === "%") return `%${kart.sayi}`;
  return kart.sayi.toLocaleString("tr-TR");
}
