"use client";

import { cn } from "@/shared/lib/utils";
import { formatBildirimSayisi } from "@/shared/lib/sidebar-bildirim-format";
import type { BildirimAnahtari } from "@/shared/lib/sidebar-config";

interface SidebarBildirimRozetProps {
  sayi: number;
  anahtar: BildirimAnahtari;
  /** Daraltılmış sidebar için kompakt mod */
  kompakt?: boolean;
}

/**
 * Bildirim sayısı rozeti — borçlu, boş hisse vs. için.
 * Renk semantiği:
 *   - 🟡 Sarı: dikkat (borçlu, eksik vekalet)
 *   - 🔴 Kırmızı: acil (kritik borç, kasa uyarı)
 *   - 🟢 Yeşil: pozitif (yeni mesaj)
 */
export function SidebarBildirimRozet({
  sayi,
  anahtar,
  kompakt = false,
}: SidebarBildirimRozetProps) {
  if (sayi <= 0) return null;

  const renkSinifi = bildirimRengi(anahtar);
  const metin = formatBildirimSayisi(sayi);

  if (kompakt) {
    return (
      <span
        className={cn(
          "absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ring-2",
          renkSinifi,
        )}
        aria-label={`${sayi} bildirim`}
      >
        {metin}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
        renkSinifi,
      )}
      aria-label={`${sayi} bildirim`}
    >
      {metin}
    </span>
  );
}

function bildirimRengi(anahtar: BildirimAnahtari): string {
  switch (anahtar) {
    case "borclu":
    case "eksikVekalet":
      return "bg-amber-500/90 text-white ring-amber-200";
    case "kritikBorc":
    case "kasaUyari":
      return "bg-red-500/90 text-white ring-red-200";
    case "bekleyenMesaj":
      return "bg-emerald-500/90 text-white ring-emerald-200";
    case "bosHisse":
      return "bg-sky-500/90 text-white ring-sky-200";
    default:
      return "bg-primary/90 text-primary-foreground ring-primary/30";
  }
}
