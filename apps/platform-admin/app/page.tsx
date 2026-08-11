import { getPlatformDashboard } from "@tilbecore/platform";
import { AdminShell, PageHead } from "../src/components";
import { pageActor } from "../src/page-auth";
import { platformRepository } from "../src/platform-server";

export const dynamic = "force-dynamic";
const metrics = [
  ["activeOrganizations","Aktif firma","/organizations?status=active"], ["provisioningOrganizations","Kurulum sürüyor","/organizations?status=provisioning"],
  ["failedProvisioningJobs","Başarısız provisioning","/provisioning?status=failed"], ["activeLicenses","Aktif lisans","/plans"],
  ["suspendedLicenses","Askıdaki lisans","/plans"], ["expiredLicenses","Süresi biten lisans","/plans"],
  ["unhealthyTenants","Sağlıksız tenant DB","/organizations"], ["unverifiedBackups","Doğrulanmamış backup","/backups"],
  ["pendingDomains","DNS/TLS bekleyen","/domains"], ["openSupportSessions","Açık destek oturumu","/support"],
  ["criticalIncidents","Kritik olay","/audit"], ["migrationPendingTenants","Migration bekleyen","/organizations"],
  ["quotaAlerts","Kota uyarısı","/plans"],
] as const;

export default async function DashboardPage() {
  const actor = await pageActor("platform.dashboard.read");
  const snapshot = await getPlatformDashboard(platformRepository(), actor, new Date().toISOString());
  return <AdminShell><PageHead title="Platform Komuta Merkezi" description="Karar ve müdahale gerektiren gerçek platform sinyalleri." /><section className="grid">{metrics.map(([key,label,href]) => <article className={`card metric ${Number(snapshot[key]) > 0 && ["failedProvisioningJobs","unhealthyTenants","unverifiedBackups","criticalIncidents"].includes(key) ? "warning" : ""}`} key={key}><span>{label}</span><strong>{snapshot[key]}</strong><a href={href}>İlgili kayıtlara git →</a></article>)}</section></AdminShell>;
}
