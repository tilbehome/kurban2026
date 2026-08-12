---
id: ARCH-9F5C2292CCF0
status: ARCHIVED
owner: Historical
source_role: historical_record
source_of_truth: false
last_reviewed: not_applicable
verified_against_commit: not_applicable
---

# SPRINT 6 — Personel Mobil Operasyon Paneli

**Tahmini süre**: 4-6 saat
**Aciliyet**: 🔴 Bayram günü saha operasyonu için kritik
**Bağımlılık**: Sprint 0/1/2 commit edildi (commit `8ef5d7e`)

---

## 🎯 NEDEN BU SPRINT?

Bayram günü Ada Bereket'te aynı anda ~63 kurban kesilecek. Personel kim, ne yapacak?

| Personel Rolü | Görevi | Mobil İhtiyacı |
|---|---|---|
| **Vekalet Alan** | Müşteriden imza/vekalet alır | "Bu kurbana vekalet alındı" tek dokunuş |
| **Kesimhane Şefi** | Sıradakini kesimhaneye yönlendirir | Sıra yönetimi, geçiş onayı |
| **Kasap** | Kurbanı keser | Kesim başladı/bitti, hangi kurban kimde |
| **Deri Yüzme** | Kesim sonrası deri işlemi | "Tamam, parçalamaya geç" |
| **Parçalama** | Karkasları parçalar | Hisselere ayırma |
| **Tartım Personeli** | Toplam kg girer | Sayısal input |
| **Paketleme** | Her hisseyi paketler | 7 hisse tek tek tik |
| **Teslim Personeli** | Müşteri geldi mi? | Hisseyi "teslim edildi" işaretle |

Mevcut `/tv/personel` sayfası bunların hepsini **tek bir akışla** çözmeye çalışıyor ama eksik. Geliştirilecek:

1. Operasyon görevine göre **rol filtresi** (kasap kesimdeki kurbanları görsün, tartım personeli tartımdakileri)
2. Sahada eldivenli el için **büyük dokunma alanları**
3. Sayısal giriş (kg, vekalet sayısı) için **mobil keypad UI**
4. **Sesli bildirim** (yeni iş geldi)
5. **Çevrimdışı queue** (3G zayıflarsa)
6. **Hisse seviyesi** işlemler (paketleme/teslim — şu an sadece kurban seviyesi var)
7. **Aktif iş ekranı** (büyük tek kart, "şu an bu kurbanı kesiyorum")
8. Geri al / iptal / not ekle aksiyonları

---

## ⚠️ PRE-WRITE GATE

Yazmaya başlamadan **rapor et**:

1. **Component yapısı** (dosya ağacı)
2. **Yeni endpoint'ler** (varsa)
3. **Schema değişikliği** var mı? (yeni alan eklenecek mi?)
4. **Rol filtresi mantığı** — `Kullanici.rol` mu, yeni `gorev` alanı mı?
5. **Hangi mevcut dosyalar etkilenecek**
6. **Test stratejisi** (mobil emülatör, real device)

Onayımı bekle, sonra yazmaya başla.

---

## 📱 GENEL UX FELSEFE

### Sahaya Çıkmış Personel Profili

- **Eldiven var** → Touch target en az **48×48 px** (Apple) / **48dp** (Google standart)
- **Eller ıslak/kanlı** → Yanlış tıklama riski → Onay (confirm) gerek ama ekstra adım değil → **basılı tut** veya **swipe** ile onay
- **Hızlı** → Tek ekrandan tüm bilgi → scroll değil → max 5 aksiyon görünür
- **Sesli geri bildirim** → Ekrandaki şeyi görmeden işlem doğruladı mı? → ses ve titreşim
- **Bayram günü Wi-Fi yavaş** → Optimistic update + offline queue

### Tasarım Dilİ

- **Tek el kullanımı** → Önemli butonlar **alt yarımda**
- **Light tema** (kesim alanı parlak, gözler okumalı)
- **Bold tipografi**, büyük rakamlar (DANA-23 → en az 24px)
- **Renk kodları** (durum bazlı, hemen anlaşılır)
- **Yumuşak animasyon** (geçişler net)

---

## 🏗️ MİMARİ

### Mevcut Durum (Sprint Öncesi)

```
/tv/personel
├── Sticky header (rol/sesli toggle/geri)
├── KPI mini cards (Aktif: 0, Sırada: 0)
├── Aktif Kurbanlar list
│   └── PersonelKurbanKart (her birinde sonraki aşama butonu)
├── Sıradakiler list (kompakt)
└── Yenile/TV linkleri
```

**Sorunlar**:
- Aktif kurban olmadığında **bomboş** ekran (görüntüdeki sorun)
- Rol filtresi yok → kesim personeli paketlemedeki kurbanı da görüyor
- Hisse seviyesi işlem yok (paketleme/teslim)
- Sahaya çıkmış personelin hızlı erişmesi gereken şeyler eksik (vekalet, tartım, vb.)
- "Aktif iş" konsepti yok (şu an bu kurbanla ilgileniyorum)
- Geri al / hata düzeltme yok
- Sıralama yönetimi yok (admin'de var, personel'de yok)

### Yeni Yapı (Sprint Sonrası)

```
/tv/personel
├── Üst bar (kompakt: rol seçici / ses / push abone / geri)
├── Rol Seçici Sekmeleri
│   ├── Hepsi
│   ├── Vekalet
│   ├── Kesim
│   ├── Tartım
│   ├── Paketleme
│   └── Teslim
├── Aktif İş Kartı (varsa) — "şu an bunu yapıyorum"
├── Görev Listesi (rol filtresine göre)
│   └── PersonelGorevKart
│       ├── Üst: DANA-X, aşama, geçen süre
│       ├── Orta: özet bilgi (hisse sayısı, müşteri sayısı, kg vs.)
│       ├── Alt: Aksiyon butonları (büyük)
│       └── Detay aç → BottomSheet
└── Alt sticky bar (hızlı erişim: ara, scan, ses)
```

---

## 🎨 GÖRSEL TASARIM

### Tipografi & Renkler

```
Font: Inter (sistemde zaten var)
Yazı boyutları:
  - Kurban no (DANA-XX): 22-24px bold
  - Aşama: 14px medium
  - Süre/metrik: 16px bold tabular
  - Buton: 16px semibold
  - Yardımcı: 12px

Renkler (Ada Bereket #DE0B1E + aşamalar):
  - beklemede:        slate-400
  - vekalet_bekliyor: amber-500
  - siradaki:         purple-500
  - hazirlik:         blue-500
  - kesimde:          red-600 (DE0B1E)
  - deri_yuzme:       orange-500
  - parcalama:        amber-600
  - tartimda:         indigo-500
  - paketleme:        cyan-500
  - teslime_hazir:    emerald-500
  - tamamlandi:       green-600
  - iptal:            slate-400
```

### Boyutlar

```
Mobil viewport target: 375-414px (iPhone SE → 14 Pro Max)
Container max-w: 28rem (md container, telefon ekranına uygun)
Padding: p-4 (16px her tarafta)
Buton min-height: 48px
İkon büyüklük: 20-24px (buton içi)
Kart border-radius: rounded-2xl (16px)
```

---

## 📋 BÖLÜM 1 — ROL FİLTRELEME

### Tasarım Kararı: `gorev` alanı YENI (schema)

`Kullanici.rol` zaten var (admin/kasiyer/izleyici). Ama bayram günü gerçek rol farklı: **kasap**, **tartım personeli**, **paketleyici**. Bu rol bilgisini Kullanici'da tutmalıyız.

**Seçenek A** — Kullanıcının rolüne göre filtre (basit ama eksik)
**Seçenek B** — `Kullanici.gorev` alanı ekle (esnek, doğru) ✅

### Schema Değişikliği

`prisma/schema.prisma`:

```prisma
model Kullanici {
  // ... mevcut alanlar
  rol         String   // "admin" | "kasiyer" | "izleyici"
  gorev       String?  // "vekalet" | "kesim" | "tartim" | "paketleme" | "teslim" | "genel"
                       // null = genel, hepsini görür
  // ...
}
```

Migration: `pnpm prisma migrate dev --name kullanici_gorev_ekle`

### Görev Tanımları

```ts
// modules/tv/lib/personel-gorev.ts (yeni)

export type PersonelGorev =
  | "vekalet"      // Müşteriden vekalet alma
  | "kesim"        // Kesim öncesi/sırası
  | "tartim"       // Tartım girişi
  | "paketleme"    // Hisse paketleme
  | "teslim"       // Hisse teslim
  | "genel";       // Hepsi

export const GOREV_ETIKETLERI: Record<PersonelGorev, string> = {
  vekalet: "Vekalet Alan",
  kesim: "Kasap",
  tartim: "Tartım Personeli",
  paketleme: "Paketleyici",
  teslim: "Teslim Personeli",
  genel: "Genel Operasyon",
};

export const GOREV_IKONLARI = {
  vekalet: ScrollText,  // lucide
  kesim: Beef,
  tartim: Scale,
  paketleme: Package,
  teslim: PackageCheck,
  genel: Boxes,
};

// Hangi aşamalar bu göreve düşer?
export const GOREV_ASAMALARI: Record<PersonelGorev, string[]> = {
  vekalet: ["vekalet_bekliyor"],
  kesim: ["siradaki", "hazirlik", "kesimde", "deri_yuzme", "parcalama"],
  tartim: ["tartimda"],
  paketleme: ["paketleme"],
  teslim: ["teslime_hazir", "tamamlandi"],
  genel: ["vekalet_bekliyor", "siradaki", "hazirlik", "kesimde", "deri_yuzme",
          "parcalama", "tartimda", "paketleme", "teslime_hazir"],
};
```

### Görev Seçici UI

Üst barda sekme şeklinde (horizontal scrollable):

```
┌────────────────────────────────────────────────────────┐
│  [👁 Hepsi] [📜 Vekalet] [🔪 Kasap] [⚖️ Tartım] [📦...] │   <- horizontal scroll
└────────────────────────────────────────────────────────┘
```

İlk açılışta `Kullanici.gorev` neyse onu seçili gösterir. Personel istediği zaman değiştirebilir.

Persistans: localStorage'a "tv-personel-aktif-gorev" anahtarıyla kaydet, sayfa yenilenince hatırlasın.

---

## 📋 BÖLÜM 2 — AKTIF İŞ KARTI

### Konsept

Personel **"şu an bu kurbanla ilgileniyorum"** seçimi yapar. Üstte büyük bir kart olarak gösterilir. Onun dışındakiler altta liste.

### UI

```
┌────────────────────────────────────────┐
│  ⚡ AKTİF İŞİM                          │
│ ┌────────────────────────────────────┐ │
│ │ 🔪 DANA-23                          │ │
│ │ Kesim · 12dk geçti                  │ │
│ │ ▮▮▮▮▮▮▮░░░ 70%                     │ │
│ │                                     │ │
│ │ 👥 7 hissedar  💰 ₺336.000          │ │
│ │                                     │ │
│ │ ┌──────────────┐ ┌────────┐         │ │
│ │ │ ▶ Deri Yüzme │ │ +%10   │         │ │
│ │ │  (sonraki)   │ │        │         │ │
│ │ └──────────────┘ └────────┘         │ │
│ │ ┌──────────────────────────┐       │ │
│ │ │ 📝 Not Ekle  ⚠️ Sorun  ↶ │       │ │
│ │ └──────────────────────────┘       │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

### Davranış

- Kart **sticky top** (scroll edilse de görünür kalır)
- Tek seferde **1 aktif iş**
- "İşi Bırak" butonu (X ikon) → aktif iş listeden çıkar, ana akışa döner
- Süre **gerçek zamanlı** (her saniye güncellensin, ekran açık olduğunda)
- İlerleme bar **smooth animasyon** ile artıyor

### State Yönetimi

```ts
const [aktifIs, setAktifIs] = useState<string | null>(null); // kurbanId
// localStorage'a kaydet: "tv-personel-aktif-is"
```

---

## 📋 BÖLÜM 3 — GÖREV LİSTESİ (Rol Filtreli)

### Liste Görünümü

```
GÖREVLERİM (5)
┌────────────────────────────────────────┐
│ 🔪 DANA-24                              │
│ Kesim Hazırlık · Sıra No: 2             │
│ ▮▮░░░░░░░░ 20%                          │
│                                         │
│  [Bu İşi Al ⚡]    [Sonraki Aşama →]    │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ 🔪 DANA-25                              │
│ Sıradaki · Sıra No: 3                   │
│ ░░░░░░░░░░ 0%                           │
│                                         │
│  [Bu İşi Al ⚡]    [Hazırlığa Geç →]    │
└────────────────────────────────────────┘
```

### Davranış

- Görev filtresine göre **otomatik liste**
- Rol'e göre sıralama:
  - Vekalet: kesim sırasına göre (ASC)
  - Kesim: operasyon sırasına göre (ASC)
  - Tartım: kesim biten zamana göre (DESC, yeni gelenler önde)
  - Paketleme: tartım biten zamana göre (DESC)
  - Teslim: paketleme biten zamana göre (DESC)

### "Bu İşi Al" Butonu

Tıklanınca:
1. Aktif iş kartına atar
2. localStorage güncelle
3. Eğer aşama henüz başlamamışsa (kesimSirasi=siradaki gibi), otomatik sonraki aşamaya geçir? **HAYIR** — personel kontrolü kaybetmesin
4. Liste'den çıkar (aktif olduğu için)
5. Toast: "DANA-X aktif işin oldu"

---

## 📋 BÖLÜM 4 — ÖZEL AKSIYONLAR

### 4.1 Vekalet Aksiyonu

Vekalet rolü için özel UI: müşteriden imza/vekalet alma akışı.

```
┌────────────────────────────────────────┐
│ 📜 DANA-15 - Vekalet Bekliyor          │
│                                         │
│ Hissedarlar (7):                       │
│  ✅ Ahmet Yılmaz - Vekalet alındı      │
│  ⬜ Mehmet Demir - Bekliyor             │
│  ⬜ Ayşe Korkmaz - Bekliyor             │
│  ✅ Hasan Çelik - Vekalet alındı       │
│  ⬜ ... (3 daha)                       │
│                                         │
│  Aktif: 2/7 vekalet alındı             │
│                                         │
│  [Hepsini Tamamla → Kesim Hazır]       │
└────────────────────────────────────────┘
```

Her hissedar tıklayınca:
- Checkbox tikle → `Hisse.vekaletAlindi = true`, `Hisse.vekaletTarihi = now()`
- Vekalet PDF/JPG yüklemek istiyorsa: ayrı sayfa (`/hayvanlar/vekalet/[id]`) — bu **MEVCUT**
- Hızlı tik: sadece "alındı" işaretle (PDF olmadan)
- **Toplu Tamamla**: hepsini bir kerede tikle

API: `PATCH /api/hisseler/{id}/vekalet` (mevcut endpoint olmalı, yoksa eklensin)
```ts
body: { vekaletAlindi: boolean }
```

### 4.2 Tartım Aksiyonu

Tartım rolü için sayısal giriş UI:

```
┌────────────────────────────────────────┐
│ ⚖️ DANA-23 - Tartım                    │
│                                         │
│  Karkas Ağırlık (kg)                   │
│  ┌────────────────────────────────┐    │
│  │       4 8 5 . 2                │    │
│  └────────────────────────────────┘    │
│  ┌───┬───┬───┐                         │
│  │ 7 │ 8 │ 9 │                         │
│  ├───┼───┼───┤                         │
│  │ 4 │ 5 │ 6 │                         │
│  ├───┼───┼───┤                         │
│  │ 1 │ 2 │ 3 │                         │
│  ├───┼───┼───┤                         │
│  │ . │ 0 │ ⌫ │                         │
│  └───┴───┴───┘                         │
│                                         │
│  [Kaydet ve Paketlemeye Geç →]         │
└────────────────────────────────────────┘
```

- Büyük rakam keypad (eldivenle de basılabilir)
- Sadece sayı + 1 nokta
- Validasyon: 50 < kg < 1500
- Per-hisse otomatik bölme: `paketKg = toplam / hisseSayisi`

API: `PATCH /api/tv/kurban-asama` (mevcut, `toplamKg` alanı zaten var) ✅

### 4.3 Paketleme (Hisse Seviyesi)

Tartımdan sonra her hisse ayrı paketlenir.

```
┌────────────────────────────────────────┐
│ 📦 DANA-23 - Paketleme                  │
│ Tartım: 485.2kg → 69.3kg/hisse         │
│                                         │
│  Hisseler (7):                         │
│  ┌──────────────────────────────────┐  │
│  │ ⬜ 1. Ahmet Yılmaz - 69.3kg       │  │
│  │ ⬜ 2. Mehmet Demir - 69.3kg       │  │
│  │ ✅ 3. Ayşe Korkmaz - 69.3kg ✓ Pak │  │
│  │ ⬜ 4. Hasan Çelik - 69.3kg        │  │
│  │ ⬜ 5. Fatma Yılmaz - 69.3kg       │  │
│  │ ⬜ 6. Ali Kaya - 69.3kg           │  │
│  │ ⬜ 7. Selim Akın - 69.3kg         │  │
│  └──────────────────────────────────┘  │
│                                         │
│  Paketlenen: 1/7                       │
│                                         │
│  [Hepsi Paketlendi → Teslim Hazır]     │
└────────────────────────────────────────┘
```

Her hisse tikle → `Hisse.paketDurumu = "Paketlendi"`, paketKg auto

API: `PATCH /api/hisseler/{id}/paket` (yeni endpoint)
```ts
body: { paketDurumu: "Paketlendi" | "Teslim Hazır", paketKg?: number }
```

### 4.4 Teslim (Hisse Seviyesi)

Müşteri geldi, hisseyi alıyor.

```
┌────────────────────────────────────────┐
│ 🎉 DANA-23 - Teslim                    │
│                                         │
│  Bekleyen Hisseler (3):                │
│  ┌──────────────────────────────────┐  │
│  │ 1. Ahmet Yılmaz - 69.3kg          │  │
│  │ 📞 0532 ••• 234                   │  │
│  │                  [✓ Teslim Et]    │  │
│  ├──────────────────────────────────┤  │
│  │ 2. Mehmet Demir - 69.3kg          │  │
│  │ 📞 0533 ••• 567                   │  │
│  │                  [✓ Teslim Et]    │  │
│  ├──────────────────────────────────┤  │
│  │ 3. Hasan Çelik - 69.3kg           │  │
│  │ 📞 0534 ••• 890                   │  │
│  │                  [✓ Teslim Et]    │  │
│  └──────────────────────────────────┘  │
│                                         │
│  Teslim Edilen: 4/7                    │
└────────────────────────────────────────┘
```

API: `PATCH /api/hisseler/{id}/teslim` (yeni endpoint)
```ts
body: { teslimDurumu: "Teslim Edildi" }
```

Bonus: **WhatsApp ile haber ver** butonu — "Hisseniz hazır" otomatik mesaj.

---

## 📋 BÖLÜM 5 — HIZLI AKSİYONLAR

### Alt Sticky Bar

Tek el kullanımı için altta sabit:

```
┌────────────────────────────────────────┐
│  🔍 Ara  📷 QR Tara  🔔 Bildirimler    │  <- sticky bottom
└────────────────────────────────────────┘
```

#### 🔍 Ara

Modal aç:
- Kurban no, küpe no, hissedar adı
- Sonuçlar liste şeklinde
- Tıklayınca o görev kartına yönlendirir

#### 📷 QR Tara

`navigator.mediaDevices.getUserMedia` ile kamera aç:
- Vekalet kağıdındaki QR
- Müşteri kartındaki QR
- Etiketteki QR
- Bulunca direkt o kurbanın aktif kartına atla

**Şu an YOK** — yeni özellik. Eğer kamera API yorulursa, fallback: manuel kurban no input.

#### 🔔 Bildirimler

Push abone değilse → "Abone Ol" butonu (mevcut `usePushBildirim` hook'u var)
Abone ise → "Yeni iş geldi" gibi son bildirimleri göster

---

## 📋 BÖLÜM 6 — ÇEVRİMDIŞI DESTEĞİ (OPSIYONEL)

Bayram günü Wi-Fi yorulabilir. Personel'in eylem queue'su:

```ts
// modules/tv/lib/offline-queue.ts (yeni)

interface QueueItem {
  id: string;
  endpoint: string;
  method: string;
  body: unknown;
  timestamp: number;
  retry: number;
}

// localStorage 'tv-personel-queue' altında
// Online olunca otomatik flush
```

Bu **fancy** olabilir ama önemli. Sahaya çıkmış personel internet kesilirse 5 dakika bekleyemez, kaydı önce localStorage'a atar, sonra senkronize edilir.

**Karar**: Bu sprint için **OPSIYONEL**. Önce ana akış çalışsın, sonra eklenir. Sprint 6'da yapmak istersen ekleyebiliriz, yoksa Sprint 7'ye atarız.

---

## 📋 BÖLÜM 7 — SES + TİTREŞİM

### Mevcut `useSeslicAnons` Hook

`modules/tv/hooks/useSeslicAnons.ts` zaten var, kullanılıyor. Genişlet:

```ts
// Yeni eklemeler:
- titreşim(pattern: number | number[]) // navigator.vibrate
- bipSesi(tip: "basari" | "hata" | "uyari")
- aktifEt() / pasifEt()
```

### Kullanım

```ts
// Aksiyon başarılı oldu
titreşim(50);
bipSesi("basari");
anons("DANA-23 kesime alındı");

// Hata oldu
titreşim([100, 50, 100]);  // çift titreşim
bipSesi("hata");
```

---

## 📋 BÖLÜM 8 — GERİ AL / İPTAL / NOT

### Geri Al (Undo)

Personel yanlışlıkla "Sonraki Aşamaya Geç" basarsa son 30 saniye içinde geri alabilsin:

```tsx
// Toast'ta "Geri Al" butonu
toast.success("Deri Yüzme'ye geçildi", {
  action: { label: "Geri Al", onClick: geriAl },
  duration: 30000,
});
```

Geri alma: `POST /api/tv/kurban-asama` body'de **bir önceki aşamayı** gönder.

### İptal Et

Kurban iptali admin yetkisi gerektirir, personel'de **YOK**. Onun yerine **"Sorun Bildir"** butonu:

```tsx
const sorunBildir = async (kurbanId: string) => {
  const not = window.prompt("Sorun nedir?");
  if (!not) return;

  await fetch("/api/tv/sorun-bildir", {  // yeni endpoint
    method: "POST",
    body: JSON.stringify({ kurbanId, sorun: not, kullaniciId }),
  });

  toast.warning("Sorun yöneticiye iletildi");
};
```

API: `POST /api/tv/sorun-bildir` (yeni)
```ts
// Body: { kurbanId, sorun, fotoUrl? }
// Yapılacaklar:
//   1. AuditLog "sorun-bildir"
//   2. Kurban.notlar'a eklenir (önceki not + yeni not)
//   3. Admin'e push bildirim (`pushFiltreliGonder({ adminRol: true })`)
//   4. WhatsApp grup mesajı (opsiyonel)
```

### Not Ekle

Hızlı not (kayıtlı):

```tsx
const notEkle = async (kurbanId: string, not: string) => {
  await fetch("/api/tv/not-ekle", {  // yeni endpoint
    method: "POST",
    body: JSON.stringify({ kurbanId, not }),
  });
};
```

API: `POST /api/tv/not-ekle` (yeni veya `Not` modelinde mevcut sistemden faydalan)

---

## 📋 COMPONENT YAPISI

```
modules/tv/components/personel/
├── PersonelAnaClient.tsx          # ana orchestrator (yeniden yazılır)
├── PersonelUstBar.tsx             # rol seçici + ses + push
├── PersonelGorevSekme.tsx         # horizontal scroll sekme
├── PersonelAktifIs.tsx            # büyük "şu an çalışıyorum" kartı
├── PersonelGorevListe.tsx         # filtreli liste
├── PersonelGorevKart.tsx          # tek görev kartı
├── PersonelAltBar.tsx             # ara + QR + bildirim
├── ozel-aksiyonlar/
│   ├── VekaletPanel.tsx           # hissedar tikleme
│   ├── TartimKeypad.tsx           # sayısal keypad
│   ├── PaketlemePanel.tsx         # hisse tikleme
│   └── TeslimPanel.tsx            # hisse teslim
├── arama/
│   ├── HizliAramaModal.tsx
│   └── QrTaramaModal.tsx
└── yardimcilar/
    ├── GeriAlToast.tsx
    └── SorunBildirDialog.tsx

modules/tv/lib/
├── personel-gorev.ts              # YENI — görev tanımları
├── offline-queue.ts               # OPSIYONEL — offline support
└── (mevcut dosyalar korunur)

modules/tv/hooks/
├── useAktifGorev.ts               # YENI — localStorage state
├── useAktifIs.ts                  # YENI — aktif iş yönetimi
├── useQrTarama.ts                 # YENI — kamera + barcode
└── useSeslicAnons.ts              # genişlet (titreşim + bip)

app/api/tv/
├── kurban-asama/route.ts          # mevcut
├── sorun-bildir/route.ts          # YENI
└── not-ekle/route.ts              # YENI

app/api/hisseler/
├── [id]/vekalet/route.ts          # YENI veya mevcut?
├── [id]/paket/route.ts            # YENI
└── [id]/teslim/route.ts           # YENI
```

---

## 🧪 TEST

### Akış 1: Kasap Bütün Operasyonu
1. Login admin → `/ayarlar/personel` (sonra eklenecek) → kullanıcı seç → gorev = "kesim"
2. `/tv/personel` aç → "Kasap" sekmesi otomatik seçili
3. DANA-1 görev kartında "Bu İşi Al" → aktif iş kartına geçer
4. "Hazırlığa Geç" → onay → toast başarı + ses + titreşim
5. "Kesime Geç" → optimistic update + API + bildirim
6. "Deri Yüzme'ye Geç" → ...
7. "Parçalama'ya Geç" → ...
8. "Tartıma Geç" → aktif iş kartından çıkar (artık tartım personelinin işi)
9. AuditLog'ta 5 adım kaydedilmiş, hepsi aynı kullaniciId

### Akış 2: Tartım Personeli
1. `/tv/personel` aç → "Tartım" sekmesi seç
2. Tartımdaki DANA-1 listede
3. "Bu İşi Al" → aktif iş kartına
4. Keypad açılır → 485.2 yaz
5. "Kaydet ve Paketlemeye Geç" → toplamKg=485.2, durum=paketleme
6. Aktif iş listeden çıkar (paketleyici görür)
7. DB: `Kurban.toplamKg = 485.2`, her `Hisse.paketKg = 69.3`

### Akış 3: Paketleyici
1. `/tv/personel` aç → "Paketleme" sekmesi seç
2. Tartımı biten DANA-1 listede
3. "Bu İşi Al" → 7 hisse listesi
4. Sırayla her hisseyi tik → `Hisse.paketDurumu = "Paketlendi"`
5. Hepsi tamamlanınca "Teslim Hazır" → durum geçişi otomatik

### Akış 4: Teslim
1. `/tv/personel` aç → "Teslim" sekmesi seç
2. Teslim hazır hisseleri görür (her DANA'dan bir kaç tane)
3. Müşteri Ahmet geldi → DANA-1 / Hisse 1 yanında "Teslim Et" tik
4. `Hisse.teslimDurumu = "Teslim Edildi"`, `teslimTarihi = now()`
5. Toast: "WhatsApp ile bilgi ver?" (Ahmet'e push/wa)
6. AuditLog "teslim"

### Akış 5: Geri Al
1. DANA-5 "Kesime Geç" yanlışlıkla basıldı (aslında hala hazırlık)
2. Toast'ta "Geri Al" görünür 30 saniye
3. "Geri Al" tıkla → durum tekrar "hazirlik"
4. AuditLog "kurban-asama-geri-al"

### Akış 6: Sorun Bildir
1. DANA-3 kesimde sorun var (hayvan stresli)
2. "Sorun Bildir" → text prompt → "Hayvan stresli, ek bekleme gerek"
3. Admin telefonuna push: "DANA-3 sorun: Hayvan stresli..."
4. Kurban.notlar'a not eklenir

### Akış 7: Çevrimdışı (eğer offline support)
1. Wi-Fi kapat
2. DANA-7 "Sonraki Aşamaya Geç" → optimistic UI değişir
3. Queue'ya eklenir
4. Wi-Fi aç → otomatik flush
5. AuditLog gecikmeli ama doğru zaman damgalı

### Mobil Test
- iPhone SE (375px), iPhone 14 Pro Max (430px), Android Pixel (412px)
- Touch target en az 48px her yerde
- One-handed kullanım: önemli butonlar alt yarımda
- Light mode (kesim alanı parlak)
- Yakınlaştırma (browser zoom %150) bozmuyor mu?

---

## 📋 COMMIT MESAJI

```
feat(tv-personel): sahaya cikmis personel icin kapsamli mobil panel

Mevcut /tv/personel minimal idi (3 KPI + sade liste). Bayrami gunu
saha operasyonu icin yeniden tasarlandi: rol filtreleri, aktif is
karti, ozel aksiyon panelleri (vekalet/tartim/paketleme/teslim),
sayisal keypad, sesli geri bildirim, geri al/sorun bildir.

YENI OZELLIKLER:

[1] Rol Filtresi (Kullanici.gorev alani)
- Schema: kullanici_gorev_ekle migration
- 6 gorev: Vekalet/Kesim/Tartim/Paketleme/Teslim/Genel
- PersonelGorevSekme: horizontal scrollable sekmeler
- localStorage'da aktif gorev hatirlanir
- Her gorev kendi asamasini gosterir

[2] Aktif Is Karti (Sticky Top)
- "Su an bu kurbanla ilgileniyorum" konsepti
- Buyuk kart, gercek zamanli sure (her saniye)
- Sonraki asama + %10 ilerleme + ozel aksiyon butonlari
- "Isi Birak" ile listeye doner

[3] Ozel Aksiyon Panelleri

  Vekalet:
  - Hissedar listesi, tik tik
  - Hepsini tamamla toplu islem
  - Hisse.vekaletAlindi + Hisse.vekaletTarihi

  Tartim:
  - Buyuk keypad UI (eldivene uygun)
  - Sadece sayi + 1 nokta
  - Auto split: toplamKg / hisseSayisi -> hisse.paketKg
  - kurban-asama API toplamKg field'i kullaniliyor

  Paketleme:
  - Hisse seviye tik (her hisse ayri paketlenir)
  - paketDurumu + paketKg
  - Hepsi tikli olunca "Teslim Hazir" durum gecisi

  Teslim:
  - Bekleyen hisseler listesi (telefonlu)
  - "Teslim Et" tek tik
  - WhatsApp ile haber ver opsiyonu
  - Hisse.teslimDurumu + teslimTarihi

[4] Hizli Aksiyonlar
- Alt sticky bar: Ara + QR Tara + Bildirimler
- HizliAramaModal: no/kupe/hissedar arama
- QrTaramaModal: kamera API ile QR oku (fallback: manual input)
- Push abonelik durumu inline gosterim

[5] Geri Al / Sorun Bildir / Not Ekle
- Toast'ta 30sn "Geri Al" butonu (son asama gecisi geri alir)
- Sorun Bildir: text + admin'e push + Kurban.notlar
- Not Ekle: hizli not ekleme

[6] Ses + Titresim
- useSeslicAnons hook genisletildi
- titresim(pattern) + bipSesi("basari"|"hata"|"uyari")
- Her aksiyonda sesli + dokunsal geri bildirim

YENI ENDPOINT'LER:
- POST /api/tv/sorun-bildir
- POST /api/tv/not-ekle
- PATCH /api/hisseler/{id}/vekalet
- PATCH /api/hisseler/{id}/paket
- PATCH /api/hisseler/{id}/teslim

YENI COMPONENT'LER (modules/tv/components/personel/):
- PersonelUstBar, PersonelGorevSekme, PersonelAktifIs,
  PersonelGorevListe, PersonelGorevKart, PersonelAltBar
- ozel-aksiyonlar/VekaletPanel, TartimKeypad, PaketlemePanel, TeslimPanel
- arama/HizliAramaModal, QrTaramaModal
- yardimcilar/GeriAlToast, SorunBildirDialog

YENI HOOKS:
- useAktifGorev, useAktifIs, useQrTarama
- useSeslicAnons genisletildi (titresim + bipSesi)

YENI LIB:
- modules/tv/lib/personel-gorev.ts (gorev tanimlari)

KUTSAL korundu:
- Tahsilat akisi degismedi (TKR/ABH-2026)
- TV kontrol panel (admin) degismedi
- /tv canli ekran degismedi
- Mevcut kurban-asama endpoint korunup genisletildi
- useSeslicAnons backward compatible

UI/UX:
- Touch target min 48px (eldivene uygun)
- One-handed: kritik butonlar alt yarimda
- Light mode (kesim alani parlak)
- Sesli + titresimle geri bildirim
- Optimistic update (yavas internet)

Test:
- pnpm tsc --noEmit + build temiz
- Migration: pnpm prisma migrate dev
- iPhone SE / 14 Pro Max / Pixel emulator test
- 6 akis test (kasap/tartim/paketleme/teslim/geri-al/sorun)
- Touch target 48px her yerde
- KUTSAL: TKR/ABH test korundu
```

---

## 🎯 ÖZET

| Bölüm | Süre | Etki |
|---|---|---|
| 1. Rol filtreleri | 30dk | Doğru kişi doğru işi görür |
| 2. Aktif İş Kartı | 1sa | "Şu an ne yapıyorum" netleşir |
| 3. Görev Listesi | 30dk | Mevcut yapıyı geliştir |
| 4. Özel Aksiyon Panelleri | 2sa | Vekalet/Tartım/Paketleme/Teslim doğru UI |
| 5. Hızlı Aksiyonlar | 1sa | Ara/QR/Push üst düzey UX |
| 6. Çevrimdışı (OPSIYONEL) | 1sa | Bayram günü internet sigortası |
| 7. Ses+Titreşim | 30dk | Sahaya çıkmış personel için kritik |
| 8. Geri Al/Sorun/Not | 30dk | Hata düzeltme |
| **Toplam** | **5-7sa** | Operasyonel verimlilik 3-5x |

**Sprint sonrası**:
- Burhan Bey personeline telefon dağıtır, her biri kendi rolünü seçer
- Kasap kesim akışını tek el yönetir (eldiven var)
- Tartım personeli büyük keypad'le kg girer (yanlış basma riski düşer)
- Paketleyici 7 hissesini tek tek tik atar
- Teslim personeli müşteriye WhatsApp atar otomatik
- Yanlış bir şey olursa "Geri Al"
- Sorun varsa admin'e anında bildirim

---

## ⚠️ ÖNEMLİ NOTLAR

1. **Schema değişikliği var** (`Kullanici.gorev`). Migration küçük + optional field, mevcut kayıtlar etkilenmez.

2. **Kamera API (QR)** her tarayıcıda çalışmaz (HTTPS gerek). LAN'da HTTP olduğu için `getUserMedia` çalışmayabilir. Fallback: manual input.

3. **Mevcut PersonelAnaClient YENİDEN YAZILACAK** ama eski component'ler korunsun (`PersonelKurbanKart` bir başka yerde kullanılıyor mu?). Eski yapıyı silmeden yeni yap, sonra siler.

4. **Offline queue OPSIYONEL** — sprint çok şişiyorsa atla. Sprint 7'de ayrıca yapılabilir.

5. **Touch target** standardı dikkatle uygulanmalı. Sahaya çıkmış personel eldivenle basıyor.

6. **Çoklu cihaz** — birden fazla personel aynı kurban üstünde çalışabilir. Race condition: ikisi aynı anda "Sonraki Aşama" basarsa? Optimistic update + son kazanır + audit log "kim ne zaman" gösterir → kabul edilebilir.

7. **Kullanici.gorev null** ise = genel (hepsini gör). Bu şekilde admin/kasiyer gibi rolleri etkilenmez, sadece eklenen alandır.

8. **Personel telefonlarına PWA install** önerilir — uygulama gibi açılsın. PWA zaten kurulu (Sprint 0/PWA).
