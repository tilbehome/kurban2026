import { redirect } from "next/navigation";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { prisma } from "@/shared/lib/prisma";
import { AppShell } from "@/shared/components/AppShell";
import { KesimListesiFiltreClient } from "@/modules/raporlar/components/KesimListesiFiltreClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kesim Listesi · Filtrele",
};

/**
 * Kesim listesi yazdırma öncesi filtre seçim sayfası.
 *
 * Tüm kurbanların hisse + ödeme + teslim özeti server-side hesaplanır;
 * client side'da filtre değişimine göre canlı sayım yapılır. "Yazdır"
 * basıldığında /raporlar/kesim-listesi?odeme=...&teslim=... ile mevcut
 * A4 yazdırma sayfasına gidilir.
 */
export default async function KesimListesiFiltrePage() {
  const oturum = await aktifOturum();
  if (!oturum) {
    redirect("/giris?next=/raporlar/kesim-listesi/filtre");
  }
  if (!izinKontrol(oturum, "raporlar.goruntule")) {
    redirect("/giris?next=/raporlar/kesim-listesi/filtre");
  }

  const kurbanlar = await prisma.kurban.findMany({
    where: { silindiMi: false },
    select: {
      id: true,
      kesimSirasi: true,
      kupeNo: true,
      hisseler: {
        where: { silindiMi: false },
        select: {
          hisseFiyati: true,
          paketDurumu: true,
          musteriId: true,
          odemeler: {
            where: { iptal: false, silindiMi: false },
            select: { toplamTutar: true },
          },
        },
      },
    },
    orderBy: { kesimSirasi: "asc" },
  });

  const ozet = kurbanlar.map((k) => {
    let toplamBedel = 0;
    let toplamOdenen = 0;
    let borcluHisseSayisi = 0;
    let teslimEdilmemisHisseSayisi = 0;
    let atanmisHisseSayisi = 0;

    for (const h of k.hisseler) {
      if (h.musteriId === null) continue;
      atanmisHisseSayisi++;
      toplamBedel += h.hisseFiyati;
      const odenen = h.odemeler.reduce((s, o) => s + o.toplamTutar, 0);
      toplamOdenen += odenen;
      if (h.hisseFiyati - odenen > 0.01) borcluHisseSayisi++;
      if (h.paketDurumu !== "Teslim Edildi") teslimEdilmemisHisseSayisi++;
    }

    return {
      id: k.id,
      kesimSirasi: k.kesimSirasi,
      kupeNo: k.kupeNo,
      atanmisHisseSayisi,
      borcluHisseSayisi,
      teslimEdilmemisHisseSayisi,
      toplamBedel: Math.round(toplamBedel * 100) / 100,
      toplamOdenen: Math.round(toplamOdenen * 100) / 100,
      toplamBorc: Math.round((toplamBedel - toplamOdenen) * 100) / 100,
    };
  });

  return (
    <AppShell>
      <KesimListesiFiltreClient ozet={ozet} />
    </AppShell>
  );
}
