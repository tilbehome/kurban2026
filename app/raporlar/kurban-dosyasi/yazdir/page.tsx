/**
 * Tüm kurban dosyaları toplu A4 yazdırma.
 *
 * URL: /raporlar/kurban-dosyasi/yazdir
 * Her dana ayrı sayfa (page-break-after).
 */

import { redirect } from "next/navigation";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { tumKurbanDosyalari } from "@/modules/raporlar/lib/rapor.service";
import { KurbanDosyaYazdirClient } from "@/modules/raporlar/components/KurbanDosyaYazdirClient";

export const dynamic = "force-dynamic";

export default async function TopluKurbanDosyaPage() {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris");
  if (!izinKontrol(oturum, "raporlar.goruntule")) redirect("/");

  const dosyalar = await tumKurbanDosyalari();
  return <KurbanDosyaYazdirClient dosyalar={dosyalar} />;
}
