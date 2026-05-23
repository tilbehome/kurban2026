import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { musteriDetayi } from "@/modules/musteriler/lib/musteri.service";
import { formatPara, topla, yuvarla } from "@/shared/lib/para";
import { formatTarihSaat } from "@/shared/lib/tarih";
import { ArrowLeft, Phone, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MusteriDetayPage({ params }: PageProps) {
  const { id } = await params;
  const musteriId = Number.parseInt(id, 10);
  if (Number.isNaN(musteriId)) notFound();

  const musteri = await musteriDetayi(musteriId);
  if (!musteri) notFound();

  const toplamBedel = yuvarla(
    topla(...musteri.hisseler.map((h) => h.hisseFiyati)),
  );
  const toplamOdenen = yuvarla(
    topla(
      ...musteri.hisseler.flatMap((h) =>
        h.odemeler.map((o) => o.toplamTutar),
      ),
    ),
  );
  const kalan = yuvarla(toplamBedel - toplamOdenen);

  return (
    <AppShell>
      <SayfaBaslik
        baslik={musteri.adSoyad}
        altBaslik={
          musteri.telefon ? `📞 ${musteri.telefon}` : "Telefon kayıtlı değil"
        }
        aksiyonlar={
          <>
            <Link
              href="/musteriler"
              className={buttonVariants({ variant: "outline" })}
            >
              <ArrowLeft size={16} className="mr-1" />
              Geri
            </Link>
            {kalan > 0 && (
              <Link
                href={`/tahsilat/musteri/${musteri.id}`}
                className={buttonVariants()}
              >
                <Wallet size={16} className="mr-1" />
                Ödeme Al
              </Link>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 p-6 sm:p-8 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Toplam Bedel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-tabular text-2xl font-bold">
              {formatPara(toplamBedel)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ödenen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-tabular text-2xl font-bold text-green-600">
              {formatPara(toplamOdenen)}
            </p>
          </CardContent>
        </Card>
        <Card
          className={kalan > 0 ? "border-amber-300" : "border-green-300"}
        >
          <CardHeader>
            <CardTitle className="text-sm">Kalan Bakiye</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`font-tabular text-2xl font-bold ${
                kalan > 0 ? "text-amber-600" : "text-green-600"
              }`}
            >
              {formatPara(kalan)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="px-6 pb-8 sm:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Hisseler ({musteri.hisseler.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {musteri.hisseler.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                Bu müşteriye henüz hisse atanmamış.
              </p>
            ) : (
              <div className="flex flex-col divide-y">
                {musteri.hisseler.map((h) => {
                  const odendi = yuvarla(
                    topla(...h.odemeler.map((o) => o.toplamTutar)),
                  );
                  const hisseKalan = yuvarla(h.hisseFiyati - odendi);
                  return (
                    <div
                      key={h.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-md text-sm font-semibold">
                          #{h.kurban.kesimSirasi}.{h.no}
                        </div>
                        <div>
                          <p className="font-medium">
                            Kurban #{h.kurban.kesimSirasi} — {h.no}. hisse
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {h.odemeler.length} ödeme · son:{" "}
                            {h.odemeler[0]
                              ? formatTarihSaat(h.odemeler[0].tarih)
                              : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <p className="text-muted-foreground text-xs">Bedel</p>
                          <p className="font-tabular font-semibold">
                            {formatPara(h.hisseFiyati)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Kalan</p>
                          <p
                            className={`font-tabular font-semibold ${
                              hisseKalan > 0 ? "text-amber-600" : "text-green-600"
                            }`}
                          >
                            {formatPara(hisseKalan)}
                          </p>
                        </div>
                        {hisseKalan <= 0 && (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            Ödendi
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {musteri.telefon && (
          <p className="text-muted-foreground mt-4 text-sm">
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
    </AppShell>
  );
}
