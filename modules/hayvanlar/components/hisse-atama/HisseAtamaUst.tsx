"use client";

import Link from "next/link";
import {
  Beef,
  CheckCircle2,
  CircleDot,
  AlertCircle,
  LayoutGrid,
  List as ListIcon,
  Zap,
  Plus,
  Upload,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type {
  AtamaIstatistik,
  AtamaGorunum,
} from "@/modules/hayvanlar/types/hisse-atama";

interface HisseAtamaUstProps {
  istatistik: AtamaIstatistik;
  gorunum: AtamaGorunum;
  onGorunumDegis: (g: AtamaGorunum) => void;
}

export function HisseAtamaUst({
  istatistik,
  gorunum,
  onGorunumDegis,
}: HisseAtamaUstProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Üst başlık + aksiyon barı */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hisse Atama</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Müşterileri hisselere atayın · Bayram operasyonu için kritik
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/hayvanlar/yeni"
            className={
              buttonVariants({ variant: "outline", size: "sm" }) +
              " gap-1.5"
            }
          >
            <Plus size={14} />
            Yeni Kurban
          </Link>
          <Link
            href="/musteriler/excel-import"
            className={
              buttonVariants({ variant: "outline", size: "sm" }) +
              " gap-1.5"
            }
          >
            <Upload size={14} />
            Excel İçe Aktar
          </Link>
          <ViewToggle aktif={gorunum} onDegis={onGorunumDegis} />
        </div>
      </div>

      {/* 4 mini KPI kart */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <KpiKart
          ikon={<Beef size={16} />}
          renk="mor"
          baslik="Toplam Kurban"
          ana={istatistik.toplamKurban}
          alt={`${istatistik.toplamHisse} hisse`}
        />
        <KpiKart
          ikon={<CheckCircle2 size={16} />}
          renk="yesil"
          baslik="Dolu Hisseler"
          ana={istatistik.doluHisse}
          alt={`%${istatistik.dolulukYuzde} doluluk`}
        />
        <KpiKart
          ikon={<CircleDot size={16} />}
          renk="turuncu"
          baslik="Boş Hisseler"
          ana={istatistik.bosHisse}
          alt="Atama bekleniyor"
        />
        <KpiKart
          ikon={<AlertCircle size={16} />}
          renk="kirmizi"
          baslik="Hisse Bekleyen Müşteri"
          ana={istatistik.eksikMusteri}
          alt="Hiç atama yok"
        />
      </div>
    </div>
  );
}

interface ViewToggleProps {
  aktif: AtamaGorunum;
  onDegis: (g: AtamaGorunum) => void;
}

function ViewToggle({ aktif, onDegis }: ViewToggleProps) {
  return (
    <div className="flex gap-0.5 rounded-md bg-stone-100 p-0.5">
      <ToggleBtn
        aktif={aktif === "stable"}
        onClick={() => onDegis("stable")}
        ikon={<LayoutGrid size={13} />}
        etiket="Stable"
      />
      <ToggleBtn
        aktif={aktif === "liste"}
        onClick={() => onDegis("liste")}
        ikon={<ListIcon size={13} />}
        etiket="Liste"
      />
      <ToggleBtn
        aktif={aktif === "hizli"}
        onClick={() => onDegis("hizli")}
        ikon={<Zap size={13} />}
        etiket="Hızlı"
      />
    </div>
  );
}

function ToggleBtn({
  aktif,
  onClick,
  ikon,
  etiket,
}: {
  aktif: boolean;
  onClick: () => void;
  ikon: React.ReactNode;
  etiket: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
        aktif
          ? "bg-white text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {ikon}
      {etiket}
    </button>
  );
}

const KPI_RENKLERI = {
  yesil: "bg-green-50 text-green-700 ring-green-200",
  turuncu: "bg-orange-50 text-orange-700 ring-orange-200",
  mor: "bg-purple-50 text-purple-700 ring-purple-200",
  kirmizi: "bg-red-50 text-red-700 ring-red-200",
} as const;

interface KpiKartProps {
  ikon: React.ReactNode;
  renk: keyof typeof KPI_RENKLERI;
  baslik: string;
  ana: number;
  alt: string;
}

function KpiKart({ ikon, renk, baslik, ana, alt }: KpiKartProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-3">
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-md ring-1",
          KPI_RENKLERI[renk],
        )}
      >
        {ikon}
      </span>
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
          {baslik}
        </span>
        <span className="font-tabular text-xl font-bold">{ana}</span>
        <span className="text-muted-foreground truncate text-[11px]">
          {alt}
        </span>
      </div>
    </div>
  );
}
