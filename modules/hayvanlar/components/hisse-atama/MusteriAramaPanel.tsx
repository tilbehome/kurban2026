"use client";

import { useMemo, useState } from "react";
import { Search, ArrowDownAZ, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/shared/lib/utils";
import { MusteriAramaKart } from "./MusteriAramaKart";
import type { EksikHisseliMusteri } from "@/modules/hayvanlar/types/hisse-atama";

type Filtre = "tum" | "eksik" | "tam" | "yeni";
type Sirala = "ad" | "atanmis-az" | "tutar";

interface MusteriAramaPanelProps {
  musteriler: EksikHisseliMusteri[];
  seciliId: string | null;
  onMusteriSec: (musteri: EksikHisseliMusteri | null) => void;
  dragDevreDisi?: boolean;
}

const FILTRE_ETIKETLERI: Record<Filtre, string> = {
  tum: "Tümü",
  eksik: "Henüz Atama Yok",
  tam: "Atanmış",
  yeni: "Bu Sezon",
};

export function MusteriAramaPanel({
  musteriler,
  seciliId,
  onMusteriSec,
  dragDevreDisi,
}: MusteriAramaPanelProps) {
  const [arama, setArama] = useState("");
  const [filtre, setFiltre] = useState<Filtre>("tum");
  const [sirala, setSirala] = useState<Sirala>("ad");

  const filtreli = useMemo(() => {
    let liste = [...musteriler];

    // Arama
    const q = arama.trim().toLowerCase();
    if (q.length > 0) {
      liste = liste.filter(
        (m) =>
          m.adSoyad.toLowerCase().includes(q) ||
          m.telefon?.toLowerCase().includes(q),
      );
    }

    // Filtre
    if (filtre === "eksik") {
      liste = liste.filter((m) => m.atananHisseSayisi === 0);
    } else if (filtre === "tam") {
      liste = liste.filter((m) => m.atananHisseSayisi > 0);
    }
    // "yeni" filtresi: oluşturulma tarihi servisten gelmediği için şimdi noop

    // Sırala
    if (sirala === "ad") {
      liste.sort((a, b) => a.adSoyad.localeCompare(b.adSoyad, "tr"));
    } else if (sirala === "atanmis-az") {
      liste.sort((a, b) => a.atananHisseSayisi - b.atananHisseSayisi);
    } else if (sirala === "tutar") {
      liste.sort((a, b) => b.toplamBedel - a.toplamBedel);
    }

    return liste;
  }, [musteriler, arama, filtre, sirala]);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Müşteriler</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2.5 overflow-hidden">
        {/* Arama */}
        <div className="relative">
          <Search
            size={14}
            className="text-muted-foreground absolute top-1/2 left-2.5 -translate-y-1/2"
          />
          <Input
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="Ara (isim, telefon)"
            className="h-9 pl-8 text-sm"
          />
          {arama && (
            <button
              type="button"
              onClick={() => setArama("")}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
              aria-label="Aramayı temizle"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filtre chip'leri */}
        <div className="flex flex-wrap gap-1">
          {(Object.keys(FILTRE_ETIKETLERI) as Filtre[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltre(f)}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                filtre === f
                  ? "bg-orange-100 text-orange-800 ring-1 ring-orange-300"
                  : "text-muted-foreground hover:bg-stone-100",
              )}
            >
              {FILTRE_ETIKETLERI[f]}
            </button>
          ))}
        </div>

        {/* Sıralama */}
        <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
          <ArrowDownAZ size={11} />
          <select
            value={sirala}
            onChange={(e) => setSirala(e.target.value as Sirala)}
            className="bg-transparent text-[11px] font-medium outline-none"
          >
            <option value="ad">Ad (A→Z)</option>
            <option value="atanmis-az">Az atanmış önce</option>
            <option value="tutar">Toplam bedel</option>
          </select>
          <span className="ml-auto font-medium">
            {filtreli.length} / {musteriler.length}
          </span>
        </div>

        {/* Liste — virtual scroll yerine basit overflow */}
        <div className="-mr-2 flex flex-1 flex-col gap-1.5 overflow-y-auto pr-2">
          {filtreli.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-xs">
              Sonuç yok
            </p>
          ) : (
            filtreli.map((m) => (
              <MusteriAramaKart
                key={m.id}
                musteri={m}
                secili={m.id === seciliId}
                onSec={() =>
                  onMusteriSec(m.id === seciliId ? null : m)
                }
                dragDevreDisi={dragDevreDisi}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
