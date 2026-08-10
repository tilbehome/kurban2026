# ⏱️ SPRINT-11 — OTOMATİK İLERLEME + AŞAMA SAYACI

**Amaç:** Sistem akıllı olsun. Personel veya admin "İlerlet" butonuna basınca:

1. **İlerleme yüzdesi otomatik** atansın (artık manuel +%10 derdine yok)
2. **Aşama sayacı** o aşamada **sıfırlansın** ve TV'de canlı görünsün

**Bayram günü ekip görecek:** "DANA-1 Kesim aşamasında, **00:08:32** olmuş, normal süreyi aşıyor mu?"

---

## ⛔ DOKUNMA — KIRMIZI ÇİZGİLER

- `/api/tahsilat/odeme` ve KUTSAL endpoint'ler
- `Odeme`, `KasaHareketi` schema
- Mevcut migration'lar
- `iron-session`, izin sistemi
- `kurbanAsamaGuncelle()` ana fonksiyon — **sadece içine ekleme yapacaksın**
- TV canlı ekran public erişim (`/tv` auth yok)

---

## 📋 İŞ 1 — SCHEMA: `Kurban.asamaBaslangic`

`prisma/schema.prisma` → `model Kurban {` bloğunda **`kesimBaslama`** alanından SONRA şu satırları ekle:

```prisma
  // Mevcut aşamaya geçildiği an (her aşama değişiminde sıfırlanır)
  // TV ekranında "bu aşamada ne kadar süredir" göstermek için
  asamaBaslangic   DateTime?
```

Sonra terminalde:

```bash
pnpm prisma migrate dev --name add_kurban_asama_baslangic
pnpm prisma generate
```

---

## 📋 İŞ 2 — YENİ HELPER: Otomatik İlerleme Yüzde Haritası

`modules/tv/lib/asama-grup.ts` dosyasının en altına ekle:

```ts
/**
 * Her aşamanın varsayılan ilerleme yüzdesi.
 * Aşama değişiminde otomatik atanır.
 * Personel veya admin manuel ince ayar yapabilir (slider ile).
 */
export const GRUP_VARSAYILAN_YUZDE: Record<AsamaGrubu, number> = {
  beklemede: 0,
  vekalet: 15,
  kesim: 35,
  parcalama: 55,
  tartim: 75,
  teslim: 90,
  tamamlandi: 100,
  iptal: 0,
};

/**
 * 12 detay duruma karşılık gelen otomatik yüzdeler
 * (kurbanAsamaGuncelle içinden kullanılır)
 */
export const DURUM_VARSAYILAN_YUZDE: Record<string, number> = {
  beklemede: 0,
  vekalet_bekliyor: 15,
  siradaki: 20,
  hazirlik: 30,
  kesimde: 40,
  deri_yuzme: 45,
  parcalama: 55,
  tartimda: 75,
  paketleme: 85,
  teslime_hazir: 90,
  tamamlandi: 100,
  iptal: 0,
};
```

---

## 📋 İŞ 3 — `kurbanAsamaGuncelle()` GÜNCELLE — OTOMATİK YÜZDE + ZAMAN

Dosya: `modules/tv/lib/kurban-asama.service.ts`

Mevcut `kurbanAsamaGuncelle()` fonksiyonunu bul. İçinde **3 şey eklenecek**:

### A) `asamaBaslangic = new Date()` yaz
Her aşama geçişinde bu field güncellenir → sayaç sıfırlanır.

### B) `ilerlemeYuzde` otomatik atanır
`DURUM_VARSAYILAN_YUZDE[yeniDurum]` değeri Kurban + tüm hisselerine yazılır.

### C) `kesimBaslama` SADECE ilk kesime girişte yazılır
Mevcut kod doğru, ama `asamaBaslangic` her geçişte yazılacak.

**Pseudo-kod:**

```ts
import { DURUM_VARSAYILAN_YUZDE } from "./asama-grup";

export async function kurbanAsamaGuncelle(
  kurbanId: string,
  yeniDurum: KurbanKesimDurumu,
  kullaniciId: string,
) {
  // ... mevcut kontroller ...

  const simdi = new Date();
  const yeniYuzde = DURUM_VARSAYILAN_YUZDE[yeniDurum] ?? 0;
  const yeniAsama = DURUMA_GORE_ASAMA[yeniDurum];

  await prisma.$transaction(async (tx) => {
    // Kurban update — asamaBaslangic + ilerlemeYuzde
    await tx.kurban.update({
      where: { id: kurbanId },
      data: {
        kesimDurumu: yeniDurum,
        asama: yeniAsama,
        ilerlemeYuzde: yeniYuzde,
        asamaBaslangic: simdi, // ⏱️ Aşama sayacı sıfırlanır
        // İlk kesime girişte kesimBaslama da yaz
        ...(yeniDurum === "kesimde" && !mevcut.kesimBaslama
          ? { kesimBaslama: simdi }
          : {}),
        // Tamamlandı'ya geçişte kesimBitis
        ...(yeniDurum === "tamamlandi" ? { kesimBitis: simdi } : {}),
      },
    });

    // Hisseleri senkronize et (tartıma kadar)
    if (!hisseSeviyesindeMi(yeniDurum)) {
      await tx.hisse.updateMany({
        where: { kurbanId, silindiMi: false },
        data: {
          kesimDurumu: yeniDurum,
          asama: yeniAsama,
          ilerlemeYuzde: yeniYuzde,
        },
      });
    }

    // ... mevcut audit log ...
  });
}
```

**ÖNEMLİ:** Manuel ilerleme `/api/tv/ilerleme` endpoint'i hâlâ çalışır — kullanıcı isterse sliderdan ince ayar yapabilir. Sadece **aşama değişiminde otomatik atama** eklendi.

---

## 📋 İŞ 4 — TV CANLI EKRAN: AŞAMA SAYACI GÖSTERİMİ

### A) Backend: `tv.service.ts` getSutunVerileri'ye `asamaBaslangic` ekle

`modules/tv/lib/tv.service.ts` içindeki `getSutunVerileri()` fonksiyonunu bul. Hisse/Kurban select'ine `asamaBaslangic` ekle.

Sonra her satıra **server tarafında geçen saniye** hesaplanmamalı (TV refresh olur, anlık güncel olur). Sadece `asamaBaslangic` ISO string olarak gönderilir.

```ts
// TvIslemKart tipine ekle:
interface TvIslemKart {
  // ... mevcut alanlar ...
  asamaBaslangic: string | null; // ISO datetime string
}
```

### B) Frontend: `modules/tv/components/sutunlar/IslemSutun.tsx`

İçindeki kartta saat göstergesi ekle. Bunun için **client-side sayaç** lazım:

```tsx
"use client";

import { useEffect, useState } from "react";

function AsamaSayaci({ baslangic }: { baslangic: string | null }) {
  const [gecen, setGecen] = useState(0); // saniye

  useEffect(() => {
    if (!baslangic) return;
    const baslangicMs = new Date(baslangic).getTime();

    const tick = () => {
      const simdi = Date.now();
      setGecen(Math.max(0, Math.floor((simdi - baslangicMs) / 1000)));
    };

    tick(); // İlk hesap
    const interval = setInterval(tick, 1000); // Her saniye
    return () => clearInterval(interval);
  }, [baslangic]);

  if (!baslangic) return null;

  const dk = Math.floor(gecen / 60);
  const sn = gecen % 60;
  const renk = gecen > 600 ? "text-red-400" : gecen > 300 ? "text-amber-400" : "text-emerald-400";

  return (
    <div className={`flex items-center gap-1 font-mono text-sm font-semibold ${renk}`}>
      ⏱️ {dk.toString().padStart(2, "0")}:{sn.toString().padStart(2, "0")}
    </div>
  );
}
```

`IslemSutun.tsx` içindeki **kart bileşeninde**, "Sıra No: X" yazısının yanına veya altına bu sayacı yerleştir:

```tsx
<div className="flex justify-between items-center">
  <span className="text-xl font-bold">Sıra No: {kart.kesimSirasi}</span>
  <AsamaSayaci baslangic={kart.asamaBaslangic} />
</div>
```

Aynı şekilde `SiradakilerSutun.tsx` ve `TeslimeHazirSutun.tsx`'de de göster.

### C) Renkler (görsel uyarı)

| Süre | Renk | Anlam |
|---|---|---|
| 0-5 dk | 🟢 Yeşil | Normal akış |
| 5-10 dk | 🟡 Amber | Uyarı |
| 10+ dk | 🔴 Kırmızı | Gecikme — müdahale lazım |

Eşikleri **aşamaya göre değiştirebilirsin** ama bayram için bu yeterli.

---

## 📋 İŞ 5 — PERSONEL PANELİ: SAYACI GÖSTER

Dosya: `modules/tv/components/personel/PersonelKurbanKart.tsx`

DANA-NO büyük kutusunun altına veya yan tarafına aynı `AsamaSayaci` component'ini ekle:

```tsx
{kurban.asamaBaslangic && (
  <div className="mt-1">
    <AsamaSayaci baslangic={kurban.asamaBaslangic.toISOString()} />
  </div>
)}
```

Bu sayede personel kart üstünde "DANA-5, Kesim, 03:42" görür.

Personel "İlerlet" butonuna bastığında → kurban sonraki aşamaya geçer → backend `asamaBaslangic = new Date()` yazar → sayaç otomatik sıfırdan başlar.

---

## 📋 İŞ 6 — KONTROL PANEL: SAYACI GÖSTER

Dosya: `modules/tv/components/TvKontrolClient.tsx`

Tablodaki "% sütunu"nun yanına yeni sütun ekle: **"SÜRE"**

```tsx
<th className="px-3 py-2 text-center">Süre</th>
```

Satırlarda:

```tsx
<td className="px-3 py-2.5 text-center">
  <AsamaSayaci baslangic={k.asamaBaslangic} />
</td>
```

Server query'de (`app/tv/kontrol/page.tsx`) `asamaBaslangic: true` select'e ekle, KontrolKurbanSatir tipine `asamaBaslangic: string | null` ekle.

---

## 📋 İŞ 7 — `/api/tv/ilerleme` MANUEL OVERRIDE KORUMASI

Mevcut endpoint `ilerlemeYuzde` manuel kabul ediyordu. Bu hâlâ çalışsın — kullanıcı slider ile %35'i %50 yapmak isteyebilir.

**Yeni davranış:**
- Aşama değişimi → otomatik yüzde (DURUM_VARSAYILAN_YUZDE)
- Manuel slider → istenen yüzde, override

**Eklenecek:** Endpoint'e `asamaBaslangic` parametresi opsiyonel ekle. Eğer `resetSayac: true` gelirse `asamaBaslangic = new Date()` yaz. Yani admin "sayacı sıfırla" diyebilir bir buton ile.

```ts
const sema = z.object({
  kurbanId: z.string().optional(),
  hisseId: z.string().optional(),
  ilerlemeYuzde: z.number().int().min(0).max(100),
  kalanSureDk: z.number().int().nullable().optional(),
  asama: z.string().nullable().optional(),
  resetSayac: z.boolean().optional(), // 🆕 İsteğe bağlı sayaç sıfırlama
});

// ...kurban update:
data: {
  ilerlemeYuzde,
  kalanSureDk: kalanSureDk ?? null,
  ...(asama ? { asama } : {}),
  ...(resetSayac ? { asamaBaslangic: new Date() } : {}),
},
```

---

## 📋 İŞ 8 — BAYRAM ÖNCESİ MEVCUT KURBANLAR İÇİN BACKFILL

Migration sonrası tüm kurbanların `asamaBaslangic` field'ı `null`. Bayram günü ilk geçişte otomatik dolar, ama **mevcut aşamadakiler için backfill** yapılabilir:

`scripts/asama-baslangic-backfill.ts` (YENİ):

```ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function backfill() {
  // asamaBaslangic null olan ve beklemede olmayan kurbanlar
  const kurbanlar = await prisma.kurban.findMany({
    where: {
      silindiMi: false,
      asamaBaslangic: null,
      kesimDurumu: { not: "beklemede" },
    },
    select: { id: true, kesimBaslama: true, updatedAt: true, kesimDurumu: true },
  });

  console.log(`${kurbanlar.length} kurban için asamaBaslangic atanacak...`);

  let updated = 0;
  for (const k of kurbanlar) {
    // En iyi tahmin: kesimBaslama varsa o, yoksa updatedAt
    const tahminBaslangic = k.kesimBaslama ?? k.updatedAt;
    await prisma.kurban.update({
      where: { id: k.id },
      data: { asamaBaslangic: tahminBaslangic },
    });
    updated++;
  }

  console.log(`✅ ${updated} kurban güncellendi.`);
  await prisma.$disconnect();
}

backfill().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

Çalıştır:
```bash
pnpm tsx scripts/asama-baslangic-backfill.ts
```

---

## ✅ TEST ADIM ADIM

```bash
# 1. Migration
pnpm prisma migrate dev --name add_kurban_asama_baslangic
pnpm prisma generate

# 2. Type check + build
pnpm tsc --noEmit
pnpm build

# 3. Backfill (mevcut veriler için)
pnpm tsx scripts/asama-baslangic-backfill.ts

# 4. Dev
pnpm dev
```

### Tarayıcı Testi

1. **`/tv/kontrol`** aç → bir kurban seç → "İlerlet" tıkla
2. Tabloda **% sütunu otomatik güncellenir** (15 → 35 → 55 ...)
3. **SÜRE sütunu sıfırdan başlar** (00:01, 00:02, 00:03...)
4. **`/tv`** canlı ekran → aynı kurban kartında sayaç görünür, sıfırdan sayıyor
5. **`/tv/personel`** → personel kart üstünde "DANA-X, Aşama, 02:15" görünür
6. 5 dakika beklet → sayaç **amber** olur
7. 10 dakika beklet → sayaç **kırmızı** olur
8. Personel "İlerlet" basar → sayaç **00:00'a sıfırlanır**

### KUTSAL Kontrol

- [ ] Tahsilat çalışıyor → ABH-2026-NNN üretiliyor
- [ ] Manuel +%10 butonu hâlâ çalışıyor (ince ayar için)
- [ ] `/tv` canlı ekran public auth yok hâlâ
- [ ] Personel paneli aşama geçişi çalışıyor

---

## 🎯 BAYRAM GÜNÜ FAYDASI

**Senaryo:** Saat 09:30, sen muhasebede oturuyorsun. TV ekranına bakıyorsun:

```
ŞU AN KESİMDE
┌────────────────────────┐
│ Sıra No: 3             │
│ Aşama: Kesim           │
│ ⏱️ 02:15  ← YEŞİL      │  ← normal
└────────────────────────┘
┌────────────────────────┐
│ Sıra No: 7             │
│ Aşama: Kesim           │
│ ⏱️ 12:47  ← KIRMIZI    │  ← GECİKME!
└────────────────────────┘
```

Sen direkt müdahale edersin: "Sıra 7'de ne sorun var?" Belki kasap molada, belki vekalet eksik...

Bu sistem bayram günü **canlı sorun takibi** sağlar.

---

## 📊 RAPOR

Bittiğinde:

```
✅ Commit SHA: ...
✅ Migration: add_kurban_asama_baslangic uygulandı
✅ pnpm tsc + build temiz
✅ Backfill script çalıştırıldı (X kurban güncellendi)
✅ Test: kurban geçişi → yüzde otomatik atandı (35 → 55)
✅ Test: TV ekranında sayaç sıfırdan başladı, saniye saniye sayıyor
✅ Test: Personel kartı sayacı görüyor
✅ Test: 10dk sonra kırmızı olduğu doğrulandı (zorlamak için manuel asamaBaslangic eski tarih atayıp)
✅ KUTSAL: ABH-2026-000XXX dekont oluştu
```

**Süre tahmini: 1-1.5 saat**

Bayram günü için **muazzam fayda**, sistem akıllı olur. 🎯
