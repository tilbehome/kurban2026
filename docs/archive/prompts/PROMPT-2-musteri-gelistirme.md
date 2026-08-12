---
id: ARCH-BC93688C4126
status: ARCHIVED
owner: Historical
source_role: historical_record
source_of_truth: false
last_reviewed: not_applicable
verified_against_commit: not_applicable
---

# PROMPT 2: MÜŞTERİ LİSTE + DETAY GELİŞTİRMESİ

> Bu prompt'u **akordiyon menü prompt'u bittikten sonra** Claude Code'a ver.
> ÖNCE CLAUDE.md'yi okumasını söyle.

---

## 🎯 GÖREV

Mevcut `app/musteriler/page.tsx` listesini **gelişmiş** yap + `app/musteriler/[id]/page.tsx` müşteri detay sayfası ekle.

## ⚠️ BAŞLAMADAN ÖNCE

1. **CLAUDE.md'yi oku**
2. **Mevcut müşteri sayfasını incele:**
   ```bash
   cat app/musteriler/page.tsx
   cat modules/musteriler/module.config.ts
   ls modules/musteriler/
   cat modules/musteriler/lib/*.ts  # helper'ları gör

   # Müşteri tipi ne?
   grep -r "type Musteri" --include="*.ts"
   ```
3. **Prisma schema'da Musteri modelini oku:**
   ```bash
   cat prisma/schema.prisma | grep -A 30 "model Musteri"
   ```
4. **Git snapshot al:**
   ```bash
   git add .
   git commit -m "snapshot: müşteri sayfaları geliştirme öncesi"
   ```

5. **Bana raporla, onayımı bekle:**
   - Mevcut müşteri listesi nasıl çalışıyor?
   - Müşteri tipi (Musteri model) neler içeriyor?
   - Hangi API endpoint'leri var?

---

## 📋 İSTENEN ÖZELLİKLER

### 1. LİSTE SAYFASI GELİŞTİRMELERİ

#### Üst KPI Stat Bar (5 kart)
```
┌──────────┬──────────┬──────────┬──────────┬─────────────┐
│ TOPLAM   │ ÖDENDİ   │ KISMİ    │ BORÇLU   │ TAHSİLAT    │
│ 240      │ 78 (%33) │ 45 (%19) │ 117(%48) │ ₺1.25M (%32)│
└──────────┴──────────┴──────────┴──────────┴─────────────┘
```

**API yapısı:**
```typescript
// modules/musteriler/api/istatistik.ts
export async function musteriIstatistik() {
  // Tüm müşteriler için: toplam, ödenen, kısmi, borçlu sayısı
  // Tahsilat: toplam bedel, ödenmiş toplam, %
  return { toplam, odendi, kismi, borclu, toplamBedel, odenmis, yuzde };
}

// app/api/musteriler/istatistik/route.ts
export async function GET() {
  return NextResponse.json(await musteriIstatistik());
}
```

#### Akıllı Arama Çubuğu
- Mevcut arama varsa **geliştir**, yoksa ekle
- **Fuzzy search:** `fuse.js` ile (yoksa yükle değil, basit `includes` ile yap)
- **Ctrl+K kısayolu:** her yerden modal aç
- Arama alanları: `adSoyad`, `telefon`, `tcKimlik`, hisse no (#NN.N)
- Debounce: 200ms

#### Hızlı Filtre Tabları
```
[ Hepsi (240) ] [ Borçlu (117) ] [ Kısmi (45) ] [ Ödendi (78) ]
```
- Segmented control tarzı, shadcn `Tabs` veya custom

#### Alfabe Şeridi (Soldaki dikey)
- A-Z + Türkçe karakterler (Ç, Ğ, İ, Ö, Ş, Ü)
- Tıklayınca o harfle başlayan müşterileri filtrele
- Boş harfler **disabled** (gri, tıklanamaz)
- Aktif harf turuncu vurgulu
- URL'de query: `?harf=A`

#### Tablo Sütunları
- **Müşteri** (avatar + ad + rozetler + telefon + WhatsApp ikonu)
- **Hisse** (sayı + kurban no, örn: "2 #18.5")
- **Bedel** (toplam)
- **Ödenen** (yeşil)
- **Kalan** (kırmızı varsa)
- **Durum** (Ödendi/Kısmi/Borçlu rozet)
- **İşlem** (Hızlı ödeme ikonu + Detay buton)

#### Avatar
- İlk harflerden oluşur (örn: "Ahmet Yılmaz" → "AY")
- Renk: müşteri ID'sine göre tutarlı (hash → renk paleti)
- Boyut: 28px × 28px daire

**Renk paleti (6 ton):**
```typescript
const avatarRenkleri = [
  { bg: 'from-red-100 to-red-200', text: 'text-red-900' },
  { bg: 'from-blue-100 to-blue-200', text: 'text-blue-900' },
  { bg: 'from-green-100 to-green-200', text: 'text-green-900' },
  { bg: 'from-amber-100 to-amber-200', text: 'text-amber-900' },
  { bg: 'from-purple-100 to-purple-200', text: 'text-purple-900' },
  { bg: 'from-cyan-100 to-cyan-200', text: 'text-cyan-900' },
];

function avatarRenk(musteriId: number) {
  return avatarRenkleri[musteriId % 6];
}
```

#### Rozetler (Satır içinde, ad soyad yanında)
- 🔴 **Telefon yok** — telefonsuz müşteriler için
- 🟡 **Tekrarlı isim** — duplikasyon (aynı isimde 2+ kişi varsa)
- 🟠 **VIP** — manuel etiket
- 🟢 **N. yıl** — eski müşteri (kayıt tarihinden hesaplanır)

#### Hızlı İşlem Butonları (her satırın sağında)
- 💵 **Hızlı ödeme** ikonu → modal açar, sayfa içinde ödeme alır
- **Detay** butonu → `/musteriler/[id]` sayfasına gider

#### Toplu Seçim
- Sol başta **checkbox**
- Seçilince üstte **sarı uyarı bar** çıkar:
  - "N müşteri seçili"
  - WhatsApp Gönder / Yazdır / Etiketle
  - Seçimi temizle

#### Sayfalama
- Alt başta: "X-Y / Z müşteri"
- Sayfa numaraları (1, 2, ...)
- Her sayfada 50 müşteri (veya 100, ayar yap)

### 2. MÜŞTERİ DETAY SAYFASI (Yeni)

`app/musteriler/[id]/page.tsx`

#### Üst Müşteri Kartı
```
┌────────────────────────────────────────────────────────────┐
│ [Avatar GÇ]  Gürkan Çelik  [VIP] [3. yıl] [Çoklu Hisse]  │
│              📞 0535... · TC 123****901 · 📍 Serdivan      │
│              [WhatsApp] [Ara] [SMS] [Etiketle]            │
│                                                            │
│ ┌────────────────┐                                         │
│ │ KALAN BORÇ     │  200.000 toplam · 20.000 ödendi       │
│ │ ₺180.000       │  ━━━━━━━━━━━━━━━━━━━━━━━━ %10 tahsil  │
│ └────────────────┘                                         │
└────────────────────────────────────────────────────────────┘
```

#### Tab Bar
- Genel Bakış (default)
- Hisseler (X)
- Ödemeler (Y)
- Ekstre
- Notlar
- Hareketler

#### Hisseler Kartı (Genel Bakış'ta)
- Grid (4 kart yan yana, mobile'da stack)
- Her hisse: Kurban no + hisse no, bedel, ödenen, kalan, durum rozeti
- "Hisse Ekle" butonu sağ üstte

#### Son Ödemeler Tablosu
- Tarih · Dekont No · Hisse · Tutar · Yöntem · İşlem (indir/yazdır)
- Max 5 satır, "Tümünü Gör →" linki

#### Sağ Panel - Hızlı Ödeme Formu (Sticky)
```
┌──────────────────────┐
│ 💰 Hızlı Ödeme Al    │
│                       │
│ Nakit:    [ 0      ] │
│ Havale:   [ 50.000 ] │
│ Kart:     [ 0      ] │
│                       │
│ ┌─────────────────┐  │
│ │ Toplam: ₺50.000 │  │
│ │ ℹ 4 hisseye eşit│  │
│ └─────────────────┘  │
│                       │
│ [Kalan: ₺180K]       │
│ [Yarısı: ₺90K]       │
│                       │
│ Dağıtım: [Eşit ▼]    │
│                       │
│ [✓ Ödemeyi Al ve     │
│   Dekont Bas]        │
│                       │
│ Klavye: [Enter]      │
└──────────────────────┘
```

**Davranış:**
- Sticky (sayfa kaydırılınca da görünür)
- 3 input: nakit/havale/kart
- Toplam otomatik hesaplanır
- "Kalan: ₺180K" butonu → input'ları doldur
- "Yarısı: ₺90K" → yarısını doldur
- Dağıtım dropdown: Eşit / Sırayla / Manuel
- **Enter** tuşu → ödeme onayla
- Mevcut tahsilat API'sini kullan (`/api/tahsilat/odeme`)

#### Hızlı İşlemler Kartı (Sağ panel altında)
- Hesap Ekstresi (PDF indir)
- WhatsApp Hatırlatma (template mesaj aç)
- Yazdır (müşteri bilgileri)
- Bildir (note ekle, takip için)

---

## 🔧 KOD YAPISI

### Dosyalar

```
modules/musteriler/
├── module.config.ts (mevcut)
├── api/
│   ├── liste.ts (mevcut, geliştir)
│   ├── istatistik.ts (YENİ)
│   ├── detay.ts (YENİ)
│   ├── duplikasyon-kontrol.ts (YENİ)
│   └── etiket.ts (YENİ)
├── components/
│   ├── MusteriAvatar.tsx (YENİ)
│   ├── MusteriArama.tsx (YENİ)
│   ├── AlfabeSeridi.tsx (YENİ)
│   ├── MusteriRozetler.tsx (YENİ)
│   ├── StatBar.tsx (YENİ)
│   ├── HizliOdemePanel.tsx (YENİ)
│   ├── HisselerKart.tsx (YENİ)
│   └── SonOdemelerTablo.tsx (YENİ)
└── lib/
    ├── avatar.ts (renk hash, ilk harfler)
    └── musteri.helpers.ts

app/musteriler/
├── page.tsx (geliştir)
├── [id]/
│   └── page.tsx (YENİ - detay sayfası)
└── api/
    ├── istatistik/route.ts (YENİ)
    └── [id]/route.ts (YENİ)
```

---

## 📊 PRISMA QUERY ÖRNEKLERİ

### Liste için (akıllı sayfalama)
```typescript
const musteriler = await prisma.musteri.findMany({
  where: {
    AND: [
      // Arama
      arama ? {
        OR: [
          { adSoyad: { contains: arama } },
          { telefon: { contains: arama } },
          { tcKimlik: { contains: arama } },
        ]
      } : {},
      // Alfabe filtresi
      harf ? { adSoyad: { startsWith: harf } } : {},
      // Durum filtresi (borçlu, kısmi, ödendi)
      durum ? buildDurumFilter(durum) : {},
    ]
  },
  include: {
    hisseler: {
      include: {
        kurban: { select: { kesimSirasi: true } },
        odemeler: { where: { iptal: false } }
      }
    }
  },
  orderBy: { adSoyad: 'asc' },
  take: pageSize,
  skip: (page - 1) * pageSize,
});

// Her müşteri için hesapla
const enriched = musteriler.map(m => {
  const toplamBedel = m.hisseler.reduce((s, h) => s + h.hisseFiyati, 0);
  const odenmis = m.hisseler.flatMap(h => h.odemeler).reduce((s, o) => s + o.toplamTutar, 0);
  const kalan = toplamBedel - odenmis;

  const durum = kalan <= 0 ? 'odendi' : (odenmis > 0 ? 'kismi' : 'borclu');

  return { ...m, toplamBedel, odenmis, kalan, durum };
});
```

### İstatistik için
```typescript
const tum = await prisma.musteri.findMany({
  include: { hisseler: { include: { odemeler: { where: { iptal: false }}}}}
});

const stats = tum.reduce((acc, m) => {
  const toplamBedel = m.hisseler.reduce((s, h) => s + h.hisseFiyati, 0);
  const odenmis = m.hisseler.flatMap(h => h.odemeler).reduce((s, o) => s + o.toplamTutar, 0);
  const kalan = toplamBedel - odenmis;

  acc.toplam++;
  acc.toplamBedel += toplamBedel;
  acc.toplamOdenmis += odenmis;

  if (kalan <= 0 && toplamBedel > 0) acc.odendi++;
  else if (odenmis > 0) acc.kismi++;
  else if (toplamBedel > 0) acc.borclu++;

  return acc;
}, { toplam: 0, odendi: 0, kismi: 0, borclu: 0, toplamBedel: 0, toplamOdenmis: 0 });

stats.yuzde = stats.toplamBedel > 0 ? Math.round((stats.toplamOdenmis / stats.toplamBedel) * 100) : 0;
```

### Duplikasyon kontrolü
```typescript
// modules/musteriler/api/duplikasyon-kontrol.ts
export async function duplikasyonKontrol(adSoyad: string) {
  const benzerler = await prisma.musteri.count({
    where: { adSoyad: { contains: adSoyad.split(' ')[0] } }
  });
  return benzerler > 1;
}
```

---

## 🎨 TASARIM DİLİ

- **Renkler:** Mevcut Tilbe Orange (#ea580c)
- **Avatar:** Yumuşak gradient (red/blue/green/amber/purple/cyan 100→200 + 900 text)
- **Rozet renkleri:**
  - Telefon yok: kırmızı (red-100/700)
  - Tekrarlı isim: turuncu (orange-100/800)
  - VIP: amber (amber-100/800)
  - N. yıl: yeşil (green-100/700)
- **Aktif vurgu:** Primary (turuncu) tonları
- **Spacing:** Mevcut tasarımla uyumlu

---

## 🧪 TEST

```bash
# 1. TypeScript
pnpm tsc --noEmit

# 2. Build
pnpm build

# 3. Mevcut akışlar bozulmadı mı?
# - /musteriler → liste açılıyor ✅
# - /tahsilat → ödeme alabilir ✅ (KRİTİK)

# 4. Yeni özellikler çalışıyor mu?
# - Stat bar görünüyor
# - Akıllı arama çalışıyor
# - Ctrl+K çalışıyor
# - Alfabe şeridi tıklanıyor, filtreliyor
# - Avatar'lar farklı renklerde
# - Telefonsuz rozet görünüyor
# - Müşteri detay sayfası açılıyor
# - Detay sayfasında ödeme alabiliyorum
# - Dekont basılıyor

# 5. Performans
# - 240 müşteride hızlı yükleniyor mu?
# - Sayfalama çalışıyor mu?
```

---

## 📊 TAMAMLAMA RAPORU

```markdown
✅ TAMAMLANDI:
- Liste sayfası geliştirildi
- Stat bar eklendi (5 KPI)
- Akıllı arama + Ctrl+K
- Alfabe filtreleme
- Avatar sistemi (hash-based renk)
- Rozet sistemi (telefon yok, tekrarlı isim, VIP, yıl)
- Toplu seçim + işlem barı
- Detay sayfası tam çalışıyor
- Hızlı ödeme paneli (sticky)
- Hisse kartları
- Son ödemeler tablosu

🧪 TEST SONUÇLARI:
- TypeScript: ✅
- Build: ✅
- /musteriler: ✅
- /musteriler/[id]: ✅
- Tahsilat akışı (test): ✅
- Akordiyon menü hala çalışıyor: ✅

📁 YENİ DOSYALAR:
- app/musteriler/[id]/page.tsx
- modules/musteriler/components/MusteriAvatar.tsx
- modules/musteriler/components/HizliOdemePanel.tsx
- (vs.)

📊 PERFORMANS:
- 240 müşteri yükleme: Xms
- Sayfa render: Yms
- Arama tepkisi: Zms

⚠️ DİKKAT:
- (varsa not düş)
```

---

## 🚫 YAPMA

- Tahsilat API'sini değiştirme
- Yeni paket yükleme (fuse.js gibi ek paketler isteme önce sor)
- Schema'ya yeni model ekleme
- Mevcut müşteri tipini değiştirme

## ✅ YAP

- Mevcut müşteri API'lerini koru, üzerine ek API'ler ekle
- Component'leri `modules/musteriler/components/` altına koy
- shadcn/ui kullan
- Türkçe metin
- Mobile-first
- Performansa dikkat (gereksiz re-render önle)

---

## 🎬 BAŞLAT

1. CLAUDE.md'yi oku
2. Mevcut müşteri yapısını tara, rapor ver
3. **ONAYIMI BEKLE**
4. Adım adım uygula:
   - Önce: API'ler (istatistik, duplikasyon kontrol)
   - Sonra: Component'ler (Avatar, Stat bar, Arama)
   - Sonra: Liste sayfası geliştirmeleri
   - Sonra: Detay sayfası
   - Son: Test

**Başla:** Önce mevcut müşteri yapısını tara ve raporla.
