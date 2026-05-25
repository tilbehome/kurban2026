"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Scale, Loader2, Delete, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PersonelKurbanVeri } from "@/app/tv/personel/page";

interface Props {
  kurban: PersonelKurbanVeri;
  yenile: () => void;
}

const KEYS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", ".", "0"];

export function TartimKeypad({ kurban, yenile }: Props) {
  const [deger, setDeger] = useState(
    kurban.toplamKg ? String(kurban.toplamKg) : "",
  );
  const [yukleniyor, setYukleniyor] = useState(false);

  function tikla(k: string) {
    if (navigator.vibrate) navigator.vibrate(10);
    if (k === ".") {
      if (deger.includes(".")) return;
      if (deger.length === 0) setDeger("0.");
      else setDeger(deger + ".");
      return;
    }
    if (deger.length >= 7) return;
    setDeger(deger + k);
  }

  function sil() {
    if (navigator.vibrate) navigator.vibrate(10);
    setDeger(deger.slice(0, -1));
  }

  async function kaydet() {
    const kg = Number.parseFloat(deger);
    if (Number.isNaN(kg) || kg < 50 || kg > 1500) {
      toast.error("Geçerli kg değeri girin (50-1500)");
      return;
    }
    setYukleniyor(true);
    try {
      const yanit = await fetch("/api/tv/kurban-asama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kurbanId: kurban.id,
          yeniDurum: "paketleme",
          toplamKg: kg,
        }),
      });
      if (!yanit.ok) {
        const veri = await yanit.json().catch(() => ({}));
        toast.error(veri.hata ?? "Kaydedilemedi");
        return;
      }
      toast.success(`Tartım kaydedildi: ${kg} kg — Paketlemeye geçti`);
      if (navigator.vibrate) navigator.vibrate(50);
      yenile();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <Card className="border-indigo-300 border-2">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Scale size={16} className="text-indigo-600" />
          <span className="text-indigo-700 text-xs font-bold uppercase tracking-wide">
            Tartım — DANA-{kurban.kesimSirasi}
          </span>
        </div>

        <div className="bg-slate-100 mb-3 rounded-lg p-4 text-center">
          <div className="text-muted-foreground text-[10px] uppercase">
            Karkas Ağırlık (kg)
          </div>
          <div className="font-tabular text-3xl font-extrabold tabular-nums">
            {deger || "—"}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => tikla(k)}
              disabled={yukleniyor}
              className="bg-white hover:bg-slate-50 active:bg-slate-100 flex h-14 items-center justify-center rounded-lg border text-xl font-bold transition-colors"
            >
              {k}
            </button>
          ))}
          <button
            type="button"
            onClick={sil}
            disabled={yukleniyor || deger.length === 0}
            className="bg-white hover:bg-slate-50 flex h-14 items-center justify-center rounded-lg border transition-colors disabled:opacity-40"
            aria-label="Sil"
          >
            <Delete size={18} />
          </button>
        </div>

        <Button
          type="button"
          onClick={kaydet}
          disabled={yukleniyor || deger.length === 0}
          className="mt-3 h-12 w-full"
        >
          {yukleniyor ? (
            <Loader2 size={16} className="mr-1 animate-spin" />
          ) : (
            <ChevronRight size={16} className="mr-1" />
          )}
          Kaydet ve Paketlemeye Geç
        </Button>

        {kurban.hisseSayisi > 0 && deger && (
          <div className="text-muted-foreground mt-2 text-center text-xs">
            Her hisseye ~
            {(Number.parseFloat(deger) / kurban.hisseSayisi).toFixed(1)} kg
          </div>
        )}
      </CardContent>
    </Card>
  );
}
