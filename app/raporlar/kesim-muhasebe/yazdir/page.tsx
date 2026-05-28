/**
 * Kesim muhasebe raporu A4 yazdırma sayfası.
 *
 * Tüm kurbanlar tek tek detaylı dökümlü, her kurban kendi bloğunda
 * sayfa kesilmeden basılır (`page-break-inside: avoid`).
 */

import { redirect } from "next/navigation";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { kesimMuhasebeRaporu } from "@/modules/raporlar/lib/rapor.service";
import { KesimMuhasebeYazdirClient } from "./KesimMuhasebeYazdirClient";

export const dynamic = "force-dynamic";

export default async function KesimMuhasebeYazdirPage() {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris?next=/raporlar/kesim-muhasebe/yazdir");
  if (!izinKontrol(oturum, "raporlar.goruntule")) redirect("/");

  const veri = await kesimMuhasebeRaporu();
  return <KesimMuhasebeYazdirClient veri={veri} />;
}
