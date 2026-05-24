import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { prisma } from "@/shared/lib/prisma";
import { HisseAtamaPanel } from "./HisseAtamaPanel";

export const dynamic = "force-dynamic";

export default async function HisseAtamaPage() {
  const kurbanlar = await prisma.kurban.findMany({
    orderBy: { kesimSirasi: "asc" },
    include: {
      hisseler: {
        select: { id: true, no: true, musteriId: true, hisseFiyati: true },
        orderBy: { no: "asc" },
      },
    },
  });

  // Sadece en az 1 boş hissesi olan kurbanları gönder
  const aktifKurbanlar = kurbanlar
    .map((k) => ({
      id: k.id,
      kesimSirasi: k.kesimSirasi,
      kupeNo: k.kupeNo,
      hisseSayisi: k.hisseSayisi,
      bosHisseSayisi: k.hisseler.filter((h) => h.musteriId === null).length,
      hisseler: k.hisseler.map((h) => ({
        id: h.id,
        no: h.no,
        dolu: h.musteriId !== null,
        hisseFiyati: h.hisseFiyati,
      })),
    }))
    .filter((k) => k.bosHisseSayisi > 0);

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Hisse Atama"
        altBaslik={`${aktifKurbanlar.length} kurbanda boş hisse var`}
      />
      <div className="p-6 sm:p-8">
        <HisseAtamaPanel kurbanlar={aktifKurbanlar} />
      </div>
    </AppShell>
  );
}
