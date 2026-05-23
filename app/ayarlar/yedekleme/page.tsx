import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { yedekleriListele } from "@/shared/lib/backup";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTarihSaat } from "@/shared/lib/tarih";
import { YedekActions } from "./YedekActions";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function YedeklemePage() {
  const yedekler = yedekleriListele();

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Yedekleme"
        altBaslik="Veritabanı yedeklerini yönet"
        aksiyonlar={
          <Link href="/ayarlar" className={buttonVariants({ variant: "outline" })}>
            <ArrowLeft size={16} className="mr-1" />
            Ayarlara Dön
          </Link>
        }
      />
      <div className="space-y-6 p-6 sm:p-8">
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Manuel Yedek Al</CardTitle>
            <CardDescription>
              Mevcut veritabanını <code>backups/</code> klasörüne kopyalar.
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
              30 günden eski yedekler otomatik silinir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {yedekler.length === 0 ? (
              <p className="text-muted-foreground text-sm">Henüz yedek alınmamış.</p>
            ) : (
              <div className="flex flex-col divide-y rounded-md border">
                {yedekler.map((y) => (
                  <div
                    key={y.dosyaAdi}
                    className="flex items-center justify-between px-3 py-2"
                  >
                    <div className="flex flex-col">
                      <span className="font-mono text-sm">{y.dosyaAdi}</span>
                      <span className="text-muted-foreground text-xs">
                        {formatTarihSaat(y.tarih)} · {y.boyutKB} KB
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
