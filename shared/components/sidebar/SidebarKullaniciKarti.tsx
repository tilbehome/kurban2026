"use client";

import { LogOut } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { Rol } from "@/shared/types/module.types";
import { ROL_ADLARI } from "@/shared/types/module.types";

interface SidebarKullaniciKartiProps {
  adSoyad: string;
  rol: Rol;
  daraltilmis: boolean;
}

/**
 * Sidebar dibinde kullanıcı kartı + çıkış butonu.
 */
export function SidebarKullaniciKarti({
  adSoyad,
  rol,
  daraltilmis,
}: SidebarKullaniciKartiProps) {
  const bashar = adSoyad.charAt(0).toUpperCase();

  if (daraltilmis) {
    return (
      <div className="border-sidebar-border flex flex-col items-center gap-2 border-t p-2">
        <div
          className="from-primary to-primary/70 ring-primary/20 flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br text-sm font-semibold text-white ring-2"
          title={`${adSoyad} (${ROL_ADLARI[rol]})`}
        >
          {bashar}
        </div>
        <form action="/api/auth/cikis" method="POST" className="w-full">
          <button
            type="submit"
            className="hover:bg-sidebar-accent flex w-full items-center justify-center rounded-md py-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Çıkış Yap"
            aria-label="Çıkış Yap"
          >
            <LogOut size={14} />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="border-sidebar-border border-t p-3">
      <div className="mb-2 flex items-center gap-2 px-1">
        <div className="from-primary to-primary/70 ring-primary/20 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-sm font-semibold text-white ring-2">
          {bashar}
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm leading-tight font-semibold">
            {adSoyad}
          </span>
          <span className="text-muted-foreground truncate text-[11px] leading-tight">
            {ROL_ADLARI[rol]}
          </span>
        </div>
      </div>
      <form action="/api/auth/cikis" method="POST">
        <button
          type="submit"
          className={cn(
            "hover:bg-sidebar-accent flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
            "text-muted-foreground hover:text-foreground",
          )}
        >
          <LogOut size={14} />
          Çıkış Yap
        </button>
      </form>
    </div>
  );
}
