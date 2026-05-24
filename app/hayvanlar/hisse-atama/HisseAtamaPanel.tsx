"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPara, parsePara } from "@/shared/lib/para";
import { Check, Search, UserPlus } from "lucide-react";

interface HisseKisa {
  id: number;
  no: number;
  dolu: boolean;
  hisseFiyati: number;
}

interface KurbanKisa {
  id: number;
  kesimSirasi: number;
  kupeNo: string | null;
  hisseSayisi: number;
  bosHisseSayisi: number;
  hisseler: HisseKisa[];
}

interface AramaSonucu {
  id: number;
  adSoyad: string;
  telefon: string | null;
}

interface HisseAtamaPanelProps {
  kurbanlar: KurbanKisa[];
}

export function HisseAtamaPanel({ kurbanlar }: HisseAtamaPanelProps) {
  const router = useRouter();
  const [bekleniyor, startTransition] = useTransition();

  const [secilenKurban, setSecilenKurban] = useState<KurbanKisa | null>(null);
  const [secilenHisseler, setSecilenHisseler] = useState<number[]>([]);
  const [hisseFiyati, setHisseFiyati] = useState("");
  const [musteriQuery, setMusteriQuery] = useState("");
  const [sonuclar, setSonuclar] = useState<AramaSonucu[]>([]);
  const [secilenMusteri, setSecilenMusteri] = useState<AramaSonucu | null>(null);

  // Müşteri arama (debounced)
  useEffect(() => {
    if (musteriQuery.trim().length < 2) {
      setSonuclar([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(
          `/api/musteriler/ara?q=${encodeURIComponent(musteriQuery.trim())}&limit=8`,
        );
        const v = (await r.json()) as { sonuclar: AramaSonucu[] };
        setSonuclar(v.sonuclar);
      } catch {
        setSonuclar([]);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [musteriQuery]);

  function kurbanSec(k: KurbanKisa) {
    setSecilenKurban(k);
    setSecilenHisseler([]);
    // İlk boş hissenin fiyatını otomatik doldur
    const ilk = k.hisseler.find((h) => !h.dolu);
    if (ilk) setHisseFiyati(String(ilk.hisseFiyati));
  }

  function hisseToggle(hisseId: number) {
    setSecilenHisseler((eski) =>
      eski.includes(hisseId)
        ? eski.filter((id) => id !== hisseId)
        : [...eski, hisseId],
    );
  }

  function temizle() {
    setSecilenKurban(null);
    setSecilenHisseler([]);
    setSecilenMusteri(null);
    setMusteriQuery("");
    setHisseFiyati("");
  }

  function atamayiTamamla() {
    if (!secilenKurban || !secilenMusteri || secilenHisseler.length === 0) return;
    const fiyat = parsePara(hisseFiyati);
    if (fiyat <= 0) {
      toast.error("Hisse fiyatı 0'dan büyük olmalı");
      return;
    }

    startTransition(async () => {
      try {
        const yanit = await fetch("/api/hisseler/ata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hisseIds: secilenHisseler,
            musteriId: secilenMusteri.id,
            hisseFiyati: fiyat,
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
          `${secilenHisseler.length} hisse ${secilenMusteri.adSoyad} üzerine atandı`,
        );
        temizle();
        router.refresh();
      } catch (e) {
        const m = e instanceof Error ? e.message : "Hata";
        toast.error(m);
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>1. Kurban Seç</CardTitle>
        </CardHeader>
        <CardContent>
          {kurbanlar.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Tüm hisseler atanmış 🎉
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {kurbanlar.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => kurbanSec(k)}
                  className={`rounded-md border p-2 text-center transition-colors ${
                    secilenKurban?.id === k.id
                      ? "border-primary bg-primary/10"
                      : "hover:border-primary/40"
                  }`}
                >
                  <div className="font-mono font-bold">#{k.kesimSirasi}</div>
                  <div className="text-muted-foreground text-xs">
                    {k.bosHisseSayisi} boş
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Boş Hisseleri Seç</CardTitle>
        </CardHeader>
        <CardContent>
          {!secilenKurban ? (
            <p className="text-muted-foreground text-sm">Önce kurban seçin</p>
          ) : (
            <>
              <div className="mb-3 grid grid-cols-7 gap-1.5">
                {secilenKurban.hisseler.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    disabled={h.dolu}
                    onClick={() => hisseToggle(h.id)}
                    className={`flex h-10 items-center justify-center rounded-md font-mono text-sm font-semibold transition-colors ${
                      h.dolu
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : secilenHisseler.includes(h.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                    }`}
                    title={h.dolu ? "Dolu" : `Boş — ${formatPara(h.hisseFiyati)}`}
                  >
                    {h.no}
                  </button>
                ))}
              </div>
              <p className="text-muted-foreground mb-3 text-xs">
                {secilenHisseler.length} hisse seçili · Dolu hisseler tıklanamaz
              </p>
              <Label htmlFor="fiyat">Hisse Fiyatı (her biri için)</Label>
              <Input
                id="fiyat"
                inputMode="decimal"
                value={hisseFiyati}
                onChange={(e) => setHisseFiyati(e.target.value)}
                className="font-tabular mt-1 text-right"
                placeholder="0"
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Müşteri Seç</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-3">
            <Search
              size={16}
              className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
            />
            <Input
              value={musteriQuery}
              onChange={(e) => {
                setMusteriQuery(e.target.value);
                setSecilenMusteri(null);
              }}
              placeholder="İsim, soyisim, telefon..."
              className="pl-9"
            />
          </div>

          {secilenMusteri ? (
            <div className="border-primary bg-primary/5 flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">{secilenMusteri.adSoyad}</p>
                <p className="text-muted-foreground text-xs">
                  {secilenMusteri.telefon ?? "Telefon yok"}
                </p>
              </div>
              <Check size={18} className="text-primary" />
            </div>
          ) : musteriQuery.trim().length >= 2 ? (
            sonuclar.length === 0 ? (
              <div className="rounded-md border p-3 text-center">
                <p className="text-muted-foreground mb-2 text-sm">
                  Sonuç yok.
                </p>
                <a
                  href={`/musteriler/yeni?next=/hayvanlar/hisse-atama`}
                  className="text-primary text-sm hover:underline"
                >
                  <UserPlus size={12} className="inline" /> Yeni müşteri ekle
                </a>
              </div>
            ) : (
              <div className="divide-y rounded-md border">
                {sonuclar.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSecilenMusteri(m)}
                    className="hover:bg-muted/50 w-full px-3 py-2 text-left"
                  >
                    <p className="text-sm font-medium">{m.adSoyad}</p>
                    <p className="text-muted-foreground text-xs">
                      {m.telefon ?? "Telefon yok"}
                    </p>
                  </button>
                ))}
              </div>
            )
          ) : (
            <p className="text-muted-foreground text-sm">
              En az 2 karakter girin.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Onayla</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kurban:</span>
              <span className="font-medium">
                {secilenKurban
                  ? `#${secilenKurban.kesimSirasi}`
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hisse:</span>
              <span className="font-medium">
                {secilenHisseler.length > 0
                  ? secilenHisseler.length + " adet"
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Müşteri:</span>
              <span className="font-medium">
                {secilenMusteri?.adSoyad ?? "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Her hisse:</span>
              <span className="font-tabular font-medium">
                {hisseFiyati ? formatPara(parsePara(hisseFiyati)) : "—"}
              </span>
            </div>
            <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
              <span>Toplam Bedel:</span>
              <span className="font-tabular">
                {hisseFiyati && secilenHisseler.length > 0
                  ? formatPara(
                      parsePara(hisseFiyati) * secilenHisseler.length,
                    )
                  : "—"}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={temizle}
              disabled={bekleniyor}
              className="flex-1"
            >
              Temizle
            </Button>
            <Button
              type="button"
              onClick={atamayiTamamla}
              disabled={
                bekleniyor ||
                !secilenKurban ||
                !secilenMusteri ||
                secilenHisseler.length === 0 ||
                parsePara(hisseFiyati) <= 0
              }
              className="flex-1"
            >
              {bekleniyor ? "Atanıyor..." : "Atamayı Onayla"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
