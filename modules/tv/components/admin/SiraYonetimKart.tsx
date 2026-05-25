"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GripVertical, Save, ListOrdered } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";

export interface SiraSatir {
  id: string;
  kesimSirasi: number;
  operasyonSira: number;
  kesimDurumu: string;
}

interface SiraYonetimKartProps {
  ilkSira: SiraSatir[];
}

/**
 * Drag-drop sıra yönetimi — admin operasyon sırasını yeniden düzenler.
 * HTML5 native drag-drop (paket yok).
 */
export function SiraYonetimKart({ ilkSira }: SiraYonetimKartProps) {
  const router = useRouter();
  const [satirlar, setSatirlar] = useState<SiraSatir[]>(ilkSira);
  const [bekleniyor, startTransition] = useTransition();
  const [suruklenen, setSuruklenen] = useState<number | null>(null);

  const degisti = useMemo(() => {
    if (satirlar.length !== ilkSira.length) return true;
    return satirlar.some((s, i) => s.id !== ilkSira[i].id);
  }, [satirlar, ilkSira]);

  function dragStart(idx: number) {
    setSuruklenen(idx);
  }

  function dragOver(e: React.DragEvent<HTMLLIElement>, idx: number) {
    e.preventDefault();
    if (suruklenen === null || suruklenen === idx) return;
    setSatirlar((eski) => {
      const yeni = [...eski];
      const [item] = yeni.splice(suruklenen, 1);
      yeni.splice(idx, 0, item);
      return yeni;
    });
    setSuruklenen(idx);
  }

  function dragEnd() {
    setSuruklenen(null);
  }

  function kaydet() {
    if (!degisti) return;
    startTransition(async () => {
      try {
        const yanit = await fetch("/api/tv/sira-degistir", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sira: satirlar.map((s, i) => ({
              kurbanId: s.id,
              operasyonSira: i + 1,
            })),
          }),
        });
        const sonuc = (await yanit.json()) as {
          basarili: boolean;
          hata?: string;
        };
        if (!yanit.ok || !sonuc.basarili) {
          throw new Error(sonuc.hata ?? "Sıra kaydedilemedi");
        }
        toast.success(`${satirlar.length} kurban sırası kaydedildi`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Hata");
      }
    });
  }

  function sifirla() {
    setSatirlar(ilkSira);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ListOrdered size={16} className="text-purple-500" />
          Sıra Yönetimi
          {degisti && (
            <span className="bg-amber-100 text-amber-800 ring-amber-300 ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ring-1">
              Kaydedilmemiş Değişiklik
            </span>
          )}
        </CardTitle>
        <p className="text-muted-foreground text-[11px]">
          Sıradaki kurbanları sürükle-bırak ile yeniden düzenleyin
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {satirlar.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            Sıraya alınmış kurban yok
          </p>
        ) : (
          <ol className="flex flex-col gap-1.5">
            {satirlar.map((s, i) => (
              <li
                key={s.id}
                draggable
                onDragStart={() => dragStart(i)}
                onDragOver={(e) => dragOver(e, i)}
                onDragEnd={dragEnd}
                className={cn(
                  "border-stone-200 flex cursor-grab items-center gap-2.5 rounded-md border bg-white p-2.5 transition-all",
                  suruklenen === i && "scale-105 shadow-lg ring-2 ring-purple-300",
                )}
              >
                <GripVertical
                  size={14}
                  className="text-muted-foreground shrink-0"
                />
                <span className="font-tabular bg-purple-100 text-purple-800 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  {i + 1}
                </span>
                <span className="font-mono text-sm font-semibold">
                  DANA-{s.kesimSirasi}
                </span>
                <span className="text-muted-foreground ml-auto text-[10px]">
                  {s.kesimDurumu}
                </span>
              </li>
            ))}
          </ol>
        )}

        {degisti && (
          <div className="flex gap-2 border-t pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={sifirla}
              disabled={bekleniyor}
              className="flex-1"
            >
              Geri Al
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={kaydet}
              disabled={bekleniyor}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              <Save size={14} />
              {bekleniyor ? "Kaydediliyor..." : "Yeni Sırayı Kaydet"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
