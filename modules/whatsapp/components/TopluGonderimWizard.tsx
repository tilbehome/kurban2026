"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/shared/lib/utils";
import { SablonSecAdimi } from "./adimlar/SablonSecAdimi";
import { HedefSecAdimi } from "./adimlar/HedefSecAdimi";
import { OnizlemeAdimi } from "./adimlar/OnizlemeAdimi";
import { GonderimAdimi } from "./adimlar/GonderimAdimi";
import type {
  HedefMusteri,
  SablonKisa,
  WizardAdim,
} from "@/modules/whatsapp/types";

interface TopluGonderimWizardProps {
  ilkSablonlar: SablonKisa[];
  sirketAdi: string;
  sirketTel: string;
}

const ADIM_ETIKETLERI: Record<WizardAdim, string> = {
  1: "Şablon",
  2: "Hedef",
  3: "Önizleme",
  4: "Gönderim",
};

export function TopluGonderimWizard({
  ilkSablonlar,
  sirketAdi,
  sirketTel,
}: TopluGonderimWizardProps) {
  const router = useRouter();
  const [adim, setAdim] = useState<WizardAdim>(1);
  const [sablonId, setSablonId] = useState<string | null>(null);
  const [hedefIds, setHedefIds] = useState<string[]>([]);
  const [hedefler, setHedefler] = useState<HedefMusteri[]>([]);

  const sablon = ilkSablonlar.find((s) => s.id === sablonId) ?? null;

  // Adım 3'e geçerken seçili müşterilerin tam verisini DB'den çek
  useEffect(() => {
    if (adim !== 3 || hedefIds.length === 0) return;
    let iptal = false;
    (async () => {
      try {
        const r = await fetch("/api/whatsapp/musteriler-filtre?durum=tum");
        const j = (await r.json()) as {
          basarili: boolean;
          veri?: HedefMusteri[];
        };
        if (iptal || !j.basarili || !j.veri) return;
        const seciliSet = new Set(hedefIds);
        setHedefler(j.veri.filter((m) => seciliSet.has(m.musteriId)));
      } catch {
        // sessizce yut
      }
    })();
    return () => {
      iptal = true;
    };
  }, [adim, hedefIds]);

  const iptal = useCallback(() => {
    if (confirm("Wizard'ı iptal etmek istediğinize emin misiniz?")) {
      router.push("/whatsapp");
    }
  }, [router]);

  const bittiHandler = useCallback(() => {
    // 4. adımdan sonra geçmiş sayfasına yönlendir
    setTimeout(() => router.push("/whatsapp/gecmis"), 2000);
  }, [router]);

  return (
    <div className="flex flex-col gap-4">
      {/* Adım göstergesi */}
      <div className="flex items-center justify-between rounded-lg border bg-white p-3">
        {([1, 2, 3, 4] as WizardAdim[]).map((n, idx) => (
          <div key={n} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                adim > n
                  ? "bg-emerald-500 text-white"
                  : adim === n
                    ? "bg-orange-500 text-white"
                    : "bg-stone-200 text-stone-500",
              )}
            >
              {adim > n ? <Check size={13} /> : n}
            </div>
            <span
              className={cn(
                "hidden text-xs font-semibold sm:inline",
                adim >= n ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {ADIM_ETIKETLERI[n]}
            </span>
            {idx < 3 && (
              <div
                className={cn(
                  "h-px flex-1 transition-colors",
                  adim > n ? "bg-emerald-500" : "bg-stone-200",
                )}
              />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          {adim === 1 && (
            <SablonSecAdimi
              sablonlar={ilkSablonlar}
              seciliId={sablonId}
              onSec={setSablonId}
              onIleri={() => setAdim(2)}
              onIptal={iptal}
            />
          )}
          {adim === 2 && (
            <HedefSecAdimi
              hedefIds={hedefIds}
              onHedeflerDegis={setHedefIds}
              onIleri={() => setAdim(3)}
              onGeri={() => setAdim(1)}
            />
          )}
          {adim === 3 && sablon && (
            <OnizlemeAdimi
              sablon={sablon}
              hedefler={hedefler}
              sirketAdi={sirketAdi}
              sirketTel={sirketTel}
              onBaslat={() => setAdim(4)}
              onGeri={() => setAdim(2)}
            />
          )}
          {adim === 4 && sablon && (
            <GonderimAdimi
              sablon={sablon}
              hedefler={hedefler}
              sirketAdi={sirketAdi}
              sirketTel={sirketTel}
              onBitti={bittiHandler}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
