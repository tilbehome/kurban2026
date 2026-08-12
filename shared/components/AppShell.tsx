import { redirect } from "next/navigation";
import { Beef } from "lucide-react";
import { CalendarRange, Search, UserPlus } from "lucide-react";
import Link from "next/link";
import { Sidebar } from "./sidebar/Sidebar";
import { MobileSidebar } from "./sidebar/MobileSidebar";
import { SwGuncellemeUyarisi } from "./SwGuncellemeUyarisi";
import { AltNavigasyon } from "./AltNavigasyon";
import { HizliFAB } from "./HizliFAB";
import { aktifOturum } from "@/shared/lib/session";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Korumalı sayfaların ortak çerçevesi: Sidebar (desktop) + Drawer (mobile) + içerik.
 * Oturum yoksa /giris'e yönlendirir.
 *
 * Menü tek kaynağı: shared/lib/sidebar-config.ts
 */
export async function AppShell({ children }: AppShellProps) {
  const oturum = await aktifOturum();
  if (!oturum) {
    redirect("/giris");
  }

  return (
    <div className="bg-background flex h-screen">
      {/* Desktop sidebar (lg ve üzeri) */}
      <div className="hidden lg:flex">
        <Sidebar
          kullaniciAdSoyad={oturum.adSoyad}
          kullaniciRol={oturum.rol}
        />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="hidden h-12 shrink-0 items-center justify-between border-b bg-background/95 px-5 backdrop-blur lg:flex">
          <nav className="flex items-center gap-1" aria-label="Üst komut alanı">
            <Link href="/musteriler/ara" className="flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><Search size={15} /> Ara <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px]">Ctrl K</kbd></Link>
            <Link href="/musteriler/yeni" className="flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><UserPlus size={15} /> Yeni müşteri</Link>
            <Link href="/musteriler/yeni-sezon" className="flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><CalendarRange size={15} /> Sezon</Link>
          </nav>
          <span className="text-xs text-muted-foreground">{oturum.adSoyad} · {oturum.rol}</span>
        </header>

        {/* Mobile top bar — sadece <lg ekranlarda */}
        <header className="border-sidebar-border bg-sidebar flex h-14 shrink-0 items-center gap-3 border-b px-3 lg:hidden">
          <MobileSidebar
            kullaniciAdSoyad={oturum.adSoyad}
            kullaniciRol={oturum.rol}
          />
          <div className="flex items-center gap-2">
            <div className="from-primary to-primary/70 flex h-8 w-8 items-center justify-center rounded-md bg-linear-to-br text-white">
              <Beef size={16} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold">TilbeCore</span>
              <span className="text-muted-foreground text-[10px]">
                Kurban 2026
              </span>
            </div>
          </div>
        </header>

        {/* Mobile'da alt navigasyon 4rem (h-16) + safe-area kadar yer kaplar.
            Main'e 5rem padding-bottom verip son içeriğin altta gizlenmesini
            önlüyoruz. Desktop'ta padding sıfırlanır. */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children}
        </main>
      </div>

      {/* Mobil saha UI — alt navigasyon + hızlı işlem FAB */}
      <AltNavigasyon />
      <HizliFAB />

      <SwGuncellemeUyarisi />
    </div>
  );
}
