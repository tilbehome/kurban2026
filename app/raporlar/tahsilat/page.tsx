import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/shared/lib/prisma";
import { formatPara, topla, yuvarla } from "@/shared/lib/para";

export const dynamic = "force-dynamic";

export default async function TahsilatRaporuPage() {
  const odemeler = await prisma.odeme.findMany({
    where: { iptal: false },
    include: { kullanici: { select: { adSoyad: true } } },
  });

  const yontemDagilim = {
    nakit: yuvarla(topla(...odemeler.map((o) => o.nakit))),
    havale: yuvarla(topla(...odemeler.map((o) => o.havale))),
    kart: yuvarla(topla(...odemeler.map((o) => o.kart))),
  };
  const toplam = yuvarla(
    yontemDagilim.nakit + yontemDagilim.havale + yontemDagilim.kart,
  );

  // Kullanıcı bazında
  const kullaniciToplam = new Map<string, { adet: number; tutar: number }>();
  for (const o of odemeler) {
    const ad = o.kullanici.adSoyad;
    const mevcut = kullaniciToplam.get(ad) ?? { adet: 0, tutar: 0 };
    kullaniciToplam.set(ad, {
      adet: mevcut.adet + 1,
      tutar: yuvarla(mevcut.tutar + o.toplamTutar),
    });
  }

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Tahsilat Raporu"
        altBaslik={`Toplam ${odemeler.length} tahsilat · ${formatPara(toplam)}`}
      />

      <div className="grid grid-cols-1 gap-6 p-6 sm:p-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Yöntem Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <YontemSatiri
              ad="Nakit"
              tutar={yontemDagilim.nakit}
              toplam={toplam}
              renk="bg-green-500"
            />
            <YontemSatiri
              ad="Havale"
              tutar={yontemDagilim.havale}
              toplam={toplam}
              renk="bg-blue-500"
            />
            <YontemSatiri
              ad="Kart"
              tutar={yontemDagilim.kart}
              toplam={toplam}
              renk="bg-purple-500"
            />
            <div className="mt-4 flex items-center justify-between border-t pt-4 font-semibold">
              <span>Toplam</span>
              <span className="font-tabular">{formatPara(toplam)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kullanıcı Bazında</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Kullanıcı</th>
                  <th className="px-4 py-2 font-medium text-right">İşlem</th>
                  <th className="px-4 py-2 font-medium text-right">Toplam</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {Array.from(kullaniciToplam.entries())
                  .sort((a, b) => b[1].tutar - a[1].tutar)
                  .map(([ad, v]) => (
                    <tr key={ad}>
                      <td className="px-4 py-2 font-medium">{ad}</td>
                      <td className="px-4 py-2 text-right">
                        <Badge variant="secondary">{v.adet}</Badge>
                      </td>
                      <td className="px-4 py-2 text-right font-tabular font-semibold">
                        {formatPara(v.tutar)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function YontemSatiri({
  ad,
  tutar,
  toplam,
  renk,
}: {
  ad: string;
  tutar: number;
  toplam: number;
  renk: string;
}) {
  const yuzde = toplam > 0 ? Math.round((tutar / toplam) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span>
          {ad} <span className="text-muted-foreground">({yuzde}%)</span>
        </span>
        <span className="font-tabular font-semibold">{formatPara(tutar)}</span>
      </div>
      <div className="bg-muted h-2 overflow-hidden rounded-full">
        <div className={`h-full ${renk}`} style={{ width: `${yuzde}%` }} />
      </div>
    </div>
  );
}
