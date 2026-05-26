import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { musteriTahsilatVerisi } from "@/modules/tahsilat/lib/tahsilat.service";
import { formatPara } from "@/shared/lib/para";
import { formatTarihSaat } from "@/shared/lib/tarih";
import { ArrowLeft, Phone } from "lucide-react";
import { OdemeFormu } from "./OdemeFormu";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TahsilatMusteriPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) notFound();

  const veri = await musteriTahsilatVerisi(id);
  if (!veri) notFound();

  const { musteri, hisseler, toplamBedel, toplamOdenen, kalanBakiye, oncekiOdemeler } = veri;

  return (
    <AppShell>
      <SayfaBaslik
        baslik={musteri.adSoyad}
        altBaslik={musteri.telefon ?? "Telefon kayıtlı değil"}
        aksiyonlar={
          <Link
            href="/tahsilat"
            className={buttonVariants({ variant: "outline" })}
          >
            <ArrowLeft size={16} className="mr-1" />
            Geri (Esc)
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 p-6 sm:p-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Hisse Detayı</CardTitle>
            </CardHeader>
            <CardContent>
              {hisseler.length === 0 ? (
                <p className="text-muted-foreground py-3">
                  Bu müşteriye atanmış hisse yok.
                </p>
              ) : (
                <>
                  <div className="flex flex-col divide-y">
                    {hisseler.map((h) => (
                      <div
                        key={h.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-md font-mono text-sm font-semibold">
                            #{h.kurbanKesimSirasi}.{h.no}
                          </div>
                          <div>
                            <p className="font-medium">
                              Kurban #{h.kurbanKesimSirasi} — {h.no}. hisse
                            </p>
                            <p className="text-muted-foreground text-xs font-tabular">
                              Bedel: {formatPara(h.hisseFiyati)} · Ödenmiş:{" "}
                              {formatPara(h.odenmis)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground text-xs">Kalan</p>
                          <p
                            className={`font-tabular text-lg font-bold ${
                              h.kalan > 0 ? "text-amber-600" : "text-green-600"
                            }`}
                          >
                            {formatPara(h.kalan)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-4">
                    <div>
                      <p className="text-muted-foreground text-xs">Toplam Bedel</p>
                      <p className="font-tabular text-lg font-semibold">
                        {formatPara(toplamBedel)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Ödenen</p>
                      <p className="font-tabular text-lg font-semibold text-green-600">
                        {formatPara(toplamOdenen)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Kalan Bakiye</p>
                      <p
                        className={`font-tabular text-xl font-bold ${
                          kalanBakiye > 0 ? "text-amber-600" : "text-green-600"
                        }`}
                      >
                        {formatPara(kalanBakiye)}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Önceki Ödemeler ({oncekiOdemeler.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {oncekiOdemeler.length === 0 ? (
                <p className="text-muted-foreground px-6 pb-4">
                  Henüz ödeme alınmamış.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-muted-foreground text-left text-xs">
                    <tr>
                      <th className="px-4 py-2 font-medium">Tarih</th>
                      <th className="px-4 py-2 font-medium">Dekont</th>
                      <th className="px-4 py-2 font-medium">Hisse</th>
                      <th className="px-4 py-2 font-medium">Yöntem</th>
                      <th className="px-4 py-2 font-medium text-right">Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {oncekiOdemeler.map((o) => (
                      <tr key={o.id}>
                        <td className="px-4 py-2 text-xs">
                          {formatTarihSaat(o.tarih)}
                        </td>
                        <td className="px-4 py-2 font-mono text-xs">
                          {o.dekontNo}
                        </td>
                        <td className="px-4 py-2 font-mono text-xs">
                          {o.hisseEtiket}
                        </td>
                        <td className="px-4 py-2">
                          <Badge variant="secondary">{o.yontem}</Badge>
                        </td>
                        <td className="px-4 py-2 text-right font-tabular font-semibold">
                          {formatPara(o.toplam)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          {hisseler.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">
                  Müşteriye hisse atanmadığı için ödeme alınamaz.
                </p>
              </CardContent>
            </Card>
          ) : (
            // SPRINT-FIX-DEKONT-YESIL-PANEL: hisse varsa kalan 0 olsa bile
            // OdemeFormu render edilir; içindeki sonOdeme state (yeşil panel
            // + "Dekont Yazdır" butonu) router.refresh() sonrası kaybolmasın.
            <Card>
              <CardHeader>
                <CardTitle>
                  {kalanBakiye > 0 ? "Yeni Ödeme Al" : "Son Ödeme Bilgisi"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OdemeFormu
                  musteriId={musteri.id}
                  hisseler={hisseler.filter((h) => h.kalan > 0)}
                  kalanBakiye={kalanBakiye}
                />
              </CardContent>
            </Card>
          )}

          {musteri.telefon && (
            <p className="text-muted-foreground mt-4 text-center text-sm">
              <Phone size={14} className="mr-1 inline" />
              <a href={`tel:${musteri.telefon}`} className="hover:underline">
                {musteri.telefon}
              </a>{" "}
              ·{" "}
              <a
                href={`https://wa.me/${musteri.telefon.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                WhatsApp
              </a>
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
