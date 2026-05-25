"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Scale, Save, Delete, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TartimaHazir {
  id: string;
  kesimSirasi: number;
  hisseGrubu: string | null;
  hisseSayisi: number;
  operasyonSira: number | null;
}

const KEYS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", ".", "0", "C"];

export function TartimAnaClient() {
  const [kurbanlar, setKurbanlar] = useState<TartimaHazir[]>([]);
  const [secili, setSecili] = useState<string | null>(null);
  const [kgInput, setKgInput] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => {
    yukle();
    const i = setInterval(yukle, 5000);
    return () => clearInterval(i);
  }, []);

  async function yukle() {
    try {
      const r = await fetch("/api/kesim/tartima-hazir", { cache: "no-store" });
      if (!r.ok) return;
      const d = (await r.json()) as { kurbanlar: TartimaHazir[] };
      setKurbanlar(d.kurbanlar ?? []);
    } catch {
      /* sessiz */
    }
  }

  function basamakBas(b: string) {
    if (navigator.vibrate) navigator.vibrate(10);
    if (b === "C") {
      setKgInput("");
      return;
    }
    if (b === ".") {
      if (kgInput.includes(".")) return;
      setKgInput(kgInput.length === 0 ? "0." : kgInput + ".");
      return;
    }
    if (kgInput.length >= 6) return;
    setKgInput(kgInput + b);
  }

  function sil() {
    if (navigator.vibrate) navigator.vibrate(10);
    setKgInput(kgInput.slice(0, -1));
  }

  async function kaydet() {
    if (!secili || !kgInput) {
      toast.error("Kurban ve kg girin");
      return;
    }
    const kg = Number.parseFloat(kgInput);
    if (Number.isNaN(kg) || kg <= 0 || kg > 1000) {
      toast.error("Geçersiz kg değeri (1-1000)");
      return;
    }
    setYukleniyor(true);
    try {
      const r = await fetch("/api/kesim/tartim-kaydet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kurbanId: secili, toplamKg: kg }),
      });
      if (!r.ok) {
        const veri = await r.json().catch(() => ({}));
        toast.error(veri.hata ?? "Kaydedilemedi");
        return;
      }
      toast.success(`${kg} kg kaydedildi — Paketleme aşamasına geçti`);
      if (navigator.vibrate) navigator.vibrate(100);
      setSecili(null);
      setKgInput("");
      yukle();
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setYukleniyor(false);
    }
  }

  const seciliKurban = kurbanlar.find((k) => k.id === secili);
  const hisseSayisi = seciliKurban?.hisseSayisi ?? 7;

  return (
    <div className="container mx-auto max-w-3xl space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Scale className="text-primary size-7" />
        <div>
          <div className="text-muted-foreground text-xs">
            {kurbanlar.length} kurban tartıma hazır
          </div>
        </div>
      </div>

      {/* Tartıma hazır liste */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {kurbanlar.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => setSecili(k.id)}
            className={`rounded-xl border-2 p-3 transition-all touch-manipulation ${
              secili === k.id
                ? "border-primary bg-primary/10"
                : "border-muted hover:border-primary/50"
            }`}
          >
            <div className="text-muted-foreground text-xs">DANA</div>
            <div className="text-2xl font-bold tabular-nums">
              {k.kesimSirasi}
            </div>
            {k.hisseGrubu && (
              <div className="text-orange-600 text-[10px] font-semibold">
                {k.hisseGrubu} KG
              </div>
            )}
          </button>
        ))}
        {kurbanlar.length === 0 && (
          <Card className="text-muted-foreground col-span-full p-8 text-center">
            Tartıma hazır kurban yok
          </Card>
        )}
      </div>

      {secili && (
        <>
          {/* Display */}
          <Card className="bg-muted/30 p-6">
            <div className="text-center">
              <div className="text-muted-foreground mb-1 text-sm">
                Toplam Karkas KG · DANA-{seciliKurban?.kesimSirasi}
              </div>
              <div className="text-6xl font-bold tabular-nums">
                {kgInput || "0"}
              </div>
              <div className="text-muted-foreground mt-2 text-xs">
                Hisse başı:{" "}
                {kgInput
                  ? (Number.parseFloat(kgInput) / hisseSayisi).toFixed(1)
                  : "0"}{" "}
                kg ({hisseSayisi} hisse)
              </div>
            </div>
          </Card>

          {/* Keypad 3x4 */}
          <div className="grid grid-cols-3 gap-2">
            {KEYS.map((b) => (
              <Button
                key={b}
                type="button"
                variant={b === "C" ? "destructive" : "outline"}
                size="lg"
                onClick={() => basamakBas(b)}
                disabled={yukleniyor}
                className="h-16 touch-manipulation text-2xl font-semibold"
              >
                {b}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={sil}
              disabled={yukleniyor || kgInput.length === 0}
              className="col-span-3 h-12 touch-manipulation"
              aria-label="Son rakamı sil"
            >
              <Delete className="mr-1 size-4" />
              Son Rakamı Sil
            </Button>
          </div>

          <Button
            type="button"
            onClick={kaydet}
            disabled={yukleniyor || !kgInput}
            size="lg"
            className="h-14 w-full text-lg"
          >
            {yukleniyor ? (
              <Loader2 className="mr-2 size-5 animate-spin" />
            ) : (
              <Save className="mr-2 size-5" />
            )}
            {yukleniyor ? "Kaydediliyor..." : "Tartım Kaydet → Paketleme"}
          </Button>
        </>
      )}
    </div>
  );
}
