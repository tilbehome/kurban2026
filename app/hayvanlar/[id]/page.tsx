import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { kurbanDetayi } from "@/modules/hayvanlar/lib/kurban.service";
import { formatPara, topla, yuvarla } from "@/shared/lib/para";
import { ArrowLeft } from "lucide-react";
import { HissedarAtamaModal } from "@/modules/hayvanlar/components/hissedar-atama/HissedarAtamaModal";
import { HissedarCikarDialog } from "@/modules/hayvanlar/components/hissedar-atama/HissedarCikarDialog";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function KurbanDetayPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) notFound();

  const kurban = await kurbanDetayi(id);
  if (!kurban) notFound();

  const toplamBedel = yuvarla(topla(...kurban.hisseler.map((h) => h.hisseFiyati)));
  const toplamOdenen = yuvarla(
    topla(...kurban.hisseler.flatMap((h) => h.odemeler.map((o) => o.toplamTutar))),
  );

  return (
    <AppShell>
      <SayfaBaslik
        baslik={`Kurban #${kurban.kesimSirasi}`}
        altBaslik={kurban.kupeNo ? `Küpe: ${kurban.kupeNo}` : "Küpe yok"}
        aksiyonlar={
          <Link
            href="/hayvanlar"
            className={buttonVariants({ variant: "outline" })}
          >
            <ArrowLeft size={16} className="mr-1" />
            Geri
          </Link>
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
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Kalan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-tabular text-2xl font-bold text-amber-600">
              {formatPara(yuvarla(toplamBedel - toplamOdenen))}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="px-6 pb-8 sm:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Hisseler ({kurban.hisseler.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y">
              {kurban.hisseler.map((h) => {
                const odendi = yuvarla(
                  topla(...h.odemeler.map((o) => o.toplamTutar)),
                );
                const kalan = yuvarla(h.hisseFiyati - odendi);
                const dolu = h.musteri !== null;
                return (
                  <div
                    key={h.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-md text-sm font-semibold ${
                          dolu ? "bg-muted" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {h.no}
                      </div>
                      <div>
                        {h.musteri ? (
                          <Link
                            href={`/musteriler/${h.musteri.id}`}
                            className="font-medium hover:underline"
                          >
                            {h.musteri.adSoyad}
                          </Link>
                        ) : (
                          <p className="text-muted-foreground italic">Boş hisse</p>
                        )}
                        <p className="text-muted-foreground text-xs">
                          {h.musteri?.telefon ?? "—"}
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
                            kalan > 0 ? "text-amber-600" : "text-green-600"
                          }`}
                        >
                          {formatPara(kalan)}
                        </p>
                      </div>
                      {kalan <= 0 && dolu && (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          Ödendi
                        </Badge>
                      )}
                      {dolu && h.musteri && (
                        <HissedarCikarDialog
                          hisseId={h.id}
                          hisseNo={h.no}
                          kurbanKesimSirasi={kurban.kesimSirasi}
                          musteriAdi={h.musteri.adSoyad}
                        />
                      )}
                      {!dolu && (
                        <HissedarAtamaModal
                          hisseId={h.id}
                          hisseNo={h.no}
                          kurbanKesimSirasi={kurban.kesimSirasi}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
