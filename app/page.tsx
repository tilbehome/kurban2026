import Link from "next/link";
import { AppShell } from "@/shared/components/AppShell";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sidebarMenuleri } from "@/shared/lib/sidebar-config";
import { sidebarBildirimleri } from "@/shared/lib/sidebar-bildirim.service";
import {
  kpiVerileri,
  tahsilatTrendVerisi,
  kesimAkisiVerisi,
  sonIslemler,
  kasaDurumu,
  whatsappMetrik,
} from "@/modules/dashboard/lib/dashboard.service";
import { yedekleriListele } from "@/shared/lib/backup";
import { DashboardClient } from "@/modules/dashboard/components/DashboardClient";
import type { DashboardIlkVeri } from "@/modules/dashboard/components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const oturum = await aktifOturum();
  const rolStub = { rol: oturum?.rol ?? "misafir" };
  const kasaGoster = izinKontrol(rolStub, "kasa.goruntule");

  // Tüm veri paralel çekilir — sayfa yüklenmesi tek round-trip
  const [kpi, trend, kesim, islemler, kasa, whatsapp, bildirim, yedekZamani] =
    await Promise.all([
      kpiVerileri(),
      tahsilatTrendVerisi("bugun"),
      kesimAkisiVerisi(),
      sonIslemler(10),
      kasaGoster ? kasaDurumu() : Promise.resolve(null),
      whatsappMetrik(),
      sidebarBildirimleri(),
      sonYedekZamaniGetir(),
    ]);

  const ilkVeri: DashboardIlkVeri = {
    kpi,
    trend,
    kesim,
    islemler,
    kasa,
    whatsapp,
    bildirim,
  };

  // Hızlı erişim için sidebar config (alt bant)
  const hizliMenuler = sidebarMenuleri
    .filter(
      (m) => m.id !== "ana-sayfa" && m.altMenuler && m.altMenuler.length > 0,
    )
    .filter((m) => !m.izin || izinKontrol(rolStub, m.izin))
    .slice(0, 6);

  return (
    <AppShell>
      <DashboardClient
        ilkVeri={ilkVeri}
        kasaGoster={kasaGoster}
        adSoyad={oturum?.adSoyad ?? "Misafir"}
        sonYedek={yedekZamani}
      />

      <section className="px-4 pb-8 sm:px-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Hızlı Erişim</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {hizliMenuler.map((m) => {
                const Icon = m.ikon;
                const ilkAlt = m.altMenuler?.[0];
                return (
                  <Link
                    key={m.id}
                    href={ilkAlt?.rota ?? m.rota ?? "/"}
                    className={
                      buttonVariants({ variant: "outline" }) +
                      " h-auto flex-col gap-2 py-4"
                    }
                  >
                    <Icon size={20} className="text-primary" />
                    <span className="text-xs font-medium">{m.ad}</span>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}

/**
 * Son yedek zamanını "HH:MM" formatında döndür — hata durumunda "—".
 * Burada güvenli wrapper; backup modülü her ortamda olmayabilir.
 */
async function sonYedekZamaniGetir(): Promise<string> {
  try {
    const liste = yedekleriListele();
    if (liste.length === 0) return "—";
    return liste[0].tarih.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}
