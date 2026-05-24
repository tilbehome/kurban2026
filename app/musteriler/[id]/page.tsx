import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/shared/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ayniIsimSayisi,
  musteriDetayi,
} from "@/modules/musteriler/lib/musteri.service";
import { MusteriAvatar } from "@/modules/musteriler/components/MusteriAvatar";
import { MusteriRozetler } from "@/modules/musteriler/components/MusteriRozetler";
import { HizliOdemePanel } from "@/modules/musteriler/components/HizliOdemePanel";
import { formatPara, topla, yuvarla } from "@/shared/lib/para";
import { formatTarih, formatTarihSaat } from "@/shared/lib/tarih";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  FileText,
  Printer,
  Wallet,
  ExternalLink,
} from "lucide-react";

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

  const ayniIsim = await ayniIsimSayisi(musteri.adSoyad);

  const toplamBedel = yuvarla(topla(...musteri.hisseler.map((h) => h.hisseFiyati)));
  const toplamOdenen = yuvarla(
    topla(...musteri.hisseler.flatMap((h) => h.odemeler.map((o) => o.toplamTutar))),
  );
  const kalan = yuvarla(toplamBedel - toplamOdenen);
  const tahsilatYuzde =
    toplamBedel > 0 ? Math.round((toplamOdenen / toplamBedel) * 100) : 0;
  const kayitYil = new Date().getFullYear() - musteri.createdAt.getFullYear();

  const hisselerForm = musteri.hisseler
    .map((h) => {
      const odenmis = yuvarla(topla(...h.odemeler.map((o) => o.toplamTutar)));
      return {
        id: h.id,
        no: h.no,
        kurbanKesimSirasi: h.kurban.kesimSirasi,
        hisseFiyati: h.hisseFiyati,
        kalan: yuvarla(h.hisseFiyati - odenmis),
      };
    })
    .filter((h) => h.kalan > 0);

  const tumOdemeler = musteri.hisseler
    .flatMap((h) =>
      h.odemeler.map((o) => ({
        id: o.id,
        dekontNo: o.dekontNo,
        tarih: o.tarih,
        toplam: o.toplamTutar,
        yontem: o.yontem,
        nakit: o.nakit,
        havale: o.havale,
        kart: o.kart,
        hisseEtiket: `#${h.kurban.kesimSirasi}.${h.no}`,
      })),
    )
    .sort((a, b) => b.tarih.getTime() - a.tarih.getTime());

  return (
    <AppShell>
      {/* HEADER */}
      <div className="border-b bg-white px-6 py-5 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <MusteriAvatar
              musteriId={musteri.id}
              adSoyad={musteri.adSoyad}
              boyut="lg"
            />
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  {musteri.adSoyad}
                </h1>
                <MusteriRozetler
                  boyut="md"
                  veri={{
                    telefon: musteri.telefon,
                    hisseSayisi: musteri.hisseler.length,
                    ayniIsimSayisi: ayniIsim,
                    kayitYil,
                  }}
                />
              </div>
              <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
                {musteri.telefon && (
                  <a
                    href={`tel:${musteri.telefon}`}
                    className="flex items-center gap-1 hover:underline"
                  >
                    <Phone size={13} />
                    {musteri.telefon}
                  </a>
                )}
                {musteri.tcKimlik && (
                  <span className="font-mono text-xs">
                    TC: {maskeleTc(musteri.tcKimlik)}
                  </span>
                )}
                {musteri.adres && <span className="text-xs">📍 {musteri.adres}</span>}
                <span className="text-xs">
                  Kayıt: {formatTarih(musteri.createdAt)}
                </span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {musteri.telefon && (
                  <a
                    href={`https://wa.me/${musteri.telefon.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonVariants({ size: "sm", variant: "outline" })}
                  >
                    <MessageCircle size={13} className="mr-1 text-green-600" />
                    WhatsApp
                  </a>
                )}
                {musteri.telefon && (
                  <a
                    href={`tel:${musteri.telefon}`}
                    className={buttonVariants({ size: "sm", variant: "outline" })}
                  >
                    <Phone size={13} className="mr-1" />
                    Ara
                  </a>
                )}
                <Link
                  href={`/musteriler/ekstre?id=${musteri.id}`}
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                >
                  <FileText size={13} className="mr-1" />
                  Ekstre
                </Link>
                <Link
                  href="/musteriler"
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                >
                  <ArrowLeft size={13} className="mr-1" />
                  Liste
                </Link>
              </div>
            </div>
          </div>

          {/* Sağ özet kart */}
          <div className="rounded-lg border bg-gradient-to-br from-amber-50 to-orange-50 p-4 lg:min-w-[280px]">
            <p className="text-muted-foreground text-xs">Kalan Borç</p>
            <p
              className={`font-tabular text-3xl font-bold ${
                kalan > 0 ? "text-amber-600" : "text-green-600"
              }`}
            >
              {formatPara(kalan)}
            </p>
            <div className="mt-2 text-xs">
              <span className="text-muted-foreground">
                Toplam {formatPara(toplamBedel)}
              </span>
              <span className="mx-1">·</span>
              <span className="text-green-600">
                Ödenen {formatPara(toplamOdenen)}
              </span>
            </div>
            <div className="bg-muted mt-2 h-2 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full transition-all"
                style={{ width: `${tahsilatYuzde}%` }}
              />
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              %{tahsilatYuzde} tahsil edildi
            </p>
          </div>
        </div>
      </div>

      {/* TAB + SAĞ PANEL */}
      <div className="grid grid-cols-1 gap-6 p-6 sm:p-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="genel">
            <TabsList>
              <TabsTrigger value="genel">Genel Bakış</TabsTrigger>
              <TabsTrigger value="hisseler">
                Hisseler ({musteri.hisseler.length})
              </TabsTrigger>
              <TabsTrigger value="odemeler">
                Ödemeler ({tumOdemeler.length})
              </TabsTrigger>
              {musteri.notlar && <TabsTrigger value="notlar">Notlar</TabsTrigger>}
            </TabsList>

            {/* TAB: GENEL BAKIŞ */}
            <TabsContent value="genel" className="mt-4 space-y-4">
              <HisselerKart musteri={musteri} />
              <SonOdemelerTablo odemeler={tumOdemeler.slice(0, 5)} />
            </TabsContent>

            {/* TAB: HİSSELER (Tümü) */}
            <TabsContent value="hisseler" className="mt-4">
              <HisselerKart musteri={musteri} />
            </TabsContent>

            {/* TAB: ÖDEMELER (Tümü) */}
            <TabsContent value="odemeler" className="mt-4">
              <SonOdemelerTablo odemeler={tumOdemeler} baslik="Tüm Ödemeler" />
            </TabsContent>

            {/* TAB: NOTLAR */}
            {musteri.notlar && (
              <TabsContent value="notlar" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Müşteri Notları</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm">{musteri.notlar}</p>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* SAĞ STICKY PANEL */}
        <aside className="space-y-3">
          {hisselerForm.length > 0 ? (
            <Card className="lg:sticky lg:top-4">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wallet size={16} className="text-primary" />
                  Hızlı Ödeme Al
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HizliOdemePanel
                  musteriId={musteri.id}
                  hisseler={hisselerForm}
                  kalanBakiye={kalan}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="lg:sticky lg:top-4">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground text-sm">
                  {musteri.hisseler.length === 0
                    ? "Müşteriye atanmış hisse yok."
                    : "Tüm ödemeler tamamlanmış 🎉"}
                </p>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </AppShell>
  );
}

function maskeleTc(tc: string): string {
  if (tc.length < 5) return tc;
  return tc.substring(0, 3) + "***" + tc.substring(tc.length - 2);
}

type MusteriIle = NonNullable<Awaited<ReturnType<typeof musteriDetayi>>>;

function HisselerKart({ musteri }: { musteri: MusteriIle }) {
  if (musteri.hisseler.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Bu müşteriye atanmış hisse yok.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Hisseler ({musteri.hisseler.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {musteri.hisseler.map((h) => {
            const odenmis = yuvarla(topla(...h.odemeler.map((o) => o.toplamTutar)));
            const hKalan = yuvarla(h.hisseFiyati - odenmis);
            return (
              <div
                key={h.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Link
                    href={`/hayvanlar/${h.kurban.id}`}
                    className="bg-muted hover:bg-muted/80 flex h-10 w-10 items-center justify-center rounded-md font-mono text-sm font-semibold transition-colors"
                    title="Kurban detayı"
                  >
                    #{h.kurban.kesimSirasi}.{h.no}
                  </Link>
                  <div>
                    <p className="font-medium">
                      Kurban #{h.kurban.kesimSirasi} — {h.no}. hisse
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Bedel {formatPara(h.hisseFiyati)} · Ödenmiş{" "}
                      {formatPara(odenmis)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs">Kalan</p>
                  <p
                    className={`font-tabular text-lg font-bold ${
                      hKalan > 0 ? "text-amber-600" : "text-green-600"
                    }`}
                  >
                    {formatPara(hKalan)}
                  </p>
                  {hKalan <= 0 && (
                    <Badge className="mt-1 bg-green-100 text-green-700 hover:bg-green-100">
                      Tamam
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface OdemeSatir {
  id: number;
  dekontNo: string;
  tarih: Date;
  toplam: number;
  yontem: string;
  nakit: number;
  havale: number;
  kart: number;
  hisseEtiket: string;
}

function SonOdemelerTablo({
  odemeler,
  baslik = "Son Ödemeler",
}: {
  odemeler: OdemeSatir[];
  baslik?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>{baslik}</span>
          {odemeler.length === 5 && baslik === "Son Ödemeler" && (
            <Link
              href="?tab=odemeler"
              className="text-muted-foreground text-xs font-normal hover:underline"
            >
              Tümünü gör →
            </Link>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {odemeler.length === 0 ? (
          <p className="text-muted-foreground px-6 pb-4 text-sm">
            Henüz ödeme alınmamış.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Tarih</th>
                <th className="px-4 py-2 font-medium">Dekont</th>
                <th className="px-4 py-2 font-medium">Hisse</th>
                <th className="px-4 py-2 font-medium">Yöntem</th>
                <th className="px-4 py-2 font-medium text-right">Tutar</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {odemeler.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-2 text-xs">
                    {formatTarihSaat(o.tarih)}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{o.dekontNo}</td>
                  <td className="px-4 py-2 font-mono text-xs">{o.hisseEtiket}</td>
                  <td className="px-4 py-2">
                    <Badge variant="secondary">{o.yontem}</Badge>
                  </td>
                  <td className="px-4 py-2 text-right font-tabular font-semibold">
                    {formatPara(o.toplam)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/api/tahsilat/dekont/${o.id}`}
                      target="_blank"
                      className={buttonVariants({
                        size: "sm",
                        variant: "ghost",
                      })}
                    >
                      <ExternalLink size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
