"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { InvoiceRecord } from "../../application/invoice-service";

const views = [
  ["all", "Tüm Faturalar"], ["inbound", "Gelen"], ["outbound", "Giden"], ["draft", "Taslaklar"],
  ["approval", "Onay bekleyen"], ["queue", "Gönderim kuyruğu"], ["failed", "Hatalı belgeler"],
] as const;

export function InvoiceWorkspace() {
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<readonly InvoiceRecord[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "disabled" | "error">("loading");

  const load = useCallback(async () => {
    setState("loading");
    const params = new URLSearchParams();
    if (query.trim()) params.set("query", query.trim());
    if (active === "inbound") params.set("direction", "INBOUND");
    if (active === "outbound") params.set("direction", "OUTBOUND");
    if (active === "draft") params.set("accountingStatus", "DRAFT");
    if (active === "approval") params.set("accountingStatus", "APPROVAL_PENDING");
    if (active === "queue") params.set("electronicStatus", "QUEUED");
    if (active === "failed") params.set("electronicStatus", "FAILED");
    try {
      const response = await fetch(`/api/tenant/invoices?${params}`, { cache: "no-store" });
      const body = await response.json() as { ok?: boolean; items?: InvoiceRecord[]; code?: string };
      if (!response.ok) { setItems([]); setState(body.code === "TENANT_INVOICE_POSTGRES_NOT_ENABLED" ? "disabled" : "error"); return; }
      setItems(body.items ?? []); setState("ready");
    } catch { setState("error"); }
  }, [active, query]);

  useEffect(() => { void load(); }, [load]);

  return <div className="space-y-5">
    <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Finansal omurga</p><h1 className="text-2xl font-bold text-slate-900">Faturalar 360</h1><p className="mt-1 max-w-3xl text-sm text-slate-600">Alış, satış ve iadeleri; ödeme, cari, ledger ve e‑Belge yaşam döngüleriyle tek görünümde izleyin.</p></div>
        <Link href="/faturalar/e-belge" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">e‑Belge Merkezi</Link>
      </div>
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Fatura görünümleri">
        {views.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={active === id} onClick={() => setActive(id)} className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium ${active === id ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-700"}`}>{label}</button>)}
      </div>
    </header>

    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]" onSubmit={(event) => { event.preventDefault(); void load(); }}>
        <label className="text-sm font-medium text-slate-700">Fatura no veya UUID
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Ara…" />
        </label>
        <button className="self-end rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white">Filtrele</button>
      </form>
      <details className="mt-3 rounded-xl bg-slate-50 p-3"><summary className="cursor-pointer text-sm font-semibold text-slate-700">Gelişmiş filtreler</summary><p className="mt-2 text-sm text-slate-600">Tarih, sezon, tesis, yön, ticari işlem, belge niteliği, e‑kanal, taraf, üç ayrı durum ekseni, vade, tutar ve operasyon referansları API sözleşmesinde bağımsız filtrelenir.</p></details>
    </section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-live="polite">
      {state === "loading" && <p className="p-6 text-sm text-slate-600">Faturalar yükleniyor…</p>}
      {state === "disabled" && <p className="p-6 text-sm text-amber-800">Tenant PostgreSQL fatura runtime’ı bu ortamda etkin değil. Legacy veriye otomatik geri düşülmedi.</p>}
      {state === "error" && <p className="p-6 text-sm text-red-700">Fatura listesi güvenli biçimde alınamadı.</p>}
      {state === "ready" && items.length === 0 && <p className="p-6 text-sm text-slate-600">Bu görünümde fatura bulunamadı.</p>}
      {state === "ready" && items.length > 0 && <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="px-4 py-3">Fatura</th><th className="px-4 py-3">Yön / Tür</th><th className="px-4 py-3">Muhasebe</th><th className="px-4 py-3">Ödeme</th><th className="px-4 py-3">e‑Belge</th><th className="px-4 py-3 text-right">Toplam</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="px-4 py-3"><Link className="font-semibold text-emerald-800 hover:underline" href={`/faturalar/${item.id}`}>{item.invoiceNo}</Link><div className="text-xs text-slate-500">{item.uuid}</div></td><td className="px-4 py-3">{item.direction} / {item.tradeType} {item.documentNature === "RETURN" ? "İade" : ""}</td><td className="px-4 py-3">{item.accountingStatus}</td><td className="px-4 py-3">{item.paymentStatus}</td><td className="px-4 py-3">{item.electronicChannel} · {item.electronicStatus}</td><td className="px-4 py-3 text-right font-semibold">{item.grandTotal} {item.currency}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
