"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Phone, PhoneOff, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/shared/lib/utils";
import { formatPara } from "@/shared/lib/para";
import { avatarGradient } from "@/modules/dashboard/types";
import type {
  HedefMusteri,
  MusteriFiltresi,
} from "@/modules/whatsapp/types";

interface HedefSecAdimiProps {
  hedefIds: string[];
  onHedeflerDegis: (ids: string[]) => void;
  onIleri: () => void;
  onGeri: () => void;
}

export function HedefSecAdimi({
  hedefIds,
  onHedeflerDegis,
  onIleri,
  onGeri,
}: HedefSecAdimiProps) {
  const [durum, setDurum] = useState<MusteriFiltresi["durum"]>("borclu");
  const [etiket, setEtiket] = useState<string>("");
  const [minBorc, setMinBorc] = useState<string>("1");
  const [musteriler, setMusteriler] = useState<HedefMusteri[]>([]);
  const [etiketler, setEtiketler] = useState<string[]>([]);
  const [telefonsuzSayisi, setTelefonsuzSayisi] = useState(0);
  const [yukleniyor, setYukleniyor] = useState(false);

  const fetchle = useCallback(async () => {
    setYukleniyor(true);
    try {
      const sp = new URLSearchParams();
      sp.set("durum", durum);
      if (etiket) sp.set("etiket", etiket);
      if (minBorc && Number(minBorc) > 0) sp.set("minBorc", minBorc);
      const r = await fetch(`/api/whatsapp/musteriler-filtre?${sp.toString()}`);
      const j = (await r.json()) as {
        basarili: boolean;
        veri?: HedefMusteri[];
        etiketler?: string[];
        telefonsuzSayisi?: number;
      };
      if (j.basarili && j.veri) {
        setMusteriler(j.veri);
        setEtiketler(j.etiketler ?? []);
        setTelefonsuzSayisi(j.telefonsuzSayisi ?? 0);
      }
    } finally {
      setYukleniyor(false);
    }
  }, [durum, etiket, minBorc]);

  useEffect(() => {
    void fetchle();
  }, [fetchle]);

  // Telefonu olanlar (gönderilebilir)
  const gonderilebilir = useMemo(
    () => musteriler.filter((m) => m.telefon && m.telefon.trim().length > 0),
    [musteriler],
  );

  const tumuSecili =
    gonderilebilir.length > 0 &&
    gonderilebilir.every((m) => hedefIds.includes(m.musteriId));

  function tumunuToggle() {
    if (tumuSecili) {
      onHedeflerDegis([]);
    } else {
      onHedeflerDegis(gonderilebilir.map((m) => m.musteriId));
    }
  }

  function birToggle(id: string) {
    if (hedefIds.includes(id)) {
      onHedeflerDegis(hedefIds.filter((x) => x !== id));
    } else {
      onHedeflerDegis([...hedefIds, id]);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Hedef Seç</h2>
        <p className="text-muted-foreground text-sm">
          Filtre + manuel seçim ile gönderilecek müşterileri belirleyin
        </p>
      </div>

      {/* Filtre */}
      <div className="grid grid-cols-1 gap-3 rounded-lg border bg-stone-50 p-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Müşteri Durumu</Label>
          <select
            value={durum}
            onChange={(e) =>
              setDurum(e.target.value as MusteriFiltresi["durum"])
            }
            className="border-input bg-background h-9 rounded-md border px-2 text-sm"
          >
            <option value="tum">Tümü</option>
            <option value="borclu">Borçlu olanlar</option>
            <option value="tahsil-edildi">Tahsil edilmiş</option>
            <option value="telefonsuz">Telefonu olmayan</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Etiket</Label>
          <select
            value={etiket}
            onChange={(e) => setEtiket(e.target.value)}
            className="border-input bg-background h-9 rounded-md border px-2 text-sm"
          >
            <option value="">Tümü</option>
            {etiketler.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Min. Borç (₺)</Label>
          <Input
            inputMode="decimal"
            value={minBorc}
            onChange={(e) => setMinBorc(e.target.value)}
            placeholder="0"
            className="h-9 text-sm"
          />
        </div>
      </div>

      {/* Özet + telefon uyarı */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div className="flex items-center gap-2">
          {yukleniyor ? (
            <Loader2 size={14} className="text-muted-foreground animate-spin" />
          ) : (
            <Phone size={14} className="text-emerald-600" />
          )}
          <span className="font-semibold">
            {musteriler.length} müşteri bulundu
          </span>
        </div>
        {telefonsuzSayisi > 0 && (
          <div className="flex items-center gap-1.5 rounded-md bg-amber-100 px-2.5 py-1 text-xs text-amber-900 ring-1 ring-amber-300">
            <AlertCircle size={11} />
            {telefonsuzSayisi} müşteride telefon yok ·{" "}
            {gonderilebilir.length} gönderilebilir
          </div>
        )}
        <span className="text-muted-foreground ml-auto text-xs">
          Seçili: <strong>{hedefIds.length}</strong> / {gonderilebilir.length}
        </span>
      </div>

      {/* Tümünü seç bar */}
      <div className="flex items-center justify-between rounded-md border bg-white p-2.5">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={tumuSecili}
            onChange={tumunuToggle}
            className="h-4 w-4"
          />
          Tümünü Seç ({gonderilebilir.length} telefonlu)
        </label>
        {hedefIds.length > 0 && (
          <button
            type="button"
            onClick={() => onHedeflerDegis([])}
            className="text-muted-foreground hover:text-foreground text-xs underline"
          >
            Seçimi temizle
          </button>
        )}
      </div>

      {/* Müşteri listesi */}
      <div className="-mr-2 max-h-[400px] overflow-y-auto pr-2">
        <div className="flex flex-col gap-1">
          {musteriler.map((m) => {
            const telefonsuz = !m.telefon || m.telefon.trim().length === 0;
            const secili = hedefIds.includes(m.musteriId);
            const grad = avatarGradient(m.musteriId);
            return (
              <label
                key={m.musteriId}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md border p-2.5 transition-colors",
                  telefonsuz && "cursor-not-allowed opacity-50",
                  secili
                    ? "border-orange-500 bg-orange-50"
                    : "border-stone-200 hover:bg-stone-50",
                )}
              >
                <input
                  type="checkbox"
                  checked={secili}
                  onChange={() => !telefonsuz && birToggle(m.musteriId)}
                  disabled={telefonsuz}
                  className="h-4 w-4 shrink-0"
                />
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-[10px] font-bold text-white",
                    grad.from,
                    grad.to,
                  )}
                >
                  {m.bashar}
                </span>
                <div className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span className="truncate text-sm font-semibold">
                    {m.adSoyad}
                  </span>
                  <span className="text-muted-foreground truncate text-[11px]">
                    {telefonsuz ? (
                      <span className="flex items-center gap-1 text-amber-700">
                        <PhoneOff size={10} />
                        Telefon yok
                      </span>
                    ) : (
                      m.telefon
                    )}
                  </span>
                </div>
                {m.kalanTutar > 0 && (
                  <span className="font-tabular text-xs font-bold text-red-600">
                    -{formatPara(m.kalanTutar)}
                  </span>
                )}
              </label>
            );
          })}
          {musteriler.length === 0 && !yukleniyor && (
            <p className="text-muted-foreground py-8 text-center text-xs">
              Filtreye uyan müşteri yok
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between border-t pt-4">
        <Button type="button" variant="outline" onClick={onGeri}>
          ← Geri
        </Button>
        <Button
          type="button"
          onClick={onIleri}
          disabled={hedefIds.length === 0}
        >
          İleri → ({hedefIds.length} seçili)
        </Button>
      </div>
    </div>
  );
}
