# Tilbe Kurban — Bayram 2026

Sakarya / Serdivan **Tilbehome** çiftliği için Kurban Bayramı 2026 tahsilat ve kesim takip sistemi.

Modüler mimari, lokal SQLite, LAN üzerinden çoklu kullanıcı.

## Özellikler

- ⚡ **Hızlı tahsilat**: Ctrl+K ile her yerden müşteri ara, 30 sn'de ödeme al
- 💰 **Karışık ödeme**: Nakit + havale + kart aynı işlemde, otomatik dağıtım
- 🧾 **Dekont yazdır**: Tarayıcının print-to-PDF'i ile A5 dekont
- 📊 **Anlık kasa**: Günlük rapor, yöntem bazında özet
- 📁 **Otomatik yedek**: Her ödemede + her saat başı `backups/` klasörüne
- 🧩 **Modüler**: 30 dakikada yeni modül ekle (örn. küçükbaş, bağış)
- 📱 **Mobile-first**: Saha personeli telefondan da kullanabilir
- 🔐 **Auth**: iron-session + bcrypt + rol bazlı izinler (admin/kasiyer)
- 📈 **Excel export**: Borçlular listesi tek tıkla `.xlsx`

## Teknik Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **TypeScript** strict mode
- **Tailwind CSS v4** + **shadcn/ui** (base-nova preset)
- **Prisma 6** + **SQLite**
- **iron-session** + **bcrypt** (auth)
- **zod** (validation) · **sonner** (toast) · **lucide-react** (icons)
- **date-fns** (tr locale) · **xlsx** (Excel)

## Kurulum

```bash
# 1. Bağımlılıkları yükle
pnpm install

# 2. Ortam değişkenlerini ayarla
cp .env.example .env
# .env dosyasını aç, SESSION_SECRET'ı güncelle (en az 32 karakter)

# 3. Veritabanını oluştur ve seed et
pnpm prisma migrate dev --name init

# 4. (Opsiyonel) Kendi seed-data.json'unu oluştur (örnek: seed-data.example.json)
# Sonra:
pnpm db:seed

# 5. Geliştirme sunucusunu başlat
pnpm dev:local        # sadece localhost
# veya
pnpm dev              # LAN'a da açık (0.0.0.0)
```

İlk kullanıcı: **`admin / tilbe2026`** (ilk girişten sonra Ayarlar > Kullanıcılar'dan değiştirin)

## LAN Erişimi (Telefon / Tablet)

```bash
pnpm dev    # 0.0.0.0 host
```

Bilgisayarın IP'sini bul:

- Windows: `ipconfig`
- macOS/Linux: `ifconfig`

Telefondan: `http://192.168.1.X:3000`

## Klasör Yapısı

```
tilbe-kurban/
├── app/                       # Next.js sayfalar + API rotaları
│   ├── giris/                 # Login
│   ├── tahsilat/              # ⭐ Ana çalışma ekranı
│   ├── musteriler/
│   ├── hayvanlar/
│   ├── kasa/
│   ├── raporlar/
│   ├── ayarlar/
│   └── api/
├── modules/                   # Modüler iş mantığı
│   ├── _core/                 # Auth, ayarlar, yedekleme
│   ├── _example/              # Yeni modül şablonu
│   ├── musteriler/
│   ├── hayvanlar/
│   ├── tahsilat/
│   ├── kasa/
│   └── raporlar/
├── shared/                    # Paylaşılan kod
│   ├── components/            # AppShell, Sidebar, SayfaBaslik
│   ├── lib/                   # prisma, session, para, tarih, backup, events
│   └── types/                 # Tip tanımları
├── components/ui/             # shadcn/ui bileşenleri
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── backups/                   # Otomatik DB yedekleri
```

## Modüler Mimari

Her özellik kendi klasöründe — sidebar, izinler, rotalar `module.config.ts`'den geliyor.

### Yeni Modül Ekleme (30 dk)

```bash
# 1. Şablonu kopyala
cp -r modules/_example modules/yeni-modul

# 2. modules/yeni-modul/module.config.ts düzenle
# 3. shared/lib/module-loader.ts'a import ekle
# 4. app/yeni-modul/page.tsx oluştur
# 5. (Gerekirse) prisma/schema.prisma'ya model ekle, migrate çek
```

Sidebar otomatik güncellenir, izin kontrolü otomatik yapılır.

## Yedekleme

- **Otomatik**: Her ödemede `backups/tilbe-{tarih}-odeme-{id}.db` üretilir
- **Manuel**: Ayarlar > Yedekleme > Şimdi Yedek Al
- **Bayram öncesi**: SQLite dosyasını (`prisma/tilbe.db`) USB'ye saatlik kopyalamayı unutmayın

## Faz Bilgisi

| Faz | İçerik | Durum |
|-----|--------|-------|
| **0** | Modüler altyapı, dynamic loader, sidebar | ✅ |
| **1A** | Core: auth, ayarlar, yedekleme | ✅ |
| **1B** | Müşteriler + Hayvanlar CRUD | ✅ |
| **1C** | ⭐ Tahsilat + ödeme + dekont | ✅ |
| **1D** | Kasa + Raporlar + Excel | ✅ |
| **1E** | Dashboard + cilalama | ✅ |
| **2**  | Kesim TV ekranı (SSE) | ⏳ planlanmadı |

## Güvenlik Notları

- ⚠️ `seed-data.json` müşteri PII içerir, **PUBLIC repo'ya KOYMAYIN** (gitignore'da).
- ⚠️ `.env` dosyasındaki `SESSION_SECRET`'ı production'da değiştirin.
- ⚠️ `prisma/tilbe.db` müşteri ödeme verisi içerir — repo'ya gitmez (gitignore'da).
- ✅ Şifreler bcrypt ile hashleniyor (10 rounds).
- ✅ Tüm API'lerde Zod input validation.

## Geliştirici Komutları

```bash
pnpm dev               # LAN'a açık (0.0.0.0) dev sunucu
pnpm dev:local         # Sadece localhost
pnpm build             # Production build
pnpm tsc --noEmit      # Tip kontrolü
pnpm db:migrate        # Yeni migration
pnpm db:seed           # Seed çalıştır
pnpm db:studio         # Prisma Studio (görsel DB editör)
```

## Lisans

Özel — Tilbehome / Sakarya
