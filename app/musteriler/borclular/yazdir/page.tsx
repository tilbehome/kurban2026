/**
 * Borçlular yazdırma sayfası — SPRINT 12.
 *
 * 3 profil:
 *   - saha: Sahaya çıkış için telefonlu, öncelik skoru sıralı
 *   - telefon: Tüm telefonlular, alfabetik (telefon araması)
 *   - kapi: Telefonsuzlar, alfabetik (kapı kapı ziyaret)
 *
 * A4 portre, sayfa başına 30 kişi, renk kodlu satırlar.
 * Sayfa açılır açılmaz window.print() tetiklenir.
 */

import { redirect } from "next/navigation";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { borclular } from "@/modules/raporlar/lib/rapor.service";
import { BorclularYazdirClient } from "./BorclularYazdirClient";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    profil?: "saha" | "telefon" | "kapi";
  }>;
}

export default async function BorclularYazdirPage({ searchParams }: PageProps) {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris");
  if (!izinKontrol(oturum, "raporlar.goruntule")) {
    redirect("/musteriler/borclular");
  }

  const sp = await searchParams;
  const profil: "saha" | "telefon" | "kapi" = sp.profil ?? "saha";

  const liste = await borclular();

  return <BorclularYazdirClient liste={liste} profil={profil} />;
}
