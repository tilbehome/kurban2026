import { redirect } from "next/navigation";
import { aktifOturum } from "@/shared/lib/session";
import { adminMi, izinKontrol } from "@/shared/lib/izinler";
import { tenantConfiguredActiveSeasonId } from "@/shared/lib/tenant-master-data-adapter";
import { QurbanOperationsWorkspace } from "@/modules/operations/components/QurbanOperationsWorkspace";

export const dynamic = "force-dynamic";

export default async function FieldOperationsPage() {
  const session = await aktifOturum();
  if (!session) redirect("/giris?next=/saha");
  if (!izinKontrol(session, "tv.kontrol") && !izinKontrol(session, "hayvanlar.goruntule")) redirect("/");
  const admin = adminMi(session.rol);
  return (
    <main className="min-h-screen bg-neutral-950">
      <QurbanOperationsWorkspace
        defaultSeasonId={tenantConfiguredActiveSeasonId()}
        permissions={{
          canProxy: admin || izinKontrol(session, "musteriler.vekalet.yaz"),
          canSlaughter: admin || izinKontrol(session, "tv.kontrol"),
          canWeigh: admin || izinKontrol(session, "tv.kontrol"),
          canPackage: admin || izinKontrol(session, "tv.kontrol"),
          canDeliver: admin || izinKontrol(session, "tv.kontrol"),
          canField: admin || izinKontrol(session, "tv.kontrol"),
          canTv: false,
        }}
      />
    </main>
  );
}
