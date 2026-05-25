"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/shared/lib/utils";

interface SidebarHeaderProps {
  daraltilmis: boolean;
}

/**
 * Sidebar tepe — Ada Bereket markası.
 * Yazılım altyapısı (TilbeCore) sadece login/footer'da görünür.
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
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-stone-200">
        <Image
          src="/icons/icon-192.png"
          alt="Ada Bereket"
          width={40}
          height={40}
          unoptimized
          className="h-full w-full object-contain"
        />
      </div>
      {!daraltilmis && (
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm leading-tight font-bold tracking-tight">
            Ada Bereket
          </span>
          <span className="text-muted-foreground truncate text-[11px] leading-tight">
            Hayvancılık · Kurban 2026
          </span>
        </div>
      )}
    </Link>
  );
}
