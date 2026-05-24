# MIMARI.md — TilbeCore Mimari Belgesi

> **TilbeCore** ürün ailesinin geliştirme standartlarını tanımlar.
> Bu belge **Adabereket Kurban Takip** projesi için yazıldı ama tüm TilbeCore ürünlerine uygulanır.
> 
> **Sürüm:** 1.0.0  
> **Tarih:** 24 Mayıs 2026  
> **Yazar:** Tilbehome (Sakarya / Serdivan)  
> **İlk uygulama:** github.com/tilbehome/kurban2026

---

## 📚 İÇİNDEKİLER

1. [Vizyon ve Felsefe](#1-vizyon-ve-felsefe)
2. [Stack Standartları](#2-stack-standartları)
3. [Klasör Yapısı](#3-klasör-yapısı)
4. [Modül Mimarisi](#4-modül-mimarisi)
5. [Veri Katmanı](#5-veri-katmanı)
6. [API Tasarım Standartları](#6-api-tasarım-standartları)
7. [UI Katmanı](#7-ui-katmanı)
8. [Tip Sistemi](#8-tip-sistemi)
9. [Olay Sistemi](#9-olay-sistemi)
10. [Auth ve Yetkilendirme](#10-auth-ve-yetkilendirme)
11. [Hata Yönetimi](#11-hata-yönetimi)
12. [Loglama ve Audit](#12-loglama-ve-audit)
13. [Test Stratejisi](#13-test-stratejisi)
14. [Performans](#14-performans)
15. [Güvenlik](#15-güvenlik)
16. [Yedekleme](#16-yedekleme)
17. [Git Workflow](#17-git-workflow)
18. [Geliştirme Kuralları](#18-geliştirme-kuralları)
19. [TilbeCore Genişleme Yol Haritası](#19-tilbecore-genişleme-yol-haritası)

---

## 1. VİZYON VE FELSEFE

### 1.1 TilbeCore Nedir?

TilbeCore, **Türk e-ticaret operatörleri ve tarım/hayvancılık işletmeleri** için modüler dijital ürün ailesidir. Tek bir teknoloji omurgası üzerinde:

- **Adabereket Kurban Takip** (ilk ürün)
- Diğer çiftlikler için SaaS varyantı
- Küçükbaş hayvan modülü
- Bağış yönetimi modülü
- Et dağıtım modülü
- Et satış / e-ticaret modülü
- Gelecek dikey çözümler

Her ürün **aynı mimariye** uyar — bu sayede:
- Kod yeniden kullanılır
- Geliştirici tek standardı öğrenir
- Test edilmiş bileşenler paylaşılır
- Bakım kolaylaşır

### 1.2 Tasarım Felsefesi

#### 🎯 İlke 1: Modüler ve Eklenebilir
Sistem **lego blokları** gibi olmalı. Yeni özellik = yeni modül. Hiçbir modül başka bir modüle bağımlı çalışmamalı.

#### 🎯 İlke 2: Local-first, Cloud-ready
Internet kopsa bile çalışmalı. Cloud'a senkronizasyon **opsiyonel** olsun.

#### 🎯 İlke 3: Mobil-First Düşünce
Saha personeli telefonla çalışır. Masaüstü ikincil.

#### 🎯 İlke 4: Türkçe ve Yerel
Tüm arayüz Türkçe. Para `₺`, tarih `dd.MM.yyyy`, sayı `1.234,56` (Türkçe format).

#### 🎯 İlke 5: Hız ve Basitlik
3 tıkta her şey yapılabilmeli. Bayram günü kasiyer panikleyemez.

#### 🎯 İlke 6: Veri Kutsaldır
Müşterinin parası kaybolmamalı. Her işlem yedeklenir, audit log'a yazılır.

#### 🎯 İlke 7: Açık ve Anlaşılır Kod
Başka geliştirici 5 dakikada anlayabilmeli. "Magic" kod yok.

---

## 2. STACK STANDARTLARI

### 2.1 Çekirdek Stack (Değişmez)

| Katman | Teknoloji | Sürüm | Neden |
|--------|-----------|-------|-------|
| **Framework** | Next.js (App Router) | 16.x | SSR/SSG, API rotaları, modern React |
| **UI Kütüphane** | React | 19.x | Modern hooks, Server Components |
| **Dil** | TypeScript | 5.x (strict) | Tip güvenliği, refactor kolaylığı |
| **Stil** | Tailwind CSS | v4 | Utility-first, hızlı geliştirme |
| **Bileşen** | shadcn/ui | latest | Erişilebilir, özelleştirilebilir |
| **Form** | react-hook-form + zod | latest | Tip güvenli formlar |
| **ORM** | Prisma | 6.x | Tip güvenli DB, migration |
| **DB (Local)** | SQLite | 3.x | Sıfır kurulum, tek dosya |
| **DB (Cloud)** | PostgreSQL | 16.x | TilbeCore SaaS için |
| **Auth** | iron-session + bcrypt | latest | Cookie-based, güvenli |
| **Validation** | Zod | 4.x | Schema validation |
| **Toast** | Sonner | latest | Modern bildirim |
| **İkonlar** | Lucide React | latest | 1000+ ikon |
| **Tarih** | date-fns | 4.x | Türkçe locale |
| **Excel** | xlsx | latest | Read/write Excel |
| **PDF** | jsPDF + html2canvas | latest | Dekont, ekstre |
| **WhatsApp** | wa.me (click-to-chat) | - | Ücretsiz, basit |
| **Paket Yöneticisi** | pnpm | 11.x | Hızlı, disk dostu |

### 2.2 Yardımcı Kütüphaneler

| Kategori | Kütüphane | Neden |
|----------|-----------|-------|
| **Tablo** | TanStack Table | Sortable, filterable |
| **State** | Zustand | Hafif, basit |
| **Fetch** | TanStack Query (React Query) | Caching, retry |
| **Util** | clsx, tailwind-merge | Class merging |
| **Logging** | Pino (sonra) | Yapısal log |

### 2.3 Geliştirici Araçları

| Araç | Amaç |
|------|------|
| ESLint | Lint |
| Prettier | Format |
| Husky | Pre-commit hooks |
| Vitest | Unit test (sonra) |
| Playwright | E2E test (sonra) |
| TypeScript Compiler | Type check |

### 2.4 Yasak Kütüphaneler

- ❌ Moment.js (date-fns kullan)
- ❌ Lodash (modern JS yeterli)
- ❌ jQuery (asla)
- ❌ Bootstrap (Tailwind kullan)
- ❌ Axios (native fetch yeterli)
- ❌ Redux (Zustand kullan)
- ❌ Styled-components (Tailwind kullan)

---

## 3. KLASÖR YAPISI

### 3.1 Üst Düzey Yapı

```
proje-adi/
├── app/                       # Next.js App Router (SAYFA + API)
│   ├── (auth)/                # Login, register grupları
│   ├── (panel)/               # Korumalı sayfalar
│   ├── api/                   # API endpoint'leri
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Global stil
│
├── modules/                   # İŞ MANTIK MODÜLLERİ
│   ├── _core/                 # Çekirdek (auth, ayarlar, yedek)
│   ├── _example/              # Yeni modül şablonu
│   ├── musteriler/
│   ├── kurbanlar/
│   ├── tahsilat/
│   ├── kasa/
│   ├── raporlar/
│   ├── whatsapp/
│   └── tv-takip/
│
├── shared/                    # PAYLAŞILAN KOD
│   ├── components/            # Ortak UI bileşenleri
│   ├── hooks/                 # Ortak React hooks
│   ├── lib/                   # Ortak helper'lar
│   ├── types/                 # Global tipler
│   └── constants/             # Sabitler
│
├── components/                # SADECE SHADCN/UI
│   └── ui/                    # shadcn bileşenleri (button, card vs.)
│
├── prisma/                    # VERİTABANI
│   ├── schema.prisma          # Schema
│   ├── migrations/            # Migration'lar
│   └── seed.ts                # Seed verisi
│
├── public/                    # STATİK DOSYALAR
│   ├── images/
│   ├── fonts/
│   └── icons/
│
├── backups/                   # OTOMATIK YEDEK
│   └── .gitignore
│
├── docs/                      # BELGELERİME
│   ├── MIMARI.md              # Bu belge
│   ├── CONTRIBUTING.md        # Katkı kuralları
│   ├── MODULES.md             # Modül listesi
│   ├── API.md                 # API referansı
│   └── CHANGELOG.md           # Değişiklikler
│
├── .env                       # Ortam değişkenleri (gitignore)
├── .env.example               # Şablon
├── .gitignore
├── CLAUDE.md                  # Claude Code kuralları
├── README.md                  # Proje tanıtım
├── MIMARI.md                  # Bu belge (kök seviye kısayol)
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── components.json            # shadcn config
```

### 3.2 KESİN KURAL: Her Şeyin Yeri Bellidir

| Ne | Nereye Gider | Örnek |
|----|--------------|-------|
| **Sayfa rotası** | `app/<rota>/page.tsx` | `app/musteriler/page.tsx` |
| **API endpoint** | `app/api/<modul>/<isim>/route.ts` | `app/api/musteriler/liste/route.ts` |
| **Sayfa içeriği** (sadece UI) | `modules/<modul>/pages/<isim>.tsx` | `modules/musteriler/pages/Liste.tsx` |
| **API business logic** | `modules/<modul>/api/<isim>.ts` | `modules/musteriler/api/liste.ts` |
| **Modüle özel bileşen** | `modules/<modul>/components/` | `modules/musteriler/components/Avatar.tsx` |
| **Ortak bileşen** | `shared/components/` | `shared/components/SayfaBaslik.tsx` |
| **shadcn bileşen** | `components/ui/` | `components/ui/button.tsx` |
| **Modüle özel hook** | `modules/<modul>/hooks/` | `modules/musteriler/hooks/useMusteri.ts` |
| **Ortak hook** | `shared/hooks/` | `shared/hooks/useDebounce.ts` |
| **Modüle özel helper** | `modules/<modul>/lib/` | `modules/musteriler/lib/avatar.ts` |
| **Ortak helper** | `shared/lib/` | `shared/lib/para.ts` |
| **Modüle özel tip** | `modules/<modul>/types.ts` | `modules/musteriler/types.ts` |
| **Global tip** | `shared/types/` | `shared/types/api.ts` |

### 3.3 Tek Bir `lib/` Klasörü VAR (Root'ta lib YOK)

```
❌ YANLIŞ:
proje/
├── lib/                ← İŞTE BU OLMAYACAK
├── shared/lib/
└── modules/<modul>/lib/

✅ DOĞRU:
proje/
├── shared/lib/         ← Ortak helper'lar
└── modules/<modul>/lib/ ← Modüle özel
```

Root'taki `lib/` klasörü **kaldırılacak**, içeriği `shared/lib/`'e taşınacak.

---

## 4. MODÜL MİMARİSİ

### 4.1 Modül Nedir?

Bir modül, **kendi başına çalışabilen, başka modüllere bağımsız** bir iş birimi.

Örnekler:
- `musteriler/` — Müşteri yönetimi
- `tahsilat/` — Para alma
- `whatsapp/` — Mesajlaşma
- `tv-takip/` — Kesim takip ekranı

### 4.2 Modül Klasör Yapısı (ZORUNLU)

```
modules/<modul-adi>/
├── module.config.ts           ← Modül tanımı (ZORUNLU)
├── pages/                     ← Sayfa içerikleri
│   ├── Liste.tsx
│   ├── Detay.tsx
│   └── Yeni.tsx
├── api/                       ← Business logic
│   ├── liste.ts
│   ├── detay.ts
│   ├── olustur.ts
│   ├── guncelle.ts
│   └── sil.ts
├── components/                ← Modüle özel bileşenler
│   ├── Avatar.tsx
│   ├── DurumRozet.tsx
│   └── HizliOdeme.tsx
├── hooks/                     ← Modüle özel hooks
│   └── useMusteri.ts
├── lib/                       ← Modüle özel helper'lar
│   ├── avatar.ts
│   └── format.ts
├── types.ts                   ← Modüle özel tipler
└── index.ts                   ← Public API (dışa açılan)
```

### 4.3 module.config.ts Standardı

```typescript
import type { ModuleConfig } from '@/shared/types/module';
import { Users } from 'lucide-react';

export const musterilerModule: ModuleConfig = {
  // Kimlik
  id: 'musteriler',
  ad: 'Müşteriler',
  aciklama: 'Müşteri yönetimi, cari hesap, iletişim',
  versiyon: '1.0.0',
  
  // Durum
  aktif: true,
  sira: 20,  // Sidebar sırası (10: dashboard, 20: musteriler, 30: kurbanlar...)
  
  // Görünüm
  ikon: Users,  // Lucide ikon component
  renk: '#ea580c',  // Tema rengi
  
  // Rotalar
  anaRota: '/musteriler',
  altRotalar: [
    { yol: '/musteriler', ad: 'Tüm Müşteriler', ikon: 'List' },
    { yol: '/musteriler/yeni', ad: 'Yeni Müşteri', ikon: 'UserPlus' },
    { yol: '/musteriler/borclular', ad: 'Borçlular', ikon: 'AlertCircle' },
    { yol: '/musteriler/ekstre', ad: 'Hesap Ekstresi', ikon: 'FileText' },
  ],
  
  // Yetkilendirme
  izinler: {
    goruntule: ['admin', 'kasiyer', 'izleyici'],
    olustur: ['admin', 'kasiyer'],
    guncelle: ['admin', 'kasiyer'],
    sil: ['admin'],
  },
  
  // Bağımlılıklar (diğer modüller)
  bagimliliklar: ['_core'],  // Sadece çekirdeğe bağlı
  
  // Olay sistemi
  olaylar: {
    yayinla: [
      'musteri:olusturuldu',
      'musteri:guncellendi',
      'musteri:silindi',
      'musteri:notlu-eklendi',
    ],
    dinle: [
      'odeme:tamamlandi',  // Tahsilat alındığında müşteri bakiyesi güncellenir
      'hisse:atandi',      // Hisse atandığında müşteri toplam bedeli güncellenir
    ],
  },
  
  // Hayat döngüsü hooks
  onYukle: async () => {
    // Modül yüklenirken çalışır
    console.log('Müşteriler modülü yüklendi');
  },
  
  onKapat: async () => {
    // Modül kapatılırken çalışır
    console.log('Müşteriler modülü kapatıldı');
  },
};

export default musterilerModule;
```

### 4.4 index.ts — Modülün Public API'si

Bir modülün **dışa açtığı** her şey bu dosyadan exportlanır. Başka modüller **sadece bu dosyayı import edebilir**, içerideki dosyaları değil.

```typescript
// modules/musteriler/index.ts

// Tipler
export type { Musteri, MusteriOzet, MusteriFiltre } from './types';

// Helper'lar (dışarıdan kullanılabilir)
export { formatMusteriAd } from './lib/format';
export { hesaplaBakiye } from './lib/hesap';

// Bileşenler (paylaşılabilir)
export { MusteriAvatar } from './components/Avatar';
export { MusteriArama } from './components/MusteriArama';

// API helper'ları (dışarıdan çağrılabilir)
export { musteriBul } from './api/detay';

// Default export — config
export { default } from './module.config';
```

**❌ Yasak:**
```typescript
// modules/tahsilat/api/odeme.ts
import { hesaplaBakiye } from '../../musteriler/lib/hesap'; // YANLIŞ! İçeriden import
```

**✅ Doğru:**
```typescript
// modules/tahsilat/api/odeme.ts
import { hesaplaBakiye } from '@/modules/musteriler'; // index.ts'den import
```

### 4.5 Modül Bağımsızlığı

**Kural:** Her modül **silinmeli** ve sistem **çökmemeli**.

Test:
```bash
# Müşteriler modülü silindi
rm -rf modules/musteriler
# Sistem hata vermeli ama çökmemeli
pnpm dev
```

Bunu sağlamak için:
- Modüller arası direkt import yok (sadece events)
- Cross-module bağımlılıklar `module.config.ts`'de bildirilir
- Eksik modül durumunda graceful degradation

### 4.6 Çekirdek (`_core`) Modülü

Tüm modüllerin bağımlı olduğu **tek** modül. İçerir:
- Auth
- Session yönetimi
- Ayarlar
- Yedekleme
- Audit log
- Olay yöneticisi

Bu modül **silinemez**.

### 4.7 Şablon (`_example`) Modülü

Yeni modül oluşturmak için **kopyalanır**:

```bash
cp -r modules/_example modules/yeni-modul
# Düzenle: modules/yeni-modul/module.config.ts
# Import et: shared/lib/module-loader.ts'e ekle
# Hazır!
```

---

## 5. VERİ KATMANI

### 5.1 Prisma Schema Standardı

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}

datasource db {
  provider = "sqlite"  // SaaS için "postgresql"
  url      = env("DATABASE_URL")
}

// Tüm modeller şu yapıya uyar:
// - id: cuid (string)
// - createdAt: DateTime @default(now())
// - updatedAt: DateTime @updatedAt
// - silindiMi: Boolean @default(false) (soft delete)
// - olusturanId: String? (kullanıcı ID)

model Musteri {
  // Kimlik
  id          String   @id @default(cuid())
  
  // İş alanları
  adSoyad     String
  telefon     String?
  tcKimlik    String?  @unique
  adres       String?
  email       String?
  
  // Metadata
  notlar      String?
  etiketler   String?  // JSON: ["VIP", "Düzenli"]
  
  // İlişkiler
  hisseler    Hisse[]
  odemeler    Odeme[]
  olaylar     OlayLog[] @relation("MusteriOlaylar")
  
  // Audit
  silindiMi   Boolean  @default(false)
  silinmeTarihi DateTime?
  olusturanId String?
  
  // Standart timestamp
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // İndeksler
  @@index([adSoyad])
  @@index([telefon])
  @@index([silindiMi])
}
```

### 5.2 İsimlendirme Standardı

| Tip | Format | Örnek |
|-----|--------|-------|
| **Model adı** | PascalCase, tekil, Türkçe | `Musteri`, `Hisse`, `Odeme` |
| **Field adı** | camelCase, Türkçe | `adSoyad`, `tcKimlik`, `toplamTutar` |
| **İlişki adı** | camelCase, çoğul (collection için) | `hisseler`, `odemeler` |
| **ID adı** | `id` (PK), `<model>Id` (FK) | `musteriId`, `hisseId` |
| **Boolean** | `<isim>Mi` veya `is<Isim>` | `silindiMi`, `aktifMi` |
| **Timestamp** | `<eylem>Tarihi` | `silinmeTarihi`, `odemeTarihi` |

### 5.3 Soft Delete Standardı

Hiçbir kayıt **fiziksel olarak silinmez** (audit için). Bunun yerine:

```typescript
// modules/musteriler/api/sil.ts
export async function musteriSil(id: string, kullaniciId: string) {
  return await prisma.musteri.update({
    where: { id },
    data: {
      silindiMi: true,
      silinmeTarihi: new Date(),
    },
  });
  
  // Audit log
  await auditLog({
    eylem: 'sil',
    model: 'Musteri',
    kayitId: id,
    kullaniciId,
  });
}

// Tüm sorgu'larda silinenleri hariç tut
export async function musteriListele() {
  return await prisma.musteri.findMany({
    where: { silindiMi: false },
  });
}
```

### 5.4 Migration Standardı

```bash
# ✅ DOĞRU
pnpm prisma migrate dev --name musteri-etiket-eklendi

# ❌ YANLIŞ
# schema.prisma'yı düzenleyip "öyle bıraktım" demek
```

Migration adı **açıklayıcı** olmalı:
- `init`
- `musteri-etiket-eklendi`
- `odeme-iptal-alani-eklendi`
- `kurban-vekalet-tablosu`

### 5.5 İndeks Stratejisi

Performans için sık sorgulanan alanlara indeks:

```prisma
model Musteri {
  // ...
  
  @@index([adSoyad])      // Arama için
  @@index([telefon])      // Telefon araması için
  @@index([silindiMi])    // Silinenleri filtrelemek için
  @@index([createdAt])    // Tarih sıralaması için
}
```

---

## 6. API TASARIM STANDARTLARI

### 6.1 RESTful Endpoint Yapısı

```
GET    /api/musteriler              ← Liste (filtre, sayfalama)
GET    /api/musteriler/[id]         ← Detay
POST   /api/musteriler              ← Yeni
PATCH  /api/musteriler/[id]         ← Kısmi güncelleme
PUT    /api/musteriler/[id]         ← Tam güncelleme
DELETE /api/musteriler/[id]         ← Silme (soft)

GET    /api/musteriler/[id]/hisseler ← Müşterinin hisseleri
POST   /api/musteriler/[id]/odeme    ← Müşteriye ödeme al
```

### 6.2 Tüm Endpoint'lerin Standart Yapısı

```typescript
// app/api/musteriler/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/shared/lib/session';
import { musteriBul, musteriGuncelle, musteriSil } from '@/modules/musteriler/api/detay';
import { izinKontrol } from '@/shared/lib/izinler';
import { auditLog } from '@/shared/lib/audit';

// Zod schema
const GuncelleSchema = z.object({
  adSoyad: z.string().min(2).max(100).optional(),
  telefon: z.string().regex(/^[0-9+\s()-]+$/).optional(),
  tcKimlik: z.string().length(11).optional(),
  notlar: z.string().max(1000).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Auth
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { hata: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }
    
    // 2. İzin kontrolü
    if (!izinKontrol(session, 'musteriler.goruntule')) {
      return NextResponse.json(
        { hata: 'Bu işlem için yetkiniz yok' },
        { status: 403 }
      );
    }
    
    // 3. İş mantığı
    const musteri = await musteriBul(params.id);
    if (!musteri) {
      return NextResponse.json(
        { hata: 'Müşteri bulunamadı' },
        { status: 404 }
      );
    }
    
    // 4. Başarılı yanıt
    return NextResponse.json({
      basarili: true,
      veri: musteri,
    });
    
  } catch (hata: any) {
    console.error('GET /api/musteriler/[id]:', hata);
    return NextResponse.json(
      { hata: 'Sunucu hatası', detay: hata.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ hata: 'Yetkisiz' }, { status: 401 });
    }
    
    if (!izinKontrol(session, 'musteriler.guncelle')) {
      return NextResponse.json({ hata: 'Yetki yok' }, { status: 403 });
    }
    
    // Body parse + validate
    const body = await req.json();
    const veri = GuncelleSchema.parse(body);
    
    // Güncelle
    const musteri = await musteriGuncelle(params.id, veri);
    
    // Audit log
    await auditLog({
      eylem: 'guncelle',
      model: 'Musteri',
      kayitId: params.id,
      degisiklikler: veri,
      kullaniciId: session.userId,
    });
    
    return NextResponse.json({
      basarili: true,
      veri: musteri,
    });
    
  } catch (hata: any) {
    if (hata instanceof z.ZodError) {
      return NextResponse.json(
        { hata: 'Geçersiz veri', detaylar: hata.errors },
        { status: 400 }
      );
    }
    
    console.error('PATCH /api/musteriler/[id]:', hata);
    return NextResponse.json(
      { hata: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
```

### 6.3 Yanıt Formatı (HER ENDPOINT)

```typescript
// Başarılı yanıt
{
  "basarili": true,
  "veri": { ... },           // Tek kayıt
  // veya
  "veri": [ ... ],            // Liste
  "ozet": {                   // İsteğe bağlı
    "toplam": 240,
    "sayfa": 1,
    "sayfaBoyutu": 50
  }
}

// Hatalı yanıt
{
  "basarili": false,
  "hata": "Müşteri bulunamadı",
  "kod": "MUSTERI_BULUNAMADI",  // Opsiyonel
  "detaylar": [ ... ]            // Validasyon hataları için
}
```

### 6.4 HTTP Status Kodları

| Kod | Anlam | Kullanım |
|-----|-------|----------|
| 200 | OK | Başarılı GET/PATCH |
| 201 | Created | Başarılı POST |
| 204 | No Content | Başarılı DELETE |
| 400 | Bad Request | Validation hatası |
| 401 | Unauthorized | Giriş yapmadı |
| 403 | Forbidden | Yetkisi yok |
| 404 | Not Found | Kayıt yok |
| 409 | Conflict | Çakışma (örn. duplicate) |
| 500 | Server Error | Beklenmeyen hata |

### 6.5 Sayfalama Standardı

```typescript
GET /api/musteriler?sayfa=1&sayfaBoyutu=50&arama=ahmet&siralamaBy=adSoyad&siralamaDir=asc

Yanıt:
{
  "basarili": true,
  "veri": [...],
  "ozet": {
    "toplam": 240,
    "sayfa": 1,
    "sayfaBoyutu": 50,
    "toplamSayfa": 5
  }
}
```

### 6.6 Filtreleme ve Arama

```typescript
// Query params
?arama=ahmet              // Genel arama
&durum=borclu             // Durum filtresi
&etiket=vip               // Etiket filtresi
&tarihBaslangic=2026-05-01
&tarihBitis=2026-06-07
&siralamaBy=adSoyad
&siralamaDir=asc
&sayfa=1
&sayfaBoyutu=50
```

---

## 7. UI KATMANI

### 7.1 Bileşen Hiyerarşisi

```
1. components/ui/         ← shadcn (asla değiştirme)
2. shared/components/     ← Ortak bileşenler (3+ modülde kullanılan)
3. modules/<modul>/components/  ← Sadece o modülde kullanılan
```

### 7.2 Component İsimlendirme

| Tip | Format | Örnek |
|-----|--------|-------|
| Component | PascalCase, Türkçe | `MusteriAvatar.tsx` |
| Hook | camelCase, `use` ile başla | `useMusteri.ts` |
| Util | camelCase | `formatPara.ts` |
| Type | PascalCase | `type Musteri` |
| Constant | UPPER_SNAKE | `MAX_HISSE_SAYISI` |

### 7.3 Component Yapısı (Standart)

```tsx
// modules/musteriler/components/MusteriAvatar.tsx

import { cn } from '@/shared/lib/cn';

type Props = {
  adSoyad: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export function MusteriAvatar({ adSoyad, size = 'md', className }: Props) {
  const ilkHarfler = adSoyad
    .split(' ')
    .slice(0, 2)
    .map(p => p[0])
    .join('')
    .toUpperCase();
  
  const renkIndex = adSoyad.length % 6;
  
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-medium',
        size === 'sm' && 'w-8 h-8 text-xs',
        size === 'md' && 'w-10 h-10 text-sm',
        size === 'lg' && 'w-14 h-14 text-base',
        renkler[renkIndex],
        className
      )}
    >
      {ilkHarfler}
    </div>
  );
}

const renkler = [
  'bg-red-100 text-red-900',
  'bg-blue-100 text-blue-900',
  'bg-green-100 text-green-900',
  'bg-amber-100 text-amber-900',
  'bg-purple-100 text-purple-900',
  'bg-cyan-100 text-cyan-900',
];
```

### 7.4 Sayfa Yapısı (Standart)

```tsx
// app/musteriler/page.tsx (sadece routing)
import { MusterilerListePage } from '@/modules/musteriler/pages/Liste';

export default function Page() {
  return <MusterilerListePage />;
}

// modules/musteriler/pages/Liste.tsx (asıl içerik)
'use client';

import { SayfaBaslik } from '@/shared/components/SayfaBaslik';
import { useMusteriler } from '../hooks/useMusteriler';

export function MusterilerListePage() {
  const { veriler, yukleniyor } = useMusteriler();
  
  return (
    <div className="space-y-6">
      <SayfaBaslik
        baslik="Müşteriler"
        aciklama={`${veriler.length} müşteri kayıtlı`}
      />
      
      {/* ... */}
    </div>
  );
}
```

### 7.5 Renk Paleti (Tilbe)

```css
/* Tailwind config */
{
  primary: {
    50:  '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#ea580c',  /* ANA RENK */
    600: '#c2410c',
    700: '#9a3412',
    800: '#7c2d12',
    900: '#451a03',
  },
}
```

**Anlamsal renkler:**
- Başarı: `green-600` (#16a34a)
- Uyarı: `amber-500` (#f59e0b)
- Hata: `red-600` (#dc2626)
- Bilgi: `blue-600` (#2563eb)
- Nötr: `stone-500` (#78716c)

### 7.6 Tipografi

```css
/* Boyutlar */
text-xs   → 12px  /* Etiket */
text-sm   → 14px  /* Body */
text-base → 16px  /* Vurgu */
text-lg   → 18px  /* Alt başlık */
text-xl   → 20px  /* H3 */
text-2xl  → 24px  /* H2 */
text-3xl  → 30px  /* H1 */

/* Font Family */
font-sans → 'Inter', system-ui  /* Genel */
font-mono → 'JetBrains Mono', monospace  /* Para, kod */
```

### 7.7 Spacing Standartları

```
Card padding:      p-4 (16px) veya p-6 (24px)
Section gap:       space-y-6 (24px)
Form field gap:    space-y-4 (16px)
Button padding:    px-4 py-2 (small) veya px-6 py-3 (large)
Page padding:      p-6 (24px)
```

### 7.8 Responsive Breakpoint'leri

```
sm:  640px  (telefon yatay)
md:  768px  (tablet)
lg:  1024px (laptop)
xl:  1280px (desktop)
2xl: 1536px (geniş)
```

**Mobile-first kural:** Önce mobil, sonra büyüt.

```tsx
<div className="
  grid grid-cols-1     // Mobile: tek sütun
  md:grid-cols-2       // Tablet: 2 sütun
  lg:grid-cols-3       // Desktop: 3 sütun
">
```

---

## 8. TİP SİSTEMİ

### 8.1 TypeScript Strict Mode

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### 8.2 Tip Tanımları

```typescript
// modules/musteriler/types.ts

// Prisma'dan gelen
import type { Musteri as PrismaMusteri } from '@prisma/client';

// Genişlet (UI için)
export type Musteri = PrismaMusteri & {
  toplamBedel: number;
  odenmis: number;
  kalan: number;
  durum: MusteriDurumu;
};

// Enum
export type MusteriDurumu = 'odendi' | 'kismi' | 'borclu';

// Filtre
export type MusteriFiltre = {
  arama?: string;
  durum?: MusteriDurumu;
  etiket?: string;
  harf?: string;
  sayfa?: number;
  sayfaBoyutu?: number;
};

// API yanıtı
export type MusteriListesi = {
  veriler: Musteri[];
  toplam: number;
  sayfa: number;
};
```

### 8.3 Global Tipler

```typescript
// shared/types/api.ts

export type ApiYanit<T = unknown> = 
  | { basarili: true; veri: T; ozet?: ApiOzet }
  | { basarili: false; hata: string; kod?: string; detaylar?: any };

export type ApiOzet = {
  toplam: number;
  sayfa: number;
  sayfaBoyutu: number;
  toplamSayfa: number;
};

// shared/types/audit.ts
export type AuditEylem = 'olustur' | 'guncelle' | 'sil' | 'goruntule' | 'giris' | 'cikis';

export type AuditLog = {
  id: string;
  eylem: AuditEylem;
  model: string;
  kayitId: string;
  kullaniciId: string;
  ip?: string;
  detaylar?: Record<string, any>;
  createdAt: Date;
};
```

### 8.4 `any` ve `unknown` Kullanımı

- ❌ `any` → SADECE acil durumda, yorumla
- ✅ `unknown` → Bilinmeyen tip, sonra daralt
- ✅ Specific type → Her zaman tercih et

```typescript
// ❌ YANLIŞ
function handle(data: any) { ... }

// ✅ DOĞRU
function handle(data: unknown) {
  if (typeof data === 'object' && data !== null) {
    // ...
  }
}

// ✅ EN İYİSİ
function handle(data: Musteri) { ... }
```

---

## 9. OLAY SİSTEMİ

### 9.1 Olay Tabanlı İletişim

Modüller arası bağımlılığı azaltmak için **olaylar (events)** kullanılır.

```typescript
// shared/lib/events.ts

type EventHandler<T = any> = (veri: T) => void | Promise<void>;

class OlayYoneticisi {
  private dinleyiciler = new Map<string, EventHandler[]>();
  
  yayinla<T>(olay: string, veri: T) {
    const handlers = this.dinleyiciler.get(olay) || [];
    handlers.forEach(h => h(veri));
  }
  
  dinle<T>(olay: string, handler: EventHandler<T>) {
    if (!this.dinleyiciler.has(olay)) {
      this.dinleyiciler.set(olay, []);
    }
    this.dinleyiciler.get(olay)!.push(handler);
    
    // Cleanup için unsubscribe fonksiyonu döndür
    return () => {
      const handlers = this.dinleyiciler.get(olay) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) handlers.splice(index, 1);
    };
  }
}

export const olaylar = new OlayYoneticisi();
```

### 9.2 Standart Olaylar

```typescript
// Müşteri modülü yayınlar:
'musteri:olusturuldu'
'musteri:guncellendi'
'musteri:silindi'
'musteri:etiketlendi'
'musteri:not-eklendi'

// Tahsilat modülü yayınlar:
'odeme:olusturuldu'
'odeme:tamamlandi'
'odeme:iptal-edildi'

// Hisse modülü yayınlar:
'hisse:atandi'
'hisse:iptal-edildi'
'hisse:transfer-edildi'

// Sistem olayları:
'sistem:giris-yapildi'
'sistem:cikis-yapildi'
'sistem:yedek-alindi'
'sistem:hata-olustu'
```

### 9.3 Kullanım

```typescript
// modules/tahsilat/api/odeme.ts
import { olaylar } from '@/shared/lib/events';

export async function odemeAl(veri: OdemeVeri) {
  const odeme = await prisma.odeme.create({ data: veri });
  
  // Olay yayınla
  olaylar.yayinla('odeme:tamamlandi', {
    odemeId: odeme.id,
    musteriId: odeme.musteriId,
    tutar: odeme.toplamTutar,
  });
  
  return odeme;
}

// modules/musteriler/api/dinle.ts
import { olaylar } from '@/shared/lib/events';

olaylar.dinle('odeme:tamamlandi', async (veri) => {
  // Müşteri bakiyesini güncelle
  await musteriBakiyeGuncelle(veri.musteriId);
});

// modules/tv-takip/api/dinle.ts
olaylar.dinle('odeme:tamamlandi', async (veri) => {
  // TV ekranına push et
  ssePush({ type: 'odeme', ...veri });
});
```

---

## 10. AUTH VE YETKİLENDİRME

### 10.1 Roller

```typescript
type Rol = 'admin' | 'kasiyer' | 'izleyici' | 'misafir';
```

| Rol | Yetkileri |
|-----|-----------|
| **admin** | Tüm işlemler, kullanıcı yönetimi, ayarlar |
| **kasiyer** | Tahsilat, müşteri ekleme, dekont basma |
| **izleyici** | Sadece görüntüleme, rapor okuma |
| **misafir** | Sadece giriş sayfası |

### 10.2 İzin Sistemi

```typescript
// shared/lib/izinler.ts

const izinler: Record<Rol, string[]> = {
  admin: ['*'],  // Hepsi
  kasiyer: [
    'musteriler.goruntule',
    'musteriler.olustur',
    'musteriler.guncelle',
    'tahsilat.olustur',
    'kasa.goruntule',
    'dekont.bas',
    // 'musteriler.sil',  ← Yetkisi yok
  ],
  izleyici: [
    'musteriler.goruntule',
    'kasa.goruntule',
    'raporlar.goruntule',
  ],
  misafir: [],
};

export function izinKontrol(session: Session, izin: string): boolean {
  const kullaniciIzinler = izinler[session.rol];
  
  // Admin her şeyi yapabilir
  if (kullaniciIzinler.includes('*')) return true;
  
  // Spesifik izin var mı?
  return kullaniciIzinler.includes(izin);
}
```

### 10.3 Session Yapısı

```typescript
type Session = {
  userId: string;
  kullaniciAdi: string;
  adSoyad: string;
  rol: Rol;
  girisZamani: Date;
};
```

### 10.4 Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/shared/lib/session';

export async function middleware(req: NextRequest) {
  const session = await getSession();
  
  // Giriş sayfası ve API hariç
  if (req.nextUrl.pathname.startsWith('/giris')) {
    return NextResponse.next();
  }
  
  if (!session) {
    return NextResponse.redirect(new URL('/giris', req.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## 11. HATA YÖNETİMİ

### 11.1 Hata Sınıfları

```typescript
// shared/lib/hatalar.ts

export class UygulamaHatasi extends Error {
  constructor(
    mesaj: string,
    public kod: string,
    public statusCode: number = 500
  ) {
    super(mesaj);
    this.name = 'UygulamaHatasi';
  }
}

export class BulunamadıHatası extends UygulamaHatasi {
  constructor(mesaj = 'Kayıt bulunamadı') {
    super(mesaj, 'BULUNAMADI', 404);
  }
}

export class YetkiHatası extends UygulamaHatasi {
  constructor(mesaj = 'Bu işlem için yetkiniz yok') {
    super(mesaj, 'YETKI_YOK', 403);
  }
}

export class ValidasyonHatası extends UygulamaHatasi {
  constructor(public detaylar: any[]) {
    super('Geçersiz veri', 'VALIDASYON', 400);
  }
}

export class CakisismaHatası extends UygulamaHatasi {
  constructor(mesaj = 'Çakışan kayıt') {
    super(mesaj, 'CAKISMA', 409);
  }
}
```

### 11.2 API Hata Handler

```typescript
// shared/lib/api-helpers.ts
import { NextResponse } from 'next/server';
import { UygulamaHatasi } from './hatalar';
import { z } from 'zod';

export function hataYakala(hata: unknown) {
  if (hata instanceof z.ZodError) {
    return NextResponse.json(
      { basarili: false, hata: 'Geçersiz veri', detaylar: hata.errors },
      { status: 400 }
    );
  }
  
  if (hata instanceof UygulamaHatasi) {
    return NextResponse.json(
      { basarili: false, hata: hata.message, kod: hata.kod },
      { status: hata.statusCode }
    );
  }
  
  // Bilinmeyen hata
  console.error('Beklenmeyen hata:', hata);
  return NextResponse.json(
    { basarili: false, hata: 'Sunucu hatası' },
    { status: 500 }
  );
}
```

### 11.3 Frontend Hata Gösterimi

```tsx
import { toast } from 'sonner';

async function odemeAl(veri: OdemeVeri) {
  try {
    const yanit = await fetch('/api/tahsilat/odeme', {
      method: 'POST',
      body: JSON.stringify(veri),
    });
    
    const sonuc = await yanit.json();
    
    if (!sonuc.basarili) {
      toast.error(sonuc.hata);
      return;
    }
    
    toast.success(`Ödeme alındı: ${sonuc.veri.dekontNo}`);
  } catch (hata) {
    toast.error('Beklenmeyen hata oluştu');
    console.error(hata);
  }
}
```

---

## 12. LOGLAMA VE AUDIT

### 12.1 Audit Log (Şart)

**Tüm kritik işlemler** audit log'a yazılır:

```typescript
// shared/lib/audit.ts
import { prisma } from './prisma';

type AuditVeri = {
  eylem: 'olustur' | 'guncelle' | 'sil' | 'giris' | 'cikis';
  model: string;
  kayitId: string;
  kullaniciId: string;
  detaylar?: Record<string, any>;
  ip?: string;
};

export async function auditLog(veri: AuditVeri) {
  await prisma.auditLog.create({
    data: {
      ...veri,
      detaylar: veri.detaylar ? JSON.stringify(veri.detaylar) : null,
    },
  });
}
```

### 12.2 Auditlenmesi Gereken İşlemler

- ✅ Tüm CRUD işlemleri (Müşteri, Hisse, Ödeme)
- ✅ Giriş / Çıkış
- ✅ Kasa hareketleri
- ✅ Yedekleme
- ✅ Sistem ayarı değişiklikleri
- ✅ Kullanıcı yetki değişiklikleri

### 12.3 Konsol Logları

```typescript
// shared/lib/log.ts
export const log = {
  bilgi: (mesaj: string, veri?: any) => {
    console.log(`[BİLGİ] ${mesaj}`, veri);
  },
  uyari: (mesaj: string, veri?: any) => {
    console.warn(`[UYARI] ${mesaj}`, veri);
  },
  hata: (mesaj: string, hata?: any) => {
    console.error(`[HATA] ${mesaj}`, hata);
  },
  basarili: (mesaj: string, veri?: any) => {
    console.log(`[✓] ${mesaj}`, veri);
  },
};
```

---

## 13. TEST STRATEJİSİ

> ⚠️ Bayram sonrası eklenecek. Şu an placeholder.

### 13.1 Test Piramidi

```
        E2E (Playwright)        ← Az
       ┌──────────────┐
      Integration                ← Orta
     ┌──────────────────┐
    Unit (Vitest)                 ← Çok
   ┌──────────────────────┐
```

### 13.2 Test Klasörü

```
proje/
├── __tests__/                   # Genel testler
│   ├── unit/
│   └── integration/
├── e2e/                          # Playwright E2E
└── modules/<modul>/__tests__/    # Modüle özel
```

---

## 14. PERFORMANS

### 14.1 Frontend

- ✅ React Server Components kullan
- ✅ Image optimization (`next/image`)
- ✅ Code splitting (otomatik)
- ✅ Dynamic imports büyük bileşenlerde
- ✅ Memo / useMemo gerektiğinde

### 14.2 Backend

- ✅ Database indeks
- ✅ Sayfalama her listede
- ✅ N+1 query'den kaçın (Prisma `include`)
- ✅ Cache (React Query) sık değişmeyenlerde

### 14.3 Hedefler

- İlk sayfa yüklenmesi: < 2s
- API yanıt: < 200ms (basit), < 1s (kompleks)
- TV ekranı update: < 100ms

---

## 15. GÜVENLİK

### 15.1 Auth

- ✅ bcrypt (10 rounds) şifreler
- ✅ iron-session cookie (httpOnly, secure)
- ✅ CSRF koruması (SameSite)

### 15.2 Input Validation

- ✅ Tüm API'lerde Zod
- ✅ XSS önleme (React otomatik)
- ✅ SQL injection (Prisma parametre)

### 15.3 Hassas Veri

- ✅ TC kimlik maskeli göster (`***`)
- ✅ Şifreler log'a yazılmaz
- ✅ `.env` git'e gitmez
- ✅ DB dosyası git'e gitmez

### 15.4 Rate Limiting (Sonra)

API rate limit (örn. dakikada 60 istek)

---

## 16. YEDEKLEME

### 16.1 Otomatik Yedek

- ✅ Her ödemede DB kopyalanır
- ✅ Her saat başı tam DB yedek
- ✅ Son 100 yedek tutulur, eskiler silinir

### 16.2 Manuel Yedek

- ✅ Ayarlar > Yedekleme > Şimdi Yedek Al
- ✅ USB'ye export
- ✅ İndir (zip)

### 16.3 Restore

- ⚠️ DİKKAT: Mevcut DB üzerine yazar
- ✅ Restore öncesi mevcut DB yedeklenir
- ✅ Çift onay gerekir

---

## 17. GIT WORKFLOW

### 17.1 Branch Stratejisi

```
main              ← Production (her zaman çalışır)
├── develop       ← Geliştirme
│   ├── feature/musteri-cari
│   ├── feature/whatsapp
│   └── fix/dekont-pdf
└── release/v1.0
```

### 17.2 Commit Mesaj Formatı

```
<tip>(<kapsam>): <açıklama>

<gövde>

<dipnot>
```

**Tipler:**
- `feat`: Yeni özellik
- `fix`: Bug düzeltme
- `refactor`: Kod düzenleme
- `style`: CSS/format
- `docs`: Belge
- `test`: Test
- `chore`: Bakım
- `perf`: Performans

**Örnekler:**
```
feat(musteriler): cari hesap sayfası eklendi

- 6 tab (Genel, Hisseler, Ödemeler, Ekstre, Notlar, Hareketler)
- Sticky hızlı ödeme paneli
- WhatsApp butonu

Closes #15
```

```
fix(tahsilat): dekont PDF Türkçe karakter sorunu

ç, ş, ğ, ı harfleri kutu olarak çıkıyordu.
Font: Inter → DejaVu Sans değiştirildi.
```

### 17.3 Pull Request

- Açıklayıcı başlık
- Açıklama (ne, neden, nasıl)
- Screenshots (UI değişikliği varsa)
- Test sonuçları
- Reviewer ekle

### 17.4 Küçük Commit'ler

❌ **YANLIŞ:**
```
git commit -m "tüm değişiklikler"
```

✅ **DOĞRU:**
```
git commit -m "feat(musteriler): avatar bileşeni eklendi"
git commit -m "feat(musteriler): rozet sistemi eklendi"
git commit -m "feat(musteriler): üst stat bar eklendi"
git commit -m "test(musteriler): liste sayfası test edildi"
```

---

## 18. GELİŞTİRME KURALLARI

### 18.1 Adım Adım Çalışma

Her geliştirme şu sırayla:

1. **Anla** — Ne istiyor? Neden istiyor?
2. **Tara** — Mevcut kod nerede, nasıl?
3. **Planla** — Hangi adımlar?
4. **Onay** — Kullanıcıya plan sun
5. **Uygula** — Küçük adımlarla
6. **Test** — Her adım sonrası test
7. **Commit** — Her başarılı adım
8. **Rapor** — Sonuç ne, nasıl test edilir?

### 18.2 Önce Plan, Sonra Kod

❌ **YANLIŞ:** Direkt kodlamaya başla
✅ **DOĞRU:** Önce plan, onay, sonra kod

### 18.3 Mevcut Çalışan Kodu Bozma

- Test etmeden değiştirme
- Önce yedek al (git commit)
- Küçük adım at, her seferinde test

### 18.4 Türkçe Önceliği

- Değişken adları: Türkçe (`musteri`, `tahsilat`)
- Class adları: Türkçe (`MusteriAvatar`)
- Yorum: Türkçe
- Commit mesaj: Türkçe
- UI metni: Türkçe (zaten)
- **İstisna:** Standart programlama terimleri (props, state, hook)

### 18.5 Her Modülün İçi Bağımsız

Bir modül **kendi içinde her şeye sahip** olmalı:
- Kendi sayfası (pages/)
- Kendi API'leri (api/)
- Kendi bileşenleri (components/)
- Kendi hook'ları (hooks/)
- Kendi tipleri (types.ts)
- Kendi helper'ları (lib/)

### 18.6 DRY (Don't Repeat Yourself)

3+ yerde aynı kod var ise → `shared/` altına taşı.

---

## 19. TILBECORE GENİŞLEME YOL HARİTASI

### 19.1 Faz 1: Adabereket Kurban (Şimdi)

✅ Modüler altyapı  
✅ Tahsilat, müşteri, kurban, kasa, raporlar  
⏳ TV Kesim Takip  
⏳ Müşteri Cari Hesap  
⏳ WhatsApp click-to-chat  
⏳ Borçlular + Excel  
⏳ Bayram öncesi cilalama  

### 19.2 Faz 2: TilbeCore SaaS (Bayram Sonrası)

- 🔄 PostgreSQL geçiş
- 🔄 Multi-tenant (her çiftlik kendi DB)
- 🔄 Cloud hosting (Vercel / Railway)
- 🔄 Subdomain (adabereket.tilbe.com)
- 🔄 Stripe / Iyzico ödeme
- 🔄 Onboarding flow

### 19.3 Faz 3: Dikey Genişleme (2-3 ay)

- 🔄 Küçükbaş hayvan modülü
- 🔄 Bağış yönetimi
- 🔄 Et dağıtım modülü
- 🔄 E-fatura entegrasyonu (GİB)
- 🔄 Termal yazıcı
- 🔄 POS entegrasyonu
- 🔄 SMS (Netgsm)
- 🔄 WhatsApp Business API

### 19.4 Faz 4: Mobil Uygulama (3-6 ay)

- 🔄 React Native veya Capacitor
- 🔄 Push notification
- 🔄 Offline-first
- 🔄 NFC kart (vekalet)

### 19.5 Faz 5: Yatay Genişleme (6+ ay)

- 🔄 Et satış / e-ticaret modülü
- 🔄 Mağaza POS sistemi
- 🔄 Tedarikçi yönetimi
- 🔄 BI / Analytics dashboard
- 🔄 AI öneriler (tahsilat tahmini, fiyatlandırma)

---

## 📋 SONUÇ

Bu belge **TilbeCore'un anayasası**. Her geliştirme bu kurallara uyar.

**Değişiklikler:** Bu belgeyi değiştirmek için PR aç, açıkla, gözden geçirilsin.

**Sürüm geçmişi:**
- v1.0.0 (24 Mayıs 2026) — İlk sürüm

---

**Hayırlı bayramlar, hayırlı yazılım 🐂🚀**

— *Tilbehome, TilbeCore Kurucusu*
