"use client";

import Link from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { SidebarBildirimRozet } from "./SidebarBildirimRozet";
import { SidebarMenuItem } from "./SidebarMenuItem";
import type { SidebarAnaMenu } from "@/shared/lib/sidebar-config";
import type { SidebarBildirimleri } from "@/shared/lib/sidebar-bildirim.service";

interface SidebarMenuGroupProps {
  menu: SidebarAnaMenu;
  acik: boolean;
  aktif: boolean;
  /** Aktif sayfanın yolu — alt menülerden hangisinin highlight olacağını belirler */
  pathname: string;
  bildirimler?: SidebarBildirimleri | null;
  daraltilmis: boolean;
  /** Mobile drawer modu — büyük dokunmatik hedef + büyük font */
  mobil?: boolean;
  onToggle: () => void;
  /** Mobile drawer kapanması için */
  onAltMenuTiklama?: () => void;
}

/**
 * Ana menü grubu — akordeon davranışlı. Tek-sayfa (alt menüsüz) menüler de
 * burada render edilir (alt menü yoksa link gibi davranır).
 */
export function SidebarMenuGroup({
  menu,
  acik,
  aktif,
  pathname,
  bildirimler,
  daraltilmis,
  mobil = false,
  onToggle,
  onAltMenuTiklama,
}: SidebarMenuGroupProps) {
  const Ikon = menu.ikon;
  const grupSayisi =
    menu.bildirimAnahtari && bildirimler
      ? (bildirimler[menu.bildirimAnahtari] ?? 0)
      : 0;

  // Alt menüsü yoksa: doğrudan link
  if (!menu.altMenuler || menu.altMenuler.length === 0) {
    const linkProps = menu.yeniSekme
      ? { target: "_blank" as const, rel: "noopener noreferrer" }
      : {};
    return (
      <Link
        href={menu.rota ?? "/"}
        {...linkProps}
        onClick={onAltMenuTiklama}
        className={cn(
          "group relative flex items-center gap-3 rounded-md font-medium transition-colors",
          mobil ? "min-h-12 px-3 py-3 text-base" : "px-2.5 py-2 text-sm",
          daraltilmis && "justify-center px-1.5",
          aktif
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        )}
        title={daraltilmis ? menu.ad : undefined}
      >
        <span className="relative">
          <Ikon size={mobil ? 22 : 18} />
          {daraltilmis && grupSayisi > 0 && menu.bildirimAnahtari && (
            <SidebarBildirimRozet
              kompakt
              sayi={grupSayisi}
              anahtar={menu.bildirimAnahtari}
            />
          )}
        </span>
        {!daraltilmis && (
          <>
            <span className="flex-1 truncate">{menu.ad}</span>
            {menu.yeniSekme && (
              <ExternalLink size={13} className="opacity-60" />
            )}
            {menu.bildirimAnahtari && grupSayisi > 0 && (
              <SidebarBildirimRozet
                sayi={grupSayisi}
                anahtar={menu.bildirimAnahtari}
              />
            )}
          </>
        )}
      </Link>
    );
  }

  // Akordeon grubu — alt menülü
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "group relative flex w-full items-center gap-3 rounded-md font-medium transition-colors",
          mobil ? "min-h-12 px-3 py-3 text-base" : "px-2.5 py-2 text-sm",
          daraltilmis && "justify-center px-1.5",
          aktif
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
        )}
        aria-expanded={acik}
        title={daraltilmis ? menu.ad : undefined}
      >
        <span className="relative">
          <Ikon size={mobil ? 22 : 18} />
          {daraltilmis && grupSayisi > 0 && menu.bildirimAnahtari && (
            <SidebarBildirimRozet
              kompakt
              sayi={grupSayisi}
              anahtar={menu.bildirimAnahtari}
            />
          )}
        </span>
        {!daraltilmis && (
          <>
            <span className="flex-1 truncate text-left">{menu.ad}</span>
            {menu.bildirimAnahtari && grupSayisi > 0 && (
              <SidebarBildirimRozet
                sayi={grupSayisi}
                anahtar={menu.bildirimAnahtari}
              />
            )}
            <ChevronRight
              size={14}
              className={cn(
                "shrink-0 transition-transform duration-200",
                acik ? "rotate-90" : "rotate-0",
              )}
            />
          </>
        )}
      </button>

      {/* Alt menü — akordeon (CSS grid animasyon) */}
      {!daraltilmis && (
        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-200 ease-out",
            acik ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="overflow-hidden">
            <div className="mt-0.5 flex flex-col gap-0.5 pl-3">
              {menu.altMenuler.map((alt) => (
                <SidebarMenuItem
                  key={alt.id}
                  alt={alt}
                  aktif={
                    pathname === alt.rota ||
                    pathname.startsWith(alt.rota + "/")
                  }
                  bildirimler={bildirimler}
                  mobil={mobil}
                  onTiklama={onAltMenuTiklama}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
