import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/shared/lib/utils";
import { formatPara } from "@/shared/lib/para";
import type { MusteriIstatistik } from "../lib/istatistik";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
} from "lucide-react";

interface MusteriStatBarProps {
  veri: MusteriIstatistik;
  /** Hangi durum filtresi aktif — kart vurgulaması için */
  aktifDurum?: string;
}

type RenkAnahtari = "slate" | "green" | "amber" | "red" | "orange";

const RENK_STILLERI: Record<
  RenkAnahtari,
  { daire: string; ring: string; yazi: string }
> = {
  slate: {
    daire: "bg-slate-100 text-slate-700",
    ring: "ring-2 ring-slate-400 border-slate-300",
    yazi: "text-slate-800",
  },
  green: {
    daire: "bg-green-100 text-green-700",
    ring: "ring-2 ring-green-400 border-green-300",
    yazi: "text-green-700",
  },
  amber: {
    daire: "bg-amber-100 text-amber-700",
    ring: "ring-2 ring-amber-400 border-amber-300",
    yazi: "text-amber-700",
  },
  red: {
    daire: "bg-red-100 text-red-700",
    ring: "ring-2 ring-red-400 border-red-300",
    yazi: "text-red-700",
  },
  orange: {
    daire: "bg-orange-100 text-orange-700",
    ring: "ring-2 ring-orange-400 border-orange-300",
    yazi: "text-orange-700",
  },
};

export function MusteriStatBar({
  veri,
  aktifDurum = "hepsi",
}: MusteriStatBarProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Kart
        href="/musteriler"
        ad="Toplam Müşteri"
        deger={veri.toplam.toLocaleString("tr-TR")}
        ikon={<Users size={20} />}
        renk="slate"
        aktif={aktifDurum === "hepsi"}
      />
      <Kart
        href="/musteriler?durum=odendi"
        ad="Ödendi"
        deger={veri.odendi.toLocaleString("tr-TR")}
        altYazi={yuzde(veri.odendi, veri.toplam)}
        ikon={<CheckCircle2 size={20} />}
        renk="green"
        aktif={aktifDurum === "odendi"}
      />
      <Kart
        href="/musteriler?durum=kismi"
        ad="Kısmi"
        deger={veri.kismi.toLocaleString("tr-TR")}
        altYazi={yuzde(veri.kismi, veri.toplam)}
        ikon={<Clock size={20} />}
        renk="amber"
        aktif={aktifDurum === "kismi"}
      />
      <Kart
        href="/musteriler?durum=borclu"
        ad="Borçlu"
        deger={veri.borclu.toLocaleString("tr-TR")}
        altYazi={yuzde(veri.borclu, veri.toplam)}
        ikon={<AlertCircle size={20} />}
        renk="red"
        aktif={aktifDurum === "borclu"}
      />
      <Kart
        href="/raporlar/tahsilat"
        ad="Tahsilat"
        deger={formatPara(veri.toplamOdenmis)}
        altYazi={`%${veri.tahsilatYuzdesi}`}
        ikon={<TrendingUp size={20} />}
        renk="orange"
        kucukDeger
      />
    </div>
  );
}

interface KartProps {
  href: string;
  ad: string;
  deger: string;
  altYazi?: string;
  ikon: React.ReactNode;
  renk: RenkAnahtari;
  aktif?: boolean;
  kucukDeger?: boolean;
}

function Kart({
  href,
  ad,
  deger,
  altYazi,
  ikon,
  renk,
  aktif = false,
  kucukDeger = false,
}: KartProps) {
  const stil = RENK_STILLERI[renk];
  return (
    <Link
      href={href}
      className="block transition-transform duration-200 hover:-translate-y-0.5"
    >
      <Card
        className={cn(
          "h-full transition-shadow hover:shadow-md",
          aktif && stil.ring,
        )}
      >
        <CardContent className="p-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                stil.daire,
              )}
              aria-hidden="true"
            >
              {ikon}
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {ad}
            </p>
            <p
              className={cn(
                "font-bold tabular-nums",
                kucukDeger ? "text-lg" : "text-2xl",
                stil.yazi,
              )}
            >
              {deger}
            </p>
            {altYazi && (
              <p className="text-xs text-muted-foreground">{altYazi}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function yuzde(parca: number, toplam: number): string {
  if (toplam === 0) return "%0";
  return `%${Math.round((parca / toplam) * 100)}`;
}
