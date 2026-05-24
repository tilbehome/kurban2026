import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Sparkles, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/lib/utils";
import { GeriDonButonu } from "./GeriDonButonu";
import type { SayfaFazi } from "@/shared/lib/sidebar-config";

interface PlaceholderSayfaProps {
  baslik: string;
  aciklama: string;
  ikon: LucideIcon;
  faz?: SayfaFazi;
  ozellikler?: string[];
  /** Geri dön butonu için server-side href (verilirse client history.back yerine bu kullanılır) */
  geriHref?: string;
  /** İkincil aksiyon (örn. "Müşteriler" sayfasına dön) */
  alternatifLink?: { ad: string; href: string };
}

const FAZ_ROZETLERI: Record<
  SayfaFazi,
  { metin: string; stil: string }
> = {
  bayram: {
    metin: "Bayram Öncesi",
    stil: "bg-orange-100 text-orange-800 ring-orange-200",
  },
  sonrasi: {
    metin: "Bayram Sonrası",
    stil: "bg-blue-100 text-blue-800 ring-blue-200",
  },
  gelecek: {
    metin: "TilbeCore Faz 2",
    stil: "bg-purple-100 text-purple-800 ring-purple-200",
  },
};

/**
 * "Geliyor" sayfası — Bayram sonrası yapılacak modüller için.
 *
 * Server Component — LucideIcon prop'unu kendi içinde render eder, client'a
 * geçirmez. Sadece interaktif "Geri" butonu ayrı client component.
 */
export function PlaceholderSayfa({
  baslik,
  aciklama,
  ikon: Ikon,
  faz = "sonrasi",
  ozellikler = [],
  geriHref,
  alternatifLink,
}: PlaceholderSayfaProps) {
  const fazRozet = FAZ_ROZETLERI[faz];

  return (
    <div className="from-background via-background to-primary/5 flex min-h-full items-center justify-center bg-linear-to-br p-6">
      <Card className="w-full max-w-2xl border-2 shadow-xl">
        <CardContent className="px-6 py-12 sm:px-10 sm:py-16">
          {/* Üst rozet */}
          <div className="mb-6 flex justify-center">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset",
                fazRozet.stil,
              )}
            >
              <Sparkles size={12} />
              {fazRozet.metin}
            </span>
          </div>

          {/* Büyük ikon */}
          <div className="mb-6 flex justify-center">
            <div className="from-primary to-primary/70 ring-primary/20 flex h-24 w-24 items-center justify-center rounded-3xl bg-linear-to-br text-white shadow-lg ring-4">
              <Ikon size={48} strokeWidth={1.5} />
            </div>
          </div>

          {/* Başlık */}
          <div className="mb-4 text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {baslik}
            </h1>
            <p className="text-primary mt-2 text-base font-medium">
              🎯 Yakında Sizinle!
            </p>
          </div>

          {/* Açıklama */}
          <p className="text-muted-foreground mx-auto mb-8 max-w-xl text-center text-base leading-relaxed">
            {aciklama}
          </p>

          {/* Özellik listesi */}
          {ozellikler.length > 0 && (
            <div className="bg-muted/50 mb-8 rounded-xl p-5">
              <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                Bu modülde olacaklar
              </p>
              <ul className="space-y-2">
                {ozellikler.map((oz) => (
                  <li
                    key={oz}
                    className="flex items-start gap-2.5 text-sm leading-relaxed"
                  >
                    <span className="bg-primary/10 text-primary mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    <span>{oz}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Aksiyon butonları */}
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            {geriHref ? (
              <Link
                href={geriHref}
                className={buttonVariants({ variant: "outline" })}
              >
                Geri Dön
              </Link>
            ) : (
              <GeriDonButonu />
            )}
            {alternatifLink && (
              <Link
                href={alternatifLink.href}
                className={buttonVariants({ variant: "default" })}
              >
                {alternatifLink.ad}
              </Link>
            )}
          </div>

          {/* Alt bilgi */}
          <p className="text-muted-foreground mt-8 text-center text-xs">
            <Badge variant="outline" className="mr-2">
              TilbeCore
            </Badge>
            Burhan Bey&apos;in ihtiyaçlarına göre öncelik sıralıyoruz.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
