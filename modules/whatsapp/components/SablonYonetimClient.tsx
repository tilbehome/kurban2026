"use client";

import { useState } from "react";
import { SablonListesi } from "./SablonListesi";
import { SablonEditoru } from "./SablonEditoru";
import type { SablonKisa } from "@/modules/whatsapp/types";

interface SablonYonetimClientProps {
  ilkSablonlar: SablonKisa[];
  duzenleyebilir: boolean;
  sirketAdi: string;
  sirketTel: string;
}

export function SablonYonetimClient({
  ilkSablonlar,
  duzenleyebilir,
  sirketAdi,
  sirketTel,
}: SablonYonetimClientProps) {
  const [sablonlar, setSablonlar] = useState<SablonKisa[]>(ilkSablonlar);
  const [secili, setSecili] = useState<SablonKisa | null>(null);
  const [yeniMi, setYeniMi] = useState(false);

  function sec(s: SablonKisa) {
    setYeniMi(false);
    setSecili(s);
  }

  function yeni() {
    setSecili(null);
    setYeniMi(true);
  }

  function iptal() {
    setSecili(null);
    setYeniMi(false);
  }

  function kaydedildi(yeni: SablonKisa) {
    setSablonlar((eski) => {
      const idx = eski.findIndex((s) => s.id === yeni.id);
      if (idx === -1) return [...eski, yeni];
      const yeniListe = [...eski];
      yeniListe[idx] = yeni;
      return yeniListe;
    });
    setSecili(yeni);
    setYeniMi(false);
  }

  function silindi(id: string) {
    setSablonlar((eski) => eski.filter((s) => s.id !== id));
    setSecili(null);
    setYeniMi(false);
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr] lg:h-[calc(100vh-200px)]">
      <div className="lg:overflow-hidden">
        <SablonListesi
          sablonlar={sablonlar}
          seciliId={secili?.id ?? null}
          yeniMi={yeniMi}
          onSec={sec}
          onYeni={yeni}
          yeniEklenebilir={duzenleyebilir}
        />
      </div>
      <div className="lg:overflow-hidden">
        <SablonEditoru
          sablon={secili}
          yeniMi={yeniMi}
          onKaydedildi={kaydedildi}
          onSilindi={silindi}
          onIptal={iptal}
          duzenleyebilir={duzenleyebilir}
          sirketAdi={sirketAdi}
          sirketTel={sirketTel}
        />
      </div>
    </div>
  );
}
