"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { SidebarBildirimRozet } from "./SidebarBildirimRozet";
import type { SidebarAltMenu } from "@/shared/lib/sidebar-config";
import type { SidebarBildirimleri } from "@/shared/lib/sidebar-bildirim.service";

interface SidebarMenuItemProps {
  alt: SidebarAltMenu;
  aktif: boolean;
  bildirimler?: SidebarBildirimleri | null;
  onTiklama?: () => void;
}

/**
 * Alt menü öğesi — akordeon ana menünün altında render edilir.
 */
export function SidebarMenuItem({
  alt,
  aktif,
  bildirimler,
  onTiklama,
}: SidebarMenuItemProps) {
  const Ikon = alt.ikon;
  const sayi =
    alt.bildirimAnahtari && bildirimler
      ? (bildirimler[alt.bildirimAnahtari] ?? 0)
      : 0;

  const linkProps = alt.yeniSekme
    ? { target: "_blank" as const, rel: "noopener noreferrer" }
    : {};

  return (
    <Link
      href={alt.rota}
      {...linkProps}
      onClick={onTiklama}
      className={cn(
        "group flex items-center gap-2.5 rounded-md border-l-2 px-2.5 py-1.5 text-[13px] transition-colors",
        aktif
          ? "border-primary bg-primary/10 text-primary font-semibold"
          : "text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground border-transparent",
      )}
    >
      <Ikon
        size={14}
        className={cn(
          "shrink-0 transition-colors",
          aktif
            ? "text-primary"
            : "text-muted-foreground group-hover:text-foreground",
        )}
      />
      <span className="flex-1 truncate">{alt.ad}</span>
      {alt.yeniSekme && (
        <ExternalLink size={11} className="text-muted-foreground/60 shrink-0" />
      )}
      {alt.placeholder && (
        <span className="text-muted-foreground bg-muted rounded px-1 py-0 text-[9px] font-medium tracking-wider uppercase">
          Yakında
        </span>
      )}
      {alt.bildirimAnahtari && sayi > 0 && (
        <SidebarBildirimRozet sayi={sayi} anahtar={alt.bildirimAnahtari} />
      )}
    </Link>
  );
}
