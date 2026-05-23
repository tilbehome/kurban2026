import Link from "next/link";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/shared/components/AppShell";
import { sidebarModulleri } from "@/shared/lib/module-loader";
import { aktifOturum } from "@/shared/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { bugunkuOzet } from "@/modules/tahsilat/lib/tahsilat.service";
import { borclular } from "@/modules/raporlar/lib/rapor.service";
import { formatPara } from "@/shared/lib/para";
import { formatTarih } from "@/shared/lib/tarih";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const oturum = await aktifOturum();
  const moduller = sidebarModulleri(oturum?.rol);

  const [ozet, borc] = await Promise.all([bugunkuOzet(), borclular()]);

  const toplamAlacak = borc.reduce((s, b) => s + b.kalan, 0);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl p-6 md:p-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Hoş geldiniz, {oturum?.adSoyad ?? "Misafir"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Tilbe Kurban — Bayram 2026 yönetim paneli · {formatTarih(new Date())}
          </p>
        </header>

        <section className="mb-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-muted-foreground text-xs font-medium">
                  Bugünkü Tahsilat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-tilbe font-tabular text-2xl font-bold">
                  {formatPara(ozet.toplam)}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {ozet.islemSayisi} işlem
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-muted-foreground text-xs font-medium">
                  Nakit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-tabular text-2xl font-bold text-green-600">
                  {formatPara(ozet.nakit)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-muted-foreground text-xs font-medium">
                  Havale + Kart
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-tabular text-2xl font-bold text-blue-600">
                  {formatPara(ozet.havale + ozet.kart)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-amber-300">
              <CardHeader>
                <CardTitle className="text-muted-foreground text-xs font-medium">
                  Bekleyen Alacak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-tabular text-2xl font-bold text-amber-600">
                  {formatPara(toplamAlacak)}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {borc.length} borçlu
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Modüller</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {moduller.map((modul) => {
              const Icon =
                (Icons as unknown as Record<string, LucideIcon | undefined>)[modul.ikon] ??
                Icons.Square;
              return (
                <Link key={modul.id} href={modul.anaRota} className="group">
                  <Card className="hover:border-primary transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center gap-3">
                      <div className="bg-primary/10 text-primary flex h-11 w-11 items-center justify-center rounded-lg">
                        <Icon size={22} />
                      </div>
                      <CardTitle className="text-base">{modul.ad}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm">{modul.aciklama}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-10">
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <h3 className="mb-2 text-sm font-semibold">💡 Hızlı İpuçları</h3>
              <ul className="text-muted-foreground space-y-1 text-sm">
                <li>
                  •{" "}
                  <kbd className="bg-background rounded border px-1.5 py-0.5 text-xs">
                    Ctrl+K
                  </kbd>{" "}
                  ile her yerden müşteri ara
                </li>
                <li>
                  • Tahsilat alındığında otomatik DB yedeği <code>backups/</code>{" "}
                  klasörüne yazılır
                </li>
                <li>
                  • LAN üzerinden bağlanmak için telefonda{" "}
                  <code>http://[bilgisayar-IP]:3000</code> kullan
                </li>
                <li>
                  • Bayram günü ek olarak <code>prisma/tilbe.db</code> dosyasını
                  USB'ye kopyalayın
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
