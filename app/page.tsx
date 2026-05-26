import Link from "next/link";
import { redirect } from "next/navigation";
import { Printer as PrinterIcon } from "lucide-react";
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
import { sonYedekBilgisi, yedekleriListele } from "@/shared/lib/backup";
import { DashboardClient } from "@/modules/dashboard/components/DashboardClient";
import type {
  DashboardIlkVeri,
  SonYedekIlkBilgi,
} from "@/modules/dashboard/components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // KRİTİK: redirect EN BAŞTA — yetkisiz kullanıcı sorgulara hiç ulaşmasın.
  // (AppShell de redirect yapar ama o önce Promise.all'ın çalışmasına izin verir
  //  ve yetkisiz kullanıcıya DB verisi sızabilir.)
  const oturum = await aktifOturum();
  if (!oturum) {
    redirect("/giris?next=/");
  }

  const kasaGoster = izinKontrol(oturum, "kasa.goruntule");
  const yedekManuelIzin = izinKontrol(oturum, "yedek.manuel");

  // Tüm veri paralel çekilir — sayfa yüklenmesi tek round-trip
  const [
    kpi,
    trend,
    kesim,
    islemler,
    kasa,
    whatsapp,
    bildirim,
    yedekZamani,
    yedekBilgi,
  ] = await Promise.all([
    kpiVerileri(oturum),
    tahsilatTrendVerisi("bugun"),
    kesimAkisiVerisi(),
    sonIslemler(10),
    kasaGoster ? kasaDurumu() : Promise.resolve(null),
    whatsappMetrik(),
    sidebarBildirimleri(),
    sonYedekZamaniGetir(),
    sonYedekIlkBilgiGetir(),
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
    .filter((m) => !m.izin || izinKontrol(oturum, m.izin))
    .slice(0, 6);

  return (
    <AppShell>
      <DashboardClient
        ilkVeri={ilkVeri}
        kasaGoster={kasaGoster}
        adSoyad={oturum.adSoyad}
        sonYedek={yedekZamani}
        yedekBilgi={yedekBilgi}
        yedekManuelIzin={yedekManuelIzin}
      />

      <section className="px-4 pb-4 sm:px-6">
        <Link
          href="/raporlar/kesim-listesi/filtre"
          className="hover:border-orange-400 hover:bg-orange-50/50 group flex items-center gap-3 rounded-xl border-2 border-orange-200 bg-linear-to-r from-orange-50 to-amber-50 p-4 transition-all"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100">
            <PrinterIcon className="size-6 text-orange-700" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-orange-900">
              Kesim Listesi Yazdır
            </div>
            <div className="text-muted-foreground mt-0.5 text-xs">
              A4 dikey · 4 kurban / sayfa · Bayram günü saha için
            </div>
          </div>
          <div className="text-orange-600 group-hover:translate-x-0.5 transition-transform">
            →
          </div>
        </Link>
      </section>

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

/**
 * YedekKart için ilk bilgi — Date'i ISO string'e çevirip client'a güvenli
 * serileştirilebilir halde döndürür.
 */
async function sonYedekIlkBilgiGetir(): Promise<SonYedekIlkBilgi> {
  try {
    const b = sonYedekBilgisi();
    return {
      varMi: b.varMi,
      dosyaAdi: b.dosyaAdi,
      zaman: b.zaman ? b.zaman.toISOString() : null,
      boyutKB: b.boyutKB,
      yasGecmisDk: b.yasGecmisDk,
    };
  } catch {
    return {
      varMi: false,
      dosyaAdi: null,
      zaman: null,
      boyutKB: null,
      yasGecmisDk: null,
    };
  }
}
