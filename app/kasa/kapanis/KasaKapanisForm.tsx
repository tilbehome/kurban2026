"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPara, parsePara, yuvarla } from "@/shared/lib/para";

interface KasaKapanisFormProps {
  beklenenNakit: number;
}

export function KasaKapanisForm({ beklenenNakit }: KasaKapanisFormProps) {
  const router = useRouter();
  const [bekleniyor, startTransition] = useTransition();
  const [sayilan, setSayilan] = useState("");
  const [aciklama, setAciklama] = useState("");

  const sayilanTutar = parsePara(sayilan);
  const fark = yuvarla(sayilanTutar - beklenenNakit);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sayilanTutar < 0) {
      toast.error("Tutar 0'dan küçük olamaz");
      return;
    }

    const farkAciklama = fark === 0
      ? aciklama || "Gün sonu kapanışı (fark yok)"
      : `Gün sonu kapanışı · Fark: ${formatPara(fark)} ${fark > 0 ? "(fazla)" : "(eksik)"}` +
        (aciklama ? ` · ${aciklama}` : "");

    startTransition(async () => {
      try {
        const yanit = await fetch("/api/kasa/hareket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tip: "kapanis",
            tutar: sayilanTutar,
            yontem: "nakit",
            aciklama: farkAciklama,
          }),
        });
        const sonuc = (await yanit.json()) as {
          basarili: boolean;
          hata?: string;
        };
        if (!yanit.ok || !sonuc.basarili) {
          throw new Error(sonuc.hata ?? "Hata");
        }
        toast.success("Kasa kapatıldı");
        router.refresh();
      } catch (e) {
        const m = e instanceof Error ? e.message : "Hata";
        toast.error(m);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="sayilan">Sayılan Nakit (₺)</Label>
        <Input
          id="sayilan"
          inputMode="decimal"
          required
          autoFocus
          value={sayilan}
          onChange={(e) => setSayilan(e.target.value)}
          className="font-tabular text-right"
          disabled={bekleniyor}
        />
        <p className="text-muted-foreground text-xs">
          Beklenen: <span className="font-tabular">{formatPara(beklenenNakit)}</span>
        </p>
      </div>

      {sayilan && (
        <div
          className={`rounded-md border p-3 text-sm ${
            fark === 0
              ? "border-green-300 bg-green-50 text-green-700"
              : fark > 0
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-red-300 bg-red-50 text-red-700"
          }`}
        >
          {fark === 0
            ? "✓ Fark yok"
            : fark > 0
              ? `+${formatPara(fark)} fazla`
              : `${formatPara(fark)} eksik`}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="aciklama">Not (opsiyonel)</Label>
        <Textarea
          id="aciklama"
          rows={2}
          value={aciklama}
          onChange={(e) => setAciklama(e.target.value)}
          disabled={bekleniyor}
        />
      </div>

      <Button type="submit" disabled={bekleniyor || !sayilan}>
        {bekleniyor ? "Kapatılıyor..." : "Günü Kapat"}
      </Button>
    </form>
  );
}
