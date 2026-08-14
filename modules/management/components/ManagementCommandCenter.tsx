"use client";

import { useEffect, useMemo, useState, useTransition, type ComponentType, type ReactNode } from "react";
import { AlertTriangle, BarChart3, Building2, Command, Download, Filter, LayoutDashboard, Search, ShieldCheck, SlidersHorizontal, Smartphone, TabletSmartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Panel = "dashboard" | "reports" | "search" | "exceptions" | "company";

interface Props {
  defaultSeasonId?: string;
  permissions: {
    canDashboard: boolean;
    canReport: boolean;
    canSearch: boolean;
    canException: boolean;
    canManageCompany: boolean;
  };
}

const panels: Array<{ id: Panel; title: string; desc: string; icon: ComponentType<{ className?: string }> }> = [
  { id: "dashboard", title: "Komuta merkezi", desc: "Canlı KPI, darboğaz, karar ve öncelik", icon: LayoutDashboard },
  { id: "reports", title: "Raporlama", desc: "Satış, finans, operasyon, teslimat ve audit", icon: BarChart3 },
  { id: "search", title: "Ctrl+K arama", desc: "Müşteri, hayvan, küpe, paket, teslimat", icon: Command },
  { id: "exceptions", title: "İstisna / onay", desc: "SLA, kanıt, ApprovalPolicy ve resume", icon: ShieldCheck },
  { id: "company", title: "Firma yönetimi", desc: "Tesis, sezon, modül, KVKK, veri kalitesi", icon: Building2 },
];

const reports = [
  { key: "sales-occupancy", label: "Satış, rezervasyon ve doluluk" },
  { key: "operations-bottleneck", label: "Kesim süreleri ve darboğazlar" },
  { key: "delivery-cold-storage", label: "Soğuk oda, yükleme ve teslimat" },
  { key: "finance-reconciliation", label: "Ledger borç/alacak mutabakatı" },
  { key: "customer-season-balances", label: "Müşteri sezon carileri" },
  { key: "supplier-purchases", label: "Tedarikçi, alış ve borç özeti" },
  { key: "animal-cost-health", label: "Hayvan maliyet, sağlık ve padok" },
  { key: "cash-bank-pos", label: "Nakit, banka, POS ve karma tahsilat" },
  { key: "fulfillment-progress", label: "Kesim, tartım, paket ve teslim ilerlemesi" },
  { key: "reversals-refunds", label: "İptal, iade, reversal ve kilo düzeltmeleri" },
  { key: "season-comparison", label: "Sezonlar ve yıllar arası karşılaştırma" },
  { key: "exception-center", label: "Eksik, blokaj ve istisna merkezi" },
  { key: "audit-exceptions", label: "Kullanıcı işlemleri, audit ve istisnalar" },
] as const;

export function ManagementCommandCenter({ defaultSeasonId, permissions }: Props) {
  const [panel, setPanel] = useState<Panel>("dashboard");
  const [pending, startTransition] = useTransition();
  const [seasonId, setSeasonId] = useState(defaultSeasonId ?? "");
  const [facilityId, setFacilityId] = useState("");
  const [query, setQuery] = useState("");
  const [reportKey, setReportKey] = useState<(typeof reports)[number]["key"]>("sales-occupancy");
  const [layoutNote, setLayoutNote] = useState("komuta:sol, rapor:orta, istisna:sag");
  const [result, setResult] = useState<unknown>(null);
  const [logs, setLogs] = useState<Array<{ id: string; title: string; ok: boolean; detail: string }>>([]);

  useEffect(() => {
    if (permissions.canDashboard) post("Dashboard", { action: "dashboard", seasonId: seasonId || undefined, facilityId: facilityId || undefined }, "dashboard:init");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPanel("search");
        setTimeout(() => document.getElementById("management-search")?.focus(), 0);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function post(title: string, body: Record<string, unknown>, key = `${title}:${Date.now()}`, path = "/api/tenant/management-analytics") {
    startTransition(async () => {
      try {
        const response = await fetch(path, {
          method: "POST",
          headers: { "content-type": "application/json", "idempotency-key": key },
          body: JSON.stringify(body),
        });
        const json = await response.json().catch(() => ({ error: "EMPTY_RESPONSE" }));
        setResult(json);
        setLogs((items) => [{ id: crypto.randomUUID(), title, ok: response.ok, detail: JSON.stringify(json, null, 2) }, ...items].slice(0, 10));
      } catch (error) {
        const detail = error instanceof Error ? error.message : "İstemci hatası";
        setResult({ error: detail });
        setLogs((items) => [{ id: crypto.randomUUID(), title, ok: false, detail }, ...items].slice(0, 10));
      }
    });
  }

  const dashboard = useMemo(() => isRecord(result) && isRecord(result.result) ? result.result : undefined, [result]);
  const active = panels.find((item) => item.id === panel)!;
  const ActiveIcon = active.icon;

  return (
    <div className="min-h-[calc(100vh-7rem)] bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-emerald-500/15 text-emerald-100">Gerçek tenant query</Badge>
              <Badge className="bg-blue-500/15 text-blue-100">Server-side authorization</Badge>
              <Badge className="bg-purple-500/15 text-purple-100">Modül widget/search/report kayıtları</Badge>
              <Badge className="bg-amber-500/15 text-amber-100">AI önerisi işlem uygulamaz</Badge>
            </div>
            <h2 className="mt-2 text-2xl font-semibold">TilbeCore Kurumsal Komuta Merkezi</h2>
            <p className="text-sm text-slate-400">Firma, tesis, dönem, canlı operasyon, raporlama, arama, istisna ve yönetim alanları.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Field label="Sezon"><Input value={seasonId} onChange={(e) => setSeasonId(e.target.value)} className="border-slate-700 bg-slate-900 text-slate-100" /></Field>
            <Field label="Tesis"><Input value={facilityId} onChange={(e) => setFacilityId(e.target.value)} className="border-slate-700 bg-slate-900 text-slate-100" /></Field>
            <Button disabled={pending || !permissions.canDashboard} className="self-end" onClick={() => post("Dashboard", { action: "dashboard", seasonId: seasonId || undefined, facilityId: facilityId || undefined })}>Yenile</Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-3 sm:p-5 lg:grid-cols-[280px_minmax(0,1fr)_360px]">
        <aside className="hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-2 lg:block">
          {panels.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => setPanel(item.id)} className={`mb-1 flex w-full gap-3 rounded-xl px-3 py-3 text-left ${panel === item.id ? "bg-cyan-500/15 text-cyan-100 ring-1 ring-cyan-400/30" : "text-slate-300 hover:bg-slate-800"}`}>
                <Icon className="mt-0.5 h-5 w-5" />
                <span><span className="block text-sm font-medium">{item.title}</span><span className="block text-xs text-slate-500">{item.desc}</span></span>
              </button>
            );
          })}
        </aside>

        <main className="rounded-2xl border border-slate-800 bg-slate-900/70">
          <div className="flex gap-2 overflow-x-auto border-b border-slate-800 p-2 lg:hidden">
            {panels.map((item) => <Button key={item.id} size="sm" variant={panel === item.id ? "default" : "secondary"} className="shrink-0" onClick={() => setPanel(item.id)}>{item.title}</Button>)}
          </div>
          <div className="border-b border-slate-800 p-4">
            <div className="flex items-center gap-3"><ActiveIcon className="h-6 w-6 text-cyan-300" /><div><h3 className="font-semibold">{active.title}</h3><p className="text-sm text-slate-400">{active.desc}</p></div></div>
          </div>

          <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-4">
              {panel === "dashboard" && (
                <CommandCard title="Canlı yönetim özeti" icon={LayoutDashboard}>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <Metric label="Satış" value={pick(dashboard, "sales.salesCount")} />
                    <Metric label="Aktif rezervasyon" value={pick(dashboard, "sales.reservationsActive")} />
                    <Metric label="Doluluk" value={`${pick(dashboard, "sales.occupancySold")}/${pick(dashboard, "sales.occupancyTotal")}`} />
                    <Metric label="Tahsilat" value={pick(dashboard, "sales.receiptTotal")} />
                    <Metric label="Hayvan" value={pick(dashboard, "entities.animals")} />
                    <Metric label="Tartım" value={pick(dashboard, "operations.weighings")} />
                    <Metric label="Paket" value={pick(dashboard, "operations.packages")} />
                    <Metric label="Teslim" value={pick(dashboard, "operations.deliveries")} />
                    <Metric label="Soğuk oda" value={pick(dashboard, "operations.coldStored")} />
                    <Metric label="Bekleyen onay" value={pick(dashboard, "approvals.pending")} tone="amber" />
                    <Metric label="Açık istisna" value={pick(dashboard, "operations.openExceptions")} tone="amber" />
                    <Metric label="Ledger farkı" value={pick(dashboard, "finance.difference")} tone="amber" />
                  </div>
                  <Button disabled={pending || !permissions.canDashboard} onClick={() => post("Görünüm kaydet", { action: "save-dashboard-view", name: "Faz 11 komuta görünümü", scope: "personal", filters: { seasonId, facilityId }, layout: { note: layoutNote } })}>Görünümü kaydet</Button>
                </CommandCard>
              )}

              {panel === "reports" && (
                <CommandCard title="Raporlama ve dışa aktarma sözleşmesi" icon={BarChart3}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Rapor"><Input value={reportKey} onChange={(e) => setReportKey(e.target.value as typeof reportKey)} list="report-keys" /><datalist id="report-keys">{reports.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}</datalist></Field>
                    <Field label="Kaydedilmiş filtre"><Input value={seasonId} onChange={(e) => setSeasonId(e.target.value)} placeholder="season_..." /></Field>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button disabled={pending || !permissions.canReport} onClick={() => post("Rapor", { action: "report", reportKey, filters: { seasonId: seasonId || undefined, facilityId: facilityId || undefined } })}>Raporu getir</Button>
                    <Button variant="secondary" disabled={pending || !permissions.canReport} onClick={() => post("Grafik verisi", { action: "report-builder", reportKey, filters: { seasonId: seasonId || undefined, facilityId: facilityId || undefined } })}>Grafik verisi oluştur</Button>
                    <ExportButton reportKey={reportKey} seasonId={seasonId} facilityId={facilityId} format="csv" />
                    <ExportButton reportKey={reportKey} seasonId={seasonId} facilityId={facilityId} format="xlsx" />
                    <ExportButton reportKey={reportKey} seasonId={seasonId} facilityId={facilityId} format="pdf" />
                  </div>
                  <Rule>CSV/XLSX/PDF indirmeleri ayrı export permission ile server-side tenant filtresinden üretilir.</Rule>
                </CommandCard>
              )}

              {panel === "search" && (
                <CommandCard title="Evrensel arama ve hızlı komut" icon={Search}>
                  <Field label="Ctrl+K arama"><Input id="management-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="müşteri, telefon, küpe, paket etiketi..." /></Field>
                  <Button disabled={pending || !permissions.canSearch || query.length < 2} onClick={() => post("Arama", { action: "search", query, limit: 12 })}>Yetkili sonuçları ara</Button>
                  <Rule>Görme izni olmayan sağlayıcı sorguya dahil edilmez; müşteri/finans PII’si role göre döner.</Rule>
                </CommandCard>
              )}

              {panel === "exceptions" && (
                <CommandCard title="Merkezi istisna ve onay kutusu" icon={ShieldCheck}>
                  <Button disabled={pending || !permissions.canException} onClick={() => post("İstisna kutusu", { action: "exception-inbox", status: "pending", limit: 30 })}>Bekleyenleri getir</Button>
                  <Rule>Finans, satış, vekâlet, kesim, tartım, paket ve teslimat istisnaları ApprovalPolicy ve audit zinciriyle izlenir.</Rule>
                </CommandCard>
              )}

              {panel === "company" && (
                <CommandCard title="Firma yönetim alanları" icon={Building2}>
                  <div className="grid gap-3 md:grid-cols-2">
                    {["Firma, tesis, bölüm, sezon", "Kullanıcı, üyelik, rol, izin, kapsam", "Oturum, cihaz, güvenilir cihaz", "Modül, entitlement, feature flag", "Bildirim ve görev yönetimi", "Veri kalitesi ve mükerrer kayıt", "KVKK, iletişim izni, saklama", "Eğitim ve sentetik demo modu"].map((item) => <div key={item} className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm">{item}</div>)}
                  </div>
                  <Button disabled={pending || !permissions.canManageCompany} onClick={() => post("Sentetik demo dry-run", { scenario: "full-qurban-day", dryRun: true }, `demo:${Date.now()}`, "/api/tenant/demo-data")}>Sentetik demo paketi üret</Button>
                  <Rule>Demo/sentetik veri gerçek tenant production verisine karıştırılmaz; yönetim komutları ayrı API’lerle yürütülür.</Rule>
                </CommandCard>
              )}
            </div>

            <aside className="space-y-3">
              <Surface icon={SlidersHorizontal} title="Kaydedilmiş görünüm" text={layoutNote} setText={setLayoutNote} />
              <Mini icon={TabletSmartphone} title="Tablet" text="İki panelli yönetim/operasyon görünümü" />
              <Mini icon={Smartphone} title="Mobil" text="Özet, onay, görev ve kritik uyarı akışı" />
              <Mini icon={Filter} title="Filtreler" text="Tesis, sezon, tarih, kullanıcı, modül, durum" />
            </aside>
          </div>
        </main>

        <aside className="rounded-2xl border border-slate-800 bg-slate-900/70">
          <div className="border-b border-slate-800 p-4"><h3 className="font-semibold">Query / audit sonucu</h3></div>
          <div className="max-h-[680px] space-y-3 overflow-auto p-3">
            {logs.length === 0 ? <p className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">Henüz query yok. Sonuçlar tenant repository’den gelir; dekoratif KPI yoktur.</p> : logs.map((log) => <details key={log.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3" open={logs[0]?.id === log.id}><summary className="cursor-pointer text-sm"><span className={log.ok ? "text-emerald-300" : "text-red-300"}>{log.ok ? "OK" : "HATA"}</span> · {log.title}</summary><pre className="mt-2 whitespace-pre-wrap text-xs text-slate-400">{log.detail}</pre></details>)}
          </div>
        </aside>
      </div>
    </div>
  );
}

function CommandCard({ title, icon: Icon, children }: { title: string; icon: ComponentType<{ className?: string }>; children: ReactNode }) {
  return <Card className="border-slate-800 bg-slate-950/80 text-slate-100"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Icon className="h-5 w-5 text-cyan-300" />{title}</CardTitle></CardHeader><CardContent className="space-y-4">{children}</CardContent></Card>;
}

function ExportButton({ reportKey, seasonId, facilityId, format }: { reportKey: string; seasonId: string; facilityId: string; format: "csv" | "xlsx" | "pdf" }) {
  const params = new URLSearchParams({ reportKey, format });
  if (seasonId) params.set("seasonId", seasonId);
  if (facilityId) params.set("facilityId", facilityId);
  return (
    <a className="inline-flex h-9 items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow-xs transition-colors hover:bg-secondary/80" href={`/api/tenant/management-analytics/export?${params.toString()}`}>
      <Download className="mr-1 h-4 w-4" />{format.toUpperCase()}
    </a>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs text-slate-300">{label}</Label>{children}</div>;
}

function Metric({ label, value, tone = "slate" }: { label: string; value: string; tone?: "slate" | "amber" }) {
  return <div className="rounded-xl border border-slate-800 bg-slate-900 p-3"><p className="text-xs text-slate-400">{label}</p><p className={`mt-1 font-tabular text-xl font-semibold ${tone === "amber" ? "text-amber-300" : "text-slate-100"}`}>{value}</p></div>;
}

function Rule({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100"><AlertTriangle className="mr-2 inline h-4 w-4" />{children}</div>;
}

function Mini({ icon: Icon, title, text }: { icon: ComponentType<{ className?: string }>; title: string; text: string }) {
  return <div className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-sm"><Icon className="mt-0.5 h-5 w-5 text-blue-300" /><span><strong>{title}</strong><br /><span className="text-slate-400">{text}</span></span></div>;
}

function Surface({ icon: Icon, title, text, setText }: { icon: ComponentType<{ className?: string }>; title: string; text: string; setText: (value: string) => void }) {
  return <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3"><div className="mb-2 flex gap-2 text-sm font-semibold"><Icon className="h-4 w-4 text-cyan-300" />{title}</div><Textarea value={text} onChange={(e) => setText(e.target.value)} /></div>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function pick(root: unknown, path: string): string {
  let current: unknown = root;
  for (const part of path.split(".")) {
    if (!isRecord(current)) return "0";
    current = current[part];
  }
  return current === null || current === undefined ? "0" : String(current);
}
