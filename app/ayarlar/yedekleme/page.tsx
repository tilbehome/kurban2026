import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { yedekleriListele } from "@/shared/lib/backup";
import { aktifOturum } from "@/shared/lib/session";
import { adminMi } from "@/shared/lib/izinler";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { YedekActions } from "./YedekActions";
import { YedekListesi } from "./YedekListesi";
import { TehlikeliIslemler } from "./TehlikeliIslemler";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Yedekleme yönetim sayfası — SPRINT-YEDEK-V2 + SPRINT-SIFIRLA-V1.
 *  - Normal yedek + etiketli "yedek noktası" (YedekActions)
 *  - Yedek listesi: yükle/indir/zip/sil (YedekListesi)
 *  - Sadece admin'e: TehlikeliIslemler (tüm veriyi sıfırla)
 */
export default async function YedeklemePage() {
  const oturum = await aktifOturum();
  const adminGoster = oturum ? adminMi(oturum.rol) : false;

  const yedekler = yedekleriListele().map((y) => ({
    dosyaAdi: y.dosyaAdi,
    tarih: y.tarih.toISOString(),
    boyutKB: y.boyutKB,
  }));

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Yedekleme"
        altBaslik="Veritabanı yedeklerini yönet · USB / restore noktası / yükleme"
        aksiyonlar={
          <Link
            href="/ayarlar"
            className={buttonVariants({ variant: "outline" })}
          >
            <ArrowLeft size={16} className="mr-1" />
            Ayarlara Dön
          </Link>
        }
      />
      <div className="space-y-6 p-6 sm:p-8">
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Yedek Al</CardTitle>
            <CardDescription>
              Veritabanını <code>backups/</code> klasörüne yedekle. Önemli
              anlar (bayram başlangıcı, gün sonu) için etiketli yedek
              noktası oluştur — rotasyondan korunur.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <YedekActions />
          </CardContent>
        </Card>

        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Mevcut Yedekler ({yedekler.length})</CardTitle>
            <CardDescription>
              30 günden eski normal yedekler otomatik silinir. Yedek
              noktaları manuel silinene kadar kalır.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {yedekler.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Henüz yedek alınmamış.
              </p>
            ) : (
              <YedekListesi yedekler={yedekler} />
            )}
          </CardContent>
        </Card>

        {/* SPRINT-SIFIRLA-V1: tehlikeli işlemler — sadece admin */}
        {adminGoster && (
          <div className="max-w-3xl">
            <TehlikeliIslemler />
          </div>
        )}
      </div>
    </AppShell>
  );
}
