"use client";

import { useState, FormEvent } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  baslangicAd: string;
  kaydetVeAta: (yeni: {
    adSoyad: string;
    telefon: string;
    tcKimlik: string;
  }) => Promise<void>;
  vazgec: () => void;
}

export function HizliMusteriEkleForm({
  baslangicAd,
  kaydetVeAta,
  vazgec,
}: Props) {
  const [adSoyad, setAdSoyad] = useState(baslangicAd.trim().toUpperCase());
  const [telefon, setTelefon] = useState("");
  const [tcKimlik, setTcKimlik] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  async function gonder(e: FormEvent) {
    e.preventDefault();
    if (adSoyad.trim().length < 2) return;
    setYukleniyor(true);
    try {
      await kaydetVeAta({
        adSoyad: adSoyad.trim(),
        telefon: telefon.trim(),
        tcKimlik: tcKimlik.trim(),
      });
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <form onSubmit={gonder} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="adSoyad">
          Ad Soyad <span className="text-destructive">*</span>
        </Label>
        <Input
          id="adSoyad"
          value={adSoyad}
          onChange={(e) => setAdSoyad(e.target.value.toUpperCase())}
          placeholder="AHMET YILMAZ"
          required
          minLength={2}
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="telefon">Telefon</Label>
        <Input
          id="telefon"
          value={telefon}
          onChange={(e) => setTelefon(e.target.value)}
          placeholder="05XX XXX XX XX"
          inputMode="tel"
          maxLength={30}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tcKimlik">TC Kimlik (vekalet için)</Label>
        <Input
          id="tcKimlik"
          value={tcKimlik}
          onChange={(e) => setTcKimlik(e.target.value.replace(/\D/g, ""))}
          placeholder="11 haneli"
          inputMode="numeric"
          maxLength={11}
        />
      </div>

      <div className="flex justify-between gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={vazgec}
          disabled={yukleniyor}
        >
          <ArrowLeft size={14} className="mr-1" />
          Aramaya Dön
        </Button>
        <Button
          type="submit"
          disabled={yukleniyor || adSoyad.trim().length < 2}
        >
          {yukleniyor ? (
            <>
              <Loader2 className="mr-1 size-4 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            "Kaydet ve Ata →"
          )}
        </Button>
      </div>
    </form>
  );
}
