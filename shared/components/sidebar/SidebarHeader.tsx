"use client";

import Link from "next/link";
import { Beef } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface SidebarHeaderProps {
  daraltilmis: boolean;
}

/**
 * Sidebar tepe — logo + marka + (opsiyonel) bayram sayacı.
 * TilbeCore brand identity.
 */
export function SidebarHeader({ daraltilmis }: SidebarHeaderProps) {
  return (
    <Link
      href="/"
      className={cn(
        "border-sidebar-border flex items-center gap-2.5 border-b px-3 py-4 transition-colors",
        "hover:bg-sidebar-accent/40",
        daraltilmis && "justify-center px-2",
      )}
    >
      <div className="from-primary to-primary/70 ring-primary/20 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br text-white shadow-sm ring-1">
        <Beef size={18} strokeWidth={2} />
      </div>
      {!daraltilmis && (
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm leading-tight font-bold tracking-tight">
            TilbeCore
          </span>
          <span className="text-muted-foreground truncate text-[11px] leading-tight">
            Kurban 2026 • Adabereket
          </span>
        </div>
      )}
    </Link>
  );
}
