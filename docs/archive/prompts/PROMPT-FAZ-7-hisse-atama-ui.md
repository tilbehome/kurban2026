---
id: ARCH-7AFB3BFE4A43
status: ARCHIVED
owner: Historical
source_role: historical_record
source_of_truth: false
last_reviewed: not_applicable
verified_against_commit: not_applicable
---

# PROMPT-FAZ-7: HİSSE ATAMA UI (Drag-Drop + Stable Görünümü)

> **Claude Code'a ver. Otonom modda çalıştır. Her adımda commit at.**

---

## 🎯 AMAÇ

Mevcut "Hisse Atama" sayfası boş/placeholder. Bunu **profesyonel ve yenilikçi** bir UI ile değiştir:

1. **Stable/Ahır görünümü** — Her kurban için kart, 7 hisse kutusu yan yana
2. **Drag-drop ile atama** — Müşteri sürükle, hisseye bırak
3. **Hızlı atama modu** — Tıkla, ata
4. **Görsel durum** — Doluluk yüzdesi, renk kodları
5. **Bayram için optimize** — Hızlı, hatasız atama

**Vizyon:** Rakiplerden farklı, **görsel**, **akılda kalıcı**. Burhan ve müşterilere gösterildiğinde "Vay be!" dedirtecek.

---

## ⚠️ KORUNACAKLAR

**KESİNLİKLE BOZMA:**
- ✅ KUTSAL tahsilat akışı
- ✅ Müşteri detay tab sistemi (FAZ 4)
- ✅ Sidebar 12 menü (FAZ 5)
- ✅ Dashboard (FAZ 6)
- ✅ Mevcut hisse atama API'leri (eğer varsa)
- ✅ Audit log + granular izinler
- ✅ Soft delete
- ✅ MIMARI.md uyumu

---

## 📋 ŞU ANKİ DURUM

`/kurbanlar/hisse-atama` sayfası placeholder.

**Backend Hazır:**
- ✅ `POST /api/hisseler/ata` (Faz 1.5'te eklenmişti)
- ✅ `GET /api/hisseler/bos-kurbanlar` (Faz 4'te eklenmişti)
- ✅ `POST /api/hisseler/[id]/iptal` (Faz 4'te eklenmişti)

**Eksik:**
- ❌ Görsel Stable UI
- ❌ Drag-drop interaksiyonu
- ❌ Müşteri arama paneli
- ❌ Toplu atama
- ❌ Detaylı atama bilgisi (fiyat + tarih + not)

---

## 🎨 HEDEF UI

### Layout: 3 Sütun

```
┌─────────────────────────────────────────────────────────────────────┐
│ ÜST: Sayfa başlığı + filtreler + view toggle (Stable/Liste)         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────┐  ┌────────────────────────────┐  ┌───────────┐  │
│  │  SOL PANEL       │  │   ORTA: STABLE GRID          │  │ SAĞ      │  │
│  │  Müşteri Ara     │  │                              │  │ Atama    │  │
│  │  ─────────────   │  │   🐂 DANA-001  [████████░]   │  │ Özeti    │  │
│  │  Arama input     │  │   ┌─┬─┬─┬─┬─┬─┬─┐            │  │          │  │
│  │  Filtre (durum)  │  │   │M│A│✓│F│✓│?│?│            │  │ Seçili:  │  │
│  │  ─────────────   │  │   └─┴─┴─┴─┴─┴─┴─┘            │  │ Mehmet Y │  │
│  │                  │  │   5/7 dolu                    │  │          │  │
│  │  [MY] Mehmet     │  │                               │  │ Hedef:   │  │
│  │  Eksik: 2 hisse  │  │   🐂 DANA-002  [██████░░░░]   │  │ DANA-001 │  │
│  │                  │  │   ┌─┬─┬─┬─┬─┬─┬─┐            │  │ Hisse 3  │  │
│  │  [AD] Ahmet D    │  │   │A│✓│?│?│?│?│?│            │  │          │  │
│  │  Eksik: 1 hisse  │  │   └─┴─┴─┴─┴─┴─┴─┘            │  │ Fiyat:   │  │
│  │                  │  │   2/7 dolu                    │  │ 7.000₺   │  │
│  │  [HK] Hasan K    │  │                               │  │          │  │
│  │  Eksik: 3 hisse  │  │   🐂 DANA-003  [██████████]   │  │ [Onayla] │  │
│  │                  │  │   ┌─┬─┬─┬─┬─┬─┬─┐            │  │          │  │
│  │  ...             │  │   │M│A│H│F│G│Z│V│  ✅ TAM   │  │          │  │
│  │                  │  │   └─┴─┴─┴─┴─┴─┴─┘            │  │ TOPLAM:  │  │
│  │  Toplam: 48      │  │   7/7 dolu                    │  │ 0 atama  │  │
│  │  Atanan: 12      │  │                               │  │          │  │
│  │  Bekleyen: 36    │  │   🐂 DANA-004  [░░░░░░░░░░]   │  │          │  │
│  │                  │  │   ┌─┬─┬─┬─┬─┬─┬─┐            │  │          │  │
│  │                  │  │   │?│?│?│?│?│?│?│            │  │          │  │
│  │                  │  │   └─┴─┴─┴─┴─┴─┴─┘            │  │          │  │
│  │                  │  │   0/7 dolu                    │  │          │  │
│  │                  │  │                               │  │          │  │
│  └─────────────────┘  └────────────────────────────┘  └───────────┘  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 BİLEŞEN DETAYLARI

### 1️⃣ ÜST: Sayfa Başlığı + Kontroller

**Sol:**
- Sayfa başlığı: "Hisse Atama"
- Alt yazı: "Müşterileri hisselere atayın - Bayram operasyonu için kritik"

**Sağ:**
- 🟢 **+ Yeni Kurban Ekle** (CTA buton)
- 📊 **Excel İçe Aktar** (toplu atama için)
- 🎨 **View Toggle**:
  - 🏠 **Stable Görünümü** (default - görsel)
  - 📋 **Liste Görünümü** (tablo)
  - 🎯 **Hızlı Mod** (klavye odaklı)

**Üst KPI Şeridi (4 mini kart):**
- 🐂 **Toplam Kurban:** 63 (Hisse: 414)
- ✅ **Dolu Hisseler:** 252 (%61)
- ⭕ **Boş Hisseler:** 162
- ⚠️ **Eksik Müşteriler:** 48 (hisseye ihtiyaç var)

### 2️⃣ SOL PANEL: Müşteri Arama

**Genişlik:** 280px (sabit)

**Üst:**
- Arama input: 🔍 "Müşteri ara (Ctrl+F)"
- Filtre dropdown:
  - Tümü
  - Eksik hisseli olanlar
  - Tam atanmışlar
  - Bu sezon yeni
- Sıralama: Ad / Eksik hisse sayısı / Son atama tarihi

**Müşteri Listesi (Sürüklenebilir):**
```
┌─────────────────────────┐
│ [MY] Mehmet Yılmaz       │
│ ⭐ VIP                    │
│ Eksik: 2 hisse            │
│ Atanan: 1 (DANA-001)     │
│ Tutar: 7.000 ₺            │
└─────────────────────────┘
```

**Her Müşteri Kartı:**
- Sol: Avatar (gradient, ID-bazlı)
- İsim + etiket rozeti (VIP, Düzenli, Yeni)
- Eksik hisse sayısı (turuncu badge)
- Atanmış hisse sayısı + dana no'lar
- Toplam ödenmesi gereken tutar
- Sürüklenebilir (drag handle ikon)
- Hover: hafif vurgu
- Aktif/seçili: turuncu border

**Davranış:**
- **Tıkla:** Müşteri seçilir, sağ panel açılır
- **Sürükle:** Drag preview ile hisse kutusuna bırakılır
- **Çift tıkla:** Müşteri detay sayfasına git

**Alt:**
- Sayfalama veya virtual scroll (240 müşteri için)
- Toplam: X müşteri / Atanan: Y / Bekleyen: Z

### 3️⃣ ORTA: STABLE GRID (Ana Alan)

**Grid:** `grid-cols-1 lg:grid-cols-2 xl:grid-cols-3` (responsive)

**Her Kurban Kartı:**

```
┌──────────────────────────────────────┐
│ 🐂 DANA-001                          │  ← Üst başlık
│ Küpe: K-01582 | 420 kg | Büyükbaş     │  ← Detaylar
│                                       │
│ [██████░░] %75 dolu                  │  ← İlerleme barı
│                                       │
│ ┌────┬────┬────┬────┬────┬────┬────┐ │
│ │ MY │ AD │ ✓  │ FŞ │ ✓  │  ?  │  ? │ │  ← 7 hisse kutusu
│ │ Mh │ Ah │    │ Ft │    │     │    │ │
│ └────┴────┴────┴────┴────┴────┴────┘ │
│                                       │
│ 5/7 atandı · Hisse: 7.000 ₺           │
│                                       │
│ [Detay] [Durum: Kesime Hazır 🟢]     │
└──────────────────────────────────────┘
```

#### Hisse Kutusu Tasarımı (Drop Zone)

**Boş Hisse:**
- Kesik çizgi border (`border-dashed border-stone-300`)
- İçinde: "?" veya "+"
- Background: `bg-stone-50`
- Drop'a uygun (drop target)
- Hover (drag esnasında): turuncu border, parıltı

**Dolu Hisse:**
- Düz border (`border-solid`)
- İçinde: Müşteri avatar mini + ilk harfler
- Tooltip (hover): "Mehmet Yılmaz - 7.000 ₺"
- Sağ üstte: ✓ küçük ikon (ödeme durumu yeşil/sarı/kırmızı)
- Sağ tık menüsü: "İptal Et", "Transfer Et", "Detayını Gör"

**Onaylı (Ödenmiş):**
- Yeşil border + check ikonu
- Background: hafif yeşil

**Renk Kodları (Doluluk):**
- Boş: gri
- 1-3 dolu: turuncu
- 4-6 dolu: mavi
- 7 (tam): yeşil
- ✅ Kesime hazır: yeşil + crown ikon

#### Kurban Durumu Rozetleri
- 🟢 **Kesime Hazır** (yeşil)
- 🟡 **Beklemede** (sarı)
- 🔴 **Sorunlu** (kırmızı, veteriner notu varsa)
- 🔵 **Kesimde** (mavi, bayram günü)
- ⚪ **Tamamlandı** (gri, kesim sonrası)

### 4️⃣ SAĞ PANEL: Atama Sticky Panel

**Genişlik:** 280px (sabit)

**Durum 1: Henüz Seçim Yok**
```
┌──────────────────────┐
│ ATAMA PANELİ         │
│ ──────────────────  │
│                      │
│ 👉 Bir müşteri seçin │
│ veya hisseye         │
│ sürükleyin           │
│                      │
│ KISAYOLLAR:          │
│ Ctrl+F: Müşteri ara  │
│ Ctrl+E: Hızlı mod    │
│ Esc: Seçimi iptal    │
└──────────────────────┘
```

**Durum 2: Müşteri Seçildi**
```
┌──────────────────────┐
│ ATAMA PANELİ         │
│ ──────────────────  │
│                      │
│ Seçili Müşteri:      │
│ [MY] Mehmet Yılmaz   │
│ ⭐ VIP                │
│                      │
│ Eksik: 2 hisse       │
│                      │
│ HEDEFLENEN HİSSE:    │
│ (hisse seçilmedi)    │
│                      │
│ 👉 Bir hisse kutusuna │
│ tıklayın veya         │
│ sürükleyin            │
│                      │
│ [İptal]               │
└──────────────────────┘
```

**Durum 3: Hisse de Seçildi**
```
┌──────────────────────┐
│ ATAMA PANELİ         │
│ ──────────────────  │
│                      │
│ Müşteri:             │
│ Mehmet Yılmaz ⭐VIP   │
│                      │
│ Hedef:               │
│ DANA-001 / Hisse 3   │
│                      │
│ Fiyat:                │
│ [_______7.000_]  ₺   │
│                      │
│ Atama Tarihi:        │
│ [24.05.2026]         │
│                      │
│ Not (ops):            │
│ [_______________]    │
│                      │
│ [Atamayı Onayla] 🟢   │
│ [İptal]               │
└──────────────────────┘
```

**Davranış:**
- Sticky (scroll'da bile görünür)
- Form validation
- "Atamayı Onayla" → POST /api/hisseler/ata
- Toast bildirim (success/error)
- Audit log kaydı
- Liste güncellenir (stale-while-revalidate)

### 5️⃣ TOPLU ATAMA MODU

**Hızlı Mod Toggle:**
Sayfa üstünden "🎯 Hızlı Mod" seçilirse:
- Sol panelde müşteri çoklu seçim (checkbox)
- Sürükle-bırak yerine **klavye:** Tab → Enter → bir sonraki müşteri
- Otomatik fiyat (varsayılan)
- Toplu onay butonu

### 6️⃣ LİSTE GÖRÜNÜMÜ (Alternatif)

**Tablo:**
| Müşteri | Eksik | Dana | Hisse | Fiyat | İşlem |
|---------|-------|------|-------|-------|-------|
| Mehmet Yılmaz | 2 | - | - | - | [Ata] |
| Ahmet Demir | 1 | DANA-001 | 2 | 7000 | [İptal] |

- Filtreleme, sıralama, sayfalama
- Toplu seçim (checkbox)
- Excel'e dışa aktar

---

## 🗂️ DOSYA YAPISI

### Yeni Component'lar

```
modules/hayvanlar/
├── components/
│   └── hisse-atama/                    ← Tüm yeni component'lar
│       ├── HisseAtamaLayout.tsx        ← Ana layout (3 sütun)
│       ├── HisseAtamaUst.tsx           ← Üst başlık + KPI
│       ├── MusteriAramaPanel.tsx       ← Sol panel
│       ├── MusteriAramaKart.tsx        ← Sürüklenebilir kart
│       ├── StableGrid.tsx              ← Orta grid
│       ├── KurbanKart.tsx              ← Her kurban kartı
│       ├── HisseKutusu.tsx             ← Drop zone (boş/dolu/onaylı)
│       ├── AtamaPanel.tsx              ← Sağ sticky panel
│       ├── ListeGorunumu.tsx           ← Alternatif tablo
│       └── HizliModPanel.tsx           ← Klavye odaklı mod
├── hooks/
│   ├── useHisseAtama.ts                ← Atama state'i
│   └── useDragDrop.ts                  ← Drag-drop logic
├── lib/
│   └── hisse-atama.service.ts          ← Veri çekme
└── types/
    └── hisse-atama.ts                  ← Tipler
```

### Yeni API'ler (Mevcutları Genişlet)

```
app/api/hisseler/
├── ata/route.ts                         ← POST (var, geliştir)
├── toplu-ata/route.ts                   ← POST (yeni, batch)
├── bos-kurbanlar/route.ts               ← GET (var)
├── [id]/iptal/route.ts                  ← POST (var)
├── [id]/transfer/route.ts               ← POST (yeni)
└── atama-istatistik/route.ts            ← GET (yeni, KPI)

app/api/musteriler/
└── eksik-hisseli/route.ts               ← GET (yeni, atama için)
```

### Refactor

```
app/kurbanlar/hisse-atama/page.tsx       ← Ana sayfa refactor
```

---

## 🔧 DRAG-DROP STRATEJİSİ

### Kütüphane Seçimi
**Önerilen:** Native HTML5 Drag-Drop API + React state

**Neden Library Yok?**
- ✅ Bundle hafif (recharts kararını izle)
- ✅ Custom kontrol
- ✅ Touch desteği için extra logic eklenebilir
- ✅ `react-dnd` veya `@dnd-kit` overkill

### Implementation

```typescript
// MusteriAramaKart.tsx
function MusteriAramaKart({ musteri }) {
  const handleDragStart = (e: DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      tip: 'musteri',
      id: musteri.id,
      adSoyad: musteri.adSoyad,
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div draggable onDragStart={handleDragStart}>
      ...
    </div>
  );
}

// HisseKutusu.tsx
function HisseKutusu({ kurbanId, hisseNo, mevcutMusteri }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (!mevcutMusteri) {  // Sadece boş hisseye bırakılabilir
      e.dataTransfer.dropEffect = 'copy';
      setDragOver(true);
    }
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const data = JSON.parse(e.dataTransfer.getData('application/json'));
    if (data.tip !== 'musteri') return;

    // Sağ panele yansıt, onay bekle
    setAtamaPaneliState({
      musteriId: data.id,
      hisseNo,
      kurbanId,
    });
  };

  return (
    <div
      className={cn(
        'hisse-kutusu',
        dragOver && 'border-orange-500 bg-orange-50 ring-2 ring-orange-300'
      )}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      ...
    </div>
  );
}
```

### Touch Support (Mobile için)
- Native drag-drop mobile'da kısıtlı
- **Alternatif:** Tıkla → seç → tıkla → ata (long-press detection)
- Veya `react-aria` touch hooks

### Visual Feedback
- Drag esnasında: Müşteri kartı yarı saydam
- Geçerli drop zone: Turuncu vurgu + parıltı animasyon
- Geçersiz drop zone: Kırmızı vurgu (örn. dolu hisse)
- Drop başarılı: Confetti animasyon (sonner toast)

---

## 🎯 UYGULAMA SIRASI (10 ADIM)

### ADIM 1: Tipler + Service Skeleton
1. `modules/hayvanlar/types/hisse-atama.ts`
2. `modules/hayvanlar/lib/hisse-atama.service.ts`
3. API skeleton'ları

**Commit:** `feat(hisse-atama): tipler ve service iskeleti`

### ADIM 2: Üst Başlık + KPI
1. `HisseAtamaUst.tsx`
2. 4 mini KPI kart
3. View toggle butonları
4. API: `/api/hisseler/atama-istatistik`

**Commit:** `feat(hisse-atama): ust baslik ve kpi eklendi`

### ADIM 3: Sol Panel (Müşteri Arama)
1. `MusteriAramaPanel.tsx`
2. `MusteriAramaKart.tsx` (sürüklenebilir)
3. Arama + filtre + sıralama
4. API: `/api/musteriler/eksik-hisseli`

**Commit:** `feat(hisse-atama): musteri arama paneli eklendi`

### ADIM 4: Stable Grid + Kurban Kartları
1. `StableGrid.tsx`
2. `KurbanKart.tsx`
3. 7 hisse kutusu placeholder
4. İlerleme barı

**Commit:** `feat(hisse-atama): stable grid ve kurban kartlari eklendi`

### ADIM 5: Hisse Kutusu (Drop Zone) ⭐
1. `HisseKutusu.tsx`
2. Boş/Dolu/Onaylı durumları
3. Drop zone behavior
4. Tooltip (mevcut müşteri)
5. Sağ tık menüsü

**Commit:** `feat(hisse-atama): hisse kutusu drop zone eklendi`

### ADIM 6: Drag-Drop Logic ⭐
1. `useDragDrop.ts` hook
2. HTML5 drag-drop entegrasyonu
3. Visual feedback (turuncu vurgu)
4. Touch support (basit)

**Commit:** `feat(hisse-atama): drag-drop logic eklendi`

### ADIM 7: Atama Sağ Panel ⭐
1. `AtamaPanel.tsx`
2. 3 durum (boş/müşteri/hisse+müşteri)
3. Fiyat input, tarih, not
4. "Atamayı Onayla" → API çağrısı
5. Toast bildirim + liste güncellenmesi

**Commit:** `feat(hisse-atama): atama paneli eklendi`

### ADIM 8: Liste Görünümü (Alternatif)
1. `ListeGorunumu.tsx`
2. Tablo (filtre + sıralama + sayfalama)
3. Toplu seçim
4. Excel export

**Commit:** `feat(hisse-atama): liste gorunumu eklendi`

### ADIM 9: Hızlı Mod + Klavye Kısayolları
1. `HizliModPanel.tsx`
2. Klavye navigasyon (Tab, Enter, Esc, F2)
3. Toplu atama
4. API: `/api/hisseler/toplu-ata` (batch)

**Commit:** `feat(hisse-atama): hizli mod ve klavye kisayollari`

### ADIM 10: Layout + Test + Polish
1. `HisseAtamaLayout.tsx` (3 sütun)
2. `app/kurbanlar/hisse-atama/page.tsx` refactor
3. Test:
   - `pnpm tsc --noEmit`
   - `pnpm build`
   - Drag-drop davranışı
   - KUTSAL tahsilat
   - Audit log
4. Responsive (mobile fallback liste görünümü)

**Commit:** `test(hisse-atama): faz 7 dogrulandi`

### Final: Push
```bash
git push origin main
```

---

## ✅ TEST CHECKLİSTİ

### Temel
- [ ] `pnpm tsc --noEmit` temiz
- [ ] `pnpm build` başarılı
- [ ] `/kurbanlar/hisse-atama` HTTP 200

### UI Bileşenleri
- [ ] Üst başlık + 4 KPI gösteriliyor
- [ ] Sol panel müşteri listesi
- [ ] Stable grid kurban kartları
- [ ] 7 hisse kutusu her kurbanda
- [ ] Sağ atama paneli sticky
- [ ] View toggle (Stable/Liste/Hızlı) çalışıyor

### Davranış
- [ ] Müşteri sürüklenebiliyor
- [ ] Hisse kutusu drop zone vurgulu
- [ ] Drop sonrası sağ panel açılıyor
- [ ] Fiyat, tarih, not girilebiliyor
- [ ] "Atamayı Onayla" çalışıyor
- [ ] Audit log'a kaydoluyor
- [ ] Toast bildirim
- [ ] Liste güncelleniyor

### Hızlı Mod
- [ ] Klavye ile gezinme (Tab/Enter/Esc)
- [ ] Çoklu seçim (checkbox)
- [ ] Toplu atama API

### İptal/Transfer
- [ ] Dolu hisse sağ tık menüsü
- [ ] "İptal Et" çalışıyor
- [ ] "Transfer Et" (başka müşteriye)
- [ ] Onay modal

### Veri Doğruluğu
- [ ] Atanan hisse müşteri detayında görünür
- [ ] KPI sayıları güncelleniyor
- [ ] Müşteri arama panelinden çıkar (eğer tüm hisseleri tam)
- [ ] Hatasız: aynı hisseye 2 atama yapılamaz

### Mevcut Sistem
- [ ] **KUTSAL tahsilat** çalışıyor
- [ ] Müşteri detay tab (FAZ 4)
- [ ] Sidebar (FAZ 5)
- [ ] Dashboard (FAZ 6)
- [ ] Tüm placeholder sayfalar

---

## ⚠️ ÖNEMLİ NOTLAR

### 1. Müşteri Listesi Performans
240 müşteri var. Liste:
- **Virtual scroll** (react-window benzeri) — VEYA
- **Sayfalama** (20'şer)
- **Arama** ile hızlı filtre

### 2. Drag-Drop Sınırlamaları
- Sadece **boş hisseye** bırakılabilir
- Aynı kurbana **aynı müşteri 2 kez** atanamaz (varsayılan kural, opsiyonel kaldır)
- Müşterinin **eksik hisse sayısı 0** ise listeden çıkar

### 3. Mobile Strateji
- Desktop: Drag-drop
- Tablet: Drag-drop (touch)
- Mobile: **Liste görünümü** zorla, drag-drop devre dışı
- Mobile'da: müşteriye tıkla → hisseye tıkla → onayla

### 4. Renk Paleti (TASARIM-BRIEF uyumlu)
```typescript
const RENKLER = {
  bos: 'bg-stone-50 border-stone-300 border-dashed',
  dolu: 'bg-orange-100 border-orange-400',
  onayli: 'bg-green-100 border-green-500',
  drag_over: 'ring-2 ring-orange-500 bg-orange-50',
  dolu_kurban: 'bg-green-50 border-green-300',  // 7/7
  yarim_kurban: 'bg-amber-50 border-amber-300', // 1-6
  bos_kurban: 'bg-stone-50 border-stone-200',   // 0/7
};
```

### 5. Audit Log
Her atama:
```typescript
await auditLog({
  eylem: 'hisse_atama',
  model: 'Hisse',
  kayitId: hisseId,
  kullaniciId: session.userId,
  detaylar: {
    musteriId,
    kurbanId,
    hisseNo,
    fiyat,
    not,
  },
});
```

### 6. Yetki Kontrolü
- `hisseler.atama` izni gerekir
- İzleyici: sadece görüntüleme (drag-drop devre dışı)
- Kasiyer: atama yapabilir
- Admin: hepsi (transfer + iptal dahil)

### 7. Toast Bildirim Mesajları
- ✅ "Mehmet Yılmaz, DANA-001 Hisse 3'e atandı"
- ❌ "Bu hisse zaten dolu"
- ❌ "Aynı müşteri bu kurbana 2. kez atanamaz"
- ⚠️ "Müşterinin bekleyen hissesi yok"

---

## 📊 RAPOR ŞABLONU (Tamamlandığında)

```markdown
# FAZ 7 TAMAMLANDI — Hisse Atama UI

## ✅ Tamamlanan
- [x] 3 sütun layout (sol panel + stable grid + sağ panel)
- [x] Stable grid (kurban kartları + 7 hisse kutusu)
- [x] Drag-drop (HTML5 native)
- [x] Atama panel (3 durum)
- [x] Müşteri arama paneli
- [x] Liste görünümü (alternatif)
- [x] Hızlı mod (klavye)
- [x] Toplu atama API
- [x] İptal/Transfer

## 🧪 Test Sonuçları
- pnpm tsc --noEmit: ✅
- pnpm build: ✅
- Drag-drop: ✅
- Atama akışı: ✅
- KUTSAL tahsilat: ✅
- Audit log: ✅
- Responsive: ✅

## 📦 Git
- Toplam commit: X
- Push: ✅

## ⚠️ Atlanılanlar
- (varsa)

## 🎯 Sıradaki Adım
FAZ 8 (WhatsApp Toplu) için hazır.
```

---

## 🚀 BAŞLA

Otonom modda çalış. Her adımda commit at. Sorun olursa dur ve sor.

**Tahmini süre:** 5-6 saat

**Bayrama:** ~10 gün. Bu prompt biter bitmez **FAZ 8** ile devam.

**Hayırlı kodlar! 🐂✨**
