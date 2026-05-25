"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  PackageCheck,
  MessageCircle,
  Phone,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TeslimHisse {
  id: string;
  no: number;
  paketDurumu: string | null;
  paketKg: number | null;
  teslimDurumu: string | null;
  musteri: { id: string; adSoyad: string; telefon: string | null } | null;
}

interface TeslimKurban {
  id: string;
  kesimSirasi: number;
  hisseGrubu: string | null;
  kesimDurumu: string;
  toplamKg: number | null;
  hisseler: TeslimHisse[];
}

export function TeslimAnaClient() {
  const [kurbanlar, setKurbanlar] = useState<TeslimKurban[]>([]);
  const [yukleniyor, setYukleniyor] = useState<string | null>(null);

  useEffect(() => {
    yukle();
    const i = setInterval(yukle, 5000);
    return () => clearInterval(i);
  }, []);

  async function yukle() {
    try {
      const r = await fetch("/api/kesim/teslim-hazir", { cache: "no-store" });
      if (!r.ok) return;
      const d = (await r.json()) as { kurbanlar: TeslimKurban[] };
      setKurbanlar(d.kurbanlar ?? []);
    } catch {
      /* sessiz */
    }
  }

  async function teslimEt(hisseId: string, musteriAdi: string) {
    setYukleniyor(hisseId);
    try {
      const r = await fetch(`/api/hisseler/${hisseId}/teslim`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teslim: true }),
      });
      if (!r.ok) {
        toast.error("Teslim güncellenemedi");
        return;
      }
      toast.success(`${musteriAdi} hissesi teslim edildi`);
      if (navigator.vibrate) navigator.vibrate([30, 30, 30]);
      yukle();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setYukleniyor(null);
    }
  }

  if (kurbanlar.length === 0) {
    return (
      <div className="container mx-auto max-w-3xl p-4">
        <Card className="text-muted-foreground p-12 text-center">
          <PackageCheck size={32} className="mx-auto mb-2 opacity-40" />
          Teslime hazır kurban yok
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-4 p-4">
      {kurbanlar.map((k) => {
        const teslimEdilen = k.hisseler.filter(
          (h) => h.teslimDurumu === "Teslim Edildi",
        ).length;
        const toplam = k.hisseler.length;
        return (
          <Card key={k.id}>
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="border-primary bg-primary/10 flex h-14 w-14 flex-col items-center justify-center rounded-xl border-2">
                    <span className="text-muted-foreground text-[8px] uppercase">
                      Dana
                    </span>
                    <span className="text-primary text-xl font-bold leading-none">
                      {k.kesimSirasi}
                    </span>
                  </div>
                  <div>
                    {k.hisseGrubu && (
                      <Badge variant="outline" className="mb-1 text-[10px]">
                        {k.hisseGrubu} KG
                      </Badge>
                    )}
                    <div className="text-muted-foreground text-xs">
                      {k.toplamKg ? `${k.toplamKg} kg karkas · ` : ""}
                      {toplam} hisse
                    </div>
                  </div>
                </div>
                <Badge
                  variant={
                    teslimEdilen === toplam ? "default" : "secondary"
                  }
                  className="text-xs"
                >
                  {teslimEdilen}/{toplam} teslim
                </Badge>
              </div>

              <div className="space-y-1.5">
                {k.hisseler.map((h) => {
                  if (!h.musteri) return null;
                  const teslimMi = h.teslimDurumu === "Teslim Edildi";
                  const paketMi =
                    h.paketDurumu === "Paketlendi" ||
                    h.paketDurumu === "Teslim Hazır";
                  return (
                    <div
                      key={h.id}
                      className={`flex items-center gap-2 rounded-lg border p-2.5 ${
                        teslimMi
                          ? "border-emerald-300 bg-emerald-50"
                          : paketMi
                            ? "border-cyan-200 bg-cyan-50/30"
                            : "border-slate-200"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">
                          {h.no}. {h.musteri.adSoyad}
                          {h.paketKg && (
                            <span className="text-muted-foreground ml-1 text-[10px] font-normal">
                              · {h.paketKg.toFixed(1)} kg
                            </span>
                          )}
                        </div>
                        {h.musteri.telefon && (
                          <div className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[10px]">
                            <Phone size={10} />
                            {h.musteri.telefon}
                          </div>
                        )}
                      </div>
                      {teslimMi ? (
                        <span className="text-emerald-700 flex items-center gap-1 text-xs font-semibold">
                          <Check size={14} />
                          Teslim
                        </span>
                      ) : !paketMi ? (
                        <span className="text-muted-foreground text-[10px] italic">
                          Paketleniyor
                        </span>
                      ) : (
                        <div className="flex gap-1">
                          {h.musteri.telefon && (
                            <a
                              href={`https://wa.me/${h.musteri.telefon.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:bg-emerald-50 flex h-9 w-9 items-center justify-center rounded-md border"
                              aria-label="WhatsApp"
                              title="WhatsApp ile haber ver"
                            >
                              <MessageCircle size={14} />
                            </a>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            onClick={() =>
                              h.musteri && teslimEt(h.id, h.musteri.adSoyad)
                            }
                            disabled={yukleniyor === h.id}
                            className="h-9"
                          >
                            {yukleniyor === h.id ? (
                              <Loader2 className="size-3 animate-spin" />
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
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
