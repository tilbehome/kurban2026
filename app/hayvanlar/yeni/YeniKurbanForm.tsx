"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function YeniKurbanForm() {
  const router = useRouter();
  const [bekleniyor, startTransition] = useTransition();
  const [veri, setVeri] = useState({
    kesimSirasi: "",
    kupeNo: "",
    kesimSaati: "",
    hisseSayisi: "7",
    satisBedeli: "",
    notlar: "",
  });

  function alanGuncelle<K extends keyof typeof veri>(k: K, v: string) {
    setVeri((eski) => ({ ...eski, [k]: v }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const yanit = await fetch("/api/hayvanlar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kesimSirasi: Number.parseInt(veri.kesimSirasi, 10),
            kupeNo: veri.kupeNo.trim() || undefined,
            kesimSaati: veri.kesimSaati.trim() || undefined,
            hisseSayisi: Number.parseInt(veri.hisseSayisi, 10) || 7,
            satisBedeli: Number.parseFloat(veri.satisBedeli) || 0,
            notlar: veri.notlar.trim() || undefined,
          }),
        });
        const sonuc = (await yanit.json()) as {
          basarili: boolean;
          id?: number;
          hata?: string;
        };
        if (!yanit.ok || !sonuc.basarili) {
          throw new Error(sonuc.hata ?? "Kayıt başarısız");
        }
        toast.success("Kurban eklendi");
        router.push(`/hayvanlar/${sonuc.id}`);
        router.refresh();
      } catch (e) {
        const m = e instanceof Error ? e.message : "Hata";
        toast.error(m);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="kesimSirasi">Kesim Sırası *</Label>
          <Input
            id="kesimSirasi"
            type="number"
            inputMode="numeric"
            min={1}
            required
            value={veri.kesimSirasi}
            onChange={(e) => alanGuncelle("kesimSirasi", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="kupeNo">Küpe No</Label>
          <Input
            id="kupeNo"
            value={veri.kupeNo}
            onChange={(e) => alanGuncelle("kupeNo", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="hisseSayisi">Hisse Sayısı</Label>
          <Input
            id="hisseSayisi"
            type="number"
            inputMode="numeric"
            min={1}
            max={7}
            value={veri.hisseSayisi}
            onChange={(e) => alanGuncelle("hisseSayisi", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="kesimSaati">Kesim Saati (planlı)</Label>
          <Input
            id="kesimSaati"
            type="time"
            value={veri.kesimSaati}
            onChange={(e) => alanGuncelle("kesimSaati", e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="satisBedeli">Toplam Satış Bedeli (₺)</Label>
        <Input
          id="satisBedeli"
          type="number"
          inputMode="decimal"
          min={0}
          step={1}
          value={veri.satisBedeli}
          onChange={(e) => alanGuncelle("satisBedeli", e.target.value)}
        />
        <p className="text-muted-foreground text-xs">
          7 hisseye bölünüp her hisseye eşit dağıtılır.
        </p>
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
          {bekleniyor ? "Kaydediliyor..." : "Kurbanı Ekle"}
        </Button>
      </div>
    </form>
  );
}
