"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, Package, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PersonelKurbanVeri } from "@/app/tv/personel/page";

interface Props {
  kurban: PersonelKurbanVeri;
  yenile: () => void;
}

export function PaketlemePanel({ kurban, yenile }: Props) {
  const [yukleniyor, setYukleniyor] = useState<string | null>(null);
  const [hepsiYukleniyor, setHepsiYukleniyor] = useState(false);

  const paketlenen = kurban.hisseler.filter(
    (h) => h.paketDurumu === "Paketlendi" || h.paketDurumu === "Teslim Hazır",
  ).length;
  const toplam = kurban.hisseler.filter((h) => h.musteriAdi).length;

  async function paketleTikla(hisseId: string, suanki: string | null) {
    setYukleniyor(hisseId);
    try {
      const yeni = suanki === "Paketlendi" ? "Bekliyor" : "Paketlendi";
      const yanit = await fetch(`/api/hisseler/${hisseId}/paket`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paketDurumu: yeni }),
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

  async function hepsiTeslimHazir() {
    setHepsiYukleniyor(true);
    try {
      const yanit = await fetch("/api/tv/kurban-asama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kurbanId: kurban.id,
          yeniDurum: "teslime_hazir",
        }),
      });
      if (!yanit.ok) {
        toast.error("Teslime hazır geçişi başarısız");
        return;
      }
      toast.success(`DANA-${kurban.kesimSirasi} teslime hazır`);
      if (navigator.vibrate) navigator.vibrate(50);
      yenile();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setHepsiYukleniyor(false);
    }
  }

  return (
    <Card className="border-cyan-300 border-2">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-cyan-600" />
            <span className="text-cyan-700 text-xs font-bold uppercase tracking-wide">
              Paketleme — DANA-{kurban.kesimSirasi}
            </span>
          </div>
          <span className="text-cyan-700 text-xs font-bold">
            {paketlenen}/{toplam}
          </span>
        </div>

        {kurban.toplamKg && (
          <div className="text-muted-foreground mb-3 text-center text-xs">
            Tartım: {kurban.toplamKg} kg → ~
            {(kurban.toplamKg / kurban.hisseSayisi).toFixed(1)} kg/hisse
          </div>
        )}

        <div className="space-y-1.5">
          {kurban.hisseler.map((h) => {
            if (!h.musteriAdi) {
              return (
                <div
                  key={h.id}
                  className="text-muted-foreground py-1.5 text-xs italic"
                >
                  {h.no}. Boş hisse
                </div>
              );
            }
            const paketli =
              h.paketDurumu === "Paketlendi" ||
              h.paketDurumu === "Teslim Hazır";
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => paketleTikla(h.id, h.paketDurumu)}
                disabled={yukleniyor === h.id || hepsiYukleniyor}
                className={`flex w-full items-center gap-2 rounded-lg border p-2.5 text-left transition-colors ${
                  paketli
                    ? "border-cyan-300 bg-cyan-50"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    paketli
                      ? "bg-cyan-500 text-white"
                      : "border-2 border-slate-300"
                  }`}
                >
                  {yukleniyor === h.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : paketli ? (
                    <Check size={14} />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">
                    {h.no}. {h.musteriAdi}
                  </div>
                  {h.paketKg && (
                    <div className="text-muted-foreground text-[10px]">
                      {h.paketKg.toFixed(1)} kg
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {paketlenen === toplam && toplam > 0 && (
          <Button
            type="button"
            onClick={hepsiTeslimHazir}
            disabled={hepsiYukleniyor}
            className="mt-3 h-11 w-full"
          >
            {hepsiYukleniyor ? (
              <Loader2 size={16} className="mr-1 animate-spin" />
            ) : (
              <ChevronRight size={16} className="mr-1" />
            )}
            Hepsi Paketlendi — Teslime Hazır
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
