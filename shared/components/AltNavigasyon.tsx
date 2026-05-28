"use client";

/**
 * Mobil alt navigasyon — saha personeli için en sık 5 yol parmak altında.
 *
 * Sadece <lg ekranlarda görünür. Desktop'ta sidebar var.
 * iOS safe-area-inset-bottom desteklidir (notch'lu cihazlar).
 *
 * Sticky fixed pozisyon — sayfa scroll'unda kaybolmaz.
 *
 * "Daha Fazla" hamburger drawer'ı tetikler (mevcut MobileSidebar).
 *
 * İkonlar: lucide-react temel set (Home, Beef, Wallet, Users,
 * MoreHorizontal) — versiyon güvenli.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Beef, Home, MoreHorizontal, Users, Wallet } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface AltNavOge {
  ad: string;
  yol: string;
  ikon: typeof Home;
  /** Bu yolun aktif sayılmadığı diğer önekler — prefix çakışmalarına karşı. */
  ekstraAktif?: ReadonlyArray<string>;
}

const OGELER: ReadonlyArray<AltNavOge> = [
  { ad: "Ana", yol: "/", ikon: Home },
  { ad: "Hayvanlar", yol: "/hayvanlar", ikon: Beef },
  { ad: "Tahsilat", yol: "/tahsilat", ikon: Wallet },
  { ad: "Müşteri", yol: "/musteriler", ikon: Users },
];

export function AltNavigasyon() {
  function dahaFazlaTik() {
    // Mevcut MobileSidebar drawer trigger'ını programatik tıkla.
    // MobileSidebar AppShell'in header'ında render edilir ve id ile bulunur.
    const trigger = document.getElementById("mobile-sidebar-trigger");
    trigger?.click();
  }

  const pathname = usePathname();

  function aktifMi(yol: string, ekstra?: ReadonlyArray<string>): boolean {
    if (yol === "/") return pathname === "/";
    if (pathname === yol) return true;
    if (pathname.startsWith(`${yol}/`)) return true;
    return (ekstra ?? []).some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
  }

  return (
    <nav
      aria-label="Mobil alt navigasyon"
      className="bg-background fixed inset-x-0 bottom-0 z-40 border-t shadow-[0_-2px_8px_rgba(0,0,0,0.04)] lg:hidden"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
    >
      <div className="mx-auto flex h-16 max-w-md items-stretch justify-around px-1">
        {OGELER.map((oge) => {
          const Icon = oge.ikon;
          const aktif = aktifMi(oge.yol, oge.ekstraAktif);
          return (
            <Link
              key={oge.yol}
              href={oge.yol}
              aria-current={aktif ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                aktif
                  ? "text-orange-600"
                  : "text-muted-foreground hover:text-foreground",
              )}
              style={{ minHeight: "48px" }}
            >
              <Icon
                size={22}
                className={cn(aktif && "fill-orange-100 stroke-[2.5]")}
              />
              <span>{oge.ad}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={dahaFazlaTik}
          aria-label="Daha Fazla menü"
          className="text-muted-foreground hover:text-foreground flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors"
          style={{ minHeight: "48px" }}
        >
          <MoreHorizontal size={22} />
          <span>Daha</span>
        </button>
      </div>
    </nav>
  );
}
