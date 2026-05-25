import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { kurbanlariListele } from "@/modules/hayvanlar/lib/kurban.service";
import { HayvanlarGaleri } from "@/modules/hayvanlar/components/galeri/HayvanlarGaleri";

export const dynamic = "force-dynamic";

export default async function HayvanlarPage() {
  const kurbanlar = await kurbanlariListele();

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Hayvanlar"
        altBaslik={`${kurbanlar.length} kurban kayıtlı`}
      />
      <div className="p-6 sm:p-8">
        <HayvanlarGaleri kurbanlar={kurbanlar} />
      </div>
    </AppShell>
  );
}
