# PROMPT-FAZ-4: MÜŞTERİ DETAY TAB SİSTEMİ

> **Claude Code'a ver. Sırayla uygula. Her tab tamamlandığında commit at.**

---

## 🎯 AMAÇ

Mevcut `/musteriler/[id]` sayfası tek sayfada her şeyi gösteriyor. Bunu **tab'lı profesyonel cari hesap sayfası**'na çevir. Bayram günü kasiyer ve yönetici en çok bu sayfayı kullanacak.

## ⚠️ KORUNACAK ŞEYLER (DOKUNMA)

Aşağıdakileri **KESİNLİKLE BOZMA**:
- ✅ Tahsilat KUTSAL akışı (`/api/tahsilat/odeme`)
- ✅ HizliOdemePanel bileşeni (Faz 3'te eklendi, çalışıyor)
- ✅ MusteriAvatar, MusteriRozetler, MusteriStatBar
- ✅ Mevcut `useMusteri` hook'u (varsa)
- ✅ Audit log entegrasyonu
- ✅ Soft delete filtreleri (`silindiMi: false`)
- ✅ Granular izin sistemi
- ✅ AlfabeSeridi
- ✅ TKR dekont numara sırası

## 📐 MİMARİ KURALLAR (MIMARI.md UYUMU)

Tüm yeni kod **MIMARI.md** standartlarına uymalı:

1. ✅ Modüler yapı: Yeni bileşenler `modules/musteriler/components/` altında
2. ✅ Helper'lar: `modules/musteriler/lib/` altında
3. ✅ Tipler: `modules/musteriler/types.ts` veya ayrı dosyalar
4. ✅ API endpoint'ler: `app/api/musteriler/[id]/<tab-adi>/route.ts`
5. ✅ Soft delete: tüm sorgularda `where: { silindiMi: false }`
6. ✅ Audit log: kritik değişikliklerde `auditLog()` çağır
7. ✅ İzin kontrolü: her API'de `izinKontrol(session, 'musteriler.X')`
8. ✅ Standart yanıt formatı (yeni endpoint'lerde): `{ basarili, veri }`
9. ✅ Türkçe değişken adları
10. ✅ Her özellik **ayrı commit** (8 tab = 8+ commit)

---

## 🎨 GENEL TASARIM

### Sayfa Yapısı

```
┌─────────────────────────────────────────────────────────┐
│ HERO (Müşteri özet kartı - mevcut)                      │
│ Avatar | Ad Soyad | İletişim | Bakiye Kartı (sağda)    │
├─────────────────────────────────────────────────────────┤
│ HIZLI EYLEM BAR (yeni)                                  │
│ [Tahsilat] [İade] [Düzenle] [WhatsApp] [Yazdır] [...]  │
├─────────────────────────────────────────────────────────┤
│ TAB BAR                                                  │
│ Genel | Hisseler | Tahsilatlar | Vekaletler | Notlar   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ TAB İÇERİĞİ (seçili tab'a göre değişir)                │
│                                                          │
│                                                          │
└─────────────────────────────────────────────────────────┘
                                    ┌──────────────────┐
                                    │ STICKY HIZLI     │
                                    │ ÖDEME PANEL      │
                                    │ (sağda, korunur) │
                                    └──────────────────┘
```

### Tab Bar Davranışı

- URL state: `?tab=hisseler` (paylaşılabilir link)
- Default: `?tab=genel`
- Tab değişirse URL güncellenir (replace, history kirletme)
- Klavye: `Tab` ile navigasyon, `1-5` ile tab seçimi
- Aktif tab: turuncu alt çizgi (`#ea580c`)

---

## 📋 5 TAB DETAYI

### TAB 1: GENEL BAKIŞ (`?tab=genel`)

**Amaç:** Müşteri hakkında 30 saniyede her şeyi bilmek.

**İçerik:**

#### A) Kişisel Bilgiler Kartı
- TC Kimlik (maskelenir: `***1234`, hover'da tam görünür)
- Doğum tarihi (varsa)
- Adres
- E-mail
- İlk kayıt tarihi
- Son işlem tarihi

#### B) İstatistik Kartları (4 mini KPI)
- Toplam Hisse Sayısı
- Toplam Bedel (TL)
- Ödenen (TL)
- Kalan (TL, renkli)

#### C) Etiket Yönetimi
- Mevcut etiketleri göster (badge'ler)
- "+ Etiket Ekle" butonu (modal açar)
- Önerilen etiketler: VIP, Düzenli, Yeni, Sorunlu
- Etiket sil (X butonu)

#### D) Son Aktivite (5 işlem)
- Son 5 işlem timeline
- Tahsilat, hisse atama, not, vs.
- "Tüm geçmiş için Audit Log'a git" linki

#### E) Hızlı Notlar (3 son not)
- En son 3 not göster
- "Yeni not ekle" butonu
- "Tüm notlara git" linki

### TAB 2: HİSSELER (`?tab=hisseler`)

**Amaç:** Müşterinin atanan tüm hisseleri yönetimi.

**İçerik:**

#### A) Üst KPI
- Toplam Hisse: 3
- Toplam Bedel: 21.000 ₺
- Ödenen: 14.000 ₺
- Kalan: 7.000 ₺

#### B) Hisse Listesi (Kart Görünümü)

Her hisse için kart:
```
┌─────────────────────────────────────────────┐
│ 🐂 Dana #17 - Hisse 3/7                     │
│ Atanma: 15 Mayıs 2026                       │
│ Fiyat: 7.000 ₺                              │
│ Durum: 🟡 Kısmi Ödendi (5.000/7.000)        │
│ [Detay] [İptal Et] [Transfer]               │
└─────────────────────────────────────────────┘
```

#### C) Eylemler
- **+ Yeni Hisse Ata:** Modal açar, boş hisseleri gösterir
- **Hisse İptal:** Onay modali, gerekçe sor, audit'e yaz
- **Hisse Transfer:** Başka müşteriye aktar (modal)

#### D) Vekalet Durumu (her hisse için)
- ✅ Vekalet alındı (yeşil rozet)
- ⚠️ Vekalet bekleniyor (sarı rozet)
- Vekalet ekle/güncelle butonu

### TAB 3: TAHSİLATLAR (`?tab=tahsilatlar`)

**Amaç:** Bu müşteriden alınan tüm ödemelerin geçmişi.

**İçerik:**

#### A) Üst Özet
- Toplam Tahsilat: 14.000 ₺
- İşlem Sayısı: 3
- Son Ödeme: 24 Mayıs 2026
- İptal Edilen: 0

#### B) Tahsilat Tablosu
```
| Tarih      | TKR No        | Tutar    | Yöntem  | Kasiyer | İşlem    |
|------------|---------------|----------|---------|---------|----------|
| 24.05.2026 | TKR-2026-099  | 7.000 ₺ | Nakit   | Admin   | [PDF][..]|
| 18.05.2026 | TKR-2026-085  | 5.000 ₺ | Havale  | Admin   | [PDF][..]|
| 10.05.2026 | TKR-2026-052  | 2.000 ₺ | POS     | Admin   | [PDF][..]|
```

#### C) Her Satır Eylemleri
- **PDF İndir:** Dekont yeniden indir
- **Yazdır:** Dekont yeniden yazdır (print-to-PDF)
- **WhatsApp Gönder:** Dekontu WhatsApp'la paylaş
- **İptal Et:** Onay + gerekçe (yetki: admin), audit'e yaz

#### D) Filtre
- Tarih aralığı
- Yöntem (Nakit/Havale/POS)
- Tutar (min-max)

### TAB 4: VEKALETLER (`?tab=vekaletler`)

**Amaç:** Her hisse için vekalet belgesi yönetimi.

**İçerik:**

#### A) Üst Durum
- Toplam Hisse: 3
- Vekalet Tamamlanan: 2 ✅
- Bekleyen: 1 ⚠️

#### B) Vekalet Listesi
Her hisse için satır:
```
┌──────────────────────────────────────────────┐
│ 🐂 Dana #17 - Hisse 3/7                      │
│ Vekalet Durumu: ✅ Alındı                     │
│ Yüklenme: 18.05.2026                         │
│ Yükleyen: Admin                              │
│ [Belgeyi Gör] [Yeniden Yükle] [Sil]          │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ 🐂 Dana #21 - Hisse 1/7                      │
│ Vekalet Durumu: ⚠️ BEKLENİYOR                 │
│ [+ Vekalet Yükle]                             │
└──────────────────────────────────────────────┘
```

#### C) Belge Yükleme (Modal)
- PDF, JPG, PNG kabul et
- Max 5MB
- `public/uploads/vekalet/` altına kaydet
- Audit log: "Vekalet yüklendi"

#### D) Belge Görüntüleme
- PDF embed (iframe)
- JPG/PNG resim viewer
- İndir butonu

### TAB 5: NOTLAR (`?tab=notlar`)

**Amaç:** Müşteri hakkında serbest metin notları.

**İçerik:**

#### A) Yeni Not Bölümü (Sticky Üst)
- Textarea (4 satır)
- Renk seçici: 🟢 Bilgi, 🟡 Uyarı, 🔴 Önemli, 🔵 Hatırlat
- "Kaydet" butonu (Ctrl+Enter)
- Karakter sayacı (max 1000)

#### B) Not Listesi (Timeline)
Her not için:
```
┌──────────────────────────────────────────────┐
│ 🟡 24 Mayıs 2026, 14:32 - Admin              │
│ ─────────────────────────────────────────    │
│ Müşteri perşembeye söz verdi, 2 hisse        │
│ daha alacağını söyledi. Aramayı unutma.      │
│ ─────────────────────────────────────────    │
│ [Düzenle] [Sil]                              │
└──────────────────────────────────────────────┘
```

#### C) Filtre
- Renk filtresi (4 tip)
- Tarih aralığı
- Arama (içerik)

#### D) Eylemler
- Düzenle (sadece kendi notunu, admin hepsini)
- Sil (soft delete, audit'e yaz)
- Sabitle (önemli notlar üstte)

---

## 🔧 HIZLI EYLEM BAR

Tab bar'ın üstünde, yatay buton dizisi:

| Buton | İkon | Eylem | Yetki |
|-------|------|-------|-------|
| **Tahsilat Al** | 💰 cash | HizliOdemePanel'i toggle | musteriler.tahsilat |
| **İade Yap** | 💸 arrow-left | İade modal aç | musteriler.iade |
| **Düzenle** | ✏️ edit | Müşteri düzenle sayfasına git | musteriler.guncelle |
| **WhatsApp** | 💬 message-circle | `wa.me/...` aç (yeni sekme) | musteriler.iletisim |
| **Hesap Ekstresi** | 📄 file-text | Ekstre PDF üret | musteriler.goruntule |
| **Excel İndir** | 📊 download | Müşteri verisi Excel | musteriler.goruntule |
| **Hisse Ata** | 🐂 plus | Hisse ekle modal | musteriler.hisse.ata |
| **Etiket Ekle** | 🏷️ tag | Etiket modal | musteriler.etiket |
| **Daha Fazla** | ⋯ more | Dropdown menü | - |

**Daha Fazla Menüsü:**
- Müşteri Sil (admin)
- Çıkar (geçici devre dışı)
- Aktivite Logu

---

## 🗂️ DOSYA YAPISI (YENİ EKLENECEK)

```
modules/musteriler/
├── components/
│   ├── MusteriDetayLayout.tsx           ← Ana layout (hero + tab bar)
│   ├── MusteriHero.tsx                  ← Üst hero kartı (refactor)
│   ├── MusteriHizliEylemBar.tsx         ← YENİ: hızlı eylem barı
│   ├── tabs/
│   │   ├── GenelTab.tsx                 ← YENİ
│   │   ├── HisselerTab.tsx              ← YENİ
│   │   ├── TahsilatlarTab.tsx           ← YENİ
│   │   ├── VekaletlerTab.tsx            ← YENİ
│   │   └── NotlarTab.tsx                ← YENİ
│   ├── modals/
│   │   ├── EtiketEkleModal.tsx          ← YENİ
│   │   ├── HisseAtamaModal.tsx          ← YENİ
│   │   ├── IadeModal.tsx                ← YENİ
│   │   ├── VekaletYukleModal.tsx        ← YENİ
│   │   └── NotEkleModal.tsx             ← YENİ
│   ├── MusteriAvatar.tsx                (KORUNDU)
│   ├── MusteriRozetler.tsx              (KORUNDU)
│   ├── MusteriStatBar.tsx               (KORUNDU)
│   ├── HizliOdemePanel.tsx              (KORUNDU)
│   └── AlfabeSeridi.tsx                 (KORUNDU)
├── lib/
│   ├── avatar.ts                         (KORUNDU)
│   ├── istatistik.ts                     (KORUNDU)
│   ├── tc-maskele.ts                    ← YENİ: TC numarasını maskele
│   ├── ekstre-pdf.ts                    ← YENİ: Hesap ekstresi PDF üretici
│   └── excel-musteri.ts                 ← YENİ: Müşteri Excel export
└── types.ts                              (genişlet)
```

```
app/
├── musteriler/
│   └── [id]/
│       └── page.tsx                      (REFACTOR: tab destekli)
└── api/
    └── musteriler/
        └── [id]/
            ├── hisseler/route.ts         ← YENİ
            ├── tahsilatlar/route.ts      ← YENİ
            ├── vekaletler/route.ts       ← YENİ (GET + POST)
            ├── notlar/route.ts           ← YENİ (GET + POST)
            ├── notlar/[notId]/route.ts   ← YENİ (PATCH + DELETE)
            ├── etiketler/route.ts        ← YENİ (PATCH)
            └── ekstre/route.ts           ← YENİ (GET: PDF döner)
```

---

## 🗄️ DB SCHEMA EKLEMELERİ

**`prisma/schema.prisma`** dosyasına ekle:

```prisma
model Not {
  id          String   @id @default(cuid())
  musteriId   String
  musteri     Musteri  @relation(fields: [musteriId], references: [id])

  icerik      String   // max 1000 char
  renk        String   @default("bilgi") // bilgi | uyari | onemli | hatirlat
  sabitlendiMi Boolean @default(false)

  // Audit
  olusturanId String
  silindiMi   Boolean  @default(false)
  silinmeTarihi DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([musteriId])
  @@index([silindiMi])
}

model Vekalet {
  id          String   @id @default(cuid())
  hisseId     String   @unique
  hisse       Hisse    @relation(fields: [hisseId], references: [id])

  dosyaUrl    String   // /uploads/vekalet/cuid.pdf
  dosyaTipi   String   // pdf | jpg | png
  dosyaBoyutu Int      // bytes

  // Audit
  olusturanId String
  silindiMi   Boolean  @default(false)
  silinmeTarihi DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([silindiMi])
}

// Musteri modeline ekle:
model Musteri {
  // ... mevcut alanlar
  notlar      Not[]
  // ...
}

// Hisse modeline ekle:
model Hisse {
  // ... mevcut alanlar
  vekalet     Vekalet?
  // ...
}
```

**Migration adı:** `add-not-vekalet-modelleri`

---

## 🔌 API ENDPOINT DETAYLARI

### `GET /api/musteriler/[id]/hisseler`

```typescript
// Yanıt
{
  basarili: true,
  veri: [
    {
      id: "cuid_hisse1",
      kurbanId: "cuid_kurban1",
      kurban: {
        no: 17,
        kesimTarihi: null,
      },
      hisseNo: 3,
      fiyat: 7000,
      odenen: 5000,
      kalan: 2000,
      durum: "kismi", // tamamlandi | kismi | borclu | iptal
      atanmaTarihi: "2026-05-15",
      vekalet: {
        var: true,
        url: "/uploads/vekalet/xxx.pdf",
      },
    },
    // ...
  ],
  ozet: {
    toplamHisse: 3,
    toplamBedel: 21000,
    odenen: 14000,
    kalan: 7000,
  }
}
```

### `GET /api/musteriler/[id]/tahsilatlar`

```typescript
{
  basarili: true,
  veri: [
    {
      id: "cuid",
      tkrNo: "TKR-2026-000099",
      tarih: "2026-05-24T14:32:00Z",
      tutar: 7000,
      yontem: "nakit", // nakit | havale | pos | karisik
      yontemDagilim: { nakit: 7000, havale: 0, pos: 0 },
      kasiyer: { id: "...", adSoyad: "Admin" },
      iptalMi: false,
      iptalGerekce: null,
    },
  ],
  ozet: {
    toplam: 14000,
    islemSayisi: 3,
    sonOdeme: "2026-05-24",
  }
}
```

### `POST /api/musteriler/[id]/notlar`

```typescript
// Body
{
  icerik: "Müşteri perşembe söz verdi",
  renk: "uyari", // bilgi | uyari | onemli | hatirlat
}

// Yanıt
{
  basarili: true,
  veri: { /* yeni not */ }
}

// Audit log: "Not eklendi"
```

### `POST /api/musteriler/[id]/vekaletler`

```typescript
// Multipart form-data
// hisseId: cuid
// dosya: File (PDF/JPG/PNG, max 5MB)

// Yanıt
{
  basarili: true,
  veri: { /* vekalet kaydı */ }
}
```

### `GET /api/musteriler/[id]/ekstre`

```typescript
// Yanıt: PDF dosyası (binary)
// Content-Type: application/pdf
// Filename: ekstre-musteri-adsoyad-tarih.pdf
```

---

## 🎯 UYGULAMA SIRASI

### ADIM 1: DB Migration (15 dk)
1. `prisma/schema.prisma`'ya `Not` ve `Vekalet` modellerini ekle
2. `Musteri` ve `Hisse` modellerine ilişki ekle
3. `pnpm db:migrate` → migration adı: `add-not-vekalet-modelleri`
4. `pnpm db:seed` → seed güncel kalsın

**Commit:** `feat(db): not ve vekalet modelleri eklendi`

### ADIM 2: Ana Layout + Tab Bar (30 dk)
1. `MusteriDetayLayout.tsx` oluştur
2. Tab bar URL state ile çalışsın (`?tab=`)
3. `app/musteriler/[id]/page.tsx` refactor et
4. Skeleton loader ekle (loading state)

**Commit:** `feat(musteri): tab sistemi temel altyapısı`

### ADIM 3: Hızlı Eylem Bar (30 dk)
1. `MusteriHizliEylemBar.tsx` oluştur
2. 9 buton (Tahsilat, İade, Düzenle, WhatsApp, Ekstre, Excel, Hisse, Etiket, Daha Fazla)
3. İzin kontrolü her butonda
4. WhatsApp linki: `wa.me/${telefon.replace(/\D/g, '')}`

**Commit:** `feat(musteri): hızlı eylem bar eklendi`

### ADIM 4: Tab 1 - Genel Bakış (45 dk)
1. `GenelTab.tsx`
2. Kişisel bilgiler kartı (TC maskeleme: `tc-maskele.ts`)
3. 4 mini KPI
4. Etiket yönetimi (EtiketEkleModal)
5. Son 5 aktivite timeline
6. Son 3 not

**Commit:** `feat(musteri): genel bakış tab'ı tamamlandı`

### ADIM 5: Tab 2 - Hisseler (1 saat)
1. `HisselerTab.tsx`
2. Hisse kart listesi
3. Üst KPI
4. Hisse iptal modal
5. Hisse transfer modal (basit)
6. API: `/api/musteriler/[id]/hisseler` GET

**Commit:** `feat(musteri): hisseler tab'ı tamamlandı`

### ADIM 6: Tab 3 - Tahsilatlar (1 saat)
1. `TahsilatlarTab.tsx`
2. Tahsilat tablosu (tarihten yeniye sıralı)
3. Üst özet
4. Filtre (tarih, yöntem, tutar)
5. PDF indir, yazdır, WhatsApp gönder, iptal et eylemleri
6. API: `/api/musteriler/[id]/tahsilatlar` GET

**Commit:** `feat(musteri): tahsilatlar tab'ı tamamlandı`

### ADIM 7: Tab 4 - Vekaletler (45 dk)
1. `VekaletlerTab.tsx`
2. Her hisse için vekalet durumu
3. VekaletYukleModal (PDF/JPG/PNG upload)
4. Belge görüntüleme (iframe veya img)
5. API: `/api/musteriler/[id]/vekaletler` GET + POST

**Commit:** `feat(musteri): vekaletler tab'ı tamamlandı`

### ADIM 8: Tab 5 - Notlar (45 dk)
1. `NotlarTab.tsx`
2. Yeni not bölümü (renk seçici)
3. Timeline görünümü
4. Filtre (renk, tarih, arama)
5. Düzenle/sil
6. API: `/api/musteriler/[id]/notlar` GET + POST + PATCH + DELETE

**Commit:** `feat(musteri): notlar tab'ı tamamlandı`

### ADIM 9: Ekstra Modallar (30 dk)
1. IadeModal — basit iade işlemi
2. EtiketEkleModal — etiket yönetimi
3. HisseAtamaModal — basit hisse atama

**Commit:** `feat(musteri): modallar tamamlandı`

### ADIM 10: Ekstre PDF + Excel Export (45 dk)
1. `ekstre-pdf.ts` — jsPDF ile hesap ekstresi
2. `excel-musteri.ts` — xlsx ile müşteri Excel
3. API: `/api/musteriler/[id]/ekstre` GET (PDF dön)

**Commit:** `feat(musteri): ekstre PDF ve Excel export`

### ADIM 11: Test + Polish (30 dk)
1. `pnpm tsc --noEmit` — temiz olmalı
2. Tüm tab'ları manuel test
3. URL paylaşımı çalışıyor mu (`?tab=hisseler`)
4. Klavye navigasyonu
5. Mobile responsive kontrol
6. KUTSAL tahsilat akışı bozulmadığını doğrula

**Commit:** `test(musteri): faz 4 doğrulandı`

### ADIM 12: Final Push (5 dk)
1. `git push origin main`
2. GitHub'da commit'leri doğrula

---

## ✅ TEST CHECKLİSTİ

Tamamlandığında **her birini test et**:

### Temel
- [ ] `pnpm tsc --noEmit` temiz
- [ ] `pnpm dev` başlıyor
- [ ] `/musteriler/[cuid]` HTTP 200
- [ ] 5 tab da açılıyor (`?tab=` değiştirilebiliyor)

### Tahsilat (KUTSAL)
- [ ] HizliOdemePanel çalışıyor
- [ ] Yeni TKR alınabiliyor
- [ ] Dekont açılıyor
- [ ] Audit log'a kaydoluyor

### Tab 1 - Genel
- [ ] TC maskeleniyor
- [ ] 4 KPI doğru
- [ ] Etiket eklenip silinebiliyor
- [ ] Son 5 aktivite görünüyor

### Tab 2 - Hisseler
- [ ] Müşterinin hisseleri listelenir
- [ ] Her hisse için doğru fiyat/ödenen/kalan
- [ ] Hisse iptal modal çalışır

### Tab 3 - Tahsilatlar
- [ ] Tüm geçmiş tahsilatlar görünür
- [ ] Filtre çalışır
- [ ] PDF yeniden indirilebilir
- [ ] WhatsApp linki açılır

### Tab 4 - Vekaletler
- [ ] Her hisse için vekalet durumu
- [ ] PDF yüklenebilir (5MB altı)
- [ ] Yüklenen belge görüntülenir

### Tab 5 - Notlar
- [ ] Not eklenebilir (Ctrl+Enter)
- [ ] Renk filtresi çalışır
- [ ] Not düzenlenebilir/silinebilir

### Hızlı Eylem Bar
- [ ] 9 buton çalışıyor
- [ ] WhatsApp link doğru oluşuyor
- [ ] Ekstre PDF üretiliyor
- [ ] Excel indiriliyor
- [ ] İzin yoksa buton gizleniyor (örn. izleyici rolü tahsilat görmez)

### Genel
- [ ] URL paylaşılabilir (`?tab=...`)
- [ ] Mobil responsive
- [ ] Klavye ile gezinilebilir
- [ ] Toast bildirimler çalışır (sonner)
- [ ] Audit log her değişiklikte yazılır
- [ ] Soft delete: silinen müşteri/not/vekalet listelerde görünmez

---

## ⚠️ ÖNEMLİ NOTLAR

### 1. Standart API Yanıt Formatı
Yeni endpoint'ler **{ basarili, veri, ozet }** formatını kullansın (MIMARI.md kuralı). Mevcut endpoint'leri **dönüştürme** — frontend kırılır.

### 2. Türkçe Karakter
TC kimlik, telefon, isim alanları Türkçe karakter desteklesin:
- TC: 11 haneli sayı validasyon
- Telefon: `05XX XXX XX XX` formatı
- İsim: ÇĞIÖŞÜ destekli regex

### 3. Yüklenen Dosyalar
- `public/uploads/vekalet/` klasörü oluştur
- `.gitignore`'a ekle (yüklenen belgeler git'e gitmesin)
- Dosya adı: `{cuid}.{ext}` (kullanıcı adı kullanma — KVKK)

### 4. PDF Üretimi
- jsPDF ile (zaten yüklü)
- Türkçe karakter için Inter fontu yükle
- Logo + başlık + tablo + footer
- A4 boyut, dikey

### 5. Performance
- Tab içerikleri **lazy load** (tab açılınca fetch)
- Cache: aynı tab tekrar açıldığında re-fetch yapma (5dk cache)
- Skeleton loader her tab için

### 6. İzin Kontrolü
- Her API endpoint'inde session + izin kontrolü
- `musteriler.tahsilat`, `musteriler.iade`, `musteriler.notlar.yaz`, vs.
- İzin yoksa frontend butonu gizle (deftensive UI)

### 7. KVKK Uyumu
- TC kimlik maskeli göster, hover'da admin görebilir
- Audit log'da kim ne zaman gördü kayıtlı
- Silinen müşteri 30 gün soft delete, sonra hard delete (opsiyonel)

---

## 📊 RAPOR ŞABLONU (Tamamlandığında)

```markdown
# FAZ 4 TAMAMLANDI — Müşteri Detay Tab Sistemi

## ✅ Tamamlanan
- [x] DB migration (Not + Vekalet)
- [x] Ana layout + tab bar
- [x] Hızlı eylem bar (9 buton)
- [x] Tab 1: Genel Bakış
- [x] Tab 2: Hisseler
- [x] Tab 3: Tahsilatlar
- [x] Tab 4: Vekaletler
- [x] Tab 5: Notlar
- [x] 5 modal (Etiket, Hisse, İade, Vekalet, Not)
- [x] Ekstre PDF
- [x] Excel export

## 🧪 Test Sonuçları
- pnpm tsc --noEmit: temiz/hatalı
- 5 tab HTTP 200: evet/hayır
- KUTSAL tahsilat: bozulmadı/bozuldu
- Mobile responsive: ok/sorun var
- Audit log: kayıt alıyor/almıyor

## 📦 Git
- Toplam commit: X
- Push: ✅

## ⚠️ Atlanılanlar
- (varsa, gerekçesiyle)

## 🎯 Sıradaki Adım
FAZ 5 (WhatsApp click-to-chat) için hazır.
```

---

## 🚀 BAŞLA

Şimdi sırayla uygulamaya başla. Her adımda **commit at**. Sorun olursa **dur ve sor**, geri al.

**Bayram için süre:** 12 gün. Acele etme, doğru yap.

**Hayırlı kodlar! 🐂✨**
