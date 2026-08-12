import { redirect } from "next/navigation";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { aktifOturum } from "@/shared/lib/session";
import { adminMi, izinKontrol } from "@/shared/lib/izinler";
import { AdvancedAccessWorkspace } from "@/modules/tenant-access/components/AdvancedAccessWorkspace";

export const dynamic = "force-dynamic";

export default async function RollerIzinlerPage() {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris");
  if (!izinKontrol(oturum, "ayarlar.degistir")) redirect("/");

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Roller, İzinler ve Erişim Yönetimi"
        altBaslik="Veri tabanlı rol sürümleri, kapsamlar, delegasyonlar, onay politikaları ve cihaz/oturum denetimi"
      />
      <AdvancedAccessWorkspace
        canManageAccess={adminMi(oturum.rol) || izinKontrol(oturum, "ayarlar.degistir")}
        canAudit={adminMi(oturum.rol) || izinKontrol(oturum, "ayarlar.degistir")}
      />
    </AppShell>
  );
}
