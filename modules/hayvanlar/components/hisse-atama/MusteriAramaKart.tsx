"use client";

import { Star, GripVertical } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { avatarGradient } from "@/modules/dashboard/types";
import { formatPara } from "@/shared/lib/para";
import type {
  EksikHisseliMusteri,
  DragPayload,
} from "@/modules/hayvanlar/types/hisse-atama";

interface MusteriAramaKartProps {
  musteri: EksikHisseliMusteri;
  secili: boolean;
  onSec: () => void;
  /** Drag-drop devre dışı mı (izleyici rolü) */
  dragDevreDisi?: boolean;
}

/**
 * Sol paneldeki sürüklenebilir müşteri kartı.
 * - Tıkla: müşteri seçilir (sağ panele yansır)
 * - Sürükle: hisse kutusuna bırakılabilir
 */
export function MusteriAramaKart({
  musteri,
  secili,
  onSec,
  dragDevreDisi,
}: MusteriAramaKartProps) {
  const grad = avatarGradient(musteri.id);
  const kalan = musteri.toplamBedel - musteri.odenenToplam;

  function handleDragStart(e: React.DragEvent<HTMLDivElement>) {
    if (dragDevreDisi) {
      e.preventDefault();
      return;
    }
    const payload: DragPayload = {
      tip: "musteri",
      musteriId: musteri.id,
      musteriAdSoyad: musteri.adSoyad,
      musteriBashar: musteri.bashar,
    };
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "copy";
  }

  return (
    <div
      role="button"
      tabIndex={0}
      draggable={!dragDevreDisi}
      onDragStart={handleDragStart}
      onClick={onSec}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSec();
        }
      }}
      className={cn(
        "group relative cursor-grab rounded-lg border border-stone-200 bg-white p-2.5 transition-all hover:border-orange-300 hover:shadow-sm active:cursor-grabbing",
        secili && "border-orange-500 ring-2 ring-orange-200",
        dragDevreDisi && "cursor-pointer",
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-xs font-bold text-white shadow-sm",
            grad.from,
            grad.to,
          )}
        >
          {musteri.bashar}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold">
              {musteri.adSoyad}
            </span>
            {musteri.vipMi && (
              <Star
                size={11}
                className="shrink-0 fill-amber-400 text-amber-500"
              />
            )}
          </div>
          {musteri.atananHisseSayisi > 0 ? (
            <span className="text-muted-foreground truncate text-[11px]">
              {musteri.atananHisseSayisi} hisse · Kurban{" "}
              {musteri.atananKurbanlar.map((s) => `#${s}`).join(", ")}
            </span>
          ) : (
            <span className="text-amber-600 text-[11px] font-medium">
              Henüz atama yok
            </span>
          )}
          {musteri.atananHisseSayisi > 0 && (
            <div className="font-tabular mt-0.5 flex items-center gap-1.5 text-[11px]">
              {kalan > 0 ? (
                <span className="text-red-600 font-semibold">
                  -{formatPara(kalan)} borç
                </span>
              ) : musteri.toplamBedel > 0 ? (
                <span className="text-green-600 font-semibold">
                  ✓ Tahsil edildi
                </span>
              ) : null}
            </div>
          )}
        </div>
        {!dragDevreDisi && (
          <GripVertical
            size={14}
            className="text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 transition-colors"
          />
        )}
      </div>
    </div>
  );
}
