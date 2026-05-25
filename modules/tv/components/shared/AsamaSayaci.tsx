"use client";

import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/utils";

interface Props {
  /** ISO datetime string — Kurban.asamaBaslangic */
  baslangic: string | null | undefined;
  /** Görsel boyut: kompakt (TV/personel) veya geniş (kontrol tablosu) */
  boyut?: "kompakt" | "genis";
  /** Renk teması: koyu (TV) veya açık (kontrol panel) */
  tema?: "koyu" | "acik";
  /** Saat ikonunu gizle */
  ikonsuz?: boolean;
}

const AMBER_ESIK_SN = 5 * 60; // 5 dakika
const KIRMIZI_ESIK_SN = 10 * 60; // 10 dakika

/**
 * Aşama sayacı — kurbanın mevcut aşamasında geçen süreyi canlı gösterir.
 *
 * Renkler (gecikme uyarısı):
 *   0-5dk: yeşil (normal)
 *   5-10dk: amber (uyarı)
 *   10dk+: kırmızı (gecikme)
 */
export function AsamaSayaci({
  baslangic,
  boyut = "kompakt",
  tema = "koyu",
  ikonsuz = false,
}: Props) {
  const [gecen, setGecen] = useState<number | null>(null);

  useEffect(() => {
    if (!baslangic) {
      setGecen(null);
      return;
    }
    const baslangicMs = new Date(baslangic).getTime();
    if (Number.isNaN(baslangicMs)) {
      setGecen(null);
      return;
    }

    const tick = () => {
      setGecen(Math.max(0, Math.floor((Date.now() - baslangicMs) / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [baslangic]);

  if (gecen === null) return null;

  const dk = Math.floor(gecen / 60);
  const sn = gecen % 60;
  const metin = `${dk.toString().padStart(2, "0")}:${sn
    .toString()
    .padStart(2, "0")}`;

  const renk =
    gecen >= KIRMIZI_ESIK_SN
      ? tema === "koyu"
        ? "text-red-400"
        : "text-red-600"
      : gecen >= AMBER_ESIK_SN
        ? tema === "koyu"
          ? "text-amber-400"
          : "text-amber-600"
        : tema === "koyu"
          ? "text-emerald-400"
          : "text-emerald-600";

  const yaziBoyutu = boyut === "genis" ? "text-sm" : "text-xs";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono font-semibold tabular-nums",
        yaziBoyutu,
        renk,
      )}
      title={`Bu aşamada geçen süre: ${dk} dk ${sn} sn`}
    >
      {!ikonsuz && <span aria-hidden>⏱</span>}
      {metin}
    </span>
  );
}
