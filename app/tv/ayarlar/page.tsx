import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Tv } from "lucide-react";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { aktifOturum } from "@/shared/lib/session";
import { adminMi } from "@/shared/lib/izinler";
import { prisma } from "@/shared/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { TvAyarYonetimClient } from "@/modules/tv/components/TvAyarYonetimClient";
import type { AyarKisa } from "@/modules/tv/components/TvAyarYonetimClient";

export const dynamic = "force-dynamic";

export default async function TvAyarlarPage() {
  const oturum = await aktifOturum();
  if (!oturum) redirect("/giris");

  if (!adminMi(oturum.rol)) {
    return (
      <AppShell>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">
            TV ayarlarını sadece admin değiştirebilir.
          </p>
        </div>
      </AppShell>
    );
  }

  const ayarlarRaw = await prisma.tvAyari.findMany({
    orderBy: { anahtarKey: "asc" },
  });

  const GECERLI_ANAHTARLAR = new Set([
    "duyuru",
    "sira_hatirlatma",
    "hijyen",
    "whatsapp_tel",
    "lokasyon",
  ]);

  const ayarlar: AyarKisa[] = ayarlarRaw
    .filter((a) => GECERLI_ANAHTARLAR.has(a.anahtarKey))
    .map((a) => ({
      anahtarKey: a.anahtarKey as AyarKisa["anahtarKey"],
      deger: a.deger,
    }));

  return (
    <AppShell>
      <SayfaBaslik
        baslik="TV Ekran Ayarları"
        altBaslik="Alt bilgi şeridi ve genel TV ayarları"
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
              href="/tv/kontrol"
              className={
                buttonVariants({ variant: "ghost", size: "sm" }) + " gap-1.5"
              }
            >
              <ArrowLeft size={14} />
              Kontrol Paneli
            </Link>
          </div>
        }
      />
      <div className="p-4 sm:p-6">
        <TvAyarYonetimClient ilkAyarlar={ayarlar} />
      </div>
    </AppShell>
  );
}
