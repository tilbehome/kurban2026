import Link from "next/link";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/shared/components/AppShell";
import { aktifOturum } from "@/shared/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  bugunkuOzet,
  bugunkuTahsilatlar,
} from "@/modules/tahsilat/lib/tahsilat.service";
import { borclular } from "@/modules/raporlar/lib/rapor.service";
import { MENU, menuyuFiltrele } from "@/shared/components/menu.config";
import { formatPara } from "@/shared/lib/para";
import { formatTarih } from "@/shared/lib/tarih";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const oturum = await aktifOturum();
  const rol = oturum?.rol ?? "misafir";
  const menu = menuyuFiltrele(MENU, rol).filter((m) => m.children && m.label !== "Dashboard");

  const [ozet, borc, sonTahsilatlar] = await Promise.all([
    bugunkuOzet(),
    borclular(),
    bugunkuTahsilatlar(),
  ]);

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

        <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Son Tahsilatlar</span>
                <Link
                  href="/tahsilat/bugun"
                  className="text-muted-foreground text-xs font-normal hover:underline"
                >
                  Hepsini gör →
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {sonTahsilatlar.length === 0 ? (
                <p className="text-muted-foreground px-6 pb-6 text-sm">
                  Bugün henüz tahsilat yok.
                </p>
              ) : (
                <div className="divide-y text-sm">
                  {sonTahsilatlar.slice(0, 6).map((s) => (
                    <div
                      key={s.id}
                      className={`flex items-center justify-between gap-2 px-4 py-2.5 ${
                        s.iptal ? "opacity-60 line-through" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-tabular text-muted-foreground text-xs">
                          {s.saat}
                        </span>
                        <span className="font-medium">{s.musteriAdi}</span>
                        <span className="text-muted-foreground font-mono text-xs">
                          {s.kurban}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {s.yontem}
                        </Badge>
                        <span className="font-tabular font-semibold">
                          {formatPara(s.toplam)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Yüksek Borçlular</span>
                <Link
                  href="/musteriler/borclular"
                  className="text-muted-foreground text-xs font-normal hover:underline"
                >
                  Hepsi →
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {borc.length === 0 ? (
                <p className="text-muted-foreground px-6 pb-6 text-sm">
                  Borçlu yok 🎉
                </p>
              ) : (
                <div className="divide-y text-sm">
                  {borc.slice(0, 5).map((b) => (
                    <Link
                      key={b.musteriId}
                      href={`/tahsilat/musteri/${b.musteriId}`}
                      className="hover:bg-muted/30 flex items-center justify-between px-4 py-2.5"
                    >
                      <span className="truncate font-medium">{b.adSoyad}</span>
                      <span className="font-tabular ml-2 shrink-0 font-semibold text-amber-600">
                        {formatPara(b.kalan)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Hızlı Erişim</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {menu.map((m) => {
              const Icon =
                (Icons as unknown as Record<string, LucideIcon | undefined>)[m.ikon] ??
                Icons.Square;
              const ilkAlt = m.children?.[0];
              return (
                <Link
                  key={m.label}
                  href={ilkAlt?.href ?? "/"}
                  className={buttonVariants({
                    variant: "outline",
                  }) + " h-auto flex-col gap-2 py-4"}
                >
                  <Icon size={20} className="text-primary" />
                  <span className="text-xs font-medium">{m.label}</span>
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
                  Tahsilat sayfasında müşteri arama
                </li>
                <li>
                  • Sol menüde tıkladığınız grup açılır/kapanır, son durum kayıtlı
                </li>
                <li>
                  • Tahsilat alındığında otomatik DB yedeği <code>backups/</code>{" "}
                  klasörüne yazılır
                </li>
                <li>
                  • LAN üzerinden bağlanmak için telefonda{" "}
                  <code>http://[bilgisayar-IP]:3000</code> kullan
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
