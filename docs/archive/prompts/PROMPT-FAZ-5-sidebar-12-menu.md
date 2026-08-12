---
id: ARCH-AF3E7CD4BE46
status: ARCHIVED
owner: Historical
source_role: historical_record
source_of_truth: false
last_reviewed: not_applicable
verified_against_commit: not_applicable
---

# PROMPT-FAZ-5: SIDEBAR 12 MENÜ SİSTEMİ

> **Claude Code'a ver. Otonom modda çalıştır. Her adımda commit at.**

---

## 🎯 AMAÇ

Mevcut sidebar'ı **profesyonel 12 ana menü + ~90 alt menü** yapısına yükselt.
Akordeon davranışı + yetki sistemi + bildirim rozetleri + placeholder sayfalar.
Yerli (Kurban360, Bikurbanlık) ve yabancı (inecta, TRAX-IT) yazılımların **en iyi pratikleri** uygulandı.

---

## ⚠️ KESİNLİKLE KORUNACAKLAR

Aşağıdakileri **BOZMA**:
- ✅ KUTSAL tahsilat akışı
- ✅ Müşteri detay tab sistemi (FAZ 4'te yapıldı)
- ✅ Akordiyon menü davranışı (Faz 1.5'te yapıldı, sadece içerik güncellenecek)
- ✅ Mevcut çalışan sayfalar (Müşteriler, Kurbanlar, Tahsilat, Kasa, Raporlar, Ayarlar)
- ✅ Audit log entegrasyonu
- ✅ Granular izin sistemi
- ✅ Soft delete filtreleri
- ✅ Login + auth + middleware
- ✅ Mevcut API endpoint'leri
- ✅ TKR dekont numara sırası
- ✅ DB schema (sadece NavigasyonBildirimi modeli eklenecek)

---

## 📐 MİMARİ KURALLAR (MIMARI.md UYUMU)

1. ✅ Yeni component'lar `shared/components/sidebar/` altında
2. ✅ Menu config `shared/lib/sidebar-config.ts` altında (TEK kaynak)
3. ✅ İzin kontrolü `izinKontrol(session, 'modul.eylem')` ile
4. ✅ Yetki bazlı görünürlük (rol gizleme)
5. ✅ TypeScript strict — `any` yok
6. ✅ Türkçe değişken adları
7. ✅ Her ana menü grubu **ayrı commit**

---

## 🗂️ HEDEF YAPI: 12 ANA MENÜ

### Menü Yapısı (Sırası Önemli — En çok kullanılan yukarıda)

```
🏠 Ana Sayfa                            (tek sayfa, alt yok)

👥 Müşteriler / Cari                     (9 alt)
   📋 Tüm Müşteriler
   ➕ Yeni Müşteri
   ⚠️ Borçlular                         [bildirim: borçlu sayısı]
   ⭐ VIP Müşteriler
   🆕 Bu Sezon Yeni
   📄 Hesap Ekstresi
   🏷️ Etiket Yönetimi
   📥 Excel İçe Aktar
   📤 Excel Dışa Aktar

🐂 Kurban Yönetimi                       (10 alt)
   📋 Tüm Kurbanlar
   ➕ Yeni Kurban Ekle
   🐄 Hayvan Tedariği                    [PLACEHOLDER]
   🎯 Hisse Atama
   ⭕ Boş Hisseler                       [bildirim: boş hisse sayısı]
   🔄 Hisse Transfer                     [PLACEHOLDER]
   📜 Vekalet Yönetimi
   🖼️ Hayvan Galerisi                    [PLACEHOLDER]
   🏷️ Etiket Yazdırma                    [PLACEHOLDER]
   📊 Stok Durumu

🔪 Kesim Operasyonu                      (10 alt) [ÇOĞU PLACEHOLDER - bayram sonrası]
   📺 Canlı Akış Paneli                  [PLACEHOLDER]
   📋 Kesim Sırası
   🔪 Aktif Kesimler                     [PLACEHOLDER]
   👨‍⚕️ Veteriner Kontrol                  [PLACEHOLDER]
   ⚖️ Tartım & Sınıflandırma             [PLACEHOLDER]
   🔪 Parçalama                          [PLACEHOLDER]
   📦 Paketleme                          [PLACEHOLDER]
   📤 Teslimat Hazırlığı                 [PLACEHOLDER]
   🥩 Sakatat Dağıtımı                   [PLACEHOLDER]
   📊 Operasyon Raporu                   [PLACEHOLDER]

💰 Tahsilat & Ödeme                      (10 alt)
   ⚡ Hızlı Tahsilat
   📋 Tüm Tahsilatlar
   📅 Bugünkü Tahsilatlar
   📜 Dekontlar (TKR)
   💸 İadeler                            [PLACEHOLDER - Faz 6]
   🔄 Taksit Takibi                      [PLACEHOLDER]
   🎟️ İndirim & Mahsup                   [PLACEHOLDER]
   ❌ İptal İşlemleri
   🏷️ Fiyat Yönetimi                     [PLACEHOLDER]
   📨 Toplu Tahsilat                     [PLACEHOLDER]

💼 Kasa & Finans                         (10 alt)
   💵 Kasa Özeti
   💵 Nakit Kasa
   🏦 Banka Hesapları
   💳 POS / Kart
   📊 Kasa Hareketleri
   💸 Giderler
   📈 Gelir-Gider Analiz                 [PLACEHOLDER]
   🌅 Gün Açılış / Kapanış               [PLACEHOLDER]
   🔄 Banka Mutabakat                    [PLACEHOLDER]
   💹 Karlılık Analizi                   [PLACEHOLDER]

🚚 Lojistik & Teslimat                   (9 alt) [TAMAMI PLACEHOLDER - Faz 2]
   📦 Aktif Teslimatlar
   📋 Teslim Programı
   🚛 Şoför Yönetimi
   🚗 Araç Yönetimi
   🗺️ Rota Optimizasyonu
   📍 Canlı Takip (GPS)
   ✅ Teslim Onayları
   📷 Teslim Fotoğrafları
   📊 Lojistik Raporu

💬 İletişim & WhatsApp                   (10 alt)
   📨 Mesaj Merkezi                      [bildirim: bekleyen mesaj]
   📋 Mesaj Şablonları                   [PLACEHOLDER]
   📤 Toplu Gönderim                     [PLACEHOLDER]
   ⏰ Zamanlanmış Mesajlar               [PLACEHOLDER]
   📜 Gönderim Geçmişi                   [PLACEHOLDER]
   📵 SMS Yönetimi                       [PLACEHOLDER]
   📧 E-mail Yönetimi                    [PLACEHOLDER]
   📞 Arama Logu                         [PLACEHOLDER]
   🤖 Otomatik Hatırlatma                [PLACEHOLDER]
   ⚙️ Entegrasyon Ayarları               [PLACEHOLDER]

📊 Raporlar & Analiz                     (10 alt)
   📈 Rapor Merkezi
   👥 Müşteri Analizi
   🐂 Kurban Analizi
   💰 Finansal Raporlar
   ⚠️ Borç Raporu
   🔪 Operasyon Raporu                   [PLACEHOLDER]
   📅 Dönemsel Karşılaştırma             [PLACEHOLDER]
   🎯 Karlılık & ROI                     [PLACEHOLDER]
   🤖 AI Tahminler                       [PLACEHOLDER - Faz 4]
   📤 Özel Rapor Oluştur                 [PLACEHOLDER]

👨‍💼 Personel & Ekip                       (10 alt) [Faz 2 için altyapı]
   👥 Personel Listesi
   ➕ Yeni Personel
   📋 Vardiya & Görev                    [PLACEHOLDER]
   💬 Ekip Sohbeti                       [PLACEHOLDER]
   🎤 Sesli Mesajlaşma                   [PLACEHOLDER]
   📍 Konum Takibi                       [PLACEHOLDER]
   📊 Performans Raporu                  [PLACEHOLDER]
   💵 Personel Ödemeleri                 [PLACEHOLDER]
   🔐 Yetki Yönetimi
   📜 Aktivite Logu

📺 TV Ekranı                             (tek sayfa, alt yok, yeni sekme açar)

⚙️ Ayarlar & Sistem                      (10 alt)
   👤 Profil Ayarları
   🏢 Şirket Bilgileri
   🏪 Şube Yönetimi                      [PLACEHOLDER]
   👥 Kullanıcı Yönetimi
   🔐 Roller & İzinler
   🎨 Tema & Görünüm                     [PLACEHOLDER]
   💾 Yedekleme & Geri Yükleme
   🔌 Entegrasyonlar                     [PLACEHOLDER]
   🌐 Multi-tenant (SaaS)                [PLACEHOLDER - Faz 6]
   🛠️ Sistem Durumu
```

---

## 🗂️ DOSYA YAPISI

### Yeni Oluşturulacak

```
shared/
├── lib/
│   ├── sidebar-config.ts            ← TEK KAYNAK menü tanımları
│   └── sidebar-bildirim.service.ts  ← Bildirim sayıları (borçlu, boş hisse, vs.)
└── components/
    └── sidebar/
        ├── Sidebar.tsx               ← Ana sidebar component
        ├── SidebarHeader.tsx         ← Logo + marka
        ├── SidebarMenuGroup.tsx      ← Ana menü öğesi (akordeon)
        ├── SidebarMenuItem.tsx       ← Alt menü öğesi
        ├── SidebarBildirimRozet.tsx  ← Bildirim sayısı rozeti
        ├── SidebarCollapseButton.tsx ← Daraltma butonu
        ├── SidebarBayramSayaci.tsx   ← Alt bayram sayacı
        └── SidebarKullaniciKarti.tsx ← Alt kullanıcı kartı
```

### Placeholder Sayfaları İçin

```
shared/
└── components/
    └── PlaceholderSayfa.tsx          ← Estetik "Yakında" sayfası
```

### Yeni Route'lar

Tüm menü öğeleri için `app/<modul>/<alt-sayfa>/page.tsx` oluşturulacak.
**Mevcut olanlar bozulmayacak**, yeni olanlar `PlaceholderSayfa` kullanacak.

---

## 📋 SIDEBAR CONFIG STANDARDI

`shared/lib/sidebar-config.ts`:

```typescript
import type { LucideIcon } from 'lucide-react';
import { Home, Users, ... } from 'lucide-react';

export type IzinAnahtari = string; // 'musteriler.goruntule' vb.

export type SidebarAltMenu = {
  id: string;
  ad: string;
  ikon: LucideIcon;
  rota: string;
  placeholder?: boolean;        // true ise PlaceholderSayfa'ya yönlendir
  faz?: 'bayram' | 'sonrasi' | 'gelecek'; // hangi fazda aktif olacak
  bildirimAnahtari?: string;    // 'borclu', 'bosHisse', 'bekleyenMesaj'
  izin?: IzinAnahtari;          // gerekli izin (yoksa herkes görür)
};

export type SidebarAnaMenu = {
  id: string;
  ad: string;
  ikon: LucideIcon;
  rota?: string;                // alt menü yoksa tek sayfa
  altMenuler?: SidebarAltMenu[];
  yeniSekme?: boolean;          // TV ekranı için
  bildirimAnahtari?: string;    // toplam bildirim
  izin?: IzinAnahtari;
  renk?: string;                // hover/aktif rengi (opsiyonel)
};

export const sidebarMenuleri: SidebarAnaMenu[] = [
  {
    id: 'ana-sayfa',
    ad: 'Ana Sayfa',
    ikon: Home,
    rota: '/',
  },
  {
    id: 'musteriler',
    ad: 'Müşteriler / Cari',
    ikon: Users,
    izin: 'musteriler.goruntule',
    altMenuler: [
      { id: 'tum-musteriler', ad: 'Tüm Müşteriler', ikon: List, rota: '/musteriler', izin: 'musteriler.goruntule' },
      { id: 'yeni-musteri', ad: 'Yeni Müşteri', ikon: UserPlus, rota: '/musteriler/yeni', izin: 'musteriler.olustur' },
      { id: 'borclular', ad: 'Borçlular', ikon: AlertCircle, rota: '/musteriler/borclular', bildirimAnahtari: 'borclu', izin: 'musteriler.goruntule' },
      { id: 'vip-musteriler', ad: 'VIP Müşteriler', ikon: Star, rota: '/musteriler/vip', izin: 'musteriler.goruntule' },
      { id: 'yeni-bu-sezon', ad: 'Bu Sezon Yeni', ikon: Sparkles, rota: '/musteriler/yeni-bu-sezon', izin: 'musteriler.goruntule' },
      { id: 'hesap-ekstresi', ad: 'Hesap Ekstresi', ikon: FileText, rota: '/musteriler/ekstre', izin: 'musteriler.goruntule' },
      { id: 'etiket-yonetimi', ad: 'Etiket Yönetimi', ikon: Tags, rota: '/musteriler/etiketler', izin: 'musteriler.etiket' },
      { id: 'excel-ice', ad: 'Excel İçe Aktar', ikon: Upload, rota: '/musteriler/excel-import', placeholder: true, faz: 'sonrasi' },
      { id: 'excel-disa', ad: 'Excel Dışa Aktar', ikon: Download, rota: '/musteriler/excel-export', izin: 'musteriler.goruntule' },
    ],
  },
  // ... diğer 10 ana menü
];
```

---

## 🎨 PLACEHOLDER SAYFA TASARIMI

`shared/components/PlaceholderSayfa.tsx`:

```typescript
type Props = {
  baslik: string;
  aciklama: string;
  ikon: LucideIcon;
  faz: 'bayram' | 'sonrasi' | 'gelecek';
  ozellikler?: string[];  // bu özellikte neler olacak
};

// Görsel:
// - Büyük ikon (gradient turuncu)
// - Modül başlığı
// - "Yakında Geliyor" rozeti
// - Açıklama
// - Tahmini faz: "Bayram Sonrası" / "Faz 2" / "Faz 3"
// - Özellik listesi (bullet points)
// - "Geri Dön" + "Diğer Özellikleri Gör" butonları
```

**Tasarım Estetik Olmalı:**
- Trendyol/Vercel tarzı premium boş sayfa
- Sade ama profesyonel
- "Yakında" hissi vermesin — "Geliyor!" hissi versin

---

## 🔔 BİLDİRİM SİSTEMİ

`shared/lib/sidebar-bildirim.service.ts`:

```typescript
// API: GET /api/sidebar/bildirimler
// Yanıt:
{
  basarili: true,
  veri: {
    borclu: 34,         // borçlu müşteri sayısı
    bosHisse: 12,       // doldurulmamış hisse
    eksikVekalet: 9,    // vekalet bekleyen hisse
    bekleyenMesaj: 23,  // gönderilmemiş WhatsApp
    kasaUyari: false,   // kasa kapanış bekleniyor mu
    // ...
  }
}
```

- Her 30 saniyede bir refresh
- React Query veya basit interval
- Sayılar 99+ olursa "99+" göster

---

## ⚡ AKORDEON DAVRANIŞ (KULLANICI İSTEĞİ)

```typescript
// Bir ana menü açılınca, diğer tüm açık menüler kapanır
const [acikMenu, setAcikMenu] = useState<string | null>(null);

function menuAcKapat(menuId: string) {
  setAcikMenu(prev => prev === menuId ? null : menuId);
  // localStorage'a kaydet
  localStorage.setItem('sidebar-acik-menu', menuId);
}
```

**Detaylar:**
- Sadece 1 menü aynı anda açık
- Sayfa yenilenince son açık menü hatırlanır (localStorage)
- Aktif sayfa hangi menüye aitse o otomatik açılır
- Smooth animation (300ms ease-out)
- ChevronRight ikonu 90° döner

---

## ⌨️ KLAVYE KISAYOLLARI

```
Ctrl+Shift+D → Dashboard
Ctrl+Shift+M → Müşteriler grubu aç
Ctrl+Shift+K → Kurban Yönetimi grubu aç
Ctrl+Shift+T → Tahsilat grubu aç
Ctrl+Shift+W → WhatsApp grubu aç
Ctrl+Shift+R → Raporlar grubu aç
Ctrl+B → Sidebar daralt/aç
```

---

## 🔐 YETKİ BAZLI GÖRÜNÜRLÜK

Her menü öğesinde `izin` alanı varsa:
```typescript
const gorunecekMenuler = sidebarMenuleri.filter(menu => {
  if (!menu.izin) return true; // izin yoksa herkese açık
  return izinKontrol(session, menu.izin);
});
```

**Roller:**
- **admin:** Hepsi görünür
- **kasiyer:** Personel, Lojistik, Multi-tenant gizli
- **kesim_personeli:** Sadece Kesim Operasyonu + TV Ekranı + Ana Sayfa
- **musteri_personeli:** Müşteriler + WhatsApp + Tahsilat (sadece okuma)
- **izleyici:** Sadece okuma izinleri olan menüler

---

## 📐 RESPONSIVE TASARIM

### Desktop (>= 1024px)
- Sidebar: 240px genişlik, sabit
- Tüm metin görünür
- Akordeon çalışır

### Tablet (768-1023px)
- Sidebar: 60px (sadece ikon)
- Hover'da tooltip
- Collapsed mode default

### Mobile (< 768px)
- Sidebar gizli, hamburger menu ile aç/kapat
- Tam genişlik overlay
- Drawer animasyon (slide from left)

---

## 🎯 UYGULAMA SIRASI (10 ADIM)

### ADIM 1: DB Schema (Opsiyonel — sadece bildirim sistemi için)
**Şu an gerekmez**, mevcut servisleri kullan. Geç.

### ADIM 2: Sidebar Config + Tipler
1. `shared/lib/sidebar-config.ts` oluştur
2. 12 ana menü + tüm alt menüler tanımla
3. Tipler net olsun (TypeScript strict)
4. İzin anahtarları doğru olsun

**Commit:** `feat(sidebar): sidebar config dosyası eklendi`

### ADIM 3: PlaceholderSayfa Component
1. `shared/components/PlaceholderSayfa.tsx` oluştur
2. Estetik tasarım (büyük ikon + başlık + açıklama + özellikler + butonlar)
3. Faz rozeti (bayram/sonrası/gelecek)

**Commit:** `feat(sidebar): placeholder sayfa component eklendi`

### ADIM 4: Sidebar Ana Component'ler
1. `shared/components/sidebar/Sidebar.tsx`
2. `SidebarHeader.tsx` (logo + marka)
3. `SidebarMenuGroup.tsx` (akordeon ana menü)
4. `SidebarMenuItem.tsx` (alt menü)
5. `SidebarBildirimRozet.tsx`

**Commit:** `feat(sidebar): yeni sidebar componentleri eklendi`

### ADIM 5: Bildirim Servisi
1. `shared/lib/sidebar-bildirim.service.ts`
2. API: `GET /api/sidebar/bildirimler`
3. Bildirim sayılarını DB'den çek (borçlu, boş hisse, eksik vekalet, vs.)
4. Frontend: 30 saniyede bir refresh

**Commit:** `feat(sidebar): bildirim sistemi eklendi`

### ADIM 6: Yetki Filtreleme
1. `gorunecekMenuler` helper'ı
2. Rol bazlı gizleme
3. Sidebar'da entegre

**Commit:** `feat(sidebar): yetki bazlı görünürlük eklendi`

### ADIM 7: Placeholder Sayfaları (Toplu)
1. Her placeholder alt menü için sayfa oluştur:
   - `app/kurbanlar/tedarik/page.tsx`
   - `app/kurbanlar/hisse-transfer/page.tsx`
   - `app/kurbanlar/galeri/page.tsx`
   - ... (toplam ~50 sayfa)
2. Her birinde `<PlaceholderSayfa />` kullan
3. Mevcut sayfaları **TAMAMLA**

**Commit:** `feat(sidebar): placeholder sayfaları eklendi (50 sayfa)`

### ADIM 8: Klavye Kısayolları
1. `useKlavyeKisayollari` hook'u
2. Ctrl+Shift+M, K, T, W, R, B desteği
3. Sidebar daralt/aç toggle

**Commit:** `feat(sidebar): klavye kisayollari eklendi`

### ADIM 9: Mobile Drawer
1. Hamburger menü buton (top bar'a)
2. Drawer slide animasyon
3. Overlay tıklayınca kapan

**Commit:** `feat(sidebar): mobile drawer eklendi`

### ADIM 10: Test + Polish
1. `pnpm tsc --noEmit` temiz mi?
2. Tüm route'lar HTTP 200 mü?
3. Akordeon davranışı doğru mu?
4. Yetki gizleme çalışıyor mu?
5. Mobile çalışıyor mu?
6. Klavye kısayolları çalışıyor mu?

**Commit:** `test(sidebar): faz 5 dogrulandi`

### ADIM 11: Final Push
1. `git push origin main`
2. GitHub'da commit'leri doğrula

---

## ✅ TEST CHECKLİSTİ

### Temel
- [ ] `pnpm tsc --noEmit` temiz
- [ ] `pnpm dev` başlıyor
- [ ] Sidebar yükleniyor
- [ ] 12 ana menü görünüyor

### Davranış
- [ ] Akordeon çalışıyor (bir açılınca diğer kapanır)
- [ ] localStorage state korunuyor (sayfa yenilenince hatırlıyor)
- [ ] Aktif sayfa menüsü otomatik açılıyor
- [ ] Smooth animation çalışıyor
- [ ] ChevronRight 90° döndürülüyor

### Yetki
- [ ] Admin tüm menüleri görür
- [ ] Kasiyer rolü Personel/Lojistik göremez
- [ ] İzleyici sadece okuma izinli görür

### Bildirim
- [ ] Borçlular menüsünde sayı görünüyor
- [ ] Boş Hisseler menüsünde sayı görünüyor
- [ ] 30 saniyede bir refresh
- [ ] 99+ formatı çalışıyor

### Placeholder
- [ ] Yeni alt menü tıklandığında PlaceholderSayfa açılıyor
- [ ] Estetik tasarım (gradient, ikon, başlık)
- [ ] "Geri Dön" butonu çalışıyor

### Klavye
- [ ] Ctrl+Shift+M → Müşteriler aç
- [ ] Ctrl+B → Sidebar daralt
- [ ] Diğer kısayollar çalışıyor

### Mobile
- [ ] Hamburger menü buton görünüyor
- [ ] Drawer açılıyor
- [ ] Overlay tıklayınca kapan
- [ ] Tablet'te ikon mode

### Mevcut
- [ ] **KUTSAL tahsilat** çalışıyor
- [ ] Müşteri detay tab sistemi çalışıyor (FAZ 4)
- [ ] Mevcut sayfalar bozulmadı
- [ ] Audit log çalışıyor

---

## ⚠️ ÖNEMLİ NOTLAR

### 1. Mevcut Sayfaları Bozma
Bazı menülerde **zaten** sayfa var:
- `/musteriler` ✅ var
- `/musteriler/yeni` ✅ var
- `/musteriler/borclular` ✅ var
- `/tahsilat` ✅ var
- `/dekontlar` ✅ var
- ...

**Bunları DOKUNMA**, sadece `placeholder` olmayanları config'e kaydet.

### 2. Placeholder Sayfaları Şık Olsun
"Yakında" demek yerine **"Geliyor"** de. Müşteriye gösterirken **profesyonel** durmalı:

❌ "Bu sayfa henüz yapılmadı"
✅ "🎯 Yakında Sizinle! - Bu özellik bayram sonrası TilbeCore Faz 2 ile geliyor"

### 3. Bildirim Sayılarını Cache'le
Her sayfa yüklemesinde API çağırma. 30 saniye cache yeterli.

### 4. Klavye Kısayolları Input Dışında
Input'a yazarken Ctrl+M tetiklenmemeli:
```typescript
if (e.target instanceof HTMLInputElement) return;
```

### 5. Türkçe Karakter
Menü adları Türkçe karakter içeriyor (Müşteriler, Kurbanlar). Font destekli olsun.

### 6. İkon Tutarlılığı
Lucide-react'tan **mantıklı ikonlar** seç. Listede önerilen ikonlar var, takip et.

### 7. Bildirim Rozet Rengi
- 🟢 Yeşil: pozitif (yeni mesaj)
- 🟡 Sarı: dikkat (borçlu)
- 🔴 Kırmızı: acil (kritik borç)

---

## 📊 RAPOR ŞABLONU (Tamamlandığında)

```markdown
# FAZ 5 TAMAMLANDI — Sidebar 12 Menü Sistemi

## ✅ Tamamlanan
- [x] Sidebar config (12 ana menü, ~90 alt menü)
- [x] PlaceholderSayfa component
- [x] Sidebar componentleri (8 dosya)
- [x] Bildirim servisi (API + frontend)
- [x] Yetki filtreleme
- [x] ~50 placeholder sayfa
- [x] Klavye kısayolları
- [x] Mobile drawer

## 🧪 Test Sonuçları
- pnpm tsc --noEmit: ✅
- Sidebar render: ✅
- Akordeon: ✅
- Bildirim: ✅
- Yetki: ✅
- Klavye: ✅
- Mobile: ✅
- KUTSAL tahsilat: ✅
- FAZ 4 müşteri tab: ✅
- Mevcut sayfalar: ✅

## 📦 Git
- Toplam commit: X
- Push: ✅

## ⚠️ Atlanılanlar
- (varsa, gerekçesiyle)

## 🎯 Sıradaki Adım
FAZ 6 (Dashboard güçlendirme veya WhatsApp toplu) için hazır.
```

---

## 🚀 BAŞLA

Otonom modda çalış. Her adımda commit at. Bittiğinde push yap ve rapor ver.

**Sorun olursa dur ve sor.** Mevcut sistem kırılırsa **geri al ve sor**.

**Bayrama:** ~10 gün. Bu prompt **1 günde** uygulanmalı.

**Hayırlı kodlar! 🐂✨**
