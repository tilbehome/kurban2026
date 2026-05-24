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
    const q = params.toString();
    return `${hedef}${q ? `?${q}` : ""}`;
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5">
      <Link
        href={harfHref(null)}
        className={cn(
          "rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors",
          !aktif
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted",
        )}
      >
        Hepsi
      </Link>
      {ALFABE.map((h) => {
        const dolu = doluHarfler.has(h);
        const seçili = aktif === h;
        return dolu ? (
          <Link
            key={h}
            href={harfHref(h)}
            className={cn(
              "w-6 rounded py-0.5 text-center text-[11px] font-mono font-medium transition-colors",
              seçili
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted",
            )}
          >
            {h}
          </Link>
        ) : (
          <span
            key={h}
            className="text-muted-foreground/30 w-6 cursor-not-allowed py-0.5 text-center text-[11px] font-mono"
            title="Boş"
          >
            {h}
          </span>
        );
      })}
    </div>
  );
}
