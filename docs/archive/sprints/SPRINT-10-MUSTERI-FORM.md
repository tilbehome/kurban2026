# SPRINT 10 — YENİ MÜŞTERİ FORMU MODERN UI

**Hedef:** `/musteriler/yeni` sayfasını tam fonksiyonel ve modern hale getir.
**Süre:** ~1.5 saat
**Risk:** Düşük-Orta — validasyon + UI değişiklikleri, schema'ya dokunulmuyor.
**Aciliyet:** Bayrama 1 gün — bugün bitir.

---

## 📋 YAPILACAKLAR (Hepsi Dahil)

### A. Validasyon
1. **Ad Soyad:** Min 2 kelime şart ("Ahmet" → ❌, "Ahmet Yılmaz" → ✅)
2. **Telefon:** Akıllı format + Türkiye numarası doğrulama
3. **TC Kimlik:** 11 hane + TC algoritma doğrulama
4. **Duplikat kontrolü:** Aynı telefon varsa uyarı

### B. Akıllı Telefon Formatlama
- `5321234567` → `<EXAMPLE_PHONE>` (auto-format)
- `<EXAMPLE_PHONE>` → `<EXAMPLE_PHONE>` (normalize)
- `<EXAMPLE_PHONE>` → `<EXAMPLE_PHONE>`
- Geçersiz: kırmızı border + hata mesajı

### C. Etiketler (Schema'da `etiketler` JSON alanı zaten var)
6 önceden tanımlı:
- 🟣 VIP
- 🔵 Aile
- 🟢 Geçen Yıl
- 🟡 Yeni
- 🟠 Toptan
- 🔴 Şüpheli

### D. Form Bölünmesi (2 Kart)
1. **Kişisel Bilgiler:** Ad Soyad, Telefon, TC, Etiketler
2. **İletişim & Adres:** Adres, Notlar

### E. Buton Davranışları
- **İptal:** geri git
- **Kaydet:** kaydet → müşteri detay sayfasına git (mevcut davranış)
- **Kaydet + Yeni Müşteri:** kaydet, formu sıfırla, AYNI sayfada kal

### F. Klavye + UX
- Ad Soyad: autoFocus + Tab navigation
- `Ctrl+Enter`: Kaydet
- `Ctrl+Shift+Enter`: Kaydet + Yeni Müşteri
- İlerleme göstergesi: zorunlu alanlar dolu mu

---

## ⛔ DOKUNMA

- Schema (`Musteri` modeli — `etiketler` JSON alanı zaten var)
- `POST /api/musteriler` endpoint (mevcut, çalışıyor — sadece `etiketler` payload'a eklenecek)
- Diğer müşteri sayfaları
- Auth/izin

---

## 📋 PRE-WRITE GATE (Hızlı)

```bash
# Mevcut form
cat app/musteriler/yeni/YeniMusteriForm.tsx

# API endpoint kontrol — etiketler kabul ediyor mu?
grep -A 20 "POST" app/api/musteriler/route.ts 2>/dev/null | head -40

# Mevcut etiket helper varsa
grep -rn "etiket" modules/musteriler/lib/ --include="*.ts" 2>/dev/null | head
```

**Raporla:**
- API POST `etiketler` alanını kabul ediyor mu? (Eğer hayır, zod schema'ya eklenmeli — tek satır)
- TC kimlik doğrulama helper'ı var mı, yoksa yazılacak mı?
- Mevcut müşteriler listesinde etiketler nasıl gösteriliyor?

---

## 🎯 KODA DÖKÜMÜ

### 1. Yeni Helper: `shared/lib/tc-dogrula.ts`

```typescript
/**
 * Türkiye TC Kimlik No algoritma doğrulama.
 * https://tckimlikalgoritma.com
 */
export function tcKimlikGecerli(tc: string): boolean {
  // Sadece 11 hane rakam
  if (!/^\d{11}$/.test(tc)) return false;

  const haneler = tc.split("").map(Number);

  // İlk hane 0 olamaz
  if (haneler[0] === 0) return false;

  // 10. hane kontrolü
  const tek = haneler[0] + haneler[2] + haneler[4] + haneler[6] + haneler[8];
  const cift = haneler[1] + haneler[3] + haneler[5] + haneler[7];
  const onuncu = (tek * 7 - cift) % 10;
  if (onuncu !== haneler[9]) return false;

  // 11. hane kontrolü
  const ilk10Toplam = haneler.slice(0, 10).reduce((a, b) => a + b, 0);
  if (ilk10Toplam % 10 !== haneler[10]) return false;

  return true;
}
```

### 2. Yeni Helper: `shared/lib/telefon-format.ts`

```typescript
/**
 * Türkiye mobil numara formatlama ve doğrulama.
 */

/** Tüm karakterleri temizle, normalize et */
export function telefonNormalize(tel: string): string {
  if (!tel) return "";
  let sade = tel.replace(/\D/g, "");

  // +90 veya 90 prefix temizle
  if (sade.startsWith("90") && sade.length > 10) {
    sade = sade.substring(2);
  }

  // 0 ile başlamıyorsa ekle
  if (sade.length === 10 && sade.startsWith("5")) {
    sade = "0" + sade;
  }

  // Max 11 hane
  return sade.substring(0, 11);
}

/** "<EXAMPLE_PHONE>" görsel format */
export function telefonGoster(tel: string): string {
  const sade = telefonNormalize(tel);
  if (sade.length < 4) return sade;
  if (sade.length < 7) return `${sade.slice(0, 4)} ${sade.slice(4)}`;
  if (sade.length < 9) return `${sade.slice(0, 4)} ${sade.slice(4, 7)} ${sade.slice(7)}`;
  return `${sade.slice(0, 4)} ${sade.slice(4, 7)} ${sade.slice(7, 9)} ${sade.slice(9, 11)}`;
}

/** Geçerli Türkiye mobil numarası mı? */
export function telefonGecerli(tel: string): boolean {
  const sade = telefonNormalize(tel);
  // 11 hane + 05 ile başlamalı
  return /^05\d{9}$/.test(sade);
}

/** API'ye gönderim için sadece rakamlar */
export function telefonApiFormat(tel: string): string {
  return telefonNormalize(tel);
}
```

### 3. Yeni Sabit: `modules/musteriler/lib/etiketler.ts`

```typescript
export interface MusteriEtiket {
  ad: string;
  renk: string;
  ikon: string;
  aciklama: string;
}

export const MUSTERI_ETIKETLERI: Record<string, MusteriEtiket> = {
  VIP: {
    ad: "VIP",
    renk: "bg-purple-100 text-purple-800 border-purple-300",
    ikon: "⭐",
    aciklama: "Öncelikli müşteri, özel ilgi",
  },
  Aile: {
    ad: "Aile",
    renk: "bg-blue-100 text-blue-800 border-blue-300",
    ikon: "👨‍👩‍👧",
    aciklama: "Aynı aileden birden çok hisse",
  },
  "Geçen Yıl": {
    ad: "Geçen Yıl",
    renk: "bg-green-100 text-green-800 border-green-300",
    ikon: "🔄",
    aciklama: "Geçen yıl da müşterimizdi (sadakat)",
  },
  Yeni: {
    ad: "Yeni",
    renk: "bg-yellow-100 text-yellow-800 border-yellow-300",
    ikon: "🆕",
    aciklama: "İlk kez bizden alıyor",
  },
  Toptan: {
    ad: "Toptan",
    renk: "bg-orange-100 text-orange-800 border-orange-300",
    ikon: "📦",
    aciklama: "Birden fazla kurban/hisse",
  },
  Şüpheli: {
    ad: "Şüpheli",
    renk: "bg-red-100 text-red-800 border-red-300",
    ikon: "⚠️",
    aciklama: "Ödeme problemi yaşanmış",
  },
};

export const ETIKET_KEYS = Object.keys(MUSTERI_ETIKETLERI);

/** JSON string → array */
export function etiketleriParse(metin: string | null | undefined): string[] {
  if (!metin) return [];
  try {
    const j = JSON.parse(metin) as unknown;
    if (Array.isArray(j)) return j.filter((s): s is string => typeof s === "string");
  } catch {
    // virgülle ayrılmış fallback
    return metin.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
  }
  return [];
}

/** array → JSON string */
export function etiketleriSerialize(etiketler: string[]): string {
  return JSON.stringify(etiketler);
}
```

### 4. YeniMusteriForm.tsx — Tam Yenilenmiş

```tsx
"use client";

import { useState, useTransition, useEffect, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, MapPin, Save, RotateCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { telefonNormalize, telefonGoster, telefonGecerli, telefonApiFormat } from "@/shared/lib/telefon-format";
import { tcKimlikGecerli } from "@/shared/lib/tc-dogrula";
import { MUSTERI_ETIKETLERI, ETIKET_KEYS, etiketleriSerialize } from "@/modules/musteriler/lib/etiketler";

interface Veri {
  adSoyad: string;
  telefon: string;
  tcKimlik: string;
  adres: string;
  notlar: string;
  etiketler: string[];
}

const BOS_VERI: Veri = {
  adSoyad: "",
  telefon: "",
  tcKimlik: "",
  adres: "",
  notlar: "",
  etiketler: [],
};

export function YeniMusteriForm({ next }: { next?: string }) {
  const router = useRouter();
  const [bekleniyor, startTransition] = useTransition();
  const [veri, setVeri] = useState<Veri>(BOS_VERI);
  const [hatalar, setHatalar] = useState<Partial<Record<keyof Veri, string>>>({});
  const [duplikatUyari, setDuplikatUyari] = useState<{ id: string; adSoyad: string } | null>(null);

  // Validasyon — her değişiklikte çalışır
  useEffect(() => {
    const h: Partial<Record<keyof Veri, string>> = {};

    // Ad Soyad: min 2 kelime
    const trimAd = veri.adSoyad.trim();
    if (trimAd.length > 0) {
      const kelimeSayisi = trimAd.split(/\s+/).filter(k => k.length > 1).length;
      if (kelimeSayisi < 2) {
        h.adSoyad = "Ad ve soyad ayrı olmalı (örn: Ahmet Yılmaz)";
      }
    }

    // Telefon
    if (veri.telefon.trim() && !telefonGecerli(veri.telefon)) {
      h.telefon = "Geçerli bir cep numarası girin (5XX ile başlamalı)";
    }

    // TC
    if (veri.tcKimlik.trim()) {
      if (veri.tcKimlik.length !== 11) {
        h.tcKimlik = "TC 11 hane olmalı";
      } else if (!tcKimlikGecerli(veri.tcKimlik)) {
        h.tcKimlik = "Geçersiz TC numarası";
      }
    }

    setHatalar(h);
  }, [veri]);

  // Duplikat kontrolü (debounced)
  useEffect(() => {
    if (!telefonGecerli(veri.telefon)) {
      setDuplikatUyari(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const tel = telefonApiFormat(veri.telefon);
        const r = await fetch(`/api/musteriler?telefon=${encodeURIComponent(tel)}`);
        if (!r.ok) return;
        const data = await r.json() as { liste?: { id: string; adSoyad: string; telefon: string }[] };
        const mevcut = data.liste?.find(m => telefonApiFormat(m.telefon) === tel);
        if (mevcut) {
          setDuplikatUyari({ id: mevcut.id, adSoyad: mevcut.adSoyad });
        } else {
          setDuplikatUyari(null);
        }
      } catch {
        // Sessiz fail
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [veri.telefon]);

  function alanGuncelle<K extends keyof Veri>(k: K, v: Veri[K]) {
    setVeri((eski) => ({ ...eski, [k]: v }));
  }

  function telefonDegis(deger: string) {
    const formatli = telefonGoster(deger);
    alanGuncelle("telefon", formatli);
  }

  function etiketToggle(etiket: string) {
    setVeri((eski) => ({
      ...eski,
      etiketler: eski.etiketler.includes(etiket)
        ? eski.etiketler.filter((e) => e !== etiket)
        : [...eski.etiketler, etiket],
    }));
  }

  function gonderebilir(): boolean {
    const trimAd = veri.adSoyad.trim();
    if (trimAd.length < 3) return false;
    if (Object.keys(hatalar).length > 0) return false;
    return true;
  }

  async function kaydet(yeniMusteri: boolean = false) {
    if (!gonderebilir()) {
      toast.error("Lütfen zorunlu alanları doldurun");
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          adSoyad: veri.adSoyad.trim(),
          telefon: veri.telefon.trim() ? telefonApiFormat(veri.telefon) : null,
          tcKimlik: veri.tcKimlik.trim() || null,
          adres: veri.adres.trim() || null,
          notlar: veri.notlar.trim() || null,
          etiketler: veri.etiketler.length > 0 ? etiketleriSerialize(veri.etiketler) : null,
        };

        const yanit = await fetch("/api/musteriler", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const sonuc = (await yanit.json()) as { basarili: boolean; id?: string; hata?: string };
        if (!yanit.ok || !sonuc.basarili) {
          throw new Error(sonuc.hata ?? "Kayıt başarısız");
        }

        toast.success(`✓ ${veri.adSoyad} kaydedildi`);

        if (yeniMusteri) {
          // Formu sıfırla, aynı sayfada kal
          setVeri(BOS_VERI);
          setDuplikatUyari(null);
          // Ad Soyad alanına focus
          document.getElementById("adSoyad")?.focus();
        } else {
          router.push(next ?? `/musteriler/${sonuc.id}`);
          router.refresh();
        }
      } catch (e) {
        const m = e instanceof Error ? e.message : "Hata";
        toast.error(m);
      }
    });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLFormElement>) {
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        kaydet(true);  // Ctrl+Shift+Enter = Kaydet+Yeni
      } else {
        kaydet(false); // Ctrl+Enter = Kaydet
      }
    }
  }

  const dolu = veri.adSoyad.trim().length >= 3;
  const tamamlanmislik = [
    veri.adSoyad.trim().length >= 3,
    telefonGecerli(veri.telefon),
    veri.tcKimlik.trim().length === 11 && tcKimlikGecerli(veri.tcKimlik),
    veri.adres.trim().length > 0,
    veri.etiketler.length > 0,
  ].filter(Boolean).length;
  const ilerleme = Math.round((tamamlanmislik / 5) * 100);

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); kaydet(false); }}
      onKeyDown={handleKeyDown}
      className="flex flex-col gap-4"
    >
      {/* Kart 1: Kişisel Bilgiler */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-orange-500" />
            Kişisel Bilgiler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ad Soyad */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="adSoyad" className="flex items-center gap-1">
              Ad Soyad <span className="text-red-500">*</span>
            </Label>
            <Input
              id="adSoyad"
              autoFocus
              required
              minLength={3}
              placeholder="Ahmet Yılmaz"
              value={veri.adSoyad}
              onChange={(e) => alanGuncelle("adSoyad", e.target.value.toUpperCase())}
              className={cn(
                "h-11 text-base",
                hatalar.adSoyad && "border-red-500 focus-visible:ring-red-200",
              )}
            />
            {hatalar.adSoyad && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {hatalar.adSoyad}
              </p>
            )}
          </div>

          {/* Telefon + TC */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="telefon">Telefon</Label>
              <Input
                id="telefon"
                type="tel"
                inputMode="tel"
                placeholder="<EXAMPLE_PHONE>"
                value={veri.telefon}
                onChange={(e) => telefonDegis(e.target.value)}
                className={cn(
                  "h-11 text-base font-mono",
                  hatalar.telefon && "border-red-500 focus-visible:ring-red-200",
                  telefonGecerli(veri.telefon) && !hatalar.telefon && "border-green-500",
                )}
              />
              {hatalar.telefon ? (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {hatalar.telefon}
                </p>
              ) : telefonGecerli(veri.telefon) ? (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Geçerli numara
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tcKimlik">TC Kimlik <span className="text-muted-foreground text-xs">(opsiyonel)</span></Label>
              <Input
                id="tcKimlik"
                inputMode="numeric"
                maxLength={11}
                placeholder="12345678901"
                value={veri.tcKimlik}
                onChange={(e) => alanGuncelle("tcKimlik", e.target.value.replace(/\D/g, ""))}
                className={cn(
                  "h-11 text-base font-mono",
                  hatalar.tcKimlik && "border-red-500 focus-visible:ring-red-200",
                  veri.tcKimlik.length === 11 && tcKimlikGecerli(veri.tcKimlik) && "border-green-500",
                )}
              />
              {hatalar.tcKimlik ? (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {hatalar.tcKimlik}
                </p>
              ) : veri.tcKimlik.length === 11 && tcKimlikGecerli(veri.tcKimlik) ? (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Geçerli TC
                </p>
              ) : null}
            </div>
          </div>

          {/* Duplikat Uyarısı */}
          {duplikatUyari && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-3">
              <p className="text-sm text-amber-900 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  Bu telefon zaten kayıtlı: <strong>{duplikatUyari.adSoyad}</strong>.{" "}
                  <a
                    href={`/musteriler/${duplikatUyari.id}`}
                    className="underline font-semibold"
                  >
                    Mevcut müşteriye git →
                  </a>
                </span>
              </p>
            </div>
          )}

          {/* Etiketler */}
          <div className="flex flex-col gap-2">
            <Label>Etiketler</Label>
            <div className="flex flex-wrap gap-2">
              {ETIKET_KEYS.map((key) => {
                const e = MUSTERI_ETIKETLERI[key];
                const aktif = veri.etiketler.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => etiketToggle(key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                      "text-xs font-medium border-2 transition-all",
                      aktif
                        ? e.renk + " shadow-sm scale-105"
                        : "bg-white text-muted-foreground border-border hover:border-foreground/30",
                    )}
                    title={e.aciklama}
                  >
                    <span>{e.ikon}</span>
                    {e.ad}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kart 2: İletişim & Adres */}
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

      {/* İlerleme Göstergesi */}
      {dolu && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all"
              style={{ width: `${ilerleme}%` }}
            />
          </div>
          <span className="tabular-nums">%{ilerleme} dolduruldu</span>
        </div>
      )}

      {/* Butonlar */}
      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:items-center sm:justify-end pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={bekleniyor}
        >
          İptal
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={() => kaydet(true)}
          disabled={bekleniyor || !gonderebilir()}
          title="Ctrl+Shift+Enter"
        >
          <RotateCw className="h-4 w-4 mr-1.5" />
          Kaydet + Yeni Müşteri
        </Button>

        <Button
          type="submit"
          disabled={bekleniyor || !gonderebilir()}
          className="bg-orange-500 hover:bg-orange-600"
          title="Ctrl+Enter"
        >
          <Save className="h-4 w-4 mr-1.5" />
          {bekleniyor ? "Kaydediliyor..." : "Müşteriyi Kaydet"}
        </Button>
      </div>

      {/* Klavye Kısayolu İpucu */}
      <p className="text-xs text-muted-foreground text-center mt-2">
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl</kbd>
        {" + "}
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd>
        {" ile kaydet · "}
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl</kbd>
        {" + "}
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Shift</kbd>
        {" + "}
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd>
        {" ile kaydet ve yeni müşteri"}
      </p>
    </form>
  );
}
```

### 5. app/musteriler/yeni/page.tsx — Layout Güncelle

Mevcut `max-w-xl` yerine `max-w-2xl` (etiketler için biraz yer):

```tsx
export default async function YeniMusteriPage({ searchParams }: PageProps) {
  const { next } = await searchParams;
  return (
    <AppShell>
      <SayfaBaslik
        baslik="Yeni Müşteri"
        altBaslik="Hissedar bilgilerini kaydet"
      />
      <div className="p-6 sm:p-8">
        <div className="max-w-2xl mx-auto">
          <YeniMusteriForm next={next} />
        </div>
      </div>
    </AppShell>
  );
}
```

### 6. API endpoint — Etiket desteği

`/app/api/musteriler/route.ts` POST handler'da zod schema'ya `etiketler` ekle:

```typescript
const Body = z.object({
  adSoyad: z.string().min(3),
  telefon: z.string().nullable().optional(),
  tcKimlik: z.string().nullable().optional(),
  adres: z.string().nullable().optional(),
  notlar: z.string().nullable().optional(),
  etiketler: z.string().nullable().optional(),  // YENİ — JSON string
});
```

Ve prisma create'e ekle:
```typescript
const yeni = await prisma.musteri.create({
  data: {
    adSoyad: body.adSoyad.trim().toUpperCase(),
    telefon: body.telefon ?? null,
    tcKimlik: body.tcKimlik ?? null,
    adres: body.adres ?? null,
    notlar: body.notlar ?? null,
    etiketler: body.etiketler ?? null,  // YENİ
    olusturanId: oturum.kullaniciId,
  },
});
```

---

## ✅ TAMAMLAMA KRİTERLERİ

- [ ] Ad Soyad: min 2 kelime kontrolü çalışıyor, hata mesajı görünür
- [ ] Telefon: `5321234567` yazınca otomatik `<EXAMPLE_PHONE>` olur
- [ ] Telefon: geçersiz numara → kırmızı border + hata
- [ ] Telefon: geçerli → yeşil border + "Geçerli numara" mesajı
- [ ] TC: 11 hane olmazsa hata, algoritma kontrolü yapılır
- [ ] Duplikat: aynı telefon zaten varsa uyarı + müşteri linkine git
- [ ] 6 etiket tıklanabilir, renk değişiyor, çoklu seçim
- [ ] İlerleme göstergesi (%XX dolduruldu)
- [ ] "Kaydet" → müşteri detay sayfasına yönlendir
- [ ] "Kaydet + Yeni Müşteri" → formu sıfırla, sayfada kal
- [ ] Ctrl+Enter / Ctrl+Shift+Enter klavye kısayolları
- [ ] Mobil görünüm düzgün
- [ ] Konsol hata yok

---

## 🧪 TEST

1. **Sadece "Ahmet" yaz** → "Ad ve soyad ayrı olmalı" uyarısı
2. **"Ahmet Yılmaz" yaz** → uyarı kaybolur, kaydet aktifleşir
3. **`5321234567` yaz** → otomatik `<EXAMPLE_PHONE>`
4. **`12345` yaz** → kırmızı border + "Geçerli bir cep numarası girin"
5. **TC `12345678900` yaz** → "Geçersiz TC numarası"
6. **TC `10000000146` yaz** → yeşil border (algoritma doğru)
7. **Aynı telefonu 2 kez gir** → 2. seferde sarı uyarı bandı görünür
8. **VIP + Aile etiketleri tıkla** → her ikisi de seçili
9. **Ctrl+Enter** → kaydet
10. **Ctrl+Shift+Enter** → kaydet + form sıfırlanır + Ad Soyad'a focus

---

## 📦 COMMIT

```
feat(musteriler): yeni müşteri formu modern + akıllı validasyon

- Telefon: TR mobil format auto-mask + doğrulama
- TC Kimlik: 11 hane + algoritma kontrolü
- Ad Soyad: min 2 kelime şart
- Duplikat kontrolü: aynı telefon varsa mevcut müşteri linki
- 6 etiket sistemi: VIP, Aile, Geçen Yıl, Yeni, Toptan, Şüpheli
- 2 kart layout: Kişisel + İletişim & Adres
- "Kaydet + Yeni Müşteri" butonu: hızlı toplu giriş
- Ctrl+Enter ve Ctrl+Shift+Enter kısayolları
- İlerleme göstergesi
- Hata/başarı görsel feedback (border + ikon)

Etkilenmeyen: schema (etiketler alanı zaten vardı), diğer modüller
```

---

## 🛑 SORU & ONAY BEKLENİYOR

1. **Ad Soyad uppercase mi normal mi?** Şu an UPPER yapıyorum (Ada Bereket'te zaten BÜYÜK kullanılıyor liste sayfasında). Onay?
2. **Duplikat kontrol API:** `/api/musteriler?telefon=05XX...` query support'u var mı? Yoksa endpoint'e parametre ekleyeyim mi? **Önerim:** Zaten mevcut olmalı (arama fonksiyonu var), kontrol et.
3. **Etiket JSON storage:** Şu an `JSON.stringify([...])` ile saklanıyor. Mevcut müşteri listesi/detay sayfası bu formatı parse ediyor mu? Listede etiketler şu an gösteriliyor mu?

ONAY GELİRSE Claude Code yazmaya başlasın.
