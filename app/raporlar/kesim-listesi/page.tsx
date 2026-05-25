import { redirect } from "next/navigation";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { prisma } from "@/shared/lib/prisma";
import { KesimListesiClient } from "@/modules/raporlar/components/KesimListesiClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kurban Kesim Listesi · Ada Bereket Hayvancılık",
};

export default async function KesimListesiPage() {
  const oturum = await aktifOturum();
  if (!oturum) {
    redirect("/giris?next=/raporlar/kesim-listesi");
  }
  if (!izinKontrol(oturum, "raporlar.goruntule")) {
    redirect("/giris?next=/raporlar/kesim-listesi");
  }

  const kurbanlar = await prisma.kurban.findMany({
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
