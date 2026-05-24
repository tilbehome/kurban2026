import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";

export const dynamic = "force-dynamic";

interface ExportSecenek {
  ad: string;
  aciklama: string;
  href: string;
}

const SECENEKLER: ExportSecenek[] = [
  {
    ad: "Borçlular Listesi",
    aciklama: "Tüm borçlu müşteriler, kalan tutarlarıyla birlikte",
    href: "/api/raporlar/borclular/excel",
  },
];

export default function ExcelIndirmeMerkeziPage() {
  return (
    <AppShell>
      <SayfaBaslik
        baslik="Excel İndirme Merkezi"
        altBaslik="Tek tıkla rapor indir"
      />

      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-3">
        {SECENEKLER.map((s) => (
          <Card key={s.href}>
            <CardHeader>
              <div className="bg-primary/10 text-primary mb-2 flex h-10 w-10 items-center justify-center rounded-md">
                <FileSpreadsheet size={20} />
              </div>
              <CardTitle className="text-base">{s.ad}</CardTitle>
              <CardDescription>{s.aciklama}</CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href={s.href}
                className={buttonVariants({ variant: "outline" })}
              >
                <FileSpreadsheet size={16} className="mr-1" />
                İndir (.xlsx)
              </a>
            </CardContent>
          </Card>
        ))}
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="text-base">Diğer Raporlar</CardTitle>
            <CardDescription>
              Tahsilat, kasa ve müşteri özetleri için Excel export geliştirme aşamasında.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </AppShell>
  );
}
