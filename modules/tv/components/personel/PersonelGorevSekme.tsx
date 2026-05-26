"use client";

/**
 * Personel görev sekmeleri.
 *
 * SPRINT-PERSONEL-PANEL-EK: yatay scroll yerine 2x3 grid — telefon ekranında
 * 6 görev sekmesi tek seferde görünür, scroll yok.
 */

import { Button } from "@/components/ui/button";
import {
  PERSONEL_GOREVLERI,
  GOREV_ETIKETLERI,
  type PersonelGorev,
} from "@/modules/tv/lib/personel-gorev";

interface Props {
  aktif: PersonelGorev;
  setAktif: (g: PersonelGorev) => void;
  sayilar: Record<PersonelGorev, number>;
}

export function PersonelGorevSekme({ aktif, setAktif, sayilar }: Props) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {PERSONEL_GOREVLERI.map((g) => (
        <Button
          key={g}
          variant={aktif === g ? "default" : "outline"}
          size="sm"
          onClick={() => setAktif(g)}
          className="h-10 justify-between gap-1.5 px-3 text-xs"
        >
          <span>{GOREV_ETIKETLERI[g]}</span>
          <span
            className={`rounded-full px-2 text-[10px] font-bold ${
              aktif === g
                ? "bg-white/20 text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {sayilar[g]}
          </span>
        </Button>
      ))}
    </div>
  );
}
