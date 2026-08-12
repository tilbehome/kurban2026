import Link from "next/link";
import { ArrowLeft, CalendarRange, MapPin, Phone, UserRound } from "lucide-react";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { buttonVariants } from "@/components/ui/button";
import type { CustomerDetail } from "@/packages/tenant-core/src";
import type { SeasonStatus } from "@/packages/tenant-core/src";

export function TenantCustomerDetailView({ customer }: { customer: CustomerDetail }) {
  return (
    <AppShell>
      <SayfaBaslik baslik={customer.displayName} altBaslik="Kalıcı müşteri kartı · sezon carileri ayrı izlenir" aksiyonlar={<Link href="/musteriler" className={buttonVariants({ variant: "outline" })}><ArrowLeft size={16} /> Müşteriler</Link>} />
      <div className="mx-auto grid max-w-7xl gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(280px,.65fr)_minmax(0,1.35fr)] lg:p-8">
        <aside className="space-y-4">
          <section className="rounded-2xl border bg-card p-5 shadow-sm"><span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-700"><UserRound /></span><h2 className="font-semibold">Kimlik ve iletişim</h2><dl className="mt-4 space-y-3 text-sm"><Info label="Kayıt" value={new Date(customer.createdAt).toLocaleDateString("tr-TR")} /><Info label="Durum" value={customer.active ? "Aktif" : "Pasif"} /><Info label="Kimlik no" value={customer.identityNumber ?? "Belirtilmedi"} /></dl></section>
          <section className="rounded-2xl border bg-card p-5 shadow-sm"><h2 className="flex items-center gap-2 font-semibold"><Phone size={17} className="text-orange-600" /> Telefonlar</h2><div className="mt-3 space-y-2">{customer.phones.map((phone) => <a key={phone.id} href={`tel:${phone.phone}`} className="flex min-h-11 items-center justify-between rounded-xl bg-muted px-3 text-sm"><span>{phone.phone}</span>{phone.isPrimary ? <small>Ana</small> : null}</a>)}{customer.phones.length === 0 ? <p className="text-sm text-muted-foreground">Telefon kaydı yok.</p> : null}</div></section>
          <section className="rounded-2xl border bg-card p-5 shadow-sm"><h2 className="flex items-center gap-2 font-semibold"><MapPin size={17} className="text-orange-600" /> Adresler</h2><div className="mt-3 space-y-3">{customer.addresses.map((address) => <address key={address.id} className="not-italic text-sm text-muted-foreground">{address.addressLine}<br />{[address.district, address.city].filter(Boolean).join(" / ")}</address>)}{customer.addresses.length === 0 ? <p className="text-sm text-muted-foreground">Adres kaydı yok.</p> : null}</div></section>
        </aside>
        <main className="min-w-0">
          <section className="overflow-hidden rounded-2xl border bg-card shadow-sm"><div className="flex items-center gap-2 border-b p-5"><CalendarRange size={18} className="text-orange-600" /><div><h2 className="font-semibold">Sezon geçmişi ve cari</h2><p className="text-sm text-muted-foreground">Her dönem kendi borç, tahsilat ve bakiyesini taşır.</p></div></div><div className="divide-y">{customer.history.map((item) => <article key={item.seasonId} className="grid gap-3 p-5 sm:grid-cols-[1fr_repeat(3,minmax(100px,.45fr))] sm:items-center"><div><strong>{item.seasonName}</strong><p className="text-xs text-muted-foreground">{statusLabel(item.seasonStatus)}</p></div><Money label="Borç" value={item.debitTotal} /><Money label="Tahsilat" value={item.creditTotal} positive /><Money label="Bakiye" value={item.balance} emphasis /></article>)}{customer.history.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Sezon carisi bulunmuyor.</p> : null}</div></section>
          {customer.notes ? <section className="mt-5 rounded-2xl border bg-card p-5 shadow-sm"><h2 className="font-semibold">Müşteri notu</h2><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{customer.notes}</p></section> : null}
          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">Hissedar, ödeyen kişi ve teslim alan kimlikleri satış/tahsilat domaininde ayrı referanslar olarak tutulur. Bu kart yalnız kalıcı müşteri kimliğidir.</div>
        </main>
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-medium">{value}</dd></div>; }
function Money({ label, value, positive = false, emphasis = false }: { label: string; value: string; positive?: boolean; emphasis?: boolean }) { return <div className="flex justify-between gap-2 sm:block sm:text-right"><span className="text-xs text-muted-foreground">{label}</span><p className={`font-tabular ${positive ? "text-emerald-700" : ""} ${emphasis ? "font-bold" : "font-medium"}`}>{Number(value).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</p></div>; }
function statusLabel(status: SeasonStatus) { return ({ preparation: "Hazırlık", sales: "Satış", slaughter: "Kesim", delivery: "Teslimat", reconciliation: "Mutabakat", archived: "Arşiv" } as const)[status]; }
