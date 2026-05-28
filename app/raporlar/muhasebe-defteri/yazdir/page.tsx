/**
 * Master Muhasebe Denetim Defteri — A4 yazdırma sayfası.
 *
 * Server query → MuhasebeDefteriYazdirClient.
 * Otomatik tutarsızlık kontrolleri rapor.service.ts'de yapılır.
 */

import { redirect } from "next/navigation";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { muhasebeDefteri } from "@/modules/raporlar/lib/rapor.service";
import { MuhasebeDefteriYazdirClient } from "./MuhasebeDefteriYazdirClient";

export const dynamic = "force-dynamic";

export default async function MuhasebeDefteriYazdirPage() {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris?next=/raporlar/muhasebe-defteri/yazdir");
  if (!izinKontrol(oturum, "raporlar.goruntule")) redirect("/");

  const defter = await muhasebeDefteri();
  return <MuhasebeDefteriYazdirClient defter={defter} />;
}
