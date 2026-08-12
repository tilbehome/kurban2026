import { redirect } from "next/navigation";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { aktifOturum } from "@/shared/lib/session";
import { adminMi, izinKontrol } from "@/shared/lib/izinler";
import { tenantConfiguredActiveSeasonId } from "@/shared/lib/tenant-master-data-adapter";
import { QurbanOperationsWorkspace } from "@/modules/operations/components/QurbanOperationsWorkspace";

export const dynamic = "force-dynamic";

export default async function OperasyonPage() {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris");
  if (!izinKontrol(oturum, "tv.kontrol") && !izinKontrol(oturum, "hayvanlar.goruntule") && !izinKontrol(oturum, "tahsilat.goruntule")) redirect("/");
  const admin = adminMi(oturum.rol);

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Kurban Operasyon Merkezi"
        altBaslik="Vekâlet, QR, kesim, tartım, paketleme, soğuk oda, teslimat, PWA ve TV akışları"
      />
      <QurbanOperationsWorkspace
        defaultSeasonId={tenantConfiguredActiveSeasonId()}
        permissions={{
          canProxy: admin || izinKontrol(oturum, "tv.kontrol") || izinKontrol(oturum, "musteriler.vekalet.yaz"),
          canSlaughter: admin || izinKontrol(oturum, "tv.kontrol"),
          canWeigh: admin || izinKontrol(oturum, "tv.kontrol"),
          canPackage: admin || izinKontrol(oturum, "tv.kontrol"),
          canDeliver: admin || izinKontrol(oturum, "tv.kontrol"),
          canField: admin || izinKontrol(oturum, "tv.kontrol"),
          canTv: admin || izinKontrol(oturum, "hayvanlar.goruntule") || izinKontrol(oturum, "tv.kontrol"),
        }}
      />
    </AppShell>
  );
}
