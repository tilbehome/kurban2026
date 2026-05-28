"use client";

/**
 * Hisse Transfer Client — 3 panel akış (mobil-first):
 *
 *   1. Mevcut hissedar (kaynak) — arama + seç → hisseleri listele → bir hisse seç
 *   2. Hedef hissedar — arama + seç (kaynak müşteri hariç)
 *   3. Sebep + Transfer onayı
 *
 * Backend: POST /api/hisseler/[id]/transfer (mevcut, schema dokunulmuyor).
 * Ödeme geçmişi korunur (hisseId değişmez).
 */

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowDown,
  CheckCircle2,
  Loader2,
  Repeat,
  Search,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { cn } from "@/shared/lib/utils";
import { formatPara } from "@/shared/lib/para";

interface MusteriArama {
  id: string;
  adSoyad: string;
  telefon: string | null;
}

interface MusteriHisse {
  id: string;
  no: number;
  hisseFiyati: number;
  kesimSirasi: number;
  kupeNo: string | null;
  odenenTutar: number;
  kalan: number;
}

export function HisseTransferClient() {
  const router = useRouter();
  const [kaynakMusteri, setKaynakMusteri] = useState<MusteriArama | null>(null);
  const [kaynakHisseler, setKaynakHisseler] = useState<MusteriHisse[]>([]);
  const [kaynakHisseYukleniyor, setKaynakHisseYukleniyor] = useState(false);
  const [seciliHisse, setSeciliHisse] = useState<MusteriHisse | null>(null);
  const [hedefMusteri, setHedefMusteri] = useState<MusteriArama | null>(null);
  const [sebep, setSebep] = useState("");
  const [tamamlandi, setTamamlandi] = useState(false);
  const [bekleniyor, startTransition] = useTransition();

  // Kaynak müşteri seçilince hisselerini yükle
  useEffect(() => {
    if (!kaynakMusteri) {
      setKaynakHisseler([]);
      setSeciliHisse(null);
      return;
    }
    setKaynakHisseYukleniyor(true);
    setSeciliHisse(null);
    fetch(`/api/musteriler/${kaynakMusteri.id}/hisseler`)
      .then((r) => r.json())
      .then((veri) => {
        if (veri.basarili && Array.isArray(veri.veri)) {
          setKaynakHisseler(veri.veri);
        } else {
          toast.error(veri.hata ?? "Hisseler alınamadı");
        }
      })
      .catch(() => toast.error("Bağlantı hatası"))
      .finally(() => setKaynakHisseYukleniyor(false));
  }, [kaynakMusteri]);

  function transferEt() {
    if (!seciliHisse || !hedefMusteri) return;
    startTransition(async () => {
      try {
        const r = await fetch(`/api/hisseler/${seciliHisse.id}/transfer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            yeniMusteriId: hedefMusteri.id,
            sebep: sebep.trim() || undefined,
          }),
        });
        const sonuc = (await r.json()) as {
          basarili: boolean;
          hata?: string;
        };
        if (!r.ok || !sonuc.basarili) {
          throw new Error(sonuc.hata ?? "Transfer başarısız");
        }
        toast.success(
          `✓ ${kaynakMusteri?.adSoyad} → ${hedefMusteri.adSoyad}: DANA-${seciliHisse.kesimSirasi}.${seciliHisse.no} devredildi`,
        );
        setTamamlandi(true);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Hata");
      }
    });
  }

  function sifirla() {
    setKaynakMusteri(null);
    setKaynakHisseler([]);
    setSeciliHisse(null);
    setHedefMusteri(null);
    setSebep("");
    setTamamlandi(false);
  }

  // Başarılı transfer ekranı
  if (tamamlandi && kaynakMusteri && hedefMusteri && seciliHisse) {
    return (
      <Card className="border-emerald-300 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
        <h3 className="mt-3 text-xl font-bold text-emerald-900">
          Transfer Tamamlandı
        </h3>
        <p className="mt-2 text-sm text-emerald-700">
          DANA-{seciliHisse.kesimSirasi}.{seciliHisse.no} hissesi devredildi
        </p>
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <div className="rounded-md bg-white px-3 py-2">
            <div className="text-xs text-muted-foreground">Eski</div>
            <div className="font-semibold">{kaynakMusteri.adSoyad}</div>
          </div>
          <ArrowDown className="text-emerald-600 -rotate-90" />
          <div className="rounded-md bg-white px-3 py-2">
            <div className="text-xs text-muted-foreground">Yeni</div>
            <div className="font-semibold">{hedefMusteri.adSoyad}</div>
          </div>
        </div>
        <p className="mt-3 text-xs text-emerald-700">
          Ödeme geçmişi korundu, yeni hissedarın lehine sayıldı.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            variant="outline"
            onClick={() => router.push(`/musteriler/${hedefMusteri.id}`)}
          >
            Yeni Hissedar Detayı
          </Button>
          <Button
            onClick={sifirla}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Yeni Transfer
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* ADIM 1 — KAYNAK MÜŞTERİ */}
      <PanelMusteriSec
        baslik="1. Mevcut Hissedar (Devreden)"
        ikonRenk="bg-amber-100 text-amber-700"
        secili={kaynakMusteri}
        setSecili={setKaynakMusteri}
        haricEt={[]}
      />

      {/* ADIM 1B — KAYNAK MÜŞTERİNİN HİSSELERİ */}
      {kaynakMusteri && (
        <Card className="p-4">
          <h4 className="mb-3 text-sm font-semibold">
            Devredilecek hisse seç
          </h4>
          {kaynakHisseYukleniyor ? (
            <div className="py-4 text-center">
              <Loader2 className="text-muted-foreground mx-auto h-5 w-5 animate-spin" />
            </div>
          ) : kaynakHisseler.length === 0 ? (
            <p className="text-muted-foreground text-sm italic">
              Bu müşterinin hissesi yok.
            </p>
          ) : (
            <div className="space-y-2">
              {kaynakHisseler.map((h) => {
                const aktif = seciliHisse?.id === h.id;
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setSeciliHisse(h)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md border-2 p-3 text-left transition-all",
                      aktif
                        ? "border-orange-500 bg-orange-50"
                        : "hover:bg-muted/40 border-border",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg font-mono text-xs font-bold",
                        aktif
                          ? "bg-orange-500 text-white"
                          : "bg-orange-100 text-orange-700",
                      )}
                    >
                      {h.kesimSirasi}.{h.no}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">
                        DANA-{h.kesimSirasi} · Hisse {h.no}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {formatPara(h.hisseFiyati)} · Ödenen{" "}
                        {formatPara(h.odenenTutar)} ·{" "}
                        <span
                          className={
                            h.kalan > 0 ? "text-red-600" : "text-green-600"
                          }
                        >
                          Kalan {formatPara(h.kalan)}
                        </span>
                      </div>
                    </div>
                    {aktif && (
                      <CheckCircle2 className="h-5 w-5 text-orange-500" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* OK GÖSTERGESİ */}
      {seciliHisse && (
        <div className="flex justify-center">
          <ArrowDown className="text-muted-foreground h-6 w-6" />
        </div>
      )}

      {/* ADIM 2 — HEDEF MÜŞTERİ */}
      {seciliHisse && (
        <PanelMusteriSec
          baslik="2. Yeni Hissedar (Devralan)"
          ikonRenk="bg-emerald-100 text-emerald-700"
          secili={hedefMusteri}
          setSecili={setHedefMusteri}
          haricEt={kaynakMusteri ? [kaynakMusteri.id] : []}
        />
      )}

      {/* ADIM 3 — SEBEP + ONAY */}
      {seciliHisse && hedefMusteri && (
        <Card className="p-4">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Repeat className="h-4 w-4 text-orange-500" />
            3. Devir Sebebi (opsiyonel)
          </h4>
          <Textarea
            value={sebep}
            onChange={(e) => setSebep(e.target.value)}
            placeholder="Ör: Asıl hissedar değişti, aile devri, hatalı kayıt düzeltme..."
            rows={2}
          />

          <div className="my-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="mb-2 flex items-start gap-2 text-sm font-semibold text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Onay
            </div>
            <p className="text-xs text-amber-800">
              <strong>{kaynakMusteri?.adSoyad}</strong> üzerindeki{" "}
              <strong>
                DANA-{seciliHisse.kesimSirasi} H{seciliHisse.no}
              </strong>{" "}
              hissesi <strong>{hedefMusteri.adSoyad}</strong>'a devredilecek.
              {seciliHisse.odenenTutar > 0 && (
                <>
                  {" "}
                  Önceki ödemeler ({formatPara(seciliHisse.odenenTutar)})
                  yeni hissedarın lehine sayılır.
                </>
              )}
            </p>
          </div>

          <Button
            onClick={transferEt}
            disabled={bekleniyor}
            className="h-12 w-full bg-orange-500 hover:bg-orange-600"
          >
            {bekleniyor ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Transfer Ediliyor...
              </>
            ) : (
              <>
                <Repeat className="mr-2 h-4 w-4" />
                Transferi Onayla
              </>
            )}
          </Button>
        </Card>
      )}
    </div>
  );
}

function PanelMusteriSec({
  baslik,
  ikonRenk,
  secili,
  setSecili,
  haricEt,
}: {
  baslik: string;
  ikonRenk: string;
  secili: MusteriArama | null;
  setSecili: (m: MusteriArama | null) => void;
  haricEt: ReadonlyArray<string>;
}) {
  const [arama, setArama] = useState("");
  const [sonuclar, setSonuclar] = useState<MusteriArama[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const aramaRef = useRef<AbortController | null>(null);

  const filtreleSonuclari = useCallback(
    (liste: MusteriArama[]) => liste.filter((m) => !haricEt.includes(m.id)),
    [haricEt],
  );

  useEffect(() => {
    const q = arama.trim();
    if (q.length < 2) {
      setSonuclar([]);
      return;
    }
    aramaRef.current?.abort();
    const ctrl = new AbortController();
    aramaRef.current = ctrl;
    setYukleniyor(true);
    const t = setTimeout(() => {
      fetch(`/api/musteriler?arama=${encodeURIComponent(q)}&limit=15`, {
        signal: ctrl.signal,
      })
        .then((r) => r.json())
        .then((veri) => {
          if (Array.isArray(veri.liste)) {
            setSonuclar(filtreleSonuclari(veri.liste));
          }
        })
        .catch(() => {
          /* sessiz */
        })
        .finally(() => setYukleniyor(false));
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [arama, filtreleSonuclari]);

  if (secili) {
    return (
      <Card className="p-4">
        <h4 className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
          {baslik}
        </h4>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full font-bold",
              ikonRenk,
            )}
          >
            {secili.adSoyad.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="font-semibold">{secili.adSoyad}</div>
            <div className="text-muted-foreground text-xs">
              {secili.telefon ?? "Telefon yok"}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSecili(null);
              setArama("");
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Users className="h-4 w-4 text-orange-500" />
        {baslik}
      </h4>
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          placeholder="Ad veya telefon ile ara..."
          className="h-12 pl-9 text-base"
        />
      </div>
      <div className="mt-3 max-h-64 overflow-y-auto">
        {yukleniyor && (
          <div className="py-2 text-center">
            <Loader2 className="text-muted-foreground mx-auto h-4 w-4 animate-spin" />
          </div>
        )}
        {sonuclar.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setSecili(m)}
            className="hover:bg-muted/40 mb-1 flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-700">
              {m.adSoyad.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{m.adSoyad}</div>
              <div className="text-muted-foreground text-xs">
                {m.telefon ?? "—"}
              </div>
            </div>
          </button>
        ))}
        {arama.trim().length >= 2 && !yukleniyor && sonuclar.length === 0 && (
          <div className="text-muted-foreground py-3 text-center text-sm">
            Sonuç yok
          </div>
        )}
      </div>
    </Card>
  );
}
