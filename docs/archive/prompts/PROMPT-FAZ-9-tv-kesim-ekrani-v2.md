# PROMPT-FAZ-9: TV KESİM EKRANI (Yeni Tasarım v2)

> **Claude Code'a ver. Otonom modda çalıştır. Her adımda commit at.**

---

## 🎯 AMAÇ

Bayram günü kesim merkezindeki **TV/büyük monitör** için **profesyonel canlı takip ekranı** yap.
**Referans tasarım** kullanıcıdan alındı (light mode, 4 sütun, 6 KPI üst şerit, alt operasyon özeti).

**Vizyon:** Müşteri ve personel **anında** operasyonu görür. Hijyen, WhatsApp iletişim, sıra hatırlatma dahil. Türk pazarına özel.

---

## ⚠️ KORUNACAKLAR

**KESİNLİKLE BOZMA:**
- ✅ KUTSAL tahsilat akışı
- ✅ FAZ 4-8 tüm özellikler (özellikle FAZ 8 WhatsApp şablonları)
- ✅ Sidebar menüde mevcut `/tv` placeholder (FAZ 5'te eklendi)
- ✅ Audit log + granular izinler
- ✅ Soft delete + MIMARI.md uyumu

---

## 🎨 REFERANS TASARIM DETAYI

### Genel Yapı (Yukarıdan Aşağıya)

```
┌──────────────────────────────────────────────────────────────────┐
│ ÜST BAR (Koyu lacivert şerit)                                    │
│ 🐂 TilbeCore           CANLI KESİM TAKİP EKRANI    15 Haz 2026  │
│    Kurban Yönetim       📍 Merkez Kesim Alanı       09:58:21    │
│    Sistemi                                          🟢 Canlı     │
├──────────────────────────────────────────────────────────────────┤
│ 6 KPI ŞERİDİ (Beyaz kartlar, renkli ikonlar)                    │
│ 🐂 Toplam: 368 | 🔪 Kesimde: 3 | 👥 Sıradaki: 8 | ✅ Hazır: 29  │
│ 📈 Tamamlanan: 214 | ⏳ Bekleyen: 114                            │
├──────────────────────────────────────────────────────────────────┤
│ 4 ANA SÜTUN                                                       │
│ ┌───────────┬──────────────┬──────────────┬───────────────┐     │
│ │ 👥        │ 🔪           │ ⚖️           │ ✅            │     │
│ │ SIRADA    │ KESİMDE      │ TARTIMDA     │ TESLİME HAZIR │     │
│ │ KİLER     │              │              │               │     │
│ │           │              │              │               │     │
│ │ Sıra 1    │ Sıra No: 041│ Sıra No: 065 │ Teslim No: 12 │     │
│ │ ⚫ Kesime │ Aşama: Kesim│ Aşama: Tartım│ Durum: Hazır  │     │
│ │   Hazır   │ ████░ %62   │ ████░ %70    │ 📍 Nokta 1    │     │
│ │           │ 8 dk        │ 6 dk         │               │     │
│ │ Sıra 2    │             │              │               │     │
│ │ Sıra 3    │ Sıra No: 037│ Sıra No: 074 │ Teslim No: 13 │     │
│ │ Sıra 4    │ Deri Yüzme  │ Tartım       │ Hazır         │     │
│ │ Sıra 5    │ ████░ %48   │ ████░ %55    │               │     │
│ │ Sıra 6    │ 12 dk       │ 9 dk         │               │     │
│ │ Sıra 7    │             │              │ Teslim No: 14 │     │
│ │ Sıra 8    │ Sıra No: 028│ Sıra No: 092 │ Hazır         │     │
│ │           │ Parçalama   │ Tartım       │               │     │
│ │           │ ████░ %36   │ ████░ %40    │               │     │
│ │           │ 15 dk       │ 11 dk        │               │     │
│ └───────────┴──────────────┴──────────────┴───────────────┘     │
├──────────────────────────────────────────────────────────────────┤
│ OPERASYON AŞAMALARI (5 aşama + ikonlar)                          │
│  👤      🔪       ✂️       ⚖️       ✅                            │
│ Vekalet  Kesim   Parçalama Tartım  Teslim                        │
│                                                                    │
│ GENEL DURUM (5 sayı)                                              │
│  Vekalet: 24 | Kesim: 3 | Parçalama: 12 | Tartım: 8 | Teslim: 29│
├──────────────────────────────────────────────────────────────────┤
│ ALT BİLGİ ŞERİDİ (4 bölüm)                                       │
│ 📢 DUYURULAR  | 👥 SIRA       | 🛡️ HİJYEN      | 📱 WHATSAPP    │
│ Kesim alanı...| Sıranız.....  | Hijyen kural.. | <EXAMPLE_PHONE> │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🎨 BÖLÜM DETAYLARI

### 1️⃣ ÜST BAR

**Layout:** Koyu lacivert şerit (`bg-slate-900`), 80-100px yükseklik, sol-orta-sağ

**Sol (logo + marka):**
- 🐂 TilbeCore logo (40-48px)
- "TilbeCore" (büyük, beyaz, semibold)
- Alt: "Kurban Yönetim Sistemi" (küçük, gri)

**Orta (başlık):**
- "CANLI KESİM TAKİP EKRANI" (xx-large, beyaz, bold)
- 📍 Lokasyon: "Merkez Kesim Alanı" (medium, gri)

**Sağ (tarih + saat + canlı):**
- Tarih: "15 Haziran 2026 Pazartesi" (medium, beyaz)
- Saat: "09:58:21" (xx-large, beyaz, monospace)
- 🟢 Canlı rozeti (yeşil + pulse animasyon)

### 2️⃣ 6 KPI ŞERİDİ

**Grid:** `grid-cols-2 md:grid-cols-3 xl:grid-cols-6`

Her kart:
```
┌─────────────────────────┐
│ 🐂  Toplam Kurban       │  ← Sol ikon kutu + sağ etiket
│     368                  │  ← Büyük sayı
└─────────────────────────┘
```

**6 KPI:**
1. 🐂 **Toplam Kurban** — 368 (Mavi #3b82f6)
2. 🔪 **Şu An Kesimde** — 3 (Turuncu #ea580c)
3. 👥 **Sıradakiler** — 8 (Mor #8b5cf6)
4. ✅ **Teslime Hazır** — 29 (Yeşil #22c55e)
5. 📈 **Tamamlanan** — 214 (Mavi-cyan #06b6d4)
6. ⏳ **Bekleyen** — 114 (Sarı #eab308)

**Her Kart Tasarımı:**
- Beyaz bg, ince border
- Sol: 56x56px renkli kutu + ikon
- Sağ: Label (üst) + Sayı (alt, büyük)
- Border-radius: 12px
- Hover: hafif vurgu

### 3️⃣ 4 ANA SÜTUN (Operasyon Durumu)

**Grid:** `grid-cols-1 lg:grid-cols-2 xl:grid-cols-4` (responsive)

#### Sütun 1: 👥 SIRADAKİLER

**Üst:** İkon + "SIRADAKİLER" (büyük başlık)

**İçerik:** Kompakt liste (Sıra 1-8)
```
┌─────────────────────────┐
│ 1  Sıra 1   ⚫ Kesime    │
│             Hazır        │
├─────────────────────────┤
│ 2  Sıra 2   ⚫ Kesime    │
│             Hazır        │
├─────────────────────────┤
│ 3  Sıra 3   ⚫ Parçalama │
│             Bekliyor     │
├─────────────────────────┤
│ ...                      │
└─────────────────────────┘
```

**Detaylar:**
- Sol numara (mor #8b5cf6, yuvarlak)
- "Sıra X" yazı
- Sağda durum noktası + etiket
- Compact, scroll varsa virtual

#### Sütun 2: 🔪 ŞU AN KESİMDE

**Üst:** İkon + "ŞU AN KESİMDE" + sayı

**İçerik:** 3 büyük kart (turuncu vurgu)
```
┌─────────────────────────────┐
│ 1   Sıra No: 041            │
│     Aşama: Kesim            │
│     [████████░] %62  8 dk   │
└─────────────────────────────┘

┌─────────────────────────────┐
│ 2   Sıra No: 037            │
│     Aşama: Deri Yüzme       │
│     [██████░░] %48  12 dk   │
└─────────────────────────────┘

┌─────────────────────────────┐
│ 3   Sıra No: 028            │
│     Aşama: Parçalama Hazırlık│
│     [████░░░░] %36  15 dk   │
└─────────────────────────────┘
```

**Detaylar:**
- Sol numara (turuncu büyük yuvarlak)
- "Sıra No: XXX" (büyük)
- "Aşama: ..." rozeti (turuncu badge)
- İlerleme barı (turuncu)
- Sağda kalan süre (büyük)
- Background: hafif turuncu (`bg-orange-50`)

#### Sütun 3: ⚖️ ŞU AN TARTIMDA

**Üst:** İkon + "ŞU AN TARTIMDA"

**İçerik:** 3 mavi kart (yapısı kesimle aynı, renk mavi)
```
1   Sıra No: 065
    Aşama: Tartım
    [███████░] %70  6 dk

2   Sıra No: 074
    Aşama: Tartım
    [█████░░░] %55  9 dk

3   Sıra No: 092
    Aşama: Tartım
    [████░░░░] %40  11 dk
```

**Renk:** Mavi (#3b82f6)

#### Sütun 4: ✅ TESLİME HAZIR

**Üst:** İkon + "TESLİME HAZIR"

**İçerik:** 3 yeşil kart (kompakt)
```
1   Teslim No: 12
    [Durum: Hazır]
    📍 Teslim Noktası 1

2   Teslim No: 13
    [Durum: Hazır]
    📍 Teslim Noktası 1

3   Teslim No: 14
    [Durum: Hazır]
    📍 Teslim Noktası 1
```

**Renk:** Yeşil (#22c55e)

### 4️⃣ OPERASYON AŞAMALARI (5 Aşama + Genel Durum)

**Layout:** 2 sütun (sol: aşamalar, sağ: genel durum)

#### Sol: 5 Aşama (Görsel Akış)
```
👤        🔪         ✂️          ⚖️         ✅
Vekalet → Kesim → Parçalama → Tartım → Teslim
```
- Her aşama: yuvarlak ikon (60x60px) + alt yazı
- Aralarda ok (→) veya çizgi
- Pasif aşamalar gri, aktif renkli

#### Sağ: Genel Durum (5 Sayı)
```
┌────────┬────────┬────────┬────────┬────────┐
│Vekalet │ Kesim  │Parçala │ Tartım │ Teslim │
│ 👤 24  │ 🔪 3   │ ✂️ 12  │ ⚖️ 8   │ ✅ 29  │
└────────┴────────┴────────┴────────┴────────┘
```
- Her sayı kartı: ikon + sayı (büyük)
- Renk kodlu

### 5️⃣ ALT BİLGİ ŞERİDİ (4 Bölüm)

**Layout:** 4 sütun, eşit genişlik

#### Bölüm 1: 📢 DUYURULAR
- Başlık: "DUYURULAR" (turuncu ikon + başlık)
- Metin: "Kesim alanında anonslar takip ediniz."
- Veya: aktif duyuru (kayan yazı)

#### Bölüm 2: 👥 SIRA HATIRLATMASI
- Başlık: "SIRA HATIRLATMASI"
- Metin: "Sıranız geldiğinde ekranda ve anonsla bilgilendirileceksiniz."

#### Bölüm 3: 🛡️ HİJYEN ÖNCELİĞİMİZ
- Başlık: "HİJYEN ÖNCELİĞİMİZ"
- Metin: "Hijyen kurallarına uyalım, sağlığımızı birlikte koruyalım."

#### Bölüm 4: 📱 WHATSAPP İLETİŞİM
- Başlık: "WHATSAPP İLETİŞİM"
- Telefon: "<EXAMPLE_PHONE>" (büyük, tıklanır)
- Tıklayınca: `wa.me/<EXAMPLE_PHONE>` açılır

**Bu bölümler:**
- Müşteri ve personel için bilgilendirici
- Statik metin (admin panelden değiştirilebilir)
- Hijyen + iletişim = profesyonel görünüm

---

## 🌗 LIGHT / DARK MODE TOGGLE

### Light Mode (Default)
- Background: `#f8fafc` (açık gri)
- Kart bg: `#ffffff`
- Border: `#e2e8f0`
- Yazı: `#0f172a`
- **Avantaj:** Gündüz daha okunur, müşteri-dostu

### Dark Mode
- Background: `#0f172a` (koyu lacivert)
- Kart bg: `#1e293b`
- Border: `#334155`
- Yazı: `#f8fafc`
- **Avantaj:** Gece göz yakmaz, dramatik

### Toggle
- Sağ üst köşede 🌙/☀️ butonu
- localStorage'a kaydet
- Otomatik tespit (system preference)
- Geçiş animasyonu (smooth)

---

## 🔧 SSE (Server-Sent Events) STRATEJİSİ

### Neden SSE?
- ✅ Tek yönlü (server → client)
- ✅ HTTP üzerinden (firewall sorunu yok)
- ✅ Otomatik yeniden bağlanma
- ✅ Native API (kütüphane gerekmez)

### Akış
```
TV (Client)                    Sunucu
   |                              |
   | GET /api/tv/yayin (SSE)      |
   |----------------------------->|
   |                              |
   |     her 3-5 sn'de bir        |
   |<-----------------------------| event: guncelleme
   |                              | data: {kpi, sutunlar, alt}
```

### Implementation

```typescript
// app/api/tv/yayin/route.ts
export const dynamic = 'force-dynamic';

export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendVeri = async () => {
        const veri = await tvService.getTumVeriler();
        const payload = `event: guncelleme\ndata: ${JSON.stringify(veri)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      await sendVeri(); // İlk veri
      const interval = setInterval(sendVeri, 3000); // 3 saniyede bir

      // Cleanup
      return () => clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Nginx buffer bypass
    },
  });
}
```

```typescript
// Client (TV sayfası)
useEffect(() => {
  const eventSource = new EventSource('/api/tv/yayin');

  eventSource.addEventListener('guncelleme', (event) => {
    const data = JSON.parse(event.data);
    setTvVeri(data);
  });

  eventSource.onerror = () => {
    console.error('SSE bağlantı hatası, otomatik yeniden bağlanılacak...');
  };

  return () => eventSource.close();
}, []);
```

---

## 🗄️ DB SCHEMA

### Mevcut Hisse Modeline Ekle

```prisma
model Hisse {
  // ... mevcut alanlar

  // KESİM TAKİP (YENİ)
  kesimDurumu     KesimDurumu  @default(beklemede)
  kesimSirasi     Int?          // Sıra numarası
  asama           String?       // "Kesim" | "Deri Yüzme" | "Parçalama Hazırlık" | "Tartım" | "Teslim"
  ilerlemeYuzde   Int           @default(0)  // 0-100
  kalanSureDk     Int?          // dakika
  kesimBaslama    DateTime?
  kesimBitis      DateTime?
  teslimNoktasi   String?       // "Teslim Noktası 1"
  teslimDurumu    String?       // "Hazır" | "Teslim Edildi"

  @@index([kesimDurumu])
  @@index([kesimSirasi])
}

enum KesimDurumu {
  beklemede        // sırada bekliyor
  vekalet_onay     // vekalet bekleniyor
  siradaki         // sıraya alındı
  kesimde          // kesim aşamasında
  parcalama        // parçalama
  tartimda         // tartım aşamasında
  teslime_hazir    // teslime hazır
  teslim_edildi    // tamamen teslim
  iptal            // iptal
}
```

### Yeni Model: TvAyari

Alt bilgi şeritleri ve genel ayarlar:

```prisma
model TvAyari {
  id              String   @id @default(cuid())
  anahtarKey      String   @unique  // "duyuru" | "sira_hatirlatma" | "hijyen" | "whatsapp_tel"
  deger           String   // Metin içeriği
  aktif           Boolean  @default(true)
  guncelleyenId   String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**Seed Verileri:**
```typescript
[
  { anahtarKey: 'duyuru', deger: 'Kesim alanında anonslar takip ediniz.' },
  { anahtarKey: 'sira_hatirlatma', deger: 'Sıranız geldiğinde ekranda ve anonsla bilgilendirileceksiniz.' },
  { anahtarKey: 'hijyen', deger: 'Hijyen kurallarına uyalım, sağlığımızı birlikte koruyalım.' },
  { anahtarKey: 'whatsapp_tel', deger: '<EXAMPLE_PHONE>' },
  { anahtarKey: 'lokasyon', deger: 'Merkez Kesim Alanı' },
]
```

**Migration adı:** `add-kesim-takip-ve-tv-ayar`

---

## 🗂️ DOSYA YAPISI

### Yeni Klasör: `modules/tv/`

```
modules/tv/
├── components/
│   ├── TvLayout.tsx                      ← Ana layout (theme switch)
│   ├── TvUstBar.tsx                      ← Logo + başlık + saat
│   ├── TvKpiSeridi.tsx                   ← 6 KPI üst şerit
│   ├── TvAnaSutunlar.tsx                 ← 4 sütun wrapper
│   ├── sutunlar/
│   │   ├── SiradakilerSutun.tsx
│   │   ├── KesimdeSutun.tsx
│   │   ├── TartimdaSutun.tsx
│   │   └── TeslimeHazirSutun.tsx
│   ├── TvOperasyonAkis.tsx               ← 5 aşama görseli
│   ├── TvGenelDurum.tsx                  ← 5 sayı kartları
│   ├── TvAltBilgiSeridi.tsx              ← 4 bilgi bölümü
│   ├── TvBilgiKart.tsx                   ← Her bilgi kartı (duyuru/sira/hijyen/whatsapp)
│   ├── TvTemaToggle.tsx                  ← Light/Dark switch
│   └── TvClient.tsx                       ← SSE orchestrator
├── lib/
│   ├── tv.service.ts                     ← DB sorguları
│   └── tv-tema.ts                        ← Tema state yönetimi
├── hooks/
│   └── useSSE.ts                          ← EventSource hook
└── types.ts                                ← TV tipleri
```

### Yeni Sayfalar

```
app/tv/
├── page.tsx                              ← Ana TV sayfası (REFACTOR)
├── kontrol/
│   └── page.tsx                           ← Admin kontrol paneli
└── ayarlar/
    └── page.tsx                           ← TvAyari yönetimi
```

### Yeni API Endpoint'leri

```
app/api/tv/
├── yayin/route.ts                        ← SSE stream ⭐
├── veriler/route.ts                      ← REST fallback (tüm veriler)
├── kesim-durum/route.ts                  ← POST: durum değiştir
├── ilerleme/route.ts                     ← PATCH: %, kalan süre
├── ayarlar/route.ts                      ← GET + PATCH (TvAyari)
└── operasyon-istatistik/route.ts        ← GET (5 aşama sayıları)
```

---

## 🎯 UYGULAMA SIRASI (12 ADIM)

### ADIM 1: DB Migration + Seed
1. `prisma/schema.prisma` → `Hisse` modeline yeni alanlar
2. `KesimDurumu` enum
3. Yeni model: `TvAyari`
4. Migration: `add-kesim-takip-ve-tv-ayar`
5. Seed: 5 TvAyari değeri + birkaç demo hisse durumu

**Commit:** `feat(db): kesim takip + tv ayar modelleri`

### ADIM 2: Servis + Tipler
1. `modules/tv/lib/tv.service.ts`
   - `getKpiVerileri()` — 6 KPI
   - `getSutunVerileri()` — 4 sütun
   - `getOperasyonAkisi()` — 5 aşama sayıları
   - `getTvAyarlari()` — alt şerit
2. `modules/tv/types.ts`
3. `modules/tv/hooks/useSSE.ts`

**Commit:** `feat(tv): service ve tipler`

### ADIM 3: REST API'ler
1. `/api/tv/veriler` GET (REST fallback)
2. `/api/tv/kesim-durum` POST
3. `/api/tv/ilerleme` PATCH
4. `/api/tv/ayarlar` GET + PATCH
5. `/api/tv/operasyon-istatistik` GET
6. Yetki: `tv.goruntule` (herkes), `tv.kontrol` (admin)

**Commit:** `feat(tv): REST API endpoints`

### ADIM 4: SSE Stream ⭐
1. `/api/tv/yayin` (SSE)
2. 3 saniyede bir push
3. `tvService.getTumVeriler()` çağrısı
4. Stream cleanup (interval clear)
5. Heartbeat (her 30sn'de boş satır - bağlantı canlı)

**Commit:** `feat(tv): SSE canli yayin stream`

### ADIM 5: Tema Sistemi (Light/Dark)
1. `TvLayout.tsx` (context provider)
2. `TvTemaToggle.tsx` (sağ üst köşe butonu)
3. localStorage entegrasyonu
4. System preference detection
5. Smooth geçiş animasyonu

**Commit:** `feat(tv): tema sistemi (light/dark)`

### ADIM 6: Üst Bar + KPI Şeridi
1. `TvUstBar.tsx`
   - Logo + marka (sol)
   - Başlık + lokasyon (orta)
   - Tarih + saat + canlı (sağ)
2. `TvKpiSeridi.tsx`
   - 6 renkli kart
   - Her kartta ikon + label + sayı
3. Canlı saat (1sn update)
4. Pulse animasyon (canlı rozet)

**Commit:** `feat(tv): ust bar ve KPI seridi`

### ADIM 7: 4 Ana Sütun ⭐
1. `TvAnaSutunlar.tsx` (wrapper, responsive grid)
2. `SiradakilerSutun.tsx` (mor, kompakt liste)
3. `KesimdeSutun.tsx` (turuncu, büyük kartlar + ilerleme)
4. `TartimdaSutun.tsx` (mavi, kesimle aynı yapı)
5. `TeslimeHazirSutun.tsx` (yeşil, hazır listesi)

**Commit:** `feat(tv): 4 ana operasyon sutunu`

### ADIM 8: Operasyon Akışı + Genel Durum
1. `TvOperasyonAkis.tsx` (5 aşama görseli, oklar)
2. `TvGenelDurum.tsx` (5 sayı kartları)
3. Aktif aşama vurgu (renkli, animasyon)

**Commit:** `feat(tv): operasyon akisi ve genel durum`

### ADIM 9: Alt Bilgi Şeridi
1. `TvAltBilgiSeridi.tsx` (4 sütun)
2. `TvBilgiKart.tsx` (her bölüm)
3. WhatsApp telefon → wa.me link
4. TvAyari'dan veri çek

**Commit:** `feat(tv): alt bilgi seridi (duyuru/sira/hijyen/whatsapp)`

### ADIM 10: SSE Client + Ana Sayfa
1. `TvClient.tsx`
   - `useSSE` hook
   - State yönetimi (kpi, sutunlar, ayarlar)
   - Yeniden bağlanma logic
2. `app/tv/page.tsx` refactor
3. Auth opsiyonel (public display)
4. Smooth update animasyonları

**Commit:** `feat(tv): SSE client ve ana sayfa`

### ADIM 11: Admin Kontrol Paneli
1. `app/tv/kontrol/page.tsx`
2. Hisse durumu kontrol (kesime al / parçalama / tartım / teslim)
3. İlerleme % slider
4. Kalan süre input
5. Sıra yönetimi (drag-drop opsiyonel)
6. TV önizleme (iframe küçük)

**Commit:** `feat(tv): admin kontrol paneli`

### ADIM 12: TvAyari Yönetim + Test
1. `app/tv/ayarlar/page.tsx`
   - Duyuru metni
   - Sıra hatırlatma metni
   - Hijyen mesajı
   - WhatsApp telefon
   - Lokasyon
2. Test:
   - `pnpm tsc --noEmit`
   - `pnpm build`
   - SSE bağlantı çalışıyor
   - Tema toggle
   - Light + Dark görünüm
   - KUTSAL tahsilat bozulmadı
   - Audit log

**Commit:** `test(tv): faz 9 dogrulandi`

### Final: Push
```bash
git push origin main
```

---

## ✅ TEST CHECKLİSTİ

### Temel
- [ ] `pnpm tsc --noEmit` temiz
- [ ] `pnpm build` başarılı
- [ ] Migration başarılı
- [ ] 3 yeni route: `/tv`, `/tv/kontrol`, `/tv/ayarlar` HTTP 200

### Görünüm
- [ ] Üst bar (logo + başlık + tarih/saat + canlı)
- [ ] 6 KPI kart (renkli ikonlar)
- [ ] 4 sütun (Sıradaki/Kesimde/Tartımda/Teslime Hazır)
- [ ] Her sütun kendi renginde
- [ ] Operasyon akışı (5 aşama)
- [ ] Genel durum (5 sayı)
- [ ] Alt bilgi şeridi (4 bölüm)
- [ ] WhatsApp tıklanır (wa.me linki)

### Tema
- [ ] Light mode varsayılan
- [ ] Dark mode toggle çalışıyor
- [ ] localStorage hatırlıyor
- [ ] System preference algılıyor

### SSE
- [ ] EventSource bağlanıyor
- [ ] 3 saniyede bir güncelleme
- [ ] Bağlantı kopsa otomatik yeniden bağlanır
- [ ] DevTools Network'te `text/event-stream` görünüyor

### Canlı Saat
- [ ] 1 saniyede bir günceller
- [ ] Tarih + saat formatı doğru
- [ ] Canlı rozet pulse animasyon

### Kontrol Paneli
- [ ] Hisse durumu değiştirilebiliyor
- [ ] İlerleme % slider çalışıyor
- [ ] Kalan süre input
- [ ] TV ekranı güncelleniyor (canlı)

### TvAyari
- [ ] Duyuru metni güncellenebiliyor
- [ ] Alt şerit yenisi yansıyor
- [ ] WhatsApp telefonu değişebiliyor

### Auth
- [ ] `/tv` public (auth gerekmez)
- [ ] `/tv/kontrol` sadece admin/kasiyer
- [ ] `/tv/ayarlar` sadece admin

### Responsive
- [ ] Desktop (≥1920px) — tam görünüm
- [ ] Laptop (1280-1919px) — sıkışık ama okunur
- [ ] Tablet (768-1279px) — 2 sütun grid
- [ ] Mobile (<768px) — tek sütun scroll

### Mevcut Sistem
- [ ] **KUTSAL tahsilat** çalışıyor
- [ ] FAZ 4-8 bozulmadı
- [ ] Sidebar `/tv` linki çalışıyor

---

## ⚠️ ÖNEMLİ NOTLAR

### 1. Public Display Güvenliği
TV'yi müşteriler de görür:
- ✅ Müşteri adı (ilk harfler veya kısaltma uygun olabilir)
- ✅ Sıra no, hisse no, kurban no
- ✅ Aşama, durum
- ❌ Telefon, TC, adres GİZLİ
- ❌ Borç tutarı GİZLİ

Olası: "M. Yılmaz" yerine "Sıra 41" göster.

### 2. Performans
- 3 saniyede bir DB sorgu
- 414 hisse + 240 müşteri için: ~50-100ms
- Birden fazla TV açıksa her birine ayrı stream
- Connection limit: ~50 (yeterli)

### 3. Türkçe Karakter
Başlıklar, mesajlar Türkçe karakter destekli:
- Font: Inter veya Manrope (Türkçe destekli)
- Encoding: UTF-8

### 4. Renk Paleti (Tasarım Referansı)
```typescript
const RENKLER = {
  // KPI kartları
  toplamKurban: { bg: '#dbeafe', text: '#3b82f6', icon: '#3b82f6' },     // Mavi
  kesimde: { bg: '#fed7aa', text: '#ea580c', icon: '#ea580c' },         // Turuncu
  siradaki: { bg: '#ddd6fe', text: '#8b5cf6', icon: '#8b5cf6' },        // Mor
  teslimHazir: { bg: '#dcfce7', text: '#22c55e', icon: '#22c55e' },     // Yeşil
  tamamlanan: { bg: '#cffafe', text: '#06b6d4', icon: '#06b6d4' },      // Mavi-Cyan
  bekleyen: { bg: '#fef3c7', text: '#eab308', icon: '#eab308' },        // Sarı
};
```

### 5. Aşama Metinleri
```typescript
const ASAMA_METINLERI = {
  kesim: 'Kesim',
  deri_yuzme: 'Deri Yüzme',
  parcalama_hazirlik: 'Parçalama Hazırlık',
  parcalama: 'Parçalama',
  tartim: 'Tartım',
  paketleme: 'Paketleme',
  teslim_hazir: 'Teslime Hazır',
};
```

### 6. Demo Veriler (Test İçin)
Bayram öncesi gerçek operasyon yok. Demo için:
- Birkaç hisseyi manuel `kesimde` durumuna al
- İlerleme % oynat
- TV ekranında canlı güncellenir mi gör

### 7. Audit Log
Her durum değişikliği:
```typescript
await auditLog({
  eylem: 'tv_durum_degisikligi',
  model: 'Hisse',
  kayitId: hisseId,
  kullaniciId: session.userId,
  detaylar: { eskiDurum, yeniDurum, asama, ilerleme },
});
```

### 8. Mobile Fallback
TV ana hedef ama mobile'da da çalışsın:
- Grid: 4 sütun → 1 sütun (scroll)
- KPI: 6 → 2 sütun
- Font: küçülür ama okunur kalır

### 9. Fullscreen Mode
- F11 ile fullscreen
- Sidebar otomatik gizlenir
- Cursor 5sn hareketsizse gizlenir
- ESC ile çıkış

### 10. Otomatik Yenileme
SSE bağlantı kopsa:
- Browser otomatik yeniden bağlanır (3-5 sn)
- "Bağlantı yenileniyor..." mesajı
- Son veriler ekranda kalır (boş kalmasın)

---

## 📊 RAPOR ŞABLONU (Tamamlandığında)

```markdown
# FAZ 9 TAMAMLANDI — TV Kesim Ekranı (v2)

## ✅ Tamamlanan
- [x] DB: Hisse'ye kesim takip alanları + TvAyari modeli
- [x] SSE endpoint (3 sn güncelleme)
- [x] 6 REST API endpoint
- [x] Üst bar (logo + saat + canlı)
- [x] 6 KPI şeridi (renkli kartlar)
- [x] 4 ana sütun (Sıradaki/Kesimde/Tartımda/Teslime Hazır)
- [x] Operasyon akışı + genel durum
- [x] Alt bilgi şeridi (Duyuru/Sıra/Hijyen/WhatsApp)
- [x] Light/Dark tema toggle
- [x] Admin kontrol paneli
- [x] TvAyari yönetim sayfası
- [x] Canlı saat + animasyonlar
- [x] Public display güvenliği

## 🧪 Test Sonuçları
- pnpm tsc --noEmit: ✅
- pnpm build: ✅
- SSE çalışıyor: ✅
- Tema toggle: ✅
- 3 sayfa HTTP 200: ✅
- KUTSAL tahsilat: ✅
- Mevcut sistemler: ✅

## 📦 Git
- Toplam commit: X
- Push: ✅

## 🎯 Sıradaki Adım
FAZ 10 (Borçlular zenginleştirme / Hayvan tedariği) için hazır.
```

---

## 🚀 BAŞLA

Otonom modda çalış. Her adımda commit at. Sorun olursa dur ve sor.

**Tahmini süre:** 4-5 saat (büyük modül)

**Bayrama:** ~9 gün. Bu prompt biter bitmez **FAZ 10** ile devam.

**Hayırlı kodlar! 🐂✨**
