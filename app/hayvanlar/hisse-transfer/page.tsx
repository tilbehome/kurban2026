/**
 * Hisse Transfer — mevcut hissedardan yeni hissedara devir.
 *
 * Sebep: Bayram günü "İSİMSİZ HİSSEDAR DANA-X H2" gibi placeholder
 * kayıtların gerçek hissedara devri. Ödeme geçmişi korunur (hisseId
 * sabit kalır, sadece musteriId güncellenir).
 */

import { redirect } from "next/navigation";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { HisseTransferClient } from "@/modules/hayvanlar/components/HisseTransferClient";

export const dynamic = "force-dynamic";

export default async function HisseTransferPage() {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris?next=/hayvanlar/hisse-transfer");
  if (!izinKontrol(oturum, "hisseler.transfer")) {
    redirect("/hayvanlar");
  }

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Hisse Transfer"
        altBaslik="Hisseyi başka hissedara devret — ödeme geçmişi korunur"
      />
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <HisseTransferClient />
      </div>
    </AppShell>
  );
}
