"use client";

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
    <div className="-mx-4 overflow-x-auto px-4">
      <div className="flex gap-1.5 pb-2 whitespace-nowrap">
        {PERSONEL_GOREVLERI.map((g) => (
          <Button
            key={g}
            variant={aktif === g ? "default" : "outline"}
            size="sm"
            onClick={() => setAktif(g)}
            className="h-9 shrink-0 gap-1.5 text-xs"
          >
            {GOREV_ETIKETLERI[g]}
            <span
              className={`rounded-full px-1.5 text-[10px] font-bold ${
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
    </div>
  );
}
