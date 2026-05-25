"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, ScrollText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PersonelKurbanVeri } from "@/app/tv/personel/page";

interface Props {
  kurban: PersonelKurbanVeri;
  yenile: () => void;
}

export function VekaletPanel({ kurban, yenile }: Props) {
  const [yukleniyor, setYukleniyor] = useState<string | null>(null);

  const alinan = kurban.hisseler.filter((h) => h.vekaletAlindi).length;
  const toplam = kurban.hisseler.filter((h) => h.musteriAdi).length;

  async function vekaletTikla(hisseId: string, mevcut: boolean) {
    setYukleniyor(hisseId);
    try {
      const yanit = await fetch(`/api/hisseler/${hisseId}/vekalet`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vekaletAlindi: !mevcut }),
      });
      if (!yanit.ok) {
        toast.error("Güncellenemedi");
        return;
      }
      if (navigator.vibrate) navigator.vibrate(20);
      yenile();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setYukleniyor(null);
    }
  }

  return (
    <Card className="border-amber-300 border-2">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScrollText size={16} className="text-amber-600" />
            <span className="text-amber-700 text-xs font-bold uppercase tracking-wide">
              Vekalet — DANA-{kurban.kesimSirasi}
            </span>
          </div>
          <span className="text-amber-700 text-xs font-bold">
            {alinan}/{toplam}
          </span>
        </div>

        <div className="space-y-1.5">
          {kurban.hisseler.map((h) => {
            if (!h.musteriAdi) {
              return (
                <div
                  key={h.id}
                  className="text-muted-foreground flex items-center gap-2 py-1.5 text-xs italic"
                >
                  <span className="w-6 text-center">{h.no}.</span>
                  Boş hisse
                </div>
              );
            }
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => vekaletTikla(h.id, h.vekaletAlindi)}
                disabled={yukleniyor === h.id}
                className={`flex w-full items-center gap-2 rounded-lg border p-2.5 text-left transition-colors ${
                  h.vekaletAlindi
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    h.vekaletAlindi
                      ? "bg-emerald-500 text-white"
                      : "border-2 border-slate-300"
                  }`}
                >
                  {yukleniyor === h.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : h.vekaletAlindi ? (
                    <Check size={14} />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">
                    {h.no}. {h.musteriAdi}
                  </div>
                  {h.musteriTel && (
                    <div className="text-muted-foreground text-[10px]">
                      {h.musteriTel}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {alinan === toplam && toplam > 0 && (
          <div className="text-emerald-700 mt-3 text-center text-xs font-semibold">
            ✓ Tüm vekaletler alındı — Kesime hazır
          </div>
        )}
      </CardContent>
    </Card>
  );
}
