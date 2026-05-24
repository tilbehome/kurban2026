"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parsePara } from "@/shared/lib/para";

export function KasaAcilisForm() {
  const router = useRouter();
  const [bekleniyor, startTransition] = useTransition();
  const [tutar, setTutar] = useState("");
  const [aciklama, setAciklama] = useState("Günlük kasa açılışı");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const tutarSayi = parsePara(tutar);
    if (tutarSayi < 0) {
      toast.error("Tutar 0'dan küçük olamaz");
      return;
    }
    startTransition(async () => {
      try {
        const yanit = await fetch("/api/kasa/hareket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tip: "acilis",
            tutar: tutarSayi,
            yontem: "nakit",
            aciklama,
          }),
        });
        const sonuc = (await yanit.json()) as {
          basarili: boolean;
          hata?: string;
        };
        if (!yanit.ok || !sonuc.basarili) {
          throw new Error(sonuc.hata ?? "Kayıt hatası");
        }
        toast.success("Kasa açıldı");
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
        <Label htmlFor="tutar">Başlangıç Nakit (₺)</Label>
        <Input
          id="tutar"
          inputMode="decimal"
          required
          autoFocus
          value={tutar}
          onChange={(e) => setTutar(e.target.value)}
          className="font-tabular text-right"
          disabled={bekleniyor}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="aciklama">Açıklama</Label>
        <Textarea
          id="aciklama"
          rows={2}
          value={aciklama}
          onChange={(e) => setAciklama(e.target.value)}
          disabled={bekleniyor}
        />
      </div>
      <Button type="submit" disabled={bekleniyor}>
        {bekleniyor ? "Kaydediliyor..." : "Kasayı Aç"}
      </Button>
    </form>
  );
}
