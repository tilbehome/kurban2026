"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/shared/lib/utils";
import { useTvTema } from "@/modules/tv/lib/tv-tema";
import { useSSE } from "@/modules/tv/hooks/useSSE";
import { TvUstBar } from "./TvUstBar";
import { TvKpiSeridi } from "./TvKpiSeridi";
import { TvAnaSutunlar } from "./TvAnaSutunlar";
import { TvOperasyonAkis } from "./TvOperasyonAkis";
import { TvAltBilgiSeridi } from "./TvAltBilgiSeridi";
import type { TvTumVeri } from "@/modules/tv/types";

interface TvClientProps {
  ilkVeri: TvTumVeri;
}

/**
 * TV ana orkestratoru — SSE bağlantısı + tema + tüm bölümler.
 *
 * - useSSE: /api/tv/yayin'a bağlanır, 3sn'de bir güncel veri alır
 * - useTvTema: light/dark + localStorage
 * - İlk SSR verisi (ilkVeri) SSE bağlanana kadar görünür
 */
export function TvClient({ ilkVeri }: TvClientProps) {
  const { tema, toggle } = useTvTema();
  const { veri, durum } = useSSE<TvTumVeri>({
    url: "/api/tv/yayin",
    eventName: "guncelleme",
    ilkVeri,
  });

  // Hydrasyon sonrası mount kontrolü (theme race önlemi)
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const aktifVeri = veri ?? ilkVeri;
  const canli = durum === "bagli";

  const bgSinifi = useMemo(
    () =>
      tema === "dark"
        ? "bg-slate-950 text-white"
        : "bg-slate-50 text-slate-900",
    [tema],
  );

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col transition-colors duration-300",
        bgSinifi,
      )}
    >
      <TvUstBar
        lokasyon={aktifVeri.ayarlar.lokasyon}
        canli={canli && hydrated}
        tema={tema}
        onTemaToggle={toggle}
      />

      <TvKpiSeridi kpi={aktifVeri.kpi} tema={tema} />

      <TvAnaSutunlar sutunlar={aktifVeri.sutunlar} tema={tema} />

      <TvOperasyonAkis
        istatistik={aktifVeri.operasyonIstatistik}
        tema={tema}
      />

      <TvAltBilgiSeridi ayarlar={aktifVeri.ayarlar} tema={tema} />

      {/* Footer altı boşluk */}
      <div className="flex-1" />
    </div>
  );
}
