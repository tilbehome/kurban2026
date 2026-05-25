"use client";

import { Search, LayoutGrid, List, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  type DurumKategori,
  type SiralaTip,
  type GorunumTip,
  type HisseGrubuFiltre,
  HISSE_GRUBU_FILTRELERI,
  HISSE_GRUBU_ETIKET,
} from "@/modules/hayvanlar/lib/kurban-filtre";

interface Props {
  sorgu: string;
  setSorgu: (s: string) => void;
  kategori: DurumKategori;
  setKategori: (k: DurumKategori) => void;
  hisseGrubuFiltre: HisseGrubuFiltre;
  setHisseGrubuFiltre: (h: HisseGrubuFiltre) => void;
  sirala: SiralaTip;
  setSirala: (s: SiralaTip) => void;
  gorunum: GorunumTip;
  setGorunum: (g: GorunumTip) => void;
  sayilar: Record<DurumKategori, number>;
}

const KATEGORI_ETIKET: Record<DurumKategori, string> = {
  hepsi: "Hepsi",
  "bos-hisseli": "Boş Hisse",
  hazir: "Hazır",
  kesimde: "Kesimde",
  bitti: "Bitti",
  iptal: "İptal",
};

const SIRALA_ETIKET: Record<SiralaTip, string> = {
  sira: "Sıra ↑",
  bedel: "Bedel ↓",
  kalan: "Kalan ↓",
  ilerleme: "İlerleme ↓",
};

export function HayvanlarGaleriUst({
  sorgu,
  setSorgu,
  kategori,
  setKategori,
  hisseGrubuFiltre,
  setHisseGrubuFiltre,
  sirala,
  setSirala,
  gorunum,
  setGorunum,
  sayilar,
}: Props) {
  return (
    <div className="space-y-3 border-b pb-4">
      <div className="relative max-w-md">
        <Search
          size={16}
          className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
        />
        <Input
          value={sorgu}
          onChange={(e) => setSorgu(e.target.value)}
          placeholder="No, küpe, hissedar veya telefonla ara..."
          className="pr-9 pl-9"
        />
        {sorgu && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSorgu("")}
            className="absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2 p-0"
            aria-label="Temizle"
          >
            <X size={12} />
          </Button>
        )}
      </div>

      <div>
        <div className="text-muted-foreground mb-1.5 text-xs font-medium">
          Durum
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(KATEGORI_ETIKET) as DurumKategori[]).map((k) => (
            <Button
              key={k}
              variant={kategori === k ? "default" : "outline"}
              size="sm"
              onClick={() => setKategori(k)}
              className="h-8 gap-1.5"
            >
              {KATEGORI_ETIKET[k]}
              <span
                className={`rounded-full px-1.5 text-[10px] font-bold ${
                  kategori === k
                    ? "bg-white/20 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {sayilar[k]}
              </span>
            </Button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-muted-foreground mb-1.5 text-xs font-medium">
          Kg Grubu
        </div>
        <div className="flex flex-wrap gap-1.5">
          {HISSE_GRUBU_FILTRELERI.map((g) => (
            <Button
              key={g}
              variant={hisseGrubuFiltre === g ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setHisseGrubuFiltre(g)}
              className="h-7 text-xs"
            >
              {HISSE_GRUBU_ETIKET[g]}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-muted-foreground mb-1.5 text-xs font-medium">
            Sırala
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(SIRALA_ETIKET) as SiralaTip[]).map((s) => (
              <Button
                key={s}
                variant={sirala === s ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSirala(s)}
                className="h-7 text-xs"
              >
                {SIRALA_ETIKET[s]}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-muted-foreground mb-1.5 text-xs font-medium">
            Görünüm
          </div>
          <div className="flex gap-1.5">
            <Button
              variant={gorunum === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setGorunum("grid")}
              className="h-7"
              aria-label="Grid"
            >
              <LayoutGrid size={14} />
            </Button>
            <Button
              variant={gorunum === "liste" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setGorunum("liste")}
              className="h-7"
              aria-label="Liste"
            >
              <List size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
