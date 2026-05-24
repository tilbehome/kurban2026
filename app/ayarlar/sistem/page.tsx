import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/shared/lib/prisma";
import { yedekleriListele } from "@/shared/lib/backup";
import { formatTarihSaat } from "@/shared/lib/tarih";
import { Activity, Database, Server, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SistemBilgisiPage() {
  const [musteriCount, kurbanCount, hisseCount, odemeCount, kullaniciCount] =
    await Promise.all([
      prisma.musteri.count(),
      prisma.kurban.count(),
      prisma.hisse.count(),
      prisma.odeme.count({ where: { iptal: false } }),
      prisma.kullanici.count({ where: { aktif: true } }),
    ]);

  const yedekler = yedekleriListele();
  const sonYedek = yedekler[0];

  const sistemBilgi = {
    "Node Versiyonu": process.version,
    "Platform": process.platform,
    "Çalışma Süresi":
      Math.floor(process.uptime() / 3600) + " saat " +
      Math.floor((process.uptime() % 3600) / 60) + " dk",
    "Ortam": process.env.NODE_ENV ?? "development",
  };

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Sistem Bilgisi"
        altBaslik="Veritabanı sayıları, sunucu bilgileri, yedek durumu"
      />

      <div className="grid grid-cols-2 gap-4 p-6 sm:p-8 lg:grid-cols-4">
        <SistemKart ikon={<Users size={20} />} ad="Aktif Kullanıcı" deger={kullaniciCount} />
        <SistemKart ikon={<Activity size={20} />} ad="Müşteri" deger={musteriCount} />
        <SistemKart ikon={<Server size={20} />} ad="Kurban" deger={kurbanCount} />
        <SistemKart ikon={<Database size={20} />} ad="Hisse" deger={hisseCount} />
      </div>

      <div className="grid grid-cols-1 gap-4 px-6 pb-8 sm:px-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Veritabanı Sayaçları</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Aktif Müşteri</dt>
                <dd className="font-semibold">{musteriCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Kurban (Hayvan)</dt>
                <dd className="font-semibold">{kurbanCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Hisse</dt>
                <dd className="font-semibold">{hisseCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Geçerli Ödeme</dt>
                <dd className="font-semibold">{odemeCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Aktif Kullanıcı</dt>
                <dd className="font-semibold">{kullaniciCount}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sistem</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              {Object.entries(sistemBilgi).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-mono">{v}</dd>
                </div>
              ))}
              <div className="flex justify-between border-t pt-2">
                <dt className="text-muted-foreground">Son Yedek</dt>
                <dd className="font-mono text-xs">
                  {sonYedek
                    ? `${formatTarihSaat(sonYedek.tarih)} (${sonYedek.boyutKB} KB)`
                    : "Yedek yok"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Toplam Yedek</dt>
                <dd className="font-semibold">{yedekler.length}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function SistemKart({
  ikon,
  ad,
  deger,
}: {
  ikon: React.ReactNode;
  ad: string;
  deger: number;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="text-primary mb-1 flex items-center gap-2">
          {ikon}
          <span className="text-muted-foreground text-xs">{ad}</span>
        </div>
        <p className="font-tabular text-2xl font-bold">{deger}</p>
      </CardContent>
    </Card>
  );
}
