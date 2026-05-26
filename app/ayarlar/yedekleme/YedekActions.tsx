"use client";

/**
 * Yedek alma kontrolleri.
 *
 * SPRINT-YEDEK-V2 İŞ 2: ek olarak etiketli "yedek noktası" oluşturma —
 * dosya adı `...-yedek-noktasi-<etiket>.db` olur ve backup.ts'in 30 gün
 * + 50 sınır rotasyonundan korunur.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database, Star } from "lucide-react";

const TR_DONUSUM: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
};

function etiketTemizle(girdi: string): string {
  return girdi
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşü]/g, (c) => TR_DONUSUM[c] ?? c)
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

export function YedekActions() {
  const router = useRouter();
  const [bekleniyor, startTransition] = useTransition();
  const [sonYedek, setSonYedek] = useState<string | null>(null);
  const [etiket, setEtiket] = useState("");

  function yedekAl(neden: string) {
    startTransition(async () => {
      try {
        const yanit = await fetch("/api/yedek", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ neden }),
        });
        const veri = (await yanit.json()) as {
          basarili: boolean;
          yedekYolu?: string;
          boyutKB?: number;
          hata?: string;
        };
        if (!yanit.ok || !veri.basarili) {
          throw new Error(veri.hata ?? "Yedek alınamadı");
        }
        setSonYedek(veri.yedekYolu ?? null);
        toast.success(`Yedek alındı (${veri.boyutKB} KB)`);
        router.refresh();
      } catch (e) {
        const m = e instanceof Error ? e.message : "Bilinmeyen hata";
        toast.error(m);
      }
    });
  }

  function normalYedek() {
    yedekAl("manuel");
  }

  function yedekNoktasi() {
    const temiz = etiketTemizle(etiket);
    if (temiz.length === 0) {
      toast.error("Geçerli etiket girin (örn: bayram-baslangic)");
      return;
    }
    yedekAl(`yedek-noktasi-${temiz}`);
    setEtiket("");
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">Normal Yedek</p>
        <Button onClick={normalYedek} disabled={bekleniyor} className="self-start">
          <Database size={16} />
          {bekleniyor ? "Yedekleniyor..." : "Şimdi Yedek Al"}
        </Button>
      </div>

      <div className="border-amber-200 bg-amber-50/40 flex flex-col gap-2 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <Star className="text-amber-600 size-4" />
          <p className="text-sm font-semibold">Yedek Noktası (Önemli)</p>
        </div>
        <p className="text-muted-foreground text-xs">
          Bayram başlangıcı, gün sonu gibi önemli anlar için etiketli yedek.
          Bu yedekler 30 gün rotasyonundan etkilenmez (manuel silinmediği
          sürece kalır).
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex-1">
            <Label htmlFor="yedek-etiket" className="sr-only">
              Etiket
            </Label>
            <Input
              id="yedek-etiket"
              value={etiket}
              onChange={(e) => setEtiket(e.target.value)}
              placeholder="bayram-baslangic"
              maxLength={30}
              disabled={bekleniyor}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={yedekNoktasi}
            disabled={bekleniyor || etiket.trim().length === 0}
            className="border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
          >
            <Star size={14} />
            Nokta Oluştur
          </Button>
        </div>
        <p className="text-muted-foreground text-[11px]">
          Önerilen: <code>bayram-baslangic</code> · <code>gun-sonu</code> ·{" "}
          <code>excel-once</code>
        </p>
      </div>

      {sonYedek && (
        <p className="text-muted-foreground text-xs">
          Son yedek: <code className="font-mono">{sonYedek}</code>
        </p>
      )}
    </div>
  );
}
