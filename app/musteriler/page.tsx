import Link from "next/link";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { musterileriListele } from "@/modules/musteriler/lib/musteri.service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatPara } from "@/shared/lib/para";
import { UserPlus, Search } from "lucide-react";
import { MusteriAramaInput } from "./MusteriAramaInput";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ arama?: string; durum?: "hepsi" | "borclu" | "odendi" }>;
}

export default async function MusterilerPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { liste, toplam } = await musterileriListele({
    arama: sp.arama,
    durum: sp.durum ?? "hepsi",
    limit: 200,
  });

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Müşteriler"
        altBaslik={`${toplam} müşteri kayıtlı · ${liste.length} gösteriliyor`}
        aksiyonlar={
          <Link href="/musteriler/yeni" className={buttonVariants()}>
            <UserPlus size={16} className="mr-1" />
            Yeni Müşteri
          </Link>
        }
      />

      <div className="p-6 sm:p-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <MusteriAramaInput baslangic={sp.arama ?? ""} />
          <DurumFiltresi mevcut={sp.durum ?? "hepsi"} arama={sp.arama} />
        </div>

        <Card>
          <table className="w-full">
            <thead className="bg-muted/40 text-muted-foreground text-left text-xs">
              <tr>
                <th className="px-4 py-3 font-medium">Ad Soyad</th>
                <th className="px-4 py-3 font-medium">Telefon</th>
                <th className="px-4 py-3 font-medium text-right">Hisse</th>
                <th className="px-4 py-3 font-medium text-right">Bedel</th>
                <th className="px-4 py-3 font-medium text-right">Ödenen</th>
                <th className="px-4 py-3 font-medium text-right">Kalan</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {liste.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <Search
                      size={28}
                      className="text-muted-foreground/40 mx-auto mb-2"
                    />
                    <p className="text-muted-foreground">Müşteri bulunamadı.</p>
                  </td>
                </tr>
              ) : (
                liste.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{m.adSoyad}</td>
                    <td className="text-muted-foreground px-4 py-3 font-mono text-xs">
                      {m.telefon ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-tabular">
                      {m.hisseSayisi}
                    </td>
                    <td className="px-4 py-3 text-right font-tabular">
                      {formatPara(m.toplamBedel)}
                    </td>
                    <td className="px-4 py-3 text-right font-tabular">
                      {formatPara(m.toplamOdenen)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold font-tabular">
                      {formatPara(m.kalan)}
                    </td>
                    <td className="px-4 py-3">
                      <DurumRozet durum={m.durum} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/musteriler/${m.id}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Detay
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </AppShell>
  );
}

function DurumRozet({ durum }: { durum: "odendi" | "kismi" | "odenmedi" | "yok" }) {
  if (durum === "odendi") {
    return (
      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
        Ödendi
      </Badge>
    );
  }
  if (durum === "kismi") {
    return (
      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
        Kısmi
      </Badge>
    );
  }
  if (durum === "odenmedi") {
    return (
      <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
        Ödenmedi
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-muted-foreground">
      Hisse yok
    </Badge>
  );
}

function DurumFiltresi({
  mevcut,
  arama,
}: {
  mevcut: "hepsi" | "borclu" | "odendi";
  arama?: string;
}) {
  const filtreler: { deger: typeof mevcut; ad: string }[] = [
    { deger: "hepsi", ad: "Hepsi" },
    { deger: "borclu", ad: "Borçlu" },
    { deger: "odendi", ad: "Ödenmiş" },
  ];

  return (
    <div className="flex gap-1 rounded-md border p-1">
      {filtreler.map((f) => {
        const qs = new URLSearchParams();
        if (arama) qs.set("arama", arama);
        if (f.deger !== "hepsi") qs.set("durum", f.deger);
        const yol = "/musteriler" + (qs.toString() ? `?${qs}` : "");
        const aktif = f.deger === mevcut;
        return (
          <Link
            key={f.deger}
            href={yol}
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
  );
}
