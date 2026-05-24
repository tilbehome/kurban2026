import Link from "next/link";
import { AppShell } from "@/shared/components/AppShell";
import { SayfaBaslik } from "@/shared/components/SayfaBaslik";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { borclular } from "@/modules/raporlar/lib/rapor.service";
import { formatPara } from "@/shared/lib/para";
import { FileSpreadsheet, MessageCircle, Phone, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ min?: string; siralama?: "borc" | "ad" }>;
}

export default async function BorclularPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const minBorc = Number.parseFloat(sp.min ?? "0") || 0;
  const siralama = sp.siralama ?? "borc";

  let liste = await borclular();
  if (minBorc > 0) {
    liste = liste.filter((b) => b.kalan >= minBorc);
  }
  if (siralama === "ad") {
    liste.sort((a, b) => a.adSoyad.localeCompare(b.adSoyad, "tr"));
  }

  const toplamBorc = liste.reduce((s, b) => s + b.kalan, 0);

  return (
    <AppShell>
      <SayfaBaslik
        baslik="Borçlular Listesi"
        altBaslik={`${liste.length} borçlu · ${formatPara(toplamBorc)} toplam alacak`}
        aksiyonlar={
          <a
            href="/api/raporlar/borclular/excel"
            className={buttonVariants({ variant: "outline" })}
          >
            <FileSpreadsheet size={16} className="mr-1" />
            Excel İndir
          </a>
        }
      />

      <div className="p-6 sm:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">Sırala:</span>
          <Link
            href={`/musteriler/borclular${minBorc ? `?min=${minBorc}` : ""}`}
            className={`rounded px-3 py-1.5 text-sm transition-colors ${
              siralama === "borc"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted border"
            }`}
          >
            Borç (büyükten küçüğe)
          </Link>
          <Link
            href={`/musteriler/borclular?siralama=ad${minBorc ? `&min=${minBorc}` : ""}`}
            className={`rounded px-3 py-1.5 text-sm transition-colors ${
              siralama === "ad"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted border"
            }`}
          >
            İsme göre (A-Z)
          </Link>

          <span className="ml-4 text-muted-foreground text-sm">Min borç:</span>
          {[0, 10000, 50000, 100000].map((m) => (
            <Link
              key={m}
              href={`/musteriler/borclular?siralama=${siralama}${m ? `&min=${m}` : ""}`}
              className={`rounded px-2 py-1 text-xs transition-colors ${
                minBorc === m
                  ? "bg-amber-200 text-amber-900"
                  : "text-muted-foreground hover:bg-muted border"
              }`}
            >
              {m === 0 ? "Hepsi" : formatPara(m)}
            </Link>
          ))}
        </div>

        <Card>
          {liste.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center">
              {minBorc > 0
                ? `${formatPara(minBorc)} ve üzeri borçlu yok.`
                : "Tüm müşteriler ödemiş 🎉"}
            </p>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Müşteri</th>
                  <th className="px-4 py-2 font-medium">Telefon</th>
                  <th className="px-4 py-2 font-medium text-right">Hisse</th>
                  <th className="px-4 py-2 font-medium text-right">Bedel</th>
                  <th className="px-4 py-2 font-medium text-right">Ödenen</th>
                  <th className="px-4 py-2 font-medium text-right">Kalan</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {liste.map((b) => (
                  <tr key={b.musteriId} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-medium">{b.adSoyad}</td>
                    <td className="px-4 py-2.5 text-xs">
                      {b.telefon ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${b.telefon}`}
                            className="text-muted-foreground hover:underline"
                            title="Ara"
                          >
                            <Phone size={11} className="inline" />{" "}
                            {b.telefon}
                          </a>
                          <a
                            href={`https://wa.me/${b.telefon.replace(/\D/g, "")}?text=${encodeURIComponent(
                              `Sayın ${b.adSoyad}, Tilbe Kurban kalan ödemeniz: ${formatPara(b.kalan)}. Detaylar için 0530 889 54 34. Bayramınız mübarek olsun.`,
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-green-600 hover:text-green-700"
                            title="WhatsApp hatırlatma gönder"
                          >
                            <MessageCircle size={14} />
                          </a>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Telefon yok
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-tabular">
                      {b.hisseSayisi}
                    </td>
                    <td className="px-4 py-2.5 text-right font-tabular">
                      {formatPara(b.toplamBedel)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-tabular text-green-600">
                      {formatPara(b.toplamOdenen)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-tabular font-bold text-amber-600">
                      {formatPara(b.kalan)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        href={`/tahsilat/musteri/${b.musteriId}`}
                        className={buttonVariants({ size: "sm" })}
                      >
                        <Wallet size={12} className="mr-1" />
                        Tahsilat
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
