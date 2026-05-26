import Link from "next/link";
import { cn } from "@/shared/lib/utils";

/** Türkçe alfabesi A-Z + Ç Ğ İ Ö Ş Ü */
export const ALFABE = [
  "A",
  "B",
  "C",
  "Ç",
  "D",
  "E",
  "F",
  "G",
  "Ğ",
  "H",
  "I",
  "İ",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "Ö",
  "P",
  "Q",
  "R",
  "S",
  "Ş",
  "T",
  "U",
  "Ü",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

interface AlfabeSeridiProps {
  /** Hangi harfler dolu (örn. ['A','M','Y']) */
  doluHarfler: Set<string>;
  /** Şu an aktif harf */
  aktif?: string | null;
  /** Diğer query parametrelerini koru */
  digerQuery?: Record<string, string | undefined>;
  /** Hedef sayfa (varsayılan /musteriler) */
  hedef?: string;
}

export function AlfabeSeridi({
  doluHarfler,
  aktif,
  digerQuery = {},
  hedef = "/musteriler",
}: AlfabeSeridiProps) {
  function harfHref(harf: string | null): string {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(digerQuery)) {
      if (v) params.set(k, v);
    }
    if (harf) params.set("harf", harf);
    // Harf değişimi sayfa numarasını sıfırlasın
    params.delete("sayfa");
    const q = params.toString();
    return `${hedef}${q ? `?${q}` : ""}`;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* "Hepsi" — geniş pill buton */}
      <Link
        href={harfHref(null)}
        className={cn(
          "inline-flex h-10 items-center justify-center rounded-full border-2 px-4 text-sm font-semibold transition-all",
          !aktif
            ? "border-orange-500 bg-orange-500 text-white shadow-sm"
            : "border-border bg-white text-foreground hover:border-orange-300 hover:bg-orange-50",
        )}
      >
        Hepsi
      </Link>

      {ALFABE.map((h) => {
        const dolu = doluHarfler.has(h);
        const seciliMi = aktif === h;
        return dolu ? (
          <Link
            key={h}
            href={harfHref(h)}
            aria-current={seciliMi ? "page" : undefined}
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all",
              seciliMi
                ? "scale-110 border-orange-500 bg-orange-500 text-white shadow-md"
                : "border-border bg-white text-foreground hover:scale-110 hover:border-orange-300 hover:bg-orange-50",
            )}
          >
            {h}
          </Link>
        ) : (
          <span
            key={h}
            aria-disabled="true"
            title="Bu harfle başlayan müşteri yok"
            className="inline-flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-full border-2 border-transparent bg-muted/30 text-sm font-bold text-muted-foreground/40"
          >
            {h}
          </span>
        );
      })}
    </div>
  );
}
