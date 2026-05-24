"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parsePara } from "@/shared/lib/para";

const KATEGORILER = [
  { deger: "yem", ad: "Yem" },
  { deger: "personel", ad: "Personel" },
  { deger: "elektrik", ad: "Elektrik / Su" },
  { deger: "malzeme", ad: "Malzeme" },
  { deger: "yakit", ad: "Yakıt" },
  { deger: "diger", ad: "Diğer" },
];

export function GiderGirisForm() {
  const router = useRouter();
  const [bekleniyor, startTransition] = useTransition();
  const [tutar, setTutar] = useState("");
  const [kategori, setKategori] = useState("diger");
  const [aciklama, setAciklama] = useState("");
  const [yontem, setYontem] = useState<"nakit" | "havale" | "kart">("nakit");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const tutarSayi = parsePara(tutar);
    if (tutarSayi <= 0) {
      toast.error("Tutar 0'dan büyük olmalı");
      return;
    }
    const kategoriAd =
      KATEGORILER.find((k) => k.deger === kategori)?.ad ?? "Diğer";
    const tamAciklama = aciklama.trim()
      ? `[${kategoriAd}] ${aciklama.trim()}`
      : `[${kategoriAd}]`;

    startTransition(async () => {
      try {
        const yanit = await fetch("/api/kasa/hareket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tip: "gider",
            tutar: tutarSayi,
            yontem,
            aciklama: tamAciklama,
          }),
        });
        const sonuc = (await yanit.json()) as {
          basarili: boolean;
          hata?: string;
        };
        if (!yanit.ok || !sonuc.basarili) {
          throw new Error(sonuc.hata ?? "Hata");
        }
        toast.success("Gider kaydedildi");
        setTutar("");
        setAciklama("");
        setKategori("diger");
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
        <Label htmlFor="tutar">Tutar (₺)</Label>
        <Input
          id="tutar"
          inputMode="decimal"
          required
          autoFocus
          value={tutar}
          onChange={(e) => setTutar(e.target.value)}
          className="font-tabular text-right"
          disabled={bekleniyor}
          placeholder="0"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="kategori">Kategori</Label>
        <Select
          value={kategori}
          onValueChange={(v) => v != null && setKategori(v)}
        >
          <SelectTrigger id="kategori">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KATEGORILER.map((k) => (
              <SelectItem key={k.deger} value={k.deger}>
                {k.ad}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="yontem">Ödeme Yöntemi</Label>
        <Select value={yontem} onValueChange={(v) => setYontem(v as typeof yontem)}>
          <SelectTrigger id="yontem">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nakit">Nakit</SelectItem>
            <SelectItem value="havale">Havale / EFT</SelectItem>
            <SelectItem value="kart">Kart</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="aciklama">Açıklama (opsiyonel)</Label>
        <Textarea
          id="aciklama"
          rows={2}
          value={aciklama}
          onChange={(e) => setAciklama(e.target.value)}
          disabled={bekleniyor}
          placeholder="Detay..."
        />
      </div>

      <Button type="submit" disabled={bekleniyor}>
        {bekleniyor ? "Kaydediliyor..." : "Gideri Kaydet"}
      </Button>
    </form>
  );
}
