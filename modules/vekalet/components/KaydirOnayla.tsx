"use client";

/**
 * Sağa-kaydır-onayla bileşeni. Yanlış-tık önleme amaçlı.
 *
 * Touch + pointer event'leri tek API ile (Pointer Events). Mobil
 * tarayıcılarda touch ve mouse event'lerini sıralı tetikler — pointer
 * tek olay akışıyla bu duplicate fire sorununu çözer.
 */

import { useCallback, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface Props {
  /** Slider üzerindeki çağrı yazısı — örn. "ONAYLA" veya "İPTAL ET" */
  metin: string;
  /** true ise yeşil tema (zaten onaylı, slider iptal eder) */
  onayli?: boolean;
  yukleniyor?: boolean;
  onTamamlandi: () => void;
  className?: string;
}

const ESIK_YUZDE = 70;

export function KaydirOnayla({
  metin,
  onayli = false,
  yukleniyor = false,
  onTamamlandi,
  className,
}: Props) {
  const [kaydirma, setKaydirma] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const baslangic = useRef<number>(0);
  const aktifPointerId = useRef<number | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (yukleniyor || aktifPointerId.current !== null) return;
      containerRef.current?.setPointerCapture(e.pointerId);
      aktifPointerId.current = e.pointerId;
      baslangic.current = e.clientX;
    },
    [yukleniyor],
  );

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (aktifPointerId.current !== e.pointerId || !containerRef.current) return;
    const genislik = containerRef.current.getBoundingClientRect().width;
    if (genislik <= 0) return;
    const fark = e.clientX - baslangic.current;
    const yuzde = Math.max(0, Math.min(100, (fark / genislik) * 100));
    setKaydirma(yuzde);
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (aktifPointerId.current !== e.pointerId) return;
      containerRef.current?.releasePointerCapture(e.pointerId);
      aktifPointerId.current = null;

      if (kaydirma >= ESIK_YUZDE) {
        setKaydirma(100);
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          try {
            navigator.vibrate(50);
          } catch {
            // Bazı tarayıcılar policy ile engelliyor — sessiz geç
          }
        }
        onTamamlandi();
        // Parent state güncellenirse re-render'da prop değişir; yine de
        // kullanıcı hızlı arka arkaya tetiklemesin diye kısa kilit.
        window.setTimeout(() => setKaydirma(0), 400);
      } else {
        setKaydirma(0);
      }
    },
    [kaydirma, onTamamlandi],
  );

  const trackSinif = onayli
    ? "bg-emerald-50 border-emerald-300"
    : "bg-amber-50 border-amber-300";
  const thumbSinif = onayli ? "bg-emerald-500" : "bg-amber-500";
  const trackYazi = onayli ? "text-emerald-800" : "text-amber-900";

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-12 rounded-lg border-2 overflow-hidden select-none touch-none",
        trackSinif,
        yukleniyor && "opacity-50 pointer-events-none",
        className,
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="button"
      aria-label={`Sağa kaydır: ${metin}`}
      aria-disabled={yukleniyor}
    >
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center text-sm font-semibold pointer-events-none",
          trackYazi,
        )}
      >
        <ChevronRight className="mr-1.5 h-4 w-4" />
        Sağa kaydır → {metin}
      </div>

      <div
        className={cn(
          "absolute top-0 left-0 h-full flex items-center justify-end pr-3 pointer-events-none",
          thumbSinif,
          aktifPointerId.current === null ? "transition-all duration-200 ease-out" : "",
        )}
        style={{ width: `${kaydirma}%` }}
        aria-hidden="true"
      >
        {kaydirma > 10 && <ChevronRight className="h-5 w-5 text-white" />}
      </div>
    </div>
  );
}
