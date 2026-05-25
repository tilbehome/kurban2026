import { redirect } from "next/navigation";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { TeslimAnaClient } from "@/modules/kesim/components/TeslimAnaClient";

export const dynamic = "force-dynamic";

export default async function TeslimPage() {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris");
  if (!izinKontrol(oturum, "tv.kontrol")) {
    return (
      <AppShell>
        <SayfaBaslik baslik="Teslim Paneli" altBaslik="Yetki yok" />
        <div className="text-muted-foreground p-6 text-sm">
          Bu sayfa için TV kontrol yetkiniz gerekiyor.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Teslim Paneli"
        altBaslik="Paketlenen hisseleri müşteriye teslim et + WhatsApp ile haber"
      />
      <TeslimAnaClient />
    </AppShell>
  );
}
