---
id: ARCH-BD627D0A4748
status: ARCHIVED
owner: Historical
source_role: historical_record
source_of_truth: false
last_reviewed: not_applicable
verified_against_commit: not_applicable
---

# 📺 SPRINT-12 — TV EKRANI YENİ TASARIM (Görsel Referanslı)

**Bayram günü TV ekranı.** Kullanıcı net bir tasarım gönderdi — birebir uygulanacak.

## 🎨 HEDEF TASARIM

**Üst KPI şeridi (6-7 kart):**
- Toplam Kurban (mavi inek ikon, "64")
- Kesimdekiler (turuncu satır ikon, "3")
- Parçalamada (mor et ikon, "5")
- Teslime Hazır (yeşil tik, "5")
- Tamamlanan (turkuaz grafik, "51")
- Bekleyen (sarı kum saati, "5")

**4 ana sütun:**
1. **SIRADAKİLER** (kompakt liste) — Sıra No (mavi badge) + "Beklemede/Hazır" + renkli nokta indikatörü
2. **KESİMDEKİLER** (büyük kartlar) — Turuncu badge "NoLu Kurban" + "Aşama: Kesim" + "GEÇEN SÜRE: 18 dk" + ilerleme barı + yüzde
3. **PARÇALAMADA** (orta kartlar) — Mor badge + "Aşama: Parçalama" + "Başlangıç: 09:30" + "Kalan Süre: 12 dk" + yüzde
4. **TESLİME HAZIR** (yeşil kartlar) — Yeşil badge + "Hazır" + "Teslim Noktası 1" + "5 dk"

**Alt şerit (4 bilgi kartı):**
- DUYURULAR (turuncu megafon)
- EKRAN TAKİBİ (mavi monitör)
- BİLGİ (mavi info)
- WHATSAPP İLETİŞİM (yeşil WhatsApp ikonu + telefon no)

## 🐛 ÇÖZÜLECEK BUG'LAR (Aynı zamanda)

| # | Bug | Çözüm |
|---|---|---|
| 1 | `vekalet_onay` typo (Sıradakiler boş kalıyor) | Schema ile uyumlu `vekalet_bekliyor` |
| 2 | Sıra No: 0 | Kurban no (`kesimSirasi`) kullan |
| 3 | Hisse no görünüyor | KURBAN NO olacak |
| 4 | Müşteri adı görünüyor (KVKK) | Hiç gösterme |
| 5 | 4 sütun yanlış grup | Doğru gruplama (görsel referanslı) |

---

## ⛔ DOKUNMA — KIRMIZI ÇİZGİLER

- `/api/tahsilat/odeme` ve KUTSAL endpoint'ler
- Backend 12 detay aşama (schema değişmiyor)
- `kurbanAsamaGuncelle()`
- `/tv/kontrol` ve `/tv/personel`
- Schema

**Sadece görsel + bug fix.**

---

## 📋 İŞ 1 — `modules/tv/types.ts` DÜZELT (Critical typo)

```ts
export type KesimDurumu =
  | "beklemede"
  | "vekalet_bekliyor"    // ✅ "vekalet_onay" değil!
  | "siradaki"
  | "hazirlik"
  | "kesimde"
  | "deri_yuzme"
  | "parcalama"
  | "tartimda"
  | "paketleme"
  | "teslime_hazir"
  | "tamamlandi"          // ✅ "teslim_edildi" değil!
  | "iptal";
```

`DURUM_VARSAYILAN_ASAMA` map'ini de aynı şekilde güncelle (`vekalet_bekliyor`, `tamamlandi`).

---

## 📋 İŞ 2 — Yeni Tip + Helper: `asama-grup.ts`

Mevcut `modules/tv/lib/asama-grup.ts` zaten var (SPRINT-9'da eklendi). İçindeki helper'ları kullanacağız.

Eğer **TV ekranı için özel** 4 sütun grubu lazımsa types.ts'e ekle:

```ts
export type TvSutunGrup =
  | "siradakiler"      // beklemede + siradaki
  | "kesimdekiler"     // vekalet_bekliyor + hazirlik + kesimde + deri_yuzme
  | "parcalamada"      // parcalama
  | "teslimeHazir";    // tartimda + paketleme + teslime_hazir

export function tvSutunaGrupla(durum: string): TvSutunGrup | null {
  switch (durum) {
    case "beklemede":
    case "siradaki":
      return "siradakiler";
    case "vekalet_bekliyor":
    case "hazirlik":
    case "kesimde":
    case "deri_yuzme":
      return "kesimdekiler";
    case "parcalama":
      return "parcalamada";
    case "tartimda":
    case "paketleme":
    case "teslime_hazir":
      return "teslimeHazir";
    default:
      return null;
  }
}
```

`TvSutunlar` tipini güncelle:

```ts
export interface TvSutunlar {
  siradakiler: SiradakiSatir[];      // max 15 (kompakt liste)
  kesimdekiler: IslemKart[];          // max 3 (büyük kartlar)
  parcalamada: IslemKart[];           // max 5 (orta kartlar)
  teslimeHazir: TeslimKart[];         // max 5 (yeşil kartlar)
}
```

`SiradakiSatir`, `IslemKart`, `TeslimKart` tiplerini güncelle — **musteriKisaltma KALDIR (KVKK)**:

```ts
export interface SiradakiSatir {
  kurbanId: string;
  kurbanNo: number;
  durumEtiket: string;     // "Beklemede" | "Hazır"
  durumRengi: "mavi" | "yesil";  // mavi=beklemede, yesil=hazır
  // ❌ musteriKisaltma YOK
}

export interface IslemKart {
  kurbanId: string;
  kurbanNo: number;
  asama: string;            // "Kesim" | "Parçalama"
  ilerlemeYuzde: number;    // 0-100
  asamaBaslangic: string | null;  // ISO datetime
  baslangicSaati: string | null;  // "09:30" formatında
  kalanSureDk: number | null;
  // ❌ musteriKisaltma YOK
}

export interface TeslimKart {
  kurbanId: string;
  kurbanNo: number;
  teslimNoktasi: string;    // "Teslim Noktası 1"
  hazirBeklemeDk: number;   // "5 dk" — teslime hazır olalı kaç dakika geçti
  // ❌ musteriKisaltma YOK
}
```

---

## 📋 İŞ 3 — `tv.service.ts` REWRITE (HİSSE → KURBAN BAZLI)

### A) `getKpiVerileri()` — Kurban bazlı, 6 sayım

```ts
export async function getKpiVerileri(): Promise<TvKpi> {
  const kurbanlar = await prisma.kurban.findMany({
    where: { silindiMi: false },
    select: { kesimDurumu: true },
  });

  let kesimdekiler = 0, parcalamada = 0, teslimHazir = 0,
      tamamlanan = 0, bekleyen = 0;

  for (const k of kurbanlar) {
    switch (k.kesimDurumu) {
      case "vekalet_bekliyor":
      case "hazirlik":
      case "kesimde":
      case "deri_yuzme":
        kesimdekiler++;
        break;
      case "parcalama":
        parcalamada++;
        break;
      case "tartimda":
      case "paketleme":
      case "teslime_hazir":
        teslimHazir++;
        break;
      case "tamamlandi":
        tamamlanan++;
        break;
      case "beklemede":
      case "siradaki":
        bekleyen++;
        break;
    }
  }

  return {
    toplamKurban: kurbanlar.length,
    kesimdekiler,
    parcalamada,
    teslimHazir,
    tamamlanan,
    bekleyen,
  };
}
```

`TvKpi` tipini de güncelle:

```ts
export interface TvKpi {
  toplamKurban: number;
  kesimdekiler: number;
  parcalamada: number;
  teslimHazir: number;
  tamamlanan: number;
  bekleyen: number;
}
```

### B) `getSutunVerileri()` — 4 sütun, kurban bazlı

```ts
export async function getSutunVerileri(): Promise<TvSutunlar> {
  const kurbanlar = await prisma.kurban.findMany({
    where: {
      silindiMi: false,
      kesimDurumu: { notIn: ["tamamlandi", "iptal"] },
    },
    orderBy: [
      { operasyonSira: "asc" },
      { kesimSirasi: "asc" },
    ],
    select: {
      id: true,
      kesimSirasi: true,
      kesimDurumu: true,
      asama: true,
      ilerlemeYuzde: true,
      kalanSureDk: true,
      asamaBaslangic: true,
    },
  });

  const isoOrNull = (d: Date | null | undefined) =>
    d ? d.toISOString() : null;

  const saatFormat = (d: Date | null | undefined): string | null => {
    if (!d) return null;
    return d.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const dkFarki = (d: Date | null | undefined): number => {
    if (!d) return 0;
    return Math.floor((Date.now() - d.getTime()) / 60000);
  };

  const siradakiler: SiradakiSatir[] = [];
  const kesimdekiler: IslemKart[] = [];
  const parcalamada: IslemKart[] = [];
  const teslimeHazir: TeslimKart[] = [];

  for (const k of kurbanlar) {
    const grup = tvSutunaGrupla(k.kesimDurumu);
    if (!grup) continue;

    if (grup === "siradakiler") {
      if (siradakiler.length < 15) {
        const durum = k.kesimDurumu;
        siradakiler.push({
          kurbanId: k.id,
          kurbanNo: k.kesimSirasi,
          durumEtiket: durum === "siradaki" ? "Hazır" : "Beklemede",
          durumRengi: durum === "siradaki" ? "yesil" : "mavi",
        });
      }
    } else if (grup === "kesimdekiler") {
      if (kesimdekiler.length < 3) {
        kesimdekiler.push({
          kurbanId: k.id,
          kurbanNo: k.kesimSirasi,
          asama: "Kesim",
          ilerlemeYuzde: k.ilerlemeYuzde,
          asamaBaslangic: isoOrNull(k.asamaBaslangic),
          baslangicSaati: saatFormat(k.asamaBaslangic),
          kalanSureDk: k.kalanSureDk,
        });
      }
    } else if (grup === "parcalamada") {
      if (parcalamada.length < 5) {
        parcalamada.push({
          kurbanId: k.id,
          kurbanNo: k.kesimSirasi,
          asama: "Parçalama",
          ilerlemeYuzde: k.ilerlemeYuzde,
          asamaBaslangic: isoOrNull(k.asamaBaslangic),
          baslangicSaati: saatFormat(k.asamaBaslangic),
          kalanSureDk: k.kalanSureDk,
        });
      }
    } else if (grup === "teslimeHazir") {
      if (teslimeHazir.length < 5) {
        teslimeHazir.push({
          kurbanId: k.id,
          kurbanNo: k.kesimSirasi,
          teslimNoktasi: "Teslim Noktası 1",
          hazirBeklemeDk: dkFarki(k.asamaBaslangic),
        });
      }
    }
  }

  return { siradakiler, kesimdekiler, parcalamada, teslimeHazir };
}
```

### C) `kisaltMusteri()` fonksiyonunu **SİL** (KVKK)

---

## 📋 İŞ 4 — Üst KPI Şeridi `TvKpiSeridi.tsx`

Mevcut komponentin yapısını **görsele uygun** güncelle:

```tsx
"use client";

import { Beef, Scissors, Drumstick, CheckCircle2, TrendingUp, Hourglass } from "lucide-react";
import type { TvKpi } from "@/modules/tv/types";

interface Props {
  kpi: TvKpi;
}

export function TvKpiSeridi({ kpi }: Props) {
  const kartlar = [
    { label: "Toplam Kurban", deger: kpi.toplamKurban, ikon: Beef, bg: "bg-blue-500", iconBg: "bg-blue-100", iconColor: "text-blue-500" },
    { label: "Kesimdekiler", deger: kpi.kesimdekiler, ikon: Scissors, bg: "bg-orange-500", iconBg: "bg-orange-100", iconColor: "text-orange-500" },
    { label: "Parçalamada", deger: kpi.parcalamada, ikon: Drumstick, bg: "bg-purple-500", iconBg: "bg-purple-100", iconColor: "text-purple-500" },
    { label: "Teslime Hazır", deger: kpi.teslimHazir, ikon: CheckCircle2, bg: "bg-green-500", iconBg: "bg-green-100", iconColor: "text-green-500" },
    { label: "Tamamlanan", deger: kpi.tamamlanan, ikon: TrendingUp, bg: "bg-cyan-500", iconBg: "bg-cyan-100", iconColor: "text-cyan-500" },
    { label: "Bekleyen", deger: kpi.bekleyen, ikon: Hourglass, bg: "bg-amber-500", iconBg: "bg-amber-100", iconColor: "text-amber-500" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 px-6 py-4 md:grid-cols-3 xl:grid-cols-6">
      {kartlar.map((k) => {
        const Icon = k.ikon;
        return (
          <div key={k.label} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${k.bg}`}>
              <Icon className="h-7 w-7 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium uppercase tracking-wider text-stone-600">
                {k.label}
              </span>
              <span className="text-3xl font-bold text-stone-900 leading-none mt-1">
                {k.deger}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

---

## 📋 İŞ 5 — Sıradakiler Sütunu (kompakt liste)

`modules/tv/components/sutunlar/SiradakilerSutun.tsx`:

```tsx
"use client";

import { Users } from "lucide-react";
import type { SiradakiSatir } from "@/modules/tv/types";

interface Props {
  satirlar: SiradakiSatir[];
}

export function SiradakilerSutun({ satirlar }: Props) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Users className="h-5 w-5 text-blue-500" />
        <h3 className="text-base font-bold tracking-wide text-stone-900">
          SIRADAKİLER
        </h3>
      </div>

      {satirlar.length === 0 ? (
        <p className="py-8 text-center text-sm text-stone-400">
          Sırada kurban yok
        </p>
      ) : (
        <div className="space-y-1">
          {satirlar.map((s) => (
            <div
              key={s.kurbanId}
              className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-stone-50"
            >
              {/* Mavi sıra badge */}
              <div className="flex h-8 w-12 items-center justify-center rounded-md bg-blue-500">
                <span className="text-sm font-bold text-white">
                  {s.kurbanNo}
                </span>
              </div>

              {/* Durum metni */}
              <span className="flex-1 text-sm font-medium text-stone-700">
                {s.durumEtiket}
              </span>

              {/* Renkli nokta */}
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  s.durumRengi === "yesil" ? "bg-green-500" : "bg-blue-400"
                }`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 📋 İŞ 6 — Kesimdekiler Sütunu (büyük turuncu kartlar)

`modules/tv/components/sutunlar/KesimdekilerSutun.tsx` (YENİ):

```tsx
"use client";

import { useEffect, useState } from "react";
import { Scissors } from "lucide-react";
import type { IslemKart } from "@/modules/tv/types";

function GecenSure({ baslangic }: { baslangic: string | null }) {
  const [dk, setDk] = useState(0);

  useEffect(() => {
    if (!baslangic) return;
    const baslangicMs = new Date(baslangic).getTime();
    const tick = () => {
      setDk(Math.max(0, Math.floor((Date.now() - baslangicMs) / 60000)));
    };
    tick();
    const interval = setInterval(tick, 30000); // 30 saniyede bir
    return () => clearInterval(interval);
  }, [baslangic]);

  return <span>{dk} dk</span>;
}

interface Props {
  kartlar: IslemKart[];
}

export function KesimdekilerSutun({ kartlar }: Props) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm border-2 border-orange-200">
      <div className="mb-3 flex items-center gap-2">
        <Scissors className="h-5 w-5 text-orange-500" />
        <h3 className="text-base font-bold tracking-wide text-stone-900">
          KESİMDEKİLER
        </h3>
      </div>

      <div className="space-y-3">
        {kartlar.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">
            Şu an kesimde kurban yok
          </p>
        ) : (
          kartlar.map((k) => (
            <div
              key={k.kurbanId}
              className="flex items-center gap-3 rounded-xl bg-orange-50 p-3"
            >
              {/* Sol: BÜYÜK turuncu badge */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-orange-500">
                <span className="text-2xl font-bold text-white">
                  {k.kurbanNo}
                </span>
              </div>

              {/* Sağ: bilgi */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-stone-500 uppercase">
                    NoLu Kurban
                  </span>
                  <span className="rounded-full bg-orange-200 px-2 py-0.5 text-xs font-semibold text-orange-800">
                    Aşama: {k.asama}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-stone-500 uppercase">
                    GEÇEN SÜRE
                  </span>
                  <span className="text-lg font-bold text-orange-600">
                    <GecenSure baslangic={k.asamaBaslangic} />
                  </span>
                </div>

                {/* İlerleme barı + yüzde */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 overflow-hidden rounded-full bg-stone-200">
                    <div
                      className="h-full bg-orange-500 transition-all duration-500"
                      style={{ width: `${k.ilerlemeYuzde}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-stone-700 font-mono">
                    %{k.ilerlemeYuzde}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

---

## 📋 İŞ 7 — Parçalama Sütunu (mor kartlar)

`modules/tv/components/sutunlar/ParcalamaSutun.tsx` (YENİ):

```tsx
"use client";

import { Drumstick } from "lucide-react";
import type { IslemKart } from "@/modules/tv/types";

interface Props {
  kartlar: IslemKart[];
}

export function ParcalamaSutun({ kartlar }: Props) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm border-2 border-purple-200">
      <div className="mb-3 flex items-center gap-2">
        <Drumstick className="h-5 w-5 text-purple-500" />
        <h3 className="text-base font-bold tracking-wide text-stone-900">
          PARÇALAMADA
        </h3>
      </div>

      <div className="space-y-2">
        {kartlar.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">
            Şu an parçalamada kurban yok
          </p>
        ) : (
          kartlar.map((k) => (
            <div
              key={k.kurbanId}
              className="flex items-center gap-3 rounded-xl bg-purple-50 p-2.5"
            >
              {/* Sol: mor badge */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-500">
                <span className="text-lg font-bold text-white">
                  {k.kurbanNo}
                </span>
              </div>

              {/* Sağ: bilgi */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="rounded-full bg-purple-200 px-2 py-0.5 text-[10px] font-semibold text-purple-800">
                    Aşama: {k.asama}
                  </span>
                  {k.kalanSureDk !== null && (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-stone-500">Kalan Süre:</span>
                      <span className="font-bold text-purple-600">
                        {k.kalanSureDk} dk
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mb-1">
                  {k.baslangicSaati && (
                    <span className="text-xs text-stone-500">
                      🕐 Başlangıç: <span className="font-semibold text-stone-700">{k.baslangicSaati}</span>
                    </span>
                  )}
                  <span className="text-xs font-bold text-stone-700 font-mono">
                    %{k.ilerlemeYuzde}
                  </span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-stone-200">
                  <div
                    className="h-full bg-purple-500 transition-all duration-500"
                    style={{ width: `${k.ilerlemeYuzde}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

---

## 📋 İŞ 8 — Teslime Hazır Sütunu (yeşil kartlar)

`modules/tv/components/sutunlar/TeslimeHazirSutun.tsx` REWRITE:

```tsx
"use client";

import { CheckCircle2, MapPin } from "lucide-react";
import type { TeslimKart } from "@/modules/tv/types";

interface Props {
  kartlar: TeslimKart[];
}

export function TeslimeHazirSutun({ kartlar }: Props) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm border-2 border-green-200">
      <div className="mb-3 flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-green-500" />
        <h3 className="text-base font-bold tracking-wide text-stone-900">
          TESLİME HAZIR
        </h3>
      </div>

      <div className="space-y-2">
        {kartlar.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">
            Teslime hazır kurban yok
          </p>
        ) : (
          kartlar.map((k) => (
            <div
              key={k.kurbanId}
              className="flex items-center gap-3 rounded-xl bg-green-50 p-2.5"
            >
              {/* Sol: yeşil badge */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-green-500">
                <span className="text-lg font-bold text-white">
                  {k.kurbanNo}
                </span>
              </div>

              {/* Orta: bilgi */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-stone-900">Hazır</div>
                <div className="flex items-center gap-1 text-xs text-stone-500">
                  <MapPin className="h-3 w-3" />
                  {k.teslimNoktasi}
                </div>
              </div>

              {/* Sağ: bekleme süresi */}
              <div className="text-right shrink-0">
                <div className="text-lg font-bold text-green-600">
                  {k.hazirBeklemeDk} dk
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

---

## 📋 İŞ 9 — `TvAnaSutunlar.tsx` REWRITE

```tsx
"use client";

import { SiradakilerSutun } from "./sutunlar/SiradakilerSutun";
import { KesimdekilerSutun } from "./sutunlar/KesimdekilerSutun";
import { ParcalamaSutun } from "./sutunlar/ParcalamaSutun";
import { TeslimeHazirSutun } from "./sutunlar/TeslimeHazirSutun";
import type { TvSutunlar } from "@/modules/tv/types";

interface Props {
  sutunlar: TvSutunlar;
}

export function TvAnaSutunlar({ sutunlar }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 px-6 py-2 md:grid-cols-2 xl:grid-cols-4">
      <SiradakilerSutun satirlar={sutunlar.siradakiler} />
      <KesimdekilerSutun kartlar={sutunlar.kesimdekiler} />
      <ParcalamaSutun kartlar={sutunlar.parcalamada} />
      <TeslimeHazirSutun kartlar={sutunlar.teslimeHazir} />
    </div>
  );
}
```

---

## 📋 İŞ 10 — Alt Bilgi Şeridi `TvAltSerit.tsx`

Mevcut alt şerit'i görsele göre güncelle:

```tsx
"use client";

import { Megaphone, Monitor, Info, MessageCircle } from "lucide-react";
import type { TvAyariKisa } from "@/modules/tv/types";

interface Props {
  ayarlar: TvAyariKisa;
}

export function TvAltSerit({ ayarlar }: Props) {
  const seritler = [
    {
      icon: Megaphone,
      iconBg: "bg-orange-500",
      label: "DUYURULAR",
      icerik: ayarlar.duyuru || "Sıra numaranızı ekrandan takip ediniz.",
    },
    {
      icon: Monitor,
      iconBg: "bg-blue-500",
      label: "EKRAN TAKİBİ",
      icerik: "Yoğunluk durumunda listeler yavaşça yukarı kayar.",
    },
    {
      icon: Info,
      iconBg: "bg-blue-400",
      label: "BİLGİ",
      icerik: "Teslime hazır olan numaralar sağ sütunda gösterilir.",
    },
    {
      icon: MessageCircle,
      iconBg: "bg-green-500",
      label: "WHATSAPP İLETİŞİM",
      icerik: ayarlar.whatsappTel || "<EXAMPLE_PHONE>",
      isPhone: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-2 xl:grid-cols-4">
      {seritler.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.iconBg}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase tracking-wider text-stone-600">
                {s.label}
              </div>
              <div className={`text-xs text-stone-700 ${s.isPhone ? "font-mono font-bold text-base text-stone-900" : ""}`}>
                {s.icerik}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

---

## 📋 İŞ 11 — Üst Başlık `TvUstBaslik.tsx` (varsa) Güncelle

Görseldeki gibi:
- Sol: Inek ikonu + "AdaBereket Hayvancılık" + "Kurban Yönetim Sistemi"
- Orta: "CANLI KESİM TAKİP EKRANI"
- Sağ: Tarih + Saat + "Canlı" yeşil rozet

Mevcut komponent zaten benzer olabilir, sadece görsel ayarı yap.

---

## 📋 İŞ 12 — Test Data Typo Düzeltme

`scripts/durum-typo-duzelt.ts` (YENİ):

```ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function duzelt() {
  const h1 = await prisma.hisse.updateMany({
    where: { kesimDurumu: "vekalet_onay" },
    data: { kesimDurumu: "vekalet_bekliyor" },
  });
  console.log(`✅ ${h1.count} hisse: vekalet_onay → vekalet_bekliyor`);

  const h2 = await prisma.hisse.updateMany({
    where: { kesimDurumu: "teslim_edildi" },
    data: { kesimDurumu: "tamamlandi" },
  });
  console.log(`✅ ${h2.count} hisse: teslim_edildi → tamamlandi`);

  const k1 = await prisma.kurban.updateMany({
    where: { kesimDurumu: "vekalet_onay" },
    data: { kesimDurumu: "vekalet_bekliyor" },
  });
  console.log(`✅ ${k1.count} kurban: vekalet_onay → vekalet_bekliyor`);

  await prisma.$disconnect();
}

duzelt().catch(console.error);
```

Çalıştır:
```bash
pnpm tsx scripts/durum-typo-duzelt.ts
```

---

## ✅ TEST

```bash
pnpm tsc --noEmit
pnpm build
pnpm tsx scripts/durum-typo-duzelt.ts
pnpm dev
```

Tarayıcı `/tv`:

- [ ] Üst KPI 6 kart (Toplam/Kesimdekiler/Parçalamada/Teslime Hazır/Tamamlanan/Bekleyen)
- [ ] 4 sütun: Sıradakiler (mavi liste) · Kesimdekiler (turuncu kartlar) · Parçalamada (mor) · Teslime Hazır (yeşil)
- [ ] Sıradakiler dolu (10+ kurban)
- [ ] Hiçbir yerde müşteri adı YOK
- [ ] Kurban numaraları doğru (1, 2, 41, 42, 43...)
- [ ] Sayaçlar çalışıyor (Kesimdekiler: "GEÇEN SÜRE: 18 dk")
- [ ] Alt şerit 4 bilgi kartı (Duyurular/Ekran Takibi/Bilgi/WhatsApp)
- [ ] WhatsApp numarası "<EXAMPLE_PHONE>" doğru
- [ ] KUTSAL: ABH-2026-NNN dekont çalışıyor

---

**Süre: 90-120 dakika.**

Bittiğinde TV ekranı **birebir görseldeki gibi** olur. Bayram günü göz kamaştırıcı. 🎯
