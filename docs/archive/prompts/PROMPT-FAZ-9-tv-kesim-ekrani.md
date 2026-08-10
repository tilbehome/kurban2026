# PROMPT-FAZ-9: TV KESİM EKRANI (SSE Canlı Yayın)

> **Claude Code'a ver. Otonom modda çalıştır. Her adımda commit at.**

---

## 🎯 AMAÇ

Bayram günü kesim merkezindeki **TV ekranında** veya **büyük monitörde** çalışacak **public display** modülü:
- 🐂 Hangi hisse kesimde
- 📋 Sıradakiler
- ✅ Tamamlananlar
- ⏰ Canlı saat + bayram saati
- 🔔 Personel ve müşteriler **uzaktan görür**

**Kritik:** Hem **personel** hem **müşteri** bakacak. Profesyonel, anlaşılır, dikkat çekici olmalı.

**Cihaz:** TV (1080p/4K), büyük monitör, tablet. Fullscreen mode.

---

## ⚠️ KORUNACAKLAR

**KESİNLİKLE BOZMA:**
- ✅ KUTSAL tahsilat akışı
- ✅ FAZ 4-8 tüm özellikler
- ✅ Sidebar menüde mevcut `/tv` placeholder (FAZ 5'te eklendi)
- ✅ Audit log + granular izinler
- ✅ Soft delete + MIMARI.md uyumu

---

## 📋 ŞU ANKİ DURUM

`/tv` route var ama içi placeholder. Şimdi içini dolduracağız.

**Şu sebepten ayrı route:**
- Fullscreen mode
- Sidebar gizli
- Auth opsiyonel (public display)
- Otomatik refresh
- TV'de gösterileceği için **fonu kapalı**

---

## 🎨 HEDEF UI

### Layout: Tam Ekran, 3 Dikey Bölüm

```
┌─────────────────────────────────────────────────────────────┐
│ ÜST BAR (10% yükseklik)                                       │
│ 🐂 ADABEREKET KURBAN | 09:34:21 | 5 Haziran 2026 | 🔴 CANLI │
├─────────────────────────────────────────────────────────────┤
│                                                                │
│ ORTA İÇERİK (75% yükseklik) - 3 SÜTUN                         │
│                                                                │
│ ┌──────────────┬──────────────┬──────────────┐                │
│ │ ŞU AN        │ SIRADAKİLER  │ BEKLEYENLER  │                │
│ │ KESİMDE      │ (5 sıra)     │ (10 sıra)    │                │
│ │ (3 hisse)    │              │              │                │
│ │              │              │              │                │
│ │ 🔪 KESİMDE   │ ⏳ SIRADA    │ ⏸️ BEKLEMEDE │                │
│ │              │              │              │                │
│ │ DANA-001     │ DANA-004     │ DANA-009     │                │
│ │ Hisse 3      │ Hisse 1      │ Hisse 1      │                │
│ │ Mehmet Y.    │ Hasan K.     │ Ali G.       │                │
│ │ [████████░]  │ Sıra: 1      │ Sıra: 1      │                │
│ │ 80% tamam    │              │              │                │
│ │              │ DANA-005     │ DANA-010     │                │
│ │ DANA-002     │ Hisse 2      │ Hisse 2      │                │
│ │ Hisse 5      │ Fatma Ş.     │ ...          │                │
│ │ Ahmet D.     │ Sıra: 2      │              │                │
│ │ [██████░░░]  │              │              │                │
│ │ 60% tamam    │ ...          │ Toplam: 162  │                │
│ │              │              │              │                │
│ │ DANA-003     │              │              │                │
│ │ Hisse 1      │              │              │                │
│ │ Fatma Ş.     │              │              │                │
│ │ [██░░░░░░░]  │              │              │                │
│ │ 20% tamam    │              │              │                │
│ │              │              │              │                │
│ └──────────────┴──────────────┴──────────────┘                │
│                                                                │
├─────────────────────────────────────────────────────────────┤
│ ALT BAR (15% yükseklik)                                       │
│ 📊 Bugün: 38 tamamlandı | 16 kesimde | 162 bekliyor | %23   │
│ 📢 BİLGİ ŞERİDİ (kayan yazı): Müşteri X eti almaya gelebilir│
└─────────────────────────────────────────────────────────────┘
```

### Renk Paleti (TV Optimizasyonu)

**Dark mode** öncelikli (TV gece de açık kalacak):
- Arka plan: `#0f172a` (koyu lacivert/siyah)
- Vurgu: `#ea580c` (Tilbe Orange)
- Aktif: `#f97316` (parlak turuncu)
- Sıradaki: `#f59e0b` (amber)
- Bekleyen: `#94a3b8` (gri)
- Tamamlanan: `#16a34a` (yeşil)
- Acil/Sorunlu: `#dc2626` (kırmızı)

**Tipografi:**
- Büyük fontlar (TV'den okunabilir)
- Numara: 48-64px
- Başlık: 32-40px
- Detay: 20-24px

---

## 🎨 BİLEŞEN DETAYLARI

### 1️⃣ ÜST BAR (Header)

**Sol:**
- Tilbe logo (büyük) + 🐂 simgesi
- "ADABEREKET KURBAN MERKEZİ" (büyük, semibold)

**Orta:**
- 🕐 **Canlı Saat** (büyük: 09:34:21)
- 📅 **5 Haziran 2026 - Cuma** (alt yazı)

**Sağ:**
- 🔴 **CANLI** (yeşil pulse animasyon)
- ☀️ **Bayram 1. Günü** (büyük, vurgulu)
- 🔄 Son güncelleme: "2 saniye önce"

### 2️⃣ ORTA: 3 SÜTUN

#### Sol Sütun: ŞU AN KESİMDE

**Başlık:**
```
🔪 ŞU AN KESİMDE
```
- Animasyon: Pulse effect
- Renk: Turuncu (`#ea580c`)
- Sayı: "3 hisse"

**Aşağıda 3 kart (büyük):**

```
┌─────────────────────────┐
│ 🐂 DANA-001              │  ← Büyük başlık
│ Hisse 3 / 7              │  ← Alt yazı
│                          │
│ Mehmet Yılmaz            │  ← Müşteri (büyük)
│                          │
│ [████████░] 80% tamam   │  ← İlerleme bar
│                          │
│ ⏱️ Başlama: 09:30        │
│ ⏰ Tahmini bitiş: 09:35  │
└─────────────────────────┘
```

**Detaylar:**
- Background: hafif turuncu vurgu (`bg-orange-500/10`)
- Border: turuncu
- İlerleme barı animasyonlu (yumuşak geçiş)
- Hover yok (TV'de mouse yok)

#### Orta Sütun: SIRADAKİLER

**Başlık:**
```
⏳ SIRADAKİLER
```
- Renk: Sarı (`#f59e0b`)
- Sayı: "5 hisse"

**Aşağıda 5 kart (orta boy):**

```
┌─────────────────────────┐
│ DANA-004 / Hisse 1       │
│ Hasan Kaya               │
│ Sıra: 1                  │
└─────────────────────────┘

┌─────────────────────────┐
│ DANA-005 / Hisse 2       │
│ Fatma Şahin              │
│ Sıra: 2                  │
└─────────────────────────┘

... (3 daha)
```

**Detaylar:**
- Hafif sarı vurgu
- Daha küçük (sığsın diye)

#### Sağ Sütun: BEKLEYENLER

**Başlık:**
```
⏸️ BEKLEMEDE
```
- Renk: Gri (`#94a3b8`)
- Sayı: "162 hisse"

**İçerik:**
- En son 10 müşteri kaydı (kompakt)
- Aşağıda: "Toplam: 162 müşteri bekliyor"
- Çok büyük olmayacak (sadece bilgi)

```
┌─────────────────────────┐
│ DANA-009 / Hisse 1       │
│ Ali Gürbüz               │
│                          │
│ DANA-010 / Hisse 2       │
│ Ayşe K.                  │
│                          │
│ ...                      │
│                          │
│ ───────────────          │
│ TOPLAM: 162              │
└─────────────────────────┘
```

### 3️⃣ ALT BAR (Footer)

**Sol: Bugün İstatistikleri (Büyük Rakamlar)**
```
✅ 38 Tamamlandı | 🔪 16 Kesimde | ⏸️ 162 Bekliyor
İlerleme: %23 (38/216)
```

**Sağ: Kayan Bilgi Şeridi**

Css animasyon ile sağdan sola kayar:
```
📢 Müşterimiz Mehmet Yılmaz, kesim tamamlandı, eti alınabilir
📢 5 dakika içinde DANA-007 kesime alınacak
📢 Bayram tebriği için lobide kutlama var
📢 ...
```

**Mesajlar:** Otomatik üretilebilir veya manuel girilebilir (admin panelden)

---

## 🔧 SSE (Server-Sent Events) STRATEJİSİ

### Neden SSE?
- ✅ **Tek yönlü** (server → client, ihtiyacımız budur)
- ✅ **Hafif** (WebSocket'tan basit)
- ✅ **Otomatik yeniden bağlanma**
- ✅ **HTTP üzerinden** (firewall sorunu yok)
- ✅ **Native API** (kütüphane gerekmez)

### Akış

```
TV Ekranı (Client)              Sunucu (Server)
     |                                |
     | GET /api/tv/yayin (SSE)        |
     |------------------------------->|
     |                                |
     |        her 5sn'de bir          |
     |<-------------------------------| event: guncelleme
     |                                | data: {kesimde, siradaki, bekleyen}
     |                                |
     |        olay olduğunda          |
     |<-------------------------------| event: yeni-kesim
     |                                | data: {danaNo, hisseNo, musteri}
```

### Implementation

```typescript
// app/api/tv/yayin/route.ts
export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // İlk veri
      const ilkVeri = await getTvVerileri();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(ilkVeri)}\n\n`));

      // 5 saniyede bir güncelle
      const interval = setInterval(async () => {
        const veri = await getTvVerileri();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(veri)}\n\n`));
      }, 5000);

      // Stream kapanırsa interval'ı temizle
      return () => clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

```typescript
// Client (TV sayfası)
useEffect(() => {
  const eventSource = new EventSource('/api/tv/yayin');

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    setTvVerisi(data);
  };

  eventSource.onerror = () => {
    console.error('SSE bağlantı hatası');
    // Otomatik yeniden bağlanır (browser yapıyor)
  };

  return () => eventSource.close();
}, []);
```

### Avantajlar
- 🔌 Bağlantı kopsa otomatik yeniden bağlanır
- 📡 Server-push (client polling yapmıyor, server'ın gönderdiği güncel)
- 🚀 Düşük gecikme (~5 saniye)

---

## 🗄️ DB SCHEMA (Yeni Model)

**`prisma/schema.prisma`** — Mevcut Hisse modeline alan ekle:

```prisma
model Hisse {
  // ... mevcut alanlar

  // YENİ: Kesim durumu
  kesimDurumu     KesimDurumu @default(beklemede)
  kesimSirasi     Int?         // sıra numarası (1, 2, 3...)
  kesimBaslama    DateTime?
  kesimBitis      DateTime?
  ilerlemeYuzde   Int          @default(0) // 0-100

  // ...
  @@index([kesimDurumu])
  @@index([kesimSirasi])
}

enum KesimDurumu {
  beklemede        // sırada bekliyor
  siradaki         // şimdi sırada, başlamak üzere
  kesimde          // şu an kesiliyor
  tamamlandi       // tamamlandı
  iptal            // iptal edildi
}
```

**Yeni Model: TvBildirim** (kayan yazı için)

```prisma
model TvBildirim {
  id          String   @id @default(cuid())
  metin       String
  tip         String   @default("bilgi") // bilgi | uyari | onemli | duyuru
  baslangic   DateTime @default(now())
  bitis       DateTime? // null = sınırsız
  aktifMi     Boolean  @default(true)

  // Audit
  olusturanId String
  silindiMi   Boolean  @default(false)
  silinmeTarihi DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Migration adı:** `add-kesim-durumu-ve-tv-bildirim`

---

## 🗂️ DOSYA YAPISI

### Yeni Componentlar

```
modules/tv/                            ← Yeni modül
├── components/
│   ├── TvLayout.tsx                   ← Ana layout (fullscreen)
│   ├── TvUstBar.tsx                   ← Logo + saat + canlı
│   ├── TvSutunKesimde.tsx             ← Sol: şu an kesimde
│   ├── TvSutunSiradaki.tsx            ← Orta: sıradakiler
│   ├── TvSutunBekleyen.tsx            ← Sağ: bekleyenler
│   ├── TvHisseKart.tsx                ← Tek hisse kartı
│   ├── TvAltBar.tsx                   ← Footer (istatistikler + kayan yazı)
│   ├── TvKayanYazi.tsx                ← Kayan bildirim şeridi
│   ├── TvIstatistik.tsx               ← Bugün özet
│   └── TvClient.tsx                   ← SSE bağlantısı + state
├── lib/
│   ├── tv.service.ts                  ← Veri çekme
│   └── tv-sse.ts                      ← SSE yardımcıları
└── types.ts
```

### Yeni Sayfa

```
app/tv/
├── page.tsx                            ← Ana TV sayfası (REFACTOR)
└── kontrol/page.tsx                    ← Admin kontrol paneli
```

### Yeni API'ler

```
app/api/tv/
├── yayin/route.ts                      ← SSE endpoint ⭐
├── veriler/route.ts                    ← REST fallback
├── kesim-baslat/route.ts               ← Hisseyi kesime al
├── kesim-bitir/route.ts                ← Hisseyi tamamla
├── ilerleme-guncelle/route.ts          ← İlerleme % güncelle
└── bildirim/route.ts                   ← TvBildirim CRUD
```

---

## 🎯 TV YÖNETİM PANELİ (Admin)

TV'yi yönetmek için ayrı bir sayfa: `/tv/kontrol`

### Özellikler

#### 1. Hisse Kontrol
- Tüm hisseleri listele (filtreleme: durum)
- "Kesime Al" butonu → durum: `siradaki` → `kesimde`
- "Tamamlandı" butonu → durum: `kesimde` → `tamamlandi`
- İlerleme yüzdesi slider (0-100)

#### 2. Sıra Yönetimi
- Drag-drop ile sıra değiştir
- Otomatik sıra atama
- Sıra dondur/aktive et

#### 3. Kayan Yazı Yönetimi
- Aktif mesajlar listesi
- Yeni mesaj ekle
- Tip seç (bilgi/uyari/onemli/duyuru)
- Otomatik bitiş zamanı

#### 4. TV Ekran Önizleme
- Küçük boyutta iframe ile TV görünümü
- Gerçek zamanlı

---

## 🎨 STİL DETAYLARI

### Animasyonlar

#### 1. Pulse Animation (Canlı Rozet)
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.canli-rozet {
  animation: pulse 2s ease-in-out infinite;
}
```

#### 2. Kayan Yazı (Marquee)
```css
@keyframes marquee {
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}

.kayan-yazi {
  animation: marquee 20s linear infinite;
}
```

#### 3. İlerleme Barı (Smooth)
```css
.ilerleme-bar {
  transition: width 1s ease-out;
}
```

#### 4. Yeni Hisse Geliyor (Slide-in)
```css
@keyframes slideIn {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

### Saat (Canlı)
```typescript
const [saat, setSaat] = useState(new Date());

useEffect(() => {
  const interval = setInterval(() => setSaat(new Date()), 1000);
  return () => clearInterval(interval);
}, []);

// Format: 09:34:21
const formatSaat = (d: Date) => {
  return d.toTimeString().split(' ')[0];
};
```

### Fullscreen Mode
```typescript
function fullscreenAc() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen();
  }
}

// Kısayol: F11 veya çift tık
```

---

## 🎯 UYGULAMA SIRASI (10 ADIM)

### ADIM 1: DB Migration
1. `Hisse` modeline `kesimDurumu`, `kesimSirasi`, `ilerlemeYuzde`, `kesimBaslama/Bitis`
2. Yeni model: `TvBildirim`
3. Migration: `add-kesim-durumu-ve-tv-bildirim`
4. Seed: birkaç demo `TvBildirim`

**Commit:** `feat(db): kesim durumu ve tv bildirim modelleri`

### ADIM 2: Service + Tipler
1. `modules/tv/lib/tv.service.ts`
2. `modules/tv/types.ts`
3. SSE helper

**Commit:** `feat(tv): tv service ve tipler`

### ADIM 3: REST API'ler
1. `/api/tv/veriler` GET (REST fallback)
2. `/api/tv/kesim-baslat` POST
3. `/api/tv/kesim-bitir` POST
4. `/api/tv/ilerleme-guncelle` PATCH
5. `/api/tv/bildirim` GET+POST+PATCH+DELETE

**Commit:** `feat(tv): REST API endpointleri`

### ADIM 4: SSE Endpoint ⭐
1. `/api/tv/yayin` (SSE stream)
2. 5 saniyede bir güncelleme
3. Hata yönetimi (stream kapanırsa)

**Commit:** `feat(tv): SSE canli yayin endpoint`

### ADIM 5: TV Layout + Üst Bar
1. `TvLayout.tsx` (fullscreen, dark mode)
2. `TvUstBar.tsx` (logo + saat + canlı)
3. `app/tv/page.tsx` refactor
4. Auth opsiyonel (public display için)

**Commit:** `feat(tv): tv layout ve ust bar`

### ADIM 6: 3 Ana Sütun ⭐
1. `TvSutunKesimde.tsx`
2. `TvSutunSiradaki.tsx`
3. `TvSutunBekleyen.tsx`
4. `TvHisseKart.tsx` (3 boy: büyük/orta/küçük)

**Commit:** `feat(tv): 3 ana sutun (kesimde/siradaki/bekleyen)`

### ADIM 7: Alt Bar + Kayan Yazı
1. `TvAltBar.tsx`
2. `TvIstatistik.tsx`
3. `TvKayanYazi.tsx` (marquee animasyon)

**Commit:** `feat(tv): alt bar ve kayan yazi`

### ADIM 8: SSE Client + Canlı Veri
1. `TvClient.tsx` (EventSource bağlantısı)
2. State yönetimi
3. Yeniden bağlanma logic
4. Animasyonlar (slide-in, pulse)

**Commit:** `feat(tv): SSE client ve canli veri akisi`

### ADIM 9: Kontrol Paneli
1. `app/tv/kontrol/page.tsx`
2. Hisse kontrol (kesime al / bitir)
3. Sıra yönetimi (drag-drop)
4. Kayan yazı CRUD
5. TV önizleme (iframe)

**Commit:** `feat(tv): kontrol paneli`

### ADIM 10: Test + Polish
1. `pnpm tsc --noEmit`
2. `pnpm build`
3. SSE bağlantı testi
4. Fullscreen mode (F11)
5. Mobile fallback (mobile'da küçük görünüm)
6. KUTSAL tahsilat
7. Audit log
8. Demo veriler

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
- [ ] `/tv` HTTP 200
- [ ] `/tv/kontrol` HTTP 200

### TV Görünüm
- [ ] Dark mode aktif
- [ ] Üst bar (logo + saat + canlı)
- [ ] 3 sütun (kesimde/sıradaki/bekleyen)
- [ ] Alt bar (istatistik + kayan yazı)
- [ ] Canlı saat sayar (1 sn'de bir)
- [ ] Animasyonlar çalışıyor

### SSE
- [ ] EventSource bağlanıyor
- [ ] 5 saniyede bir güncelleme geliyor
- [ ] Bağlantı kopsa otomatik yeniden bağlanır
- [ ] DevTools Network'te SSE stream görünüyor

### Kontrol Paneli
- [ ] Hisse kesime alınıyor
- [ ] İlerleme % güncellenebiliyor
- [ ] Hisse tamamlandı işaretlenebiliyor
- [ ] Kayan yazı eklenebiliyor
- [ ] Demo'da TV ekranı güncelleniyor

### Fullscreen
- [ ] F11 ile fullscreen
- [ ] Sidebar gizli
- [ ] Fontlar büyük (TV'den okunabilir)

### Auth
- [ ] `/tv` public erişilir (auth opsiyonel)
- [ ] `/tv/kontrol` sadece admin/kasiyer

### Mevcut Sistem
- [ ] **KUTSAL tahsilat** çalışıyor
- [ ] FAZ 4-8 hiçbir şey bozulmadı

---

## ⚠️ ÖNEMLİ NOTLAR

### 1. SSE vs WebSocket
SSE seçildi çünkü:
- ✅ Daha basit (kütüphane gerekmez)
- ✅ Otomatik reconnect
- ✅ Tek yönlü (yeterli)
- ❌ WebSocket çift yönlü (gereksiz)

### 2. Performans
- 5 saniyede bir DB sorgu
- 240 müşteri + 414 hisse için: ~50ms sorgu süresi
- Çoklu TV bağlantısı: her TV ayrı stream (sorun değil)

### 3. Mobile/Tablet Davranışı
- TV ana hedef ama mobile'da da çalışsın
- Mobile: 3 sütun → 1 sütun (scroll)
- Fontlar otomatik küçülür (responsive)

### 4. Karanlık Mod
TV'de daha az göz yakar. Default dark mode, light mode opsiyonel.

### 5. Demo Veriler
Gerçek kesim modülü Faz 2'de yapılacak. Şimdilik:
- Birkaç hisseyi manuel `kesimde` durumuna al
- Kontrol panelinden ilerleme % oynat
- TV ekranında canlı güncellenir mi gör

### 6. Public Display Güvenliği
- `/tv` sayfası **müşteriler de görür**
- Hisse bilgileri (müşteri adı, hisse no) açık
- ❌ Telefon, TC, adres **YOK**
- ❌ Borç tutarı **YOK**
- ✅ Sadece operasyonel bilgi

### 7. Audit Log
Her durum değişikliği:
```typescript
await auditLog({
  eylem: 'kesim_durum_degisikligi',
  model: 'Hisse',
  kayitId: hisseId,
  kullaniciId: session.userId,
  detaylar: {
    eskiDurum: 'siradaki',
    yeniDurum: 'kesimde',
  },
});
```

### 8. Audio (Opsiyonel, Bonus)
- Yeni hisse kesime alındığında ses çal
- "Mehmet Yılmaz, kesim başladı" anonsu
- Bayram sonrası yapılabilir

---

## 📊 RAPOR ŞABLONU (Tamamlandığında)

```markdown
# FAZ 9 TAMAMLANDI — TV Kesim Ekranı SSE

## ✅ Tamamlanan
- [x] DB: kesim durumu + TvBildirim
- [x] SSE endpoint (canlı yayın)
- [x] 5 REST API endpoint
- [x] TV layout (dark mode, fullscreen)
- [x] Üst bar (logo + saat + canlı)
- [x] 3 sütun (kesimde/sıradaki/bekleyen)
- [x] Alt bar + kayan yazı
- [x] Kontrol paneli (admin)
- [x] Canlı saat + animasyonlar

## 🧪 Test Sonuçları
- pnpm tsc --noEmit: ✅
- pnpm build: ✅
- SSE çalışıyor: ✅
- KUTSAL tahsilat: ✅
- Mevcut sistemler: ✅

## 📦 Git
- Toplam commit: X
- Push: ✅

## 🎯 Sıradaki Adım
FAZ 10 (Borçlular zenginleştirme veya Dekontlar sayfası) için hazır.
```

---

## 🚀 BAŞLA

Otonom modda çalış. Her adımda commit at. Sorun olursa dur ve sor.

**Tahmini süre:** 3-4 saat

**Bayrama:** ~9 gün. Bu prompt biter bitmez **FAZ 10** ile devam.

**Hayırlı kodlar! 🐂✨**
