import Link from "next/link";
import { ArrowLeft, CircleDollarSign, HeartPulse, History, Scale, Tag } from "lucide-react";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { buttonVariants } from "@/components/ui/button";
import type { AnimalDetail } from "@/packages/tenant-core/src";
import { AnimalHistoryForms } from "./MasterDataForms";
import type { ReactNode } from "react";

export function TenantAnimalDetailView({ animal }: { animal: AnimalDetail }) {
  return (
    <AppShell>
      <SayfaBaslik baslik={`Küpe ${animal.earTag}`} altBaslik={`${animal.supplierName ?? "Tedarikçi belirtilmedi"} · ${animal.status}`} aksiyonlar={<Link href="/hayvanlar" className={buttonVariants({ variant: "outline" })}><ArrowLeft size={16} /> Hayvanlar</Link>} />
      <div className="mx-auto grid max-w-7xl gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(340px,.75fr)] lg:p-8">
        <div className="min-w-0 space-y-5">
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Fact icon={<Tag size={17} />} label="Kurban / sıra" value={`${animal.qurbanNo ?? "—"} / ${animal.queueNo ?? "—"}`} />
            <Fact icon={<CircleDollarSign size={17} />} label="Gerçek alış" value={animal.purchaseAmount ? `${Number(animal.purchaseAmount).toLocaleString("tr-TR")} ₺` : "—"} />
            <Fact icon={<Scale size={17} />} label="Son canlı kilo" value={animal.liveWeightKg ? `${animal.liveWeightKg} kg` : "—"} />
            <Fact icon={<HeartPulse size={17} />} label="Dinî uygunluk" value={animal.qurbanEligibility === "undecided" ? "Karar bekliyor" : animal.qurbanEligibility} />
          </section>
          <Timeline title="Kilo geçmişi" empty="Henüz tartım kaydı yok." rows={animal.weights.map((item) => ({ id: item.id, title: `${item.weightKg} kg · ${item.kind}`, meta: new Date(item.measuredAt).toLocaleString("tr-TR"), detail: item.note }))} />
          <Timeline title="Sağlık geçmişi" empty="Henüz sağlık olayı yok." rows={animal.healthEvents.map((item) => ({ id: item.id, title: `${item.eventType} · ${item.status}`, meta: new Date(item.occurredAt).toLocaleString("tr-TR"), detail: item.notes }))} />
          <Timeline title="Kurban ve sıra geçmişi" empty="Henüz sıra ataması yok." rows={animal.assignments.map((item) => ({ id: item.id, title: `Kurban ${item.qurbanNo ?? "—"} · sıra ${item.queueNo ?? "—"}${item.active ? " · aktif" : ""}`, meta: new Date(item.assignedAt).toLocaleString("tr-TR"), detail: item.reason }))} />
        </div>
        <aside className="lg:sticky lg:top-5 lg:self-start"><AnimalHistoryForms animal={animal} /></aside>
      </div>
    </AppShell>
  );
}

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <div className="rounded-2xl border bg-card p-4 shadow-sm"><span className="mb-3 flex size-8 items-center justify-center rounded-lg bg-orange-100 text-orange-700">{icon}</span><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>; }
function Timeline({ title, empty, rows }: { title: string; empty: string; rows: Array<{ id: string; title: string; meta: string; detail?: string }> }) { return <section className="overflow-hidden rounded-2xl border bg-card shadow-sm"><div className="flex items-center gap-2 border-b p-4"><History size={17} className="text-orange-600" /><h2 className="font-semibold">{title}</h2></div><div className="divide-y">{rows.map((row) => <article key={row.id} className="p-4"><div className="flex flex-col justify-between gap-1 sm:flex-row"><strong className="text-sm">{row.title}</strong><time className="text-xs text-muted-foreground">{row.meta}</time></div>{row.detail ? <p className="mt-2 text-sm text-muted-foreground">{row.detail}</p> : null}</article>)}{rows.length === 0 ? <p className="p-5 text-sm text-muted-foreground">{empty}</p> : null}</div></section>; }
