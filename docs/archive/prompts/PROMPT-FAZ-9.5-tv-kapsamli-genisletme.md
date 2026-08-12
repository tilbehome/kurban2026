---
id: ARCH-F19478310EB1
status: ARCHIVED
owner: Historical
source_role: historical_record
source_of_truth: false
last_reviewed: not_applicable
verified_against_commit: not_applicable
---

# PROMPT-FAZ-9.5: TV KAPSAMLI GENİŞLETME

> **FAZ 9 v2 (temel TV) bittiğinde Claude Code'a ver.**
> **Otonom modda çalıştır. Her adımda commit at.**

---

## 🎯 AMAÇ

FAZ 9 v2 ile temel TV ekranı yapıldı. Şimdi **profesyonel kesim operasyon merkezi** seviyesine çıkar:
1. **Müşteri telefon görünümü** (kendi sırası vurgulu, akıllı arama)
2. **Personel telefon arayüzü** (operasyon butonları)
3. **Admin kontrol paneli geliştirme** (TV önizleme + senkron)
4. **Push notification** (browser)
5. **WhatsApp otomatik bildirim** (aşama değiştiğinde)
6. **Sesli anons** (Web Speech API)
7. **Kurban bazlı kartlar** (dana → hisse mantığı)
8. **Akıllı arama** (DANA-18, 18, kurban 18 hepsi bulur)
9. **Senkronizasyon** (tek SSE → admin + TV + personel + müşteri)

**Vizyon:** Türkiye'de **rakipsiz**, kesintisiz, profesyonel kesim takip sistemi.

---

## ⚠️ KORUNACAKLAR

**KESİNLİKLE BOZMA:**
- ✅ FAZ 9 v2'nin yaptığı her şey (TV layout, KPI, 4 sütun, SSE, light/dark)
- ✅ KUTSAL tahsilat akışı
- ✅ FAZ 4-8 tüm özellikler
- ✅ Audit log + granular izinler
- ✅ Soft delete + MIMARI.md uyumu

**ÜZERINE EKLE:**
Mevcut TV ekranını genişlet, yeniden yazma. Senin yaptığın komponentleri **kullanarak** yeni özellikler ekle.

---

## 📋 MİMARİ DEĞİŞİKLİĞİ: KURBAN BAZLI MANTIK

### Önemli: İşlemler Kurban Bazlı, Hisse Bazlı Değil!

**Eski mantık (yanlış):**
```
Hisse-1 kesimde, Hisse-2 sırada, Hisse-3 bekliyor
```

**Yeni mantık (doğru):**
```
KURBAN/DANA bazlı işlem:
- DANA-18 kesimde (7 hissesi var, hepsi aynı anda kesiliyor)
- DANA-21 sırada (5 hissesi var)
- DANA-9 bekliyor

Tartım sonrası HİSSE bazlı:
- DANA-18'in 7 hissesi paketleniyor
- Mehmet'in hissesi hazır, teslim noktası 1
- Ahmet'in hissesi hazır, teslim noktası 2
```

### DB Schema Düzeltmesi

**`prisma/schema.prisma`** — `Hayvan` (kurban) modeline ekle:

```prisma
model Hayvan {
  // ... mevcut alanlar

  // KESİM TAKİP - KURBAN BAZLI (YENİ)
  kesimDurumu      KesimDurumu  @default(beklemede)
  kesimSirasi      Int?          // Sıra numarası
  asama            String?       // "Kesim Hazırlık" | "Kesim" | "Deri Yüzme" | "Parçalama" | "Tartım"
  ilerlemeYuzde    Int           @default(0)  // 0-100
  kalanSureDk      Int?          // dakika
  kesimBaslama     DateTime?
  kesimBitis       DateTime?
  toplamKg         Float?        // Tartım sonucu
  karkasKg         Float?

  @@index([kesimDurumu])
  @@index([kesimSirasi])
}

// Hisse modeline ekle (paketleme + teslim için):
model Hisse {
  // ... mevcut alanlar

  // PAKETLEME + TESLİM (YENİ)
  paketDurumu      String?       // "Bekliyor" | "Paketlendi" | "Teslim Hazır" | "Teslim Edildi"
  paketKg          Float?        // Bu hisseye düşen et
  teslimNoktasi    String?       // "Teslim Noktası 1"
  teslimTarihi     DateTime?

  @@index([paketDurumu])
}
```

**KesimDurumu enum:**
```prisma
enum KesimDurumu {
  beklemede         // Henüz sıraya alınmadı
  vekalet_bekliyor  // Vekalet onayı bekleniyor
  siradaki          // Sırada
  hazirlik          // Kesim hazırlık
  kesimde           // Kesim aşamasında
  deri_yuzme        // Deri yüzme
  parcalama         // Parçalama
  tartimda          // Tartım
  paketleme         // Paketleme (hisse bazlı başlıyor)
  teslime_hazir     // Tamamen paketlendi, teslim aşaması
  tamamlandi        // Tüm hisseleri teslim edildi
  iptal             // İptal
}
```

**Migration:** `kurban-bazli-kesim-takip`

---

## 🎯 4 ANA YENİLİK

---

### 🌟 YENİLİK 1: MÜŞTERİ TELEFONU GÖRÜNÜMÜ

**URL:** `/tv/m` (mobil optimize)

#### Giriş Ekranı (Çoklu Yöntem)

```typescript
// /tv/m/giris/page.tsx
"5 farklı giriş yolu":
1. QR Kod Okut (camera)
2. Müşteri No (000286)
3. Telefon Numarası (0532...)
4. 4 Haneli Geçici Kod
5. Dana/Kurban Numarası (18) ⭐
6. Misafir Girişi (hiç bilgi yok)
```

**Akıllı Arama Mantığı:**
```typescript
// shared/lib/musteri-bul.ts
async function musteriBul(input: string) {
  const temiz = input.trim().toLowerCase();

  // 1. Dana no? (sadece sayı, 1-3 hane)
  if (/^(dana[\s-]*)?(kurban[\s-]*)?(\d{1,3})$/i.test(temiz)) {
    const danaNo = temiz.replace(/[^\d]/g, '');
    return await danaBul(parseInt(danaNo));
  }

  // 2. Müşteri no? (000286, 6 hane)
  if (/^\d{6}$/.test(temiz)) {
    return await musteriBulNo(temiz);
  }

  // 3. Telefon? (0532..., 11 hane)
  if (/^0\d{10}$/.test(temiz)) {
    return await musteriBulTelefon(temiz);
  }

  // 4. Geçici kod? (4 hane)
  if (/^\d{4}$/.test(temiz)) {
    return await gecicikKodKontrol(temiz);
  }

  return null;
}
```

**Test girişler:**
- `"18"` → DANA-18 bulur
- `"dana 18"` → DANA-18 bulur
- `"kurban 18"` → DANA-18 bulur
- `"DANA-18"` → DANA-18 bulur
- `"000286"` → Mehmet Yılmaz bulur
- `"<EXAMPLE_PHONE>"` → Mehmet Yılmaz bulur
- `"4729"` → geçici kod ile bulur

#### Müşteri Ana Görünümü

**Layout: Mobil optimize, vertical scroll**

```
┌─────────────────────────┐
│  🐂 TilbeCore           │
│  Sıra Takip - DANA-18   │
├─────────────────────────┤
│                          │
│  ⭐ KENDİ HİSSEN ⭐      │  ← Vurgu
│                          │
│  ╔════════════════════╗ │
│  ║                    ║ │
│  ║   DANA-18           ║ │  ← Büyük
│  ║   🔪 KESİMDE       ║ │
│  ║                    ║ │
│  ║   Hisse: 3/7        ║ │
│  ║   Sahip: Mehmet     ║ │
│  ║                    ║ │
│  ║   ⏰ Tahmini:       ║ │
│  ║   ~25 dakika        ║ │
│  ║                    ║ │
│  ║   [████████░] %62   ║ │
│  ║                    ║ │
│  ╚════════════════════╝ │
│                          │
│  🔔 BİLDİRİM AL           │  ← Push izin
│  [Bildirimleri Aç]      │
│                          │
├─────────────────────────┤
│                          │
│  📊 TÜM KESİM DURUMU    │  ← Tüm liste
│                          │
│  🔪 ŞU AN KESİMDE       │
│  • DANA-18 (sen)         │
│  • DANA-21               │
│  • DANA-9                │
│                          │
│  ⏳ SIRADA               │
│  • DANA-22               │
│  • DANA-15               │
│  • ...                   │
│                          │
│  ✅ TAMAMLANANLAR         │
│  Toplam: 214             │
│                          │
└─────────────────────────┘
```

**Önemli detaylar:**
- ✅ Müşteri kendi danasını **vurgulu** görür
- ✅ Diğerlerini de görür (genel durum)
- ✅ Tahmini süre algoritması
- ✅ Push notification butonu
- ✅ Mobil optimize (touch-friendly)
- ✅ Anonim mod (telefon/TC gizli)

#### Push Notification

```typescript
// Browser permission iste
async function pushIzin() {
  if (!('Notification' in window)) return;

  const izin = await Notification.requestPermission();
  if (izin === 'granted') {
    // Server'a kayıt et
    await fetch('/api/tv/push-kayit', {
      method: 'POST',
      body: JSON.stringify({ musteriId, endpoint: pushSubscription })
    });
  }
}

// Push gönder
function pushBildir(baslik: string, mesaj: string) {
  new Notification(baslik, {
    body: mesaj,
    icon: '/logo.png',
    badge: '/badge.png',
    vibrate: [200, 100, 200],
    tag: 'kurban-bildirim',
  });
}
```

**Push Mesaj Senaryoları:**
1. `"DANA-18 kesime alındı! 🔪"` (kesim başladı)
2. `"DANA-18 tartım aşamasında ⚖️"` (tartım)
3. `"Hisseniz hazır! Teslim noktasına gelin 🎉"` (teslim)
4. `"5 dakika içinde sıranız geliyor ⏰"` (yaklaşıyor)

---

### 🌟 YENİLİK 2: PERSONEL TELEFON ARAYÜZÜ

**URL:** `/tv/personel` (personel mobil)

#### Personel Giriş
- Mevcut kullanıcı adı/şifre ile
- Rol: `personel_kesim` veya `personel_tartim` veya `personel_teslim`

#### Personel Ana Görünüm

```
┌─────────────────────────┐
│  👨‍🔧 Personel: Mehmet K. │
│  Görev: Kesim Aşaması    │
├─────────────────────────┤
│                          │
│  AKTİF KURBANLAR (3)    │
│                          │
│  ┌────────────────────┐ │
│  │ DANA-18  🔪 Kesim  │ │
│  │ Sıra No: 41        │ │
│  │ %62 - 8 dk         │ │
│  │ [Sonraki Aşamaya]  │ │  ← Tek tık
│  │ [İlerle %10]        │ │
│  │ [⚠️ Sorun Bildir]  │ │
│  └────────────────────┘ │
│                          │
│  ┌────────────────────┐ │
│  │ DANA-21  ✂️ Deri   │ │
│  │ Sıra No: 37        │ │
│  │ %48 - 12 dk        │ │
│  │ [Sonraki Aşamaya]  │ │
│  │ [İlerle %10]        │ │
│  └────────────────────┘ │
│                          │
│  ┌────────────────────┐ │
│  │ DANA-9   🔪 Parçal.│ │
│  │ Sıra No: 28        │ │
│  │ %36 - 15 dk        │ │
│  │ [Sonraki Aşamaya]  │ │
│  └────────────────────┘ │
│                          │
├─────────────────────────┤
│  [+ Yeni Kurban Başlat] │
│  [📋 Tüm Listeyi Gör]   │
│  [📊 Performansım]      │
└─────────────────────────┘
```

#### Tek Tık İlerleme

```typescript
// Component: PersonelKurbanKart
function PersonelKurbanKart({ kurban }) {
  const sonrakiAsama = useMemo(() => {
    const akis = ['vekalet_bekliyor', 'hazirlik', 'kesimde',
                  'deri_yuzme', 'parcalama', 'tartimda', 'paketleme'];
    const mevcutIdx = akis.indexOf(kurban.kesimDurumu);
    return akis[mevcutIdx + 1];
  }, [kurban]);

  const sonrakiyeGec = async () => {
    // Optimistic update (anında ekranda göster)
    setYerel((eski) => ({ ...eski, kesimDurumu: sonrakiAsama }));

    // API çağrısı
    try {
      await fetch('/api/tv/asama-degistir', {
        method: 'POST',
        body: JSON.stringify({
          kurbanId: kurban.id,
          yeniAsama: sonrakiAsama,
          personelId: session.userId,
        }),
      });

      // Sesli anons
      sesliAnons(`DANA-${kurban.no}, ${asamaMetni(sonrakiAsama)} aşamasına geçti`);

      // Toast
      toast.success(`DANA-${kurban.no} → ${asamaMetni(sonrakiAsama)}`);
    } catch (err) {
      // Geri al
      setYerel((eski) => ({ ...eski, kesimDurumu: kurban.kesimDurumu }));
      toast.error('Bir hata oluştu, tekrar deneyin');
    }
  };

  return (
    <div className="kurban-kart">
      ...
      <Button onClick={sonrakiyeGec} className="buyuk-buton">
        Sonraki Aşamaya Geç →
      </Button>
    </div>
  );
}
```

---

### 🌟 YENİLİK 3: ADMİN KONTROL PANELİ GELİŞMİŞ

**URL:** `/tv/kontrol` (FAZ 9 v2'de zaten temel var, GENİŞLET)

#### Yeni Özellikler

##### A) TV Canlı Önizleme (Iframe)

```typescript
// Admin sayfanın yanında küçük iframe
<div className="tv-onizleme">
  <iframe
    src="/tv?mode=onizleme"
    className="w-full aspect-video"
  />
  <p className="text-xs">TV ekranı canlı önizleme</p>
</div>
```

##### B) Drag-Drop Sıra Değiştirme

Personel **sırayı değiştiremez**, sadece admin:

```
Sıradaki Kurbanlar (drag ile sırala):

[1] 🐂 DANA-22  ━━━━━━━━━━━ (sürüklenebilir)
[2] 🐂 DANA-15  ━━━━━━━━━━━
[3] 🐂 DANA-44  ━━━━━━━━━━━
[4] 🐂 DANA-7   ━━━━━━━━━━━
[5] 🐂 DANA-33  ━━━━━━━━━━━

Sürükle-bırak → yeni sıra → DB güncellenir → TV anında değişir
```

##### C) Toplu İşlemler

```typescript
// 5 kurbanı tek seferde "siradaki" yap
[Tümünü Seç] [Sıradakı Yap] [Beklemede Yap]

[ ] DANA-22
[ ] DANA-15
[ ] DANA-44
[✓] DANA-7
[✓] DANA-33

[Seçilenleri Sıraya Al]
```

##### D) Acil Durum Modu

```
[🚨 ACİL DURDUR]  ← Tek buton

Tıklanınca:
1. TV'de "MOLA" yazısı
2. Personellere bildirim
3. Push notification müşterilere
4. 5 dakika sayaç (otomatik geri açılır)
5. Manuel "Devam Et" butonu
```

##### E) Hisse Sahipleri Yönetimi

Her dana detayında **7 hissenin** durumu:

```
DANA-18 Detay:
─────────────────

Genel: Kesim aşaması %62

Hisseler:
1. ⭐ Mehmet Yılmaz   - Hisse 3 - Paket: ⏳
2. Ahmet Demir       - Hisse 1 - Paket: ⏳
3. Hasan Kaya        - Hisse 5 - Paket: ⏳
4. Fatma Şahin       - Hisse 2 - Paket: ⏳
5. Ali Gürbüz        - Hisse 4 - Paket: ⏳
6. Ayşe Kara         - Hisse 6 - Paket: ⏳
7. Veli Öz           - Hisse 7 - Paket: ⏳

[Toplu Paketleme] [Tartım Detayı]
```

---

### 🌟 YENİLİK 4: BİLDİRİM SİSTEMİ (3 KANAL)

#### A) Push Notification (Browser)

```typescript
// shared/lib/push-bildirim.ts
export async function pushBildir({
  musteriId,
  baslik,
  mesaj,
  url,
}: PushBildirim) {
  // Müşterinin push subscription'ını DB'den çek
  const subscription = await prisma.pushAbonelik.findFirst({
    where: { musteriId, aktif: true }
  });

  if (!subscription) return;

  // Web Push gönder
  await webpush.sendNotification(
    subscription,
    JSON.stringify({ baslik, mesaj, url })
  );

  // DB'ye kayıt
  await prisma.bildirimLog.create({
    data: { musteriId, kanal: 'push', baslik, mesaj }
  });
}
```

#### B) WhatsApp Otomatik

```typescript
// shared/lib/whatsapp-otomatik.ts
export async function whatsappBildir({
  musteriId,
  sablon, // 'kesim_basladi' | 'hazir' | 'sira_yaklasti'
  degiskenler,
}: WhatsAppBildirim) {
  // Şablonu DB'den çek
  const sablonKaydi = await prisma.whatsAppSablonu.findUnique({
    where: { kod: sablon }
  });

  // Değişkenleri çöz
  const mesaj = cozumle(sablonKaydi.icerik, degiskenler);

  // wa.me link üret
  const musteri = await prisma.musteri.findUnique({ where: { id: musteriId } });
  const link = urettWaLink(musteri.telefon, mesaj);

  // Bildirim kuyruğuna ekle (admin manuel açacak)
  await prisma.whatsAppKuyruk.create({
    data: { musteriId, link, sablon, durum: 'beklemede' }
  });

  // Admin paneline bildirim
  // (admin "Gönder" butonuna basacak)
}
```

**WhatsApp Şablonları (Otomatik):**
1. `kesim_basladi` — "Sayın {ad}, DANA-{no} kesime alındı 🔪"
2. `tartim_basladi` — "Sayın {ad}, DANA-{no} tartım aşamasında ⚖️"
3. `paket_hazir` — "Sayın {ad}, hisseniz hazır! Teslim noktasına gelin 🎉"
4. `sira_yaklasti` — "Sayın {ad}, 5 dakika içinde sıranız geliyor ⏰"
5. `gecikme_uyari` — "Sayın {ad}, etinizi almaya unutmayın 🛒"

#### C) Sesli Anons (Web Speech API)

```typescript
// shared/lib/sesli-anons.ts
export function sesliAnons(metin: string, opsiyonlar: AnonsOpsiyon = {}) {
  if (!('speechSynthesis' in window)) return;

  const utterance = new SpeechSynthesisUtterance(metin);
  utterance.lang = 'tr-TR';        // Türkçe
  utterance.rate = opsiyonlar.hiz ?? 0.9;
  utterance.pitch = opsiyonlar.tiz ?? 1.0;
  utterance.volume = opsiyonlar.ses ?? 1.0;

  // Türkçe ses bul
  const sesler = speechSynthesis.getVoices();
  const turkceSes = sesler.find(s => s.lang === 'tr-TR');
  if (turkceSes) utterance.voice = turkceSes;

  speechSynthesis.speak(utterance);
}

// Anons örnekleri
sesliAnons('Sıra 18, Mehmet Yılmaz, hisseniz hazır');
sesliAnons('Sıra 21, Ahmet Demir, kesim aşamasına geçtiniz');
sesliAnons('Tüm müşteriler dikkat, mola verildi');
```

**Anons Senaryoları:**
- Yeni kurban kesime alındı → "Sıra X, kesim başladı"
- Tartım bitti → "Sıra X, hisseleri paketleniyor"
- Teslim hazır → "Sıra X, Müşteri adı, hisseniz hazır"
- Acil durum → "Dikkat, mola verildi"

**Ayar:**
- Anons aç/kapat toggle (admin panelden)
- Ses seviyesi
- Hız ayarı
- Türkçe varsayılan

---

## 🗂️ DOSYA YAPISI (Yeni)

### Yeni Component'lar

```
modules/tv/
├── components/
│   ├── musteri/                       ← YENİ klasör
│   │   ├── MusteriGiris.tsx           ← 5 yöntemli giriş
│   │   ├── MusteriArama.tsx           ← Akıllı arama
│   │   ├── MusteriAnaGorunum.tsx      ← Telefonda ana ekran
│   │   ├── KendiHissesiVurgu.tsx      ← Vurgulu kart
│   │   ├── MusteriGenelDurum.tsx      ← Diğer kurbanlar listesi
│   │   └── PushIzinKart.tsx           ← Bildirim izin butonu
│   │
│   ├── personel/                      ← YENİ klasör
│   │   ├── PersonelGiris.tsx          ← Kullanıcı/şifre giriş
│   │   ├── PersonelAnaGorunum.tsx     ← Telefonda ana ekran
│   │   ├── PersonelKurbanKart.tsx     ← Tek tık ilerleme kartı
│   │   ├── PersonelPerformans.tsx     ← Kendi performansı
│   │   └── SorunBildirModal.tsx       ← Sorun bildirimi
│   │
│   ├── admin/                         ← Genişlet (FAZ 9 v2'de var)
│   │   ├── TvOnizleme.tsx             ← Canlı iframe
│   │   ├── SiraYonetimi.tsx           ← Drag-drop sıra
│   │   ├── ToplulIslem.tsx            ← Toplu işlem
│   │   ├── AcilDurumPaneli.tsx        ← Acil durdur
│   │   └── HisseSahipleriListe.tsx    ← Dana detay
│   │
│   └── shared/
│       ├── KurbanKart.tsx             ← Ortak kurban kartı (dana bazlı)
│       ├── HisseKart.tsx              ← Ortak hisse kartı (teslim için)
│       └── BildirimDinleyici.tsx      ← Push notification dinleyici
│
├── lib/
│   ├── musteri-bul.ts                  ← Akıllı arama
│   ├── push-bildirim.ts                ← Push API
│   ├── whatsapp-otomatik.ts            ← WhatsApp şablonlu
│   ├── sesli-anons.ts                  ← Web Speech API
│   ├── tahmin-sure.ts                  ← Tahmini süre algoritması
│   └── asama-akisi.ts                  ← Kurban → hisse geçişi
│
└── hooks/
    ├── usePushIzin.ts
    ├── useSeslicAnons.ts
    └── useTahminSure.ts
```

### Yeni Sayfalar

```
app/tv/
├── m/                                  ← Müşteri (mobile)
│   ├── page.tsx                        ← Giriş ekranı
│   ├── giris/page.tsx                  ← 5 yöntemli giriş
│   └── [danaNo]/page.tsx               ← DANA-X görünümü
│
├── personel/                           ← Personel (mobile)
│   ├── page.tsx                        ← Ana görünüm
│   ├── giris/page.tsx                  ← Kullanıcı şifre
│   └── kurban/[id]/page.tsx            ← Kurban detay
│
└── kontrol/                            ← Admin (FAZ 9 v2'de var, GENİŞLET)
    └── page.tsx                        ← Ek özellikler eklendi
```

### Yeni API'ler

```
app/api/tv/
├── ... (mevcut endpoints)
├── musteri-bul/route.ts                ← Akıllı arama
├── asama-degistir/route.ts             ← POST: aşama
├── sira-degistir/route.ts              ← POST: sıra (drag-drop)
├── toplu-islem/route.ts                ← POST: toplu durum
├── acil-durum/route.ts                 ← POST: acil durdur
├── push-kayit/route.ts                 ← POST: push subscription
├── push-gonder/route.ts                ← POST: push bildirim
├── whatsapp-otomatik/route.ts          ← POST: WhatsApp şablonlu
├── personel-aktif/route.ts             ← GET: aktif personel
├── personel-performans/route.ts        ← GET: performans
└── tahmin-sure/route.ts                ← GET: tahmin algoritması
```

---

## 🎯 UYGULAMA SIRASI (15 ADIM)

### ADIM 1: DB Schema Güncelleme
1. Hayvan modeline kesim alanları
2. Hisse modeline paket alanları
3. PushAbonelik modeli (yeni)
4. BildirimLog modeli (yeni)
5. Migration: `kurban-bazli-kesim-takip`

**Commit:** `feat(db): kurban bazli kesim + push abonelik`

### ADIM 2: Akıllı Arama (Müşteri Bul)
1. `shared/lib/musteri-bul.ts`
2. Tüm giriş formatları destekli
3. Test: 5 farklı format

**Commit:** `feat(tv): akilli musteri arama`

### ADIM 3: Müşteri Giriş Ekranı
1. `app/tv/m/giris/page.tsx`
2. 5 yöntemli kart layout
3. Form validation

**Commit:** `feat(tv): musteri giris ekrani (5 yontem)`

### ADIM 4: Müşteri Ana Görünüm
1. `app/tv/m/[danaNo]/page.tsx`
2. `MusteriAnaGorunum.tsx`
3. Kendi hissesi vurgusu
4. Genel durum (diğer kurbanlar)
5. Tahmini süre

**Commit:** `feat(tv): musteri ana gorunum (vurgulu + genel)`

### ADIM 5: Personel Giriş + Ana
1. `app/tv/personel/giris/page.tsx`
2. `app/tv/personel/page.tsx`
3. Aktif kurbanları listele

**Commit:** `feat(tv): personel giris ve ana gorunum`

### ADIM 6: Personel Kurban Kartı (Tek Tık)
1. `PersonelKurbanKart.tsx`
2. "Sonraki Aşamaya Geç" butonu
3. Optimistic UI update
4. Sorun bildirim modal

**Commit:** `feat(tv): personel kurban kart (tek tik islem)`

### ADIM 7: Aşama Değiştirme API
1. `/api/tv/asama-degistir` POST
2. Kurban bazlı veya hisse bazlı (akıllı)
3. SSE event tetikle (tüm cihazlar güncellenir)
4. Audit log

**Commit:** `feat(tv): asama degistir api`

### ADIM 8: Sıra Yönetimi (Admin)
1. `SiraYonetimi.tsx` (drag-drop)
2. `/api/tv/sira-degistir` POST
3. Optimistic update
4. SSE tetikle

**Commit:** `feat(tv): admin sira drag-drop`

### ADIM 9: Toplu İşlem + Acil Durum
1. `ToplulIslem.tsx`
2. `AcilDurumPaneli.tsx`
3. API'ler

**Commit:** `feat(tv): toplu islem ve acil durum`

### ADIM 10: Push Notification Altyapısı
1. `web-push` paketi (npm)
2. VAPID key üret
3. `/api/tv/push-kayit` POST
4. `/api/tv/push-gonder` POST
5. Service worker (basit)

**Commit:** `feat(tv): push notification altyapisi`

### ADIM 11: Push İzin + Bildirim
1. `PushIzinKart.tsx` (müşteri)
2. `usePushIzin` hook
3. Test bildirim gönder

**Commit:** `feat(tv): push izin ve test bildirim`

### ADIM 12: WhatsApp Otomatik
1. `whatsapp-otomatik.ts`
2. 5 şablon (kod'la eşleşen)
3. Kuyruk sistemi (admin manuel açacak)
4. `/api/tv/whatsapp-otomatik` POST
5. UI: Admin "Kuyruğu Aç" butonu

**Commit:** `feat(tv): whatsapp otomatik bildirim`

### ADIM 13: Sesli Anons (Web Speech)
1. `sesli-anons.ts`
2. `useSeslicAnons` hook
3. Aşama değişikliklerinde otomatik
4. Admin: aç/kapat toggle + ses ayarı

**Commit:** `feat(tv): sesli anons (web speech api)`

### ADIM 14: TV Önizleme + Senkron Test
1. `TvOnizleme.tsx` (admin iframe)
2. Test: admin değişiklik → TV anında günceller
3. Test: 4 cihaz senkron
4. Test: bağlantı kopukluğu

**Commit:** `feat(tv): canli senkron testler`

### ADIM 15: Final Test + Polish
1. `pnpm tsc --noEmit`
2. `pnpm build`
3. Tüm 4 cihaz tip test
4. Mobile responsive
5. Hata yönetimi
6. Audit log entegrasyonu
7. Performance kontrolü

**Commit:** `test(tv): faz 9.5 dogrulandi`

### Final: Push

```bash
git push origin main
```

---

## ✅ TEST CHECKLİSTİ

### Müşteri Telefon
- [ ] 5 giriş yöntemi çalışıyor
- [ ] "18" yazınca DANA-18 bulur
- [ ] "DANA-18" yazınca da bulur
- [ ] Müşteri No ile giriş
- [ ] Telefon ile giriş
- [ ] Misafir giriş
- [ ] Kendi hissesi vurgulu
- [ ] Genel durum görünüyor
- [ ] Push izin alma
- [ ] Push bildirim alma

### Personel Telefon
- [ ] Mevcut kullanıcı/şifre ile giriş
- [ ] Aktif kurbanlar görünüyor
- [ ] "Sonraki Aşamaya Geç" çalışıyor
- [ ] "İlerle %10" çalışıyor
- [ ] Sorun bildirim modal
- [ ] Performans ekranı

### Admin Bilgisayar
- [ ] TV önizleme iframe
- [ ] Drag-drop sıra değişiyor
- [ ] Toplu işlem çalışıyor
- [ ] Acil durum butonu
- [ ] Hisse sahipleri detayı

### Senkronizasyon
- [ ] Admin'de değişiklik → TV anında güncelleniyor
- [ ] Admin'de değişiklik → personel telefonu güncelleniyor
- [ ] Admin'de değişiklik → müşteri telefonu güncelleniyor
- [ ] Bağlantı kopsa otomatik yeniden bağlanır

### Bildirimler
- [ ] Aşama değişti → push notification
- [ ] Aşama değişti → sesli anons
- [ ] Aşama değişti → WhatsApp kuyruğuna eklenir
- [ ] Admin kuyruktan WhatsApp'ı manuel açabilir

### Kurban Bazlı Mantık
- [ ] DANA tartım'a kadar bütün hareket eder
- [ ] Tartım sonrası hisselere bölünür
- [ ] Her hisse ayrı paketleme + teslim

### Mevcut Sistem
- [ ] FAZ 9 v2 (temel TV) bozulmadı
- [ ] KUTSAL tahsilat çalışıyor
- [ ] FAZ 4-8 hiçbir şey bozulmadı

---

## ⚠️ ÖNEMLİ NOTLAR

### 1. Kurban Bazlı vs Hisse Bazlı
- TARTIMA KADAR: Kurban bazlı (1 dana = 7 hisse aynı anda)
- TARTIM SONRASI: Hisse bazlı (her hisse ayrı paketleniyor + teslim)

### 2. Optimistic UI
Personel butona tıklayınca **anında ekrana yansısın**, server'a yazma arka planda. Bu hız hissi verir.

### 3. SSE Tek Kanal
Tek `/api/tv/yayin` SSE endpoint'i. Admin değişiklik yapınca → DB güncelle → SSE event tetikle → tüm bağlı cihazlar günceller.

### 4. Push Notification Limit
- 1000+ müşteri olsa bile sorun yok
- Web Push ücretsiz (Google FCM altyapı)
- Service worker browser'da çalışır

### 5. Sesli Anons Türkçe
Türkçe ses bulunamayabilir bazı tarayıcılarda. Varsayılan İngilizce ses fallback. Test edilmeli.

### 6. WhatsApp Otomatik = Yarı Otomatik
Sistem mesajı **kuyruğa atar**, admin paneline bildirim gelir, admin **manuel** "Gönder" basar. Tam otomatik değil çünkü:
- wa.me ile bot izin yok
- Spam ihtimali
- Admin kontrolü iyidir

### 7. Müşteri Telefon Numarasız
Telefonu olmayan müşteri:
- ❌ Push notification alamaz
- ❌ WhatsApp alamaz
- ✅ Telefon yerine "Sıra No"yu makbuzla görür
- ✅ Web'den manuel girer

### 8. Performans
4 cihaz × SSE = 4 bağlantı. Server tolere eder. 100+ olsa bile sorun yok (modern node.js).

### 9. Acil Durum Modu
- 1 butona basınca her şey duruyor
- TV'de "MOLA" gösterilir
- 5 dakika geri sayım (otomatik geri açılır)
- Manuel "Devam Et" butonu

### 10. Audit Log
Her durum değişikliği:
- Kim yaptı (admin/personel)
- Ne zaman
- Eski durum → yeni durum
- Personel ID
- IP adresi

---

## 📊 RAPOR ŞABLONU (Tamamlandığında)

```markdown
# FAZ 9.5 TAMAMLANDI — TV Kapsamlı Genişletme

## ✅ Tamamlanan
- [x] DB: Kurban bazlı kesim + push abonelik
- [x] Akıllı müşteri arama (5 format)
- [x] Müşteri telefon görünümü
- [x] Personel telefon arayüzü (tek tık)
- [x] Admin kontrol paneli genişletme
- [x] Drag-drop sıra yönetimi
- [x] Toplu işlem + acil durum
- [x] Push notification altyapısı
- [x] WhatsApp otomatik (5 şablon)
- [x] Sesli anons (Web Speech API)
- [x] Senkronizasyon (admin → TV → personel → müşteri)
- [x] TV önizleme (admin iframe)

## 🧪 Test Sonuçları
- pnpm tsc --noEmit: ✅
- pnpm build: ✅
- 4 cihaz senkron: ✅
- Kurban bazlı mantık: ✅
- Push notification: ✅
- WhatsApp kuyruk: ✅
- Sesli anons: ✅
- KUTSAL tahsilat: ✅
- FAZ 9 v2 korundu: ✅

## 📦 Git
- Toplam commit: X
- Push: ✅

## 🎯 Sıradaki Adım
FAZ 10 (Borçlular zenginleştirme) için hazır.
```

---

## 🚀 BAŞLA

Otonom modda çalış. Her adımda commit at. Sorun olursa dur ve sor.

**Tahmini süre:** 8-10 saat

**Bayrama:** ~8-9 gün. Bu prompt biter bitmez **FAZ 10** ile devam.

**Hayırlı kodlar! 🐂✨**
