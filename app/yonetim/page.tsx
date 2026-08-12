import { redirect } from "next/navigation";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { ManagementCommandCenter } from "@/modules/management/components/ManagementCommandCenter";
import { adminMi, izinKontrol } from "@/shared/lib/izinler";
import { aktifOturum } from "@/shared/lib/session";
import { tenantConfiguredActiveSeasonId } from "@/shared/lib/tenant-master-data-adapter";

export const dynamic = "force-dynamic";

export default async function YonetimPage() {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris");
  if (!izinKontrol(oturum, "raporlar.goruntule") && !izinKontrol(oturum, "ayarlar.degistir")) redirect("/");
  const admin = adminMi(oturum.rol);

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Yönetim, Raporlama ve Analitik"
        altBaslik="Komuta merkezi, raporlar, evrensel arama, istisna/onay ve firma yönetimi"
      />
      <ManagementCommandCenter
        defaultSeasonId={tenantConfiguredActiveSeasonId()}
        permissions={{
          canDashboard: admin || izinKontrol(oturum, "raporlar.goruntule") || izinKontrol(oturum, "kasa.goruntule"),
          canReport: admin || izinKontrol(oturum, "raporlar.goruntule"),
          canSearch: admin || izinKontrol(oturum, "raporlar.goruntule") || izinKontrol(oturum, "musteriler.goruntule"),
          canException: admin || izinKontrol(oturum, "ayarlar.degistir") || izinKontrol(oturum, "tv.kontrol"),
          canManageCompany: admin || izinKontrol(oturum, "ayarlar.degistir"),
        }}
      />
    </AppShell>
  );
}
