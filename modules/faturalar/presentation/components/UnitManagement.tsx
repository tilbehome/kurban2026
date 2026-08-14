"use client";

import { useCallback, useEffect, useState } from "react";
import type { UnitOfMeasureRecord } from "@tilbecore/tenant-core";

export function UnitManagement() {
  const [items, setItems] = useState<readonly UnitOfMeasureRecord[]>([]);
  const [message, setMessage] = useState("");
  const load = useCallback(async () => { const response = await fetch("/api/tenant/definitions/units?includeInactive=true", { cache: "no-store" }); const body = await response.json() as { items?: UnitOfMeasureRecord[]; code?: string }; if (response.ok) setItems(body.items ?? []); else setMessage(body.code ?? "UNIT_LIST_FAILED"); }, []);
  useEffect(() => { void load(); }, [load]);
  async function create(form: FormData) {
    setMessage("");
    const allowsFraction = form.get("allowsFraction") === "on";
    const response = await fetch("/api/tenant/definitions/units", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": `unit_${crypto.randomUUID()}` }, body: JSON.stringify({ action: "create", code: form.get("code"), name: form.get("name"), symbol: form.get("symbol"), category: form.get("category"), decimalPrecision: Number(form.get("decimalPrecision")), allowsFraction }) });
    const body = await response.json() as { code?: string };
    setMessage(response.ok ? "Birim oluşturuldu." : body.code ?? "UNIT_CREATE_FAILED");
    if (response.ok) await load();
  }
  async function toggle(item: UnitOfMeasureRecord) { const response = await fetch("/api/tenant/definitions/units", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": `unit_${crypto.randomUUID()}` }, body: JSON.stringify({ action: "set-active", id: item.id, active: !item.isActive }) }); if (response.ok) await load(); else setMessage("Birim durumu değiştirilemedi."); }
  return <div className="space-y-5"><header><p className="text-sm font-semibold text-emerald-700">Firma Yönetim Merkezi · Tanımlar</p><h1 className="text-2xl font-bold text-slate-900">Ölçü ve İşlem Birimleri</h1><p className="mt-1 text-sm text-slate-600">Sistem birimleri korunur; firma birimleri eklenebilir ve kullanımdan kaldırıldığında fiziksel silinmez.</p></header>
    <form action={create} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6"><input name="code" required maxLength={24} className="rounded-xl border px-3 py-2" placeholder="Kod" /><input name="name" required maxLength={80} className="rounded-xl border px-3 py-2" placeholder="Ad" /><input name="symbol" required maxLength={20} className="rounded-xl border px-3 py-2" placeholder="Sembol" /><select name="category" className="rounded-xl border px-3 py-2">{["COUNT","WEIGHT","LENGTH","AREA","VOLUME","TIME","PACKAGE","SERVICE","CUSTOM"].map((value) => <option key={value}>{value}</option>)}</select><label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"><input type="checkbox" name="allowsFraction" />Kesirli</label><div className="flex gap-2"><input name="decimalPrecision" type="number" min="0" max="6" defaultValue="0" className="w-20 rounded-xl border px-3 py-2" aria-label="Ondalık hassasiyet" /><button className="rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white">Ekle</button></div></form>
    {message && <p className="rounded-xl bg-slate-100 p-3 text-sm" role="status">{message}</p>}
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50"><tr><th className="px-4 py-3">Kod</th><th className="px-4 py-3">Ad / sembol</th><th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Hassasiyet</th><th className="px-4 py-3">Kaynak</th><th className="px-4 py-3">Kullanım</th><th className="px-4 py-3">Durum</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-t"><td className="px-4 py-3 font-semibold">{item.code}</td><td className="px-4 py-3">{item.name} ({item.symbol})</td><td className="px-4 py-3">{item.category}</td><td className="px-4 py-3">{item.allowsFraction ? `${item.decimalPrecision} hane` : "Tam sayı"}</td><td className="px-4 py-3">{item.isSystem ? "Sistem" : "Firma"}</td><td className="px-4 py-3">{item.usageCount}</td><td className="px-4 py-3">{item.isSystem ? (item.isActive ? "Aktif" : "Pasif") : <button type="button" onClick={() => void toggle(item)} className="rounded-lg border px-3 py-1">{item.isActive ? "Pasifleştir" : "Aktifleştir"}</button>}</td></tr>)}</tbody></table></div>
  </div>;
}
