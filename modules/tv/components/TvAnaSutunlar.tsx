"use client";

import { SiradakilerSutun } from "./sutunlar/SiradakilerSutun";
import { IslemSutun } from "./sutunlar/IslemSutun";
import { TeslimeHazirSutun } from "./sutunlar/TeslimeHazirSutun";
import type { TvSutunlar, TvTema } from "@/modules/tv/types";

interface TvAnaSutunlarProps {
  sutunlar: TvSutunlar;
  tema: TvTema;
}

export function TvAnaSutunlar({ sutunlar, tema }: TvAnaSutunlarProps) {
  return (
    <div className="grid grid-cols-1 gap-3 px-6 py-2 md:grid-cols-2 xl:grid-cols-4">
      <SiradakilerSutun satirlar={sutunlar.siradakiler} tema={tema} />
      <IslemSutun
        baslik="ŞU AN KESİMDE"
        kartlar={sutunlar.kesimde}
        renk="turuncu"
        tema={tema}
      />
      <IslemSutun
        baslik="ŞU AN TARTIMDA"
        kartlar={sutunlar.tartimda}
        renk="mavi"
        tema={tema}
      />
      <TeslimeHazirSutun satirlar={sutunlar.teslimeHazir} tema={tema} />
    </div>
  );
}
