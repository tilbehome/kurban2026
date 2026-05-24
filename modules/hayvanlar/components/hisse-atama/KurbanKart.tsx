"use client";

import { Beef } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { HisseKutusu } from "./HisseKutusu";
import {
  KURBAN_DURUM_RENKLERI,
  type KurbanKartVeri,
  type HisseKutusuVeri,
  type DragPayload,
} from "@/modules/hayvanlar/types/hisse-atama";

interface KurbanKartProps {
  kurban: KurbanKartVeri;
  onHisseDrop: (
    payload: DragPayload,
    kurban: KurbanKartVeri,
    hisse: HisseKutusuVeri,
  ) => void;
  onHisseTikla: (kurban: KurbanKartVeri, hisse: HisseKutusuVeri) => void;
  onHisseIptal?: (kurban: KurbanKartVeri, hisse: HisseKutusuVeri) => void;
  onHisseTransfer?: (kurban: KurbanKartVeri, hisse: HisseKutusuVeri) => void;
  dragDevreDisi?: boolean;
  iptalIzni?: boolean;
  transferIzni?: boolean;
}

export function KurbanKart({
  kurban,
  onHisseDrop,
  onHisseTikla,
  onHisseIptal,
  onHisseTransfer,
  dragDevreDisi,
  iptalIzni,
  transferIzni,
}: KurbanKartProps) {
  const durum = KURBAN_DURUM_RENKLERI[kurban.durumRozeti];

  // Kart arkaplanı doluluk durumuna göre değişir
  const kartBg =
    kurban.dolulukYuzde === 100
      ? "bg-green-50/40 border-green-200"
      : kurban.dolulukYuzde > 0
        ? "bg-amber-50/40 border-amber-200"
        : "bg-stone-50/60 border-stone-200";

  return (
    <div
      className={cn(
        "group flex flex-col gap-2.5 rounded-xl border-2 p-3 transition-colors hover:shadow-md",
        kartBg,
      )}
    >
      {/* Üst başlık */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="from-stone-600 to-stone-700 flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br text-white">
            <Beef size={14} />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="font-mono text-sm font-bold">
              #{kurban.kesimSirasi}{" "}
              <span className="text-muted-foreground text-[10px] font-normal">
                {kurban.cins}
              </span>
            </span>
            <span className="text-muted-foreground text-[10px]">
              {kurban.kupeNo ? `Küpe: ${kurban.kupeNo}` : "Küpe: —"}
              {kurban.agirlik
                ? ` · ${Math.round(kurban.agirlik)} kg`
                : ""}
            </span>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[9px] font-semibold ring-1",
            durum.bg,
            durum.text,
            durum.ring,
          )}
        >
          {durum.etiket}
        </span>
      </div>

      {/* İlerleme barı */}
      <div className="flex items-center gap-2">
        <div className="bg-stone-200 h-1.5 flex-1 overflow-hidden rounded-full">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              kurban.dolulukYuzde === 100
                ? "bg-green-500"
                : kurban.dolulukYuzde > 50
                  ? "bg-amber-500"
                  : kurban.dolulukYuzde > 0
                    ? "bg-orange-500"
                    : "bg-stone-300",
            )}
            style={{ width: `${kurban.dolulukYuzde}%` }}
          />
        </div>
        <span className="text-muted-foreground font-tabular text-[11px] font-semibold">
          {kurban.doluHisseSayisi}/{kurban.hisseSayisi}
        </span>
      </div>

      {/* Hisse kutuları — 7 hisse yan yana */}
      <div
        className={cn(
          "grid gap-1.5",
          kurban.hisseSayisi <= 7
            ? `grid-cols-${kurban.hisseSayisi}`
            : "grid-cols-7",
        )}
        style={{
          gridTemplateColumns: `repeat(${Math.min(kurban.hisseSayisi, 7)}, minmax(0, 1fr))`,
        }}
      >
        {kurban.hisseler.map((h) => (
          <HisseKutusu
            key={h.id}
            hisse={h}
            kurbanKesimSirasi={kurban.kesimSirasi}
            onDrop={(payload, hisse) => onHisseDrop(payload, kurban, hisse)}
            onTikla={(hisse) => onHisseTikla(kurban, hisse)}
            onIptal={
              onHisseIptal ? (hisse) => onHisseIptal(kurban, hisse) : undefined
            }
            onTransfer={
              onHisseTransfer
                ? (hisse) => onHisseTransfer(kurban, hisse)
                : undefined
            }
            dragDevreDisi={dragDevreDisi}
            iptalIzni={iptalIzni}
            transferIzni={transferIzni}
          />
        ))}
      </div>

      {/* Alt bilgi */}
      <div className="text-muted-foreground flex items-center justify-between text-[11px]">
        <span>
          Hisse:{" "}
          <span className="font-tabular text-foreground font-semibold">
            {kurban.onerilenFiyat > 0
              ? new Intl.NumberFormat("tr-TR").format(
                  kurban.onerilenFiyat,
                ) + " ₺"
              : "—"}
          </span>
        </span>
        <span className="font-tabular">
          %{kurban.dolulukYuzde} dolu
        </span>
      </div>
    </div>
  );
}
