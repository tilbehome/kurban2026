"use client";

import { useEffect, useState, useTransition, useRef } from "react";
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
import { formatPara, parsePara, topla, yuvarla } from "@/shared/lib/para";
import { Banknote, ArrowUpRight, CreditCard, Check } from "lucide-react";

interface Hisse {
  id: number;
  no: number;
  kurbanKesimSirasi: number;
  hisseFiyati: number;
  odenmis: number;
  kalan: number;
}

interface OdemeFormuProps {
  musteriId: number;
  hisseler: Hisse[];
  kalanBakiye: number;
}

type Dagitim = "esit" | "sirayla" | "manuel";

export function OdemeFormu({ musteriId, hisseler, kalanBakiye }: OdemeFormuProps) {
  const router = useRouter();
  const [bekleniyor, startTransition] = useTransition();

  const [nakit, setNakit] = useState("");
  const [havale, setHavale] = useState("");
  const [kart, setKart] = useState("");
  const [notlar, setNotlar] = useState("");
  const [dagitim, setDagitim] = useState<Dagitim>("esit");

  const nakitRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    nakitRef.current?.focus();
  }, []);

  const toplam = yuvarla(topla(parsePara(nakit), parsePara(havale), parsePara(kart)));
  const fazla = toplam > kalanBakiye;
  const eksik = toplam < kalanBakiye;

  function bakiyeyiOtomatikDoldur() {
    setNakit(formatSayi(kalanBakiye));
    setHavale("");
    setKart("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (toplam <= 0) {
      toast.error("En az bir tutar girin.");
      return;
    }

    if (fazla) {
      const onay = window.confirm(
        `Girilen tutar (${formatPara(toplam)}) kalan bakiyeden (${formatPara(
          kalanBakiye,
        )}) fazla. Devam edilsin mi?`,
      );
      if (!onay) return;
    }

    startTransition(async () => {
      try {
        const yanit = await fetch("/api/tahsilat/odeme", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            musteriId,
            hisseIds: hisseler.map((h) => h.id),
            nakit: parsePara(nakit),
            havale: parsePara(havale),
            kart: parsePara(kart),
            notlar: notlar.trim() || undefined,
            dagitim,
          }),
        });
        const sonuc = (await yanit.json()) as {
          basarili: boolean;
          dekontNo?: string;
          odemeIds?: number[];
          hata?: string;
        };
        if (!yanit.ok || !sonuc.basarili) {
          throw new Error(sonuc.hata ?? "Ödeme alınamadı");
        }
        toast.success(`Ödeme alındı · ${sonuc.dekontNo}`, {
          action: sonuc.odemeIds?.[0]
            ? {
                label: "Dekontu Aç",
                onClick: () =>
                  window.open(
                    `/api/tahsilat/dekont/${sonuc.odemeIds?.[0]}`,
                    "_blank",
                  ),
              }
            : undefined,
        });
        // İlk dekontu otomatik aç
        if (sonuc.odemeIds?.[0]) {
          window.open(`/api/tahsilat/dekont/${sonuc.odemeIds[0]}`, "_blank");
        }
        router.push("/tahsilat");
        router.refresh();
      } catch (e) {
        const m = e instanceof Error ? e.message : "Hata";
        toast.error(m);
      }
    });
  }

  const cokluHisse = hisseler.length > 1;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <ParaAlani
        id="nakit"
        ad="Nakit"
        ikon={<Banknote size={16} className="text-green-600" />}
        deger={nakit}
        onChange={setNakit}
        inputRef={nakitRef}
        disabled={bekleniyor}
      />
      <ParaAlani
        id="havale"
        ad="Havale / EFT"
        ikon={<ArrowUpRight size={16} className="text-blue-600" />}
        deger={havale}
        onChange={setHavale}
        disabled={bekleniyor}
      />
      <ParaAlani
        id="kart"
        ad="Kart"
        ikon={<CreditCard size={16} className="text-purple-600" />}
        deger={kart}
        onChange={setKart}
        disabled={bekleniyor}
      />

      <div
        className={`rounded-md border p-3 ${
          fazla
            ? "border-red-300 bg-red-50"
            : eksik
              ? "border-amber-200 bg-amber-50"
              : "border-green-300 bg-green-50"
        }`}
      >
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Toplam:</span>
          <span className="font-tabular font-bold">{formatPara(toplam)}</span>
        </div>
        <div className="text-muted-foreground mt-1 text-xs">
          Kalan bakiye: {formatPara(kalanBakiye)}
          {fazla && (
            <span className="ml-2 text-red-600">
              · {formatPara(toplam - kalanBakiye)} fazla
            </span>
          )}
          {!fazla && eksik && toplam > 0 && (
            <span className="ml-2 text-amber-600">
              · {formatPara(kalanBakiye - toplam)} eksik kapora
            </span>
          )}
          {!fazla && !eksik && toplam > 0 && (
            <span className="ml-2 text-green-700">
              <Check size={12} className="inline" /> Tam karşılıyor
            </span>
          )}
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={bakiyeyiOtomatikDoldur}
        disabled={bekleniyor || kalanBakiye <= 0}
      >
        Bakiyeyi Nakit Olarak Doldur
      </Button>

      {cokluHisse && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="dagitim">Hisselere Dağıtım</Label>
          <Select
            value={dagitim}
            onValueChange={(v) => setDagitim(v as Dagitim)}
          >
            <SelectTrigger id="dagitim">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="esit">Tüm hisselere eşit dağıt</SelectItem>
              <SelectItem value="sirayla">İlk hisseden başlayarak doldur</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">
            {hisseler.length} hisseye ödeme dağıtılacak.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="notlar">Not (opsiyonel)</Label>
        <Textarea
          id="notlar"
          rows={2}
          value={notlar}
          onChange={(e) => setNotlar(e.target.value)}
          disabled={bekleniyor}
        />
      </div>

      <Button
        type="submit"
        disabled={bekleniyor || toplam <= 0}
        size="lg"
        className="w-full"
      >
        {bekleniyor ? "Ödeme alınıyor..." : "✓ Ödemeyi Al ve Dekont Bas"}
      </Button>
    </form>
  );
}

function ParaAlani({
  id,
  ad,
  ikon,
  deger,
  onChange,
  inputRef,
  disabled,
}: {
  id: string;
  ad: string;
  ikon: React.ReactNode;
  deger: string;
  onChange: (v: string) => void;
  inputRef?: React.Ref<HTMLInputElement>;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="flex items-center gap-1.5 text-sm">
        {ikon}
        {ad}
      </Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          inputMode="decimal"
          placeholder="0"
          value={deger}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="font-tabular pr-9 text-right"
        />
        <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-sm">
          ₺
        </span>
      </div>
    </div>
  );
}

function formatSayi(n: number): string {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(n);
}
