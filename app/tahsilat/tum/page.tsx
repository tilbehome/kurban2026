import Link from "next/link";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/shared/lib/prisma";
import { formatPara } from "@/shared/lib/para";
import { formatTarihSaat } from "@/shared/lib/tarih";
import { Receipt } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ sayfa?: string }>;
}

const SAYFA_BASINA = 50;

export default async function TumTahsilatlarPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const sayfa = Math.max(1, Number.parseInt(sp.sayfa ?? "1", 10) || 1);

  const [odemeler, toplam] = await Promise.all([
    prisma.odeme.findMany({
      orderBy: { tarih: "desc" },
      take: SAYFA_BASINA,
      skip: (sayfa - 1) * SAYFA_BASINA,
      include: {
        hisse: {
          include: {
            musteri: { select: { adSoyad: true } },
            kurban: { select: { kesimSirasi: true } },
          },
        },
        kullanici: { select: { adSoyad: true } },
      },
    }),
    prisma.odeme.count(),
  ]);

  const toplamSayfa = Math.ceil(toplam / SAYFA_BASINA);

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Tüm Tahsilatlar"
        altBaslik={`${toplam} işlem · Sayfa ${sayfa}/${toplamSayfa}`}
      />

      <div className="p-6 sm:p-8">
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Tarih</th>
                  <th className="px-4 py-2 font-medium">Dekont</th>
                  <th className="px-4 py-2 font-medium">Müşteri</th>
                  <th className="px-4 py-2 font-medium">Kurban</th>
                  <th className="px-4 py-2 font-medium">Yöntem</th>
                  <th className="px-4 py-2 font-medium text-right">Tutar</th>
                  <th className="px-4 py-2 font-medium">Kasiyer</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {odemeler.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-muted-foreground px-4 py-12 text-center"
                    >
                      <Receipt
                        size={28}
                        className="mx-auto mb-2 text-muted-foreground/40"
                      />
                      Henüz tahsilat yok.
                    </td>
                  </tr>
                ) : (
                  odemeler.map((o) => (
                    <tr
                      key={o.id}
                      className={o.iptal ? "opacity-60 line-through" : ""}
                    >
                      <td className="px-4 py-2 text-xs">
                        {formatTarihSaat(o.tarih)}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">{o.dekontNo}</td>
                      <td className="px-4 py-2">
                        {o.hisse.musteri?.adSoyad ?? "—"}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">
                        #{o.hisse.kurban.kesimSirasi}.{o.hisse.no}
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant="secondary">{o.yontem}</Badge>
                      </td>
                      <td className="px-4 py-2 text-right font-tabular font-semibold">
                        {formatPara(o.toplamTutar)}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {o.kullanici.adSoyad}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Link
                          href={`/api/tahsilat/dekont/${o.id}`}
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

        {toplamSayfa > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            {sayfa > 1 && (
              <Link
                href={`/tahsilat/tum?sayfa=${sayfa - 1}`}
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
                href={`/tahsilat/tum?sayfa=${sayfa + 1}`}
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
