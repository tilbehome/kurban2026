# 🛡️ SPRINT-P1 — BAYRAM ÖNCESİ EK SAĞLAMLAŞTIRMA

**Kaynak:** ChatGPT bağımsız audit raporu (25 May 2026) — P1 seviyesi maddeler
**Bayrama:** ~33 saat
**Hedef:** SPRINT-P0 sonrası ek güvenlik + dayanıklılık

**ÖNEMLİ:** Bu sprint **SPRINT-P0'dan SONRA** çalıştırılır.

---

## 🎯 ÇÖZÜLECEK 6 MADDE

| # | Madde | Süre | Risk |
|---|---|---|---|
| 1 | Repo private + admin şifre değiştir | 10 dk | 🔴 Güvenlik |
| 2 | SQLite WAL mode + busy_timeout | 15 dk | 🟠 Kilitleme |
| 3 | SQLite güvenli yedek (.backup komutu) | 30 dk | 🟠 Yedek bozulma |
| 4 | Yedek sağlık durumu dashboard | 30 dk | 🟠 Sessiz başarısızlık |
| 5 | Cache-Control: no-store standardı | 20 dk | 🟠 Eski veri |
| 6 | PWA service worker sürüm testi | 30 dk | 🟠 Eski cache |

**Toplam: ~2.5 saat**

---

## ⛔ DOKUNMA

- KUTSAL `/api/tahsilat/odeme` ana mantığı
- SPRINT-P0'da eklenen `Sayac` modeli + rate limit
- `iron-session` yapılandırması
- Migration sırası
- TV ekranı SSE akışı

---

## 📋 İŞ 1 — REPO PRIVATE + ADMIN ŞİFRE DEĞİŞTİR

### A) GitHub'da repo'yu private yap

1. https://github.com/tilbehome/kurban2026 → Settings
2. Aşağıya in → **Danger Zone** → **Change repository visibility**
3. **Make private** → onayla

**ÖNEMLİ:** Repo public kaldığı sürece README'deki `admin/tilbe2026` herkes okuyabilir.

### B) Admin şifresini değiştir

Sistemde giriş yap (admin/tilbe2026) → `/ayarlar/kullanicilar` → admin kullanıcısı → **şifre değiştir**

**Önerilen yeni şifre:**
- En az 12 karakter
- Büyük + küçük harf + sayı + özel karakter
- Örnek: `Bayram2026!Tilbe` veya senin seçeceğin

### C) README'den admin bilgisini kaldır

`README.md` dosyasında:

```md
# ESKİ (kaldırılacak)
**Varsayılan giriş:** `admin` / `tilbe2026`

# YENİ
**Varsayılan giriş:** `admin` / (kurulumda belirlenir)
**Not:** İlk girişten sonra zorunlu şifre değiştirme yapılmalıdır.
```

### D) Seed dosyasını .env ile parametrize et

`prisma/seed.ts` veya hangi dosya admin'i oluşturuyorsa:

```ts
// ESKİ
const adminSifre = "tilbe2026";

// YENİ
const adminSifre = process.env.ADMIN_INITIAL_PASSWORD;
if (!adminSifre || adminSifre.length < 12) {
  throw new Error(
    "ADMIN_INITIAL_PASSWORD .env'de tanımlı değil veya 12 karakterden az. " +
    "Örnek: ADMIN_INITIAL_PASSWORD=Bayram2026!Tilbe"
  );
}

const sifreHash = await bcrypt.hash(adminSifre, 12);
```

`.env.example` dosyasına ekle:

```env
# Admin ilk kurulum şifresi (sadece seed çalıştırılırken kullanılır)
ADMIN_INITIAL_PASSWORD=DEGISTIRILECEK_GUVENLI_SIFRE
```

`.env` dosyasına ekle (commit edilmiyor):
```env
ADMIN_INITIAL_PASSWORD=Bayram2026!Tilbe
```

**Süre: 10 dakika**

---

## 📋 İŞ 2 — SQLite WAL MODE + BUSY_TIMEOUT

### Sorun

Bayram günü 3-5 kasiyer + TV + raporlar + yedekleme aynı anda → SQLite kilitlenme riski (`SQLITE_BUSY`).

### Çözüm

`shared/lib/prisma.ts` veya hangi dosya Prisma client'ı oluşturuyorsa **bağlantı sonrası SQLite pragma'larını ayarla**:

```ts
// shared/lib/prisma.ts

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// 🆕 SQLite optimizasyonları
async function sqliteOptimize() {
  try {
    // WAL mode — concurrent read+write
    await prisma.$executeRawUnsafe("PRAGMA journal_mode=WAL");
    // 5 saniye timeout (default 0)
    await prisma.$executeRawUnsafe("PRAGMA busy_timeout=5000");
    // Synchronous NORMAL (default FULL) - WAL ile dengeli
    await prisma.$executeRawUnsafe("PRAGMA synchronous=NORMAL");
    // Foreign key constraint enforcement
    await prisma.$executeRawUnsafe("PRAGMA foreign_keys=ON");

    console.log("✅ SQLite optimize edildi (WAL + busy_timeout + synchronous)");
  } catch (e) {
    console.error("⚠️ SQLite pragma hatası:", e);
  }
}

// İlk kullanımda bir kez çalıştır
sqliteOptimize();
```

### Doğrulama

`scripts/sqlite-pragma-kontrol.ts` (YENİ):

```ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function kontrol() {
  console.log("\n🔍 SQLITE PRAGMA KONTROL\n");

  const pragmalar = [
    "journal_mode",
    "busy_timeout",
    "synchronous",
    "foreign_keys",
    "cache_size",
    "wal_autocheckpoint",
  ];

  for (const p of pragmalar) {
    const sonuc = await prisma.$queryRawUnsafe<{ [key: string]: any }[]>(
      `PRAGMA ${p}`
    );
    console.log(`  ${p}: ${JSON.stringify(sonuc[0])}`);
  }

  await prisma.$disconnect();
}

kontrol().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

Çalıştır:
```bash
pnpm tsx scripts/sqlite-pragma-kontrol.ts
```

**Beklenen çıktı:**
```
journal_mode: wal     ← ✅
busy_timeout: 5000    ← ✅
synchronous: 1        ← ✅ NORMAL
foreign_keys: 1       ← ✅ ON
```

**Süre: 15 dakika**

---

## 📋 İŞ 3 — SQLITE GÜVENLİ YEDEK (.backup KOMUTU)

### Sorun

Şu an `shared/lib/backup.ts` muhtemelen `fs.copyFileSync()` ile düz dosya kopyalama yapıyor. WAL mode'da bu **bozuk yedek** üretir (`.db-wal` ve `.db-shm` dahil edilmediği için).

### Çözüm — SQLite'ın resmi `.backup` komutu

`shared/lib/backup.ts` rewrite:

```ts
// shared/lib/backup.ts

import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "./prisma";

const execAsync = promisify(exec);

const YEDEK_KLASORU = path.join(process.cwd(), "backups");
const DB_YOLU = path.join(process.cwd(), "prisma", "tilbe.db");

// Yedek klasörü yoksa oluştur
if (!fs.existsSync(YEDEK_KLASORU)) {
  fs.mkdirSync(YEDEK_KLASORU, { recursive: true });
}

/**
 * SQLite .backup komutu ile güvenli yedek alır.
 * WAL mode'da aktif yazma sırasında bile tutarlı yedek üretir.
 *
 * @param etiket Yedek dosyasına eklenir (örn. "odeme-abc123")
 * @returns Yedek dosyasının yolu
 */
export async function yedekAl(etiket: string = "manual"): Promise<string> {
  const zaman = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19);

  const dosyaAdi = `tilbe-${zaman}-${etiket}.db`;
  const hedefYol = path.join(YEDEK_KLASORU, dosyaAdi);

  try {
    // SQLite .backup komutu — atomic, WAL-safe
    // sqlite3 binary'si genelde sistemde mevcut. Yoksa Prisma'nın gömülü tools'unu kullan.
    await execAsync(
      `sqlite3 "${DB_YOLU}" ".backup '${hedefYol}'"`,
      { timeout: 30000 } // 30 saniye max
    );

    // Doğrulama — yedek dosyası oluştu mu?
    if (!fs.existsSync(hedefYol)) {
      throw new Error("Yedek dosyası oluşturulamadı");
    }

    const boyut = fs.statSync(hedefYol).size;
    if (boyut < 1024) { // En az 1KB olmalı
      throw new Error(`Yedek dosyası çok küçük: ${boyut} byte`);
    }

    // Eski yedekleri temizle (son 50 tanesini koru)
    await eskileriTemizle();

    return hedefYol;
  } catch (e) {
    console.error("[yedekAl] HATA:", e);
    throw e;
  }
}

/**
 * Eski yedekleri sil (son 50 tanesini koru)
 */
async function eskileriTemizle() {
  try {
    const dosyalar = fs
      .readdirSync(YEDEK_KLASORU)
      .filter((d) => d.endsWith(".db"))
      .map((d) => ({
        ad: d,
        yol: path.join(YEDEK_KLASORU, d),
        zaman: fs.statSync(path.join(YEDEK_KLASORU, d)).mtimeMs,
      }))
      .sort((a, b) => b.zaman - a.zaman);

    // 50'den fazlaysa eskileri sil
    if (dosyalar.length > 50) {
      const silinecekler = dosyalar.slice(50);
      for (const d of silinecekler) {
        fs.unlinkSync(d.yol);
      }
    }
  } catch (e) {
    console.error("[eskileriTemizle] HATA:", e);
  }
}

/**
 * En son yedek bilgisini döner (dashboard için)
 */
export async function sonYedekBilgisi(): Promise<{
  varMi: boolean;
  dosyaAdi: string | null;
  zaman: Date | null;
  boyutKB: number | null;
  yasGecmisDk: number | null;
}> {
  try {
    if (!fs.existsSync(YEDEK_KLASORU)) {
      return { varMi: false, dosyaAdi: null, zaman: null, boyutKB: null, yasGecmisDk: null };
    }

    const dosyalar = fs
      .readdirSync(YEDEK_KLASORU)
      .filter((d) => d.endsWith(".db"))
      .map((d) => ({
        ad: d,
        yol: path.join(YEDEK_KLASORU, d),
        zaman: fs.statSync(path.join(YEDEK_KLASORU, d)).mtimeMs,
        boyut: fs.statSync(path.join(YEDEK_KLASORU, d)).size,
      }))
      .sort((a, b) => b.zaman - a.zaman);

    if (dosyalar.length === 0) {
      return { varMi: false, dosyaAdi: null, zaman: null, boyutKB: null, yasGecmisDk: null };
    }

    const son = dosyalar[0]!;
    const zaman = new Date(son.zaman);
    const yasMs = Date.now() - son.zaman;
    const yasGecmisDk = Math.floor(yasMs / 60000);

    return {
      varMi: true,
      dosyaAdi: son.ad,
      zaman,
      boyutKB: Math.round(son.boyut / 1024),
      yasGecmisDk,
    };
  } catch (e) {
    console.error("[sonYedekBilgisi] HATA:", e);
    return { varMi: false, dosyaAdi: null, zaman: null, boyutKB: null, yasGecmisDk: null };
  }
}

/**
 * Yedek dosyasını doğrula — açılabilir mi?
 */
export async function yedekDogrula(yedekYolu: string): Promise<{
  gecerliMi: boolean;
  tabloSayisi: number | null;
  hata: string | null;
}> {
  try {
    const sonuc = await execAsync(
      `sqlite3 "${yedekYolu}" "SELECT count(*) FROM sqlite_master WHERE type='table';"`,
      { timeout: 10000 }
    );

    const tabloSayisi = parseInt(sonuc.stdout.trim(), 10);

    if (isNaN(tabloSayisi) || tabloSayisi < 10) {
      return { gecerliMi: false, tabloSayisi, hata: "Tablo sayısı çok az" };
    }

    return { gecerliMi: true, tabloSayisi, hata: null };
  } catch (e) {
    return {
      gecerliMi: false,
      tabloSayisi: null,
      hata: e instanceof Error ? e.message : String(e),
    };
  }
}
```

### Windows Notu

Eğer Windows'ta çalışıyorsa ve `sqlite3` binary yoksa, **node-sqlite3** ile alternatif:

```bash
pnpm add better-sqlite3
```

Sonra `yedekAl()` fonksiyonu içinde:

```ts
import Database from "better-sqlite3";

export async function yedekAl(etiket: string = "manual"): Promise<string> {
  const zaman = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const dosyaAdi = `tilbe-${zaman}-${etiket}.db`;
  const hedefYol = path.join(YEDEK_KLASORU, dosyaAdi);

  const db = new Database(DB_YOLU, { readonly: true });
  try {
    await db.backup(hedefYol);
    db.close();
  } catch (e) {
    db.close();
    throw e;
  }

  // ... doğrulama + temizleme
  return hedefYol;
}
```

**`better-sqlite3`'ün `.backup()` metodu** WAL-safe ve cross-platform.

**Süre: 30 dakika**

---

## 📋 İŞ 4 — YEDEK SAĞLIK DURUMU DASHBOARD'A

### Sorun

Mevcut sistemde yedek async çalışıyor, hata sadece console'a düşüyor. Bayram günü sessiz başarısızlık → kimse fark etmez.

### Çözüm

### A) Dashboard'a yeni KPI kartı

`app/page.tsx` veya `modules/dashboard/components/DashboardKpiler.tsx`:

```tsx
import { sonYedekBilgisi } from "@/shared/lib/backup";

// Server component'te:
const yedekBilgisi = await sonYedekBilgisi();

// KPI grid'ine ekle:
<YedekKart bilgi={yedekBilgisi} />
```

Yeni component: `modules/dashboard/components/YedekKart.tsx`:

```tsx
import { Database, AlertTriangle, CheckCircle2 } from "lucide-react";

interface YedekBilgisi {
  varMi: boolean;
  dosyaAdi: string | null;
  zaman: Date | null;
  boyutKB: number | null;
  yasGecmisDk: number | null;
}

export function YedekKart({ bilgi }: { bilgi: YedekBilgisi }) {
  if (!bilgi.varMi) {
    return (
      <div className="rounded-2xl bg-red-50 border-2 border-red-300 p-4">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h3 className="font-bold text-red-700">Yedek Yok!</h3>
        </div>
        <p className="text-sm text-red-600">
          Sistemde yedek bulunamadı. Hemen manuel yedek alın.
        </p>
      </div>
    );
  }

  const yas = bilgi.yasGecmisDk ?? 0;

  // 30dk içinde → yeşil
  // 30-60dk → sarı
  // 60+dk → kırmızı
  const renkler =
    yas < 30 ? {
      bg: "bg-green-50",
      border: "border-green-300",
      text: "text-green-700",
      icon: CheckCircle2,
      iconColor: "text-green-600",
      durum: "Güncel",
    } :
    yas < 60 ? {
      bg: "bg-yellow-50",
      border: "border-yellow-300",
      text: "text-yellow-700",
      icon: AlertTriangle,
      iconColor: "text-yellow-600",
      durum: "Eski",
    } : {
      bg: "bg-red-50",
      border: "border-red-300",
      text: "text-red-700",
      icon: AlertTriangle,
      iconColor: "text-red-600",
      durum: "KRİTİK ESKİ",
    };

  const Icon = renkler.icon;

  return (
    <div className={`rounded-2xl ${renkler.bg} border-2 ${renkler.border} p-4`}>
      <div className="flex items-center gap-2 mb-1">
        <Database className="h-5 w-5 text-stone-600" />
        <h3 className="font-bold text-stone-700">Son Yedek</h3>
        <Icon className={`h-4 w-4 ${renkler.iconColor} ml-auto`} />
      </div>
      <p className={`text-2xl font-bold ${renkler.text}`}>
        {yas} dk önce
      </p>
      <p className="text-xs text-stone-500 mt-1">
        {bilgi.zaman?.toLocaleTimeString("tr-TR")} · {bilgi.boyutKB} KB
      </p>
      <p className={`text-xs font-semibold mt-1 ${renkler.text}`}>
        Durum: {renkler.durum}
      </p>
    </div>
  );
}
```

### B) Manuel yedek butonu

Dashboard'da yedek kartının yanına buton:

```tsx
<button
  onClick={async () => {
    const r = await fetch("/api/yedek/manuel", { method: "POST" });
    if (r.ok) toast.success("Yedek alındı!");
    else toast.error("Yedek alınamadı");
    location.reload();
  }}
  className="rounded-md bg-blue-500 px-3 py-1.5 text-sm text-white"
>
  Şimdi Yedek Al
</button>
```

API: `app/api/yedek/manuel/route.ts` (YENİ):

```ts
import { NextResponse } from "next/server";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { yedekAl } from "@/shared/lib/backup";
import { auditLog, ipCikar } from "@/shared/lib/audit";

export async function POST(req: Request) {
  const oturum = await aktifOturum();
  if (!oturum || !izinKontrol(oturum, "ayarlar.yonet")) {
    return NextResponse.json({ basarili: false, hata: "Yetki yok" }, { status: 401 });
  }

  try {
    const yedekYolu = await yedekAl("manuel");

    await auditLog({
      eylem: "yedek-manuel",
      kullaniciId: oturum.kullaniciId,
      ip: ipCikar(req),
      detaylar: { yedekYolu },
    });

    return NextResponse.json({ basarili: true, yedekYolu });
  } catch (e) {
    return NextResponse.json(
      { basarili: false, hata: e instanceof Error ? e.message : "Yedek hatası" },
      { status: 500 },
    );
  }
}
```

**Süre: 30 dakika**

---

## 📋 İŞ 5 — CACHE-CONTROL: NO-STORE STANDARDI

### Sorun

PWA service worker tahsilat/auth endpoint'lerini NetworkOnly yapıyor ama yeni endpoint eklenirse unutulabilir. Response header düzeyinde garanti yok.

### Çözüm — Middleware'de Standart

`middleware.ts` dosyasında, finansal/operasyonel endpoint'ler için response header ekle:

```ts
// middleware.ts

const NO_STORE_PATTERN = [
  "/api/tahsilat",
  "/api/odeme",
  "/api/auth",
  "/api/kasa",
  "/api/yedek",
  "/api/tv/kurban-asama",
  "/api/tv/ilerleme",
  "/api/kesim",
  "/api/hayvanlar", // POST/PATCH/DELETE
  "/api/musteriler", // POST/PATCH/DELETE
];

export async function middleware(req: NextRequest) {
  // ... mevcut auth + public route logic ...

  const response = NextResponse.next();

  // 🆕 Finansal/operasyonel endpoint'ler için no-store
  const path = req.nextUrl.pathname;
  if (NO_STORE_PATTERN.some((p) => path.startsWith(p))) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}
```

### Test

```bash
# Tarayıcı DevTools → Network sekmesi
# Bir tahsilat al → /api/tahsilat/odeme isteği
# Response Headers → Cache-Control: no-store olmalı
```

**Süre: 20 dakika**

---

## 📋 İŞ 6 — PWA SERVICE WORKER SÜRÜM TESTİ

### Sorun

`next-pwa` + Next 16 kırılgan. Eski service worker yeni JS'i cache'leyebilir → kasiyer eski sürümle ödeme alabilir.

### Çözüm

### A) Service Worker'da skipWaiting + clientsClaim

`next.config.ts` veya `pwa.config.ts` (next-pwa config'i):

```ts
withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,        // ✅ Yeni SW hemen aktif
  clientsClaim: true,       // ✅ Açık sekmeleri yeni SW'ye geçir
  disable: process.env.NODE_ENV === "development",

  // 🆕 Sürüm yönetimi
  cleanupOutdatedCaches: true,

  // 🆕 Tahsilat/auth/odeme: ASLA cache'leme
  runtimeCaching: [
    {
      urlPattern: /^\/api\/(tahsilat|auth|odeme|kasa|yedek|tv\/kurban-asama|tv\/ilerleme|kesim)\//,
      handler: "NetworkOnly",
    },
    // Diğer cache stratejileri...
  ],
});
```

### B) Sürüm kontrol mekanizması

`public/sw-version.json` (YENİ):

```json
{
  "version": "2026.05.25.1",
  "build": "abc123"
}
```

Bu dosyayı her build'de güncelle. Build script:

```json
{
  "scripts": {
    "build": "node scripts/sw-version-gen.mjs && next build --webpack",
    ...
  }
}
```

`scripts/sw-version-gen.mjs`:

```js
import fs from "node:fs";
import path from "node:path";

const versiyon = new Date().toISOString().slice(0, 16).replace(/[-:]/g, ".").replace("T", ".");
const build = Math.random().toString(36).slice(2, 8);

fs.writeFileSync(
  path.join(process.cwd(), "public/sw-version.json"),
  JSON.stringify({ version: versiyon, build, builtAt: new Date().toISOString() }, null, 2)
);

console.log(`✅ SW version: ${versiyon} (${build})`);
```

### C) Client-side sürüm kontrolü

`shared/components/SwGuncellemeUyarisi.tsx` (YENİ):

```tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

export function SwGuncellemeUyarisi() {
  const [yeniVersiyon, setYeniVersiyon] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const mevcutVersiyon = localStorage.getItem("sw-version");

    // Her 5 dakikada sürüm kontrol et
    const kontrolEt = async () => {
      try {
        const r = await fetch("/sw-version.json", { cache: "no-store" });
        if (!r.ok) return;
        const data = await r.json();

        if (mevcutVersiyon && mevcutVersiyon !== data.version) {
          setYeniVersiyon(data.version);
        } else if (!mevcutVersiyon) {
          localStorage.setItem("sw-version", data.version);
        }
      } catch (e) {
        console.error("SW versiyon kontrol hatası:", e);
      }
    };

    kontrolEt();
    const interval = setInterval(kontrolEt, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!yeniVersiyon) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl bg-blue-500 p-4 text-white shadow-2xl">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🔄</span>
        <strong>Yeni sürüm hazır!</strong>
      </div>
      <p className="text-sm mb-3">
        Sistemde güncelleme var. Lütfen yeniden yükle.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => {
            localStorage.setItem("sw-version", yeniVersiyon);
            // Service worker'ı zorla güncelle
            if (navigator.serviceWorker) {
              navigator.serviceWorker.getRegistrations().then((rs) => {
                rs.forEach((r) => r.update());
              });
            }
            window.location.reload();
          }}
          className="rounded-md bg-white px-3 py-1 text-sm font-semibold text-blue-500"
        >
          Yenile
        </button>
        <button
          onClick={() => setYeniVersiyon(null)}
          className="rounded-md border border-white px-3 py-1 text-sm"
        >
          Sonra
        </button>
      </div>
    </div>
  );
}
```

`app/layout.tsx` veya kök layout'a ekle:

```tsx
<SwGuncellemeUyarisi />
```

### D) Test

1. `pnpm build && pnpm start`
2. Tarayıcıdan aç → DevTools → Application → Service Workers
3. Bir değişiklik yap → `pnpm build` tekrar
4. Açık sekmede 5 dakika bekle (veya interval'i 30 saniyeye düşür test için)
5. **"Yeni sürüm hazır" uyarısı çıkmalı**
6. "Yenile" → eski cache temizlenir, yeni sürüm yüklenir

**Süre: 30 dakika**

---

## ✅ TEST ADIM ADIM

```bash
# 1. SQLite kontrol
pnpm tsx scripts/sqlite-pragma-kontrol.ts
# Beklenen: journal_mode=wal, busy_timeout=5000

# 2. Yedek test
pnpm tsx scripts/yedek-test.ts  # (aşağıda)
# Manuel yedek alıp doğrula

# 3. Build
pnpm tsc --noEmit
pnpm build

# 4. Dev
pnpm dev
```

`scripts/yedek-test.ts` (YENİ):

```ts
import { yedekAl, sonYedekBilgisi, yedekDogrula } from "@/shared/lib/backup";

async function test() {
  console.log("🧪 Yedek testi başlıyor...\n");

  // 1. Manuel yedek al
  console.log("1️⃣ Yedek alınıyor...");
  const yol = await yedekAl("test");
  console.log(`   ✅ Yedek: ${yol}`);

  // 2. Doğrula
  console.log("\n2️⃣ Doğrulanıyor...");
  const dogrulama = await yedekDogrula(yol);
  console.log(`   Geçerli mi: ${dogrulama.gecerliMi}`);
  console.log(`   Tablo sayısı: ${dogrulama.tabloSayisi}`);

  // 3. Son yedek bilgisi
  console.log("\n3️⃣ Son yedek bilgisi:");
  const bilgi = await sonYedekBilgisi();
  console.log(`   Dosya: ${bilgi.dosyaAdi}`);
  console.log(`   Yaş: ${bilgi.yasGecmisDk} dk`);
  console.log(`   Boyut: ${bilgi.boyutKB} KB`);
}

test().catch(console.error);
```

### Tarayıcı Testi

1. **`/` dashboard** → "Son Yedek" kartı görünmeli (yeşil/sarı/kırmızı)
2. "Şimdi Yedek Al" → toast "Yedek alındı"
3. Sayfa refresh → yaş 0 dk olmalı
4. **`/api/tahsilat/odeme` POST** → Network'te Response Headers → `Cache-Control: no-store`
5. PWA: Build sonrası açık sekmede 5dk sonra "Yeni sürüm hazır" uyarısı

### KUTSAL Kontrolü

- [ ] Tahsilat çalışıyor → ABH-2026-NNN
- [ ] Yedek async çalışıyor (ödeme yavaşlamıyor)
- [ ] WAL mode kurban aşama geçişlerini engellemiyor
- [ ] Audit log akışı bozulmadı

---

## 📊 RAPOR

Bittiğinde:

```
✅ Commit SHA: ...
✅ pnpm tsc + build temiz

İŞ 1 (Güvenlik):
✅ Repo private yapıldı
✅ Admin şifresi değiştirildi (12+ karakter)
✅ README'den eski şifre kaldırıldı
✅ ADMIN_INITIAL_PASSWORD .env ile

İŞ 2 (SQLite WAL):
✅ Pragma kontrol scripti çalıştı
✅ journal_mode=wal, busy_timeout=5000

İŞ 3 (Yedek):
✅ better-sqlite3 .backup() entegre
✅ Test scripti çıktısı temiz
✅ 50 dosya rotasyonu çalışıyor

İŞ 4 (Dashboard):
✅ "Son Yedek" KPI kartı eklendi
✅ Manuel yedek butonu çalışıyor
✅ Yaş bazlı renk (yeşil/sarı/kırmızı)

İŞ 5 (Cache):
✅ Middleware no-store header ekliyor
✅ Network sekmesinde doğrulandı

İŞ 6 (PWA):
✅ skipWaiting + clientsClaim aktif
✅ sw-version.json build'de güncelleniyor
✅ Yeni sürüm uyarısı çalışıyor

KUTSAL:
✅ ABH-2026-000XXX dekont oluştu
✅ Yedek async, ödeme akışını bekletmiyor
```

---

## 🎯 BAYRAM ÖNCESİ ETKİ ÖZETİ

**ÖNCESİ:**
- Repo public + README'de şifre
- SQLite kilitlenme riski
- Yedek dosyası bozulabilir
- Yedek sessizce bozulursa kimse fark etmez
- Eski cache → eski veri
- Service worker güncellenmeyebilir

**SONRASI:**
- Repo private + güçlü şifre
- WAL mode → 5x daha hızlı concurrent
- Yedek WAL-safe + atomik
- Dashboard'da canlı yedek durumu
- Tüm finansal endpoint no-store
- Otomatik sürüm güncelleme uyarısı

---

## 🚨 SIRA

```
ŞİMDİ (SPRINT-12 çalışıyor)
+2 sa  → SPRINT-12 biter
+1.5sa → SPRINT-P0 (3 kritik)
+2.5sa → SPRINT-P1 (BU sprint)
+0.5sa → DB yedek + uyu

Toplam: ~6.5 saat → 04:30 yatakta
Yarın 09:00 → veri yükleme + test
```

Veya bayrama 1 gün kala olduğun için **SPRINT-P1 yarın sabaha** ertelenebilir:

```
ŞİMDİ → SPRINT-12 (2 sa)
+2sa  → SPRINT-P0 (1.5 sa) → uyu
─────────────────────────────
YARIN 09:00 → SPRINT-P1 (2.5 sa)
YARIN 12:00 → Veri yükleme + test
YARIN 18:00 → Son hazırlık
ÇARŞAMBA 06:00 → BAYRAM 🐂
```

**Süre tahmini: 2.5 saat**
