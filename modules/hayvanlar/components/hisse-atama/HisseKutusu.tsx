"use client";

import { useState } from "react";
import { Plus, CheckCircle2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/shared/lib/utils";
import { avatarGradient } from "@/modules/dashboard/types";
import { formatPara } from "@/shared/lib/para";
import type {
  HisseKutusuVeri,
  DragPayload,
} from "@/modules/hayvanlar/types/hisse-atama";

interface HisseKutusuProps {
  hisse: HisseKutusuVeri;
  kurbanKesimSirasi: number;
  onDrop: (payload: DragPayload, hisse: HisseKutusuVeri) => void;
  onTikla: (hisse: HisseKutusuVeri) => void;
  onIptal?: (hisse: HisseKutusuVeri) => void;
  onTransfer?: (hisse: HisseKutusuVeri) => void;
  /** Drag-drop devre dışı mı (izleyici rolü) */
  dragDevreDisi?: boolean;
  /** Iptal/transfer izinleri */
  iptalIzni?: boolean;
  transferIzni?: boolean;
}

/**
 * Tek bir hisse kutusu — boş/dolu/onaylı durumları + drop zone.
 *
 * - Boş: kesik border + "+" ikon, drop zone aktif
 * - Dolu: müşteri avatarı + başharf, sağ üst noktayla durum
 * - Onaylı: yeşil border + check
 *
 * Drag-over esnasında: boşsa turuncu vurgu, doluysa kırmızı (geçersiz)
 */
export function HisseKutusu({
  hisse,
  kurbanKesimSirasi,
  onDrop,
  onTikla,
  onIptal,
  onTransfer,
  dragDevreDisi,
  iptalIzni,
  transferIzni,
}: HisseKutusuProps) {
  const [dragOver, setDragOver] = useState<"valid" | "invalid" | null>(null);

  const bosMu = hisse.durum === "bos";
  const onayli = hisse.durum === "onayli";

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    if (dragDevreDisi) return;
    e.preventDefault();
    if (bosMu) {
      e.dataTransfer.dropEffect = "copy";
      setDragOver("valid");
    } else {
      e.dataTransfer.dropEffect = "none";
      setDragOver("invalid");
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(null);
    if (!bosMu || dragDevreDisi) return;
    try {
      const raw = e.dataTransfer.getData("application/json");
      const payload = JSON.parse(raw) as DragPayload;
      if (payload.tip !== "musteri") return;
      onDrop(payload, hisse);
    } catch {
      // payload parse hatası — sessizce yut
    }
  }

  const ikonOyari = bosMu ? (
    <Plus size={14} className="text-muted-foreground/60" />
  ) : (
    <span className="font-mono text-[10px] font-bold leading-none">
      {hisse.musteriBashar ?? "??"}
    </span>
  );

  const renkSiniflari = bosMu
    ? "border-dashed border-stone-300 bg-stone-50 text-muted-foreground hover:bg-stone-100"
    : onayli
      ? "border-green-400 bg-green-50 text-green-900"
      : "border-orange-300 bg-orange-50 text-orange-900";

  const dragOverSiniflari =
    dragOver === "valid"
      ? "ring-2 ring-orange-500 bg-orange-100 border-orange-500"
      : dragOver === "invalid"
        ? "ring-2 ring-red-500 bg-red-50 border-red-500"
        : "";

  const grad = hisse.musteriId
    ? avatarGradient(hisse.musteriId)
    : { from: "", to: "" };

  const govde = (
    <div
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(null)}
      onDrop={handleDrop}
      onClick={() => onTikla(hisse)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onTikla(hisse);
        }
      }}
      title={
        hisse.musteriAdSoyad
          ? `${hisse.musteriAdSoyad} · ${formatPara(hisse.hisseFiyati)}`
          : `Boş hisse · ${formatPara(hisse.hisseFiyati)}`
      }
      className={cn(
        "relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-0.5 rounded-md border-2 text-center transition-all",
        renkSiniflari,
        dragOverSiniflari,
      )}
    >
      {/* Hisse no — üst kısımda küçük rozet */}
      <span
        className={cn(
          "absolute top-0.5 left-0.5 rounded px-1 text-[8px] font-bold leading-none",
          bosMu
            ? "text-stone-400"
            : onayli
              ? "bg-green-200 text-green-900"
              : "bg-orange-200 text-orange-900",
        )}
      >
        {hisse.no}
      </span>

      {/* Onaylı işareti */}
      {onayli && (
        <CheckCircle2
          size={10}
          className="absolute top-0.5 right-0.5 text-green-600"
          strokeWidth={3}
        />
      )}

      {/* Merkez içerik */}
      {bosMu ? (
        ikonOyari
      ) : (
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-br text-[10px] font-bold text-white shadow-sm",
            grad.from,
            grad.to,
          )}
        >
          {hisse.musteriBashar}
        </span>
      )}
    </div>
  );

  // Dolu hisse için sağ tık menüsü
  if (!bosMu && (iptalIzni || transferIzni)) {
    return (
      <DropdownMenu>
        <div className="relative">
          {govde}
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="absolute top-0.5 right-0.5 text-stone-500 hover:text-stone-700 z-10 opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
                aria-label="Hisse işlemleri"
              >
                <MoreVertical size={11} />
              </button>
            }
          />
        </div>
        <DropdownMenuContent align="end" className="text-xs">
          <DropdownMenuItem disabled className="text-muted-foreground">
            #{kurbanKesimSirasi}.{hisse.no} · {hisse.musteriAdSoyad}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {transferIzni && onTransfer && (
            <DropdownMenuItem onClick={() => onTransfer(hisse)}>
              Transfer Et
            </DropdownMenuItem>
          )}
          {iptalIzni && onIptal && (
            <DropdownMenuItem
              onClick={() => onIptal(hisse)}
              className="text-red-600"
            >
              Atamayı İptal Et
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return govde;
}
