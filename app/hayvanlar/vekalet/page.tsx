import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/shared/lib/prisma";
import { formatTarih } from "@/shared/lib/tarih";
import { FileCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function VekaletListesiPage() {
  const hisseler = await prisma.hisse.findMany({
    where: { musteriId: { not: null } },
    include: {
      musteri: { select: { adSoyad: true, telefon: true } },
      kurban: { select: { kesimSirasi: true } },
    },
    orderBy: [
      { vekaletAlindi: "asc" },
      { kurban: { kesimSirasi: "asc" } },
      { no: "asc" },
    ],
  });

  const vekaleti = hisseler.filter((h) => h.vekaletAlindi).length;
  const bekleyen = hisseler.length - vekaleti;

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Vekalet Listesi"
        altBaslik={`${vekaleti} alındı · ${bekleyen} bekliyor`}
      />

      <div className="p-6 sm:p-8">
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Müşteri</th>
                  <th className="px-4 py-2 font-medium">Telefon</th>
                  <th className="px-4 py-2 font-medium">Kurban</th>
                  <th className="px-4 py-2 font-medium">Vekalet</th>
                  <th className="px-4 py-2 font-medium">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {hisseler.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-muted-foreground px-4 py-10 text-center"
                    >
                      Atanmış hisse yok.
                    </td>
                  </tr>
                ) : (
                  hisseler.map((h) => (
                    <tr key={h.id}>
                      <td className="px-4 py-2 font-medium">
                        {h.musteri?.adSoyad ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {h.musteri?.telefon ?? "—"}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">
                        #{h.kurban.kesimSirasi}.{h.no}
                      </td>
                      <td className="px-4 py-2">
                        {h.vekaletAlindi ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            <FileCheck size={12} className="mr-1" />
                            Alındı
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Bekliyor</Badge>
                        )}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {h.vekaletTarihi ? formatTarih(h.vekaletTarihi) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <p className="text-muted-foreground mt-3 text-xs">
          Vekalet onayı için müşteri detay sayfasında "Vekalet Aldım" butonu eklenecek
          (geliştirme).
        </p>
      </div>
    </AppShell>
  );
}
