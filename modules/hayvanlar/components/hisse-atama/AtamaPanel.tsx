"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MousePointerClick,
  User,
  Beef,
  Tag,
  CheckCircle2,
  X,
  Keyboard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/shared/lib/utils";
import { formatPara, parsePara } from "@/shared/lib/para";
import type { AtamaPaneliState } from "@/modules/hayvanlar/types/hisse-atama";

interface AtamaPanelProps {
  state: AtamaPaneliState;
  onDegisiklik: (yeni: Partial<AtamaPaneliState>) => void;
  onIptal: () => void;
  /** Atama başarılı olunca tetiklenir (liste refresh için) */
  onTamamlandi: () => void;
}

export function AtamaPanel({
  state,
  onDegisiklik,
  onIptal,
  onTamamlandi,
}: AtamaPanelProps) {
  const router = useRouter();
  const [bekleniyor, startTransition] = useTransition();

  const adim: 1 | 2 | 3 =
    !state.musteriId ? 1 : !state.hisseId ? 2 : 3;

  function onayla() {
    if (!state.musteriId || !state.hisseId) return;
    if (state.hisseFiyati <= 0) {
      toast.error("Hisse fiyatı 0'dan büyük olmalı");
      return;
    }
    startTransition(async () => {
      try {
        const yanit = await fetch("/api/hisseler/ata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hisseIds: [state.hisseId],
            musteriId: state.musteriId,
            hisseFiyati: state.hisseFiyati,
          }),
        });
        const sonuc = (await yanit.json()) as {
          basarili: boolean;
          hata?: string;
        };
        if (!yanit.ok || !sonuc.basarili) {
          throw new Error(sonuc.hata ?? "Atama başarısız");
        }
        toast.success(
          `${state.musteriAdSoyad}, #${state.kurbanKesimSirasi}.${state.hisseNo}'ye atandı`,
        );
        onTamamlandi();
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Hata");
      }
    });
  }

  return (
    <Card className="lg:sticky lg:top-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Atama Paneli</span>
          {(state.musteriId || state.hisseId) && (
            <button
              type="button"
              onClick={onIptal}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Seçimi temizle"
            >
              <X size={14} />
            </button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* Adım çubuğu */}
        <div className="bg-stone-100 flex items-center gap-1 rounded-full p-1">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={cn(
                "flex-1 rounded-full px-2 py-1 text-center text-[10px] font-semibold transition-colors",
                adim >= n
                  ? "bg-orange-500 text-white"
                  : "text-muted-foreground",
              )}
            >
              {n === 1 ? "Müşteri" : n === 2 ? "Hisse" : "Onayla"}
            </div>
          ))}
        </div>

        {/* Adım 1: müşteri seç */}
        <Bolum
          ikon={<User size={13} />}
          baslik="Müşteri"
          tamamlandi={!!state.musteriId}
        >
          {state.musteriId ? (
            <p className="text-sm font-semibold">{state.musteriAdSoyad}</p>
          ) : (
            <p className="text-muted-foreground text-[12px]">
              Soldan müşteri tıklayın veya sürükleyin
            </p>
          )}
        </Bolum>

        {/* Adım 2: hisse seç */}
        <Bolum
          ikon={<Beef size={13} />}
          baslik="Hedef Hisse"
          tamamlandi={!!state.hisseId}
        >
          {state.hisseId ? (
            <p className="text-sm font-semibold">
              Kurban #{state.kurbanKesimSirasi} · Hisse {state.hisseNo}
            </p>
          ) : (
            <p className="text-muted-foreground text-[12px]">
              Stable'da bir hisse kutusuna tıklayın veya sürükleyin
            </p>
          )}
        </Bolum>

        {/* Adım 3: detay */}
        {adim === 3 && (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fiyat" className="text-xs">
                Hisse Fiyatı
              </Label>
              <div className="relative">
                <Input
                  id="fiyat"
                  inputMode="decimal"
                  value={state.hisseFiyati || ""}
                  onChange={(e) =>
                    onDegisiklik({ hisseFiyati: parsePara(e.target.value) })
                  }
                  placeholder="0"
                  className="font-tabular pr-7 text-right text-sm"
                />
                <span className="text-muted-foreground absolute top-1/2 right-2.5 -translate-y-1/2 text-xs">
                  ₺
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="not" className="text-xs">
                Not (opsiyonel)
              </Label>
              <Textarea
                id="not"
                value={state.not}
                onChange={(e) => onDegisiklik({ not: e.target.value })}
                placeholder="Atama notu..."
                rows={2}
                className="text-xs"
              />
            </div>

            <div className="bg-stone-50 -mx-3 mt-1 flex flex-col gap-1 rounded-md border-y border-stone-200 px-3 py-2 text-xs">
              <Satir
                etiket="Müşteri"
                deger={state.musteriAdSoyad ?? "—"}
              />
              <Satir
                etiket="Hedef"
                deger={`#${state.kurbanKesimSirasi}.${state.hisseNo}`}
              />
              <Satir
                etiket="Bedel"
                deger={formatPara(state.hisseFiyati)}
                vurgulu
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onIptal}
                disabled={bekleniyor}
                className="flex-1"
                size="sm"
              >
                İptal
              </Button>
              <Button
                type="button"
                onClick={onayla}
                disabled={bekleniyor || state.hisseFiyati <= 0}
                className="flex-1"
                size="sm"
              >
                <CheckCircle2 size={14} />
                {bekleniyor ? "Atanıyor..." : "Onayla"}
              </Button>
            </div>
          </>
        )}

        {/* Boş durum kısayollar */}
        {adim === 1 && (
          <div className="text-muted-foreground bg-stone-50 mt-1 rounded-md border border-dashed border-stone-300 p-3 text-[11px]">
            <div className="mb-1.5 flex items-center gap-1 font-semibold uppercase tracking-wide">
              <Keyboard size={11} />
              Kısayollar
            </div>
            <ul className="space-y-0.5">
              <li>
                <kbd className="bg-white rounded border px-1 text-[10px]">
                  Ctrl+F
                </kbd>{" "}
                · Müşteri ara
              </li>
              <li>
                <kbd className="bg-white rounded border px-1 text-[10px]">
                  Esc
                </kbd>{" "}
                · Seçimi iptal
              </li>
              <li>
                <MousePointerClick size={10} className="inline" /> Sürükle-bırak
                ile atama
              </li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Bolum({
  ikon,
  baslik,
  tamamlandi,
  children,
}: {
  ikon: React.ReactNode;
  baslik: string;
  tamamlandi: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-2.5 transition-colors",
        tamamlandi
          ? "border-green-300 bg-green-50/50"
          : "border-stone-200 bg-stone-50/50",
      )}
    >
      <div className="text-muted-foreground mb-1 flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase">
        {ikon}
        {baslik}
        {tamamlandi && (
          <CheckCircle2 size={11} className="ml-auto text-green-600" />
        )}
      </div>
      {children}
    </div>
  );
}

function Satir({
  etiket,
  deger,
  vurgulu,
}: {
  etiket: string;
  deger: string;
  vurgulu?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{etiket}:</span>
      <span
        className={cn(
          "font-tabular truncate text-right",
          vurgulu ? "text-base font-bold text-orange-700" : "font-semibold",
        )}
      >
        {deger}
      </span>
    </div>
  );
}
