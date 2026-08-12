---
id: ARCH-DA2379184193
status: ARCHIVED
owner: Historical
source_role: historical_record
source_of_truth: false
last_reviewed: not_applicable
verified_against_commit: not_applicable
---

# SPRINT 9 — MÜŞTERİLER SAYFASI TASARIM İYİLEŞTİRMESİ

**Hedef:** `/musteriler` sayfasının görsel tasarımını modernize et.
**Süre:** ~1 saat
**Risk:** Çok düşük — sadece görsel, mantık değişmiyor.
**Aciliyet:** Bayrama 1 gün — bugün bitir.

---

## 📋 YAPILACAK 4 İYİLEŞTİRME

### 1. ALFABE ŞERİDİ — Yuvarlak Buton Tasarımı

**Mevcut:** Düz metin "A B C Ç D..." (küçük)
**Yeni:** Her harf bir **yuvarlak buton** (40px), büyük ve tıklanması kolay

```tsx
// Görsel mantık:
// - Boş harfler (doluHarfler içinde yok): soluk gri, tıklanamaz
// - Dolu harfler: belirgin, beyaz arka plan + border
// - Aktif harf: turuncu (Ada Bereket marka rengi) arka plan + beyaz yazı
// - "Hepsi": özel buton, sol tarafta sticky

// Boyut: 40x40px (mobile için 36x36px)
// Boşluk: gap-2
// Font: bold, 14px
```

### 2. ARAMA ALANI — Geniş ve Belirgin

**Mevcut:** Düz input, dar
**Yeni:**
- Tam genişlik (sm:max-w-md değil)
- Yükseklik: h-12 (büyük, dokunulması kolay)
- İçinde arama ikonu sol başta
- Placeholder daha açıklayıcı: "Ad, soyad veya telefon ile ara..."
- Sağ tarafta "Temizle" X butonu (arama varken görünür)
- Focus state: turuncu border

### 3. ÜST ALAN — KPI Kartları Modernize

**Mevcut:** 5 kart yan yana, sade
**Yeni:**
- Kart başına: ikon + sayı + label + yüzde
- İkon arka planında **soluk renkli daire** (renk koduyla)
- Tıklanabilir, hover efekti (hafif yükselme)
- Aktif filtre durumu görsel olarak belli (örn. "Borçlu" filtre aktifse o kart vurgulu)
- Para birimi büyük ve görünür ("Tahsilat" kartı)

### 4. SAYFA ÜST BANDI — Daha Şık

- Başlık + alt başlık olduğu gibi kalır
- "Yeni Müşteri" butonu büyütülür (h-12)
- Üst bantta opsiyonel: küçük "Bayram'a 1 gün kaldı" rozeti

---

## ⛔ DOKUNMA

- Backend / API / Schema
- `musteriler.lib`, `istatistik.lib` — veri akışı aynen kalsın
- `MusteriAramaInput` mantığı (debounce, URL update)
- Pagination
- Müşteri tablosu satırları (alt kısım) — sadece üst alan değişiyor

---

## 📁 ETKİLENECEK DOSYALAR

```
app/musteriler/page.tsx                          # Üst alan düzeni
app/musteriler/MusteriAramaInput.tsx             # Geniş arama input
modules/musteriler/components/AlfabeSeridi.tsx   # Yuvarlak butonlar
modules/musteriler/components/MusteriStatBar.tsx # KPI kart yenileme
```

---

## 🎯 KODA DÖKÜMÜ

### A. AlfabeSeridi.tsx — Yuvarlak Butonlar

```tsx
import Link from "next/link";
import { cn } from "@/shared/lib/utils";

export const ALFABE = [
  "A","B","C","Ç","D","E","F","G","Ğ","H","I","İ","J","K","L","M",
  "N","O","Ö","P","Q","R","S","Ş","T","U","Ü","V","W","X","Y","Z",
];

interface AlfabeSeridiProps {
  doluHarfler: Set<string>;
  aktif?: string | null;
  digerQuery?: Record<string, string | undefined>;
  hedef?: string;
}

export function AlfabeSeridi({
  doluHarfler,
  aktif,
  digerQuery = {},
  hedef = "/musteriler",
}: AlfabeSeridiProps) {
  function harfHref(harf: string | null): string {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(digerQuery)) {
      if (v) params.set(k, v);
    }
    if (harf) params.set("harf", harf);
    params.delete("sayfa");
    const qs = params.toString();
    return qs ? `${hedef}?${qs}` : hedef;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Hepsi butonu — özel, daha geniş */}
      <Link
        href={harfHref(null)}
        className={cn(
          "inline-flex items-center justify-center rounded-full px-4 h-10",
          "text-sm font-semibold transition-all",
          "border-2",
          !aktif
            ? "bg-orange-500 text-white border-orange-500 shadow-sm"
            : "bg-white text-foreground border-border hover:border-orange-300 hover:bg-orange-50",
        )}
      >
        Hepsi
      </Link>

      {/* Harfler */}
      {ALFABE.map((harf) => {
        const dolu = doluHarfler.has(harf);
        const seciliMi = aktif === harf;
        return (
          <Link
            key={harf}
            href={dolu ? harfHref(harf) : "#"}
            aria-disabled={!dolu}
            tabIndex={dolu ? 0 : -1}
            className={cn(
              "inline-flex items-center justify-center rounded-full w-10 h-10",
              "text-sm font-bold transition-all",
              "border-2",
              !dolu && "pointer-events-none border-transparent bg-muted/30 text-muted-foreground/40",
              dolu && !seciliMi && "bg-white text-foreground border-border hover:border-orange-300 hover:bg-orange-50 hover:scale-110",
              seciliMi && "bg-orange-500 text-white border-orange-500 shadow-md scale-110",
            )}
          >
            {harf}
          </Link>
        );
      })}
    </div>
  );
}
```

### B. MusteriAramaInput.tsx — Geniş Arama

```tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

interface Props {
  baslangic: string;
}

export function MusteriAramaInput({ baslangic }: Props) {
  const [deger, setDeger] = useState(baslangic);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => setDeger(baslangic), [baslangic]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (deger === baslangic) return;
      const params = new URLSearchParams(searchParams.toString());
      if (deger.trim()) {
        params.set("arama", deger.trim());
      } else {
        params.delete("arama");
      }
      params.delete("sayfa");
      params.delete("harf");
      startTransition(() => {
        router.replace(`/musteriler?${params.toString()}`);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [deger, baslangic, router, searchParams]);

  function temizle() {
    setDeger("");
  }

  return (
    <div className="relative w-full">
      <Search
        size={20}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
      />
      <input
        type="text"
        value={deger}
        onChange={(e) => setDeger(e.target.value)}
        placeholder="Ad, soyad veya telefon ile ara..."
        className="
          w-full h-12 pl-12 pr-12
          rounded-xl border-2 border-border bg-white
          text-base placeholder:text-muted-foreground
          transition-all
          focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100
          hover:border-muted-foreground/40
        "
        autoComplete="off"
        spellCheck={false}
      />
      {deger && (
        <button
          onClick={temizle}
          className="
            absolute right-3 top-1/2 -translate-y-1/2
            w-7 h-7 rounded-full
            flex items-center justify-center
            bg-muted hover:bg-muted-foreground/20
            transition-colors
          "
          aria-label="Aramayı temizle"
          type="button"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
```

### C. MusteriStatBar.tsx — Modern KPI Kartları

```tsx
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { formatPara } from "@/shared/lib/para";
import type { MusteriIstatistik } from "../lib/istatistik";
import { Users, CheckCircle2, Clock, AlertCircle, TrendingUp } from "lucide-react";

interface MusteriStatBarProps {
  veri: MusteriIstatistik;
  aktifDurum?: string;  // YENİ: hangi filtre aktif (vurgulama için)
}

export function MusteriStatBar({ veri, aktifDurum = "hepsi" }: MusteriStatBarProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Kart
        href="/musteriler"
        ad="Toplam Müşteri"
        deger={veri.toplam.toLocaleString("tr-TR")}
        ikon={<Users size={20} />}
        renk="slate"
        aktif={aktifDurum === "hepsi"}
      />
      <Kart
        href="/musteriler?durum=odendi"
        ad="Ödendi"
        deger={veri.odendi.toLocaleString("tr-TR")}
        altYazi={`%${yuzde(veri.odendi, veri.toplam)}`}
        ikon={<CheckCircle2 size={20} />}
        renk="green"
        aktif={aktifDurum === "odendi"}
      />
      <Kart
        href="/musteriler?durum=kismi"
        ad="Kısmi"
        deger={veri.kismi.toLocaleString("tr-TR")}
        altYazi={`%${yuzde(veri.kismi, veri.toplam)}`}
        ikon={<Clock size={20} />}
        renk="amber"
        aktif={aktifDurum === "kismi"}
      />
      <Kart
        href="/musteriler?durum=borclu"
        ad="Borçlu"
        deger={veri.borclu.toLocaleString("tr-TR")}
        altYazi={`%${yuzde(veri.borclu, veri.toplam)}`}
        ikon={<AlertCircle size={20} />}
        renk="red"
        aktif={aktifDurum === "borclu"}
      />
      <Kart
        href="/raporlar/tahsilat"
        ad="Tahsilat"
        deger={formatPara(veri.toplamOdenmis)}
        altYazi={`%${veri.tahsilatYuzdesi}`}
        ikon={<TrendingUp size={20} />}
        renk="orange"
        kucukDeger
      />
    </div>
  );
}

interface KartProps {
  href: string;
  ad: string;
  deger: string;
  altYazi?: string;
  ikon: React.ReactNode;
  renk: "slate" | "green" | "amber" | "red" | "orange";
  aktif?: boolean;
  kucukDeger?: boolean;
}

const RENK_STILLERI = {
  slate: {
    daire: "bg-slate-100 text-slate-700",
    aktif: "ring-2 ring-slate-400 border-slate-300",
    yazi: "text-slate-700",
  },
  green: {
    daire: "bg-green-100 text-green-700",
    aktif: "ring-2 ring-green-400 border-green-300",
    yazi: "text-green-700",
  },
  amber: {
    daire: "bg-amber-100 text-amber-700",
    aktif: "ring-2 ring-amber-400 border-amber-300",
    yazi: "text-amber-700",
  },
  red: {
    daire: "bg-red-100 text-red-700",
    aktif: "ring-2 ring-red-400 border-red-300",
    yazi: "text-red-700",
  },
  orange: {
    daire: "bg-orange-100 text-orange-700",
    aktif: "ring-2 ring-orange-400 border-orange-300",
    yazi: "text-orange-700",
  },
};

function Kart({ href, ad, deger, altYazi, ikon, renk, aktif, kucukDeger }: KartProps) {
  const stil = RENK_STILLERI[renk];
  return (
    <Link
      href={href}
      className={`
        block transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-md
      `}
    >
      <Card className={`h-full ${aktif ? stil.aktif : ""} transition-all`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center
              ${stil.daire}
            `}>
              {ikon}
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {ad}
            </p>
            <p className={`
              font-bold tabular-nums
              ${kucukDeger ? "text-lg" : "text-2xl"}
              ${stil.yazi}
            `}>
              {deger}
            </p>
            {altYazi && (
              <p className="text-xs text-muted-foreground">{altYazi}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function yuzde(deger: number, toplam: number): string {
  if (toplam === 0) return "0";
  return ((deger / toplam) * 100).toFixed(0);
}
```

### D. app/musteriler/page.tsx — Düzen

Mevcut layout aynı kalır, sadece:
- `<MusteriStatBar veri={ist} aktifDurum={sp.durum ?? "hepsi"} />` — yeni prop
- Arama alanı `<MusteriAramaInput>` artık tam genişlik (sm:flex-row değişmez)
- AlfabeSeridi kart içine alınabilir:

```tsx
<Card className="mb-4">
  <CardContent className="p-4">
    <AlfabeSeridi
      doluHarfler={doluHarfler}
      aktif={sp.harf ?? null}
      digerQuery={{ arama: sp.arama, durum: sp.durum }}
    />
  </CardContent>
</Card>
```

---

## ✅ TAMAMLAMA KRİTERLERİ

- [ ] Alfabe harfleri yuvarlak buton (40px), boş harfler soluk
- [ ] Aktif harf turuncu (#f97316) + scale efekti
- [ ] Arama kutusu h-12, ikon + temizle butonu
- [ ] Focus state turuncu ring
- [ ] KPI kartlarda renkli ikon daireleri
- [ ] Aktif durum filtresi vurgulu (ring)
- [ ] Hover'da kartlar hafif yükseliyor
- [ ] Mobil görünüm bozulmamış (2-3 kolon grid)
- [ ] Tüm mevcut filtre mantığı çalışıyor
- [ ] URL paramları korunuyor

---

## 🧪 TEST

1. Alfabe → "A" tıkla → A ile başlayanlar listelenir, "A" turuncu olur
2. Alfabe → boş bir harfe ("X") tıklanamamalı (varsa)
3. Arama → "ahmet" yaz → 300ms sonra filtre, URL'de `?arama=ahmet`
4. Arama → "X" butonu tıkla → temizlenir
5. KPI → "Borçlu" kartı tıkla → filtre uygulanır, kart vurgulu olur
6. Mobil (375px) → kartlar 2 kolon, alfabe wrap olur, arama tam genişlik

---

## 📦 COMMIT

```
feat(musteriler): modern UI — yuvarlak alfabe + geniş arama + KPI cards

- AlfabeSeridi: 40px yuvarlak buton, dolu/boş ayrımı, scale efekti
- MusteriAramaInput: h-12 büyük input, ikon + temizle butonu, focus ring
- MusteriStatBar: renkli ikon daireleri, aktif filtre vurgulama, hover efekti
- Tablo + pagination + tüm filtreler değişmedi (sadece görsel)

Etkilenmeyen: backend, schema, business logic
```
