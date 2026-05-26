import { redirect } from "next/navigation";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { prisma } from "@/shared/lib/prisma";
import { KesimListesiClient } from "@/modules/raporlar/components/KesimListesiClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kurban Kesim Listesi · Ada Bereket Hayvancılık",
};

type OdemeFiltre = "tumu" | "borclular" | "odenmis";
type TeslimFiltre = "tumu" | "teslim_edilmedi" | "teslim_edildi";

interface PageProps {
  searchParams: Promise<{ odeme?: string; teslim?: string }>;
}

/**
 * A4 yazdırılabilir kesim listesi. Filtre sayfasından gelen ?odeme & ?teslim
 * querystring'leri kurban (dana) bazlı filtreleme yapar — bir dana
 * filtreyi sağlıyorsa tüm hissedarlarıyla listede yer alır.
 */
export default async function KesimListesiPage({ searchParams }: PageProps) {
  const oturum = await aktifOturum();
  if (!oturum) {
    redirect("/giris?next=/raporlar/kesim-listesi");
  }
  if (!izinKontrol(oturum, "raporlar.goruntule")) {
    redirect("/giris?next=/raporlar/kesim-listesi");
  }

  const params = await searchParams;
  const odemeFiltre = normalizeOdeme(params.odeme);
  const teslimFiltre = normalizeTeslim(params.teslim);

  const tumKurbanlar = await prisma.kurban.findMany({
    where: { silindiMi: false },
    select: {
      id: true,
      kesimSirasi: true,
      kupeNo: true,
      hisseGrubu: true,
      satisBedeli: true,
      hisseler: {
        where: { silindiMi: false },
        select: {
          id: true,
          no: true,
          hisseFiyati: true,
          vekaletAlindi: true,
          paketDurumu: true,
          musteriId: true,
          musteri: {
            select: { adSoyad: true, telefon: true },
          },
          odemeler: {
            where: { iptal: false, silindiMi: false },
            select: { toplamTutar: true },
          },
        },
        orderBy: { no: "asc" },
      },
    },
    orderBy: { kesimSirasi: "asc" },
  });

  // SPRINT-KESİM-FİLTRE: kurban bazlı filtreleme — herhangi bir hisse
  // filtreyi sağlıyorsa kurban tüm hissedarlarıyla listede.
  const kurbanlar = tumKurbanlar.filter((k) => {
    const atanmis = k.hisseler.filter((h) => h.musteriId !== null);
    if (atanmis.length === 0) return false;

    if (odemeFiltre !== "tumu") {
      const borcluVarMi = atanmis.some((h) => {
        const odenen = h.odemeler.reduce((s, o) => s + o.toplamTutar, 0);
        return h.hisseFiyati - odenen > 0.01;
      });
      if (odemeFiltre === "borclular" && !borcluVarMi) return false;
      if (odemeFiltre === "odenmis" && borcluVarMi) return false;
    }

    if (teslimFiltre !== "tumu") {
      const teslimEdilmemisVarMi = atanmis.some(
        (h) => h.paketDurumu !== "Teslim Edildi",
      );
      if (teslimFiltre === "teslim_edilmedi" && !teslimEdilmemisVarMi)
        return false;
      if (teslimFiltre === "teslim_edildi" && teslimEdilmemisVarMi)
        return false;
    }

    return true;
  });

  const firmaAyari = await prisma.ayar.findUnique({
    where: { anahtar: "firma_adi" },
  });
  const firmaAdi = firmaAyari?.deger || "Ada Bereket Hayvancılık";

  const webAyari = await prisma.ayar.findUnique({
    where: { anahtar: "firma_web" },
  });
  const firmaWeb = webAyari?.deger || "adaberekethayvancilik.com.tr";

  return (
    <KesimListesiClient
      kurbanlar={kurbanlar}
      firmaAdi={firmaAdi}
      firmaWeb={firmaWeb}
    />
  );
}

function normalizeOdeme(v: string | undefined): OdemeFiltre {
  if (v === "borclular" || v === "odenmis") return v;
  return "tumu";
}

function normalizeTeslim(v: string | undefined): TeslimFiltre {
  if (v === "teslim_edilmedi" || v === "teslim_edildi") return v;
  return "tumu";
}
