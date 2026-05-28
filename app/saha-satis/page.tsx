/**
 * Saha Satış Sihirbazı — mobil-first 5 adımlı akış.
 *
 * Müşteri → Kurban+Hisse → Fiyat → Kapora → Tamamla
 *
 * Tüm endpoint'ler mevcut: POST /api/musteriler, POST /api/hisseler/ata,
 * POST /api/tahsilat/odeme. Schema dokunulmaz.
 */

import { redirect } from "next/navigation";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { SahaSatisSihirbazi } from "@/modules/tahsilat/components/SahaSatisSihirbazi";

export const dynamic = "force-dynamic";

export default async function SahaSatisPage() {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris?next=/saha-satis");
  // Aynı izin atama endpoint'iyle: hisseler.ata
  if (!izinKontrol(oturum, "hisseler.ata")) {
    redirect("/");
  }

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Saha Satış"
        altBaslik="Müşteri → Kurban → Fiyat → Kapora → Tamamla"
      />
      <div className="mx-auto max-w-2xl p-4 sm:p-6">
        <SahaSatisSihirbazi />
      </div>
    </AppShell>
  );
}
