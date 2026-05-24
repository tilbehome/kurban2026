import { Sidebar } from "./Sidebar";
import { aktifOturum } from "@/shared/lib/session";
import { redirect } from "next/navigation";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Korumalı sayfaların ortak çerçevesi: Sidebar + içerik alanı.
 * Oturum yoksa /giris'e yönlendirir.
 *
 * Sidebar menüsü `menu.config.ts`'den okunur — modül bağımlı değildir.
 */
export async function AppShell({ children }: AppShellProps) {
  const oturum = await aktifOturum();
  if (!oturum) {
    redirect("/giris");
  }

  return (
    <div className="bg-background flex h-screen">
      <Sidebar
        kullaniciAdSoyad={oturum.adSoyad}
        kullaniciRol={oturum.rol}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
