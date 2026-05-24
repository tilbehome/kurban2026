import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/shared/lib/prisma";
import { formatPara, topla, yuvarla } from "@/shared/lib/para";
import { formatTarihSaat } from "@/shared/lib/tarih";
import { GiderGirisForm } from "./GiderGirisForm";

export const dynamic = "force-dynamic";

export default async function GiderGirisiPage() {
  const otuzGunOnce = new Date();
  otuzGunOnce.setDate(otuzGunOnce.getDate() - 30);

  const sonGiderler = await prisma.kasaHareketi.findMany({
    where: { tip: "gider", tarih: { gte: otuzGunOnce } },
    orderBy: { tarih: "desc" },
    take: 50,
    include: { kullanici: { select: { adSoyad: true } } },
  });

  const toplamGider = yuvarla(topla(...sonGiderler.map((g) => g.tutar)));

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Gider Girişi"
        altBaslik={`Son 30 günde ${sonGiderler.length} gider · ${formatPara(toplamGider)}`}
      />

      <div className="grid grid-cols-1 gap-4 p-6 sm:p-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Yeni Gider</CardTitle>
            </CardHeader>
            <CardContent>
              <GiderGirisForm />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Son Giderler</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {sonGiderler.length === 0 ? (
                <p className="text-muted-foreground p-6 text-center">
                  Son 30 günde gider yok.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 font-medium">Tarih</th>
                      <th className="px-4 py-2 font-medium">Açıklama</th>
                      <th className="px-4 py-2 font-medium">Yöntem</th>
                      <th className="px-4 py-2 font-medium text-right">Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sonGiderler.map((g) => (
                      <tr key={g.id}>
                        <td className="px-4 py-2 text-xs">
                          {formatTarihSaat(g.tarih)}
                        </td>
                        <td className="px-4 py-2">
                          <div>{g.aciklama}</div>
                          <div className="text-muted-foreground text-xs">
                            {g.kullanici.adSoyad}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <Badge variant="secondary">{g.yontem}</Badge>
                        </td>
                        <td className="px-4 py-2 text-right font-tabular font-semibold text-red-600">
                          -{formatPara(g.tutar)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
