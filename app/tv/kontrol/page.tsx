import Link from "next/link";
import { redirect } from "next/navigation";
import { Tv, ArrowLeft, Settings, Smartphone } from "lucide-react";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol, adminMi } from "@/shared/lib/izinler";
import { prisma } from "@/shared/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { TvKontrolClient } from "@/modules/tv/components/TvKontrolClient";
import { AcilDurumKart } from "@/modules/tv/components/admin/AcilDurumKart";
import { SiraYonetimKart } from "@/modules/tv/components/admin/SiraYonetimKart";
import type { KurbanKesimDurumu } from "@/modules/tv/lib/asama-akisi";
import type { KontrolKurbanSatir } from "@/modules/tv/components/TvKontrolClient";
import type { SiraSatir } from "@/modules/tv/components/admin/SiraYonetimKart";

export const dynamic = "force-dynamic";

export default async function TvKontrolPage() {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris");

  if (!izinKontrol(oturum, "tv.kontrol")) {
    return (
      <AppShell>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">TV kontrol yetkiniz yok.</p>
        </div>
      </AppShell>
    );
  }

  // KURBAN BAZLI sorgu (SPRINT-9): 63 satır, her satır 1 dana
  const [kurbanlarRaw, sirayaAlinanlarRaw, acilKey, acilMesajKey] =
    await Promise.all([
      prisma.kurban.findMany({
        where: { silindiMi: false },
        orderBy: [{ operasyonSira: "asc" }, { kesimSirasi: "asc" }],
        select: {
          id: true,
          kesimSirasi: true,
          kupeNo: true,
          hisseGrubu: true,
          kesimDurumu: true,
          operasyonSira: true,
          asama: true,
          ilerlemeYuzde: true,
          kalanSureDk: true,
          kesimBaslama: true,
          asamaBaslangic: true,
          hisseler: {
            where: { silindiMi: false },
            select: {
              id: true,
              musteriId: true,
              vekaletAlindi: true,
            },
          },
        },
      }),
      prisma.kurban.findMany({
        where: {
          silindiMi: false,
          kesimDurumu: { in: ["siradaki", "vekalet_bekliyor", "hazirlik"] },
        },
        orderBy: [{ operasyonSira: "asc" }, { kesimSirasi: "asc" }],
        take: 30,
        select: {
          id: true,
          kesimSirasi: true,
          operasyonSira: true,
          kesimDurumu: true,
        },
      }),
      prisma.tvAyari.findUnique({ where: { anahtarKey: "acil_durum_aktif" } }),
      prisma.tvAyari.findUnique({ where: { anahtarKey: "acil_durum_mesaj" } }),
    ]);

  const kurbanlar: KontrolKurbanSatir[] = kurbanlarRaw.map((k) => {
    const doluHisse = k.hisseler.filter((h) => h.musteriId).length;
    const vekaletAlinan = k.hisseler.filter((h) => h.vekaletAlindi).length;
    return {
      id: k.id,
      kesimSirasi: k.kesimSirasi,
      kupeNo: k.kupeNo ?? null,
      hisseGrubu: k.hisseGrubu ?? null,
      kesimDurumu: k.kesimDurumu as KurbanKesimDurumu,
      operasyonSira: k.operasyonSira ?? null,
      asama: k.asama ?? null,
      ilerlemeYuzde: k.ilerlemeYuzde,
      kalanSureDk: k.kalanSureDk,
      kesimBaslama: k.kesimBaslama?.toISOString() ?? null,
      asamaBaslangic: k.asamaBaslangic?.toISOString() ?? null,
      hisseDolu: doluHisse,
      hisseToplam: k.hisseler.length,
      vekaletAlinan,
    };
  });

  const siraSatirlar: SiraSatir[] = sirayaAlinanlarRaw.map((k, i) => ({
    id: k.id,
    kesimSirasi: k.kesimSirasi,
    operasyonSira: k.operasyonSira ?? i + 1,
    kesimDurumu: k.kesimDurumu,
  }));

  const acilDurumAktif = acilKey?.deger === "true";
  const acilDurumMesaj = acilMesajKey?.deger ?? null;
  const adminMiResult = adminMi(oturum.rol);

  return (
    <AppShell>
      <SayfaBaslik
        baslik="TV Kontrol Paneli"
        altBaslik={`${kurbanlar.length} kurban · ${siraSatirlar.length} sıradaki`}
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
              TV (yeni sekme)
            </Link>
            <Link
              href="/tv/personel"
              target="_blank"
              className={
                buttonVariants({ variant: "outline", size: "sm" }) + " gap-1.5"
              }
            >
              <Smartphone size={14} />
              Personel Paneli
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
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        {adminMiResult && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AcilDurumKart
              ilkAktif={acilDurumAktif}
              ilkMesaj={acilDurumMesaj}
            />
            <SiraYonetimKart ilkSira={siraSatirlar} />
          </div>
        )}

        <TvKontrolClient kurbanlar={kurbanlar} />

        {adminMiResult && (
          <div className="mt-2 flex flex-col gap-2 rounded-xl border border-stone-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                TV Canlı Önizleme
              </h3>
              <Link
                href="/tv"
                target="_blank"
                className="text-xs text-orange-600 underline"
              >
                Tam ekran aç →
              </Link>
            </div>
            <div className="aspect-video w-full overflow-hidden rounded-lg border border-stone-200">
              <iframe
                src="/tv"
                title="TV Canlı Önizleme"
                className="h-full w-full"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
