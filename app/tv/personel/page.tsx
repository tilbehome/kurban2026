import { redirect } from "next/navigation";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { prisma } from "@/shared/lib/prisma";
import { PersonelAnaClient } from "@/modules/tv/components/personel/PersonelAnaClient";
import type { PersonelKurbanData } from "@/modules/tv/components/personel/PersonelKurbanKart";
import type { KurbanKesimDurumu } from "@/modules/tv/lib/asama-akisi";

export const dynamic = "force-dynamic";

/**
 * Personel telefon arayüzü — tek tıkla kurban aşaması ilerletir.
 * Auth gerekir, tv.kontrol izni gerekir.
 */
export default async function TvPersonelPage() {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris");

  if (!izinKontrol(oturum, "tv.kontrol")) {
    return (
      <div className="bg-slate-50 flex min-h-screen items-center justify-center p-8 text-center">
        <div>
          <p className="text-muted-foreground text-sm">
            Personel paneli için TV kontrol yetkiniz gerekiyor.
          </p>
        </div>
      </div>
    );
  }

  // Aktif + sıradaki tüm kurbanları çek
  const kurbanlarRaw = await prisma.kurban.findMany({
    where: {
      silindiMi: false,
      kesimDurumu: {
        in: [
          "vekalet_bekliyor",
          "siradaki",
          "hazirlik",
          "kesimde",
          "deri_yuzme",
          "parcalama",
          "tartimda",
          "paketleme",
        ],
      },
    },
    orderBy: [{ operasyonSira: "asc" }, { kesimSirasi: "asc" }],
    take: 30,
    select: {
      id: true,
      kesimSirasi: true,
      operasyonSira: true,
      kesimDurumu: true,
      asama: true,
      ilerlemeYuzde: true,
      kalanSureDk: true,
    },
  });

  const kurbanlar: PersonelKurbanData[] = kurbanlarRaw.map((k) => ({
    id: k.id,
    kesimSirasi: k.kesimSirasi,
    operasyonSira: k.operasyonSira,
    kesimDurumu: k.kesimDurumu as KurbanKesimDurumu,
    asama: k.asama,
    ilerlemeYuzde: k.ilerlemeYuzde,
    kalanSureDk: k.kalanSureDk,
  }));

  return (
    <PersonelAnaClient
      kullaniciAd={oturum.adSoyad}
      kurbanlar={kurbanlar}
    />
  );
}
