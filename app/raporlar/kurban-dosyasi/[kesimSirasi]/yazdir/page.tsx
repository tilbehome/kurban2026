/**
 * Tek dana için kurban dosyası A4 yazdırma.
 *
 * URL: /raporlar/kurban-dosyasi/{kesimSirasi}/yazdir
 */

import { notFound, redirect } from "next/navigation";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { kurbanDosyasi } from "@/modules/raporlar/lib/rapor.service";
import { KurbanDosyaYazdirClient } from "@/modules/raporlar/components/KurbanDosyaYazdirClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ kesimSirasi: string }>;
}

export default async function TekKurbanDosyaPage({ params }: PageProps) {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris");
  if (!izinKontrol(oturum, "raporlar.goruntule")) redirect("/");

  const { kesimSirasi } = await params;
  const no = Number.parseInt(kesimSirasi, 10);
  if (!Number.isFinite(no)) notFound();

  const dosya = await kurbanDosyasi(no);
  if (!dosya) notFound();

  return <KurbanDosyaYazdirClient dosyalar={[dosya]} />;
}
