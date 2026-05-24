import { redirect } from "next/navigation";
import { AppShell } from "@/shared/components/AppShell";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol, adminMi } from "@/shared/lib/izinler";
import {
  stableGridVerisi,
  eksikHisseliMusteriler,
  atamaIstatistik,
} from "@/modules/hayvanlar/lib/hisse-atama.service";
import { HisseAtamaClient } from "@/modules/hayvanlar/components/hisse-atama/HisseAtamaClient";

export const dynamic = "force-dynamic";

export default async function HisseAtamaPage() {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris");

  if (!izinKontrol(oturum, "hayvanlar.goruntule")) {
    return (
      <AppShell>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">
            Hisse görüntüleme yetkiniz yok.
          </p>
        </div>
      </AppShell>
    );
  }

  // Paralel veri çekme
  const [kurbanlar, musteriler, istatistik] = await Promise.all([
    stableGridVerisi(),
    eksikHisseliMusteriler(),
    atamaIstatistik(),
  ]);

  const yetkiler = {
    atamaYap: izinKontrol(oturum, "hisseler.ata"),
    iptal: izinKontrol(oturum, "hisseler.iptal"),
    transfer: izinKontrol(oturum, "hisseler.transfer") || adminMi(oturum.rol),
  };

  return (
    <AppShell>
      <div className="p-4 sm:p-6">
        <HisseAtamaClient
          ilkKurbanlar={kurbanlar}
          ilkMusteriler={musteriler}
          ilkIstatistik={istatistik}
          yetkiler={yetkiler}
        />
      </div>
    </AppShell>
  );
}
