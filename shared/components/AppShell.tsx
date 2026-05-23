import { Sidebar } from "./Sidebar";
import { aktifOturum } from "@/shared/lib/session";
import { sidebarModulleri } from "@/shared/lib/module-loader";
import { redirect } from "next/navigation";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Korumalı sayfaların ortak çerçevesi: Sidebar + içerik alanı.
 * Oturum yoksa /giris'e yönlendirir.
 */
export async function AppShell({ children }: AppShellProps) {
  const oturum = await aktifOturum();
  if (!oturum) {
    redirect("/giris");
  }

  const moduller = sidebarModulleri(oturum.rol).map((m) => ({
    id: m.id,
    ad: m.ad,
    ikon: m.ikon,
    anaRota: m.anaRota,
  }));

  return (
    <div className="bg-background flex h-screen">
      <Sidebar
        moduller={moduller}
        kullaniciAdSoyad={oturum.adSoyad}
        kullaniciRol={oturum.rol}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
