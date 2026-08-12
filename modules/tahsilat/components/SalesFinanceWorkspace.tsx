"use client";

import { useMemo, useState, useTransition, type ComponentType, type ReactNode } from "react";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  History,
  Landmark,
  LockKeyhole,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  SplitSquareHorizontal,
  TabletSmartphone,
  Tags,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Panel =
  | "sale"
  | "reserve"
  | "receipt"
  | "cash"
  | "reversal"
  | "reconcile"
  | "approval";

interface WorkspacePermissions {
  canRead: boolean;
  canReserve: boolean;
  canSell: boolean;
  canReceipt: boolean;
  canCancel: boolean;
  canTransfer: boolean;
  canManagePricing: boolean;
  canManageAccess: boolean;
}

interface Props {
  permissions: WorkspacePermissions;
  defaultSeasonId?: string;
}

interface LogEntry {
  id: string;
  title: string;
  ok: boolean;
  detail: string;
}

const panels: Array<{ id: Panel; ad: string; aciklama: string; icon: ComponentType<{ className?: string }> }> = [
  { id: "sale", ad: "Kesin satış", aciklama: "Pozitif kapora + fiyat snapshot + ledger", icon: Wallet },
  { id: "reserve", ad: "Rezervasyon", aciklama: "Kaporasız süreli bekletme; satış değildir", icon: Clock },
  { id: "receipt", ad: "Karma tahsilat", aciklama: "Nakit + banka + POS dağıtımı", icon: SplitSquareHorizontal },
  { id: "cash", ad: "Kasa", aciklama: "Açılış, kapanış, sayım farkı komut kuyruğu", icon: Banknote },
  { id: "reversal", ad: "İade / mahsup", aciklama: "Fiziksel silme yok; onaylı ters akış", icon: RotateCcw },
  { id: "reconcile", ad: "Mutabakat", aciklama: "Banka/POS istisna kuyruğu", icon: RefreshCw },
  { id: "approval", ad: "Onay & resume", aciklama: "ApprovalPolicy kanıtını komuta bağla", icon: ShieldCheck },
];

export function SalesFinanceWorkspace({ permissions, defaultSeasonId }: Props) {
  const [panel, setPanel] = useState<Panel>("sale");
  const [pending, startTransition] = useTransition();
  const [seasonId, setSeasonId] = useState(defaultSeasonId ?? "");
  const [shareIds, setShareIds] = useState("");
  const [shareId, setShareId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [payerCustomerId, setPayerCustomerId] = useState("");
  const [listPrice, setListPrice] = useState("45000.00");
  const [discount, setDiscount] = useState("0.00");
  const [cash, setCash] = useState("0.00");
  const [bank, setBank] = useState("0.00");
  const [pos, setPos] = useState("0.00");
  const [receiptNo, setReceiptNo] = useState("");
  const [saleId, setSaleId] = useState("");
  const [targetShareId, setTargetShareId] = useState("");
  const [reason, setReason] = useState("");
  const [reservedUntil, setReservedUntil] = useState("");
  const [approvalRequestId, setApprovalRequestId] = useState("");
  const [approvalCount, setApprovalCount] = useState("1");
  const [lastResult, setLastResult] = useState<unknown>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const totals = useMemo(() => {
    const ids = splitIds(shareIds);
    const adet = Math.max(ids.length, 1);
    const liste = para(listPrice) * adet;
    const indirim = para(discount) * adet;
    const anlasilan = Math.max(liste - indirim, 0);
    const kapora = para(cash) + para(bank) + para(pos);
    return { adet, liste, indirim, anlasilan, kapora };
  }, [shareIds, listPrice, discount, cash, bank, pos]);

  async function postSalesFinance(title: string, body: Record<string, unknown>, idempotency = `${title}:${Date.now()}`) {
    return postJson("/api/tenant/sales-finance", title, body, idempotency);
  }

  async function postJson(url: string, title: string, body: Record<string, unknown>, idempotency = `${title}:${Date.now()}`) {
    startTransition(async () => {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json", "idempotency-key": idempotency },
          body: JSON.stringify(body),
        });
        const json = await response.json().catch(() => ({ error: "EMPTY_RESPONSE" }));
        setLastResult(json);
        setLogs((items) => [{ id: crypto.randomUUID(), title, ok: response.ok, detail: JSON.stringify(json, null, 2) }, ...items].slice(0, 8));
      } catch (error) {
        const detail = error instanceof Error ? error.message : "Beklenmeyen istemci hatası";
        setLastResult({ error: detail });
        setLogs((items) => [{ id: crypto.randomUUID(), title, ok: false, detail }, ...items].slice(0, 8));
      }
    });
  }

  async function hashPayload(payload: unknown) {
    const data = new TextEncoder().encode(JSON.stringify(payload));
    const digest = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function approvalKaniti() {
    if (!approvalRequestId.trim()) return undefined;
    const count = Math.max(Number.parseInt(approvalCount, 10) || 1, 1);
    return {
      requestId: approvalRequestId.trim(),
      approved: true,
      approvalCount: count,
      distinctApproverCount: count,
    };
  }

  function methodSplits() {
    return [
      { key: "cash", amount: cash, method: "cash", icon: Banknote },
      { key: "bank", amount: bank, method: "bank_transfer", icon: Landmark },
      { key: "pos", amount: pos, method: "pos", icon: CreditCard },
    ].filter((m) => para(m.amount) > 0).map((m) => ({
      id: `split_${m.key}_${crypto.randomUUID()}`,
      method: m.method,
      amount: money(m.amount),
      referenceNo: receiptNo || undefined,
    }));
  }

  async function requestApproval(permissionKey: string, operationType: string, payload: Record<string, unknown>) {
    const payloadHash = await hashPayload(payload);
    await postJson("/api/tenant/authorization", "Onay talebi", {
      operation: "request-approval",
      permissionKey,
      operationType,
      operationRef: payload.operationRef ?? crypto.randomUUID(),
      payloadHash,
      reason: reason || "Faz 5-6 istisnai finansal işlem onayı",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
  }

  const disabledSale = pending || !permissions.canSell || totals.kapora <= 0 || splitIds(shareIds).length === 0;
  const active = panels.find((p) => p.id === panel)!;
  const ActiveIcon = active.icon;

  return (
    <div className="min-h-[calc(100vh-7rem)] bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 bg-slate-950/95 px-4 py-3 shadow-xl backdrop-blur sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-emerald-500/15 text-emerald-200">Tenant PostgreSQL</Badge>
              <Badge className="bg-blue-500/15 text-blue-200">DENY &gt; ALLOW</Badge>
              <Badge className="bg-amber-500/15 text-amber-100">Kaporasız kayıt satış değildir</Badge>
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Satış, rezervasyon ve finans masası</h2>
            <p className="text-sm text-slate-400">Masaüstünde çok panelli komuta merkezi; mobilde tam ekran görev akışı; tablette iki panelli kasa/satış düzeni.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-end">
            <Field label="Sezon ID">
              <Input value={seasonId} onChange={(e) => setSeasonId(e.target.value)} className="border-slate-700 bg-slate-900 text-slate-100" placeholder="season_..." />
            </Field>
            <Button
              disabled={pending || !permissions.canRead || !seasonId}
              className="h-10 self-end"
              onClick={() => postSalesFinance("Hisse uygunluk listesi", { action: "list-shares", seasonId }, `list:${seasonId}`)}
            >
              Hisse uygunluğu
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-3 sm:p-5 lg:grid-cols-[280px_minmax(0,1fr)_340px]">
        <aside className="hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-2 lg:block">
          {panels.map((item) => {
            const Icon = item.icon;
            const selected = item.id === panel;
            return (
              <button
                key={item.id}
                onClick={() => setPanel(item.id)}
                className={`mb-1 flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition ${selected ? "bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-400/30" : "text-slate-300 hover:bg-slate-800"}`}
              >
                <Icon className="mt-0.5 h-5 w-5" />
                <span>
                  <span className="block text-sm font-medium">{item.ad}</span>
                  <span className="block text-xs text-slate-500">{item.aciklama}</span>
                </span>
              </button>
            );
          })}
        </aside>

        <main className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-2xl">
          <div className="flex gap-2 overflow-x-auto border-b border-slate-800 p-2 lg:hidden">
            {panels.map((item) => (
              <Button key={item.id} variant={item.id === panel ? "default" : "secondary"} size="sm" onClick={() => setPanel(item.id)} className="shrink-0">
                {item.ad}
              </Button>
            ))}
          </div>
          <div className="border-b border-slate-800 px-4 py-4">
            <div className="flex items-center gap-3">
              <ActiveIcon className="h-6 w-6 text-emerald-300" />
              <div>
                <h3 className="text-lg font-semibold">{active.ad}</h3>
                <p className="text-sm text-slate-400">{active.aciklama}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_260px] lg:grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-4">
              {panel === "sale" && (
                <WorkspaceCard title="Atomik kesin satış" icon={CheckCircle2}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Hissedar müşteri ID"><Input value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="customer_..." /></Field>
                    <Field label="Ödeyen kişi ID"><Input value={payerCustomerId} onChange={(e) => setPayerCustomerId(e.target.value)} placeholder="Boşsa hissedar" /></Field>
                    <Field label="Hisse ID'leri"><Input value={shareIds} onChange={(e) => setShareIds(e.target.value)} placeholder="share_1, share_2" /></Field>
                    <Field label="Dekont No"><Input value={receiptNo} onChange={(e) => setReceiptNo(e.target.value)} placeholder="TKR-..." /></Field>
                    <Field label="Liste fiyatı / hisse"><Input value={listPrice} onChange={(e) => setListPrice(e.target.value)} inputMode="decimal" /></Field>
                    <Field label="İndirim / hisse"><Input value={discount} onChange={(e) => setDiscount(e.target.value)} inputMode="decimal" /></Field>
                  </div>
                  <PaymentGrid cash={cash} setCash={setCash} bank={bank} setBank={setBank} pos={pos} setPos={setPos} />
                  <Button
                    disabled={disabledSale}
                    onClick={() => postSalesFinance("Kesin satış", {
                      action: "confirm-sale",
                      id: `sale_${crypto.randomUUID()}`,
                      seasonId,
                      customerId,
                      payerCustomerId: payerCustomerId || undefined,
                      shareIds: splitIds(shareIds),
                      listPricePerShare: money(listPrice),
                      discountPerShare: money(discount),
                      downPayment: { receiptId: `receipt_${crypto.randomUUID()}`, receiptNo: receiptNo || `TKR-${Date.now()}`, methodSplits: methodSplits() },
                      approval: approvalKaniti(),
                    })}
                  >
                    Pozitif kaporayla kesinleştir
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={pending || !permissions.canManagePricing || !seasonId}
                    onClick={() => postSalesFinance("Fiyat tarifesi yayınla", {
                      action: "publish-price-tariff",
                      id: `tariff_${crypto.randomUUID()}`,
                      seasonId,
                      name: "Faz 5–6 satış tarifesi",
                      versionId: `tariff_version_${crypto.randomUUID()}`,
                      version: 1,
                      changeReason: reason || "Liste fiyatı ve kapora snapshot yönetimi",
                      items: [{ id: `tariff_item_${crypto.randomUUID()}`, shareGroup: "buyukbas", listPrice: money(listPrice), minDepositAmount: "1.00" }],
                      approval: approvalKaniti(),
                    })}
                  >
                    Liste fiyat tarifesini yayınla
                  </Button>
                  {totals.kapora <= 0 && <RuleWarning>Satış, alacak, ledger, sahiplik veya vekâlet pozitif tahsilat olmadan oluşmaz.</RuleWarning>}
                </WorkspaceCard>
              )}

              {panel === "reserve" && (
                <WorkspaceCard title="Süreli rezervasyon" icon={Clock}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Hisse ID"><Input value={shareId} onChange={(e) => setShareId(e.target.value)} /></Field>
                    <Field label="Müşteri ID"><Input value={customerId} onChange={(e) => setCustomerId(e.target.value)} /></Field>
                    <Field label="Süre bitişi"><Input type="datetime-local" value={reservedUntil} onChange={(e) => setReservedUntil(e.target.value)} /></Field>
                    <Field label="Gerekçe"><Input value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button disabled={pending || !permissions.canReserve || !seasonId || !shareId || !customerId} onClick={() => postSalesFinance("Rezervasyon", {
                      action: "reserve-share",
                      id: `reservation_${crypto.randomUUID()}`,
                      seasonId,
                      shareId,
                      customerId,
                      reservedUntil: reservedUntil ? new Date(reservedUntil).toISOString() : new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                      reason: reason || undefined,
                    })}>30 dk rezerve et</Button>
                    <Button variant="secondary" disabled={pending || !permissions.canReserve || !seasonId} onClick={() => postJson("/api/tenant/sales-finance/reservations/expire", "Rezervasyon worker", { seasonId, limit: 100, workerRunId: `run_${crypto.randomUUID()}` })}>Süre-sonu worker çalıştır</Button>
                  </div>
                  <RuleWarning>Kaporasız rezervasyon kesin satış değildir; süresi dolunca hisse işletme envanterine döner.</RuleWarning>
                </WorkspaceCard>
              )}

              {panel === "receipt" && (
                <WorkspaceCard title="Karma tahsilat ve dağıtım" icon={SplitSquareHorizontal}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Müşteri / cari ID"><Input value={customerId} onChange={(e) => setCustomerId(e.target.value)} /></Field>
                    <Field label="Ödeyen kişi ID"><Input value={payerCustomerId} onChange={(e) => setPayerCustomerId(e.target.value)} placeholder="Farklı kişi olabilir" /></Field>
                    <Field label="Satış ID"><Input value={saleId} onChange={(e) => setSaleId(e.target.value)} /></Field>
                    <Field label="Hisse ID"><Input value={shareId} onChange={(e) => setShareId(e.target.value)} /></Field>
                  </div>
                  <PaymentGrid cash={cash} setCash={setCash} bank={bank} setBank={setBank} pos={pos} setPos={setPos} />
                  <Button disabled={pending || !permissions.canReceipt || totals.kapora <= 0 || !customerId} onClick={() => postSalesFinance("Karma tahsilat", {
                    action: "record-receipt",
                    id: `receipt_${crypto.randomUUID()}`,
                    seasonId,
                    customerId,
                    payerCustomerId: payerCustomerId || undefined,
                    saleId: saleId || undefined,
                    receiptNo: receiptNo || `TKR-${Date.now()}`,
                    methodSplits: methodSplits(),
                    allocations: [{ id: `allocation_${crypto.randomUUID()}`, saleId: saleId || undefined, customerId, shareId: shareId || undefined, amount: money(totals.kapora) }],
                    occurredAt: new Date().toISOString(),
                    approval: approvalKaniti(),
                  })}>Tahsilatı kaydet</Button>
                </WorkspaceCard>
              )}

              {panel === "cash" && (
                <PolicyPanel
                  title="Kasa açılış/kapanış ve fiziksel sayım"
                  description="Bu yüzey Faz 5–6 ledger temeline bağlı kasa komutlarını onay kuyruğuna alır. Fiziksel sayım farkları muhasebe kaydı silmeden istisna olarak izlenir."
                  permissionKey="kurban.finance.ledger.manage.organization"
                  operationType="cash-session-command"
                  reason={reason}
                  setReason={setReason}
                  requestApproval={requestApproval}
                />
              )}

              {panel === "reversal" && (
                <WorkspaceCard title="İade, mahsup ve ters journal güvenliği" icon={RotateCcw}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Satış ID"><Input value={saleId} onChange={(e) => setSaleId(e.target.value)} /></Field>
                    <Field label="Kaynak hisse ID"><Input value={shareId} onChange={(e) => setShareId(e.target.value)} /></Field>
                    <Field label="Hedef hisse ID"><Input value={targetShareId} onChange={(e) => setTargetShareId(e.target.value)} /></Field>
                    <Field label="Yeni hissedar müşteri ID"><Input value={customerId} onChange={(e) => setCustomerId(e.target.value)} /></Field>
                    <Field label="Gerekçe"><Input value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button disabled={pending || !permissions.canCancel || !saleId} onClick={() => postSalesFinance("Satış iptal", { action: "cancel-sale", saleId, seasonId, reason: reason || "Onaylı satış iptal komutu", approval: approvalKaniti() })}>Hareketsiz satışı iptal et</Button>
                    <Button disabled={pending || !permissions.canTransfer || !shareId || !targetShareId || !customerId} variant="secondary" onClick={() => postSalesFinance("Hisse transfer/taşıma", { action: "transfer-share", id: `transfer_${crypto.randomUUID()}`, seasonId, sourceShareId: shareId, targetShareId, toCustomerId: customerId, reason: reason || "Sağlık/operasyon kaynaklı hisse taşıma", approval: approvalKaniti() })}>Hisseyi taşı / transfer et</Button>
                    <Button variant="secondary" disabled={!saleId} onClick={() => requestApproval("kurban.sale.cancel.operational_period", "refund-offset-reversal", { operationRef: saleId, saleId, seasonId, reason })}>İade/mahsup için onay iste</Button>
                  </div>
                  <RuleWarning>Ödemeli finansal kayıt fiziksel silinmez; iade, mahsup veya ters journal akışıyla düzeltilir.</RuleWarning>
                </WorkspaceCard>
              )}

              {panel === "reconcile" && (
                <PolicyPanel
                  title="Finansal mutabakat ve istisna kuyruğu"
                  description="Banka/POS farkları finansal komut olarak onaya alınır; kanıt bağlandıktan sonra ilgili receipt veya ters kayıt komutu güvenli resume edilir."
                  permissionKey="kurban.finance.ledger.read.organization"
                  operationType="reconciliation-exception"
                  reason={reason}
                  setReason={setReason}
                  requestApproval={requestApproval}
                />
              )}

              {panel === "approval" && (
                <WorkspaceCard title="ApprovalPolicy ve güvenli resume" icon={ShieldCheck}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Approval Request ID"><Input value={approvalRequestId} onChange={(e) => setApprovalRequestId(e.target.value)} /></Field>
                    <Field label="Onay sayısı"><Input value={approvalCount} onChange={(e) => setApprovalCount(e.target.value)} inputMode="numeric" /></Field>
                  </div>
                  <Button disabled={pending || !permissions.canManageAccess} onClick={() => postJson("/api/tenant/authorization", "ApprovalPolicy oluştur", {
                    operation: "create-approval-policy",
                    name: "Yüksek tutarlı satış/finans onayı",
                    permissionKey: "kurban.finance.receipt.create.organization",
                    approverPermissionKey: "identity.approval.decide.organization",
                    requiredApprovals: 2,
                    requireDistinctUser: true,
                    requireReauthentication: true,
                    conditions: { amountLimit: { min: "100000.00", currency: "TRY" }, trustedDevice: true },
                  })}>Yüksek tutar policy oluştur</Button>
                </WorkspaceCard>
              )}
            </div>

            <aside className="space-y-4">
              <Card className="border-slate-800 bg-slate-950/80 text-slate-100">
                <CardHeader><CardTitle className="text-sm">Fiyat snapshot</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <Metric label="Hisse adedi" value={String(totals.adet)} />
                  <Metric label="Liste fiyatı" value={tl(totals.liste)} />
                  <Metric label="İndirim" value={tl(totals.indirim)} tone="amber" />
                  <Metric label="Anlaşılmış bedel" value={tl(totals.anlasilan)} tone="emerald" />
                  <Metric label="Kapora / tahsilat" value={tl(totals.kapora)} tone={totals.kapora > 0 ? "emerald" : "red"} />
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-slate-950/80 text-slate-100">
                <CardHeader><CardTitle className="text-sm">Yüzey davranışı</CardTitle></CardHeader>
                <CardContent className="grid gap-2 text-xs text-slate-300">
                  <Surface icon={Smartphone} label="Mobil" text="Tek görev, büyük dokunma alanı, alt aksiyon." />
                  <Surface icon={TabletSmartphone} label="Tablet" text="İki panel: komut + kasa özeti." />
                  <Surface icon={LockKeyhole} label="Server-side" text="API tenant context + permission runtime kullanır." />
                </CardContent>
              </Card>
            </aside>
          </div>
        </main>

        <aside className="rounded-2xl border border-slate-800 bg-slate-900/70">
          <div className="border-b border-slate-800 p-4">
            <div className="flex items-center gap-2"><History className="h-5 w-5 text-blue-300" /><h3 className="font-semibold">İşlem geçmişi</h3></div>
          </div>
          <div className="max-h-[640px] space-y-3 overflow-auto p-3">
            {logs.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">Henüz komut yok. Komutlar idempotency-key ile API’ye gider; sonuç burada kalır.</p>
            ) : logs.map((log) => (
              <details key={log.id} className="rounded-xl border border-slate-800 bg-slate-950/80 p-3" open={logs[0]?.id === log.id}>
                <summary className="cursor-pointer text-sm font-medium">
                  <span className={log.ok ? "text-emerald-300" : "text-red-300"}>{log.ok ? "OK" : "HATA"}</span> · {log.title}
                </summary>
                <pre className="mt-2 overflow-auto whitespace-pre-wrap text-xs text-slate-400">{log.detail}</pre>
              </details>
            ))}
          </div>
        </aside>
      </div>

      <div className="sticky bottom-0 border-t border-slate-800 bg-slate-950 p-3 lg:hidden">
        <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-300">
          <span>Kapora {tl(totals.kapora)}</span>
          <span>Net {tl(totals.anlasilan)}</span>
          <span>{pending ? "Çalışıyor…" : "Hazır"}</span>
        </div>
      </div>

      {lastResult ? <span className="sr-only">{JSON.stringify(lastResult)}</span> : null}
    </div>
  );
}

function WorkspaceCard({ title, icon: Icon, children }: { title: string; icon: ComponentType<{ className?: string }>; children: ReactNode }) {
  return (
    <Card className="border-slate-800 bg-slate-950/80 text-slate-100">
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Icon className="h-5 w-5 text-emerald-300" />{title}</CardTitle></CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs text-slate-300">{label}</Label>{children}</div>;
}

function PaymentGrid({ cash, setCash, bank, setBank, pos, setPos }: { cash: string; setCash: (v: string) => void; bank: string; setBank: (v: string) => void; pos: string; setPos: (v: string) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Field label="Nakit"><Input value={cash} onChange={(e) => setCash(e.target.value)} inputMode="decimal" /></Field>
      <Field label="Banka / havale"><Input value={bank} onChange={(e) => setBank(e.target.value)} inputMode="decimal" /></Field>
      <Field label="POS"><Input value={pos} onChange={(e) => setPos(e.target.value)} inputMode="decimal" /></Field>
    </div>
  );
}

function PolicyPanel({ title, description, permissionKey, operationType, reason, setReason, requestApproval }: { title: string; description: string; permissionKey: string; operationType: string; reason: string; setReason: (v: string) => void; requestApproval: (permissionKey: string, operationType: string, payload: Record<string, unknown>) => Promise<void> }) {
  return (
    <WorkspaceCard title={title} icon={AlertTriangle}>
      <p className="text-sm text-slate-300">{description}</p>
      <Field label="Operasyon gerekçesi / kanıt notu">
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Örn. POS ekstresi ile kasa sayımı arasında fark var; dekont eklendi." />
      </Field>
      <Button variant="secondary" onClick={() => requestApproval(permissionKey, operationType, { operationRef: `${operationType}:${Date.now()}`, reason })}>Onay kuyruğuna al</Button>
    </WorkspaceCard>
  );
}

function RuleWarning({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">{children}</div>;
}

function Metric({ label, value, tone = "slate" }: { label: string; value: string; tone?: "slate" | "amber" | "emerald" | "red" }) {
  const color = tone === "emerald" ? "text-emerald-300" : tone === "amber" ? "text-amber-300" : tone === "red" ? "text-red-300" : "text-slate-100";
  return <div className="flex items-center justify-between gap-2"><span className="text-slate-400">{label}</span><span className={`font-tabular font-semibold ${color}`}>{value}</span></div>;
}

function Surface({ icon: Icon, label, text }: { icon: ComponentType<{ className?: string }>; label: string; text: string }) {
  return <div className="flex gap-2 rounded-lg bg-slate-900 p-2"><Icon className="mt-0.5 h-4 w-4 text-blue-300" /><span><strong className="text-slate-100">{label}</strong><br />{text}</span></div>;
}

function splitIds(value: string): string[] {
  return value.split(/[,\n ]+/).map((item) => item.trim()).filter(Boolean);
}

function para(value: string | number): number {
  const n = typeof value === "number" ? value : Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function money(value: string | number): string {
  return para(value).toFixed(2);
}

function tl(value: number): string {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(value);
}
