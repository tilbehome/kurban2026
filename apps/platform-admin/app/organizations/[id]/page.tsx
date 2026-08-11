import { getPlatformOrganization360 } from "@tilbecore/platform";
import type { OrganizationId } from "@tilbecore/contracts";
import { AdminShell, JsonPanel, PageHead } from "../../../src/components";
import { pageActor } from "../../../src/page-auth";
import { platformRepository } from "../../../src/platform-server";

export const dynamic = "force-dynamic";
export default async function Organization360Page({ params }: { params: Promise<{ id:string }> }) {
  const actor=await pageActor("platform.organization.read"); const {id}=await params; const data=await getPlatformOrganization360(platformRepository(),actor,id as OrganizationId);
  const sections=[
    ["overview","Genel özet",{id:data.id,tenantInstanceId:data.tenantInstanceId,status:data.status,domain:data.domain,databaseStatus:data.databaseStatus,criticalAlert:data.criticalAlert}],
    ["lifecycle","Yaşam döngüsü",data.lifecycleEvents], ["license","Plan, lisans ve entitlement",data.license],
    ["domains","Domain ve custom domain",data.domains], ["provisioning","Provisioning işleri",data.provisioningJobs],
    ["database","Tenant DB ve migration",data.tenant], ["admins","Firma Admin davetleri",data.adminInvitations],
    ["backups","Backup / restore",data.backups], ["support","SupportSession",data.supportSessions], ["audit","Audit ve olay geçmişi",data.auditEvents],
  ] as const;
  return <AdminShell><PageHead title={`${data.displayName} 360°`} description={`${data.slug} · ${data.status}`} /><nav className="tabs">{sections.map(([key,label])=><a key={key} href={`#${key}`}>{label}</a>)}</nav><section className="stack">{sections.map(([key,label,value])=><article className="card" id={key} key={key}><h2>{label}</h2><JsonPanel value={value}/></article>)}<article className="card"><h2>Yaşam döngüsü işlemi</h2><form className="form-grid" action={`/api/organizations/${data.id}/lifecycle`} method="post"><input type="hidden" name="fromStatus" value={data.status}/><input type="hidden" name="expectedVersion" value={data.version}/><label>Yeni durum<select name="toStatus" required>{["provisioning","active","suspended","restricted","archived","provisioning_failed"].map(x=><option key={x}>{x}</option>)}</select></label><label>Neden<textarea name="reason" required minLength={8}/></label><label>Etki özeti<textarea name="impactSummary" required minLength={8}/></label><button className="button" type="submit">Onaylı geçişi uygula</button></form></article></section></AdminShell>;
}
