"use client";

/**
 * Müşteri düzenleme formu — YeniMusteriForm'un türevi.
 *
 * Farklar:
 *  - İlk değerler mevcut müşteri kaydından gelir
 *  - Submit PATCH /api/musteriler/[id] (POST değil)
 *  - "Kaydet + Yeni Müşteri" butonu YOK (anlamsız)
 *  - Duplikat kontrolü kendisi hariç (musteri.id eşleşmesi gözardı edilir)
 *  - Başarılı güncelleme sonrası /musteriler/[id] detay sayfasına döner
 */

import { useEffect, useMemo, useState, useTransition } from "react";
import type { KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  MapPin,
  Save,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/shared/lib/utils";
import {
  telefonApiFormat,
  telefonGecerli,
  telefonGoster,
  telefonNormalize,
} from "@/shared/lib/telefon-formu";
import { tcKimlikGecerli } from "@/shared/lib/tc-dogrula";
import {
  ETIKET_KEYS,
  MUSTERI_ETIKETLERI,
  etiketleriParse,
  etiketleriSerialize,
} from "@/modules/musteriler/lib/etiketler";

interface MusteriVeri {
  id: string;
  adSoyad: string;
  telefon: string | null;
  tcKimlik: string | null;
  adres: string | null;
  notlar: string | null;
  etiketler: string | null;
}

interface FormVeri {
  adSoyad: string;
  telefon: string;
  tcKimlik: string;
  adres: string;
  notlar: string;
  etiketler: string[];
}

interface DuplikatBilgi {
  id: string;
  adSoyad: string;
}

interface Props {
  musteri: MusteriVeri;
}

export function MusteriDuzenleForm({ musteri }: Props) {
  const router = useRouter();
  const [bekleniyor, startTransition] = useTransition();

  const ilkEtiketler = useMemo(
    () => etiketleriParse(musteri.etiketler),
    [musteri.etiketler],
  );

  const [veri, setVeri] = useState<FormVeri>({
    adSoyad: musteri.adSoyad,
    telefon: musteri.telefon ? telefonGoster(musteri.telefon) : "",
    tcKimlik: musteri.tcKimlik ?? "",
    adres: musteri.adres ?? "",
    notlar: musteri.notlar ?? "",
    etiketler: ilkEtiketler,
  });
  const [hatalar, setHatalar] = useState<Partial<Record<keyof FormVeri, string>>>(
    {},
  );
  const [duplikat, setDuplikat] = useState<DuplikatBilgi | null>(null);

  // Anlık validasyon
  useEffect(() => {
    const h: Partial<Record<keyof FormVeri, string>> = {};

    const ad = veri.adSoyad.trim();
    if (ad.length > 0) {
      const kelime = ad.split(/\s+/).filter((k) => k.length >= 2);
      if (kelime.length < 2) {
        h.adSoyad = "Ad ve soyad ayrı olmalı (örn: Ahmet Yılmaz)";
      }
    }

    if (veri.telefon.trim() && !telefonGecerli(veri.telefon)) {
      h.telefon = "Geçerli bir cep numarası girin (5XX ile başlamalı)";
    }

    const tc = veri.tcKimlik.trim();
    if (tc.length > 0) {
      if (tc.length !== 11) {
        h.tcKimlik = "TC 11 hane olmalı";
      } else if (!tcKimlikGecerli(tc)) {
        h.tcKimlik = "Geçersiz TC numarası";
      }
    }

    setHatalar(h);
  }, [veri]);

  // Duplikat kontrolü — kendisi hariç
  useEffect(() => {
    if (!telefonGecerli(veri.telefon)) {
      setDuplikat(null);
      return;
    }
    const tel = telefonApiFormat(veri.telefon);
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(
          `/api/musteriler?arama=${encodeURIComponent(tel)}&limit=10`,
          { signal: ctrl.signal },
        );
        if (!r.ok) return;
        const data = (await r.json()) as {
          liste?: Array<{ id: string; adSoyad: string; telefon: string | null }>;
        };
        const eslesen = (data.liste ?? []).find(
          (m) =>
            m.id !== musteri.id &&
            telefonApiFormat(m.telefon ?? "") === tel,
        );
        setDuplikat(eslesen ?? null);
      } catch {
        // sessiz fail
      }
    }, 500);
    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [veri.telefon, musteri.id]);

  function alanGuncelle<K extends keyof FormVeri>(k: K, v: FormVeri[K]) {
    setVeri((eski) => ({ ...eski, [k]: v }));
  }

  function adGuncelle(v: string) {
    alanGuncelle("adSoyad", v.toLocaleUpperCase("tr-TR"));
  }

  function telefonInputDegisti(v: string) {
    alanGuncelle("telefon", telefonGoster(v));
  }

  function tcInputDegisti(v: string) {
    alanGuncelle("tcKimlik", v.replace(/\D/g, "").slice(0, 11));
  }

  function etiketToggle(key: string) {
    setVeri((eski) => ({
      ...eski,
      etiketler: eski.etiketler.includes(key)
        ? eski.etiketler.filter((e) => e !== key)
        : [...eski.etiketler, key],
    }));
  }

  function gonderebilir(): boolean {
    const ad = veri.adSoyad.trim();
    if (ad.length < 3) return false;
    if (ad.split(/\s+/).filter((k) => k.length >= 2).length < 2) return false;
    if (Object.keys(hatalar).length > 0) return false;
    return true;
  }

  function guncelle() {
    if (!gonderebilir()) {
      toast.error("Lütfen zorunlu alanları doldurun");
      return;
    }
    startTransition(async () => {
      try {
        const payload = {
          adSoyad: veri.adSoyad.trim(),
          telefon: veri.telefon.trim() ? telefonNormalize(veri.telefon) : null,
          tcKimlik: veri.tcKimlik.trim() || null,
          adres: veri.adres.trim() || null,
          notlar: veri.notlar.trim() || null,
          etiketler:
            veri.etiketler.length > 0
              ? etiketleriSerialize(veri.etiketler)
              : null,
        };

        const r = await fetch(`/api/musteriler/${musteri.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const sonuc = (await r.json().catch(() => ({}))) as {
          basarili?: boolean;
          hata?: string;
        };
        if (!r.ok || !sonuc.basarili) {
          throw new Error(sonuc.hata ?? "Güncelleme başarısız");
        }

        toast.success(`✓ ${veri.adSoyad} güncellendi`);
        router.push(`/musteriler/${musteri.id}`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Hata");
      }
    });
  }

  function klavyeKisayolu(e: KeyboardEvent<HTMLFormElement>) {
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      guncelle();
    }
  }

  const tcGecerli =
    veri.tcKimlik.length === 11 && tcKimlikGecerli(veri.tcKimlik);
  const telGecerli = telefonGecerli(veri.telefon);
  const aktifEdilebilir = gonderebilir();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        guncelle();
      }}
      onKeyDown={klavyeKisayolu}
      className="flex flex-col gap-4"
    >
      {/* KART 1 — Kişisel Bilgiler */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-orange-500" />
            Kişisel Bilgiler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="adSoyad" className="flex items-center gap-1">
              Ad Soyad <span className="text-red-500">*</span>
            </Label>
            <Input
              id="adSoyad"
              autoFocus
              required
              minLength={3}
              placeholder="AHMET YILMAZ"
              value={veri.adSoyad}
              onChange={(e) => adGuncelle(e.target.value)}
              className={cn(
                "h-11 text-base",
                hatalar.adSoyad &&
                  "border-red-500 focus-visible:ring-red-200",
              )}
            />
            {hatalar.adSoyad && (
              <p className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="h-3 w-3" />
                {hatalar.adSoyad}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="telefon">Telefon</Label>
              <Input
                id="telefon"
                type="tel"
                inputMode="tel"
                placeholder="0532 123 45 67"
                value={veri.telefon}
                onChange={(e) => telefonInputDegisti(e.target.value)}
                className={cn(
                  "h-11 font-mono text-base",
                  hatalar.telefon &&
                    "border-red-500 focus-visible:ring-red-200",
                  telGecerli && !hatalar.telefon && "border-emerald-500",
                )}
              />
              {hatalar.telefon ? (
                <p className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  {hatalar.telefon}
                </p>
              ) : telGecerli ? (
                <p className="flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Geçerli numara
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tcKimlik">
                TC Kimlik{" "}
                <span className="text-xs text-muted-foreground">
                  (opsiyonel)
                </span>
              </Label>
              <Input
                id="tcKimlik"
                inputMode="numeric"
                maxLength={11}
                placeholder="12345678901"
                value={veri.tcKimlik}
                onChange={(e) => tcInputDegisti(e.target.value)}
                className={cn(
                  "h-11 font-mono text-base",
                  hatalar.tcKimlik &&
                    "border-red-500 focus-visible:ring-red-200",
                  tcGecerli && !hatalar.tcKimlik && "border-emerald-500",
                )}
              />
              {hatalar.tcKimlik ? (
                <p className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  {hatalar.tcKimlik}
                </p>
              ) : tcGecerli ? (
                <p className="flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Geçerli TC
                </p>
              ) : null}
            </div>
          </div>

          {duplikat && (
            <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-3">
              <p className="flex items-start gap-2 text-sm text-amber-900">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Bu telefon başka müşteride kayıtlı:{" "}
                  <strong>{duplikat.adSoyad}</strong>.{" "}
                  <Link
                    href={`/musteriler/${duplikat.id}`}
                    className="font-semibold underline"
                  >
                    Diğer müşteriyi aç →
                  </Link>
                </span>
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label>
              Etiketler{" "}
              <span className="text-xs text-muted-foreground">
                ({veri.etiketler.length} seçili)
              </span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {ETIKET_KEYS.map((key) => {
                const et = MUSTERI_ETIKETLERI[key]!;
                const aktif = veri.etiketler.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => etiketToggle(key)}
                    title={et.aciklama}
                    aria-pressed={aktif}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-medium transition-all",
                      aktif
                        ? `${et.renk} scale-105 shadow-sm`
                        : "border-border bg-white text-muted-foreground hover:border-foreground/30",
                    )}
                  >
                    <span aria-hidden="true">{et.ikon}</span>
                    {et.ad}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KART 2 — İletişim & Adres */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-orange-500" />
            İletişim & Adres
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="adres">Adres</Label>
            <Textarea
              id="adres"
              rows={2}
              placeholder="Mahalle, sokak, no, ilçe/il"
              value={veri.adres}
              onChange={(e) => alanGuncelle("adres", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notlar">Notlar</Label>
            <Textarea
              id="notlar"
              rows={2}
              placeholder="Özel istek, alerji, vekalet detayı, vb."
              value={veri.notlar}
              onChange={(e) => alanGuncelle("notlar", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Butonlar */}
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/musteriler/${musteri.id}`)}
          disabled={bekleniyor}
        >
          İptal
        </Button>

        <Button
          type="submit"
          disabled={bekleniyor || !aktifEdilebilir}
          className="bg-orange-500 hover:bg-orange-600"
          title="Ctrl+Enter"
        >
          <Save className="mr-1.5 h-4 w-4" />
          {bekleniyor ? "Güncelleniyor..." : "Müşteriyi Güncelle"}
        </Button>
      </div>

      <p className="mt-2 text-center text-xs text-muted-foreground">
        <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">Ctrl</kbd>
        {" + "}
        <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">Enter</kbd>
        {" ile kaydet"}
      </p>
    </form>
  );
}
