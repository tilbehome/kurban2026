/**
 * Kesim sırası detaylı muhasebe raporu sayfası.
 *
 * Server query → KesimMuhasebeClient. Yazdırma için ayrı sayfa
 * (/raporlar/kesim-muhasebe/yazdir).
 */

import { redirect } from "next/navigation";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { kesimMuhasebeRaporu } from "@/modules/raporlar/lib/rapor.service";
import { KesimMuhasebeClient } from "@/modules/raporlar/components/KesimMuhasebeClient";

export const dynamic = "force-dynamic";

export default async function KesimMuhasebePage() {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris?next=/raporlar/kesim-muhasebe");
  if (!izinKontrol(oturum, "raporlar.goruntule")) redirect("/");

  const veri = await kesimMuhasebeRaporu();

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Kesim Sırası Muhasebe Raporu"
        altBaslik={`${veri.length} kurban · detaylı ödeme dökümü`}
      />
      <div className="p-4 sm:p-6">
        <KesimMuhasebeClient veri={veri} />
      </div>
    </AppShell>
  );
}
