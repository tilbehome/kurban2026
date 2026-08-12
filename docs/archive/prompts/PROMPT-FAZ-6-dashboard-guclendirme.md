---
id: ARCH-931595429F77
status: ARCHIVED
owner: Historical
source_role: historical_record
source_of_truth: false
last_reviewed: not_applicable
verified_against_commit: not_applicable
---

# PROMPT-FAZ-6: DASHBOARD GÜÇLENDİRME

> **Claude Code'a ver. Otonom modda çalıştır. Her adımda commit at.**

---

## 🎯 AMAÇ

Mevcut sade dashboard'u **profesyonel SaaS seviyesinde** operasyon merkezine dönüştür. Burhan ve kasiyer **giriş yapar yapmaz** bayram operasyonunun **tüm durumunu** görecek.

**Hedef:** Linear/Stripe/Vercel premium SaaS hissi + Türk pazarına özel.

---

## ⚠️ KORUNACAKLAR

**KESİNLİKLE BOZMA:**
- ✅ KUTSAL tahsilat akışı
- ✅ Müşteri detay tab sistemi (FAZ 4)
- ✅ Sidebar 12 menü (FAZ 5)
- ✅ Akordeon davranış
- ✅ Bildirim API (`/api/sidebar/bildirimler`)
- ✅ Mevcut çalışan tüm sayfalar
- ✅ Audit log + granular izinler
- ✅ Soft delete
- ✅ MIMARI.md uyumu
- ✅ TKR dekont numara sırası

---

## 📋 ŞU ANKİ DURUM

`app/page.tsx` mevcut. İçinde:
- Birkaç KPI kart
- Hızlı erişim grid (FAZ 5'te sidebar-config'e bağlandı)

**Eksik:**
- ❌ Canlı kesim operasyon akışı (7 aşama)
- ❌ Tahsilat trend grafiği
- ❌ Hatırlatmalar paneli
- ❌ Bayram sayacı banner
- ❌ WhatsApp bildirim merkezi
- ❌ Canlı son işlemler feed
- ❌ Kasa durumu özet
- ❌ Sistem durumu çubuğu

---

## 🗂️ HEDEF DASHBOARD YAPISI

```
┌─────────────────────────────────────────────────────────────┐
│ TOP BAR (Bilgilendirme Şeridi)                              │
│ ⏰ Bayrama X gün kaldı | 📱 WhatsApp:23 | ☁️ Yedek:02:07     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 6 KPI KART (Üst Satır)                                       │
│ [Müşteri] [Kurban] [Hisse Doluluk] [Tahsilat] [Borç] [Kasa] │
│                                                              │
├──────────────────────────────┬──────────────────────────────┤
│ TAHSİLAT TREND GRAFİĞİ       │ HATIRLATMALAR PANELİ         │
│ (24 saatlik combo chart)     │ - Ödeme Bekleyen: 34         │
│ Toplam: 125.750₺             │ - Eksik Vekalet: 12          │
│                              │ - Teslimat Bekleyen: 9       │
│                              │ - WhatsApp Kuyruğu: 23       │
├──────────────────────────────┴──────────────────────────────┤
│ ⭐ CANLI KESİM OPERASYON AKIŞI (7 AŞAMA)                     │
│ Vekalet → Kesim Alanı → Kesimde → Parçalama → Tartım →      │
│ Paketleniyor → Teslim Hazır                                  │
├──────────────────────────────┬──────────────────────────────┤
│ CANLI SON İŞLEMLER FEED      │ KASA DURUMU + WHATSAPP       │
│ - MY +tahsilat 7.000₺ 2dk    │ Nakit: 564.800₺              │
│ - AD +havale 14.000₺ 5dk     │ Banka: 291.900₺              │
│ - HK +VIP +tahsilat 7.000₺   │ POS: 0₺                      │
│ - FS +tahsilat 21.000₺       │ NET: 856.300₺                │
│                              │ ─────────────────             │
│                              │ WhatsApp: Yeni:23 Kuyruk:7   │
├──────────────────────────────┴──────────────────────────────┤
│ HIZLI ERİŞİM (Kategorize)                                    │
│ [Sık Kullanılan] [Operasyon] [Finans] [İletişim] [Raporlar] │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 BÖLÜM DETAYLARI

### 1️⃣ TOP BAR (Bilgilendirme Şeridi)

**Konum:** Sayfanın en üstünde, sarımsı/turuncu gradient şerit.

**İçerik:**
- ⏰ **Bayrama X gün kaldı** (büyük, vurgulu)
- Alt yazı: Operasyon planı, yürütümü, son hazırlık
- 📱 **WhatsApp Kuyruğu: 23** (yeşil nokta - aktif)
- ☁️ **Yedekleme: 02:07'de alındı** (son yedek zamanı)
- 🔘 **Sistem Durumu →** linki (ayarlar/sistem'e gider)

**Davranış:**
- Sabit, kapatılabilir değil
- Renkli: `bg-gradient-to-r from-orange-50 to-amber-50`
- Border: `border-l-4 border-l-orange-500`

### 2️⃣ 6 KPI KART (Üst Satır)

**Grid:** `grid-cols-1 md:grid-cols-3 lg:grid-cols-6`

#### Kart 1: Toplam Müşteri
- 🟢 Yeşil ikon kutu: `Users`
- Sayı: **1.248** (büyük)
- Alt etiket: "Aktif müşteriler"
- Trend rozet: `↑ %12 bu ay`

#### Kart 2: Toplam Kurban
- 🔵 Mavi ikon kutu: `Cow` (lucide'da yok, `Beef` veya `BadgePlus`)
- Sayı: **368**
- Alt etiket: "Toplam hisse: 2.416"
- Trend rozet: `↑ %8`

#### Kart 3: Hisse Doluluk
- 🟣 Mor ikon kutu: `PieChart`
- Sayı: **%82**
- Alt etiket: "Dolu hisseler"
- Progress bar: %82 doluluk
- Trend rozet: `↑ %6`

#### Kart 4: Bugünkü Tahsilat
- 🟠 Turuncu ikon kutu: `Banknote`
- Sayı: **125.750 ₺**
- Alt etiket: "15 işlem"
- Trend rozet: `↑ %18`

#### Kart 5: Bekleyen Borç
- 🔴 Kırmızı ikon kutu: `AlertCircle`
- Sayı: **286.400 ₺**
- Alt etiket: "32 müşteri"
- Trend rozet: `↑ %5` (artmak kötü, kırmızı)
- Buton: "İncele →" (borçlular sayfasına)

#### Kart 6: Kasa Bakiyesi
- 🟢 Yeşil ikon kutu: `Wallet`
- Sayı: **856.300 ₺**
- Alt etiket: "Net bakiye"
- Trend rozet: `↑ %11`

**Her Kart Tasarımı:**
- Beyaz bg, ince border (`border-stone-200`)
- Hover: hafif vurgu (`shadow-sm`)
- İkon: 32x32px, renkli kutu (`bg-{color}-50`, `text-{color}-600`)
- Sayı: 24px, semibold
- Alt etiket: 12px, gray
- Trend: küçük rozet, sağ üst

### 3️⃣ TAHSİLAT TREND GRAFİĞİ (Sol)

**Boyut:** İlk 6'da `lg:col-span-4` (geniş)

**İçerik:**
- Başlık: **"Tahsilat Akışı"**
- Alt yazı: "Son 24 saat"
- Tab seçici (sağ üst): `Bugün | 7 Gün | 30 Gün`

**Chart:**
- **Combo chart** (Bar + Line)
- Recharts kullan (zaten yüklü)
- X ekseni: Saatler (00, 04, 08, 12, 16, 20, 24)
- Y ekseni sol: Tutar (₺)
- Y ekseni sağ: İşlem sayısı
- Bar: Tahsilat tutarı (turuncu)
- Line: İşlem sayısı (mavi)
- Tooltip: Hover'da detay

**Alt Metrikler:**
3 mini kart:
- Toplam Tahsilat: **125.750 ₺** (`+%18`)
- Ortalama İşlem: **7.860 ₺**
- Başarı Oranı: **%100**

**Renk Paleti:**
- Bar: `#ea580c` (turuncu)
- Line: `#2563eb` (mavi)
- Grid: `#e5e7eb` (gri)

### 4️⃣ HATIRLATMALAR PANELİ (Sağ)

**Boyut:** `lg:col-span-2`

**Başlık:** "Hatırlatmalar" + "Tümü →" linki

**Liste (renkli):**
1. 🔴 **Ödeme Bekleyen Hisseler** → 34 (kırmızı sayı badge)
2. 🟡 **Eksik Vekalet Onayları** → 12 (sarı)
3. 🔵 **Teslimatı Bekleyenler** → 9 (mavi)
4. 🟢 **WhatsApp Mesaj Kuyruğu** → 23 (yeşil)

**Her Satır:**
- Renkli ikon (sol)
- Başlık (medium)
- Alt yazı (gri, küçük)
- Sayı rozet (sağ, renkli)
- Hover: arka plan vurgu
- Tıklayınca: ilgili sayfaya git

**Veri Kaynağı:** `/api/sidebar/bildirimler` (zaten var)

### 5️⃣ ⭐ CANLI KESİM OPERASYON AKIŞI (En Önemli!)

**Tam Genişlik:** `col-span-full`

**Başlık:** "Canlı Kesim Operasyon Akışı"
**Alt yazı:** 🟢 Canlı (yeşil nokta animasyon) | Son güncelleme: 09:34:21

**7 Aşama Grid:** `grid-cols-7` (mobile: scroll)

#### Her Aşama Kartı:
```
┌──────────────────┐
│   👤 İkon         │
│   Vekalet/Onay    │  ← İsim
│                  │
│   17             │  ← Büyük sayı
│   alanında 17    │  ← Alt yazı
│                  │
│   %43            │  ← Yüzde
│   ████░░░░░░     │  ← Progress bar
│   Hisse: 17/40   │  ← Detay
└──────────────────┘
```

#### 7 Aşama:
| # | İsim | İkon | Renk | Yüzde |
|---|------|------|------|-------|
| 1 | Vekalet / Onay | `UserCheck` | Turuncu | %43 |
| 2 | Kesim Alanı | `Cow` veya `Beef` | Sarı | %67 |
| 3 | Kesimde | `Scissors` | Kırmızı | %46 |
| 4 | Parçalama | `Slice` veya `Users` | Mor | %57 |
| 5 | Tartım | `Scale` | Mavi | %57 |
| 6 | Paketleniyor | `Package` | Yeşil koyu | %57 |
| 7 | Teslim Hazır | `CheckCircle` | Yeşil | %83 |

#### Renkler (Progress Bar):
- Turuncu: `bg-orange-500`
- Sarı: `bg-amber-500`
- Kırmızı: `bg-red-500`
- Mor: `bg-purple-500`
- Mavi: `bg-blue-500`
- Yeşil koyu: `bg-emerald-500`
- Yeşil: `bg-green-500`

**Veri Kaynağı:** Yeni API endpoint
- `GET /api/dashboard/kesim-akisi`
- Şu an için demo veri döndürebilir (gerçek kesim modülü Faz 2'de)

**Refresh:** 30 saniyede bir polling

### 6️⃣ CANLI SON İŞLEMLER FEED (Sol Alt)

**Boyut:** `lg:col-span-4`

**Başlık:** "Canlı İşlemler"
**Sağ:** 🟢 Canlı akış (yeşil pulse animasyon)

**Liste (Avatar + İsim + Eylem + Tutar + Zaman):**

```
┌────────────────────────────────────────────────────────┐
│ [MY] Mehmet Yılmaz [+tahsilat]              7.000 ₺   │
│      17 No · 1 hisse · TKR-2026-000125     2 dk önce  │
├────────────────────────────────────────────────────────┤
│ [AD] Ahmet Demir [havale]                  14.000 ₺   │
│      8 No · 2 hisse · TKR-2026-000124      5 dk önce  │
├────────────────────────────────────────────────────────┤
│ [HK] Hasan Kaya [VIP] [+tahsilat]           7.000 ₺   │
│      21 No · 1 hisse · TKR-2026-000123    12 dk önce  │
├────────────────────────────────────────────────────────┤
│ [FŞ] Fatma Şahin [+tahsilat] [3 hisse]    21.000 ₺   │
│      5 No · TKR-2026-000122                18 dk önce  │
└────────────────────────────────────────────────────────┘
```

**Her Satır:**
- Avatar (gradient, ID-bazlı renk)
- İsim + rozetler (VIP, +tahsilat, havale, vs.)
- Alt yazı: hisse no + dana no + TKR no
- Sağ: tutar + zaman (relative)

**Footer:** "Tüm işlemleri gör →" linki

**Veri Kaynağı:** `GET /api/dashboard/son-islemler` (son 10 ödeme)

### 7️⃣ KASA DURUMU + WHATSAPP (Sağ Alt)

**Boyut:** `lg:col-span-2` (yan yana 2 kart)

#### Kart A: Kasa Durumu
- Başlık: "Kasa Durumu" + "Detaylar →"
- Nakit Kasa: **564.800 ₺**
- Banka Hesapları: **291.900 ₺**
- POS: **0 ₺**
- Net Bakiye: **856.300 ₺** (büyük, vurgulu)
- Buton: "Kasa Raporuna Git →"

#### Kart B: WhatsApp Bildirim Merkezi
- Başlık: "WhatsApp Bildirim Merkezi"
- 4 mini metrik:
  - 🟢 Yeni Mesajlar: **23**
  - 🔵 Gönderim Kuyruğu: **7**
  - 🟣 Başarılı Gönderimler: **128**
  - 🔴 Hata: **2**
- Buton: "Mesaj merkezine git →"

### 8️⃣ HIZLI ERİŞİM (Alt Tab Bar)

**Şu an mevcut** (FAZ 5'te eklenen). Olduğu gibi kalsın, sadece konumu doğrulayalım.

Tab kategorileri:
- ⭐ Sık Kullanılan
- 🔪 Operasyon
- 💰 Finans
- 🚚 Lojistik
- 💬 İletişim
- 📊 Raporlama

---

## 🗂️ DOSYA YAPISI

### Yeni Component'lar

```
modules/dashboard/
├── components/
│   ├── TopBilgiSeridi.tsx           ← Üst bilgilendirme
│   ├── KpiKartlari.tsx              ← 6 KPI kart
│   ├── TahsilatTrendGrafigi.tsx     ← Combo chart
│   ├── HatirlatmalarPaneli.tsx      ← Sağ panel
│   ├── KesimOperasyonAkisi.tsx      ← ⭐ 7 aşama
│   ├── SonIslemlerFeed.tsx          ← Avatar feed
│   ├── KasaDurumuKart.tsx           ← Kasa özet
│   ├── WhatsAppBildirimKart.tsx     ← WhatsApp özet
│   └── HizliErisimSeridi.tsx        ← Alt tab bar (var)
├── lib/
│   └── dashboard.service.ts         ← Veri çekme servisleri
└── types.ts                          ← Dashboard tipleri
```

### Yeni API'ler

```
app/api/dashboard/
├── kpi/route.ts                     ← 6 KPI verileri
├── tahsilat-trend/route.ts          ← Combo chart verisi
├── kesim-akisi/route.ts             ← 7 aşama (şimdilik demo)
├── son-islemler/route.ts            ← Son 10 ödeme
└── kasa-durumu/route.ts             ← Kasa + bankalar
```

### Refactor

```
app/page.tsx                          ← Yeni dashboard layout
```

---

## 🔧 STACK GEREKSİNİMLERİ

### Kütüphaneler

**Zaten yüklü olanlar:**
- ✅ recharts (combo chart için)
- ✅ lucide-react (ikonlar)
- ✅ date-fns (tarih formatları)

**Yeni gerekli yok!**

### Veri Akışı

```typescript
// Server Component (app/page.tsx)
async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/giris');

  // Paralel veri çek
  const [kpi, trend, akis, sonIslemler, kasa, bildirim] = await Promise.all([
    fetchKpi(),
    fetchTahsilatTrend(),
    fetchKesimAkisi(),
    fetchSonIslemler(),
    fetchKasaDurumu(),
    fetchSidebarBildirim(),
  ]);

  return <DashboardClient initialData={...} session={session} />;
}
```

```typescript
// Client Component (DashboardClient.tsx)
'use client';

function DashboardClient({ initialData }) {
  // 30 saniyede bir refresh
  useInterval(async () => {
    const [yeniKpi, yeniTrend, ...] = await Promise.all([...]);
    setKpi(yeniKpi);
    // ...
  }, 30000);

  return <Layout>...</Layout>;
}
```

---

## 🎨 RESPONSIVE TASARIM

### Desktop (≥1280px)
- 6 KPI tek sıra
- Trend grafiği + Hatırlatmalar yan yana (4+2)
- Kesim akışı tam genişlik (7 aşama)
- Son işlemler + Kasa/WhatsApp yan yana (4+2)

### Laptop (1024-1279px)
- 6 KPI tek sıra (daha sıkı)
- Diğerleri desktop ile aynı

### Tablet (768-1023px)
- KPI: 3 sütun (2 satır)
- Trend grafiği tam genişlik
- Hatırlatmalar tam genişlik
- Kesim akışı: 4 sütun (2 satır) veya scroll

### Mobile (<768px)
- KPI: 2 sütun (3 satır)
- Tüm kartlar tek sütun
- Kesim akışı: horizontal scroll (snap)
- Compact layout

---

## 🎯 UYGULAMA SIRASI (10 ADIM)

### ADIM 1: Tip Tanımları + Service Skeleton
1. `modules/dashboard/types.ts`
2. `modules/dashboard/lib/dashboard.service.ts` (placeholder)

**Commit:** `feat(dashboard): tipler ve service iskeleti`

### ADIM 2: TopBilgiSeridi
1. Component oluştur
2. Bayrama X gün kaldı (dinamik hesaplama)
3. WhatsApp kuyruğu (bildirim API'den)
4. Yedekleme bilgisi (son yedek zamanı)

**Commit:** `feat(dashboard): top bilgi seridi eklendi`

### ADIM 3: 6 KPI Kart
1. `KpiKartlari.tsx`
2. 6 kart, renkli ikon kutuları
3. Trend rozetleri
4. API: `/api/dashboard/kpi`

**Commit:** `feat(dashboard): 6 kpi kart eklendi`

### ADIM 4: Tahsilat Trend Grafiği
1. `TahsilatTrendGrafigi.tsx`
2. Recharts combo chart
3. Tab seçici (Bugün/7 Gün/30 Gün)
4. 3 alt metrik
5. API: `/api/dashboard/tahsilat-trend`

**Commit:** `feat(dashboard): tahsilat trend grafigi eklendi`

### ADIM 5: Hatırlatmalar Paneli
1. `HatirlatmalarPaneli.tsx`
2. 4 renkli satır
3. Tıklanır (ilgili sayfaya git)
4. Bildirim API kullan (zaten var)

**Commit:** `feat(dashboard): hatirlatmalar paneli eklendi`

### ADIM 6: ⭐ Kesim Operasyon Akışı (En Önemli!)
1. `KesimOperasyonAkisi.tsx`
2. 7 aşama kartı (responsive grid)
3. Renkli progress bar'lar
4. Canlı rozet (yeşil pulse)
5. API: `/api/dashboard/kesim-akisi` (şimdilik demo veri)

**Commit:** `feat(dashboard): canli kesim akisi eklendi (7 asama)`

### ADIM 7: Son İşlemler Feed
1. `SonIslemlerFeed.tsx`
2. Avatar + isim + eylem rozetleri + tutar + zaman
3. Son 10 ödeme
4. API: `/api/dashboard/son-islemler`

**Commit:** `feat(dashboard): son islemler feed eklendi`

### ADIM 8: Kasa + WhatsApp Kartları
1. `KasaDurumuKart.tsx`
2. `WhatsAppBildirimKart.tsx`
3. Nakit + Banka + POS dağılımı
4. WhatsApp metrikleri
5. API: `/api/dashboard/kasa-durumu`

**Commit:** `feat(dashboard): kasa ve whatsapp kartlari eklendi`

### ADIM 9: Layout Refactor
1. `app/page.tsx` yeniden düzenle
2. Server component + client wrapper
3. Paralel veri çekme
4. 30 saniyede bir refresh

**Commit:** `feat(dashboard): ana sayfa layout refactor`

### ADIM 10: Test + Polish
1. `pnpm tsc --noEmit` temiz
2. Responsive test (mobile/tablet/desktop)
3. KUTSAL tahsilat çalışıyor mu?
4. Mevcut sayfalar bozulmadı mı?
5. Sidebar entegrasyonu OK?

**Commit:** `test(dashboard): faz 6 dogrulandi`

### Final: Push
```bash
git push origin main
```

---

## ✅ TEST CHECKLİSTİ

### Temel
- [ ] `pnpm tsc --noEmit` temiz
- [ ] `pnpm build` başarılı
- [ ] `pnpm dev` başlıyor
- [ ] Ana sayfa HTTP 200

### Bileşenler
- [ ] Top bilgi şeridi gösteriliyor
- [ ] 6 KPI kart doğru renklerle
- [ ] Trend grafiği yükleniyor
- [ ] Hatırlatmalar paneli (4 satır)
- [ ] Kesim akışı (7 aşama) gösteriliyor
- [ ] Son işlemler feed
- [ ] Kasa durumu kart
- [ ] WhatsApp kart
- [ ] Hızlı erişim alt bar

### Davranış
- [ ] Bayram sayacı doğru hesaplıyor (5 Haziran 2026)
- [ ] Hatırlatmalar tıklanır
- [ ] Tab seçici (Bugün/7G/30G) çalışıyor
- [ ] 30 saniyede bir refresh
- [ ] Trend chart hover tooltip

### Veri
- [ ] KPI sayıları doğru DB'den
- [ ] Trend grafiği gerçek tahsilat verisi
- [ ] Son işlemler son 10 ödeme
- [ ] Kasa durumu gerçek kasa toplam
- [ ] Kesim akışı (şimdilik demo, sonra gerçek)

### Responsive
- [ ] Desktop (1280+) tam layout
- [ ] Tablet (768-1023) 2-3 sütun
- [ ] Mobile (<768) tek sütun
- [ ] Kesim akışı mobile'da scroll

### Mevcut Sistem
- [ ] **KUTSAL tahsilat** çalışıyor
- [ ] Müşteri detay tab (FAZ 4)
- [ ] Sidebar 12 menü (FAZ 5)
- [ ] Tüm placeholder sayfalar

---

## ⚠️ ÖNEMLİ NOTLAR

### 1. Kesim Akışı Şu An Demo
Gerçek kesim modülü Faz 2'de yapılacak. Şimdilik:
```typescript
// /api/dashboard/kesim-akisi
return {
  basarili: true,
  veri: {
    asamalar: [
      { id: 'vekalet', ad: 'Vekalet / Onay', sayi: 17, toplam: 40, yuzde: 43 },
      { id: 'kesim-alani', ad: 'Kesim Alanı', sayi: 32, toplam: 48, yuzde: 67 },
      // ... 7 aşama
    ]
  }
}
```

### 2. Gerçek Veri Yerleri

| Komponent | Veri Kaynağı |
|-----------|--------------|
| KPI: Müşteri | `prisma.musteri.count({ silindiMi: false })` |
| KPI: Kurban | `prisma.hayvan.count({ silindiMi: false })` |
| KPI: Hisse | `prisma.hisse.count + dolu/toplam` |
| KPI: Tahsilat | `prisma.odeme.aggregate({ tarih: today })` |
| KPI: Borç | Hesaplama: toplam - ödenen |
| KPI: Kasa | `prisma.kasaHareketi` toplam |
| Trend | `prisma.odeme.groupBy({ saat })` |
| Son İşlemler | `prisma.odeme.findMany({ orderBy: createdAt desc, take: 10 })` |
| Kasa | KasaHareketi yöntem bazında toplam |
| Hatırlatmalar | `/api/sidebar/bildirimler` (zaten var) |

### 3. Performans
- Paralel veri çekme (`Promise.all`)
- 30 saniyede bir refresh (interval)
- Lazy loading (chart sadece görünür olunca yüklensin)
- Skeleton loader (yüklenirken)

### 4. Boş Durumlar
- Veri yoksa "Henüz tahsilat yok" mesajı
- 0 borçlu varsa "🎉 Tüm müşteriler ödedi!"
- Son işlem yoksa "İlk tahsilatı bekliyoruz"

### 5. Renkler (Mockup'lara uygun)
```typescript
const KART_RENKLERI = {
  yesil: { bg: 'bg-green-50', text: 'text-green-600', icon: 'bg-green-100' },
  mavi: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'bg-blue-100' },
  mor: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'bg-purple-100' },
  turuncu: { bg: 'bg-orange-50', text: 'text-orange-600', icon: 'bg-orange-100' },
  kirmizi: { bg: 'bg-red-50', text: 'text-red-600', icon: 'bg-red-100' },
  saryi: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'bg-amber-100' },
};
```

### 6. Yetki Kontrolü
Bazı veriler bazı rollere kapalı:
- **Kasiyer:** Borç, Tahsilat görür, Kasa toplam göremez
- **İzleyici:** Sadece KPI'ları görür, son işlem detayları yok
- **Kesim personeli:** Sadece Kesim Akışı görür

İzin kontrolü her API'de.

---

## 📊 RAPOR ŞABLONU (Tamamlandığında)

```markdown
# FAZ 6 TAMAMLANDI — Dashboard Güçlendirme

## ✅ Tamamlanan
- [x] Top bilgi şeridi (bayram sayacı + WhatsApp + yedek)
- [x] 6 KPI kart (renkli, trend rozeti)
- [x] Tahsilat trend grafiği (combo chart)
- [x] Hatırlatmalar paneli (4 satır)
- [x] ⭐ Canlı kesim akışı (7 aşama)
- [x] Son işlemler feed (avatar)
- [x] Kasa durumu kart
- [x] WhatsApp bildirim kart
- [x] Hızlı erişim alt bar (var, korundu)

## 🧪 Test Sonuçları
- pnpm tsc --noEmit: ✅
- pnpm build: ✅
- Ana sayfa HTTP 200: ✅
- 6 KPI doğru: ✅
- Trend chart: ✅
- Kesim akışı (7 aşama): ✅
- Son işlemler (gerçek veri): ✅
- KUTSAL tahsilat: ✅
- Responsive (mobile/tablet/desktop): ✅
- Sidebar entegre: ✅

## 📦 Git
- Toplam commit: X
- Push: ✅

## ⚠️ Atlanılanlar
- Kesim akışı şimdilik demo veri (gerçek modül Faz 2'de)
- (varsa diğerleri)

## 🎯 Sıradaki Adım
FAZ 7 (Hisse Atama UI veya WhatsApp toplu) için hazır.
```

---

## 🚀 BAŞLA

Otonom modda çalış. Her adımda commit at. Sorun olursa dur ve sor.

**Tahmini süre:** 4-5 saat

**Bayrama:** ~10 gün. Bu prompt biter bitmez **FAZ 7** ile devam.

**Hayırlı kodlar! 🐂✨**
