---
id: ARCH-07B078A5CEEA
status: ARCHIVED
owner: Historical
source_role: historical_record
source_of_truth: false
last_reviewed: not_applicable
verified_against_commit: not_applicable
---

# PROMPT 1: AKORDİYON MENÜ + 35 ALT SAYFA

> Bu prompt'u Claude Code'a tek seferde yapıştır.
> **ÖNCE CLAUDE.md'yi okumasını söyle.**

---

## 🎯 GÖREV

Mevcut `shared/components/Sidebar.tsx`'i **akordiyon menü** yap. Tüm 7 ana menü için **35 alt sayfa route'u** oluştur. Mevcut çalışan sayfaları KORU.

## ⚠️ BAŞLAMADAN ÖNCE

1. **CLAUDE.md'yi oku** (proje kökünde)
2. **Mevcut yapıyı tara:**
   ```bash
   # Sidebar bileşenini bul ve oku
   find shared/components -name "Sidebar*"
   cat shared/components/Sidebar.tsx

   # AppShell'i oku (sidebar nerede çağrılıyor)
   find shared/components -name "AppShell*"
   cat shared/components/AppShell.tsx

   # Module config örneğini oku
   cat modules/musteriler/module.config.ts
   cat modules/_example/module.config.ts

   # Module loader'ı oku
   cat shared/lib/module-loader.ts

   # Mevcut app/ klasörünü tara
   ls -la app/
   tree app/ -L 2 || find app -type d -maxdepth 2
   ```

3. **Git snapshot al:**
   ```bash
   git add .
   git commit -m "snapshot: akordiyon menü öncesi"
   ```

4. **Bana mevcut yapıyı raporla:**
   - Sidebar nasıl çalışıyor?
   - Module loader nasıl entegre?
   - Mevcut route'lar neler?

   Raporu verdikten sonra **onayımı bekle**, kodlamaya başlama.

---

## 📋 EKLENECEK YAPILAR

### Menü Hiyerarşisi

```
📊 Dashboard                          → / (mevcut, ana sayfa)

👥 Müşteriler                          (akordiyon - 5 alt)
   ├─ Tüm Müşteriler                  → /musteriler ✅ MEVCUT
   ├─ Yeni Müşteri Ekle               → /musteriler/yeni
   ├─ Müşteri Ara                     → /musteriler/ara
   ├─ Hesap Ekstresi                  → /musteriler/ekstre
   └─ Borçlular Listesi               → /musteriler/borclular

🐄 Kurbanlar                           (akordiyon - 5 alt)
   ├─ Tüm Kurbanlar                   → /hayvanlar ✅ MEVCUT
   ├─ Yeni Kurban Ekle                → /hayvanlar/yeni
   ├─ Hisse Atama                     → /hayvanlar/hisse-atama
   ├─ Boş Hisseler                    → /hayvanlar/bos-hisseler
   └─ Vekalet Listesi                 → /hayvanlar/vekalet

💰 Tahsilat                            (akordiyon - 5 alt) ⚠️ DİKKAT
   ├─ Yeni Tahsilat                   → /tahsilat ✅ MEVCUT (KUTSAL)
   ├─ Bugünkü Tahsilatlar             → /tahsilat/bugun
   ├─ Tüm Tahsilatlar                 → /tahsilat/tum
   ├─ Dekontlar                       → /tahsilat/dekontlar
   └─ İptal / İade                    → /tahsilat/iptal

💵 Kasa                                (akordiyon - 8 alt)
   ├─ Genel Kasa Durumu               → /kasa ✅ MEVCUT
   ├─ Nakit Kasası                    → /kasa/nakit
   ├─ Havale Hesabı                   → /kasa/havale
   ├─ POS (Kart)                      → /kasa/pos
   ├─ Gider Girişi                    → /kasa/gider
   ├─ Kasa Hareketleri                → /kasa/hareketler
   ├─ Kasa Açılış                     → /kasa/acilis
   └─ Kasa Kapanış (Gün Sonu)         → /kasa/kapanis

📈 Raporlar                            (akordiyon - 7 alt)
   ├─ Günlük Özet                     → /raporlar ✅ MEVCUT
   ├─ Borç Raporu                     → /raporlar/borc
   ├─ Tahsilat Raporu                 → /raporlar/tahsilat
   ├─ Müşteri Bazlı Rapor             → /raporlar/musteri
   ├─ Kurban Bazlı Rapor              → /raporlar/kurban
   ├─ Kasa Raporu                     → /raporlar/kasa
   └─ Excel İndirme Merkezi           → /raporlar/excel

⚙️ Ayarlar                             (akordiyon - 4 alt)
   ├─ Firma Bilgileri                 → /ayarlar ✅ MEVCUT
   ├─ Kullanıcılar                    → /ayarlar/kullanicilar
   ├─ Yedekleme                       → /ayarlar/yedekleme
   └─ Sistem Bilgisi                  → /ayarlar/sistem

TOPLAM: 7 ana menü + 35 sayfa (mevcut 7 sayfa + 28 yeni)
```

---

## 🔧 YAPILACAKLAR

### ADIM 1: Sidebar Akordiyon Mantığı

Mevcut `shared/components/Sidebar.tsx`'i akordiyon yap:

**Davranış kuralları:**
- Ana menüye tıklayınca: alt menüler **açılır/kapanır** (smooth, 200ms)
- Alt menü tıklayınca: o sayfaya gider
- Aktif sayfa: turuncu vurgulu (`bg-primary/10 text-primary`)
- Aktif sayfanın ana menüsü: otomatik açık + ana menü de hafif vurgulu
- Chevron ikon: açık → `chevron-down`, kapalı → `chevron-right`
- **State persistence:** Açık menüler `localStorage`'da saklansın (anahtar: `sidebar-open-menus`)

**Kod yapısı:**
```tsx
// shared/components/Sidebar.tsx (yenisi)
'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type SubMenu = { label: string; href: string };
type Menu = {
  label: string;
  icon: React.ReactNode;
  href?: string;          // Ana sayfa (tıklanınca gidilebilir)
  children?: SubMenu[];   // Alt menüler
};

const menu: Menu[] = [
  { label: 'Dashboard', href: '/', icon: <LayoutDashboard /> },
  {
    label: 'Müşteriler',
    icon: <Users />,
    children: [
      { label: 'Tüm Müşteriler', href: '/musteriler' },
      { label: 'Yeni Müşteri Ekle', href: '/musteriler/yeni' },
      // ...
    ],
  },
  // ... diğer menüler
];

export function Sidebar() {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  // localStorage'dan yükle + aktif menüyü otomatik aç
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-open-menus');
    const initial = saved ? JSON.parse(saved) : [];

    // Aktif sayfanın ana menüsünü ekle
    const activeParent = menu.find(m =>
      m.children?.some(c => pathname === c.href || pathname.startsWith(c.href + '/'))
    );
    if (activeParent && !initial.includes(activeParent.label)) {
      initial.push(activeParent.label);
    }

    setOpenMenus(initial);
  }, [pathname]);

  // localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('sidebar-open-menus', JSON.stringify(openMenus));
  }, [openMenus]);

  const toggleMenu = (label: string) => {
    setOpenMenus(prev =>
      prev.includes(label)
        ? prev.filter(m => m !== label)
        : [...prev, label]
    );
  };

  const isActiveSubmenu = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const isActiveParent = (menuItem: Menu) =>
    menuItem.children?.some(c => isActiveSubmenu(c.href));

  return (
    <nav className="...">
      {menu.map(item => {
        if (!item.children) {
          // Tek seviyeli menü (Dashboard)
          return (
            <Link
              key={item.label}
              href={item.href!}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium',
                pathname === item.href
                  ? 'bg-primary/10 text-primary'
                  : 'text-stone-700 hover:bg-stone-100'
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        }

        // Akordiyon menü
        const isOpen = openMenus.includes(item.label);
        const isActive = isActiveParent(item);

        return (
          <div key={item.label}>
            <button
              onClick={() => toggleMenu(item.label)}
              className={cn(
                'w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm font-medium',
                isActive ? 'text-primary' : 'text-stone-700 hover:bg-stone-100'
              )}
            >
              <span className="flex items-center gap-3">
                {item.icon}
                {item.label}
              </span>
              {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            </button>

            {/* Alt menüler */}
            {isOpen && (
              <div className="ml-7 mt-1 space-y-1 border-l border-stone-200 pl-3">
                {item.children.map(sub => (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    className={cn(
                      'block px-3 py-1.5 rounded-md text-sm transition-colors',
                      isActiveSubmenu(sub.href)
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                    )}
                  >
                    {sub.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
```

### ADIM 2: Eksik Sayfa Route'larını Oluştur

**28 yeni sayfa** için klasör ve `page.tsx` dosyaları oluştur. Her sayfaya **"Yakında" placeholder** koy.

#### Placeholder Sayfa Şablonu

```tsx
// app/[modul]/[sayfa]/page.tsx
import { SayfaBaslik } from '@/shared/components/SayfaBaslik';
import { Construction } from 'lucide-react';

export default function YakindaSayfasi() {
  return (
    <div className="space-y-6">
      <SayfaBaslik
        baslik="[SAYFA ADI]"
        aciklama="[Açıklama]"
      />

      <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white rounded-lg border border-stone-200">
        <Construction className="size-16 text-stone-300" />
        <h2 className="text-xl font-medium text-stone-700">Yakında</h2>
        <p className="text-stone-500 text-center max-w-md">
          Bu sayfa geliştirme aşamasındadır. Acil ihtiyaç varsa bildirin.
        </p>
      </div>
    </div>
  );
}
```

#### Oluşturulacak Klasör/Dosyalar

```
app/
├── musteriler/
│   ├── page.tsx ✅                 (mevcut)
│   ├── yeni/page.tsx               (YAKINDA)
│   ├── ara/page.tsx                (YAKINDA)
│   ├── ekstre/page.tsx             (YAKINDA)
│   ├── borclular/page.tsx          (YAKINDA)
│   └── [id]/page.tsx               (YAKINDA - detay)
│
├── hayvanlar/
│   ├── page.tsx ✅                 (mevcut)
│   ├── yeni/page.tsx               (YAKINDA)
│   ├── hisse-atama/page.tsx        (YAKINDA)
│   ├── bos-hisseler/page.tsx       (YAKINDA)
│   └── vekalet/page.tsx            (YAKINDA)
│
├── tahsilat/
│   ├── page.tsx ✅                 (mevcut, KUTSAL!)
│   ├── bugun/page.tsx              (YAKINDA)
│   ├── tum/page.tsx                (YAKINDA)
│   ├── dekontlar/page.tsx          (YAKINDA)
│   └── iptal/page.tsx              (YAKINDA)
│
├── kasa/
│   ├── page.tsx ✅                 (mevcut)
│   ├── nakit/page.tsx              (YAKINDA)
│   ├── havale/page.tsx             (YAKINDA)
│   ├── pos/page.tsx                (YAKINDA)
│   ├── gider/page.tsx              (YAKINDA)
│   ├── hareketler/page.tsx         (YAKINDA)
│   ├── acilis/page.tsx             (YAKINDA)
│   └── kapanis/page.tsx            (YAKINDA)
│
├── raporlar/
│   ├── page.tsx ✅                 (mevcut)
│   ├── borc/page.tsx               (YAKINDA)
│   ├── tahsilat/page.tsx           (YAKINDA)
│   ├── musteri/page.tsx            (YAKINDA)
│   ├── kurban/page.tsx             (YAKINDA)
│   ├── kasa/page.tsx               (YAKINDA)
│   └── excel/page.tsx              (YAKINDA)
│
└── ayarlar/
    ├── page.tsx ✅                 (mevcut)
    ├── kullanicilar/page.tsx       (YAKINDA)
    ├── yedekleme/page.tsx          (YAKINDA)
    └── sistem/page.tsx              (YAKINDA)
```

### ADIM 3: SayfaBaslik Bileşeni (Eğer Yoksa)

```tsx
// shared/components/SayfaBaslik.tsx
type Props = {
  baslik: string;
  aciklama?: string;
  children?: React.ReactNode;  // Sağ taraf aksiyon butonları için
};

export function SayfaBaslik({ baslik, aciklama, children }: Props) {
  return (
    <div className="flex items-start justify-between gap-4 pb-2">
      <div>
        <h1 className="text-2xl font-medium text-stone-900 tracking-tight">
          {baslik}
        </h1>
        {aciklama && (
          <p className="text-sm text-stone-500 mt-1">{aciklama}</p>
        )}
      </div>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  );
}
```

### ADIM 4: Test

Bitirdikten sonra şu testleri çalıştır:

```bash
# 1. TypeScript hatası var mı?
pnpm tsc --noEmit

# 2. Build başarılı mı?
pnpm build

# 3. Dev sunucu açılıyor mu?
pnpm dev
# Tarayıcıda http://localhost:3000 → çalışmalı

# 4. Mevcut sayfalar bozulmadı mı?
# (Her birini manuel test et)
- / (Dashboard)
- /musteriler
- /hayvanlar
- /tahsilat       ⚠️ KRİTİK
- /kasa
- /raporlar
- /ayarlar

# 5. Yeni sayfalar açılıyor mu?
# (Birkaç tane test et)
- /musteriler/yeni
- /tahsilat/dekontlar
- /kasa/gider
- /raporlar/borc

# 6. Akordiyon çalışıyor mu?
- Menüye tıkla → açılıyor mu?
- Tekrar tıkla → kapanıyor mu?
- Sayfa yenile → açık menüler hatırlanıyor mu?
- Alt menüye git → ana menü otomatik açık mı?

# 7. TAHSİLAT AKIŞI TESTİ (KRİTİK!)
# CLAUDE.md'deki "Tahsilat Akış Testi" bölümünü çalıştır
```

---

## 📊 TAMAMLAMA RAPORU

İş bitince bana şunu ver:

```markdown
✅ TAMAMLANDI:
- shared/components/Sidebar.tsx → akordiyon yapıldı
- localStorage state persistence çalışıyor
- Aktif sayfa vurgulama OK
- 28 yeni sayfa oluşturuldu (Yakında placeholder)
- SayfaBaslik bileşeni [oluşturuldu/zaten vardı]

🧪 TEST SONUÇLARI:
- pnpm tsc --noEmit: ✅ / ❌
- pnpm build: ✅ / ❌
- Mevcut sayfalar açılıyor: ✅ / ❌
- Yeni sayfalar açılıyor: ✅ / ❌
- Tahsilat akışı (test ödeme): ✅ / ❌
- Akordiyon davranışı: ✅ / ❌

📁 DEĞİŞTİRİLEN DOSYALAR:
- shared/components/Sidebar.tsx
- shared/components/SayfaBaslik.tsx [yeni veya değişti]
- app/musteriler/yeni/page.tsx [yeni]
- app/musteriler/ara/page.tsx [yeni]
- ... (tüm yeni dosyalar)

⚠️ DİKKAT:
- (varsa not düş)

📋 GIT COMMIT:
- "feat: akordiyon menü + 28 yeni sayfa placeholder"
```

---

## 🚫 YAPMA

- Mevcut çalışan sayfaları değiştirme (sadece sidebar'ı değiştir)
- Tahsilat akışını **HİÇ** kurcalama
- Yeni paket yükleme (pnpm install)
- Schema'ya dokunma
- API rotalarını değiştirme
- Auth/session'ı kurcalama

## ✅ YAP

- CLAUDE.md kurallarına uy
- Adım adım git (her büyük değişiklik sonrası commit)
- Test komutlarını çalıştır
- Türkçe arayüz koru
- Mevcut Tilbe Orange (#ea580c) palet koru
- shadcn/ui bileşenlerini kullan

---

## 🎬 BAŞLAT

1. CLAUDE.md'yi oku
2. Mevcut yapıyı tara, rapor ver
3. **ONAYIMI BEKLE**
4. Adım adım uygula (1: Sidebar, 2: Placeholder sayfalar, 3: Test)
5. Test sonuçlarıyla rapor ver

**Başla:** Önce mevcut yapıyı tara ve raporla.
