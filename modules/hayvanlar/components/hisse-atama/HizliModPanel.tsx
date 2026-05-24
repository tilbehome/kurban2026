"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  Zap,
  Search,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/shared/lib/utils";
import { formatPara, parsePara } from "@/shared/lib/para";
import { avatarGradient } from "@/modules/dashboard/types";
import { useKlavyeKisayollari } from "@/shared/hooks/useKlavyeKisayollari";
import type {
  KurbanKartVeri,
  EksikHisseliMusteri,
} from "@/modules/hayvanlar/types/hisse-atama";

interface HizliModPanelProps {
  kurbanlar: KurbanKartVeri[];
  musteriler: EksikHisseliMusteri[];
}

interface TopluAtama {
  hisseId: string;
  hisseEtiket: string; // "#5.3"
  musteriId: string;
  musteriAdSoyad: string;
  hisseFiyati: number;
}

/**
 * Hızlı Mod — klavye odaklı çoklu atama.
 *
 * Akış:
 * 1. Müşteri checkbox seç (ya da klavyeyle gez)
 * 2. Bir boş hisse tıkla → atama kuyruğa eklenir
 * 3. Tab / Enter ile sıradakine geç
 * 4. "Tümünü Onayla" → /api/hisseler/toplu-ata
 */
export function HizliModPanel({ kurbanlar, musteriler }: HizliModPanelProps) {
  const router = useRouter();
  const [bekleniyor, startTransition] = useTransition();

  const [musteriArama, setMusteriArama] = useState("");
  const [secilenMusteriId, setSecilenMusteriId] = useState<string | null>(null);
  const [varsayilanFiyat, setVarsayilanFiyat] = useState<string>("");
  const [kuyruk, setKuyruk] = useState<TopluAtama[]>([]);

  const musteriFiltreli = useMemo(() => {
    const q = musteriArama.trim().toLowerCase();
    if (!q) return musteriler.slice(0, 30);
    return musteriler
      .filter(
        (m) =>
          m.adSoyad.toLowerCase().includes(q) ||
          m.telefon?.toLowerCase().includes(q),
      )
      .slice(0, 50);
  }, [musteriler, musteriArama]);

  const secilenMusteri = useMemo(
    () => musteriler.find((m) => m.id === secilenMusteriId) ?? null,
    [musteriler, secilenMusteriId],
  );

  const bosHisseler = useMemo(
    () =>
      kurbanlar
        .flatMap((k) =>
          k.hisseler
            .filter((h) => h.durum === "bos")
            .map((h) => ({ kurban: k, hisse: h })),
        )
        .filter(
          ({ hisse }) => !kuyruk.some((q) => q.hisseId === hisse.id),
        ),
    [kurbanlar, kuyruk],
  );

  function hisseEkle(hisseId: string, hisseEtiket: string, fiyat: number) {
    if (!secilenMusteri) {
      toast.error("Önce bir müşteri seçin");
      return;
    }
    if (kuyruk.some((q) => q.hisseId === hisseId)) {
      toast.error("Bu hisse zaten kuyrukta");
      return;
    }
    const kullanilacakFiyat =
      parsePara(varsayilanFiyat) > 0 ? parsePara(varsayilanFiyat) : fiyat;
    if (kullanilacakFiyat <= 0) {
      toast.error("Hisse fiyatı 0'dan büyük olmalı");
      return;
    }
    setKuyruk((eski) => [
      ...eski,
      {
        hisseId,
        hisseEtiket,
        musteriId: secilenMusteri.id,
        musteriAdSoyad: secilenMusteri.adSoyad,
        hisseFiyati: kullanilacakFiyat,
      },
    ]);
  }

  function kuyruktanCikar(hisseId: string) {
    setKuyruk((eski) => eski.filter((q) => q.hisseId !== hisseId));
  }

  function tumunuOnayla() {
    if (kuyruk.length === 0) {
      toast.error("Kuyrukta atama yok");
      return;
    }
    startTransition(async () => {
      try {
        const yanit = await fetch("/api/hisseler/toplu-ata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            atamalar: kuyruk.map((q) => ({
              hisseId: q.hisseId,
              musteriId: q.musteriId,
              hisseFiyati: q.hisseFiyati,
            })),
          }),
        });
        const sonuc = (await yanit.json()) as {
          basarili: boolean;
          basariliAtama?: number;
          atlanan?: number;
          atlananDetay?: { hisseId: string; sebep: string }[];
          hata?: string;
        };
        if (!yanit.ok || !sonuc.basarili) {
          throw new Error(sonuc.hata ?? "Toplu atama başarısız");
        }
        toast.success(
          `${sonuc.basariliAtama} atama yapıldı${
            sonuc.atlanan && sonuc.atlanan > 0
              ? ` · ${sonuc.atlanan} atlandı`
              : ""
          }`,
        );
        setKuyruk([]);
        setSecilenMusteriId(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Hata");
      }
    });
  }

  useKlavyeKisayollari(
    useMemo(
      () => [
        {
          tus: "Escape",
          eylem: () => {
            setSecilenMusteriId(null);
          },
        },
      ],
      [],
    ),
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Sol: Müşteriler */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Search size={14} />
            Müşteri Seç
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Input
            value={musteriArama}
            onChange={(e) => setMusteriArama(e.target.value)}
            placeholder="Ara..."
            className="h-9 text-sm"
            autoFocus
          />
          <div className="-mr-2 flex max-h-[400px] flex-col gap-1 overflow-y-auto pr-2">
            {musteriFiltreli.map((m) => {
              const grad = avatarGradient(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() =>
                    setSecilenMusteriId(m.id === secilenMusteriId ? null : m.id)
                  }
                  className={cn(
                    "flex items-center gap-2 rounded-md border p-2 text-left transition-colors",
                    m.id === secilenMusteriId
                      ? "border-orange-500 bg-orange-50 ring-1 ring-orange-300"
                      : "border-stone-200 hover:bg-stone-50",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-[10px] font-bold text-white",
                      grad.from,
                      grad.to,
                    )}
                  >
                    {m.bashar}
                  </span>
                  <span className="truncate text-xs">{m.adSoyad}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Orta: Boş Hisseler */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Zap size={14} className="text-orange-500" />
            Boş Hisseye Tıkla
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!secilenMusteri ? (
            <p className="text-muted-foreground py-8 text-center text-xs">
              Önce sol panelden müşteri seçin
            </p>
          ) : bosHisseler.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-xs">
              Boş hisse kalmadı 🎉
            </p>
          ) : (
            <div className="-mr-2 flex max-h-[400px] flex-col gap-1 overflow-y-auto pr-2">
              {bosHisseler.map(({ kurban, hisse }) => (
                <button
                  key={hisse.id}
                  type="button"
                  onClick={() =>
                    hisseEkle(
                      hisse.id,
                      `#${kurban.kesimSirasi}.${hisse.no}`,
                      hisse.hisseFiyati,
                    )
                  }
                  className="hover:bg-orange-50 hover:border-orange-300 flex items-center justify-between rounded-md border border-stone-200 p-2 text-left transition-colors"
                >
                  <span className="font-mono text-xs">
                    #{kurban.kesimSirasi}.{hisse.no}
                  </span>
                  <span className="font-tabular text-muted-foreground text-[11px]">
                    {formatPara(hisse.hisseFiyati)}
                  </span>
                  <ChevronRight size={12} className="text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sağ: Kuyruk + onay */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <CheckCircle2 size={14} className="text-green-600" />
            Atama Kuyruğu ({kuyruk.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="varsayilan" className="text-xs">
              Varsayılan Fiyat (boşsa hisse fiyatı)
            </Label>
            <Input
              id="varsayilan"
              inputMode="decimal"
              value={varsayilanFiyat}
              onChange={(e) => setVarsayilanFiyat(e.target.value)}
              placeholder="0"
              className="font-tabular h-8 text-right text-sm"
            />
          </div>
          <div className="-mr-2 flex max-h-[300px] flex-col gap-1 overflow-y-auto pr-2">
            {kuyruk.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-xs">
                Boş — bir hisseye tıklayın
              </p>
            ) : (
              kuyruk.map((q) => (
                <div
                  key={q.hisseId}
                  className="flex items-center justify-between gap-2 rounded-md border border-green-200 bg-green-50 p-2 text-xs"
                >
                  <div className="flex flex-col leading-tight">
                    <span className="font-mono font-semibold">
                      {q.hisseEtiket}
                    </span>
                    <span className="text-muted-foreground truncate">
                      {q.musteriAdSoyad}
                    </span>
                  </div>
                  <span className="font-tabular text-xs font-semibold">
                    {formatPara(q.hisseFiyati)}
                  </span>
                  <button
                    type="button"
                    onClick={() => kuyruktanCikar(q.hisseId)}
                    className="text-muted-foreground hover:text-red-600"
                    aria-label="Kuyruktan çıkar"
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
          <Button
            type="button"
            onClick={tumunuOnayla}
            disabled={bekleniyor || kuyruk.length === 0}
            className="w-full"
            size="sm"
          >
            <CheckCircle2 size={14} />
            {bekleniyor
              ? "Atanıyor..."
              : `Tümünü Onayla (${kuyruk.length})`}
          </Button>
          {kuyruk.length === 0 && (
            <p className="text-muted-foreground text-center text-[10px]">
              <kbd className="bg-stone-100 rounded border px-1">Esc</kbd> ·
              Müşteri seçimini iptal
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
