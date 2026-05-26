import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { yedekleriListele } from "@/shared/lib/backup";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { YedekActions } from "./YedekActions";
import { YedekListesi } from "./YedekListesi";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Yedekleme yönetim sayfası — SPRINT-YEDEK-V2 sonrası tam interaktif.
 *  - Normal yedek + etiketli "yedek noktası" oluşturma (YedekActions)
 *  - Yedek listesi: yükle/indir/zip/sil aksiyonları (YedekListesi)
 *  - Yedek noktaları üstte ayrı amber bantta, rotasyondan korumalı
 */
export default async function YedeklemePage() {
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
      </div>
    </AppShell>
  );
}
