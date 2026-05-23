import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPara } from "@/shared/lib/para";
import {
  bugunkuOzet,
  bugunkuTahsilatlar,
} from "@/modules/tahsilat/lib/tahsilat.service";
import { TahsilatAramaKutusu } from "./TahsilatAramaKutusu";
import { Wallet, TrendingUp, Receipt, Banknote, ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TahsilatAnaPage() {
  const [ozet, satirlar] = await Promise.all([
    bugunkuOzet(),
    bugunkuTahsilatlar(),
  ]);

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Tahsilat"
        altBaslik="Müşteri ara (Ctrl+K) · Bugünkü tahsilatları takip et"
      />

      <div className="p-6 sm:p-8">
        <div className="mb-6">
          <TahsilatAramaKutusu />
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <OzetKart
            ad="Nakit"
            deger={ozet.nakit}
            ikon={<Banknote size={20} />}
            renk="text-green-600"
          />
          <OzetKart
            ad="Havale"
            deger={ozet.havale}
            ikon={<ArrowUpRight size={20} />}
            renk="text-blue-600"
          />
          <OzetKart
            ad="Kart"
            deger={ozet.kart}
            ikon={<Receipt size={20} />}
            renk="text-purple-600"
          />
          <OzetKart
            ad="Toplam"
            deger={ozet.toplam}
            ikon={<TrendingUp size={20} />}
            renk="text-tilbe"
            vurgu
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>Bugünkü Tahsilatlar</span>
              <span className="text-muted-foreground text-sm font-normal">
                {ozet.islemSayisi} işlem · Ort. {formatPara(ozet.ortalama)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-muted/40 text-muted-foreground text-left text-xs">
                <tr>
                  <th className="px-4 py-2 font-medium">Saat</th>
                  <th className="px-4 py-2 font-medium">Dekont</th>
                  <th className="px-4 py-2 font-medium">Müşteri</th>
                  <th className="px-4 py-2 font-medium">Kurban</th>
                  <th className="px-4 py-2 font-medium text-right">Tutar</th>
                  <th className="px-4 py-2 font-medium">Yöntem</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {satirlar.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center">
                      <Wallet
                        size={28}
                        className="text-muted-foreground/40 mx-auto mb-2"
                      />
                      <p className="text-muted-foreground">
                        Bugün henüz tahsilat alınmadı. Müşteri aramak için{" "}
                        <kbd className="bg-muted rounded border px-1.5 py-0.5 text-xs">
                          Ctrl+K
                        </kbd>{" "}
                        kullanın.
                      </p>
                    </td>
                  </tr>
                ) : (
                  satirlar.map((s) => (
                    <tr
                      key={s.id}
                      className={s.iptal ? "opacity-50 line-through" : ""}
                    >
                      <td className="font-tabular px-4 py-2.5 text-xs">{s.saat}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">{s.dekontNo}</td>
                      <td className="px-4 py-2.5">{s.musteriAdi}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">{s.kurban}</td>
                      <td className="font-tabular px-4 py-2.5 text-right font-semibold">
                        {formatPara(s.toplam)}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant="secondary">{yontemEtiketi(s.yontem)}</Badge>
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

function OzetKart({
  ad,
  deger,
  ikon,
  renk,
  vurgu = false,
}: {
  ad: string;
  deger: number;
  ikon: React.ReactNode;
  renk: string;
  vurgu?: boolean;
}) {
  return (
    <Card className={vurgu ? "border-primary" : undefined}>
      <CardContent className="pt-5">
        <div className={`mb-1 flex items-center gap-2 ${renk}`}>
          {ikon}
          <span className="text-muted-foreground text-xs">{ad}</span>
        </div>
        <p className="font-tabular text-xl font-bold sm:text-2xl">
          {formatPara(deger)}
        </p>
      </CardContent>
    </Card>
  );
}

function yontemEtiketi(y: string): string {
  switch (y) {
    case "nakit":
      return "Nakit";
    case "havale":
      return "Havale";
    case "kart":
      return "Kart";
    case "karisik":
      return "Karışık";
    default:
      return y;
  }
}
