"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/shared/lib/utils";
import { formatPara } from "@/shared/lib/para";
import { avatarGradient, type SonIslem } from "@/modules/dashboard/types";

interface SonIslemlerFeedProps {
  islemler: SonIslem[];
}

const ROZET_RENKLERI: Record<string, string> = {
  "+tahsilat": "bg-emerald-100 text-emerald-700",
  havale: "bg-blue-100 text-blue-700",
  kart: "bg-purple-100 text-purple-700",
  karisik: "bg-amber-100 text-amber-700",
  vip: "bg-amber-200 text-amber-900",
  iade: "bg-red-100 text-red-700",
};

export function SonIslemlerFeed({ islemler }: SonIslemlerFeedProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Canlı İşlemler</CardTitle>
          <span className="flex items-center gap-1 text-[11px] text-emerald-600">
            <span className="bg-emerald-500 inline-block h-1.5 w-1.5 animate-pulse rounded-full" />
            Canlı
          </span>
        </div>
        <Link
          href="/tahsilat/tum"
          className="text-muted-foreground hover:text-foreground text-xs font-medium"
        >
          Tümü →
        </Link>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {islemler.length === 0 ? (
          <div className="text-muted-foreground flex h-[200px] items-center justify-center text-sm">
            İlk tahsilatı bekliyoruz
          </div>
        ) : (
          <ul className="divide-y">
            {islemler.map((i) => (
              <IslemSatir key={i.id} islem={i} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function IslemSatir({ islem }: { islem: SonIslem }) {
  const grad = avatarGradient(islem.musteriId);
  return (
    <li className="hover:bg-stone-50 transition-colors">
      <Link
        href={`/musteriler/${islem.musteriId}`}
        className="flex items-center gap-3 px-4 py-2.5"
      >
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-xs font-bold text-white shadow-sm",
            grad.from,
            grad.to,
          )}
        >
          {islem.musteriBashar}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold">
              {islem.musteriAdSoyad}
            </span>
            {islem.rozetler.slice(0, 2).map((r) => (
              <span
                key={r}
                className={cn(
                  "rounded px-1.5 py-0.5 text-[9px] font-semibold whitespace-nowrap",
                  ROZET_RENKLERI[r] ?? "bg-stone-100 text-stone-600",
                )}
              >
                {r}
              </span>
            ))}
          </div>
          <span className="text-muted-foreground truncate font-mono text-[11px]">
            {islem.hisseEtiket} · {islem.dekontNo}
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <span className="font-tabular text-sm font-bold text-emerald-700">
            {formatPara(islem.tutar)}
          </span>
          <span className="text-muted-foreground text-[10px]">
            {relativeZaman(islem.tarih)}
          </span>
        </div>
      </Link>
    </li>
  );
}

function relativeZaman(iso: string): string {
  const t = new Date(iso).getTime();
  const fark = Math.floor((Date.now() - t) / 1000);
  if (fark < 60) return "az önce";
  if (fark < 3600) return `${Math.floor(fark / 60)} dk önce`;
  if (fark < 86400) return `${Math.floor(fark / 3600)} sa önce`;
  if (fark < 7 * 86400) return `${Math.floor(fark / 86400)} gün önce`;
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
  });
}
