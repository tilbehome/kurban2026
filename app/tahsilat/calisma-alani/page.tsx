import { redirect } from "next/navigation";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol, adminMi } from "@/shared/lib/izinler";
import { tenantConfiguredActiveSeasonId } from "@/shared/lib/tenant-master-data-adapter";
import { SalesFinanceWorkspace } from "@/modules/tahsilat/components/SalesFinanceWorkspace";

export const dynamic = "force-dynamic";

export default async function TahsilatCalismaAlaniPage() {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris");
  if (!izinKontrol(oturum, "tahsilat.goruntule") && !izinKontrol(oturum, "kasa.goruntule")) redirect("/");

  const admin = adminMi(oturum.rol);

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Satış Finans Çalışma Alanı"
        altBaslik="Rezervasyon, kesin satış, karma tahsilat, kasa, mutabakat ve onay akışları"
      />
      <SalesFinanceWorkspace
        defaultSeasonId={tenantConfiguredActiveSeasonId()}
        permissions={{
          canRead: admin || izinKontrol(oturum, "tahsilat.goruntule") || izinKontrol(oturum, "kasa.goruntule"),
          canReserve: admin || izinKontrol(oturum, "hisseler.ata") || izinKontrol(oturum, "tahsilat.olustur"),
          canSell: admin || izinKontrol(oturum, "tahsilat.olustur") || izinKontrol(oturum, "hisseler.ata"),
          canReceipt: admin || izinKontrol(oturum, "tahsilat.olustur"),
          canCancel: admin || izinKontrol(oturum, "tahsilat.olustur") || izinKontrol(oturum, "hisseler.iptal"),
          canTransfer: admin || izinKontrol(oturum, "hisseler.transfer"),
          canManagePricing: admin || izinKontrol(oturum, "tahsilat.olustur"),
          canManageAccess: admin || izinKontrol(oturum, "ayarlar.degistir"),
        }}
      />
    </AppShell>
  );
}
