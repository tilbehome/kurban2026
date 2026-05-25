"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, AlertTriangle, Beef } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  ASAMA_EMOJI,
  ASAMA_ETIKETLERI,
  sonrakiAsama,
  type KurbanKesimDurumu,
} from "@/modules/tv/lib/asama-akisi";
import { useSeslicAnons } from "@/modules/tv/hooks/useSeslicAnons";

export interface PersonelKurbanData {
  id: string;
  kesimSirasi: number;
  operasyonSira: number | null;
  kesimDurumu: KurbanKesimDurumu;
  asama: string | null;
  ilerlemeYuzde: number;
  kalanSureDk: number | null;
}

interface PersonelKurbanKartProps {
  kurban: PersonelKurbanData;
}

export function PersonelKurbanKart({ kurban }: PersonelKurbanKartProps) {
  const router = useRouter();
  const [bekleniyor, startTransition] = useTransition();
  const { anons } = useSeslicAnons();

  // Optimistic state
  const [yerel, setYerel] = useState<PersonelKurbanData>(kurban);
  const sonraki = sonrakiAsama(yerel.kesimDurumu);

  function sonrakiyeGec() {
    if (!sonraki) {
      toast.info("Son aşamada");
      return;
    }
    const eski = yerel;
    // Optimistic update
    setYerel((e) => ({ ...e, kesimDurumu: sonraki }));

    startTransition(async () => {
      try {
        const yanit = await fetch("/api/tv/kurban-asama", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kurbanId: yerel.id, yeniDurum: sonraki }),
        });
        const sonuc = (await yanit.json()) as {
          basarili: boolean;
          hata?: string;
        };
        if (!yanit.ok || !sonuc.basarili) {
          throw new Error(sonuc.hata ?? "Geçiş başarısız");
        }
        toast.success(
          `DANA-${yerel.kesimSirasi} → ${ASAMA_ETIKETLERI[sonraki]}`,
        );
        anons(
          `DANA ${yerel.kesimSirasi}, ${ASAMA_ETIKETLERI[sonraki]} aşamasına geçti`,
        );
        router.refresh();
      } catch (e) {
        // Rollback
        setYerel(eski);
        toast.error(e instanceof Error ? e.message : "Hata");
      }
    });
  }

  function ilerlemeArttir() {
    const yeniIlerleme = Math.min(100, yerel.ilerlemeYuzde + 10);
    const eski = yerel;
    setYerel((e) => ({ ...e, ilerlemeYuzde: yeniIlerleme }));
    startTransition(async () => {
      try {
        const yanit = await fetch("/api/tv/ilerleme", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hisseId: yerel.id, // PATCH endpoint hisseId ile çalışır — kurban için ayrı endpoint daha doğru
            ilerlemeYuzde: yeniIlerleme,
          }),
        });
        // Kurban için ilerleme: kurban-asama endpoint'i kullan
        if (!yanit.ok) {
          // Fallback: kurban-asama ile sadece ilerleme güncelle
          const yanit2 = await fetch("/api/tv/kurban-asama", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kurbanId: yerel.id,
              yeniDurum: yerel.kesimDurumu,
              ilerlemeYuzde: yeniIlerleme,
            }),
          });
          const s = (await yanit2.json()) as {
            basarili: boolean;
            hata?: string;
          };
          if (!yanit2.ok || !s.basarili) {
            throw new Error(s.hata ?? "Güncellenemedi");
          }
        }
        toast.success(`%${yeniIlerleme}`);
      } catch (e) {
        setYerel(eski);
        toast.error(e instanceof Error ? e.message : "Hata");
      }
    });
  }

  function sorunBildir() {
    const not = window.prompt(
      `DANA-${yerel.kesimSirasi} için sorun açıklaması:`,
    );
    if (!not?.trim()) return;
    toast.info(`Sorun kaydedildi: ${not.slice(0, 50)}...`);
    // TODO: Bir sorun bildirim endpoint'i veya audit log ile kaydet
  }

  const aktifDurum = yerel.kesimDurumu;

  return (
    <Card className="border-l-orange-500 border-l-4">
      <CardContent className="flex flex-col gap-2.5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="from-orange-500 to-amber-500 flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br text-white shadow-md">
              <Beef size={20} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-extrabold">
                DANA-{yerel.kesimSirasi}
              </span>
              {yerel.operasyonSira !== null && (
                <span className="text-muted-foreground text-[11px]">
                  Sıra No: {yerel.operasyonSira}
                </span>
              )}
            </div>
          </div>
          <span className="bg-orange-100 text-orange-800 ring-orange-300 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1">
            {ASAMA_EMOJI[aktifDurum]} {ASAMA_ETIKETLERI[aktifDurum]}
          </span>
        </div>

        {/* İlerleme bar */}
        {yerel.ilerlemeYuzde > 0 && (
          <div className="flex items-center gap-2">
            <div className="bg-stone-200 h-2 flex-1 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full bg-orange-500 transition-all duration-700"
                style={{ width: `${yerel.ilerlemeYuzde}%` }}
              />
            </div>
            <span className="font-tabular text-muted-foreground text-xs font-semibold">
              %{yerel.ilerlemeYuzde}
            </span>
            {yerel.kalanSureDk !== null && (
              <span className="font-tabular text-orange-700 text-xs font-bold">
                {yerel.kalanSureDk} dk
              </span>
            )}
          </div>
        )}

        {/* Aksiyon butonları */}
        <div className="flex flex-col gap-1.5 sm:flex-row">
          {sonraki && (
            <Button
              type="button"
              onClick={sonrakiyeGec}
              disabled={bekleniyor}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              size="sm"
            >
              <ChevronRight size={14} />
              {bekleniyor
                ? "..."
                : `${ASAMA_ETIKETLERI[sonraki]} →`}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={ilerlemeArttir}
            disabled={bekleniyor || yerel.ilerlemeYuzde >= 100}
            size="sm"
            className={cn("flex-1", !sonraki && "flex-1")}
          >
            +%10
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={sorunBildir}
            size="sm"
            className="text-amber-700 hover:bg-amber-50"
          >
            <AlertTriangle size={14} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
