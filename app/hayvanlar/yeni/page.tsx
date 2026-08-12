import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { YeniKurbanForm } from "./YeniKurbanForm";
import { masterDataMode } from "@/shared/lib/tenant-master-data-adapter";

export const dynamic = "force-dynamic";

export default function YeniKurbanPage() {
  const postgres = masterDataMode() === "postgres";
  return (
    <AppShell>
      <SayfaBaslik
        baslik="Yeni Kurban Ekle"
        altBaslik={postgres ? "Küpe, gerçek alış bedeli, kilo ve operasyon sırası" : "Kesim sırası, küpe ve hisse bilgisi"}
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
      <div className="mx-auto grid max-w-5xl gap-5 p-4 sm:p-6 md:grid-cols-[minmax(0,1fr)_280px] lg:p-8">
        <Card className="min-w-0">
          <CardContent className="pt-6">
            <YeniKurbanForm tenantPostgres={postgres} />
          </CardContent>
        </Card>
        {postgres ? <aside className="order-first rounded-2xl border bg-card p-4 shadow-sm md:order-last md:sticky md:top-5 md:self-start"><h2 className="font-semibold">Hayvan kaydı</h2><ul className="mt-3 space-y-3 text-sm text-muted-foreground"><li>Küpe aktif sezon içinde benzersizdir.</li><li>Gerçek alış bedeli satış fiyatından ayrı Numeric alanda tutulur.</li><li>İlk kayıtla yedi satılmamış işletme hissesi oluşur; müşteri veya vekâlet üretilmez.</li><li>Dinî uygunluk kararı bu ekranda varsayılmaz; “karar bekliyor” kalır.</li></ul></aside> : null}
      </div>
    </AppShell>
  );
}
