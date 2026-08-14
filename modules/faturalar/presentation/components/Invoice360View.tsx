"use client";

import { useEffect, useState } from "react";
import type { InvoiceRecord } from "../../application/invoice-service";

const sections = ["Genel bilgiler", "Müşteri / tedarikçi", "Fatura kalemleri", "Vergiler ve indirimler", "Ödeme / tahsilat", "Cari hareketler", "Ledger / journal", "Hayvan / hisse / satış", "e‑Belge durumu", "XML / PDF / ekler", "İptal / iade / itiraz", "Audit zaman çizelgesi"];

export function Invoice360View({ id }: { id: string }) {
  const [item, setItem] = useState<InvoiceRecord | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { void fetch(`/api/tenant/invoices/${encodeURIComponent(id)}`, { cache: "no-store" }).then(async (response) => { const body = await response.json() as { item?: InvoiceRecord }; if (!response.ok || !body.item) throw new Error(); setItem(body.item); }).catch(() => setError(true)); }, [id]);
  if (error) return <p className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">Fatura ayrıntısı güvenli biçimde alınamadı.</p>;
  if (!item) return <p className="p-5 text-slate-600">Fatura 360 yükleniyor…</p>;
  return <div className="space-y-5">
    <header className="rounded-2xl bg-slate-900 p-5 text-white"><p className="text-sm text-slate-300">Fatura 360</p><h1 className="text-2xl font-bold">{item.invoiceNo}</h1><div className="mt-3 flex flex-wrap gap-2 text-xs"><Badge>{item.accountingStatus}</Badge><Badge>{item.paymentStatus}</Badge><Badge>{item.electronicChannel} · {item.electronicStatus}</Badge></div></header>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{sections.map((section) => <article key={section} className="min-h-28 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="font-semibold text-slate-900">{section}</h2><p className="mt-2 text-sm text-slate-500">Yetki ve tenant kapsamındaki kayıtlar bu panelde ilişkilendirilir.</p></article>)}</section>
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><h2 className="font-semibold text-amber-950">Yetkili işlemler</h2><p className="mt-1 text-sm text-amber-900">Onay, ledger’a işleme, ödeme bağlama, iade/ters kayıt ve e‑Belge işlemleri ayrı izin ve yeniden doğrulama kapılarından geçer. Posted kayıt doğrudan düzenlenmez.</p></section>
  </div>;
}

function Badge({ children }: { children: React.ReactNode }) { return <span className="rounded-full bg-white/10 px-3 py-1">{children}</span>; }
