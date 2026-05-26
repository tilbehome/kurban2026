"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  id: string;
  no: number;
  kurbanKesimSirasi: number;
  hisseFiyati: number;
  kalan: number;
}

interface HizliOdemePanelProps {
  musteriId: string;
  hisseler: Hisse[];
  kalanBakiye: number;
}

type Dagitim = "esit" | "sirayla";

/**
 * Sticky hızlı ödeme paneli (müşteri detay sayfasında sağ tarafta).
 * Mevcut /api/tahsilat/odeme API'sini kullanır.
 */
export function HizliOdemePanel({
  musteriId,
  hisseler,
  kalanBakiye,
}: HizliOdemePanelProps) {
  const router = useRouter();
  const [bekleniyor, startTransition] = useTransition();

  const [nakit, setNakit] = useState("");
  const [havale, setHavale] = useState("");
  const [kart, setKart] = useState("");
  const [dagitim, setDagitim] = useState<Dagitim>("esit");

  // SPRINT-P3 İŞ 1: aynı submit cycle içinde aynı UUID — çift tıklama tek ödeme.
  const clientRequestIdRef = useRef<string | null>(null);

  const nakitRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    nakitRef.current?.focus();
  }, []);

  const toplam = yuvarla(topla(parsePara(nakit), parsePara(havale), parsePara(kart)));
  const fazla = toplam > kalanBakiye;
  const eksik = toplam < kalanBakiye;

  function bakiyeyiDoldur() {
    setNakit(formatSayi(kalanBakiye));
    setHavale("");
    setKart("");
  }

  function yarisiniDoldur() {
    setNakit(formatSayi(Math.round(kalanBakiye / 2)));
    setHavale("");
    setKart("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (toplam <= 0) {
      toast.error("En az bir tutar girin");
      return;
    }
    if (fazla) {
      const onay = window.confirm(
        `Girilen tutar (${formatPara(toplam)}) kalan bakiyeden (${formatPara(kalanBakiye)}) fazla. Devam?`,
      );
      if (!onay) return;
    }

    // Idempotency: submit cycle başında UUID üret, ref'te paylaş.
    if (!clientRequestIdRef.current) {
      clientRequestIdRef.current = crypto.randomUUID();
    }
    const clientRequestId = clientRequestIdRef.current;

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
            dagitim,
            clientRequestId,
          }),
        });
        const sonuc = (await yanit.json()) as {
          basarili: boolean;
          dekontNo?: string;
          odemeIds?: string[];
          hata?: string;
        };
        if (!yanit.ok || !sonuc.basarili) {
          throw new Error(sonuc.hata ?? "Ödeme alınamadı");
        }
        toast.success(`Ödeme alındı · ${sonuc.dekontNo}`);
        if (sonuc.odemeIds?.[0]) {
          window.open(`/api/tahsilat/dekont/${sonuc.odemeIds[0]}`, "_blank");
        }
        setNakit("");
        setHavale("");
        setKart("");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Hata");
      } finally {
        clientRequestIdRef.current = null;
      }
    });
  }

  function handleKey(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
      // Tek input'dan Enter ile submit
      e.preventDefault();
      handleSubmit(e);
    }
  }

  const cokluHisse = hisseler.length > 1;

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleKey}
      className="flex flex-col gap-3"
    >
      <ParaAlani
        id="hop-nakit"
        ad="Nakit"
        ikon={<Banknote size={14} className="text-green-600" />}
        deger={nakit}
        onChange={setNakit}
        inputRef={nakitRef}
        disabled={bekleniyor}
      />
      <ParaAlani
        id="hop-havale"
        ad="Havale"
        ikon={<ArrowUpRight size={14} className="text-blue-600" />}
        deger={havale}
        onChange={setHavale}
        disabled={bekleniyor}
      />
      <ParaAlani
        id="hop-kart"
        ad="Kart"
        ikon={<CreditCard size={14} className="text-purple-600" />}
        deger={kart}
        onChange={setKart}
        disabled={bekleniyor}
      />

      <div
        className={`rounded-md border p-2.5 ${
          fazla
            ? "border-red-300 bg-red-50"
            : eksik
              ? "border-amber-200 bg-amber-50"
              : toplam > 0
                ? "border-green-300 bg-green-50"
                : "border-muted"
        }`}
      >
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Toplam:</span>
          <span className="font-tabular font-bold">{formatPara(toplam)}</span>
        </div>
        <div className="text-muted-foreground mt-0.5 text-[11px]">
          Kalan: {formatPara(kalanBakiye)}
          {!fazla && !eksik && toplam > 0 && (
            <span className="ml-2 text-green-700">
              <Check size={10} className="inline" /> Tam
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={bakiyeyiDoldur}
          disabled={bekleniyor || kalanBakiye <= 0}
          className="flex-1 text-xs"
        >
          Kalan ({formatPara(kalanBakiye)})
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={yarisiniDoldur}
          disabled={bekleniyor || kalanBakiye <= 0}
          className="flex-1 text-xs"
        >
          Yarısı
        </Button>
      </div>

      {cokluHisse && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hop-dagitim" className="text-xs">
            Dağıtım ({hisseler.length} hisseye)
          </Label>
          <Select
            value={dagitim}
            onValueChange={(v) => v && setDagitim(v as Dagitim)}
          >
            <SelectTrigger id="hop-dagitim">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="esit">Eşit</SelectItem>
              <SelectItem value="sirayla">Sırayla doldur</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <Button
        type="submit"
        disabled={bekleniyor || toplam <= 0}
        size="lg"
        className="w-full"
      >
        {bekleniyor ? "Alınıyor..." : "✓ Ödemeyi Al"}
      </Button>
      <p className="text-muted-foreground text-center text-[10px]">
        Enter ile onay · Dekont otomatik açılır
      </p>
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
    <div className="flex items-center gap-2">
      <Label htmlFor={id} className="flex w-16 shrink-0 items-center gap-1 text-xs">
        {ikon}
        {ad}
      </Label>
      <div className="relative flex-1">
        <Input
          ref={inputRef}
          id={id}
          inputMode="decimal"
          placeholder="0"
          value={deger}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="font-tabular h-8 pr-6 text-right text-sm"
        />
        <span className="text-muted-foreground absolute top-1/2 right-2 -translate-y-1/2 text-xs">
          ₺
        </span>
      </div>
    </div>
  );
}

function formatSayi(n: number): string {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(n);
}
