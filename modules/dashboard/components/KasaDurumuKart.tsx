"use client";

import Link from "next/link";
import { Coins, Landmark, CreditCard, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPara } from "@/shared/lib/para";
import type { KasaDurumu } from "@/modules/dashboard/types";

interface KasaDurumuKartProps {
  durum: KasaDurumu;
}

export function KasaDurumuKart({ durum }: KasaDurumuKartProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Kasa Durumu</CardTitle>
        <Link
          href="/kasa"
          className="text-muted-foreground hover:text-foreground text-xs font-medium"
        >
          Detaylar →
        </Link>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <KasaSatir
          ikon={<Coins size={14} />}
          renk="text-green-600 bg-green-50"
          etiket="Nakit Kasa"
          tutar={durum.nakit}
        />
        <KasaSatir
          ikon={<Landmark size={14} />}
          renk="text-blue-600 bg-blue-50"
          etiket="Banka Hesapları"
          tutar={durum.banka}
        />
        <KasaSatir
          ikon={<CreditCard size={14} />}
          renk="text-purple-600 bg-purple-50"
          etiket="POS / Kart"
          tutar={durum.pos}
        />
        <div className="border-t pt-3">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Net Bakiye
            </span>
            <span className="font-tabular text-2xl font-extrabold text-emerald-700">
              {formatPara(durum.toplam)}
            </span>
          </div>
          {(durum.bugunkuGiris > 0 || durum.bugunkuCikis > 0) && (
            <div className="text-muted-foreground mt-1 flex items-center justify-between text-[11px]">
              <span>Bugün: +{formatPara(durum.bugunkuGiris)}</span>
              <span>-{formatPara(durum.bugunkuCikis)}</span>
            </div>
          )}
        </div>
        <Link
          href="/kasa"
          className="bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-colors"
        >
          Kasa Raporuna Git
          <ChevronRight size={12} />
        </Link>
      </CardContent>
    </Card>
  );
}

interface KasaSatirProps {
  ikon: React.ReactNode;
  renk: string;
  etiket: string;
  tutar: number;
}

function KasaSatir({ ikon, renk, etiket, tutar }: KasaSatirProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${renk}`}
      >
        {ikon}
      </span>
      <span className="flex-1 text-sm font-medium">{etiket}</span>
      <span className="font-tabular text-sm font-bold">
        {formatPara(tutar)}
      </span>
    </div>
  );
}
