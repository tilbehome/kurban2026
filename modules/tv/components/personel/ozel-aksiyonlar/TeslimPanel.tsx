"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Loader2,
  PackageCheck,
  Phone,
  MessageCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PersonelKurbanVeri } from "@/app/tv/personel/page";

interface Props {
  kurban: PersonelKurbanVeri;
  yenile: () => void;
}

export function TeslimPanel({ kurban, yenile }: Props) {
  const [yukleniyor, setYukleniyor] = useState<string | null>(null);

  const teslimEdilen = kurban.hisseler.filter(
    (h) => h.teslimDurumu === "Teslim Edildi",
  ).length;
  const toplam = kurban.hisseler.filter((h) => h.musteriAdi).length;

  async function teslimEt(hisseId: string) {
    setYukleniyor(hisseId);
    try {
      const yanit = await fetch(`/api/hisseler/${hisseId}/teslim`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teslim: true }),
      });
      if (!yanit.ok) {
        toast.error("Güncellenemedi");
        return;
      }
      toast.success("Teslim edildi");
      if (navigator.vibrate) navigator.vibrate([30, 30, 30]);
      yenile();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setYukleniyor(null);
    }
  }

  return (
    <Card className="border-emerald-300 border-2">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackageCheck size={16} className="text-emerald-600" />
            <span className="text-emerald-700 text-xs font-bold uppercase tracking-wide">
              Teslim — DANA-{kurban.kesimSirasi}
            </span>
          </div>
          <span className="text-emerald-700 text-xs font-bold">
            {teslimEdilen}/{toplam}
          </span>
        </div>

        <div className="space-y-2">
          {kurban.hisseler
            .filter((h) => h.musteriAdi)
            .map((h) => {
              const teslimMi = h.teslimDurumu === "Teslim Edildi";
              return (
                <div
                  key={h.id}
                  className={`flex items-center gap-2 rounded-lg border p-2.5 ${
                    teslimMi
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-slate-200"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">
                      {h.no}. {h.musteriAdi}
                    </div>
                    {h.musteriTel && (
                      <div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-[10px]">
                        <Phone size={10} />
                        {h.musteriTel}
                      </div>
                    )}
                  </div>
                  {teslimMi ? (
                    <span className="text-emerald-700 flex items-center gap-1 text-xs font-semibold">
                      <Check size={14} />
                      Teslim
                    </span>
                  ) : (
                    <div className="flex gap-1">
                      {h.musteriTel && (
                        <a
                          href={`https://wa.me/${(h.musteriTel ?? "").replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:bg-emerald-50 flex h-9 w-9 items-center justify-center rounded-md border"
                          aria-label="WhatsApp"
                        >
                          <MessageCircle size={14} />
                        </a>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => teslimEt(h.id)}
                        disabled={yukleniyor === h.id}
                        className="h-9"
                      >
                        {yukleniyor === h.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <>
                            <Check size={12} className="mr-1" />
                            Teslim Et
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {teslimEdilen === toplam && toplam > 0 && (
          <div className="text-emerald-700 mt-3 text-center text-sm font-bold">
            ✓ Tüm hisseler teslim edildi
          </div>
        )}
      </CardContent>
    </Card>
  );
}
