"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, FilePlus2, HeartPulse, Landmark, Scale, Truck, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AnimalListItem, SeasonListItem, SupplierListItem } from "@/packages/tenant-core/src";

type Payload = Record<string, unknown> & { action: string };

function useCommand() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function submit(payload: Payload, after?: () => void) {
    startTransition(async () => {
      const response = await fetch("/api/tenant/master-data", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": `ui_${crypto.randomUUID()}` },
        body: JSON.stringify(payload),
      });
      const body = await response.json() as { success?: boolean; code?: string };
      if (!response.ok || !body.success) {
        toast.error(messageForCode(body.code));
        return;
      }
      toast.success("İşlem tenant veritabanına kaydedildi");
      after?.();
      router.refresh();
    });
  }
  return { pending, submit };
}

export function SeasonCreateForm() {
  const command = useCommand();
  return (
    <CommandCard icon={<Landmark size={18} />} title="Yeni sezon" description="Sezon hazırlık durumunda açılır; ileri geçişler sırayla yapılır.">
      <form onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget; const data = new FormData(form);
        command.submit({ action: "season-create", name: data.get("name"), year: Number(data.get("year")), startsAt: optional(data, "startsAt"), endsAt: optional(data, "endsAt") }, () => form.reset());
      }} className="grid gap-4 sm:grid-cols-2">
        <Field label="Sezon adı"><Input name="name" required minLength={2} placeholder="Kurban 2027" /></Field>
        <Field label="Yıl"><Input name="year" type="number" required min={2020} max={2100} defaultValue={new Date().getFullYear()} /></Field>
        <Field label="Başlangıç"><Input name="startsAt" type="date" /></Field>
        <Field label="Bitiş"><Input name="endsAt" type="date" /></Field>
        <Button disabled={command.pending} className="sm:col-span-2 sm:justify-self-end">{command.pending ? "Açılıyor…" : "Sezonu hazırlıkta aç"}</Button>
      </form>
    </CommandCard>
  );
}

export function SeasonTransitionButton({ season }: { season: SeasonListItem }) {
  const command = useCommand();
  const next = nextSeasonStatus(season.status);
  if (!next) return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">Salt okunur arşiv</span>;
  return <Button size="sm" variant="outline" disabled={command.pending} onClick={() => command.submit({ action: "season-transition", seasonId: season.id, to: next })}>{statusLabel(next)} <ArrowRight size={14} /></Button>;
}

export function SupplierCreateForm() {
  const command = useCommand();
  return (
    <CommandCard icon={<Truck size={18} />} title="Tedarikçi kartı" description="Tedarikçi kalıcıdır; cari hareketleri sezon bazında ayrılır.">
      <form onSubmit={(event) => {
        event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
        command.submit({ action: "supplier-create", displayName: data.get("displayName"), phone: optional(data, "phone"), taxNumber: optional(data, "taxNumber") }, () => form.reset());
      }} className="grid gap-4">
        <Field label="Tedarikçi adı"><Input name="displayName" required autoComplete="organization" /></Field>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Telefon"><Input name="phone" inputMode="tel" /></Field><Field label="Vergi no"><Input name="taxNumber" /></Field></div>
        <Button disabled={command.pending}>{command.pending ? "Kaydediliyor…" : "Tedarikçiyi kaydet"}</Button>
      </form>
    </CommandCard>
  );
}

export function PurchaseInvoiceForm({ suppliers }: { suppliers: SupplierListItem[] }) {
  const command = useCommand();
  return (
    <CommandCard icon={<FilePlus2 size={18} />} title="Alış faturası + hayvan" description="Tek satırlı hızlı giriş; fatura, hayvan, yedi boş hisse, tedarikçi borcu, audit ve outbox atomik oluşur.">
      <form onSubmit={(event) => {
        event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); const amount = normalizedDecimal(data.get("amount"));
        command.submit({ action: "purchase-invoice", supplierId: data.get("supplierId"), invoiceNo: data.get("invoiceNo"), invoiceDate: data.get("invoiceDate"), subtotal: amount, grandTotal: amount, lines: [{ description: `Küpe ${data.get("earTag")}`, quantity: "1", unitPrice: amount, lineTotal: amount, earTag: data.get("earTag"), liveWeightKg: optional(data, "liveWeightKg") }] }, () => form.reset());
      }} className="grid gap-4 sm:grid-cols-2">
        <Field label="Tedarikçi"><select name="supplierId" required className={selectClass}><option value="">Seçin</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.displayName}</option>)}</select></Field>
        <Field label="Fatura no"><Input name="invoiceNo" required /></Field>
        <Field label="Fatura tarihi"><Input name="invoiceDate" type="date" required defaultValue={today()} /></Field>
        <Field label="Küpe no"><Input name="earTag" required autoCapitalize="characters" /></Field>
        <Field label="Gerçek alış bedeli"><Input name="amount" required inputMode="decimal" pattern="[0-9]+([.,][0-9]{1,4})?" /></Field>
        <Field label="Canlı kilo"><Input name="liveWeightKg" inputMode="decimal" pattern="[0-9]+([.,][0-9]{1,3})?" /></Field>
        <Button disabled={command.pending || suppliers.length === 0} className="sm:col-span-2">{command.pending ? "Fatura işleniyor…" : "Fatura ve hayvanı kaydet"}</Button>
      </form>
    </CommandCard>
  );
}

export function SupplierPaymentForm({ suppliers }: { suppliers: SupplierListItem[] }) {
  const command = useCommand();
  return (
    <CommandCard icon={<WalletCards size={18} />} title="Tedarikçi ödemesi" description="Pozitif ödeme ilgili sezon carisinden düşer; bakiye üstü ödeme bloke edilir.">
      <form onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); command.submit({ action: "supplier-payment", supplierId: data.get("supplierId"), amount: normalizedDecimal(data.get("amount")), method: data.get("method"), referenceNo: optional(data, "referenceNo") }, () => form.reset()); }} className="grid gap-4 sm:grid-cols-2">
        <Field label="Tedarikçi"><select name="supplierId" required className={selectClass}><option value="">Seçin</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.displayName} · {supplier.balance ?? "0"} ₺</option>)}</select></Field>
        <Field label="Tutar"><Input name="amount" required inputMode="decimal" /></Field>
        <Field label="Yöntem"><select name="method" className={selectClass}><option value="bank">Banka</option><option value="cash">Nakit</option><option value="pos">POS</option></select></Field>
        <Field label="Referans"><Input name="referenceNo" /></Field>
        <Button disabled={command.pending || suppliers.length === 0} className="sm:col-span-2">Ödemeyi kaydet</Button>
      </form>
    </CommandCard>
  );
}

export function ExpenseForm() {
  const command = useCommand();
  return (
    <CommandCard icon={<WalletCards size={18} />} title="Gider belgesi" description="Kaynak türü + referans birleşimi aynı giderin faturada ve kasada ikinci kez yazılmasını engeller.">
      <form onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); command.submit({ action: "expense-record", category: data.get("category"), description: data.get("description"), amount: normalizedDecimal(data.get("amount")), sourceType: data.get("sourceType"), sourceRef: data.get("sourceRef"), documentNo: optional(data, "documentNo") }, () => form.reset()); }} className="grid gap-4 sm:grid-cols-2">
        <Field label="Kategori"><Input name="category" required placeholder="Nakliye" /></Field><Field label="Tutar"><Input name="amount" required inputMode="decimal" /></Field>
        <Field label="Kaynak türü"><select name="sourceType" className={selectClass}><option value="cash_expense">Kasa gideri</option><option value="purchase_invoice">Alış faturası</option><option value="external_document">Harici belge</option></select></Field>
        <Field label="Tekil kaynak referansı"><Input name="sourceRef" required placeholder="NAK-2027-001" /></Field>
        <Field label="Belge no"><Input name="documentNo" /></Field><Field label="Açıklama"><Input name="description" required /></Field>
        <Button disabled={command.pending} className="sm:col-span-2">Gideri kaydet</Button>
      </form>
    </CommandCard>
  );
}

export function AnimalHistoryForms({ animal }: { animal: AnimalListItem }) {
  const command = useCommand();
  const [mode, setMode] = useState<"weight" | "health" | "queue">("weight");
  return (
    <CommandCard icon={mode === "weight" ? <Scale size={18} /> : <HeartPulse size={18} />} title={`${animal.earTag} hareketi`} description="Kilo, sağlık ve sıra değişiklikleri geçmiş kaydı silmeden eklenir.">
      <div className="mb-4 grid grid-cols-3 rounded-xl bg-muted p-1">{(["weight", "health", "queue"] as const).map((item) => <button key={item} type="button" onClick={() => setMode(item)} className={`rounded-lg px-2 py-2 text-sm ${mode === item ? "bg-background font-semibold shadow-sm" : "text-muted-foreground"}`}>{item === "weight" ? "Kilo" : item === "health" ? "Sağlık" : "Sıra"}</button>)}</div>
      <form key={mode} onSubmit={(event) => {
        event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
        const payload: Payload = mode === "weight" ? { action: "animal-weight", animalId: animal.id, kind: data.get("kind"), weightKg: normalizedDecimal(data.get("weightKg")), note: optional(data, "note") } : mode === "health" ? { action: "animal-health", animalId: animal.id, eventType: data.get("eventType"), status: data.get("status"), notes: optional(data, "notes") } : { action: "qurban-assign", animalId: animal.id, qurbanNo: optional(data, "qurbanNo"), queueNo: Number(data.get("queueNo")), reason: optional(data, "reason") };
        command.submit(payload, () => form.reset());
      }} className="grid gap-4 sm:grid-cols-2">
        {mode === "weight" ? <><Field label="Kilo türü"><select name="kind" className={selectClass}><option value="live">Canlı</option><option value="control">Kontrol</option><option value="carcass">Karkas</option></select></Field><Field label="Kilo"><Input name="weightKg" required inputMode="decimal" /></Field><Field label="Not"><Input name="note" /></Field></> : null}
        {mode === "health" ? <><Field label="Olay"><Input name="eventType" required placeholder="Veteriner kontrolü" /></Field><Field label="Durum"><Input name="status" required placeholder="İzlemde" /></Field><Field label="Not"><Textarea name="notes" /></Field></> : null}
        {mode === "queue" ? <><Field label="Kurban no"><Input name="qurbanNo" /></Field><Field label="Kesim sırası"><Input name="queueNo" type="number" min={1} required defaultValue={animal.queueNo} /></Field><Field label="Değişiklik nedeni"><Input name="reason" /></Field></> : null}
        <Button disabled={command.pending} className="sm:col-span-2">Harekete ekle</Button>
      </form>
    </CommandCard>
  );
}

function CommandCard({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) {
  return <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5"><div className="mb-5 flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700">{icon}</span><div><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></div></div>{children}</section>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="grid gap-1.5"><Label>{label}</Label>{children}</label>; }
function optional(data: FormData, key: string) { const value = String(data.get(key) ?? "").trim(); return value || undefined; }
function normalizedDecimal(value: FormDataEntryValue | null) { return String(value ?? "").replace(",", "."); }
function today() { return new Date().toISOString().slice(0, 10); }
function nextSeasonStatus(status: SeasonListItem["status"]): SeasonListItem["status"] | undefined { return ({ preparation: "sales", sales: "slaughter", slaughter: "delivery", delivery: "reconciliation", reconciliation: "archived", archived: undefined } as const)[status]; }
export function statusLabel(status: SeasonListItem["status"]) { return ({ preparation: "Hazırlık", sales: "Satış", slaughter: "Kesim", delivery: "Teslimat", reconciliation: "Mutabakat", archived: "Arşiv" } as const)[status]; }
function messageForCode(code?: string) { return ({ SEASON_ARCHIVED_READ_ONLY: "Arşiv sezonuna yazılamaz.", SEASON_OPERATION_NOT_ALLOWED: "Bu işlem sezonun mevcut aşamasında yapılamaz.", IDEMPOTENCY_KEY_REUSED: "Aynı işlem anahtarı farklı veriyle kullanıldı.", PURCHASE_INVOICE_TOTAL_MISMATCH: "Fatura satır ve toplamları eşleşmiyor.", POSITIVE_AMOUNT_REQUIRED: "Tutar sıfırdan büyük olmalıdır.", TENANT_PERMISSION_DENIED: "Bu işlem için yetkiniz yok." } as Record<string, string>)[code ?? ""] ?? "İşlem tamamlanamadı."; }
const selectClass = "border-input bg-background h-11 w-full rounded-md border px-3 text-sm";
