import Link from "next/link";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { borclular, kurbanRaporu } from "@/modules/raporlar/lib/rapor.service";
import { formatPara } from "@/shared/lib/para";
import {
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Folder,
  MessageCircle,
  Phone,
  Printer,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RaporlarPage() {
  const [borc, kurban] = await Promise.all([borclular(), kurbanRaporu()]);

  const toplamBorc = borc.reduce((s, b) => s + b.kalan, 0);

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Raporlar"
        altBaslik="Borçlular, kurban özeti, Excel"
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
        {/* Hızlı raporlar — Sprint 13 + 14 + 15 */}
        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Link
            href="/raporlar/kesim-muhasebe"
            className="group rounded-lg border-2 border-orange-200 bg-linear-to-br from-orange-50 to-white p-4 transition-all hover:border-orange-400 hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-orange-100 p-2 text-orange-700 group-hover:bg-orange-200">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">
                  Kesim Sırası Muhasebe Raporu
                </div>
                <div className="text-muted-foreground mt-0.5 text-xs">
                  Her kurban için hissedar + ödeme dökümü (nakit/havale/kart)
                </div>
              </div>
            </div>
          </Link>

          <Link
            href="/raporlar/muhasebe-defteri/yazdir"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-lg border-2 border-red-200 bg-linear-to-br from-red-50 to-white p-4 transition-all hover:border-red-400 hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-red-100 p-2 text-red-700 group-hover:bg-red-200">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    Master Muhasebe Defteri
                  </span>
                  <Badge
                    variant="outline"
                    className="border-red-300 bg-red-100 text-xs text-red-700"
                  >
                    DENETİM
                  </Badge>
                </div>
                <div className="text-muted-foreground mt-0.5 text-xs">
                  14 otomatik kontrol · tutarsızlık tespiti · A4 yazdırılır
                </div>
              </div>
              <Printer className="text-muted-foreground h-4 w-4 self-center" />
            </div>
          </Link>

          <Link
            href="/raporlar/kurban-dosyasi/yazdir"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-lg border-2 border-blue-200 bg-linear-to-br from-blue-50 to-white p-4 transition-all hover:border-blue-400 hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-blue-100 p-2 text-blue-700 group-hover:bg-blue-200">
                <Folder className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Kurban Dosyası</span>
                  <Badge
                    variant="outline"
                    className="border-blue-300 bg-blue-100 text-xs text-blue-700"
                  >
                    TOPLU
                  </Badge>
                </div>
                <div className="text-muted-foreground mt-0.5 text-xs">
                  Her dana için 1 sayfa: künye + finansal + cari hareket
                  dökümü
                </div>
              </div>
              <Printer className="text-muted-foreground h-4 w-4 self-center" />
            </div>
          </Link>
        </div>

        <Tabs defaultValue="borclular">
          <TabsList>
            <TabsTrigger value="borclular">
              Borçlular ({borc.length})
            </TabsTrigger>
            <TabsTrigger value="kurbanlar">Kurbanlar</TabsTrigger>
          </TabsList>

          <TabsContent value="borclular" className="mt-4">
            <Card className="mb-4 border-amber-200 bg-amber-50">
              <CardContent className="pt-4">
                <p className="text-sm text-amber-700">
                  Toplam <strong>{borc.length}</strong> borçlu müşteri ·{" "}
                  <strong>{formatPara(toplamBorc)}</strong> toplam alacak
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                {borc.length === 0 ? (
                  <p className="text-muted-foreground py-12 text-center">
                    Tüm müşteriler ödeme yapmış 🎉
                  </p>
                ) : (
                  <table className="w-full">
                    <thead className="bg-muted/40 text-muted-foreground text-left text-xs">
                      <tr>
                        <th className="px-4 py-2 font-medium">Müşteri</th>
                        <th className="px-4 py-2 font-medium">Telefon</th>
                        <th className="px-4 py-2 font-medium text-right">
                          Hisse
                        </th>
                        <th className="px-4 py-2 font-medium text-right">
                          Bedel
                        </th>
                        <th className="px-4 py-2 font-medium text-right">
                          Ödenen
                        </th>
                        <th className="px-4 py-2 font-medium text-right">
                          Kalan
                        </th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {borc.map((b) => (
                        <tr key={b.musteriId} className="hover:bg-muted/30">
                          <td className="px-4 py-2.5 font-medium">{b.adSoyad}</td>
                          <td className="px-4 py-2.5 text-xs">
                            {b.telefon ? (
                              <div className="flex items-center gap-2">
                                <a
                                  href={`tel:${b.telefon}`}
                                  className="text-muted-foreground hover:underline"
                                >
                                  <Phone size={11} className="inline" />{" "}
                                  {b.telefon}
                                </a>
                                <a
                                  href={`https://wa.me/${b.telefon.replace(/\D/g, "")}?text=${encodeURIComponent(`Merhaba ${b.adSoyad}, Tilbe Kurban ${formatPara(b.kalan)} kalan bakiyenizi hatırlatmak istedik.`)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-green-600"
                                  title="WhatsApp"
                                >
                                  <MessageCircle size={12} />
                                </a>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right font-tabular">
                            {b.hisseSayisi}
                          </td>
                          <td className="px-4 py-2.5 text-right font-tabular">
                            {formatPara(b.toplamBedel)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-tabular text-green-600">
                            {formatPara(b.toplamOdenen)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-tabular font-bold text-amber-600">
                            {formatPara(b.kalan)}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <Link
                              href={`/tahsilat/musteri/${b.musteriId}`}
                              className={buttonVariants({
                                size: "sm",
                                variant: "outline",
                              })}
                            >
                              Ödeme Al
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kurbanlar" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-muted/40 text-muted-foreground text-left text-xs">
                    <tr>
                      <th className="px-4 py-2 font-medium">#</th>
                      <th className="px-4 py-2 font-medium text-right">Hisse</th>
                      <th className="px-4 py-2 font-medium text-right">Bedel</th>
                      <th className="px-4 py-2 font-medium text-right">Ödenen</th>
                      <th className="px-4 py-2 font-medium text-right">Kalan</th>
                      <th className="px-4 py-2 font-medium">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {kurban.map((k) => (
                      <tr key={k.kurbanId}>
                        <td className="px-4 py-2.5 font-mono font-semibold">
                          #{k.kesimSirasi}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {k.dolu} / {k.hisseSayisi}
                        </td>
                        <td className="px-4 py-2.5 text-right font-tabular">
                          {formatPara(k.satisBedeli)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-tabular text-green-600">
                          {formatPara(k.odenen)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-tabular font-bold">
                          {formatPara(k.kalan)}
                        </td>
                        <td className="px-4 py-2.5">
                          {k.kalan <= 0 ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              Tamam
                            </Badge>
                          ) : (
                            <Badge
                              className="bg-amber-100 text-amber-700 hover:bg-amber-100"
                            >
                              {k.kalan > 0 && k.odenen > 0 ? "Kısmi" : "Bekliyor"}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
