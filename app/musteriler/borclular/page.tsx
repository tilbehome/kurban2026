import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { borclular } from "@/modules/raporlar/lib/rapor.service";
import { formatPara } from "@/shared/lib/para";
import { BorclularClient } from "@/modules/musteriler/components/borclular/BorclularClient";

export const dynamic = "force-dynamic";

export default async function BorclularPage() {
  const liste = await borclular();
  const toplamBorc = liste.reduce((s, b) => s + b.kalan, 0);

  // Tüm etiket setini topla (filtre için)
  const etiketSet = new Set<string>();
  for (const b of liste) {
    for (const e of b.etiketler) etiketSet.add(e);
  }
  const tumEtiketler = Array.from(etiketSet).sort((a, b) =>
    a.localeCompare(b, "tr"),
  );

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Borçlular Listesi"
        altBaslik={`${liste.length} borçlu · Toplam alacak: ${formatPara(toplamBorc)}`}
      />
      <div className="p-4 sm:p-6">
        <BorclularClient borclular={liste} tumEtiketler={tumEtiketler} />
      </div>
    </AppShell>
  );
}
