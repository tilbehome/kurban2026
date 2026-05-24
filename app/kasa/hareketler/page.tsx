import Link from "next/link";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/shared/lib/prisma";
import { formatPara } from "@/shared/lib/para";
import { formatTarihSaat } from "@/shared/lib/tarih";
import { ArrowLeftRight } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ sayfa?: string; tip?: string }>;
}

const SAYFA_BASINA = 100;

export default async function KasaHareketleriPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const sayfa = Math.max(1, Number.parseInt(sp.sayfa ?? "1", 10) || 1);
  const tip = sp.tip;

  const where = tip ? { tip } : {};

  const [hareketler, toplam] = await Promise.all([
    prisma.kasaHareketi.findMany({
      where,
      orderBy: { tarih: "desc" },
      take: SAYFA_BASINA,
      skip: (sayfa - 1) * SAYFA_BASINA,
      include: {
        kullanici: { select: { adSoyad: true } },
      },
    }),
    prisma.kasaHareketi.count({ where }),
  ]);

  const toplamSayfa = Math.ceil(toplam / SAYFA_BASINA);

  const filtreler: { ad: string; deger: string | undefined }[] = [
    { ad: "Hepsi", deger: undefined },
    { ad: "Tahsilat", deger: "tahsilat" },
    { ad: "Gider", deger: "gider" },
    { ad: "Açılış", deger: "acilis" },
    { ad: "Kapanış", deger: "kapanis" },
  ];

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Kasa Hareketleri"
        altBaslik={`${toplam} hareket · Sayfa ${sayfa}/${toplamSayfa || 1}`}
      />

      <div className="p-6 sm:p-8">
        <div className="mb-4 flex flex-wrap gap-1 rounded-md border p-1">
          {filtreler.map((f) => {
            const aktif = (f.deger ?? "") === (tip ?? "");
            return (
              <Link
                key={f.ad}
                href={f.deger ? `/kasa/hareketler?tip=${f.deger}` : "/kasa/hareketler"}
                className={`rounded px-3 py-1.5 text-sm transition-colors ${
                  aktif
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {f.ad}
              </Link>
            );
          })}
        </div>

        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Tarih</th>
                  <th className="px-4 py-2 font-medium">Tip</th>
                  <th className="px-4 py-2 font-medium">Açıklama</th>
                  <th className="px-4 py-2 font-medium">Yöntem</th>
                  <th className="px-4 py-2 font-medium text-right">Tutar</th>
                  <th className="px-4 py-2 font-medium">Kasiyer</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {hareketler.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-muted-foreground px-4 py-12 text-center"
                    >
                      <ArrowLeftRight
                        size={28}
                        className="mx-auto mb-2 text-muted-foreground/40"
                      />
                      Hareket yok.
                    </td>
                  </tr>
                ) : (
                  hareketler.map((h) => (
                    <tr key={h.id}>
                      <td className="px-4 py-2 text-xs">
                        {formatTarihSaat(h.tarih)}
                      </td>
                      <td className="px-4 py-2">
                        <Badge
                          variant={h.tip === "gider" ? "destructive" : "secondary"}
                        >
                          {h.tip}
                        </Badge>
                      </td>
                      <td className="px-4 py-2">{h.aciklama}</td>
                      <td className="px-4 py-2">
                        <Badge variant="secondary">{h.yontem}</Badge>
                      </td>
                      <td
                        className={`px-4 py-2 text-right font-tabular font-semibold ${
                          h.tip === "gider" ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {h.tip === "gider" ? "-" : "+"}
                        {formatPara(h.tutar)}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {h.kullanici.adSoyad}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {toplamSayfa > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            {sayfa > 1 && (
              <Link
                href={`/kasa/hareketler?sayfa=${sayfa - 1}${tip ? `&tip=${tip}` : ""}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                ← Önceki
              </Link>
            )}
            <span className="text-muted-foreground text-sm">
              {sayfa} / {toplamSayfa}
            </span>
            {sayfa < toplamSayfa && (
              <Link
                href={`/kasa/hareketler?sayfa=${sayfa + 1}${tip ? `&tip=${tip}` : ""}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Sonraki →
              </Link>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
