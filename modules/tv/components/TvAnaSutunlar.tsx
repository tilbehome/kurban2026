"use client";

import { SiradakilerSutun } from "./sutunlar/SiradakilerSutun";
import { KesimdekilerSutun } from "./sutunlar/KesimdekilerSutun";
import { ParcalamaSutun } from "./sutunlar/ParcalamaSutun";
import { TeslimeHazirSutun } from "./sutunlar/TeslimeHazirSutun";
import type { TvSutunlar, TvTema } from "@/modules/tv/types";

interface Props {
  sutunlar: TvSutunlar;
  tema: TvTema;
}

export function TvAnaSutunlar({ sutunlar, tema }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-2 xl:grid-cols-4">
      <SiradakilerSutun satirlar={sutunlar.siradakiler} tema={tema} />
      <KesimdekilerSutun kartlar={sutunlar.kesimdekiler} tema={tema} />
      <ParcalamaSutun kartlar={sutunlar.parcalamada} tema={tema} />
      <TeslimeHazirSutun kartlar={sutunlar.teslimeHazir} tema={tema} />
    </div>
  );
}
