"use client";

/**
 * Sticky hızlı ödeme paneli (müşteri detay sayfası sağ tarafı).
 *
 * SPRINT-MUSTERILER-PANEL:
 *  - Nakit + Havale satırlarına ayrı "Kalan / Yarısı" hızlı doldur butonları.
 *  - paraInputFormatla + onBlur (",00" otomatik tamamlama).
 *  - Ödeme sonrası YEŞIL panel (window.open KALDIRILDI, kasiyer kontrolü).
 *  - "Dekont" butonu manuel yeni sekmede açar.
 *  - SPRINT-P3 idempotency: clientRequestIdRef korunur.
 */

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
import {
  paraInputFormatla,
  paraInputBlurTamamla,
} from "@/shared/lib/para-input-format";
import {
  Banknote,
  ArrowUpRight,
  CreditCard,
  Check,
  Printer,
  X,
} from "lucide-react";

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

interface SonOdemeBilgi {
  odemeId: string;
  dekontNo: string;
  toplam: number;
}

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

  const [sonOdeme, setSonOdeme] = useState<SonOdemeBilgi | null>(null);
  const clientRequestIdRef = useRef<string | null>(null);
  const nakitRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    nakitRef.current?.focus();
  }, []);

  const toplam = yuvarla(
    topla(parsePara(nakit), parsePara(havale), parsePara(kart)),
  );
  const fazla = toplam > kalanBakiye;
  const eksik = toplam < kalanBakiye;

  // Hızlı doldur — sadece tek yöntem dolar, diğerleri sıfırlanır.
  function nakitKalan() {
    setNakit(formatSayi(kalanBakiye));
    setHavale("");
    setKart("");
  }
  function nakitYarisi() {
    setNakit(formatSayi(Math.round(kalanBakiye / 2)));
    setHavale("");
    setKart("");
  }
  function havaleKalan() {
    setHavale(formatSayi(kalanBakiye));
    setNakit("");
    setKart("");
  }
  function havaleYarisi() {
    setHavale(formatSayi(Math.round(kalanBakiye / 2)));
    setNakit("");
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

    if (!clientRequestIdRef.current) {
      clientRequestIdRef.current = crypto.randomUUID();
    }
    const clientRequestId = clientRequestIdRef.current;

    startTransition(async () => {
      try {
        async function tahsilatGonder(secilenDagitim: Dagitim, uuid: string) {
          const yanit = await fetch("/api/tahsilat/odeme", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              musteriId,
              hisseIds: hisseler.map((h) => h.id),
              nakit: parsePara(nakit),
              havale: parsePara(havale),
              kart: parsePara(kart),
              dagitim: secilenDagitim,
              clientRequestId: uuid,
            }),
          });
          const sonuc = (await yanit.json()) as {
            basarili: boolean;
            dekontNo?: string;
            odemeIds?: string[];
            toplam?: number;
            hata?: string;
          };
          return { ok: yanit.ok, ...sonuc };
        }

        let sonuc = await tahsilatGonder(dagitim, clientRequestId);

        // SPRINT-FIX: "Eşit dağıtım" hisse limitini aşarsa otomatik "Sırayla"
        // dene. Fresh UUID — eski hatalı yanıt replay edilmesin.
        if (
          (!sonuc.ok || !sonuc.basarili) &&
          dagitim === "esit" &&
          typeof sonuc.hata === "string" &&
          sonuc.hata.includes("kalanını aşıyor")
        ) {
          toast.info("Eşit dağıtım uymuyor, sırayla deneniyor…", {
            duration: 2000,
          });
          const yeniUuid = crypto.randomUUID();
          clientRequestIdRef.current = yeniUuid;
          sonuc = await tahsilatGonder("sirayla", yeniUuid);
        }

        if (!sonuc.ok || !sonuc.basarili) {
          throw new Error(sonuc.hata ?? "Ödeme alınamadı");
        }
        toast.success(`Ödeme alındı · ${sonuc.dekontNo}`, { duration: 3000 });

        if (sonuc.odemeIds?.[0] && sonuc.dekontNo) {
          setSonOdeme({
            odemeId: sonuc.odemeIds[0],
            dekontNo: sonuc.dekontNo,
            toplam: sonuc.toplam ?? toplam,
          });
        }

        setNakit("");
        setHavale("");
        setKart("");
        router.refresh();
        setTimeout(() => nakitRef.current?.focus(), 100);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Hata");
      } finally {
        clientRequestIdRef.current = null;
      }
    });
  }

  function handleKey(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  const cokluHisse = hisseler.length > 1;
  const bakiyeVarMi = kalanBakiye > 0;

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleKey}
      className="flex flex-col gap-3"
    >
      {/* SPRINT-FIX-DEKONT-YESIL-PANEL: kalan 0 ve yeşil panel yoksa
          bilgilendirme satırı. sonOdeme varsa gizli — kasiyer dekonta odaklansın. */}
      {!bakiyeVarMi && !sonOdeme && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
          <p className="text-sm font-semibold text-green-900">
            ✓ Tüm ödemeler tamamlanmış
          </p>
          <p className="text-muted-foreground mt-0.5 text-[11px]">
            Bu müşterinin tüm hisseleri ödendi.
          </p>
        </div>
      )}

      {/* Para input alanları + toplam + dağıtım — sadece kalan > 0 */}
      {bakiyeVarMi && (
        <>
          <ParaSatir
            id="hop-nakit"
            ad="Nakit"
            ikon={<Banknote size={14} className="text-green-600" />}
            deger={nakit}
            setDeger={setNakit}
            inputRef={nakitRef}
            disabled={bekleniyor}
            hizliKalan={nakitKalan}
            hizliYarisi={nakitYarisi}
          />
          <ParaSatir
            id="hop-havale"
            ad="Havale"
            ikon={<ArrowUpRight size={14} className="text-blue-600" />}
            deger={havale}
            setDeger={setHavale}
            disabled={bekleniyor}
            hizliKalan={havaleKalan}
            hizliYarisi={havaleYarisi}
          />
          <ParaSatir
            id="hop-kart"
            ad="Kart"
            ikon={<CreditCard size={14} className="text-purple-600" />}
            deger={kart}
            setDeger={setKart}
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
              <span className="font-tabular font-bold">
                {formatPara(toplam)}
              </span>
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
        </>
      )}

      {/* YEŞIL PANEL — state-driven, kalan 0 olsa bile sonOdeme varsa kalıcı. */}
      {sonOdeme && (
        <div className="rounded-lg border-2 border-green-300 bg-green-50 p-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Check className="size-4 shrink-0 text-green-600" />
                <span className="text-sm font-semibold text-green-900">
                  Ödeme Alındı
                </span>
              </div>
              <div className="font-tabular mt-0.5 text-[11px] text-green-700">
                {sonOdeme.dekontNo} · {formatPara(sonOdeme.toplam)}
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(
                    `/api/tahsilat/dekont/${sonOdeme.odemeId}`,
                    "_blank",
                  )
                }
                className="h-7 px-2 text-[11px]"
              >
                <Printer className="size-3" />
                Dekont
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSonOdeme(null)}
                className="h-7 px-1.5"
                aria-label="Kapat"
              >
                <X className="size-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {bakiyeVarMi && (
        <Button
          type="submit"
          disabled={bekleniyor || toplam <= 0}
          size="lg"
          className="w-full"
        >
          {bekleniyor ? "Alınıyor..." : "✓ Ödemeyi Al"}
        </Button>
      )}
    </form>
  );
}

function ParaSatir({
  id,
  ad,
  ikon,
  deger,
  setDeger,
  inputRef,
  disabled,
  hizliKalan,
  hizliYarisi,
}: {
  id: string;
  ad: string;
  ikon: React.ReactNode;
  deger: string;
  setDeger: (v: string) => void;
  inputRef?: React.Ref<HTMLInputElement>;
  disabled?: boolean;
  hizliKalan?: () => void;
  hizliYarisi?: () => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Label
          htmlFor={id}
          className="flex w-16 shrink-0 items-center gap-1 text-xs"
        >
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
            onChange={(e) => setDeger(paraInputFormatla(e.target.value))}
            onBlur={(e) => setDeger(paraInputBlurTamamla(e.target.value))}
            disabled={disabled}
            className="font-tabular h-8 pr-6 text-right text-sm"
          />
          <span className="text-muted-foreground absolute top-1/2 right-2 -translate-y-1/2 text-xs">
            ₺
          </span>
        </div>
      </div>
      {(hizliKalan || hizliYarisi) && (
        <div className="ml-18 flex gap-1">
          {hizliKalan && (
            <button
              type="button"
              onClick={hizliKalan}
              disabled={disabled}
              className="text-muted-foreground hover:text-foreground hover:border-foreground/40 rounded border border-dashed px-2 py-0.5 text-[10px] transition-colors disabled:opacity-50"
            >
              Kalan
            </button>
          )}
          {hizliYarisi && (
            <button
              type="button"
              onClick={hizliYarisi}
              disabled={disabled}
              className="text-muted-foreground hover:text-foreground hover:border-foreground/40 rounded border border-dashed px-2 py-0.5 text-[10px] transition-colors disabled:opacity-50"
            >
              Yarısı
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function formatSayi(n: number): string {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(n);
}
