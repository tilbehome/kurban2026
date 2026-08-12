---
id: ARCH-BC49F3636C62
status: ARCHIVED
owner: Historical
source_role: historical_record
source_of_truth: false
last_reviewed: not_applicable
verified_against_commit: not_applicable
---

# TİLBE KURBAN — MENÜ GENİŞLETME PROMPT (FAZ 1.5)

> Bu prompt'u Claude Code'a tek seferde ver. Mevcut çalışan sistemi BOZMAYACAK.
> Akordiyon menü + 35 alt sayfa ekleyecek.

---

## 🎯 HEDEF

Mevcut tilbe-kurban projesine:
1. **Akordiyon sol menü** ekle (tıklanınca alt menüler açılır/kapanır)
2. **35 alt sayfa** oluştur (kritik olanlar fonksiyonel, gerisi "Yakında" placeholder)
3. **Modüler yapıyı koru/oluştur**

## ⚠️ KRİTİK KURALLAR — MUTLAKA UYGULAYIN

### 🚫 BOZMA KURALLARI

1. **Mevcut çalışan sayfaları KESİNLİKLE bozma:**
   - `/musteriler` — çalışıyor ✅
   - `/hayvanlar` — çalışıyor ✅
   - `/tahsilat` — çalışıyor ✅ (TKR-2026-NNN dekontları, ödeme API'si)
   - `/kasa` — çalışıyor ✅
   - `/raporlar` — çalışıyor ✅

2. **API endpointlerini değiştirme:**
   - `/api/tahsilat/odeme` — çalışıyor, dokunma
   - Diğer mevcut API'ler — dokunma

3. **Prisma schema'sına dokunma** — modeller doğru çalışıyor

4. **Mevcut bileşenleri taşırken** import path'lerini güncelle, eski yerinden silmeden önce yeni yerden çalıştığını doğrula

### ✅ YAPMA SIRASI (BU SIRAYI BOZMAYIN)

**ADIM 1: Önce mevcut sistemi anla**
```bash
# Önce dosya yapısını tara
ls -la
ls -la app/
ls -la components/
ls -la lib/

# Mevcut sidebar bileşenini bul
grep -r "Müşteriler" --include="*.tsx" -l
grep -r "Tahsilat" --include="*.tsx" -l

# Mevcut menü yapısını oku
# Sidebar.tsx veya Navigation.tsx gibi bir dosya olmalı
```

**ADIM 2: Mevcut yapıyı raporla**
Aşağıdaki bilgileri çıkar, bana yazılı rapor olarak ver:
- Mevcut klasör yapısı (app/, components/, lib/, modules/ var mı?)
- Mevcut sidebar dosyası nerede ve içeriği nasıl?
- Hangi route'lar var?
- Modüler mimari kuruldu mu, kurulmadı mı?

**ADIM 3: PLAN sun, ben onaylayım**
Mevcut yapıya göre 2 senaryo öner:
- Senaryo A: Mevcut yapıyı koru, sadece menü genişlet
- Senaryo B: Modüler yapıya geçiş yap (modules/ klasörü altında)

Hangisinin daha az riskli olduğunu söyle, ben karar vereyim.

**ADIM 4: Onayım sonrası kodlamaya başla**

---

## 📋 EKLENECEK MENÜ YAPISI (35 SAYFA)

### Sidebar Akordiyon Yapısı

```
📊 Dashboard                          → /
                                      (tek sayfa, akordiyon yok)

────────────────────────────────────────

👥 Müşteriler                          (akordiyon)
   ├─ Tüm Müşteriler                  → /musteriler
   ├─ Yeni Müşteri Ekle               → /musteriler/yeni
   ├─ Müşteri Ara                     → /musteriler/ara
   ├─ Hesap Ekstresi                  → /musteriler/ekstre
   └─ Borçlular Listesi               → /musteriler/borclular

────────────────────────────────────────

🐄 Kurbanlar                           (akordiyon)
   ├─ Tüm Kurbanlar                   → /kurbanlar
   ├─ Yeni Kurban Ekle                → /kurbanlar/yeni
   ├─ Hisse Atama                     → /kurbanlar/hisse-atama
   ├─ Boş Hisseler                    → /kurbanlar/bos-hisseler
   └─ Vekalet Listesi                 → /kurbanlar/vekalet

────────────────────────────────────────

💰 Tahsilat                            (akordiyon)
   ├─ Yeni Tahsilat                   → /tahsilat
   ├─ Bugünkü Tahsilatlar             → /tahsilat/bugun
   ├─ Tüm Tahsilatlar                 → /tahsilat/tum
   ├─ Dekontlar                       → /tahsilat/dekontlar
   └─ İptal / İade                    → /tahsilat/iptal

────────────────────────────────────────

💵 Kasa                                (akordiyon)
   ├─ Genel Kasa Durumu               → /kasa
   ├─ Nakit Kasası                    → /kasa/nakit
   ├─ Havale Hesabı                   → /kasa/havale
   ├─ POS (Kart)                      → /kasa/pos
   ├─ Gider Girişi                    → /kasa/gider
   ├─ Kasa Hareketleri                → /kasa/hareketler
   ├─ Kasa Açılış                     → /kasa/acilis
   └─ Kasa Kapanış (Gün Sonu)         → /kasa/kapanis

────────────────────────────────────────

📈 Raporlar                            (akordiyon)
   ├─ Günlük Özet                     → /raporlar
   ├─ Borç Raporu                     → /raporlar/borc
   ├─ Tahsilat Raporu                 → /raporlar/tahsilat
   ├─ Müşteri Bazlı Rapor             → /raporlar/musteri
   ├─ Kurban Bazlı Rapor              → /raporlar/kurban
   ├─ Kasa Raporu                     → /raporlar/kasa
   └─ Excel İndirme Merkezi           → /raporlar/excel

────────────────────────────────────────

⚙️ Ayarlar                             (akordiyon)
   ├─ Firma Bilgileri                 → /ayarlar
   ├─ Kullanıcılar                    → /ayarlar/kullanicilar
   ├─ Yedekleme                       → /ayarlar/yedekleme
   └─ Sistem Bilgisi                  → /ayarlar/sistem
```

**Toplam: 7 ana menü, 35 alt sayfa**

---

## 🎨 AKORDİYON MENÜ DAVRANIŞI

### Davranış Kuralları

1. **Varsayılan:** Sadece o anki aktif menü açık (diğerleri kapalı)
2. **Tıklama:** Ana menüye tıklayınca **alt menüler açılır/kapanır**
3. **Animasyon:** 200ms smooth transition (height auto)
4. **Aktif sayfa:** İçinde bulunulan sayfa **turuncu vurgulu**
5. **Ana menü vurgu:** Aktif sayfanın ana menüsü de hafif vurgulu
6. **Chevron ikon:** Açık → ▼, kapalı → ▶
7. **State persistence:** Açık/kapalı durumu localStorage'da saklanır (sayfa yenilendiğinde aynı kalsın)

### Bileşen Yapısı (örnek)

```tsx
// components/Sidebar.tsx
'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

type MenuItem = {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: { label: string; href: string }[];
};

const menu: MenuItem[] = [
  { label: 'Dashboard', href: '/', icon: <DashboardIcon /> },
  {
    label: 'Müşteriler',
    icon: <UsersIcon />,
    children: [
      { label: 'Tüm Müşteriler', href: '/musteriler' },
      { label: 'Yeni Müşteri Ekle', href: '/musteriler/yeni' },
      { label: 'Müşteri Ara', href: '/musteriler/ara' },
      { label: 'Hesap Ekstresi', href: '/musteriler/ekstre' },
      { label: 'Borçlular Listesi', href: '/musteriler/borclular' },
    ],
  },
  // ... diğer menüler
];

export function Sidebar() {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  // localStorage'dan açık menüleri yükle
  useEffect(() => {
    const saved = localStorage.getItem('openMenus');
    if (saved) setOpenMenus(JSON.parse(saved));

    // Aktif sayfanın ana menüsünü otomatik aç
    const activeParent = menu.find(m =>
      m.children?.some(c => pathname.startsWith(c.href))
    );
    if (activeParent && !openMenus.includes(activeParent.label)) {
      setOpenMenus(prev => [...prev, activeParent.label]);
    }
  }, [pathname]);

  // localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('openMenus', JSON.stringify(openMenus));
  }, [openMenus]);

  const toggleMenu = (label: string) => {
    setOpenMenus(prev =>
      prev.includes(label)
        ? prev.filter(m => m !== label)
        : [...prev, label]
    );
  };

  return (
    <nav className="w-64 bg-white border-r border-stone-200 flex flex-col">
      {/* Her menü için aktif olma + akordiyon mantığı */}
    </nav>
  );
}
```

---

## 📄 SAYFA ÖNCELİK STRATEJİSİ

35 sayfayı 2 hafta içinde yetiştirmek için **3 öncelik kategorisi**:

### 🔴 ÖNCELİK 1 — FONKSİYONEL (Bayram günü kullanılacak)
Bunlar **tam çalışır olmak zorunda**:

1. `/` Dashboard (KPI özet, son işlemler)
2. `/musteriler` ✅ (mevcut, geliştirilecek)
3. `/musteriler/yeni` (müşteri ekleme formu)
4. `/musteriler/[id]` (müşteri detay sayfası)
5. `/musteriler/borclular` (borçlu listesi)
6. `/kurbanlar` (70 dana listesi)
7. `/kurbanlar/hisse-atama` (kritik!)
8. `/tahsilat` ✅ (mevcut)
9. `/tahsilat/bugun` (bugünkü işlemler)
10. `/tahsilat/dekontlar` (TKR listesi + yeniden bas)
11. `/kasa` (genel durum)
12. `/kasa/gider` (gider girişi)
13. `/raporlar` (günlük özet)
14. `/raporlar/borc` (borç raporu + Excel)
15. `/ayarlar/yedekleme` (otomatik + manuel)

**Toplam: 15 sayfa fonksiyonel olmalı**

### 🟡 ÖNCELİK 2 — TEMEL (Çalışsın, gelişmiş özellikler sonra)
Bunlar **temel halde olsun**, detay sonra:

16. `/musteriler/ara` (özel arama sayfası)
17. `/musteriler/ekstre` (müşteri hesap ekstresi)
18. `/kurbanlar/yeni` (kurban ekleme)
19. `/kurbanlar/bos-hisseler`
20. `/kurbanlar/vekalet`
21. `/tahsilat/tum` (tüm tahsilatlar)
22. `/tahsilat/iptal` (iptal listesi)
23. `/kasa/hareketler` (kasa hareketleri)
24. `/kasa/acilis` (gün başında nakit girme)
25. `/kasa/kapanis` (gün sonu)
26. `/raporlar/tahsilat`
27. `/raporlar/kasa`
28. `/raporlar/excel` (Excel merkezi)
29. `/ayarlar` (firma bilgileri)
30. `/ayarlar/sistem`

**Toplam: 15 sayfa temel halde**

### 🟢 ÖNCELİK 3 — PLACEHOLDER (Bayram sonrası geliştir)
Bunlar **"Yakında" sayfası** olsun:

31. `/kasa/nakit` (nakit kasa detay)
32. `/kasa/havale` (havale hesap detay)
33. `/kasa/pos` (POS detay)
34. `/raporlar/musteri` (müşteri bazlı detay rapor)
35. `/raporlar/kurban` (kurban bazlı detay rapor)
36. `/ayarlar/kullanicilar` (çoklu kullanıcı yönetimi)

**Toplam: 5 sayfa placeholder**

---

## 🛠️ "YAKINDA" PLACEHOLDER SAYFA ŞABLONU

Öncelik 3 sayfalar için bu şablonu kullan:

```tsx
// app/(modules)/[modul]/[sayfa]/page.tsx
import { Construction } from 'lucide-react';

export default function YakindaSayfasi() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Construction className="w-16 h-16 text-stone-300" />
      <h1 className="text-2xl font-medium text-stone-700">Yakında</h1>
      <p className="text-stone-500 text-center max-w-md">
        Bu sayfa bayram sonrası geliştirme listesindedir.
      </p>
      <p className="text-sm text-stone-400">
        Acil ihtiyaç varsa lütfen bildirin.
      </p>
    </div>
  );
}
```

---

## 🚀 GELIŞTIRME SIRASI (BU SIRAYI BOZMAYIN)

### ADIM 1: Hazırlık (30 dk)
- [ ] Mevcut sistemi tara, rapor ver
- [ ] Plan onayı al
- [ ] Lucide-react ikon paketinin yüklü olduğunu kontrol et

### ADIM 2: Sidebar bileşeni (1-2 saat)
- [ ] Yeni `components/Sidebar.tsx` bileşeni oluştur (mevcudu yedekleyip değiştir)
- [ ] Akordiyon mantığı + localStorage state
- [ ] Aktif sayfa vurgulama (turuncu)
- [ ] İkon eşleştirme (lucide-react: Users, Beef, Wallet, Banknote, BarChart3, Settings)
- [ ] Mobile responsive (gerekirse)

### ADIM 3: Route yapısı (1 saat)
- [ ] Tüm 35 sayfa için klasör/dosya oluştur
- [ ] Her sayfaya minimum içerik koy (en azından başlık + breadcrumb)
- [ ] Layout doğru çalıştığını test et

### ADIM 4: Öncelik 3 sayfaları (15 dk)
- [ ] "Yakında" şablonunu 5 sayfaya kopyala
- [ ] Tıklanınca yakında sayfası açılsın

### ADIM 5: Öncelik 2 sayfaları (4-6 saat)
- [ ] Her sayfaya temel CRUD veya görüntüleme yetisi ekle
- [ ] Mevcut Prisma modellerini kullan
- [ ] Form'lar varsa zod + react-hook-form
- [ ] Tablolar varsa sortable + filterable

### ADIM 6: Öncelik 1 sayfaları (8-12 saat)
- [ ] **Bu sayfalar gerçekten kritik, dikkat:**

#### Dashboard (`/`)
- KPI kartları (toplam müşteri, borçlu, tahsil, bekleyen)
- Son 10 tahsilat
- Bugün yapılması gerekenler

#### Müşteri detay (`/musteriler/[id]`)
- Avatar + ad soyad + telefon
- WhatsApp/Ara butonları
- Hisseler listesi
- Ödemeler listesi
- Notlar
- Hızlı ödeme alma formu

#### Borçlular (`/musteriler/borclular`)
- Filtrelenebilir tablo (alfabe, borç miktarı, hisse sayısı)
- Toplu WhatsApp hatırlatma gönderme
- Excel'e export

#### Hisse atama (`/kurbanlar/hisse-atama`)
- Kurban seç → boş hisseleri göster → müşteri seç → fiyat gir → onayla
- Toplu atama da olabilmeli (5 hisse aynı müşteriye)

#### Dekontlar (`/tahsilat/dekontlar`)
- Tüm dekont listesi (TKR-2026-NNN)
- Tarih, müşteri, tutar, yöntem
- Detay → PDF yeniden indirme
- İptal et butonu

#### Kasa gider girişi (`/kasa/gider`)
- Form: tutar, açıklama, kategori (yem/personel/elektrik/malzeme), yöntem (nakit/havale)
- KasaHareketi kaydı oluştur

#### Borç raporu (`/raporlar/borc`)
- Tüm borçluları listele (sorted by borç)
- Filtreler: tarih, miktar
- Excel'e dışa aktar (xlsx kütüphanesi)

#### Yedekleme (`/ayarlar/yedekleme`)
- Manuel yedek al butonu
- Otomatik yedek geçmişi (son 30 gün)
- USB'ye kopyala / İndir
- Yedekten geri yükle (tehlikeli, çift onay)

### ADIM 7: Test (1-2 saat)
- [ ] Tüm 35 sayfa tıklanabiliyor mu?
- [ ] Akordiyon doğru açılıp kapanıyor mu?
- [ ] Aktif sayfa vurgulu mu?
- [ ] localStorage çalışıyor mu?
- [ ] Mevcut sistem hala çalışıyor mu? (tahsilat, dekont basma, vs.)

---

## 🔍 KONTROL LİSTESİ (Bitirince)

Bana şu raporu ver:

```
✅ TAMAMLANDI:
- Akordiyon sidebar bileşeni
- 35 sayfa route'u oluşturuldu
- Öncelik 1 sayfa sayısı: X/15 fonksiyonel
- Öncelik 2 sayfa sayısı: X/15 temel
- Öncelik 3 sayfa sayısı: X/5 placeholder
- localStorage state persistence çalışıyor
- Mevcut tahsilat akışı bozulmadı (test: dekont aldım, çalıştı)

⚠️ DİKKAT:
- Şunu/bunu değiştirdim, eğer sorun olursa söyleyin

❓ KARAR BEKLEYEN:
- Şu konuda emin değilim, ne yapayım?

📋 TEST KOMUTLARI:
[Bu komutları çalıştırıp sonuç paylaş]
```

---

## ❌ YAPILMAYACAKLAR

- ❌ Mevcut çalışan API'leri değiştirme
- ❌ Prisma schema'sına yeni model ekleme (mevcutla idare et)
- ❌ npm/pnpm install yapma (mevcut paketlerle yap)
- ❌ Tailwind config değiştirme
- ❌ Mevcut renk paletini değiştirme (Tilbe Orange #ea580c kalsın)
- ❌ Dark mode ekleme
- ❌ i18n ekleme
- ❌ Test (jest/vitest) yazma — zaman yok
- ❌ Storybook
- ❌ E-fatura entegrasyonu

---

## ✅ YAPILACAKLAR

- ✅ Mevcut çalışan sistemi koru
- ✅ Akordiyon menü ekle (35 sayfa)
- ✅ Öncelik 1 sayfaları fonksiyonel yap
- ✅ Öncelik 2 sayfaları temel halde yap
- ✅ Öncelik 3 sayfaları "Yakında" placeholder yap
- ✅ Türkçe arayüz
- ✅ Mobile responsive
- ✅ Klavye kısayolları (Ctrl+K arama)
- ✅ Aktif sayfa vurgulama
- ✅ localStorage state
- ✅ Smooth animasyonlar (200ms)

---

## 🎬 BAŞLAT

1. Önce mevcut yapıyı tara ve bana rapor ver
2. Plan sun (Senaryo A / Senaryo B)
3. Onayımı bekle
4. Adım adım uygula
5. Her adım sonrası "ADIM X bitti, test edin" diye haber ver

**Önemli:** Acele etme, mevcut sistemi bozma. Hata yaparsan geri al. Her adımda küçük commit at.

İyi çalışmalar 🚀
