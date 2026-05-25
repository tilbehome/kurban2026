import Link from "next/link";
import { redirect } from "next/navigation";
import { Tv, ArrowLeft, Settings } from "lucide-react";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { prisma } from "@/shared/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { TvKontrolClient } from "@/modules/tv/components/TvKontrolClient";
import type {
  KesimDurumu,
  Asama,
} from "@/modules/tv/types";
import type { KontrolHisseSatir } from "@/modules/tv/components/TvKontrolClient";

export const dynamic = "force-dynamic";

export default async function TvKontrolPage() {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris");

  if (!izinKontrol(oturum, "tv.kontrol")) {
    return (
      <AppShell>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">
            TV kontrol yetkiniz yok.
          </p>
        </div>
      </AppShell>
    );
  }

  const hisselerRaw = await prisma.hisse.findMany({
    where: { silindiMi: false, musteriId: { not: null } },
    orderBy: [{ kurban: { kesimSirasi: "asc" } }, { no: "asc" }],
    take: 500,
    select: {
      id: true,
      no: true,
      kesimDurumu: true,
      siraNo: true,
      asama: true,
      ilerlemeYuzde: true,
      kalanSureDk: true,
      teslimNoktasi: true,
      kurban: { select: { kesimSirasi: true } },
      musteri: { select: { adSoyad: true } },
    },
  });

  const hisseler: KontrolHisseSatir[] = hisselerRaw.map((h) => ({
    id: h.id,
    hisseEtiket: `#${h.kurban.kesimSirasi}.${h.no}`,
    musteriAdSoyad: h.musteri?.adSoyad ?? null,
    kesimDurumu: h.kesimDurumu as KesimDurumu,
    siraNo: h.siraNo,
    asama: (h.asama as Asama | null) ?? null,
    ilerlemeYuzde: h.ilerlemeYuzde,
    kalanSureDk: h.kalanSureDk,
    teslimNoktasi: h.teslimNoktasi,
  }));

  return (
    <AppShell>
      <SayfaBaslik
        baslik="TV Kontrol Paneli"
        altBaslik={`${hisseler.length} hisse · Durum + sıra + ilerleme yönetimi`}
        aksiyonlar={
          <div className="flex gap-2">
            <Link
              href="/tv"
              target="_blank"
              className={
                buttonVariants({ variant: "outline", size: "sm" }) + " gap-1.5"
              }
            >
              <Tv size={14} />
              TV Ekranı (yeni sekme)
            </Link>
            <Link
              href="/tv/ayarlar"
              className={
                buttonVariants({ variant: "outline", size: "sm" }) + " gap-1.5"
              }
            >
              <Settings size={14} />
              Ayarlar
            </Link>
            <Link
              href="/"
              className={
                buttonVariants({ variant: "ghost", size: "sm" }) + " gap-1.5"
              }
            >
              <ArrowLeft size={14} />
              Ana Sayfa
            </Link>
          </div>
        }
      />
      <div className="p-4 sm:p-6">
        <TvKontrolClient hisseler={hisseler} />
      </div>
    </AppShell>
  );
}
