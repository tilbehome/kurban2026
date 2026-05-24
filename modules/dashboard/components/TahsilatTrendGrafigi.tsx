"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/shared/lib/utils";
import { formatPara } from "@/shared/lib/para";
import type {
  TahsilatTrend,
  TrendAraligi,
} from "@/modules/dashboard/types";

interface TahsilatTrendGrafigiProps {
  /** Sunucudan gelen ilk yükleme verisi (BUGÜN aralığı) */
  ilkVeri: TahsilatTrend;
}

const ARALIK_ETIKETLERI: Record<TrendAraligi, string> = {
  bugun: "Bugün",
  "7gun": "7 Gün",
  "30gun": "30 Gün",
};

/**
 * Tahsilat trend grafiği — saf SVG combo chart (bar + line).
 * Recharts bağımlılığı yok, ~150 satır temiz kod.
 */
export function TahsilatTrendGrafigi({ ilkVeri }: TahsilatTrendGrafigiProps) {
  const [aralik, setAralik] = useState<TrendAraligi>("bugun");
  const [veri, setVeri] = useState<TahsilatTrend>(ilkVeri);
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => {
    if (aralik === "bugun") {
      setVeri(ilkVeri);
      return;
    }
    let iptal = false;
    setYukleniyor(true);
    fetch(`/api/dashboard/tahsilat-trend?aralik=${aralik}`)
      .then((r) => r.json())
      .then((j: { basarili: boolean; veri?: TahsilatTrend }) => {
        if (!iptal && j.basarili && j.veri) setVeri(j.veri);
      })
      .catch(() => {})
      .finally(() => !iptal && setYukleniyor(false));
    return () => {
      iptal = true;
    };
  }, [aralik, ilkVeri]);

  const TrendIkon = veri.trend >= 0 ? TrendingUp : TrendingDown;
  const trendRenk = veri.trend >= 0 ? "text-emerald-600" : "text-red-600";

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 pb-2">
        <div>
          <CardTitle className="text-base">Tahsilat Akışı</CardTitle>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {aralik === "bugun"
              ? "Saatlik (00-24)"
              : aralik === "7gun"
                ? "Son 7 gün"
                : "Son 30 gün (5'er gün)"}
          </p>
        </div>
        <div className="flex gap-1 rounded-md bg-stone-100 p-0.5">
          {(["bugun", "7gun", "30gun"] as TrendAraligi[]).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAralik(a)}
              className={cn(
                "rounded px-2 py-1 text-xs font-medium transition-colors",
                aralik === a
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {ARALIK_ETIKETLERI[a]}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <ComboChart noktalar={veri.noktalar} yukleniyor={yukleniyor} />

        <div className="grid grid-cols-3 gap-3 border-t pt-3">
          <Metrik
            etiket="Toplam Tahsilat"
            deger={formatPara(veri.toplam)}
            trend={
              veri.trend !== 0
                ? {
                    yuzde: Math.abs(veri.trend),
                    pozitif: veri.trend > 0,
                  }
                : undefined
            }
          />
          <Metrik
            etiket="Ortalama İşlem"
            deger={formatPara(veri.ortalama)}
          />
          <Metrik
            etiket="Başarı Oranı"
            deger={`%${veri.basariOrani}`}
            renkSinifi="text-emerald-600"
          />
        </div>

        {veri.trend !== 0 && (
          <p className={cn("flex items-center gap-1 text-xs", trendRenk)}>
            <TrendIkon size={12} />
            Önceki döneme göre %{Math.abs(veri.trend)}{" "}
            {veri.trend > 0 ? "artış" : "düşüş"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface ComboChartProps {
  noktalar: TahsilatTrend["noktalar"];
  yukleniyor: boolean;
}

const CHART_W = 600;
const CHART_H = 200;
const M = { t: 12, r: 36, b: 28, l: 44 };

function ComboChart({ noktalar, yukleniyor }: ComboChartProps) {
  if (noktalar.length === 0) {
    return (
      <div className="text-muted-foreground flex h-[200px] items-center justify-center text-sm">
        Henüz veri yok
      </div>
    );
  }

  const maxTutar = Math.max(1, ...noktalar.map((n) => n.tutar));
  const maxIslem = Math.max(1, ...noktalar.map((n) => n.islem));
  const innerW = CHART_W - M.l - M.r;
  const innerH = CHART_H - M.t - M.b;
  const barW = (innerW / noktalar.length) * 0.55;
  const stepX = innerW / noktalar.length;

  const xOrta = (i: number) => M.l + stepX * (i + 0.5);
  const yTutar = (v: number) => M.t + innerH - (v / maxTutar) * innerH;
  const yIslem = (v: number) => M.t + innerH - (v / maxIslem) * innerH;

  // Line path
  const linePath = noktalar
    .map((n, i) => `${i === 0 ? "M" : "L"} ${xOrta(i)} ${yIslem(n.islem)}`)
    .join(" ");

  // Y eksen referans çizgileri (4 yatay)
  const yReferanslar = [0, 0.25, 0.5, 0.75, 1].map((p) => ({
    y: M.t + innerH - innerH * p,
    label: formatKisaPara(maxTutar * p),
  }));

  return (
    <div
      className={cn(
        "relative w-full transition-opacity",
        yukleniyor && "opacity-50",
      )}
    >
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="h-[200px] w-full"
        preserveAspectRatio="none"
      >
        {/* Grid çizgileri */}
        {yReferanslar.map((r, i) => (
          <g key={i}>
            <line
              x1={M.l}
              y1={r.y}
              x2={CHART_W - M.r}
              y2={r.y}
              stroke="#e5e7eb"
              strokeWidth={1}
              strokeDasharray={i === 0 ? "0" : "2 3"}
            />
            <text
              x={M.l - 6}
              y={r.y + 3}
              textAnchor="end"
              fontSize="10"
              fill="#94a3b8"
              fontFamily="system-ui"
            >
              {r.label}
            </text>
          </g>
        ))}

        {/* Bar'lar */}
        {noktalar.map((n, i) => {
          const h = (n.tutar / maxTutar) * innerH;
          const y = yTutar(n.tutar);
          const x = xOrta(i) - barW / 2;
          return (
            <g key={`bar-${i}`}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(h, 0)}
                fill="#ea580c"
                opacity={0.85}
                rx={2}
              >
                <title>
                  {n.etiket}: {formatPara(n.tutar)} ({n.islem} işlem)
                </title>
              </rect>
            </g>
          );
        })}

        {/* Line (işlem sayısı) */}
        <path
          d={linePath}
          fill="none"
          stroke="#2563eb"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {noktalar.map((n, i) => (
          <circle
            key={`pt-${i}`}
            cx={xOrta(i)}
            cy={yIslem(n.islem)}
            r={3}
            fill="#2563eb"
            stroke="white"
            strokeWidth={1.5}
          >
            <title>
              {n.etiket}: {n.islem} işlem
            </title>
          </circle>
        ))}

        {/* X ekseni etiketleri */}
        {noktalar.map((n, i) => (
          <text
            key={`x-${i}`}
            x={xOrta(i)}
            y={CHART_H - 8}
            textAnchor="middle"
            fontSize="10"
            fill="#94a3b8"
            fontFamily="system-ui"
          >
            {n.etiket}
          </text>
        ))}

        {/* Sağ eksen (işlem) */}
        {[0, 0.5, 1].map((p, i) => (
          <text
            key={`yr-${i}`}
            x={CHART_W - M.r + 6}
            y={M.t + innerH - innerH * p + 3}
            textAnchor="start"
            fontSize="10"
            fill="#2563eb"
            fontFamily="system-ui"
          >
            {Math.round(maxIslem * p)}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div className="text-muted-foreground mt-1 flex items-center justify-end gap-3 text-[11px]">
        <span className="flex items-center gap-1">
          <span className="bg-orange-500 inline-block h-2 w-2 rounded-sm" />
          Tahsilat (₺)
        </span>
        <span className="flex items-center gap-1">
          <span className="bg-blue-600 inline-block h-2 w-2 rounded-full" />
          İşlem sayısı
        </span>
      </div>
    </div>
  );
}

function formatKisaPara(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return Math.round(n).toString();
}

interface MetrikProps {
  etiket: string;
  deger: string;
  trend?: { yuzde: number; pozitif: boolean };
  renkSinifi?: string;
}

function Metrik({ etiket, deger, trend, renkSinifi }: MetrikProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-[11px] font-medium">
        {etiket}
      </span>
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "font-tabular text-sm font-bold sm:text-base",
            renkSinifi ?? "text-foreground",
          )}
        >
          {deger}
        </span>
        {trend && (
          <span
            className={cn(
              "text-[10px] font-semibold",
              trend.pozitif ? "text-emerald-600" : "text-red-600",
            )}
          >
            {trend.pozitif ? "+" : "-"}%{trend.yuzde}
          </span>
        )}
      </div>
    </div>
  );
}
