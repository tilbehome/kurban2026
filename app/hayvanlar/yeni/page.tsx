import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { YeniKurbanForm } from "./YeniKurbanForm";

export const dynamic = "force-dynamic";

export default function YeniKurbanPage() {
  return (
    <AppShell>
      <SayfaBaslik
        baslik="Yeni Kurban Ekle"
        altBaslik="Kesim sırası, küpe ve hisse bilgisi"
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
      <div className="p-6 sm:p-8">
        <Card className="max-w-xl">
          <CardContent className="pt-6">
            <YeniKurbanForm />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
