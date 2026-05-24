import Link from "next/link";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { borclular } from "@/modules/raporlar/lib/rapor.service";
import { formatPara } from "@/shared/lib/para";
import { FileSpreadsheet, MessageCircle, Phone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BorcRaporuPage() {
  const liste = await borclular();
  const toplam = liste.reduce((s, b) => s + b.kalan, 0);

  // İstatistikler
  const buyukBorc = liste.filter((b) => b.kalan >= 100000).length;
  const ortaBorc = liste.filter(
    (b) => b.kalan >= 10000 && b.kalan < 100000,
  ).length;
  const kucukBorc = liste.filter((b) => b.kalan < 10000).length;
  const telefonsuz = liste.filter((b) => !b.telefon).length;

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Borç Raporu"
        altBaslik={`${liste.length} borçlu · ${formatPara(toplam)} toplam alacak`}
        aksiyonlar={
          <a
            href="/api/raporlar/borclular/excel"
            className={buttonVariants({ variant: "outline" })}
          >
            <FileSpreadsheet size={16} className="mr-1" />
            Excel İndir
          </a>
        }
      />

      <div className="p-6 sm:p-8">
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-muted-foreground text-xs">Büyük Borç (≥100K)</p>
              <p className="font-tabular text-2xl font-bold text-red-600">
                {buyukBorc}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-muted-foreground text-xs">Orta Borç (10-100K)</p>
              <p className="font-tabular text-2xl font-bold text-amber-600">
                {ortaBorc}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-muted-foreground text-xs">Küçük Borç (&lt;10K)</p>
              <p className="font-tabular text-2xl font-bold text-blue-600">
                {kucukBorc}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-muted-foreground text-xs">Telefonu Yok</p>
              <p className="font-tabular text-2xl font-bold text-stone-600">
                {telefonsuz}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tüm Borçlular (büyükten küçüğe)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {liste.length === 0 ? (
              <p className="text-muted-foreground py-12 text-center">
                Borçlu yok 🎉
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 font-medium">#</th>
                    <th className="px-4 py-2 font-medium">Müşteri</th>
                    <th className="px-4 py-2 font-medium">Telefon</th>
                    <th className="px-4 py-2 font-medium text-right">Hisse</th>
                    <th className="px-4 py-2 font-medium text-right">Bedel</th>
                    <th className="px-4 py-2 font-medium text-right">Kalan</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {liste.map((b, i) => (
                    <tr key={b.musteriId} className="hover:bg-muted/30">
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="px-4 py-2 font-medium">{b.adSoyad}</td>
                      <td className="px-4 py-2 text-xs">
                        {b.telefon ? (
                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${b.telefon}`}
                              className="text-muted-foreground hover:underline"
                            >
                              <Phone size={11} className="inline" /> {b.telefon}
                            </a>
                            <a
                              href={`https://wa.me/${b.telefon.replace(/\D/g, "")}?text=${encodeURIComponent(
                                `Sayın ${b.adSoyad}, Tilbe Kurban kalan ödemeniz: ${formatPara(b.kalan)}.`,
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-green-600 hover:text-green-700"
                            >
                              <MessageCircle size={14} />
                            </a>
                          </div>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Telefon yok
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right font-tabular">
                        {b.hisseSayisi}
                      </td>
                      <td className="px-4 py-2 text-right font-tabular">
                        {formatPara(b.toplamBedel)}
                      </td>
                      <td className="px-4 py-2 text-right font-tabular font-bold text-amber-600">
                        {formatPara(b.kalan)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Link
                          href={`/tahsilat/musteri/${b.musteriId}`}
                          className={buttonVariants({
                            size: "sm",
                            variant: "outline",
                          })}
                        >
                          Tahsilat
                        </Link>
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
