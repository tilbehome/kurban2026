import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { tumAyarlar } from "@/modules/_core/ayarlar/ayar.service";
import { AyarlarForm } from "./AyarlarForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Users, Database, Settings } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AyarlarPage() {
  const ayarlar = await tumAyarlar();

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Ayarlar"
        altBaslik="Firma bilgileri, kullanıcılar, yedekleme"
      />
      <div className="p-6 sm:p-8">
        <Tabs defaultValue="genel" className="w-full">
          <TabsList>
            <TabsTrigger value="genel">
              <Settings size={16} className="mr-2" />
              Genel
            </TabsTrigger>
            <TabsTrigger value="kullanicilar">
              <Users size={16} className="mr-2" />
              Kullanıcılar
            </TabsTrigger>
            <TabsTrigger value="yedekleme">
              <Database size={16} className="mr-2" />
              Yedekleme
            </TabsTrigger>
          </TabsList>

          <TabsContent value="genel" className="mt-6">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Firma Bilgileri</CardTitle>
                <CardDescription>
                  Dekont ve raporlarda gösterilecek bilgiler.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AyarlarForm ayarlar={ayarlar} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kullanicilar" className="mt-6">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Kullanıcı Yönetimi</CardTitle>
                <CardDescription>
                  Kasiyer ve yönetici hesapları ekleyip yönetin.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  href="/ayarlar/kullanicilar"
                  className={buttonVariants({ size: "lg" })}
                >
                  Kullanıcıları Yönet
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="yedekleme" className="mt-6">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Veritabanı Yedekleme</CardTitle>
                <CardDescription>
                  Manuel yedek alın, geçmiş yedekleri görün.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  href="/ayarlar/yedekleme"
                  className={buttonVariants({ size: "lg" })}
                >
                  Yedekleri Yönet
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
