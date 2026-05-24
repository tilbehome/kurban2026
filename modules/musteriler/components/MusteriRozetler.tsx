import { Badge } from "@/components/ui/badge";
import { PhoneOff, Users2, Star } from "lucide-react";

export interface MusteriRozetVerisi {
  telefon: string | null;
  hisseSayisi: number;
  /** Bu isimle başka müşteri var mı (tekrarlı isim uyarısı) */
  ayniIsimSayisi?: number;
  /** Kayıt tarihinden bugüne yıl farkı */
  kayitYil?: number;
}

interface MusteriRozetlerProps {
  veri: MusteriRozetVerisi;
  /** "sm" küçük, "md" varsayılan */
  boyut?: "sm" | "md";
}

export function MusteriRozetler({ veri, boyut = "sm" }: MusteriRozetlerProps) {
  const cls =
    boyut === "sm"
      ? "px-1.5 py-0 text-[10px] gap-0.5 h-5"
      : "px-2 py-0.5 text-xs gap-1 h-6";
  const ikonBoyut = boyut === "sm" ? 10 : 12;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {!veri.telefon && (
        <Badge
          variant="secondary"
          className={`${cls} bg-red-100 text-red-700 hover:bg-red-100`}
          title="Telefon kayıtlı değil"
        >
          <PhoneOff size={ikonBoyut} />
          Tel yok
        </Badge>
      )}
      {veri.hisseSayisi > 1 && (
        <Badge
          variant="secondary"
          className={`${cls} bg-orange-100 text-orange-700 hover:bg-orange-100`}
          title={`${veri.hisseSayisi} hisseye sahip`}
        >
          {veri.hisseSayisi} hisse
        </Badge>
      )}
      {veri.ayniIsimSayisi && veri.ayniIsimSayisi > 1 && (
        <Badge
          variant="secondary"
          className={`${cls} bg-amber-100 text-amber-800 hover:bg-amber-100`}
          title={`Aynı isimden ${veri.ayniIsimSayisi} müşteri var — telefonla ayırt edin`}
        >
          <Users2 size={ikonBoyut} />
          Tekrarlı
        </Badge>
      )}
      {veri.kayitYil != null && veri.kayitYil >= 1 && (
        <Badge
          variant="secondary"
          className={`${cls} bg-green-100 text-green-700 hover:bg-green-100`}
          title={`${veri.kayitYil + 1}. yıl müşterisi`}
        >
          <Star size={ikonBoyut} />
          {veri.kayitYil + 1}. yıl
        </Badge>
      )}
    </div>
  );
}
