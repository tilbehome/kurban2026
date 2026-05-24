import Link from "next/link";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  bugunkuOzet,
  bugunkuTahsilatlar,
} from "@/modules/tahsilat/lib/tahsilat.service";
import { formatPara } from "@/shared/lib/para";
import { Receipt, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BugunTahsilatlarPage() {
  const [ozet, satirlar] = await Promise.all([
    bugunkuOzet(),
    bugunkuTahsilatlar(),
  ]);

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Bugünkü Tahsilatlar"
        altBaslik={`${ozet.islemSayisi} işlem · ${formatPara(ozet.toplam)} toplam`}
        aksiyonlar={
          <Link href="/tahsilat" className={buttonVariants()}>
            <TrendingUp size={16} className="mr-1" />
            Yeni Tahsilat Al
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 p-6 sm:p-8 lg:grid-cols-4">
        <Ozet ad="Nakit" deger={ozet.nakit} renk="text-green-600" />
        <Ozet ad="Havale" deger={ozet.havale} renk="text-blue-600" />
        <Ozet ad="Kart" deger={ozet.kart} renk="text-purple-600" />
        <Ozet ad="Toplam" deger={ozet.toplam} renk="text-tilbe" vurgu />
      </div>

      <div className="px-6 pb-8 sm:px-8">
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Saat</th>
                  <th className="px-4 py-2 font-medium">Dekont</th>
                  <th className="px-4 py-2 font-medium">Müşteri</th>
                  <th className="px-4 py-2 font-medium">Kurban</th>
                  <th className="px-4 py-2 font-medium">Yöntem</th>
                  <th className="px-4 py-2 font-medium text-right">Tutar</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {satirlar.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-muted-foreground px-4 py-12 text-center"
                    >
                      <Receipt
                        size={28}
                        className="mx-auto mb-2 text-muted-foreground/40"
                      />
                      Bugün henüz tahsilat yok.
                    </td>
                  </tr>
                ) : (
                  satirlar.map((s) => (
                    <tr
                      key={s.id}
                      className={s.iptal ? "opacity-60 line-through" : ""}
                    >
                      <td className="px-4 py-2 font-tabular text-xs">{s.saat}</td>
                      <td className="px-4 py-2 font-mono text-xs">{s.dekontNo}</td>
                      <td className="px-4 py-2">{s.musteriAdi}</td>
                      <td className="px-4 py-2 font-mono text-xs">{s.kurban}</td>
                      <td className="px-4 py-2">
                        <Badge variant="secondary">{s.yontem}</Badge>
                      </td>
                      <td className="px-4 py-2 text-right font-tabular font-semibold">
                        {formatPara(s.toplam)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Link
                          href={`/api/tahsilat/dekont/${s.id}`}
                          target="_blank"
                          className={buttonVariants({
                            variant: "ghost",
                            size: "sm",
                          })}
                        >
                          Dekont
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Ozet({
  ad,
  deger,
  renk,
  vurgu = false,
}: {
  ad: string;
  deger: number;
  renk: string;
  vurgu?: boolean;
}) {
  return (
    <Card className={vurgu ? "border-primary" : undefined}>
      <CardContent className="pt-5">
        <p className={`text-xs ${renk}`}>{ad}</p>
        <p className="font-tabular text-xl font-bold sm:text-2xl">
          {formatPara(deger)}
        </p>
      </CardContent>
    </Card>
  );
}
