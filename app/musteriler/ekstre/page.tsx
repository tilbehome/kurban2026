import Link from "next/link";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { musteriDetayi } from "@/modules/musteriler/lib/musteri.service";
import { musterileriListele } from "@/modules/musteriler/lib/musteri.service";
import { formatPara, topla, yuvarla } from "@/shared/lib/para";
import { formatTarihSaat } from "@/shared/lib/tarih";
import { ArrowLeft, Search } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function HesapEkstrePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const musteriId = sp.id ? Number.parseInt(sp.id, 10) : NaN;

  if (Number.isNaN(musteriId)) {
    const { liste } = await musterileriListele({
      durum: "borclu",
      limit: 50,
    });

    return (
      <AppShell>
        <SayfaBaslik
          baslik="Hesap Ekstresi"
          altBaslik="Ekstre almak istediğiniz müşteriyi seçin"
        />
        <div className="p-6 sm:p-8">
          <Card>
            <CardHeader>
              <CardTitle>Borçlu Müşteriler</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {liste.length === 0 ? (
                <p className="p-6 text-center text-muted-foreground">
                  Borçlu müşteri yok 🎉
                </p>
              ) : (
                <div className="divide-y">
                  {liste.slice(0, 30).map((m) => (
                    <Link
                      key={m.id}
                      href={`/musteriler/ekstre?id=${m.id}`}
                      className="hover:bg-muted/30 flex items-center justify-between gap-4 px-4 py-3"
                    >
                      <div>
                        <div className="font-medium">{m.adSoyad}</div>
                        <div className="text-muted-foreground text-xs">
                          {m.telefon ?? "—"} · {m.hisseSayisi} hisse
                        </div>
                      </div>
                      <span className="font-tabular text-sm font-semibold text-amber-600">
                        {formatPara(m.kalan)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <p className="text-muted-foreground mt-3 text-xs">
            <Search size={12} className="inline" /> Tüm müşterilerden arama için{" "}
            <Link href="/musteriler/ara" className="underline">
              Müşteri Ara
            </Link>{" "}
            sayfasını kullanın.
          </p>
        </div>
      </AppShell>
    );
  }

  const m = await musteriDetayi(musteriId);
  if (!m) {
    return (
      <AppShell>
        <SayfaBaslik baslik="Müşteri Bulunamadı" />
        <div className="p-8">
          <Link href="/musteriler/ekstre" className={buttonVariants({ variant: "outline" })}>
            Geri
          </Link>
        </div>
      </AppShell>
    );
  }

  const toplamBedel = yuvarla(topla(...m.hisseler.map((h) => h.hisseFiyati)));
  const toplamOdeme = yuvarla(
    topla(...m.hisseler.flatMap((h) => h.odemeler.map((o) => o.toplamTutar))),
  );
  const kalan = yuvarla(toplamBedel - toplamOdeme);

  type EkstreSatir =
    | { tip: "borc"; tarih: Date; aciklama: string; tutar: number }
    | {
        tip: "odeme";
        tarih: Date;
        aciklama: string;
        tutar: number;
        dekontNo: string;
      };

  const satirlar: EkstreSatir[] = [];
  for (const h of m.hisseler) {
    satirlar.push({
      tip: "borc",
      tarih: h.createdAt,
      aciklama: `Kurban #${h.kurban.kesimSirasi} - ${h.no}. hisse atandı`,
      tutar: h.hisseFiyati,
    });
    for (const o of h.odemeler) {
      satirlar.push({
        tip: "odeme",
        tarih: o.tarih,
        aciklama: `Tahsilat - ${o.yontem}`,
        tutar: o.toplamTutar,
        dekontNo: o.dekontNo,
      });
    }
  }
  satirlar.sort((a, b) => a.tarih.getTime() - b.tarih.getTime());

  let bakiye = 0;

  return (
    <AppShell>
      <SayfaBaslik
        baslik={`Ekstre — ${m.adSoyad}`}
        altBaslik={m.telefon ?? "Telefon yok"}
        aksiyonlar={
          <Link
            href="/musteriler/ekstre"
            className={buttonVariants({ variant: "outline" })}
          >
            <ArrowLeft size={16} className="mr-1" />
            Geri
          </Link>
        }
      />

      <div className="grid grid-cols-3 gap-4 p-6 sm:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Toplam Bedel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-tabular text-2xl font-bold">{formatPara(toplamBedel)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ödenen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-tabular text-2xl font-bold text-green-600">
              {formatPara(toplamOdeme)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Kalan</CardTitle>
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
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Tarih</th>
                  <th className="px-4 py-2 font-medium">Açıklama</th>
                  <th className="px-4 py-2 font-medium text-right">Borç</th>
                  <th className="px-4 py-2 font-medium text-right">Ödeme</th>
                  <th className="px-4 py-2 font-medium text-right">Bakiye</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {satirlar.map((s, i) => {
                  if (s.tip === "borc") bakiye = yuvarla(bakiye + s.tutar);
                  else bakiye = yuvarla(bakiye - s.tutar);
                  return (
                    <tr key={i}>
                      <td className="px-4 py-2 text-xs">
                        {formatTarihSaat(s.tarih)}
                      </td>
                      <td className="px-4 py-2">
                        {s.aciklama}
                        {s.tip === "odeme" && (
                          <Badge variant="secondary" className="ml-2 font-mono text-xs">
                            {s.dekontNo}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right font-tabular">
                        {s.tip === "borc" ? formatPara(s.tutar) : "—"}
                      </td>
                      <td className="px-4 py-2 text-right font-tabular text-green-600">
                        {s.tip === "odeme" ? formatPara(s.tutar) : "—"}
                      </td>
                      <td
                        className={`px-4 py-2 text-right font-tabular font-semibold ${
                          bakiye > 0 ? "text-amber-600" : "text-green-600"
                        }`}
                      >
                        {formatPara(bakiye)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
