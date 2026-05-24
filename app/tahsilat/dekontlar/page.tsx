import Link from "next/link";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/shared/lib/prisma";
import { formatPara } from "@/shared/lib/para";
import { formatTarihSaat } from "@/shared/lib/tarih";
import { Receipt, FileText, ExternalLink } from "lucide-react";
import { DekontAraInput } from "./DekontAraInput";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ q?: string; sayfa?: string }>;
}

const SAYFA_BASINA = 50;

export default async function DekontlarPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const sayfa = Math.max(1, Number.parseInt(sp.sayfa ?? "1", 10) || 1);

  const where = q
    ? {
        OR: [
          { dekontNo: { contains: q } },
          { hisse: { musteri: { adSoyad: { contains: q } } } },
        ],
      }
    : {};

  const [odemeler, toplam] = await Promise.all([
    prisma.odeme.findMany({
      where,
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
      },
    }),
    prisma.odeme.count({ where }),
  ]);

  const toplamSayfa = Math.ceil(toplam / SAYFA_BASINA);

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Dekontlar"
        altBaslik={`${toplam} dekont${q ? ` · "${q}" araması` : ""}`}
      />

      <div className="p-6 sm:p-8">
        <div className="mb-4 max-w-md">
          <DekontAraInput baslangic={q} />
        </div>

        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Dekont No</th>
                  <th className="px-4 py-2 font-medium">Tarih</th>
                  <th className="px-4 py-2 font-medium">Müşteri</th>
                  <th className="px-4 py-2 font-medium">Kurban</th>
                  <th className="px-4 py-2 font-medium">Yöntem</th>
                  <th className="px-4 py-2 font-medium text-right">Tutar</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {odemeler.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-muted-foreground px-4 py-12 text-center"
                    >
                      <Receipt
                        size={28}
                        className="mx-auto mb-2 text-muted-foreground/40"
                      />
                      {q ? `"${q}" için dekont yok.` : "Henüz dekont yok."}
                    </td>
                  </tr>
                ) : (
                  odemeler.map((o) => (
                    <tr
                      key={o.id}
                      className={o.iptal ? "opacity-60 line-through" : ""}
                    >
                      <td className="px-4 py-2 font-mono text-xs">
                        <FileText size={12} className="mr-1 inline" />
                        {o.dekontNo}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {formatTarihSaat(o.tarih)}
                      </td>
                      <td className="px-4 py-2">
                        {o.hisse.musteri?.adSoyad ?? "—"}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">
                        #{o.hisse.kurban.kesimSirasi}.{o.hisse.no}
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant={o.iptal ? "destructive" : "secondary"}>
                          {o.iptal ? "İptal" : o.yontem}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-right font-tabular font-semibold">
                        {formatPara(o.toplamTutar)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Link
                          href={`/api/tahsilat/dekont/${o.id}`}
                          target="_blank"
                          className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                          })}
                        >
                          <ExternalLink size={12} className="mr-1" />
                          Aç
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
                href={`/tahsilat/dekontlar?sayfa=${sayfa - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
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
                href={`/tahsilat/dekontlar?sayfa=${sayfa + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
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
