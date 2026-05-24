"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { Rol } from "@/shared/types/module.types";
import {
  MENU,
  aktifAnaMenu,
  menuyuFiltrele,
  type MenuChild,
  type MenuItem,
} from "./menu.config";

interface SidebarProps {
  kullaniciAdSoyad: string;
  kullaniciRol: Rol;
}

const STORAGE_KEY = "tilbe.sidebar.openMenus";

export function Sidebar({ kullaniciAdSoyad, kullaniciRol }: SidebarProps) {
  const pathname = usePathname();
  const menu = menuyuFiltrele(MENU, kullaniciRol);
  const aktifMenu = aktifAnaMenu(pathname, menu);

  const [acikMenuler, setAcikMenuler] = useState<string[]>([]);
  const [yuklendi, setYuklendi] = useState(false);

  // localStorage'dan açık menüleri yükle + aktif sayfanın menüsünü otomatik aç
  useEffect(() => {
    let baslangic: string[] = [];
    try {
      const kayit = localStorage.getItem(STORAGE_KEY);
      if (kayit) {
        const parse = JSON.parse(kayit) as unknown;
        if (Array.isArray(parse)) {
          baslangic = parse.filter((s): s is string => typeof s === "string");
        }
      }
    } catch {
      baslangic = [];
    }
    if (aktifMenu && !baslangic.includes(aktifMenu)) {
      baslangic = [...baslangic, aktifMenu];
    }
    setAcikMenuler(baslangic);
    setYuklendi(true);
    // pathname değiştiğinde tekrar kontrol et — yeni menüye geçtiyse aç
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktifMenu]);

  // localStorage'a kaydet
  useEffect(() => {
    if (!yuklendi) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(acikMenuler));
    } catch {
      // localStorage yoksa sessizce geç
    }
  }, [acikMenuler, yuklendi]);

  const acikMi = (label: string) => acikMenuler.includes(label);
  const toggleMenu = (label: string) => {
    setAcikMenuler((eski) =>
      eski.includes(label) ? eski.filter((m) => m !== label) : [...eski, label],
    );
  };

  return (
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border flex h-screen w-64 shrink-0 flex-col border-r">
      <div className="border-sidebar-border flex items-center gap-2 border-b px-4 py-4">
        <div className="bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-lg font-bold">
          T
        </div>
        <div className="flex flex-col">
          <span className="text-sm leading-tight font-semibold">Tilbe Kurban</span>
          <span className="text-muted-foreground text-xs leading-tight">
            Bayram 2026
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <div className="flex flex-col gap-0.5">
          {menu.map((item) =>
            item.children ? (
              <AkordiyonGrubu
                key={item.label}
                item={item}
                acik={acikMi(item.label)}
                aktifMenu={aktifMenu === item.label}
                onToggle={() => toggleMenu(item.label)}
                pathname={pathname}
              />
            ) : (
              <TekLink
                key={item.label}
                href={item.href ?? "/"}
                ikon={item.ikon}
                ad={item.label}
                aktif={pathname === item.href}
              />
            ),
          )}
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

interface AkordiyonGrubuProps {
  item: MenuItem;
  acik: boolean;
  aktifMenu: boolean;
  onToggle: () => void;
  pathname: string;
}

function AkordiyonGrubu({
  item,
  acik,
  aktifMenu,
  onToggle,
  pathname,
}: AkordiyonGrubuProps) {
  const Icon =
    (Icons as unknown as Record<string, LucideIcon | undefined>)[item.ikon] ??
    Icons.Square;

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
          aktifMenu
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
        )}
        aria-expanded={acik}
      >
        <Icon size={18} />
        <span className="flex-1 text-left">{item.label}</span>
        <Icons.ChevronRight
          size={16}
          className={cn(
            "transition-transform duration-200",
            acik ? "rotate-90" : "rotate-0",
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          acik ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="mt-0.5 flex flex-col gap-0.5 pl-4">
            {item.children?.map((child) => (
              <AltLink
                key={child.href}
                child={child}
                aktif={pathname === child.href}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface AltLinkProps {
  child: MenuChild;
  aktif: boolean;
}

function AltLink({ child, aktif }: AltLinkProps) {
  return (
    <Link
      href={child.href}
      className={cn(
        "border-l-2 px-3 py-1.5 text-sm transition-colors",
        aktif
          ? "border-primary bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground border-transparent",
      )}
    >
      {child.label}
    </Link>
  );
}

interface TekLinkProps {
  href: string;
  ikon: string;
  ad: string;
  aktif: boolean;
}

function TekLink({ href, ikon, ad, aktif }: TekLinkProps) {
  const Icon =
    (Icons as unknown as Record<string, LucideIcon | undefined>)[ikon] ??
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
