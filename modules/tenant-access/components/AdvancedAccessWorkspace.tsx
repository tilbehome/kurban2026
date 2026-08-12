"use client";

import { useEffect, useState, useTransition, type ComponentType, type ReactNode } from "react";
import {
  Copy,
  KeyRound,
  Layers3,
  MonitorSmartphone,
  Network,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AccessPanel =
  | "catalog"
  | "memberships"
  | "roles"
  | "permissions"
  | "scopes"
  | "delegations"
  | "approvals"
  | "sessions";

interface Props {
  canManageAccess: boolean;
  canAudit: boolean;
}

interface LogEntry {
  id: string;
  title: string;
  ok: boolean;
  detail: string;
}

const panels: Array<{ id: AccessPanel; ad: string; icon: ComponentType<{ className?: string }>; aciklama: string }> = [
  { id: "catalog", ad: "Katalog", icon: Layers3, aciklama: "Modül manifesti, permission ve rol şablonları" },
  { id: "memberships", ad: "Üyelikler", icon: Users, aciklama: "MEMBER rol değil, OrganizationMembership kaydıdır" },
  { id: "roles", ad: "Roller", icon: UserCog, aciklama: "RoleVersion, template kopyalama ve yayınlama" },
  { id: "permissions", ad: "İzinler", icon: KeyRound, aciklama: "module.resource.action.scope sözleşmesi" },
  { id: "scopes", ad: "Kapsamlar", icon: Network, aciklama: "Tesis, bölüm, dönem ve atanmış kayıt" },
  { id: "delegations", ad: "Delegasyon", icon: Copy, aciklama: "Süreli, gerekçeli yetki devri" },
  { id: "approvals", ad: "Onay politikaları", icon: ShieldCheck, aciklama: "İkinci onay ve yeniden doğrulama" },
  { id: "sessions", ad: "Oturum & cihaz", icon: MonitorSmartphone, aciklama: "UserSession, TrustedDevice ve ayrık kimlikler" },
];

export function AdvancedAccessWorkspace({ canManageAccess, canAudit }: Props) {
  const [panel, setPanel] = useState<AccessPanel>("catalog");
  const [pending, startTransition] = useTransition();
  const [catalog, setCatalog] = useState<unknown>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [membershipId, setMembershipId] = useState("");
  const [roleVersionId, setRoleVersionId] = useState("");
  const [sourceRoleId, setSourceRoleId] = useState("");
  const [scopeId, setScopeId] = useState("");
  const [permissionKey, setPermissionKey] = useState("kurban.finance.receipt.create.organization");
  const [reason, setReason] = useState("");
  const [moduleId, setModuleId] = useState("tahsilat");
  const [approvalRequestId, setApprovalRequestId] = useState("");

  useEffect(() => {
    post("Katalog", { operation: "catalog" }, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function post(title: string, body: Record<string, unknown>, keepCatalog = false) {
    startTransition(async () => {
      try {
        const response = await fetch("/api/tenant/authorization", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await response.json().catch(() => ({ error: "EMPTY_RESPONSE" }));
        if (keepCatalog || body.operation === "catalog") setCatalog(json);
        setLogs((items) => [{ id: crypto.randomUUID(), title, ok: response.ok, detail: JSON.stringify(json, null, 2) }, ...items].slice(0, 10));
      } catch (error) {
        const detail = error instanceof Error ? error.message : "Beklenmeyen istemci hatası";
        setLogs((items) => [{ id: crypto.randomUUID(), title, ok: false, detail }, ...items].slice(0, 10));
      }
    });
  }

  async function payloadHash(payload: unknown) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(payload)));
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async function approvalFor(payload: Record<string, unknown>) {
    post("Onay talebi", {
      operation: "request-approval",
      permissionKey,
      operationType: "access-critical-change",
      operationRef: `access:${Date.now()}`,
      payloadHash: await payloadHash(payload),
      reason: reason || "Kritik rol veya izin değişikliği için ikinci onay",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
  }

  const active = panels.find((item) => item.id === panel)!;
  const ActiveIcon = active.icon;

  return (
    <div className="min-h-[calc(100vh-7rem)] bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-purple-500/15 text-purple-100">OrganizationMembership ≠ rol</Badge>
              <Badge className="bg-blue-500/15 text-blue-100">Veri tabanlı RoleVersion</Badge>
              <Badge className="bg-red-500/15 text-red-100">Son OWNER korunur</Badge>
              <Badge className="bg-emerald-500/15 text-emerald-100">DENY &gt; ALLOW</Badge>
            </div>
            <h2 className="mt-2 text-xl font-semibold sm:text-2xl">İleri IAM çalışma alanı</h2>
            <p className="text-sm text-zinc-400">Kullanıcı, üyelik, rol, izin, kapsam, delegasyon, onay, oturum ve cihaz yönetimi aynı modüler permission runtime üzerinden çalışır.</p>
          </div>
          <Button disabled={pending || !canAudit} variant="secondary" onClick={() => post("Katalog", { operation: "catalog" }, true)}>Kataloğu yenile</Button>
        </div>
      </div>

      <div className="grid gap-4 p-3 sm:p-5 lg:grid-cols-[270px_minmax(0,1fr)_360px]">
        <aside className="hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 p-2 lg:block">
          {panels.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => setPanel(item.id)} className={`mb-1 flex w-full gap-3 rounded-xl px-3 py-3 text-left text-sm ${panel === item.id ? "bg-purple-500/15 text-purple-100 ring-1 ring-purple-400/30" : "text-zinc-300 hover:bg-zinc-800"}`}>
                <Icon className="mt-0.5 h-5 w-5" />
                <span><span className="block font-medium">{item.ad}</span><span className="block text-xs text-zinc-500">{item.aciklama}</span></span>
              </button>
            );
          })}
        </aside>

        <main className="rounded-2xl border border-zinc-800 bg-zinc-900/70">
          <div className="flex gap-2 overflow-x-auto border-b border-zinc-800 p-2 lg:hidden">
            {panels.map((item) => <Button key={item.id} size="sm" variant={item.id === panel ? "default" : "secondary"} className="shrink-0" onClick={() => setPanel(item.id)}>{item.ad}</Button>)}
          </div>
          <div className="border-b border-zinc-800 p-4">
            <div className="flex items-center gap-3"><ActiveIcon className="h-6 w-6 text-purple-300" /><div><h3 className="font-semibold">{active.ad}</h3><p className="text-sm text-zinc-400">{active.aciklama}</p></div></div>
          </div>
          <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-4">
              {panel === "catalog" && (
                <AccessCard title="Modül manifesti kayıt sistemi" icon={Layers3}>
                  <Field label="Module ID"><Input value={moduleId} onChange={(e) => setModuleId(e.target.value)} /></Field>
                  <div className="flex flex-wrap gap-2">
                    <Button disabled={pending || !canManageAccess} onClick={() => post("Modül manifesti kaydet", { operation: "register-module", moduleId })}>Manifesti tenant’a kaydet</Button>
                    <Button variant="secondary" disabled={pending || !canAudit} onClick={() => post("Katalog", { operation: "catalog" }, true)}>Katalog oku</Button>
                  </div>
                </AccessCard>
              )}

              {panel === "memberships" && (
                <AccessCard title="OrganizationMembership oluştur" icon={Users}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Ad soyad"><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></Field>
                    <Field label="E-posta"><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" /></Field>
                  </div>
                  <Field label="Gerekçe"><Textarea value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
                  <Button disabled={pending || !canManageAccess || !displayName} onClick={() => post("Üyelik oluştur", { operation: "create-membership", displayName, email: email || undefined, reason: reason || "Operasyon personeli üyeliği" })}>Üyelik oluştur</Button>
                  <Rule>MEMBER sabit rol değildir; üyelik kaydıdır. Personel rolleri müşteri/cihaz/servis hesabı tablolarına karıştırılmaz.</Rule>
                </AccessCard>
              )}

              {panel === "roles" && (
                <AccessCard title="Rol şablonu kopyala, sürüm ata/yayınla" icon={UserCog}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Kaynak Role ID"><Input value={sourceRoleId} onChange={(e) => setSourceRoleId(e.target.value)} /></Field>
                    <Field label="RoleVersion ID"><Input value={roleVersionId} onChange={(e) => setRoleVersionId(e.target.value)} /></Field>
                    <Field label="Membership ID"><Input value={membershipId} onChange={(e) => setMembershipId(e.target.value)} /></Field>
                    <Field label="AccessScope ID"><Input value={scopeId} onChange={(e) => setScopeId(e.target.value)} /></Field>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button disabled={pending || !canManageAccess || !sourceRoleId} onClick={() => post("Rol şablonu kopyala", { operation: "copy-role-template", sourceRoleId, name: "Özelleştirilmiş satış yöneticisi", functionalArea: "sales_finance", accessLevel: "MANAGER", reason: reason || "Firma şablon özelleştirmesi" })}>Şablonu kopyala</Button>
                    <Button disabled={pending || !canManageAccess || !membershipId || !roleVersionId} variant="secondary" onClick={() => post("Rol ata", { operation: "assign-role", membershipId, roleVersionId, accessScopeId: scopeId || undefined, reason: reason || "Görev alanı ataması" })}>RoleVersion ata</Button>
                  </div>
                </AccessCard>
              )}

              {panel === "permissions" && (
                <AccessCard title="İzin ve açık DENY politikası" icon={KeyRound}>
                  <Field label="Permission key"><Input value={permissionKey} onChange={(e) => setPermissionKey(e.target.value)} /></Field>
                  <div className="flex flex-wrap gap-2">
                    <Button disabled={pending || !canManageAccess || !roleVersionId} onClick={() => post("RoleVersion yayınla", { operation: "publish-custom-role", roleVersionId, permissions: [{ permissionKey, effect: "ALLOW" }], reason: reason || "Rol izin sürümü yayınlama" })}>ALLOW ile yayınla</Button>
                    <Button disabled={pending || !canManageAccess || !roleVersionId} variant="destructive" onClick={() => post("Açık DENY yayınla", { operation: "publish-custom-role", roleVersionId, permissions: [{ permissionKey, effect: "DENY" }], reason: reason || "Açık deny güvenlik politikası" })}>DENY yayınla</Button>
                  </div>
                  <Rule>Kullanıcı sahip olmadığı izni veremez; kritik değişiklikler yeniden doğrulama ve audit ister.</Rule>
                </AccessCard>
              )}

              {panel === "scopes" && (
                <AccessCard title="AccessScope ve koşullu policy" icon={Network}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Tesis ID"><Input placeholder="facility_..." /></Field>
                    <Field label="Bölüm ID"><Input placeholder="department_..." /></Field>
                  </div>
                  <Button disabled={pending || !canManageAccess} onClick={() => post("AccessScope oluştur", { operation: "create-access-scope", name: "Sezon satış kasası", additionalConstraints: { trustedDevice: true, mfaLevel: 1 } })}>Scope oluştur</Button>
                </AccessCard>
              )}

              {panel === "delegations" && (
                <AccessCard title="Süreli ve gerekçeli delegasyon" icon={Copy}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Alıcı Membership ID"><Input value={membershipId} onChange={(e) => setMembershipId(e.target.value)} /></Field>
                    <Field label="Permission"><Input value={permissionKey} onChange={(e) => setPermissionKey(e.target.value)} /></Field>
                  </div>
                  <Field label="Gerekçe"><Textarea value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
                  <Button disabled={pending || !canManageAccess || !membershipId} onClick={() => post("Delegasyon", { operation: "delegate", toMembershipId: membershipId, permissionKey, accessScopeId: scopeId || undefined, validFrom: new Date().toISOString(), validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), reason: reason || "Vardiya devri" })}>24 saatlik yetki devri</Button>
                </AccessCard>
              )}

              {panel === "approvals" && (
                <AccessCard title="ApprovalPolicy ve karar" icon={ShieldCheck}>
                  <Field label="Permission"><Input value={permissionKey} onChange={(e) => setPermissionKey(e.target.value)} /></Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Approval Request ID"><Input value={approvalRequestId} onChange={(e) => setApprovalRequestId(e.target.value)} /></Field>
                    <Field label="Gerekçe"><Input value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button disabled={pending || !canManageAccess} onClick={() => post("ApprovalPolicy", { operation: "create-approval-policy", name: "Kritik finans ve erişim onayı", permissionKey, approverPermissionKey: "identity.approval.decide.organization", requiredApprovals: 2, requireDistinctUser: true, requireReauthentication: true, conditions: { trustedDevice: true, mfaLevel: 1 } })}>Policy oluştur</Button>
                    <Button variant="secondary" disabled={!permissionKey} onClick={() => approvalFor({ permissionKey, reason })}>Onay iste</Button>
                    <Button variant="secondary" disabled={pending || !approvalRequestId || !canManageAccess} onClick={() => post("Onay kararı", { operation: "decide-approval", approvalRequestId, decision: "approve", reason: reason || "İkinci onay verildi" })}>Onayla</Button>
                  </div>
                </AccessCard>
              )}

              {panel === "sessions" && (
                <AccessCard title="Ayrık kimlikler, oturumlar ve cihazlar" icon={MonitorSmartphone}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Servis hesabı adı"><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></Field>
                    <Field label="Permission"><Input value={permissionKey} onChange={(e) => setPermissionKey(e.target.value)} /></Field>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button disabled={pending || !canManageAccess} onClick={() => post("Servis hesabı", { operation: "create-service-account", name: displayName || "reservation-expiry-worker", grants: [{ permissionKey, effect: "ALLOW" }] })}>ServiceAccount oluştur</Button>
                    <Button variant="secondary" disabled={pending || !canManageAccess} onClick={() => post("Cihaz kimliği", { operation: "create-device-identity", kind: "field_device", displayName: displayName || "Saha cihazı", grants: [{ permissionKey, effect: "ALLOW" }] })}>DeviceIdentity oluştur</Button>
                  </div>
                  <Rule>Müşteri, cihaz, servis hesabı ve dış kullanıcı erişimi personel rol tablosuna karıştırılmaz.</Rule>
                </AccessCard>
              )}
            </div>

            <aside className="space-y-4">
              <Card className="border-zinc-800 bg-zinc-950/80 text-zinc-100">
                <CardHeader><CardTitle className="text-sm">Kimlik alanları</CardTitle></CardHeader>
                <CardContent className="grid gap-2 text-xs text-zinc-300">
                  {["PLATFORM_USER", "ORGANIZATION_USER", "CUSTOMER", "SERVICE_ACCOUNT", "DEVICE_IDENTITY", "EXTERNAL_USER"].map((item) => <div key={item} className="rounded-lg bg-zinc-900 p-2 font-mono">{item}</div>)}
                </CardContent>
              </Card>
              <Card className="border-zinc-800 bg-zinc-950/80 text-zinc-100">
                <CardHeader><CardTitle className="text-sm">Korunan roller</CardTitle></CardHeader>
                <CardContent className="grid gap-2 text-xs text-zinc-300">
                  {["ORGANIZATION_OWNER", "EXECUTIVE_ADMIN", "SECURITY_ADMIN", "ACCESS_ADMIN", "COMPLIANCE_AUDITOR", "SUPPORT_APPROVER"].map((item) => <div key={item} className="rounded-lg bg-zinc-900 p-2 font-mono">{item}</div>)}
                </CardContent>
              </Card>
            </aside>
          </div>
        </main>

        <aside className="rounded-2xl border border-zinc-800 bg-zinc-900/70">
          <div className="border-b border-zinc-800 p-4"><h3 className="font-semibold">Audit / katalog cevabı</h3></div>
          <div className="max-h-[680px] space-y-3 overflow-auto p-3">
            {catalog ? <details className="rounded-xl border border-zinc-800 bg-zinc-950 p-3" open><summary className="cursor-pointer text-sm font-medium text-purple-200">Son katalog</summary><pre className="mt-2 whitespace-pre-wrap text-xs text-zinc-400">{JSON.stringify(catalog, null, 2)}</pre></details> : null}
            {logs.map((log) => <details key={log.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"><summary className="cursor-pointer text-sm"><span className={log.ok ? "text-emerald-300" : "text-red-300"}>{log.ok ? "OK" : "HATA"}</span> · {log.title}</summary><pre className="mt-2 whitespace-pre-wrap text-xs text-zinc-400">{log.detail}</pre></details>)}
          </div>
        </aside>
      </div>
    </div>
  );
}

function AccessCard({ title, icon: Icon, children }: { title: string; icon: ComponentType<{ className?: string }>; children: ReactNode }) {
  return (
    <Card className="border-zinc-800 bg-zinc-950/80 text-zinc-100">
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Icon className="h-5 w-5 text-purple-300" />{title}</CardTitle></CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs text-zinc-300">{label}</Label>{children}</div>;
}

function Rule({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-100">{children}</div>;
}
