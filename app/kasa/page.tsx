import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { gunlukRapor } from "@/modules/kasa/lib/kasa.service";
import { formatPara } from "@/shared/lib/para";
import { formatTarih } from "@/shared/lib/tarih";
import { Banknote, ArrowUpRight, CreditCard, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ tarih?: string }>;
}

export default async function KasaPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const tarih = sp.tarih ? new Date(sp.tarih) : new Date();
  if (Number.isNaN(tarih.getTime())) tarih.setTime(Date.now());

  const rapor = await gunlukRapor(tarih);

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Kasa"
        altBaslik={`${formatTarih(rapor.tarih)} — ${rapor.islemSayisi} işlem`}
      />

      <div className="p-6 sm:p-8">
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KasaKart
            ad="Nakit"
            deger={rapor.nakit}
            ikon={<Banknote size={20} />}
            renk="text-green-600"
          />
          <KasaKart
            ad="Havale"
            deger={rapor.havale}
            ikon={<ArrowUpRight size={20} />}
            renk="text-blue-600"
          />
          <KasaKart
            ad="Kart"
            deger={rapor.kart}
            ikon={<CreditCard size={20} />}
            renk="text-purple-600"
          />
          <KasaKart
            ad="Toplam"
            deger={rapor.toplam}
            ikon={<TrendingUp size={20} />}
            renk="text-tilbe"
            vurgu
          />
        </div>

        {rapor.iptalSayisi > 0 && (
          <Card className="mb-4 border-red-200 bg-red-50">
            <CardContent className="pt-4 text-sm text-red-700">
              {rapor.iptalSayisi} iptal işlemi · Toplam{" "}
              <strong>{formatPara(rapor.iptalTutar)}</strong>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hareketler ({rapor.hareketler.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {rapor.hareketler.length === 0 ? (
              <p className="text-muted-foreground px-6 py-10 text-center">
                Bu tarihte işlem yok.
              </p>
            ) : (
              <table className="w-full">
                <thead className="bg-muted/40 text-muted-foreground text-left text-xs">
                  <tr>
                    <th className="px-4 py-2 font-medium">Saat</th>
                    <th className="px-4 py-2 font-medium">Dekont</th>
                    <th className="px-4 py-2 font-medium">Müşteri</th>
                    <th className="px-4 py-2 font-medium">Yöntem</th>
                    <th className="px-4 py-2 font-medium text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {rapor.hareketler.map((h) => (
                    <tr
                      key={h.id}
                      className={h.iptal ? "line-through opacity-60" : ""}
                    >
                      <td className="font-tabular px-4 py-2 text-xs">{h.saat}</td>
                      <td className="px-4 py-2 font-mono text-xs">{h.dekontNo}</td>
                      <td className="px-4 py-2">{h.musteri}</td>
                      <td className="px-4 py-2">
                        <Badge variant="secondary">{h.yontem}</Badge>
                      </td>
                      <td className="px-4 py-2 text-right font-semibold font-tabular">
                        {formatPara(h.tutar)}
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

function KasaKart({
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
        <p className="font-tabular text-xl font-bold sm:text-2xl">{formatPara(deger)}</p>
      </CardContent>
    </Card>
  );
}
