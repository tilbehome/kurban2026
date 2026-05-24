import Link from "next/link";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/shared/lib/prisma";
import { formatPara, topla, yuvarla } from "@/shared/lib/para";
import { formatTarih } from "@/shared/lib/tarih";
import { FileSpreadsheet } from "lucide-react";

export const dynamic = "force-dynamic";

interface GunSatiri {
  tarih: string;
  acilis: number;
  tahsilat: number;
  gider: number;
  kapanis: number | null;
  fark: number | null;
}

export default async function KasaRaporuPage() {
  const yedikGunOnce = new Date();
  yedikGunOnce.setDate(yedikGunOnce.getDate() - 7);
  yedikGunOnce.setHours(0, 0, 0, 0);

  const hareketler = await prisma.kasaHareketi.findMany({
    where: { tarih: { gte: yedikGunOnce } },
    orderBy: { tarih: "asc" },
  });

  const gunler = new Map<string, GunSatiri>();
  for (const h of hareketler) {
    const gun = h.tarih.toISOString().slice(0, 10);
    if (!gunler.has(gun)) {
      gunler.set(gun, {
        tarih: gun,
        acilis: 0,
        tahsilat: 0,
        gider: 0,
        kapanis: null,
        fark: null,
      });
    }
    const g = gunler.get(gun)!;
    if (h.tip === "acilis") g.acilis = yuvarla(g.acilis + h.tutar);
    else if (h.tip === "tahsilat" && h.yontem === "nakit")
      g.tahsilat = yuvarla(g.tahsilat + h.tutar);
    else if (h.tip === "gider" && h.yontem === "nakit")
      g.gider = yuvarla(g.gider + h.tutar);
    else if (h.tip === "kapanis") g.kapanis = h.tutar;
  }

  // Fark hesabı
  for (const g of gunler.values()) {
    if (g.kapanis != null) {
      const beklenen = yuvarla(g.acilis + g.tahsilat - g.gider);
      g.fark = yuvarla(g.kapanis - beklenen);
    }
  }

  const liste = Array.from(gunler.values()).sort((a, b) =>
    b.tarih.localeCompare(a.tarih),
  );

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Kasa Raporu"
        altBaslik="Son 7 günlük açılış / tahsilat / gider / kapanış"
        aksiyonlar={
          <Link
            href="/raporlar/excel"
            className={buttonVariants({ variant: "outline" })}
          >
            <FileSpreadsheet size={16} className="mr-1" />
            Excel Merkezi
          </Link>
        }
      />

      <div className="p-6 sm:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Günlük Kasa</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {liste.length === 0 ? (
              <p className="text-muted-foreground p-6 text-center">
                Bu hafta için kasa hareketi yok.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 font-medium">Tarih</th>
                    <th className="px-4 py-2 font-medium text-right">Açılış</th>
                    <th className="px-4 py-2 font-medium text-right">+ Nakit Tahsilat</th>
                    <th className="px-4 py-2 font-medium text-right">- Gider</th>
                    <th className="px-4 py-2 font-medium text-right">Kapanış</th>
                    <th className="px-4 py-2 font-medium">Fark</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {liste.map((g) => (
                    <tr key={g.tarih}>
                      <td className="px-4 py-2 font-medium">
                        {formatTarih(new Date(g.tarih))}
                      </td>
                      <td className="px-4 py-2 text-right font-tabular">
                        {formatPara(g.acilis)}
                      </td>
                      <td className="px-4 py-2 text-right font-tabular text-green-600">
                        +{formatPara(g.tahsilat)}
                      </td>
                      <td className="px-4 py-2 text-right font-tabular text-red-600">
                        -{formatPara(g.gider)}
                      </td>
                      <td className="px-4 py-2 text-right font-tabular font-semibold">
                        {g.kapanis != null ? formatPara(g.kapanis) : "—"}
                      </td>
                      <td className="px-4 py-2">
                        {g.fark == null ? (
                          <span className="text-muted-foreground text-xs">—</span>
                        ) : g.fark === 0 ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            Tam
                          </Badge>
                        ) : g.fark > 0 ? (
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                            +{formatPara(g.fark)}
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                            {formatPara(g.fark)}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
