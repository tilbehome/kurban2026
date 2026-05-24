import { redirect } from "next/navigation";
import { Beef } from "lucide-react";
import { Sidebar } from "./sidebar/Sidebar";
import { MobileSidebar } from "./sidebar/MobileSidebar";
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

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
