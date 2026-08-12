import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { aktifOturum } from "@/shared/lib/session";
import { masterDataMode, tenantMasterDataService, tenantUseCaseContext } from "@/shared/lib/tenant-master-data-adapter";
import { SeasonCreateForm, SeasonTransitionButton } from "@/modules/tenant-master-data/components/MasterDataForms";
import type { SeasonStatus } from "@/packages/tenant-core/src";

export const dynamic = "force-dynamic";

export default async function SeasonWorkspacePage() {
  const session = await aktifOturum();
  const postgres = masterDataMode() === "postgres";
  const seasons = postgres && session ? await tenantMasterDataService().listSeasons(tenantUseCaseContext(session, { readOnly: true })) : [];
  return (
    <AppShell>
      <SayfaBaslik baslik="Sezon merkezi" altBaslik="Firma operasyonunun yazma sınırı ve aşama yönetimi" />
      <div className="mx-auto grid max-w-7xl gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(340px,.6fr)] lg:p-8">
        <section className="min-w-0 space-y-4">
          <div className="overflow-x-auto rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex min-w-[680px] items-center justify-between gap-2" aria-label="Sezon aşamaları">
              {["Hazırlık", "Satış", "Kesim", "Teslimat", "Mutabakat", "Arşiv"].map((label, index) => <div key={label} className="flex flex-1 items-center gap-2"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">{index + 1}</span><span className="text-sm font-medium">{label}</span>{index < 5 ? <span className="h-px flex-1 bg-border" /> : null}</div>)}
            </div>
          </div>
          {postgres ? seasons.map((season) => (
            <article key={season.id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div><div className="flex items-center gap-2"><h2 className="text-lg font-semibold">{season.name}</h2><span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-800">{statusLabel(season.status)}</span></div><p className="mt-1 text-sm text-muted-foreground">{season.year ?? "Yıl belirtilmedi"} · {season.locationName ?? "Tüm lokasyonlar"}</p></div>
                <SeasonTransitionButton season={season} />
              </div>
              <p className="mt-4 border-t pt-4 text-sm text-muted-foreground">Durum geçişi yalnız bir sonraki aşamaya yapılır. Arşivlenen sezon görüntülenir fakat yeni müşteri, finans, tedarik veya hayvan hareketi kabul etmez.</p>
            </article>
          )) : <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950"><strong>Legacy uyumluluk modu etkin.</strong><p className="mt-1">Mevcut SQLite akışları korunuyor. Tenant migration tamamlandıktan sonra bu çalışma alanı <code>TENANT_MASTER_DATA_MODE=postgres</code> ile kontrollü olarak açılır.</p></div>}
          {postgres && seasons.length === 0 ? <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">Henüz sezon açılmadı. Sağdaki komut alanından ilk sezonu hazırlık durumunda oluşturun.</div> : null}
        </section>
        {postgres ? <aside className="lg:sticky lg:top-5 lg:self-start"><SeasonCreateForm /></aside> : null}
      </div>
    </AppShell>
  );
}

function statusLabel(status: SeasonStatus) { return ({ preparation: "Hazırlık", sales: "Satış", slaughter: "Kesim", delivery: "Teslimat", reconciliation: "Mutabakat", archived: "Arşiv" } as const)[status]; }
