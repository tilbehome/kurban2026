# CLAUDE.md — Adabereket Hayvancılık Geliştirme Kuralları

> Bu dosyayı projenin **köküne** (`kurban2026/CLAUDE.md`) koy.
> Her Claude Code oturumunda **ilk mesajda** şunu de:
> 
> **"Önce CLAUDE.md'yi oku ve ona uygun çalış. Geliştirme yapmadan önce mevcut yapıyı incele, plan sun, onayımı bekle."**

---

## 🎯 PROJE BİLGİSİ

**İsim:** Adabereket Hayvancılık - Kurban Takip Yazılımı  
**Sahibi:** Burhan KOCABAY (Adabereket Hayvancılık)  
**Geliştiren:** Tilbehome (Sakarya / Serdivan)  
**Repo:** `github.com/tilbehome/kurban2026`  
**Vizyon:** TilbeCore ürün ailesi parçası. İleride SaaS olarak diğer çiftliklere de satılacak.  
**Deadline:** 26 Mayıs 2026 (3 gün) — Hazır olması gereken tarih.  
**Kurban Bayramı:** 5-7 Haziran 2026 — Asıl kullanım tarihi.  

**Mevcut Faz Durumu:**
| Faz | İçerik | Durum |
|-----|--------|-------|
| 0 | Modüler altyapı, dynamic loader, sidebar | ✅ |
| 1A | Core: auth, ayarlar, yedekleme | ✅ |
| 1B | Müşteriler + Hayvanlar CRUD | ✅ |
| 1C | ⭐ Tahsilat + ödeme + dekont | ✅ |
| 1D | Kasa + Raporlar + Excel | ✅ |
| 1E | Dashboard + cilalama | ✅ |
| 2 | Kesim TV ekranı (SSE) | ⏳ Yapılacak |
| 3 | Müşteri geliştirme (avatar, tab, detay) | ⏳ Yapılacak |
| 4 | WhatsApp entegrasyonu (click-to-chat) | ⏳ Yapılacak |
| 5 | Borçlular + Excel + Toplu işlem | ⏳ Yapılacak |
| 6 | Akordiyon menü + alt sayfalar | ⏳ Yapılacak |

---

## 🏗️ MİMARİ YAPISI (KORUNACAK)

```
kurban2026/
├── app/                      ← Next.js App Router (sayfalar + API)
│   ├── giris/
│   ├── tahsilat/            ← KUTSAL: ödeme akışı
│   ├── musteriler/
│   ├── hayvanlar/
│   ├── kasa/
│   ├── raporlar/
│   ├── ayarlar/
│   └── api/
│
├── modules/                  ← Modüler iş mantığı (GELİŞTİRME BURAYA)
│   ├── _core/               ← DOKUNMA: auth, ayarlar, yedek
│   ├── _example/            ← Yeni modül şablonu
│   ├── musteriler/
│   ├── hayvanlar/
│   ├── tahsilat/            ← KRİTİK MODÜL
│   ├── kasa/
│   └── raporlar/
│
├── shared/
│   ├── components/          ← AppShell, Sidebar, SayfaBaslik
│   ├── lib/                ← prisma, session, para, tarih, backup, events, module-loader
│   └── types/
│
├── components/ui/           ← shadcn/ui (DEĞİŞTİRME)
├── prisma/                  ← Schema (migration olmadan dokunma)
└── backups/                ← Otomatik yedekler
```

**Stack:**
- Next.js 16 + React 19 + TypeScript strict
- Tailwind CSS v4 + shadcn/ui (base-nova preset)
- Prisma 6 + SQLite
- iron-session + bcrypt (auth)
- zod, sonner, lucide-react, date-fns, xlsx

---

## 🔒 DOKUNULMAZ BÖLGELER

### Kesinlikle değiştirme

1. **`modules/_core/`** — Auth, ayarlar, yedekleme.
2. **`shared/lib/prisma.ts`** — Singleton instance.
3. **`shared/lib/session.ts`** — Session yönetimi.
4. **`shared/lib/backup.ts`** — Yedekleme kodu.
5. **`shared/lib/module-loader.ts`** — Modül yükleme sistemi.
6. **`prisma/schema.prisma`** — Sadece `pnpm prisma migrate dev` ile değiştir.
7. **`prisma/migrations/`** — Eski migration'ları silme.
8. **`middleware.ts`** — Auth middleware.

### Test etmeden değiştirme

9. **`app/api/tahsilat/`** — Ödeme API'leri. Test etmeden değişirse müşteri parası kaybolabilir.
10. **`modules/tahsilat/`** — Tahsilat modülü kodu.
11. **`shared/components/AppShell.tsx`** — Tüm sayfaları sarar.

---

## ✅ MODÜLER GELİŞTİRME KURALLARI

### Kural 1: Yeni Özellik = Yeni Modül VEYA Mevcut Modüle Ek

**Tamamen yeni bir alan (örn. TV ekranı):**
```bash
cp -r modules/_example modules/kesim-takip
# Düzenle: modules/kesim-takip/module.config.ts
# Sidebar otomatik güncellenir
```

**Mevcut modüle ek özellik (örn. müşteri etiketleri):**
```
modules/musteriler/ altında yeni dosya ekle
mevcut dosyaları DEĞİŞTİRME
yeni komponent / API / helper ekle
```

### Kural 2: Modül Klasör Yapısı

Her modül **şu yapıda** olmalı (`_example` referans):

```
modules/<modul-adi>/
├── module.config.ts       ← Modül tanımı (id, ad, ikon, rotalar, izinler)
├── pages/                 ← Sayfa bileşenleri (opsiyonel)
├── components/            ← Modüle özel React bileşenleri
├── api/                   ← Business logic (route.ts'lerden import edilir)
├── lib/                   ← Helper fonksiyonlar
└── types.ts               ← TypeScript tip tanımları
```

### Kural 3: API Endpoint Eklerken

```typescript
// 1. Business logic: modules/<modul>/api/<isim>.ts
export async function yapBirSey(params: ParamsTipi) {
  // Veritabanı işlemleri, validasyon, vs.
}

// 2. Next.js handler: app/api/<modul>/<isim>/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { yapBirSey } from '@/modules/<modul>/api/<isim>';
import { getSession } from '@/shared/lib/session';

const Schema = z.object({
  // input validation
});

export async function POST(req: NextRequest) {
  // 3. Auth kontrolü
  const session = await getSession();
  if (!session) return NextResponse.json({ hata: 'Yetkisiz' }, { status: 401 });
  
  // 4. Body parse + Zod validation
  const body = Schema.parse(await req.json());
  
  // 5. Try-catch ile business logic
  try {
    const sonuc = await yapBirSey(body);
    return NextResponse.json({ basarili: true, ...sonuc });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ hata: 'Sunucu hatası' }, { status: 500 });
  }
}
```

### Kural 4: Veritabanı Değişikliği

```bash
# ❌ YAPMA: schema.prisma'yı manuel düzenle, sonra "öyle bıraktım"
# ✅ YAP:

# 1. schema.prisma'ya model ekle
# 2. Migration oluştur (otomatik isim)
pnpm prisma migrate dev --name <aciklayici-isim>

# 3. Prisma client'ı yenile
pnpm prisma generate

# 4. Test et (mevcut sorgular çalışıyor mu?)
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.musteri.count().then(c => console.log(c));"
```

### Kural 5: UI Bileşenleri

```tsx
// ✅ YAP: shadcn/ui'dan kullan
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// ✅ YAP: shared'dan ortak bileşen kullan
import { SayfaBaslik } from '@/shared/components/SayfaBaslik';

// ✅ YAP: Modül kendi bileşenlerini modules/<modul>/components/ altına koysun

// ❌ YAPMA: Inline HTML button yaz (<button>...</button>)
// ❌ YAPMA: components/ui altına custom dosya ekle
// ❌ YAPMA: Modül bileşenini başka modülde kullan (shared/components'a taşı)
```

### Kural 6: Para ve Tarih Formatı

```typescript
// ✅ YAP: shared helper'ları kullan
import { formatPara } from '@/shared/lib/para';
import { formatTarih } from '@/shared/lib/tarih';

formatPara(45000);             // "₺45.000,00"
formatTarih(new Date());       // "23.05.2026 21:42"

// ❌ YAPMA: Inline Math.round, Intl.NumberFormat
// ❌ YAPMA: new Date().toLocaleString() (locale yanlış olur)
```

### Kural 7: Olay Sistemi (Modüller Arası İletişim)

```typescript
// modules/tahsilat içinde:
import { yayinla } from '@/shared/lib/events';

// Ödeme alındığında olay yayınla
yayinla('odeme:tamamlandi', { 
  odemeId, 
  musteriId, 
  tutar 
});

// modules/musteriler içinde:
import { dinle } from '@/shared/lib/events';

dinle('odeme:tamamlandi', (veri) => {
  // Müşteri durumunu güncelle, UI yenile
});

// modules/kesim-takip içinde:
dinle('odeme:tamamlandi', (veri) => {
  // TV ekranında müşterinin durumunu güncelle
});
```

### Kural 8: Module Config

Her modülün `module.config.ts`'i şu yapıda:

```typescript
import type { ModuleConfig } from '@/shared/types/module';
import { Heart } from 'lucide-react';

export const bagisModule: ModuleConfig = {
  id: 'bagis',
  ad: 'Bağış Yönetimi',
  aciklama: 'Bağış kabul ve takip',
  versiyon: '1.0.0',
  aktif: true,
  sira: 25,
  ikon: 'Heart',  // veya React komponent
  anaRota: '/bagis',
  izinler: ['admin', 'kasiyer'],
  bagimliliklar: ['musteriler'],
  
  sayfalar: [
    { yol: '/bagis', component: 'pages/liste', ad: 'Bağışlar' },
    { yol: '/bagis/yeni', component: 'pages/yeni', ad: 'Yeni Bağış' },
  ],
  
  api: [
    { yol: '/api/bagis/liste', methods: ['GET'] },
    { yol: '/api/bagis/yeni', methods: ['POST'] },
  ],
  
  olaylar: {
    yayinla: ['bagis:tamamlandi'],
    dinle: ['musteri:silindi'],
  },
};

export default bagisModule;
```

Sonra `shared/lib/module-loader.ts`'ye import ekle.

---

## 🧪 TEST KOMUTLARI (HER GELİŞTİRME SONRASI)

### Hızlı Sağlık Testi (30 saniye)

```bash
# 1. TypeScript kontrolü
pnpm tsc --noEmit

# 2. Build (Önemli: production hatası önler)
pnpm build

# 3. Veritabanı erişimi
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.musteri.count().then(c => console.log('Müşteri sayısı:', c));"

# 4. Sunucu açılıyor mu?
pnpm dev  # 3000 portu açık olmalı
```

### Tahsilat Akış Testi (KRİTİK!)

```bash
# 1. Giriş yap, cookie al
curl -s -c /tmp/c.txt -X POST http://localhost:3000/api/giris \
  -H "Content-Type: application/json" \
  -d '{"kullaniciAdi":"admin","sifre":"tilbe2026"}'

# 2. Test müşteri al (ilk müşteri + ilk hisse)
node -e "
const { PrismaClient } = require('@prisma/client'); 
const p = new PrismaClient(); 
p.musteri.findFirst({ include: { hisseler: true } }).then(m => 
  console.log('Müşteri ID:', m.id, '| Hisse ID:', m.hisseler[0]?.id, '| Fiyat:', m.hisseler[0]?.hisseFiyati)
);
"

# 3. Test ödeme (yukarıdan ID'leri al, MUSTERI_ID ve HISSE_ID değiştir)
curl -s -b /tmp/c.txt -X POST http://localhost:3000/api/tahsilat/odeme \
  -H "Content-Type: application/json" \
  -d '{"musteriId":MUSTERI_ID,"hisseIds":[HISSE_ID],"nakit":100,"havale":0,"kart":0,"notlar":"TEST_SAGLIK","dagitim":"esit"}'

# Beklenen: {"basarili":true,"odemeIds":[...],"dekontNo":"TKR-2026-XXXXX",...}

# 4. TEMİZLİK: Test ödemeyi sil
node -e "
const { PrismaClient } = require('@prisma/client'); 
const p = new PrismaClient(); 
p.odeme.deleteMany({ where: { notlar: 'TEST_SAGLIK' } }).then(r => 
  console.log('Silinen test ödeme:', r.count)
);
"
```

### Sayfa Açma Testi

```bash
# Tüm ana sayfalar 200 dönüyor mu?
for path in / musteriler hayvanlar tahsilat kasa raporlar ayarlar; do
  status=$(curl -s -b /tmp/c.txt -o /dev/null -w "%{http_code}" http://localhost:3000/$path)
  echo "$path → $status"
done
```

---

## 🚨 ACİL DURUM PROTOKOLÜ

### Eğer Bir Şey Bozulduysa

```bash
# 1. ÖNCE GİT'TE NEREDEYİZ?
git status
git log --oneline -10

# 2. SON ÇALIŞAN COMMITE GERİ DÖN
git stash               # mevcut değişiklikleri sakla
git reset --hard HEAD~1 # son commit'i geri al

# Veya belirli commit:
git reset --hard <commit-hash>

# 3. CACHE TEMİZLE (Next.js Turbopack)
rm -rf .next
rm -rf node_modules/.cache

# 4. YENİDEN BAŞLAT
pnpm dev
```

### Veritabanı Bozulduysa

```bash
# 1. Son yedeği bul
ls -lt backups/ | head -10

# 2. Mevcut DB'yi yedekle (her ihtimale karşı)
cp prisma/tilbe.db prisma/tilbe-bozuk-$(date +%Y%m%d-%H%M%S).db

# 3. Yedeği geri yükle
cp backups/<en-yeni-yedek>.db prisma/tilbe.db

# 4. Sunucuyu restart et
pnpm dev
```

### Migration Hatası

```bash
# 1. Migration status kontrolü
pnpm prisma migrate status

# 2. Eğer drift varsa:
pnpm prisma migrate resolve --rolled-back <migration-name>

# 3. Veritabanını sıfırla (DİKKAT: TÜM VERİ GİDER, son çare)
# pnpm prisma migrate reset --force
# Sonra seed:
# pnpm db:seed
```

---

## 📋 GIT WORKFLOW

### Her Geliştirme Öncesi

```bash
# 1. Mevcut durumu commit'le (snapshot)
git add .
git commit -m "snapshot: <ne yapılacak> öncesi"

# 2. Büyük değişiklik için branch aç
git checkout -b feature/<isim>
```

### Her Geliştirme Sonrası

```bash
# 1. Test et (yukarıdaki komutlar)
# 2. Commit'le
git add .
git commit -m "feat: <ne yapıldı>"

# 3. Çalışıyorsa main'e merge et
git checkout main
git merge feature/<isim>

# 4. GitHub'a push (yedek)
git push origin main
```

### Commit Mesaj Stili

- `feat:` Yeni özellik (örn: "feat: TV kesim takip ekranı")
- `fix:` Bug düzeltme (örn: "fix: dekont PDF Türkçe karakter")
- `refactor:` Kod düzenleme, davranış aynı
- `style:` CSS/tasarım değişikliği
- `docs:` Belge güncelleme
- `test:` Test ekleme
- `chore:` Bakım, paket güncelleme

---

## ⚠️ ASLA YAPMA

- ❌ `prisma/schema.prisma`'yı `pnpm prisma migrate` olmadan değiştirme
- ❌ `prisma/migrations/` klasöründen dosya silme
- ❌ `node_modules/` klasöründe değişiklik
- ❌ `package.json` dependencies'lerini sebepsiz güncelleme
- ❌ Tailwind config değiştirme (renkler, font)
- ❌ `next.config.ts`'yi değiştirme (özellikle Turbopack)
- ❌ Production'da `prisma migrate reset` (TÜM VERİ SİLİNİR!)
- ❌ `.env` dosyasını commit'leme (.gitignore'da)
- ❌ `prisma/tilbe.db` dosyasını commit'leme (gitignore'da)
- ❌ `seed-data.json` (PII içerir) public repo'ya koyma
- ❌ Mevcut çalışan sayfaları "iyileştirme" amacıyla baştan yazma
- ❌ Aynı anda 5+ dosya değişikliği (küçük adım at)
- ❌ Test etmeden büyük refactor
- ❌ Tahsilat API'lerinde test etmeden değişiklik

---

## ✅ HER ZAMAN YAP

- ✅ Önce CLAUDE.md'yi oku
- ✅ Önce mevcut yapıyı tara, raporla (`ls`, `cat module.config.ts`, `find`)
- ✅ Plan sun, kullanıcının onayını al
- ✅ Küçük adımlarla ilerle (1-2 dosya, test, commit)
- ✅ Türkçe arayüz (`tr` locale, Türkçe metin, Türkçe rozetler)
- ✅ shadcn/ui bileşenlerini kullan
- ✅ Para için `formatPara()`, tarih için `formatTarih()` kullan
- ✅ Her büyük değişiklik öncesi `git commit`
- ✅ Her geliştirme sonrası test komutlarını çalıştır
- ✅ Tahsilat akışını **mutlaka** test et
- ✅ Hata varsa hemen geri al, durum raporu ver

---

## 🎯 BAYRAM HAZIRLIK ÖNCELİKLERİ

### 🔴 KRİTİK (Olmadan bayram günü çalışmaz)
1. Tahsilat akışı (✅ Mevcut, koru)
2. Müşteri arama (Ctrl+K)
3. Dekont yazdırma (✅ Mevcut)
4. Otomatik yedek (✅ Mevcut)
5. Kasa raporu (gün sonu)

### 🟡 ÖNEMLİ (Çok güzel olur)
1. **TV Ekranı (Kesim Takip)** ← İLK ÖNCELİK
2. Müşteri detay sayfası (avatar, tab, hızlı ödeme)
3. Borçlular listesi + Excel + WhatsApp toplu
4. Akordiyon menü + alt sayfalar
5. WhatsApp click-to-chat butonları

### 🟢 YAPABİLİRSEK (Bonus)
- Hisse atama akışı
- Vekalet yönetimi
- Çoklu kullanıcı (kasiyer rolü)
- Gider girişi

---

## 🆘 ŞU DURUMLARDA KULLANICIYA DANIŞ

- Mevcut çalışan kodu büyük ölçüde değiştirmek gerekiyorsa
- Yeni paket eklemek gerekiyorsa (`pnpm add`)
- Veritabanı şemasında değişiklik gerekiyorsa
- Auth/session yapısına dokunmak gerekiyorsa
- Mevcut API endpoint'lerini değiştirmek gerekiyorsa
- Test başarısız oluyorsa
- Emin değilsen
- Birden fazla yol varsa (kullanıcıya seçtir)

---

## 📞 GELİŞTİRME SONRASI RAPOR ŞABLONU

Her büyük iş sonrası kullanıcıya şöyle rapor ver:

```markdown
## ✅ TAMAMLANDI

- [Yapılan iş 1]
- [Yapılan iş 2]
- ...

## 🧪 TEST SONUÇLARI

- pnpm tsc --noEmit: ✅ / ❌
- pnpm build: ✅ / ❌
- Mevcut sayfalar açılıyor: ✅ / ❌
- Tahsilat test ödemesi: ✅ / ❌ (TKR-2026-XXXXX, ₺X, geri silindi)
- Yeni özellik testi: ✅ / ❌

## 📁 DEĞİŞTİRİLEN/YENİ DOSYALAR

- modules/<modul>/<dosya>.ts [yeni/değişti]
- ...

## ⚠️ DİKKAT EDİLECEKLER

- (varsa not düş)

## 📋 GIT COMMIT

- "<commit mesajı>"

## ❓ ONAY/KARAR BEKLEYEN

- (varsa kullanıcıya sor)
```

---

# kurban2026 klasöründe
# CLAUDE.md dosyasını kök dizine kopyala
# git add CLAUDE.md
# git commit -m "docs: CLAUDE.md kuralları"
# git push


**Bu kuralları her oturum başında oku. Geliştirme yaparken bunlara uy. Burhan Bayramı bu sistemle geçirecek, sorumluluk büyük 🐂**

**Hayırlı bayramlar olsun.**
