import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { formatPara } from "@/shared/lib/para";
import type { MusteriIstatistik } from "../lib/istatistik";
import { Users, CheckCircle2, Clock, AlertCircle, TrendingUp } from "lucide-react";

interface MusteriStatBarProps {
  veri: MusteriIstatistik;
}

export function MusteriStatBar({ veri }: MusteriStatBarProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Kart
        href="/musteriler"
        ad="Toplam Müşteri"
        deger={String(veri.toplam)}
        ikon={<Users size={18} />}
        renk="text-foreground"
      />
      <Kart
        href="/musteriler?durum=odendi"
        ad="Ödendi"
        deger={String(veri.odendi)}
        altYazi={yuzde(veri.odendi, veri.toplam)}
        ikon={<CheckCircle2 size={18} />}
        renk="text-green-600"
      />
      <Kart
        href="/musteriler?durum=kismi"
        ad="Kısmi"
        deger={String(veri.kismi)}
        altYazi={yuzde(veri.kismi, veri.toplam)}
        ikon={<Clock size={18} />}
        renk="text-amber-600"
      />
      <Kart
        href="/musteriler?durum=borclu"
        ad="Borçlu"
        deger={String(veri.borclu)}
        altYazi={yuzde(veri.borclu, veri.toplam)}
        ikon={<AlertCircle size={18} />}
        renk="text-red-600"
      />
      <Kart
        href="/raporlar/tahsilat"
        ad="Tahsilat"
        deger={formatPara(veri.toplamOdenmis)}
        altYazi={`% ${veri.tahsilatYuzdesi}`}
        ikon={<TrendingUp size={18} />}
        renk="text-tilbe"
        vurgu
      />
    </div>
  );
}

function yuzde(parca: number, toplam: number): string {
  if (toplam === 0) return "0%";
  return `%${Math.round((parca / toplam) * 100)}`;
}

interface KartProps {
  href: string;
  ad: string;
  deger: string;
  altYazi?: string;
  ikon: React.ReactNode;
  renk: string;
  vurgu?: boolean;
}

function Kart({ href, ad, deger, altYazi, ikon, renk, vurgu = false }: KartProps) {
  return (
    <Link href={href}>
      <Card
        className={`hover:border-primary/40 transition-colors ${
          vurgu ? "border-primary" : ""
        }`}
      >
        <CardContent className="pt-4 pb-4">
          <div className={`mb-1 flex items-center gap-1.5 ${renk}`}>
            {ikon}
            <span className="text-muted-foreground text-xs">{ad}</span>
          </div>
          <p className="font-tabular text-xl font-bold sm:text-2xl">{deger}</p>
          {altYazi && (
            <p className="text-muted-foreground mt-0.5 text-xs">{altYazi}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
