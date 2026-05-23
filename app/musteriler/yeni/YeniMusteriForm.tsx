"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function YeniMusteriForm({ next }: { next?: string }) {
  const router = useRouter();
  const [bekleniyor, startTransition] = useTransition();
  const [veri, setVeri] = useState({
    adSoyad: "",
    telefon: "",
    tcKimlik: "",
    adres: "",
    notlar: "",
  });

  function alanGuncelle<K extends keyof typeof veri>(k: K, v: string) {
    setVeri((eski) => ({ ...eski, [k]: v }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const yanit = await fetch("/api/musteriler", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(veri),
        });
        const sonuc = (await yanit.json()) as {
          basarili: boolean;
          id?: number;
          hata?: string;
        };
        if (!yanit.ok || !sonuc.basarili) {
          throw new Error(sonuc.hata ?? "Kayıt başarısız");
        }
        toast.success("Müşteri kaydedildi");
        router.push(next ?? `/musteriler/${sonuc.id}`);
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
        <Label htmlFor="adSoyad">Ad Soyad *</Label>
        <Input
          id="adSoyad"
          autoFocus
          required
          minLength={2}
          value={veri.adSoyad}
          onChange={(e) => alanGuncelle("adSoyad", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="telefon">Telefon</Label>
          <Input
            id="telefon"
            type="tel"
            inputMode="tel"
            placeholder="05XX XXX XX XX"
            value={veri.telefon}
            onChange={(e) => alanGuncelle("telefon", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="tcKimlik">TC Kimlik (ops.)</Label>
          <Input
            id="tcKimlik"
            inputMode="numeric"
            maxLength={11}
            value={veri.tcKimlik}
            onChange={(e) => alanGuncelle("tcKimlik", e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="adres">Adres</Label>
        <Textarea
          id="adres"
          rows={2}
          value={veri.adres}
          onChange={(e) => alanGuncelle("adres", e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="notlar">Notlar</Label>
        <Textarea
          id="notlar"
          rows={2}
          value={veri.notlar}
          onChange={(e) => alanGuncelle("notlar", e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={bekleniyor}
        >
          İptal
        </Button>
        <Button type="submit" disabled={bekleniyor}>
          {bekleniyor ? "Kaydediliyor..." : "Müşteriyi Kaydet"}
        </Button>
      </div>
    </form>
  );
}
