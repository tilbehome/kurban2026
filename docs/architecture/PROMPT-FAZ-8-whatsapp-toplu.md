# PROMPT-FAZ-8: WHATSAPP TOPLU GÖNDERİM

> **Claude Code'a ver. Otonom modda çalıştır. Her adımda commit at.**

---

## 🎯 AMAÇ

Bayram günü yaklaşırken Burhan ve kasiyer için **toplu WhatsApp gönderimi** sistemi. Borçlulara hatırlatma, VIP'lere bayram tebriği, herkese kesim bilgisi — hepsi tek yerden.

**Bayram için kritik:** 286 borçlu müşteri var, manuel mesaj atmak imkânsız. Bu modül ile **dakikada 50 müşteri**ye mesaj atılabilir.

---

## ⚠️ KORUNACAKLAR

**KESİNLİKLE BOZMA:**
- ✅ KUTSAL tahsilat akışı
- ✅ FAZ 4 müşteri detay tab
- ✅ FAZ 5 sidebar 12 menü
- ✅ FAZ 6 dashboard
- ✅ FAZ 7 hisse atama
- ✅ Audit log + granular izinler
- ✅ Soft delete
- ✅ MIMARI.md uyumu
- ✅ Mevcut müşteri detay sayfasındaki "WhatsApp Gönder" tek tıkla mesaj

---

## 📋 ŞU ANKİ DURUM

Sidebar'da **💬 İletişim & WhatsApp** menüsü var (FAZ 5'te eklendi), ama altındaki sayfalar **placeholder**:
- 📨 Mesaj Merkezi (placeholder)
- 📋 Mesaj Şablonları (placeholder)
- 📤 Toplu Gönderim (placeholder) ⬅ ⭐ Bunu yapacağız
- ⏰ Zamanlanmış Mesajlar (placeholder)
- 📜 Gönderim Geçmişi (placeholder)
- ... (diğer 5 placeholder)

**Bu fazda:**
1. **Mesaj Şablonları** sayfası (gerçek CRUD)
2. **Toplu Gönderim** sayfası (akış)
3. **Gönderim Geçmişi** sayfası (log)

Diğer 7 placeholder bayram sonrası.

---

## 🎯 NASIL ÇALIŞACAK?

### Strateji: wa.me Click-to-Chat (Ücretsiz)

**Resmi WhatsApp Business API'ye gerek YOK** (paralı, karmaşık). Bunun yerine:

1. Kullanıcı şablonu seçer
2. Hedef müşterileri filtreler/seçer
3. Sistem her müşteri için `wa.me/905XX...?text=encoded_message` linki üretir
4. **Sıralı pencere açma:** Her müşteri için 2-3 saniye arayla `window.open()` → kullanıcı her mesajı manuel onaylar
5. Veya: **Tek tek copy** — kullanıcı linkleri tek tek tıklar

### Neden Bu Strateji?
- ✅ **Ücretsiz** (resmi API'ye yıllık binlerce TL)
- ✅ **Yasal** (WhatsApp ToS'a uygun, otomasyon değil)
- ✅ **Hızlı:** Dakikada 30-50 müşteri (manuel'den 100x hızlı)
- ✅ **Güvenli:** Spam kabul edilmez (kullanıcı her mesajı onaylıyor)
- ✅ **Kişisel:** Kullanıcı kendi telefonundan gönderiyor

### Bayram Sonrası
Faz 2'de **WhatsApp Business Cloud API** entegrasyonu yapılabilir. Şu an gerek yok.

---

## 🗂️ HEDEF YAPI

### Sayfa 1: Mesaj Şablonları (`/whatsapp/sablonlar`)

**Layout:** Sol liste + Sağ editör (split)

#### Sol Liste
```
┌─────────────────────────────┐
│ 📋 Mesaj Şablonları  [+ Yeni]│
├─────────────────────────────┤
│                              │
│ 🟢 Borç Hatırlatma (Yumuşak)│
│    Aktif · Son: 2 saat önce │
│                              │
│ 🟡 Borç Hatırlatma (Sert)    │
│    Aktif · Son: 1 gün önce  │
│                              │
│ 🔵 Tahsilat Onayı            │
│    Aktif · Otomatik          │
│                              │
│ 🎉 Bayram Tebriği            │
│    Aktif · Hazır             │
│                              │
│ 🐂 Kurban Hazır              │
│    Aktif · Bayram günü için  │
│                              │
│ 📅 Kesim Saati               │
│    Aktif · Bayram günü       │
│                              │
└─────────────────────────────┘
```

#### Sağ Editör
```
┌─────────────────────────────────────┐
│ Şablon: Borç Hatırlatma (Yumuşak)  │
│ ─────────────────────────────────  │
│                                     │
│ Şablon Adı: [Borç Hatırlatma]      │
│                                     │
│ Kategori: [Tahsilat ▼]             │
│                                     │
│ Mesaj İçeriği:                      │
│ ┌─────────────────────────────────┐ │
│ │ Sayın {adSoyad}, kurban         │ │
│ │ ödemenizden {kalanTutar}₺       │ │
│ │ kalmıştır. Bayrama {bayramGun}  │ │
│ │ gün kaldı, en kısa sürede       │ │
│ │ ödemenizi rica ederiz.          │ │
│ │                                  │ │
│ │ Saygılarımızla,                 │ │
│ │ {sirketAdi}                     │ │
│ │ {telefon}                        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Değişkenler:                        │
│ {adSoyad} {kalanTutar} {bayramGun} │
│ {sirketAdi} {telefon} {dekontNo}   │
│                                     │
│ Önizleme (Mehmet Yılmaz için):      │
│ ┌─────────────────────────────────┐ │
│ │ Sayın Mehmet Yılmaz, kurban     │ │
│ │ ödemenizden 7.000₺ kalmıştır... │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Kaydet] [Test Gönder] [Sil]       │
└─────────────────────────────────────┘
```

**Davranış:**
- Yeni şablon ekle (form)
- Değişkenler tıklayınca cursor'a yapışır
- **Canlı önizleme** (örnek müşteri ile)
- Test gönder: kendi telefonuna deneme
- Karakter sayacı (WhatsApp limit 4096)

#### Hazır Şablonlar (Sistem Seed)
1. **Borç Hatırlatma (Yumuşak)** — nazik ton
2. **Borç Hatırlatma (Sert)** — son uyarı
3. **Tahsilat Onayı** — ödeme alındı
4. **Bayram Tebriği** — bayram gününde
5. **Kurban Hazır** — kesim yapıldı, eti alın
6. **Kesim Saati** — bayram günü sıra geldi
7. **Genel Bilgilendirme** — özel duyuru
8. **Şehir Dışı Müşteri** — kargo bilgisi

### Sayfa 2: Toplu Gönderim (`/whatsapp/toplu`)

**Layout:** 4 adımlı wizard

#### ADIM 1: Şablon Seç
```
┌────────────────────────────────────┐
│ ADIM 1/4: Şablon Seç                │
│ ─────────────────────────────────  │
│                                     │
│ Hangi mesajı göndereceksiniz?      │
│                                     │
│ ○ Borç Hatırlatma (Yumuşak)        │
│ ● Borç Hatırlatma (Sert) ✓         │
│ ○ Tahsilat Onayı                    │
│ ○ Bayram Tebriği                    │
│ ○ Kurban Hazır                      │
│ ○ Kesim Saati                       │
│ ○ Diğer...                          │
│                                     │
│ Önizleme:                           │
│ ┌─────────────────────────────────┐ │
│ │ Sayın {adSoyad}, kurban        │ │
│ │ ödemenizden {kalanTutar}₺ ...   │ │
│ └─────────────────────────────────┘ │
│                                     │
│                    [İptal] [İleri →]│
└────────────────────────────────────┘
```

#### ADIM 2: Hedef Müşteri Seç
```
┌─────────────────────────────────────┐
│ ADIM 2/4: Hedef Seç                  │
│ ─────────────────────────────────  │
│                                      │
│ Filtre:                              │
│ Durum: [Borçlular ▼]                │
│ Etiket: [Tümü ▼]                    │
│ Şehir: [Tümü ▼]                     │
│ Borç: [> 1000 ▼]                    │
│                                      │
│ Bulunan: 286 müşteri                 │
│                                      │
│ ┌────────────────────────────────┐  │
│ │ ☐ Tümünü Seç (286)             │  │
│ ├────────────────────────────────┤  │
│ │ ☑ MY Mehmet Yılmaz - 7.000₺    │  │
│ │ ☑ AD Ahmet Demir - 14.000₺     │  │
│ │ ☑ FŞ Fatma Şahin - 21.000₺     │  │
│ │ ☐ HK Hasan Kaya - 10.590₺      │  │
│ │ ☑ AG Ali Gürbüz - 7.000₺       │  │
│ │ ...                            │  │
│ └────────────────────────────────┘  │
│                                      │
│ Seçilen: 4 / 286                    │
│                                      │
│ [Excel ile yükle] [← Geri] [İleri →]│
└─────────────────────────────────────┘
```

**Davranış:**
- Filtre çoklu seçim (durum + etiket + şehir + borç)
- Çoklu seçim (checkbox)
- "Tümünü Seç" toggle
- "Excel ile yükle" → CSV/Excel'den telefon listesi
- Telefonu olmayan müşteriler **otomatik atlanır** (uyarı: "X müşterinin telefonu yok")

#### ADIM 3: Önizleme + Onay
```
┌─────────────────────────────────────┐
│ ADIM 3/4: Önizleme ve Onay           │
│ ─────────────────────────────────  │
│                                      │
│ Gönderim Özeti:                      │
│                                      │
│ 📋 Şablon: Borç Hatırlatma (Sert)   │
│ 👥 Hedef: 4 müşteri                  │
│ ⏱️ Tahmini süre: 2 dakika            │
│                                      │
│ İlk 3 müşteriye gidecek mesaj:       │
│                                      │
│ ┌────────────────────────────────┐  │
│ │ 1. Mehmet Yılmaz (0532...)     │  │
│ │ "Sayın Mehmet Yılmaz, kurban   │  │
│ │ ödemenizden 7.000₺ kalmıştır.  │  │
│ │ Bayrama 9 gün kaldı..."        │  │
│ │                                 │  │
│ │ 2. Ahmet Demir (0541...)       │  │
│ │ "Sayın Ahmet Demir, kurban     │  │
│ │ ödemenizden 14.000₺ kalmıştır.."│  │
│ │                                 │  │
│ │ 3. Fatma Şahin (0533...)       │  │
│ │ "Sayın Fatma Şahin, kurban     │  │
│ │ ödemenizden 21.000₺ kalmıştır.."│  │
│ └────────────────────────────────┘  │
│                                      │
│ ⚠️ DİKKAT: Her müşteri için           │
│ WhatsApp Web/uygulaması açılacak.    │
│ "Send" butonuna basmanız gerek.      │
│                                      │
│      [← Geri] [Gönderimi Başlat 🚀] │
└─────────────────────────────────────┘
```

#### ADIM 4: Canlı Gönderim
```
┌─────────────────────────────────────┐
│ ADIM 4/4: Gönderim Devam Ediyor      │
│ ─────────────────────────────────  │
│                                      │
│ İlerleme: 2/4 (%50)                 │
│ [████████████░░░░░░░░░░░░]          │
│                                      │
│ Şu an: Fatma Şahin (3. müşteri)     │
│                                      │
│ ┌────────────────────────────────┐  │
│ │ ✅ 1. Mehmet Yılmaz             │  │
│ │    Açıldı: 14:32:01             │  │
│ │                                 │  │
│ │ ✅ 2. Ahmet Demir               │  │
│ │    Açıldı: 14:32:04             │  │
│ │                                 │  │
│ │ ⏳ 3. Fatma Şahin               │  │
│ │    [Devam Et] [Atla] [Durdur]   │  │
│ │                                 │  │
│ │ ⏸️ 4. Ali Gürbüz                │  │
│ │    Sırada bekliyor              │  │
│ └────────────────────────────────┘  │
│                                      │
│ ⚙️ Saniye arası: [3] sn              │
│ ☑ Otomatik devam et                  │
│                                      │
│ [Devam Et] [Duraklat] [Durdur]      │
└─────────────────────────────────────┘
```

**Davranış:**
- Her müşteri için `window.open(`wa.me/...`)` çağrılır
- 2-3 saniye bekler (kullanıcı mesajı görüp gönderdiği için)
- Otomatik bir sonrakine geçer
- "Duraklat" / "Durdur" / "Atla" butonları
- "Saniye arası" ayarlanabilir (2-10sn)
- Manuel mod: her mesaj için "Devam Et" butonu

**Sonuçlar:** İşlem bittiğinde özet:
- ✅ Açılan: X
- ⏭️ Atlanan: Y (kullanıcı atladı)
- ❌ Hata: Z (telefon yok, geçersiz)

### Sayfa 3: Gönderim Geçmişi (`/whatsapp/gecmis`)

**Tablo:**
| Tarih | Şablon | Hedef | Açılan | Atlanan | Kullanıcı | İşlem |
|-------|--------|-------|--------|---------|-----------|-------|
| 24.05 14:32 | Borç Hatırlatma (Sert) | 4 müşteri | 4 | 0 | admin | [Detay] |
| 23.05 10:15 | Tahsilat Onayı | 1 müşteri | 1 | 0 | admin | [Detay] |
| 22.05 09:00 | Bayram Tebriği | 240 müşteri | 235 | 5 | admin | [Detay] |

**Filtre:**
- Tarih aralığı
- Şablon
- Kullanıcı (admin/kasiyer)

**Detay:**
- Her müşteri için liste
- Açılma zamanı
- Notlar (manuel girilebilir)

---

## 🗄️ DB SCHEMA EKLEMELERİ

**`prisma/schema.prisma`**:

```prisma
model WhatsAppSablonu {
  id          String   @id @default(cuid())
  ad          String
  kategori    String   // tahsilat | bayram | kesim | genel
  icerik      String   // {değişkenler} desteği
  aktifMi     Boolean  @default(true)
  varsayılan  Boolean  @default(false) // sistem şablonları

  // Audit
  olusturanId String
  silindiMi   Boolean  @default(false)
  silinmeTarihi DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  gonderilenler WhatsAppGonderim[]

  @@index([aktifMi, silindiMi])
}

model WhatsAppGonderim {
  id              String   @id @default(cuid())
  sablonId        String
  sablon          WhatsAppSablonu @relation(fields: [sablonId], references: [id])

  baslamaTarihi   DateTime
  bitisTarihi     DateTime?

  hedefSayisi     Int      // toplam hedef
  acilanSayisi    Int      @default(0)
  atlananSayisi   Int      @default(0)
  hataSayisi      Int      @default(0)

  not             String?  // kullanıcı notu

  // Hedeflenen müşteriler (JSON)
  hedefler        String   // JSON: [{musteriId, telefon, durum, acilmaZamani}]

  // Audit
  kullaniciId     String
  silindiMi       Boolean  @default(false)
  silinmeTarihi   DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([sablonId])
  @@index([silindiMi])
}
```

**Migration adı:** `add-whatsapp-modelleri`

---

## 🗂️ DOSYA YAPISI

### Yeni Componentlar

```
modules/whatsapp/
├── components/
│   ├── SablonListesi.tsx              ← Sol şablon listesi
│   ├── SablonEditoru.tsx              ← Sağ editör
│   ├── SablonOnizleme.tsx             ← Canlı önizleme
│   ├── TopluGonderimWizard.tsx        ← 4 adımlı wizard
│   ├── adimlar/
│   │   ├── SablonSecAdimi.tsx         ← Adım 1
│   │   ├── HedefSecAdimi.tsx          ← Adım 2
│   │   ├── OnizlemeAdimi.tsx          ← Adım 3
│   │   └── GonderimAdimi.tsx          ← Adım 4
│   └── GecmisTablosu.tsx              ← Geçmiş listesi
├── lib/
│   ├── whatsapp.service.ts            ← CRUD + iş mantığı
│   ├── sablon-degisken-cozucu.ts      ← {adSoyad} → "Mehmet Yılmaz"
│   └── wa-link-uretici.ts             ← wa.me/... URL'i
└── types.ts
```

### Yeni Sayfalar

```
app/whatsapp/
├── sablonlar/page.tsx                 ← Şablon yönetimi
├── toplu/page.tsx                     ← Toplu gönderim wizard
├── gecmis/page.tsx                    ← Gönderim geçmişi
└── ... (diğer placeholder'lar bayram sonrası)
```

### Yeni API'ler

```
app/api/whatsapp/
├── sablonlar/route.ts                 ← GET + POST
├── sablonlar/[id]/route.ts            ← PATCH + DELETE
├── sablonlar/test/route.ts            ← Test gönderim
├── gonderimler/route.ts               ← GET + POST (kayıt)
├── gonderimler/[id]/route.ts          ← GET + PATCH
└── musteriler-filtre/route.ts         ← Hedef seçim için filtreli müşteriler
```

---

## 🔧 ŞABLON DEĞİŞKEN SİSTEMİ

### Desteklenen Değişkenler

```typescript
const DEGISKENLER = {
  // Müşteri
  '{adSoyad}': musteri.adSoyad,
  '{telefon}': musteri.telefon,
  '{musteriNo}': musteri.no,
  '{sehir}': musteri.sehir,

  // Finansal
  '{toplamBedel}': formatPara(toplam),
  '{odenenTutar}': formatPara(odenen),
  '{kalanTutar}': formatPara(kalan),
  '{borçTutar}': formatPara(kalan), // alternatif

  // Tarih
  '{bayramGun}': bayramaKalanGun(), // "9 gün"
  '{bugun}': formatTarih(new Date()),

  // Sistem
  '{sirketAdi}': 'Adabereket Hayvancılık',
  '{sirketTel}': '0XXX XXX XX XX',

  // Hisse
  '{hisseSayisi}': musteri.hisseler.length,
  '{kurbanNo}': musteri.hisseler[0]?.kurban.no,
  '{dekontNo}': sonOdeme?.tkrNo,
};
```

### Çözüm Fonksiyonu

```typescript
// sablon-degisken-cozucu.ts
export function cozumle(metin: string, musteri: Musteri, ek: any = {}): string {
  let sonuc = metin;
  Object.entries(getDegiskenler(musteri, ek)).forEach(([anahtar, deger]) => {
    sonuc = sonuc.replace(new RegExp(anahtar.replace(/[{}]/g, '\\$&'), 'g'), String(deger));
  });
  return sonuc;
}
```

---

## 🔗 wa.me LİNK ÜRETİCİ

```typescript
// wa-link-uretici.ts
export function urettWaLink(telefon: string, mesaj: string): string {
  // Telefonu temizle: "0532 123 45 67" → "905321234567"
  const temizTelefon = telefon
    .replace(/\D/g, '')                          // sadece rakam
    .replace(/^0/, '')                           // baştaki 0'ı sil
    .replace(/^/, '90');                         // başına 90 ekle (Türkiye)

  const encodedMesaj = encodeURIComponent(mesaj);

  return `https://wa.me/${temizTelefon}?text=${encodedMesaj}`;
}

// Test:
// urettWaLink("0532 123 45 67", "Merhaba")
// → "https://wa.me/905321234567?text=Merhaba"
```

---

## 🎯 UYGULAMA SIRASI (10 ADIM)

### ADIM 1: DB Schema + Migration
1. `prisma/schema.prisma` → `WhatsAppSablonu` + `WhatsAppGonderim` modelleri
2. `pnpm prisma migrate dev --name add-whatsapp-modelleri`
3. Seed: 8 hazır şablon (Borç Hatırlatma Yumuşak/Sert, Bayram Tebriği, vs.)

**Commit:** `feat(db): whatsapp sablon ve gonderim modelleri`

### ADIM 2: Helper'lar
1. `modules/whatsapp/lib/sablon-degisken-cozucu.ts`
2. `modules/whatsapp/lib/wa-link-uretici.ts`
3. `modules/whatsapp/types.ts`

**Commit:** `feat(whatsapp): helper fonksiyonlar`

### ADIM 3: Şablon CRUD API
1. `/api/whatsapp/sablonlar` GET + POST
2. `/api/whatsapp/sablonlar/[id]` PATCH + DELETE
3. `/api/whatsapp/sablonlar/test` POST (test gönderim)
4. Yetki: `whatsapp.sablon.yonet`

**Commit:** `feat(whatsapp): sablon CRUD API`

### ADIM 4: Şablon Yönetim UI
1. `app/whatsapp/sablonlar/page.tsx`
2. `SablonListesi.tsx`
3. `SablonEditoru.tsx`
4. `SablonOnizleme.tsx` (canlı önizleme)
5. Değişken tıklayınca cursor'a ekle

**Commit:** `feat(whatsapp): sablon yonetim sayfasi`

### ADIM 5: Müşteri Filtreleme API
1. `/api/whatsapp/musteriler-filtre` GET
2. Parametre: durum, etiket, şehir, borç limit
3. Telefon olmayanları işaretle (uyarı için)

**Commit:** `feat(whatsapp): musteri filtre API`

### ADIM 6: Toplu Gönderim Wizard - İskelet
1. `app/whatsapp/toplu/page.tsx`
2. `TopluGonderimWizard.tsx` (4 adım state)
3. İskelet adımlar (boş)

**Commit:** `feat(whatsapp): toplu gonderim wizard iskeleti`

### ADIM 7: Adım 1 + 2 (Şablon + Hedef)
1. `SablonSecAdimi.tsx`
2. `HedefSecAdimi.tsx`
3. Filtre + çoklu seçim
4. Excel/CSV yükleme (basit, opsiyonel)

**Commit:** `feat(whatsapp): wizard adim 1 ve 2`

### ADIM 8: Adım 3 + 4 (Önizleme + Gönderim) ⭐
1. `OnizlemeAdimi.tsx` (ilk 3 müşterinin mesajları)
2. `GonderimAdimi.tsx` (canlı ilerleme)
3. `window.open()` ile sıralı açma
4. Saniye arası ayarı
5. Duraklat/Durdur/Atla

**Commit:** `feat(whatsapp): wizard adim 3 ve 4 (canli gonderim)`

### ADIM 9: Geçmiş Kayıt + Sayfası
1. Gönderim sonrası DB'ye kaydet
2. `app/whatsapp/gecmis/page.tsx`
3. `GecmisTablosu.tsx`
4. Filtreleme + detay modal
5. Audit log entegrasyonu

**Commit:** `feat(whatsapp): gonderim gecmisi sayfasi`

### ADIM 10: Test + Polish
1. `pnpm tsc --noEmit`
2. `pnpm build`
3. Test:
   - Şablon oluştur, düzenle, sil
   - Filtreleme + çoklu seçim
   - Mesaj önizleme doğru mu?
   - wa.me linki açılıyor mu?
   - Geçmişe kaydoluyor mu?
   - KUTSAL tahsilat bozulmadı mı?
4. Audit log kayıtları kontrol

**Commit:** `test(whatsapp): faz 8 dogrulandi`

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

### Şablonlar
- [ ] 8 hazır şablon seed edildi
- [ ] Yeni şablon eklenebiliyor
- [ ] Düzenle/Sil çalışıyor
- [ ] Test gönder çalışıyor
- [ ] Karakter sayacı doğru
- [ ] Değişken yapıştırma çalışıyor

### Toplu Gönderim
- [ ] 4 adım wizard akıyor
- [ ] Filtre çalışıyor (durum/etiket/şehir/borç)
- [ ] Çoklu seçim
- [ ] Önizleme doğru (ilk 3 müşteri)
- [ ] wa.me linki doğru oluşuyor
- [ ] `window.open()` çalışıyor
- [ ] Sıralı açma (saniye arası)
- [ ] Duraklat/Durdur/Atla
- [ ] Sonuç özeti

### Telefonsuz Müşteri
- [ ] Telefon yoksa otomatik atlanıyor
- [ ] Uyarı gösteriliyor: "X müşterinin telefonu yok"

### Geçmiş
- [ ] Gönderim sonrası kayıt
- [ ] Liste filtreleme
- [ ] Detay modalı
- [ ] Audit log

### Mevcut Sistem
- [ ] **KUTSAL tahsilat** çalışıyor
- [ ] FAZ 4 müşteri tab
- [ ] FAZ 5 sidebar
- [ ] FAZ 6 dashboard
- [ ] FAZ 7 hisse atama

---

## ⚠️ ÖNEMLİ NOTLAR

### 1. Spam Önleme
WhatsApp ToS'a uygun olmalı:
- ✅ Kullanıcı her mesajı manuel gönderiyor (otomatik DEĞİL)
- ✅ Müşteri sayısı limiti yok (kullanıcı kontrolünde)
- ⚠️ Saniye arası min 1sn (çok hızlı yapma, ban riski)

### 2. Telefonsuz Müşteri Yönetimi
240 müşterinin hepsinde telefon olmayabilir. **Otomatik atla**, uyarı göster:
```
"Filtrenize uyan 286 müşterinin 31'inde telefon yok.
255 müşteriye gönderim yapılacak."
```

### 3. Telefon Formatı
Türkiye için: `0XXX XXX XX XX` → `90XXXXXXXXXX`
```typescript
// "0532 123 45 67" → "905321234567"
// "+90 532 123 4567" → "905321234567"
// "5321234567" → "905321234567"
```

### 4. Mesaj Karakter Limiti
WhatsApp: **4096 karakter**. Şablon editöründe sayaç + uyarı.

### 5. Yetki Kontrolü
- **admin:** Hepsi
- **kasiyer:** Toplu gönderim yapabilir, şablon düzenleyemez
- **izleyici:** Sadece geçmiş görüntüleme

### 6. Audit Log
Her toplu gönderim:
```typescript
await auditLog({
  eylem: 'whatsapp_toplu_gonderim',
  detaylar: {
    sablonId,
    sablonAd,
    hedefSayisi,
    acilanSayisi,
  },
});
```

### 7. Performans
- 286 müşteri filtreleme: hızlı (DB index var)
- 286 wa.me link üretimi: client-side, anlık
- Gönderim: kullanıcı hızına bağlı (her müşteri 3sn = 14 dk)

### 8. Bayram Tebriği Özel
240 müşteri için bayram tebriği = ~12 dakika. Bayram öncesi mantıklı.

---

## 📊 RAPOR ŞABLONU (Tamamlandığında)

```markdown
# FAZ 8 TAMAMLANDI — WhatsApp Toplu Gönderim

## ✅ Tamamlanan
- [x] DB: WhatsAppSablonu + WhatsAppGonderim
- [x] 8 hazır şablon seed
- [x] Şablon yönetim sayfası
- [x] Toplu gönderim wizard (4 adım)
- [x] Müşteri filtreleme
- [x] wa.me link üretici
- [x] Canlı gönderim ilerleme
- [x] Gönderim geçmişi

## 🧪 Test Sonuçları
- pnpm tsc --noEmit: ✅
- pnpm build: ✅
- 6 API endpoint canlı: ✅
- KUTSAL tahsilat: ✅
- Mevcut sistemler: ✅

## 📦 Git
- Toplam commit: X
- Push: ✅

## 🎯 Sıradaki Adım
FAZ 9 (TV Kesim Ekranı SSE) için hazır.
```

---

## 🚀 BAŞLA

Otonom modda çalış. Her adımda commit at. Sorun olursa dur ve sor.

**Tahmini süre:** 2-3 saat

**Bayrama:** ~9 gün. Bu prompt biter bitmez **FAZ 9** ile devam.

**Hayırlı kodlar! 🐂✨**
