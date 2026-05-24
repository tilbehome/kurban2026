"use client";

import { useMemo, useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/shared/lib/utils";
import { KurbanKart } from "./KurbanKart";
import type {
  KurbanKartVeri,
  HisseKutusuVeri,
  DragPayload,
  KurbanDurumRozeti,
} from "@/modules/hayvanlar/types/hisse-atama";

interface StableGridProps {
  kurbanlar: KurbanKartVeri[];
  onHisseDrop: (
    payload: DragPayload,
    kurban: KurbanKartVeri,
    hisse: HisseKutusuVeri,
  ) => void;
  onHisseTikla: (kurban: KurbanKartVeri, hisse: HisseKutusuVeri) => void;
  onHisseIptal?: (kurban: KurbanKartVeri, hisse: HisseKutusuVeri) => void;
  onHisseTransfer?: (
    kurban: KurbanKartVeri,
    hisse: HisseKutusuVeri,
  ) => void;
  dragDevreDisi?: boolean;
  iptalIzni?: boolean;
  transferIzni?: boolean;
}

type FiltreKurban = "tum" | "bos-hisse-var" | "tam-dolu" | "kesime-hazir";

const FILTRE_ETIKETLERI: Record<FiltreKurban, string> = {
  tum: "Tümü",
  "bos-hisse-var": "Boş Hisse Olanlar",
  "tam-dolu": "Tam Dolu",
  "kesime-hazir": "Kesime Hazır",
};

export function StableGrid(props: StableGridProps) {
  const [arama, setArama] = useState("");
  const [filtre, setFiltre] = useState<FiltreKurban>("tum");

  const filtreli = useMemo(() => {
    let liste = [...props.kurbanlar];
    const q = arama.trim();
    if (q) {
      const sayi = q.replace("#", "");
      liste = liste.filter(
        (k) =>
          k.kesimSirasi.toString().includes(sayi) ||
          k.kupeNo?.toLowerCase().includes(q.toLowerCase()),
      );
    }
    if (filtre === "bos-hisse-var") {
      liste = liste.filter((k) => k.bosHisseSayisi > 0);
    } else if (filtre === "tam-dolu") {
      liste = liste.filter((k) => k.bosHisseSayisi === 0);
    } else if (filtre === "kesime-hazir") {
      liste = liste.filter(
        (k) =>
          (k.durumRozeti as KurbanDurumRozeti) === "kesime-hazir",
      );
    }
    return liste;
  }, [props.kurbanlar, arama, filtre]);

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Filtre bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={14}
            className="text-muted-foreground absolute top-1/2 left-2.5 -translate-y-1/2"
          />
          <Input
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="Kurban ara (sıra no, küpe)"
            className="h-9 pl-8 text-sm"
          />
          {arama && (
            <button
              type="button"
              onClick={() => setArama("")}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
              aria-label="Temizle"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
          <Filter size={11} />
          {(Object.keys(FILTRE_ETIKETLERI) as FiltreKurban[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltre(f)}
              className={cn(
                "rounded-full px-2.5 py-1 font-medium transition-colors",
                filtre === f
                  ? "bg-orange-100 text-orange-800 ring-1 ring-orange-300"
                  : "hover:bg-stone-100",
              )}
            >
              {FILTRE_ETIKETLERI[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid — responsive */}
      <div className="-mr-2 flex-1 overflow-y-auto pr-2">
        {filtreli.length === 0 ? (
          <div className="text-muted-foreground py-12 text-center text-sm">
            Bu filtreye uyan kurban yok
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtreli.map((k) => (
              <KurbanKart
                key={k.id}
                kurban={k}
                onHisseDrop={props.onHisseDrop}
                onHisseTikla={props.onHisseTikla}
                onHisseIptal={props.onHisseIptal}
                onHisseTransfer={props.onHisseTransfer}
                dragDevreDisi={props.dragDevreDisi}
                iptalIzni={props.iptalIzni}
                transferIzni={props.transferIzni}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
