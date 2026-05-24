import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { musterileriListele } from "@/modules/musteriler/lib/musteri.service";
import { formatPara } from "@/shared/lib/para";
import { Search } from "lucide-react";
import { MusteriAramaInput } from "../MusteriAramaInput";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ arama?: string }>;
}

export default async function MusteriAraPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const arama = sp.arama?.trim() ?? "";
  const sonuclar = arama.length >= 2
    ? (await musterileriListele({ arama, durum: "hepsi", limit: 100 })).liste
    : [];

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Müşteri Ara"
        altBaslik="İsim, telefon veya TC ile detaylı arama"
      />
      <div className="p-6 sm:p-8">
        <div className="mb-4 max-w-xl">
          <MusteriAramaInput baslangic={arama} hedef="/musteriler/ara" />
        </div>

        {arama.length < 2 ? (
          <Card className="flex flex-col items-center justify-center gap-2 p-12 text-center">
            <Search size={32} className="text-muted-foreground/40" />
            <p className="text-muted-foreground">
              En az 2 karakter girin (ad, soyad, telefon, TC).
            </p>
          </Card>
        ) : sonuclar.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <Search size={32} className="text-muted-foreground/40" />
            <p className="text-muted-foreground">
              "{arama}" için sonuç bulunamadı.
            </p>
            <Link href="/musteriler/yeni" className={buttonVariants()}>
              + Yeni Müşteri Ekle
            </Link>
          </Card>
        ) : (
          <Card>
            <p className="border-b px-4 py-2 text-xs text-muted-foreground">
              {sonuclar.length} sonuç bulundu
            </p>
            <div className="divide-y">
              {sonuclar.map((m) => (
                <Link
                  key={m.id}
                  href={`/musteriler/${m.id}`}
                  className="hover:bg-muted/30 flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{m.adSoyad}</span>
                    <span className="text-muted-foreground text-xs">
                      {m.telefon ?? "Telefon yok"} · {m.hisseSayisi} hisse
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-tabular text-sm font-semibold">
                      {formatPara(m.kalan)}
                    </span>
                    {m.kalan > 0 ? (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                        Borçlu
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        Tamam
                      </Badge>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
