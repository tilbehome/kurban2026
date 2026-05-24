import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/shared/lib/prisma";
import { formatPara } from "@/shared/lib/para";
import { formatTarihSaat } from "@/shared/lib/tarih";
import { KasaAcilisForm } from "./KasaAcilisForm";

export const dynamic = "force-dynamic";

export default async function KasaAcilisPage() {
  const baslangic = new Date();
  baslangic.setHours(0, 0, 0, 0);

  const bugunkuAcilis = await prisma.kasaHareketi.findFirst({
    where: { tip: "acilis", tarih: { gte: baslangic } },
    orderBy: { tarih: "desc" },
    include: { kullanici: { select: { adSoyad: true } } },
  });

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Kasa Açılış"
        altBaslik="Gün başında kasada hazır bulunan nakit miktarını gir"
      />

      <div className="grid grid-cols-1 gap-4 p-6 sm:p-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bugünkü Açılış</CardTitle>
          </CardHeader>
          <CardContent>
            {bugunkuAcilis ? (
              <div className="flex flex-col gap-2">
                <div>
                  <p className="text-muted-foreground text-xs">Başlangıç Nakit</p>
                  <p className="font-tabular text-3xl font-bold text-green-600">
                    {formatPara(bugunkuAcilis.tutar)}
                  </p>
                </div>
                <p className="text-muted-foreground text-xs">
                  {formatTarihSaat(bugunkuAcilis.tarih)} ·{" "}
                  {bugunkuAcilis.kullanici.adSoyad}
                </p>
                {bugunkuAcilis.aciklama && (
                  <p className="text-sm">{bugunkuAcilis.aciklama}</p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Bugün için kasa açılışı yapılmamış.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {bugunkuAcilis ? "Tekrar Aç" : "Kasayı Aç"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <KasaAcilisForm />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
