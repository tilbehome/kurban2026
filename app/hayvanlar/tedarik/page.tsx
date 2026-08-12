import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { aktifOturum } from "@/shared/lib/session";
import { masterDataMode, tenantActiveSeasonId, tenantMasterDataService, tenantUseCaseContext } from "@/shared/lib/tenant-master-data-adapter";
import { ExpenseForm, PurchaseInvoiceForm, SupplierCreateForm, SupplierPaymentForm } from "@/modules/tenant-master-data/components/MasterDataForms";

export const dynamic = "force-dynamic";

export default async function ProcurementWorkspacePage() {
  const session = await aktifOturum();
  const postgres = masterDataMode() === "postgres";
  const seasonId = postgres ? tenantActiveSeasonId() : undefined;
  const suppliers = postgres && session ? await tenantMasterDataService().listSuppliers(tenantUseCaseContext(session, { readOnly: true }), seasonId) : [];
  return (
    <AppShell>
      <SayfaBaslik baslik="Tedarik ve alış merkezi" altBaslik="Tedarikçi carisi, alış faturası, gerçek hayvan maliyeti ve gider tek çalışma alanında" />
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        {!postgres ? <div className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950"><strong>Legacy uyumluluk modu etkin.</strong><p className="mt-1">Mevcut SQLite ekranları korunuyor; tenant PostgreSQL veri geçişi etkinleştirilmeden bu merkez yazma yapmaz.</p></div> : null}
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <Metric label="Tedarikçi" value={suppliers.length} />
          <Metric label="Açık tedarikçi bakiyesi" value={`${suppliers.reduce((sum, supplier) => sum + Number(supplier.balance ?? 0), 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ₺`} />
          <Metric label="Aktif sezon" value={seasonId ?? "Legacy"} compact />
        </div>
        {postgres ? <div className="grid gap-5 xl:grid-cols-2">
          <SupplierCreateForm />
          <PurchaseInvoiceForm suppliers={suppliers} />
          <SupplierPaymentForm suppliers={suppliers} />
          <ExpenseForm />
        </div> : null}
        <section className="mt-5 overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b p-4"><h2 className="font-semibold">Tedarikçi sezon carileri</h2><p className="text-sm text-muted-foreground">Aynı tedarikçi geçmiş sezonlarda ayrı bakiyeler taşır.</p></div>
          <div className="divide-y">{suppliers.map((supplier) => <div key={supplier.id} className="flex min-h-16 items-center justify-between gap-4 px-4 py-3"><div><p className="font-medium">{supplier.displayName}</p><p className="text-sm text-muted-foreground">{supplier.phone ?? "Telefon yok"} · {supplier.taxNumber ?? "Vergi no yok"}</p></div><strong className="font-tabular">{Number(supplier.balance ?? 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</strong></div>)}{postgres && suppliers.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">İlk alıştan önce tedarikçi kartı oluşturun.</p> : null}</div>
        </section>
      </div>
    </AppShell>
  );
}

function Metric({ label, value, compact = false }: { label: string; value: string | number; compact?: boolean }) { return <div className="rounded-2xl border bg-card p-4 shadow-sm"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className={`mt-1 font-bold ${compact ? "truncate text-base" : "text-2xl"}`}>{value}</p></div>; }
