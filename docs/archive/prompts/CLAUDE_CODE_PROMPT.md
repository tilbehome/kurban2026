# TİLBE KURBAN — Claude Code Master Prompt (Modüler Mimari v2)

> 10 Ağustos 2026 uyum notu: Bu prompt tarihsel referanstır. Güncel bağlayıcı kaynak `TILBECORE-KURBAN-BIRLESIK-ANA-MIMARI-VE-YOL-HARITASI.md` belgesidir. Küçükbaş modül örnekleri, eski klasör sırası ve tek firma varsayımları yeni ana belgeyle çelişirse uygulanmaz.

> Bu prompt'u kopyala, yeni bir Claude Code oturumunda yapıştır.
> **Modüler mimari** ile gelecekte ekleme/genişletme kolay.

---

## 🎯 Proje Tanımı

**İsim:** `tilbe-kurban`
**Sahibi:** Tilbehome — Sakarya/Serdivan, kurban besi çiftliği
**Amaç:** Kurban Bayramı 2026 için tahsilat ve kesim takip sistemi
**Vizyon:** TilbeCore ürün ailesinin parçası, gelecekte çiftliklere satılabilir SaaS
**Kullanım:** Lokal bilgisayar + LAN üzerinden 5+ kullanıcı
**Deadline:** ~10 gün (Kurban Bayramı yaklaşık 5-7 Haziran 2026)

## ⚠️ Kritik Kurallar

1. **MODÜLER MİMARİ**: Her özellik kendi modülünde, sonradan ekleme/çıkarma kolay
2. **Veri kaybı yok**: SQLite + her ödemede otomatik yedek
3. **Hızlı UI**: Kasiyer 30 saniyede ödeme almalı
4. **Hatasız hesap**: `Math.round()` zorunlu, float artifact yok
5. **Erişilebilir**: Butonlar min 44px, büyük yazı
6. **Türkçe**: Tüm arayüz
7. **Responsive**: Telefon/tablet/desktop

---

## 🧩 MODÜLER MİMARİ (En Önemli Kısım)

### Modül Nedir?

Bir modül = **kendi içinde komple bir özellik paketi**. Sayfaları, API'leri, bileşenleri, DB modeli, izinleri kendi klasöründe.

### Klasör Yapısı

```
tilbe-kurban/
├── prisma/
│   └── schema.prisma           ← Tüm modüllerin Prisma modelleri burada birleşir
│
├── app/                        ← Next.js App Router (INCE)
│   ├── layout.tsx
│   ├── page.tsx                ← Dashboard
│   ├── giris/page.tsx
│   ├── (modules)/[...slug]/page.tsx  ← Dynamic module router
│   └── api/[...path]/route.ts        ← Dynamic module API router
│
├── modules/                    ← TÜM MODÜLLER
│   ├── _core/                  ← Çekirdek (her zaman lazım)
│   │   ├── module.config.ts
│   │   ├── auth/
│   │   ├── ayarlar/
│   │   └── yedekleme/
│   │
│   ├── musteriler/             ← Müşteri yönetimi
│   │   ├── module.config.ts
│   │   ├── pages/{liste,detay,yeni}.tsx
│   │   ├── components/{MusteriArama,MusteriKart}.tsx
│   │   ├── api/{liste,ara,kayit}.ts
│   │   └── lib/musteri.helpers.ts
│   │
│   ├── hayvanlar/              ← Kurban/hisse yönetimi
│   │   ├── module.config.ts
│   │   ├── pages/, components/, api/, lib/
│   │
│   ├── tahsilat/               ← ⭐ En kritik modül
│   │   ├── module.config.ts
│   │   ├── pages/{ana,musteri}.tsx
│   │   ├── components/{OdemeFormu,DekontPDF,MusteriAramaModal}.tsx
│   │   ├── api/{odeme,iptal}.ts
│   │   └── lib/dekont.ts
│   │
│   ├── kasa/                   ← Kasa
│   ├── raporlar/               ← Raporlama
│   ├── kesim-takip/            ← Faz 2 (TV ekranı + saha)
│   │
│   └── _example/               ← Yeni modül şablonu
│
├── shared/                     ← Modüller arası paylaşılan
│   ├── components/             ← UI bileşenleri
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── para.ts             ← formatPara
│   │   ├── tarih.ts            ← formatTarih
│   │   ├── module-loader.ts    ← ⭐ Modülleri yükler
│   │   ├── events.ts           ← Modüller arası iletişim
│   │   ├── permissions.ts      ← İzin kontrolü
│   │   └── backup.ts           ← DB yedek
│   └── types/module.types.ts
│
└── ...
```

### Modül Config Dosyası (`module.config.ts`)

Her modülün **olmazsa olmazı**:

```typescript
// modules/tahsilat/module.config.ts
import type { ModuleConfig } from '@/shared/types/module.types';

export const tahsilatModule: ModuleConfig = {
  id: 'tahsilat',
  ad: 'Tahsilat',
  aciklama: 'Müşteri ödemeleri ve dekont yönetimi',
  versiyon: '1.0.0',
  aktif: true,
  sira: 20,
  ikon: 'Wallet',  // lucide-react ikon adı
  anaRota: '/tahsilat',
  izinler: ['admin', 'kasiyer'],
  bagimliliklar: ['musteriler', 'hayvanlar'],

  sayfalar: [
    { yol: '/tahsilat', component: 'pages/ana', ad: 'Ana Sayfa' },
    { yol: '/tahsilat/musteri/[id]', component: 'pages/musteri', ad: 'Müşteri Detay' },
  ],

  api: [
    { yol: '/api/tahsilat/odeme', component: 'api/odeme', methods: ['POST'] },
    { yol: '/api/tahsilat/iptal/[id]', component: 'api/iptal', methods: ['POST'] },
  ],

  widgets: [
    { id: 'bugunkuTahsilat', ad: 'Bugünkü Tahsilat', component: 'components/BugunWidget', boyut: 'medium' },
  ],

  olaylar: {
    yayinla: ['odeme:tamamlandi', 'odeme:iptal'],
    dinle: ['musteri:silindi'],
  },
};

export default tahsilatModule;
```

### Modül Type (`shared/types/module.types.ts`)

```typescript
export interface ModuleConfig {
  id: string;
  ad: string;
  aciklama: string;
  versiyon: string;
  aktif: boolean;
  sira: number;
  ikon: string;
  anaRota: string;
  izinler: ('admin' | 'kasiyer' | 'misafir')[];
  bagimliliklar?: string[];
  sayfalar: ModulSayfa[];
  api?: ModulAPI[];
  widgets?: ModulWidget[];
  olaylar?: { yayinla?: string[]; dinle?: string[] };
  seed?: (prisma: any) => Promise<void>;
}

export interface ModulSayfa {
  yol: string;
  component: string;
  ad: string;
  layout?: 'default' | 'fullscreen' | 'tv';
  izin?: string[];
}

export interface ModulAPI {
  yol: string;
  component: string;
  methods: ('GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH')[];
}

export interface ModulWidget {
  id: string;
  ad: string;
  component: string;
  boyut: 'small' | 'medium' | 'large';
}
```

### Modül Yükleyici (`shared/lib/module-loader.ts`)

```typescript
import { coreModule } from '@/modules/_core/module.config';
import { musterilerModule } from '@/modules/musteriler/module.config';
import { hayvanlarModule } from '@/modules/hayvanlar/module.config';
import { tahsilatModule } from '@/modules/tahsilat/module.config';
import { kasaModule } from '@/modules/kasa/module.config';
import { raporlarModule } from '@/modules/raporlar/module.config';
import { kesimTakipModule } from '@/modules/kesim-takip/module.config';

export const tumModuller = [
  coreModule,
  musterilerModule,
  hayvanlarModule,
  tahsilatModule,
  kasaModule,
  raporlarModule,
  kesimTakipModule,
];

export function aktifModuller(rol?: string) {
  return tumModuller
    .filter(m => m.aktif)
    .filter(m => !rol || m.izinler.includes(rol as any))
    .sort((a, b) => a.sira - b.sira);
}

export function moduluBul(id: string) {
  return tumModuller.find(m => m.id === id);
}
```

### Dynamic Page Router (`app/(modules)/[...slug]/page.tsx`)

```typescript
import { tumModuller } from '@/shared/lib/module-loader';
import { notFound } from 'next/navigation';

export default async function ModulSayfa({ params }: { params: { slug: string[] } }) {
  const yol = '/' + params.slug.join('/');

  for (const modul of tumModuller) {
    if (!modul.aktif) continue;

    const sayfa = modul.sayfalar.find(s => {
      const pattern = s.yol.replace(/\[[\w]+\]/g, '[^/]+');
      return new RegExp(`^${pattern}$`).test(yol);
    });

    if (sayfa) {
      const Komponent = (await import(`@/modules/${modul.id}/${sayfa.component}`)).default;
      return <Komponent params={params} />;
    }
  }

  notFound();
}
```

### Sidebar Otomatik (`shared/components/Sidebar.tsx`)

```typescript
import { aktifModuller } from '@/shared/lib/module-loader';
import * as Icons from 'lucide-react';
import Link from 'next/link';

export function Sidebar({ kullaniciRol }: { kullaniciRol: string }) {
  const moduller = aktifModuller(kullaniciRol);

  return (
    <nav className="flex flex-col gap-1">
      {moduller.map(modul => {
        const Icon = (Icons as any)[modul.ikon] || Icons.Square;
        return (
          <Link key={modul.id} href={modul.anaRota} className="...">
            <Icon size={20} />
            <span>{modul.ad}</span>
          </Link>
        );
      })}
    </nav>
  );
}
```

### Olay Sistemi (`shared/lib/events.ts`)

```typescript
type Dinleyici = (veri: any) => void | Promise<void>;
const dinleyiciler: Record<string, Dinleyici[]> = {};

export function yayinla(olay: string, veri: any) {
  (dinleyiciler[olay] || []).forEach(d => {
    try { d(veri); } catch (e) { console.error(`Olay hatası (${olay}):`, e); }
  });
}

export function dinle(olay: string, dinleyici: Dinleyici) {
  if (!dinleyiciler[olay]) dinleyiciler[olay] = [];
  dinleyiciler[olay].push(dinleyici);
  return () => {
    dinleyiciler[olay] = dinleyiciler[olay].filter(d => d !== dinleyici);
  };
}
```

### Yeni Modül Ekleme (gelecekte)

```bash
# 1. Şablonu kopyala
cp -r modules/_example modules/yeni-modul

# 2. module.config.ts düzenle (id, ad, ikon, sayfalar)

# 3. module-loader.ts'e ekle:
# import { yeniModul } from '@/modules/yeni-modul/module.config';
# tumModuller'e ekle

# 4. DB modeli varsa schema.prisma'ya ekle, migrate çek

# 5. Bitti! Sidebar'da otomatik gözükecek.
```

---

## 🛠️ Stack

- Next.js 15 (App Router, Turbopack) + TypeScript strict
- Tailwind CSS + shadcn/ui
- Prisma + SQLite
- lucide-react (ikonlar)
- bcrypt + iron-session (auth)
- xlsx (Excel) + jspdf + html2canvas (dekont)
- date-fns (tr locale)
- zod (validation)
- sonner (toast)
- fuse.js (fuzzy arama)

---

## 🗄️ Prisma Schema (prisma/schema.prisma)

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "sqlite"; url = env("DATABASE_URL") }

// === CORE ===
model Kullanici {
  id            Int       @id @default(autoincrement())
  kullaniciAdi  String    @unique
  sifreHash     String
  adSoyad       String
  rol           String    // admin | kasiyer
  aktif         Boolean   @default(true)
  sonGiris      DateTime?
  createdAt     DateTime  @default(now())
  odemeler      Odeme[]
  kasaHareket   KasaHareketi[]
  @@index([kullaniciAdi])
}

model Ayar {
  anahtar     String   @id
  deger       String
  guncelTarih DateTime @default(now())
}

model ModulDurum {
  id          String   @id
  aktif       Boolean  @default(true)
  versiyon    String
  ayarlar     String?
  yuklemeT    DateTime @default(now())
  guncelTarih DateTime @updatedAt
}

// === MUSTERILER ===
model Musteri {
  id        Int      @id @default(autoincrement())
  adSoyad   String
  telefon   String?
  tcKimlik  String?
  adres     String?
  notlar    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  hisseler  Hisse[]
  @@index([adSoyad])
  @@index([telefon])
}

// === HAYVANLAR ===
model Kurban {
  id              Int      @id @default(autoincrement())
  kesimSirasi     Int      @unique
  kupeNo          String?
  hisseSayisi     Int      @default(7)
  satisBedeli     Float    @default(0)
  canliAgirlik    Float?   @default(0)
  karkasAgirlik   Float?   @default(0)
  durum           String   @default("aktif")  // aktif | bekliyor | kesimde | kesildi | parcalandi | teslim | iptal
  notlar          String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  hisseler        Hisse[]
  @@index([kesimSirasi])
  @@index([durum])
}

model Hisse {
  id              Int       @id @default(autoincrement())
  kurbanId        Int
  kurban          Kurban    @relation(fields: [kurbanId], references: [id], onDelete: Cascade)
  no              Int
  musteriId       Int?
  musteri         Musteri?  @relation(fields: [musteriId], references: [id])
  hisseFiyati     Float     @default(0)
  vekaletAlindi   Boolean   @default(false)
  vekaletTarihi   DateTime?
  notlar          String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  odemeler        Odeme[]
  @@unique([kurbanId, no])
  @@index([musteriId])
}

// === TAHSILAT ===
model Odeme {
  id          Int       @id @default(autoincrement())
  hisseId     Int
  hisse       Hisse     @relation(fields: [hisseId], references: [id], onDelete: Cascade)
  tarih       DateTime  @default(now())
  nakit       Float     @default(0)
  havale      Float     @default(0)
  kart        Float     @default(0)
  toplamTutar Float
  yontem      String    // nakit | havale | kart | karisik
  notlar      String?
  dekontNo    String    @unique
  kullaniciId Int
  kullanici   Kullanici @relation(fields: [kullaniciId], references: [id])
  iptal       Boolean   @default(false)
  iptalSebep  String?
  iptalTarihi DateTime?
  createdAt   DateTime  @default(now())
  @@index([hisseId])
  @@index([tarih])
  @@index([dekontNo])
}

// === KASA ===
model KasaHareketi {
  id          Int       @id @default(autoincrement())
  tip         String    // tahsilat | gider | acilis | kapanis
  tutar       Float
  yontem      String    // nakit | havale | kart
  aciklama    String
  odemeId     Int?
  kullaniciId Int
  kullanici   Kullanici @relation(fields: [kullaniciId], references: [id])
  tarih       DateTime  @default(now())
  @@index([tarih])
}
```

---

## 🎨 Tasarım

- Primary: `#FF6B2C` • Success: `#10b981` • Warning: `#f59e0b` • Danger: `#ef4444`
- Background: `#f8fafc` • Card: `#fff` • Border: `#e8eaed`
- Font: Inter, `letter-spacing: -0.02em`
- Border radius: 10px (kart), 8px (input/button)
- Min 44px buton yüksekliği
- Mobile-first

---

## ⭐ TAHSİLAT MODÜLÜ DETAYI

### Sayfa: `/tahsilat`

```
┌─────────────────────────────────────────────────────────┐
│  TAHSİLAT İŞLEMLERİ                  👤 Ahmet (admin)   │
├─────────────────────────────────────────────────────────┤
│  🔍 [____________________________]  Ctrl+K              │
│     Ad, soyad, telefon, kurban no...                    │
│                                                         │
│  Bugünkü Tahsilatlar:                                   │
│  10:42  AHMET YILMAZ      #18.5    44.000 ₺   N+H      │
│  10:38  MEHMET KAYA       #12.3     7.500 ₺   Nakit    │
│                                                         │
│  ┌──────────┬──────────┬──────────┬──────────┐         │
│  │ NAKİT    │ HAVALE   │ KART     │ TOPLAM   │         │
│  │ 425.000  │ 612.000  │  85.000  │1.122.000 │         │
│  └──────────┴──────────┴──────────┴──────────┘         │
└─────────────────────────────────────────────────────────┘
```

**Davranış:**
- Sayfa açılınca arama input'una otomatik focus
- Ctrl+K kısayolu modal açar
- Min 2 karakter sonrası canlı arama (debounced 200ms, fuse.js)
- Sonuçlarda: Ad Soyad (büyük), telefon, Kurban #no + hisse, borç rozeti
- Aynı isimde birden fazla varsa **telefon + kurban no** ayırt edicidir
- Sonuç yok → "+ Yeni Müşteri Ekle"

### Sayfa: `/tahsilat/musteri/[id]`

**Senaryo A — Tek hisse (Ahmet, Kurban #18, 5. hisse):**

```
┌──────────────────────────────────────────────────────┐
│ ← Geri (Esc)         AHMET YILMAZ                    │
│                      📞 <EXAMPLE_PHONE>  ✏️           │
├──────────────────────────────────────────────────────┤
│  📌 HİSSE DETAYI                                     │
│  Kurban #18 — 5. hisse                               │
│  Hisse Bedeli:                  45.000 ₺             │
│  Ödenmiş:                        1.000 ₺             │
│  ─────────────                                       │
│  KALAN BAKİYE:                  44.000 ₺  ← XL       │
│                                                      │
│  📜 Önceki Ödemeler (1)                              │
│  12.05.2026 14:32  Nakit kapora    1.000 ₺ [↗]      │
├──────────────────────────────────────────────────────┤
│  💵 YENİ ÖDEME AL                                    │
│  Nakit:    [ 10.000     ] ₺                          │
│  Havale:   [ 34.000     ] ₺                          │
│  Kart:     [      0     ] ₺                          │
│  ─────────────                                       │
│  TOPLAM:   44.000 ₺  ✓ Bakiye tam karşılıyor         │
│                                                      │
│  [ Bakiyeyi Otomatik Doldur ]                        │
│  Not: [____________________________]                 │
│                                                      │
│  [ İPTAL ]   [ ✓ ÖDEMEYİ AL ve DEKONT BAS ] (Enter)  │
└──────────────────────────────────────────────────────┘
```

**Senaryo B — Çoklu hisse (Gürkan, 4 hisse):**

```
┌──────────────────────────────────────────────────────┐
│  GÜRKAN ÇELİK    📞 <EXAMPLE_PHONE>                    │
├──────────────────────────────────────────────────────┤
│  📌 HİSSELERİ (4 adet) — Kurban #18                  │
│  Hisse Bedeli (her biri):    50.000 ₺                │
│  TOPLAM BEDEL:              200.000 ₺                │
│  Ödenmiş:                    20.000 ₺                │
│  KALAN BAKİYE:              180.000 ₺  ← XL          │
│                                                      │
│  Hisse 1: 50.000 Kapora 5.000 Kalan 45.000 ⚪       │
│  Hisse 2: 50.000 Kapora 5.000 Kalan 45.000 ⚪       │
│  Hisse 3: 50.000 Kapora 5.000 Kalan 45.000 ⚪       │
│  Hisse 4: 50.000 Kapora 5.000 Kalan 45.000 ⚪       │
│                                                      │
│  💵 YENİ ÖDEME AL                                    │
│  Nakit: [____] Havale: [____] Kart: [____]          │
│                                                      │
│  Dağıtım:                                            │
│  (•) Tüm hisselere eşit (önerilen)                   │
│  ( ) Hisse 1'den başlayarak doldur                   │
│  ( ) Manuel: her hisseye ayrı                        │
│                                                      │
│  [ İPTAL ]   [ ✓ ÖDEMEYİ AL ve DEKONT BAS ]          │
└──────────────────────────────────────────────────────┘
```

**Senaryo C — Hissesi olmayan müşteri:**
- "Yeni Hisse Ata" akışı
- Kurban seç → Boş hisse no seç → Fiyat gir → Onayla → Ödeme ekranına geç

### API: `/api/tahsilat/odeme` (POST)

```typescript
const OdemeSchema = z.object({
  hisseIds: z.array(z.number()).min(1),
  nakit: z.number().min(0).default(0),
  havale: z.number().min(0).default(0),
  kart: z.number().min(0).default(0),
  notlar: z.string().optional(),
  dagitim: z.enum(['esit', 'sirayla', 'manuel']).default('esit'),
  manuelDagitim: z.record(z.number()).optional(),
});

// 1. Auth (session'dan kullaniciId)
// 2. Toplam = Math.round((nakit + havale + kart) * 100) / 100
// 3. Toplam > 0 olmalı
// 4. Kalan bakiye kontrolü (fazla ise uyarı, onaylanırsa devam)
// 5. Yöntem: tek/karışık
// 6. Dekont no: TKR-2026-NNNNNN
// 7. Transaction:
//    - Hisseler arası dağıtım yap
//    - Her hisse için Odeme kaydı
//    - KasaHareketi (her yöntem ayrı satır)
// 8. yedekAl()  ← otomatik DB yedek
// 9. yayinla('odeme:tamamlandi', { odemeId, musteriId, tutar, dekontNo })
// 10. Response: { dekontNo, toplam, yontem, hisseler, pdfUrl }
```

### Dekont PDF

A5 boyutunda, sade. jsPDF ile. İçerik:
- Firma adı/logosu
- "TAHSİLAT MAKBUZU"
- Dekont no, tarih
- Müşteri, kurban
- Nakit/havale/kart ayrı satır
- TOPLAM
- Kalan bakiye
- İşlemi yapan kasiyer
- Teşekkür

---

## 📋 GELİŞTİRME SIRASI

### Faz 0 — Modüler Altyapı (3-4 saat) ⭐ ÖNCE BU
1. Next.js + Prisma + Tailwind + shadcn kur
2. `modules/`, `shared/`, `app/(modules)/` klasör yapısı
3. `module.types.ts`, `module-loader.ts`, `events.ts`, `permissions.ts`
4. Dynamic route + API sistemi
5. Sidebar otomatik üretimi
6. Para/Tarih helper'ları
7. `_example` şablonu

### Faz 1A — Core Modülü (2-3 saat)
8. `modules/_core/auth/` (login, logout, middleware, bcrypt+iron-session)
9. `modules/_core/ayarlar/` (firma bilgisi, dekont alt yazısı)
10. `modules/_core/yedekleme/` (otomatik + manuel)

### Faz 1B — Müşteriler & Hayvanlar (4-5 saat)
11. `modules/musteriler/` (liste, arama fuse.js, detay, yeni)
12. `modules/hayvanlar/` (70 kurban, hisse atama)
13. Seed data yükle (63 kurban + hissedarlar)

### Faz 1C — TAHSİLAT ⭐ KRİTİK (8-10 saat)
14. `modules/tahsilat/` ana sayfa
15. Müşteri arama modal (Ctrl+K, fuzzy)
16. Müşteri detay + ödeme formu
17. 3 senaryo (tek/çoklu/yeni hisse)
18. Dekont PDF
19. Olay yayınlama (`odeme:tamamlandi`)

### Faz 1D — Kasa & Raporlar (3-4 saat)
20. `modules/kasa/` (günlük rapor, hareketler)
21. `modules/raporlar/` (borçlular, tahsilat, kurban bazında, Excel)

### Faz 1E — Cilalama (2-3 saat)
22. Dashboard widget'ları
23. Test, hata düzeltme

### Faz 2 — Kesim Takip Modülü (Faz 1 sonrası, 6-8 saat)
24. `modules/kesim-takip/` (TV ekranı + saha + SSE)

**Toplam Faz 1: ~25-30 saat**

---

## 🏃 Kurulum

```bash
pnpm create next-app@latest . --typescript --tailwind --app --use-pnpm --import-alias='@/*' --no-src-dir --turbopack

pnpm add @prisma/client zod bcrypt iron-session
pnpm add xlsx jspdf html2canvas date-fns sonner lucide-react fuse.js
pnpm add -D prisma tsx @types/bcrypt @types/node

pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button input label card dialog table badge tabs select textarea separator dropdown-menu sheet command toast

echo 'DATABASE_URL=<SECRET>' > .env
pnpm prisma init --datasource-provider sqlite
# schema.prisma'yı yukarıdaki içerikle doldur
pnpm prisma migrate dev --name init
pnpm prisma db seed
pnpm dev
```

İlk kullanıcı: `admin / tilbe2026`

---

## ✅ Kalite Kontrol

Her modül bitince:
- [ ] `module.config.ts` doğru tanımlı
- [ ] Sidebar'da gözüküyor
- [ ] Routing çalışıyor
- [ ] API çalışıyor
- [ ] Yetki kontrolü var
- [ ] Türkçe hata mesajları
- [ ] Mobile responsive
- [ ] Klavye ile kullanılabilir
- [ ] Otomatik yedek alınıyor (kritik işlemler)

---

## ❌ Yapma

- Dark mode, i18n, e-fatura, WhatsApp/SMS API, online sunucu, Storybook, test yazma

## ✅ Olmazsa Olmaz

- Modüler mimari (yeni modül 30 dk'da eklenebilmeli)
- Otomatik DB yedek (her ödemede + her saat başı)
- `Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })`
- `format(d, 'dd.MM.yyyy HH:mm', { locale: tr })`
- Toast (sonner), confirm dialog, skeleton loading
- Klavye kısayolları (Ctrl+K, Esc, Enter)

---

## 🎬 İlk Komut

```bash
pnpm create next-app@latest . --typescript --tailwind --app --use-pnpm --import-alias='@/*' --no-src-dir --turbopack
```

Sonra **Faz 0 (modüler altyapı)**'dan başla. Bu çekirdek doğru kurulmadan modül yazma. Her faz bitince **"Faz X bitti, test edin"** de.

İyi çalışmalar 🐄

---

## 📚 EK: Yeni Modül Ekleme Senaryosu (Gelecek için)

İleride "küçükbaş kurban" modülü eklemek istersen:

```bash
# 1. Şablonu kopyala
cp -r modules/_example modules/kucukbas

# 2. modules/kucukbas/module.config.ts düzenle:
export default {
  id: 'kucukbas',
  ad: 'Küçükbaş Kurban',
  versiyon: '1.0.0',
  aktif: true,
  sira: 25,
  ikon: 'Wheat',
  anaRota: '/kucukbas',
  izinler: ['admin', 'kasiyer'],
  bagimliliklar: ['musteriler', 'tahsilat'],
  sayfalar: [...],
  api: [...],
};

# 3. modules/kucukbas/pages/, components/, api/ doldur

# 4. shared/lib/module-loader.ts'e ekle

# 5. DB modeli gerekirse prisma/schema.prisma'ya ekle, migrate çek

# 6. Bitti! 30 dakikada yeni modül.
```

Bu sayede **TilbeCore vizyonu** için her müşteriye özel modül paketi sunabilirsin.
