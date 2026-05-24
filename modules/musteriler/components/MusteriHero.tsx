import Link from "next/link";
import { MusteriAvatar } from "./MusteriAvatar";
import { MusteriRozetler } from "./MusteriRozetler";
import { buttonVariants } from "@/components/ui/button";
import { formatPara } from "@/shared/lib/para";
import { formatTarih } from "@/shared/lib/tarih";
import { ArrowLeft, Phone, MessageCircle } from "lucide-react";

interface MusteriHeroProps {
  musteri: {
    id: string;
    adSoyad: string;
    telefon: string | null;
    tcKimlik: string | null;
    adres: string | null;
    createdAt: Date;
  };
  ayniIsim: number;
  hisseSayisi: number;
  toplamBedel: number;
  toplamOdenen: number;
  kalan: number;
  tahsilatYuzde: number;
  kayitYil: number;
}

/**
 * Müşteri detay sayfasının üst hero kartı (avatar + isim + bakiye).
 */
export function MusteriHero({
  musteri,
  ayniIsim,
  hisseSayisi,
  toplamBedel,
  toplamOdenen,
  kalan,
  tahsilatYuzde,
  kayitYil,
}: MusteriHeroProps) {
  return (
    <div className="border-b bg-white px-6 py-5 sm:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <MusteriAvatar musteriId={musteri.id} adSoyad={musteri.adSoyad} boyut="lg" />
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{musteri.adSoyad}</h1>
              <MusteriRozetler
                boyut="md"
                veri={{
                  telefon: musteri.telefon,
                  hisseSayisi,
                  ayniIsimSayisi: ayniIsim,
                  kayitYil,
                }}
              />
            </div>
            <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
              {musteri.telefon && (
                <a
                  href={`tel:${musteri.telefon}`}
                  className="flex items-center gap-1 hover:underline"
                >
                  <Phone size={13} />
                  {musteri.telefon}
                </a>
              )}
              {musteri.telefon && (
                <a
                  href={`https://wa.me/${musteri.telefon.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-green-600 hover:underline"
                >
                  <MessageCircle size={13} />
                  WhatsApp
                </a>
              )}
              <span className="text-xs">Kayıt: {formatTarih(musteri.createdAt)}</span>
            </div>
            <Link
              href="/musteriler"
              className={`${buttonVariants({ size: "sm", variant: "outline" })} mt-3`}
            >
              <ArrowLeft size={13} className="mr-1" />
              Müşteri Listesine Dön
            </Link>
          </div>
        </div>

        {/* Bakiye kartı */}
        <div className="rounded-lg border bg-gradient-to-br from-amber-50 to-orange-50 p-4 lg:min-w-[280px]">
          <p className="text-muted-foreground text-xs">Kalan Borç</p>
          <p
            className={`font-tabular text-3xl font-bold ${
              kalan > 0 ? "text-amber-600" : "text-green-600"
            }`}
          >
            {formatPara(kalan)}
          </p>
          <div className="mt-2 text-xs">
            <span className="text-muted-foreground">
              Toplam {formatPara(toplamBedel)}
            </span>
            <span className="mx-1">·</span>
            <span className="text-green-600">Ödenen {formatPara(toplamOdenen)}</span>
          </div>
          <div className="bg-muted mt-2 h-2 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full transition-all"
              style={{ width: `${tahsilatYuzde}%` }}
            />
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            %{tahsilatYuzde} tahsil edildi
          </p>
        </div>
      </div>
    </div>
  );
}
