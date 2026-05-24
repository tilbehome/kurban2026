import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/shared/lib/prisma";
import { formatPara } from "@/shared/lib/para";
import { formatTarihSaat } from "@/shared/lib/tarih";
import { Ban } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function IptalListesiPage() {
  const iptaller = await prisma.odeme.findMany({
    where: { iptal: true },
    orderBy: { iptalTarihi: "desc" },
    take: 200,
    include: {
      hisse: {
        include: {
          musteri: { select: { adSoyad: true } },
          kurban: { select: { kesimSirasi: true } },
        },
      },
      kullanici: { select: { adSoyad: true } },
    },
  });

  const toplamIptal = iptaller.reduce((s, o) => s + o.toplamTutar, 0);

  return (
    <AppShell>
      <SayfaBaslik
        baslik="İptal / İade"
        altBaslik={`${iptaller.length} iptal · ${formatPara(toplamIptal)} toplam`}
      />

      <div className="p-6 sm:p-8">
        {iptaller.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 p-12 text-center">
            <Ban size={32} className="text-muted-foreground/40" />
            <p className="text-muted-foreground">Henüz iptal işlemi yok.</p>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 font-medium">İptal Tarihi</th>
                    <th className="px-4 py-2 font-medium">Dekont</th>
                    <th className="px-4 py-2 font-medium">Müşteri</th>
                    <th className="px-4 py-2 font-medium">Sebep</th>
                    <th className="px-4 py-2 font-medium text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {iptaller.map((o) => (
                    <tr key={o.id}>
                      <td className="px-4 py-2 text-xs">
                        {o.iptalTarihi ? formatTarihSaat(o.iptalTarihi) : "—"}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">{o.dekontNo}</td>
                      <td className="px-4 py-2">
                        {o.hisse.musteri?.adSoyad ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {o.iptalSebep ?? <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-2 text-right font-tabular font-semibold text-red-600">
                        {formatPara(o.toplamTutar)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
        <p className="text-muted-foreground mt-3 text-xs">
          İptal işlemi için dekontlar listesinden ilgili kaydı seçin (geliştirme).
        </p>
      </div>
    </AppShell>
  );
}
