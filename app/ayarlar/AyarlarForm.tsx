"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AyarlarFormProps {
  ayarlar: Record<string, string>;
}

export function AyarlarForm({ ayarlar }: AyarlarFormProps) {
  const [bekleniyor, startTransition] = useTransition();
  const [veri, setVeri] = useState({
    firma_adi: ayarlar.firma_adi ?? "",
    firma_telefon: ayarlar.firma_telefon ?? "",
    firma_adres: ayarlar.firma_adres ?? "",
    dekont_alt_yazi: ayarlar.dekont_alt_yazi ?? "",
    dekont_prefix: ayarlar.dekont_prefix ?? "TKR-2026-",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const yanit = await fetch("/api/ayarlar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(veri),
        });
        if (!yanit.ok) throw new Error("Kaydetme başarısız");
        toast.success("Ayarlar kaydedildi");
      } catch {
        toast.error("Ayarlar kaydedilemedi");
      }
    });
  }

  function alanGuncelle<K extends keyof typeof veri>(anahtar: K, deger: string) {
    setVeri((eski) => ({ ...eski, [anahtar]: deger }));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="firma_adi">Firma Adı</Label>
        <Input
          id="firma_adi"
          value={veri.firma_adi}
          onChange={(e) => alanGuncelle("firma_adi", e.target.value)}
          disabled={bekleniyor}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="firma_telefon">Telefon</Label>
        <Input
          id="firma_telefon"
          value={veri.firma_telefon}
          onChange={(e) => alanGuncelle("firma_telefon", e.target.value)}
          disabled={bekleniyor}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="firma_adres">Adres</Label>
        <Textarea
          id="firma_adres"
          rows={2}
          value={veri.firma_adres}
          onChange={(e) => alanGuncelle("firma_adres", e.target.value)}
          disabled={bekleniyor}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="dekont_alt_yazi">Dekont Alt Yazısı</Label>
        <Textarea
          id="dekont_alt_yazi"
          rows={2}
          value={veri.dekont_alt_yazi}
          onChange={(e) => alanGuncelle("dekont_alt_yazi", e.target.value)}
          disabled={bekleniyor}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="dekont_prefix">Dekont No Ön Eki</Label>
        <Input
          id="dekont_prefix"
          value={veri.dekont_prefix}
          onChange={(e) => alanGuncelle("dekont_prefix", e.target.value)}
          disabled={bekleniyor}
        />
        <p className="text-muted-foreground text-xs">
          Örnek: <code>TKR-2026-</code> → dekont no <code>TKR-2026-000142</code>
        </p>
      </div>

      <Button type="submit" disabled={bekleniyor} className="self-start">
        {bekleniyor ? "Kaydediliyor..." : "Ayarları Kaydet"}
      </Button>
    </form>
  );
}
