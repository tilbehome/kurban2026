"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModuleConfig, Rol } from "@/shared/types/module.types";

interface SidebarProps {
  moduller: Pick<ModuleConfig, "id" | "ad" | "ikon" | "anaRota">[];
  kullaniciAdSoyad: string;
  kullaniciRol: Rol;
}

export function Sidebar({ moduller, kullaniciAdSoyad, kullaniciRol }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border flex h-screen w-64 shrink-0 flex-col border-r">
      <div className="border-sidebar-border flex items-center gap-2 border-b px-4 py-4">
        <div className="bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-lg font-bold">
          T
        </div>
        <div className="flex flex-col">
          <span className="text-sm leading-tight font-semibold">Tilbe Kurban</span>
          <span className="text-muted-foreground text-xs leading-tight">Bayram 2026</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <div className="flex flex-col gap-0.5">
          <SidebarLink
            href="/"
            ikon="LayoutDashboard"
            ad="Dashboard"
            aktif={pathname === "/"}
          />
          {moduller.map((modul) => (
            <SidebarLink
              key={modul.id}
              href={modul.anaRota}
              ikon={modul.ikon}
              ad={modul.ad}
              aktif={
                pathname === modul.anaRota || pathname.startsWith(modul.anaRota + "/")
              }
            />
          ))}
        </div>
      </nav>

      <div className="border-sidebar-border border-t p-3">
        <div className="mb-2 flex items-center gap-2 px-2">
          <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold">
            {kullaniciAdSoyad.charAt(0).toUpperCase()}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{kullaniciAdSoyad}</span>
            <span className="text-muted-foreground text-xs capitalize">
              {kullaniciRol}
            </span>
          </div>
        </div>
        <form action="/api/auth/cikis" method="POST">
          <button
            type="submit"
            className="hover:bg-sidebar-accent flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors"
          >
            <Icons.LogOut size={16} />
            Çıkış Yap
          </button>
        </form>
      </div>
    </aside>
  );
}

interface SidebarLinkProps {
  href: string;
  ikon: string;
  ad: string;
  aktif: boolean;
}

function SidebarLink({ href, ikon, ad, aktif }: SidebarLinkProps) {
  const Icon = (Icons as unknown as Record<string, LucideIcon | undefined>)[ikon] ??
    Icons.Square;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
        aktif
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon size={18} />
      <span>{ad}</span>
    </Link>
  );
}
