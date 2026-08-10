# PROMPT-FAZ-9.6 — PWA + Arka Plan Push (TilbeCore Kurban 2026)

## 🎯 Hedef

FAZ 9.5'te eklenen push altyapısının (PushAbonelik modeli, BildirimLog, `usePushBildirim` hook'u, `/api/tv/push-abonelik` ve `/api/tv/push-gonder` endpoint'leri) üzerine **eksik kalan PWA katmanını** tamamla:

1. **Manifest + ikonlar** → "Ana ekrana ekle" çalışsın
2. **Service Worker** → offline cache + `push` event handler + `notificationclick`
3. **`web-push` paketi** → server'dan arka plan bildirim (sayfa kapalıyken bile)
4. **VAPID anahtarları** → güvenli identifier
5. **Akıllı install prompt** → `beforeinstallprompt` yakalama + role-aware UI
6. **iOS uyumluluk** → Apple touch ikonlar + meta etiketler
7. **Offline fallback** → `/offline` sayfası

**Süre tahmini:** 2-3 saat.

---

## 📋 Bağlam (Bu Repo Hakkında Bilmen Gerekenler)

- **Stack:** Next.js 16 (App Router, Turbopack) + React 19 + TypeScript strict + Prisma 6 + SQLite + Tailwind 4 + shadcn/ui
- **Mimari kurallar:** `MIMARI.md` (proje kökünde) — cuid IDler, soft delete (silindiMi), audit log, custom errors, granular izin
- **Geliştirme kuralları:** `CLAUDE.md` (proje kökünde) — "yeni paket sebepsiz eklenmez" kuralı geçerli, ama PWA için `next-pwa` ve `web-push` **zorunlu**
- **Tasarım rehberi:** `TASARIM-BRIEF.md` — `TILBE_ORANGE #ea580c` dashboard'da kullanılıyor
- **Modül yapısı:** Her şey `modules/<modul-adi>/` altında — `components/`, `lib/`, `index.ts` (public API)
- **Shared:** `shared/lib/`, `shared/hooks/`, `shared/components/` — paylaşılan kod
- **API standartı:** `{ basarili: boolean, veri?: T, hata?: { kod, mesaj } }`
- **Audit:** Tüm kritik işlemler `auditLog()` çağırmalı (`shared/lib/audit.ts`)

---

## 🚨 KUTSAL (Korunması Zorunlu)

1. **Tahsilat akışı** — `/api/tahsilat/odeme` endpoint'i, dekont üretimi (TKR-2026-NNN), otomatik yedekleme **hiçbir şekilde bozulmamalı**. Test: Bayram öncesi günde Burhan Bey kasiyer olarak para alacak, sistem çökerse felaket.
2. **FAZ 9.5 push API'leri** — `/api/tv/push-abonelik` ve `/api/tv/push-gonder` **kırılmamalı**, `web-push` ile **genişletilmeli**
3. **Mevcut auth akışı** — iron-session cookie, `aktifOturum()`, `izinKontrol()` dokunulmaz
4. **Mevcut 38+ sayfa** — hepsi HTTP 200 dönmeye devam etmeli
5. **Public routes** — `/tv`, `/tv/m`, `/tv/m/k/[kesimSirasi]`, `/giris` auth gerektirmiyor, **aynı kalmalı**

---

## 🎨 Marka & Tema (PWA için)

```
Logo:        public/icons/tilbe-logo-source.png (kullanıcı yükleyecek)
Marka adı:   Tilbe Kurban Bayramı 2026
Kısa ad:     Tilbe Kurban
Tema rengi:  #BD2C31 (logodan örneklendi — kırmızı)
BG rengi:    #FFFFFF (beyaz)
Açıklama:    Kurban Bayramı 2026 — Müşteri, kesim, tahsilat ve operasyon takibi
Yönelim:     portrait-primary (telefonda ana mod)
Display:     standalone
Scope:       /
Start URL:   /?pwa=1
```

**ÖNEMLİ:** Dashboard'da `TILBE_ORANGE #ea580c` kullanılıyor (TASARIM-BRIEF.md'de tanımlı), ama **PWA tema rengi logoya uygun olarak `#BD2C31` (kırmızı)** olmalı. Bu sadece manifest ve splash screen için. Dashboard tema rengini değiştirme.

---

## 📦 Adım 1 — Paket Kurulumu

```bash
pnpm add next-pwa@5.6.0 web-push@3.6.7
pnpm add -D @types/web-push
```

`next-pwa@5.6.0` — Next.js 16 ile çalışan stabil sürüm (15+ üzerinde test gerek)
`web-push@3.6.7` — VAPID + push payload encryption

**Eğer `next-pwa` Next.js 16 ile uyumsuzluk verirse:**
- `next-pwa@5.6.0` → `@ducanh2912/next-pwa@10.x` deneyebilirsin (Next 15+ uyumlu, daha modern)
- Karar verirken `pnpm build` çıktısını izle, hata varsa alternative'e geç

---

## 🗝️ Adım 2 — VAPID Anahtarları

Bir kerelik script yaz (`scripts/vapid-uret.ts`):

```ts
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();
console.log("VAPID_PUBLIC_KEY=" + keys.publicKey);
console.log("VAPID_PRIVATE_KEY=<SECRET> + keys.privateKey);
console.log("VAPID_SUBJECT=mailto:<EXAMPLE_EMAIL>");
```

Çalıştır:
```bash
pnpm tsx scripts/vapid-uret.ts >> .env
```

`.env.example` dosyasına da şunları ekle (anahtarları DEĞİL, sadece şablonu):
```
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
<SECRET>
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
```

`NEXT_PUBLIC_VAPID_PUBLIC_KEY` — istemcide subscription için lazım, `VAPID_PUBLIC_KEY` ile **aynı değer** olmalı.

**Audit log:**  VAPID anahtarları `.env`'de — repo'ya commit'lenmesin. `.gitignore` zaten `.env` içeriyor mu kontrol et.

---

## 📁 Adım 3 — İkon Dosyalarını Yerleştir

Kullanıcı `pwa-icons.zip` dosyasını paylaştı. Tüm içeriği şuraya kopyala:

```
public/icons/
├── icon-72.png
├── icon-96.png
├── icon-128.png
├── icon-144.png
├── icon-152.png
├── icon-192.png
├── icon-384.png
├── icon-512.png
├── icon-maskable-192.png      ← Android adaptive
├── icon-maskable-512.png      ← Android adaptive
├── apple-icon-120.png         ← iPhone retina
├── apple-icon-152.png         ← iPad
├── apple-icon-167.png         ← iPad Pro
├── apple-icon-180.png         ← iPhone Plus
├── favicon-16.png
├── favicon-32.png
├── favicon-48.png
└── favicon.ico                ← public/ köküne de kopya
```

`public/favicon.ico` zaten varsa üzerine yaz.

---

## 📜 Adım 4 — manifest.json

`public/manifest.json` oluştur:

```json
{
  "name": "Tilbe Kurban Bayramı 2026",
  "short_name": "Tilbe Kurban",
  "description": "Kurban Bayramı 2026 — Müşteri, kesim, tahsilat ve operasyon takibi",
  "start_url": "/?pwa=1",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#ffffff",
  "theme_color": "#BD2C31",
  "lang": "tr",
  "dir": "ltr",
  "categories": ["business", "productivity", "utilities"],
  "icons": [
    { "src": "/icons/icon-72.png",  "sizes": "72x72",   "type": "image/png" },
    { "src": "/icons/icon-96.png",  "sizes": "96x96",   "type": "image/png" },
    { "src": "/icons/icon-128.png", "sizes": "128x128", "type": "image/png" },
    { "src": "/icons/icon-144.png", "sizes": "144x144", "type": "image/png" },
    { "src": "/icons/icon-152.png", "sizes": "152x152", "type": "image/png" },
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-384.png", "sizes": "384x384", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "shortcuts": [
    {
      "name": "Tahsilat",
      "short_name": "Tahsilat",
      "description": "Hızlı ödeme alma",
      "url": "/tahsilat?pwa=1",
      "icons": [{ "src": "/icons/icon-192.png", "sizes": "192x192" }]
    },
    {
      "name": "TV Ekranı",
      "short_name": "TV",
      "description": "Canlı kesim takibi",
      "url": "/tv?pwa=1",
      "icons": [{ "src": "/icons/icon-192.png", "sizes": "192x192" }]
    },
    {
      "name": "Müşteri Takip",
      "short_name": "Takip",
      "description": "Kurbanımı takip et",
      "url": "/tv/m?pwa=1",
      "icons": [{ "src": "/icons/icon-192.png", "sizes": "192x192" }]
    }
  ]
}
```

---

## ⚙️ Adım 5 — next.config.ts (PWA Entegrasyon)

Mevcut `next.config.ts`'i koru, sadece `next-pwa` wrap ekle:

```ts
import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  // Mevcut SW'ye push event handler eklemek için
  sw: "sw.js",
  // Workbox cache strategy
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "tilbe-runtime",
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60, // 1 gün
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "tilbe-images",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 gün
        },
      },
    },
  ],
  // KUTSAL: /api/tahsilat/odeme'yi ASLA cache'leme
  buildExcludes: [/middleware-manifest\.json$/],
});

const nextConfig: NextConfig = {
  // ... mevcut config korunur
};

export default withPWA(nextConfig);
```

**KRİTİK:** Tahsilat ve push endpoint'leri network-only olmalı. Bunu `runtimeCaching` üzerinde **explicit exclude** ile yap — gerekirse `NetworkFirst` yerine `NetworkOnly` patterni ekle:

```ts
{
  urlPattern: /\/api\/(tahsilat|tv\/push-gonder|tv\/push-abonelik|auth)/,
  handler: "NetworkOnly",
}
```

---

## 🔧 Adım 6 — Custom Service Worker (Push Handler)

`next-pwa` otomatik SW üretir ama push event'i için custom ekleme lazım. Şu yöntem:

`public/sw-custom.js` oluştur (next-pwa bunu auto-import edecek şekilde wrapper kullan), VEYA daha temiz yol: `next-pwa`'nin `workboxOptions.importScripts` ile harici dosya yükleyebilirsin.

**Önerilen:** `public/push-handler.js` oluştur:

```js
// public/push-handler.js
// Bu dosya sw.js içine importScripts ile dahil edilir.

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let veri;
  try {
    veri = event.data.json();
  } catch {
    veri = { baslik: "Tilbe Kurban", govde: event.data.text() };
  }

  const baslik = veri.baslik || "Tilbe Kurban";
  const secenekler = {
    body: veri.govde || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-96.png",
    image: veri.gorsel,
    tag: veri.etiket || "tilbe-bildirim",
    data: {
      url: veri.url || "/",
      bildirimId: veri.bildirimId,
    },
    vibrate: [200, 100, 200],
    requireInteraction: veri.onemli === true,
    actions: veri.eylemler || [],
  };

  event.waitUntil(self.registration.showNotification(baslik, secenekler));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Açık tab varsa odakla
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      // Yoksa yeni tab aç
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
```

`next.config.ts`'de `workboxOptions.importScripts: ["/push-handler.js"]` ekle:

```ts
const withPWA = withPWAInit({
  // ... yukarıdaki
  workboxOptions: {
    importScripts: ["/push-handler.js"],
  },
});
```

---

## 📱 Adım 7 — RootLayout Meta Etiketler

`app/layout.tsx` `<head>`'ine ekle (Next.js Metadata API ile):

```tsx
export const metadata: Metadata = {
  title: "Tilbe Kurban Bayramı 2026",
  description: "Kurban Bayramı 2026 — Müşteri, kesim, tahsilat ve operasyon takibi",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tilbe Kurban",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-icon-120.png", sizes: "120x120" },
      { url: "/icons/apple-icon-152.png", sizes: "152x152" },
      { url: "/icons/apple-icon-167.png", sizes: "167x167" },
      { url: "/icons/apple-icon-180.png", sizes: "180x180" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#BD2C31",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};
```

---

## 🌐 Adım 8 — Akıllı Yönlendirme (`?pwa=1` handler)

Kullanıcı PWA'dan açtığında role göre yönlendir. **`middleware.ts`'ye ekleme:**

Mevcut middleware'in **başına** (auth kontrolünden ÖNCE) şunu ekle:

```ts
// PWA ilk açılış yönlendirmesi
if (request.nextUrl.searchParams.get("pwa") === "1" && request.nextUrl.pathname === "/") {
  // Cookie'den oturumu kontrol etmek için iron-session
  const oturum = await aktifOturum(request);

  let hedefUrl: string;
  if (!oturum) {
    // Anonim → müşteri ekranına
    hedefUrl = "/tv/m";
  } else if (oturum.rol === "personel" || oturum.rol === "kasiyer") {
    // Personel → personel paneline
    hedefUrl = "/tv/personel";
  } else {
    // Admin → dashboard (mevcut /)
    hedefUrl = "/";
  }

  if (hedefUrl !== "/") {
    return NextResponse.redirect(new URL(hedefUrl, request.url));
  }
}
```

**NOT:** `aktifOturum()` middleware'de kullanılırken iron-session'ın Edge runtime uyumluluğunu test et. Eğer çalışmazsa, `?pwa=1` parametresini layout'a kadar taşıyıp client-side yönlendirme yap.

---

## 🛠️ Adım 9 — `web-push` Server Helper

`shared/lib/web-push.ts` oluştur:

```ts
import webpush from "web-push";
import { db } from "@/shared/lib/db";
import { auditLog } from "@/shared/lib/audit";

// VAPID setup (modül seviyesinde, bir kere)
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:<EXAMPLE_EMAIL>";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

export interface PushPayload {
  baslik: string;
  govde: string;
  url?: string;
  etiket?: string;
  gorsel?: string;
  onemli?: boolean;
  bildirimId?: string;
  eylemler?: Array<{ action: string; title: string; icon?: string }>;
}

export async function pushGonder(
  abonelikId: string,
  payload: PushPayload,
  kullaniciId?: string
): Promise<{ basarili: boolean; hata?: string }> {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return { basarili: false, hata: "VAPID anahtarları yapılandırılmamış" };
  }

  const abonelik = await db.pushAbonelik.findUnique({ where: { id: abonelikId } });
  if (!abonelik) {
    return { basarili: false, hata: "Abonelik bulunamadı" };
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: abonelik.endpoint,
        keys: {
          p256dh: abonelik.p256dh,
          auth: abonelik.auth,
        },
      },
      JSON.stringify(payload)
    );

    // Log kaydet
    await db.bildirimLog.create({
      data: {
        abonelikId,
        kullaniciId,
        baslik: payload.baslik,
        govde: payload.govde,
        durum: "gonderildi",
      },
    });

    return { basarili: true };
  } catch (hata: any) {
    // 410 Gone → abonelik geçersiz, sil
    if (hata.statusCode === 410 || hata.statusCode === 404) {
      await db.pushAbonelik.delete({ where: { id: abonelikId } });
    }

    await db.bildirimLog.create({
      data: {
        abonelikId,
        kullaniciId,
        baslik: payload.baslik,
        govde: payload.govde,
        durum: "hata",
        hataMetni: hata.message || String(hata),
      },
    });

    return { basarili: false, hata: hata.message };
  }
}

export async function pushTopluGonder(
  abonelikIdleri: string[],
  payload: PushPayload,
  kullaniciId?: string
): Promise<{ basarili: number; hata: number }> {
  const sonuclar = await Promise.allSettled(
    abonelikIdleri.map((id) => pushGonder(id, payload, kullaniciId))
  );

  const basarili = sonuclar.filter((s) => s.status === "fulfilled" && s.value.basarili).length;
  const hata = sonuclar.length - basarili;

  return { basarili, hata };
}
```

---

## 🔌 Adım 10 — Mevcut Endpoint'leri Güncelle

### `app/api/tv/push-gonder/route.ts` (POST)

Mevcut endpoint payload'ı sadece DB'ye yazıyor (FAZ 9.5 — foreground polling). Şimdi `web-push` ile **gerçek arka plan push** ekle:

```ts
import { pushTopluGonder } from "@/shared/lib/web-push";
import { izinKontrol } from "@/shared/lib/izinler";
import { aktifOturum } from "@/shared/lib/oturum";
import { auditLog } from "@/shared/lib/audit";

export async function POST(req: Request) {
  const oturum = await aktifOturum();
  if (!oturum || !izinKontrol(oturum.rol, "tv.kontrol")) {
    return hataYaniti("YETKI_YOK", 403);
  }

  const body = await req.json();
  const { hedef, baslik, govde, url, onemli } = body;

  // Hedef abonelikleri belirle
  let abonelikIdleri: string[];
  if (hedef === "tum") {
    const abonelikler = await db.pushAbonelik.findMany({ select: { id: true } });
    abonelikIdleri = abonelikler.map((a) => a.id);
  } else if (Array.isArray(hedef)) {
    abonelikIdleri = hedef;
  } else {
    return hataYaniti("GECERSIZ_HEDEF", 400);
  }

  const sonuc = await pushTopluGonder(
    abonelikIdleri,
    { baslik, govde, url, onemli, etiket: "tilbe-push" },
    oturum.kullaniciId
  );

  await auditLog({
    eylem: "push-gonderildi",
    kullaniciId: oturum.kullaniciId,
    detaylar: { hedefSayisi: abonelikIdleri.length, basarili: sonuc.basarili, hata: sonuc.hata, baslik },
  });

  return basariliYanit(sonuc);
}
```

**KUTSAL:** Mevcut GET endpoint'i (foreground polling için kullanılıyor) bozma.

### `app/api/tv/push-abonelik/route.ts` (POST)

Bu endpoint zaten endpoint+keys alıyor olmalı (FAZ 9.5 commit'inde geçiyor). Eğer keys (p256dh, auth) alanları model'de eksikse Prisma migration ekle:

```prisma
model PushAbonelik {
  id          String   @id @default(cuid())
  musteriId   String?
  kullaniciId String?
  endpoint    String   @unique
  p256dh      String   // YENİ — eksikse ekle
  auth        String   // YENİ — eksikse ekle
  // ... mevcut alanlar
}
```

Migration: `pnpm prisma migrate dev --name push_keys_eklendi`

---

## 🎣 Adım 11 — usePushBildirim Hook Güncellemesi

FAZ 9.5'teki `modules/tv/hooks/usePushBildirim.ts` muhtemelen sadece browser Notification API kullanıyor. Şimdi `PushManager.subscribe()` ile gerçek SW subscription ekle:

```ts
// modules/tv/hooks/usePushBildirim.ts
import { useState, useEffect, useCallback } from "react";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Cleaned = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64Cleaned);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

export function usePushBildirim() {
  const [durum, setDurum] = useState<"hazir" | "izinli" | "reddedildi" | "destek-yok">("hazir");
  const [abonelikId, setAbonelikId] = useState<string | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setDurum("destek-yok");
      return;
    }
    if (Notification.permission === "granted") setDurum("izinli");
    else if (Notification.permission === "denied") setDurum("reddedildi");
  }, []);

  const izinIste = useCallback(async () => {
    const izin = await Notification.requestPermission();
    if (izin !== "granted") {
      setDurum(izin === "denied" ? "reddedildi" : "hazir");
      return false;
    }

    // Service Worker registration bekle
    const reg = await navigator.serviceWorker.ready;

    // VAPID public key
    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublic) {
      console.error("NEXT_PUBLIC_VAPID_PUBLIC_KEY yapılandırılmamış");
      return false;
    }

    // PushManager subscribe
    const abonelik = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublic),
    });

    // Server'a kaydet
    const json = abonelik.toJSON();
    const yanit = await fetch("/api/tv/push-abonelik", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
      }),
    });

    const veri = await yanit.json();
    if (veri.basarili && veri.veri?.id) {
      setAbonelikId(veri.veri.id);
      setDurum("izinli");
      return true;
    }
    return false;
  }, []);

  return { durum, abonelikId, izinIste };
}
```

---

## 💾 Adım 12 — Offline Fallback Sayfası

`app/offline/page.tsx`:

```tsx
export default function OfflineSayfasi() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
      <img src="/icons/icon-192.png" alt="Tilbe" className="w-24 h-24 mb-6" />
      <h1 className="text-2xl font-bold mb-2">İnternet Bağlantısı Yok</h1>
      <p className="text-slate-600 text-center max-w-md mb-6">
        Şu an çevrimdışısınız. İnternet bağlantısı geldiğinde otomatik olarak yenilenecek.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
      >
        Tekrar Dene
      </button>
    </div>
  );
}
```

`next.config.ts`'deki `runtimeCaching`'e fallback ekle:

```ts
fallbacks: {
  document: "/offline",
},
```

---

## 🎁 Adım 13 — Install Prompt Component

`shared/components/PWAYukleBildirimi.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAYukleBildirimi() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [gizli, setGizli] = useState(false);

  useEffect(() => {
    // 24 saat içinde reddetmişse gösterme
    const reddetmeZamani = localStorage.getItem("tilbe-pwa-red");
    if (reddetmeZamani && Date.now() - parseInt(reddetmeZamani) < 24 * 60 * 60 * 1000) {
      setGizli(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!event || gizli) return null;

  const yukle = async () => {
    await event.prompt();
    const sonuc = await event.userChoice;
    if (sonuc.outcome === "accepted") {
      // Audit log (opsiyonel — client-side fetch ile)
      fetch("/api/audit/pwa-yukleme", { method: "POST" }).catch(() => {});
    }
    setEvent(null);
  };

  const reddet = () => {
    localStorage.setItem("tilbe-pwa-red", String(Date.now()));
    setEvent(null);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-4 flex gap-3 items-start animate-slide-up">
      <img src="/icons/icon-192.png" alt="Tilbe" className="w-12 h-12 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">Tilbe Kurban Uygulaması</div>
        <div className="text-xs text-slate-600 mt-0.5">
          Telefonunuza yükleyin, internetsiz bile takip edin
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={yukle}
            className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            Yükle
          </button>
          <button
            onClick={reddet}
            className="px-3 py-1.5 text-slate-600 text-xs font-medium hover:bg-slate-100 rounded-lg"
          >
            Daha Sonra
          </button>
        </div>
      </div>
      <button onClick={reddet} className="text-slate-400 hover:text-slate-600">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
```

`app/layout.tsx`'e ekle (body içinde, AppShell'in DIŞINDA):

```tsx
<body>
  <PWAYukleBildirimi />
  {children}
</body>
```

---

## 🔐 Adım 14 — İzinler & Audit

`shared/lib/izinler.ts` — yeni eylem ekleme yok (mevcut `tv.kontrol` push gönderim için yeterli).

`shared/lib/audit.ts` — `AuditEylem` tipine ekle:
```ts
type AuditEylem =
  | "giris"
  | "cikis"
  // ... mevcut
  | "push-gonderildi"
  | "pwa-yukleme";
```

`/api/audit/pwa-yukleme/route.ts` basit endpoint (opsiyonel):
```ts
export async function POST(req: Request) {
  const oturum = await aktifOturum();
  await auditLog({
    eylem: "pwa-yukleme",
    kullaniciId: oturum?.kullaniciId,
    detaylar: { userAgent: req.headers.get("user-agent") },
  });
  return basariliYanit({ ok: true });
}
```

---

## ✅ Adım 15 — Test Listesi (PRE-COMMIT GATE)

Yazma fazından önce şunları raporla, onay bekle:

```
DOSYALAR
- Eklenecek: package.json (next-pwa + web-push), next.config.ts, public/manifest.json,
  public/push-handler.js, public/icons/* (18 dosya), app/offline/page.tsx,
  shared/components/PWAYukleBildirimi.tsx, shared/lib/web-push.ts,
  scripts/vapid-uret.ts, app/api/audit/pwa-yukleme/route.ts
- Güncellenecek: app/layout.tsx (metadata + import),
  app/api/tv/push-gonder/route.ts (web-push entegrasyon),
  modules/tv/hooks/usePushBildirim.ts (PushManager.subscribe),
  middleware.ts (?pwa=1 yönlendirme),
  shared/lib/audit.ts (yeni eylem),
  .env.example (VAPID şablonu),
  prisma/schema.prisma (eğer p256dh/auth eksikse)
- Silinecek: yok

PRISMA
- Migration adı: push_keys_eklendi (sadece eksikse)
- Mevcut PushAbonelik kayıtları sıfırlanır mı? Hayır — endpoint zaten unique, kolonlar nullable eklenir

KUTSAL TESTİ (commit'ten ÖNCE)
1. pnpm tsc --noEmit → temiz
2. pnpm build → temiz
3. Manuel: TKR-2026-NNN tahsilat oluştur+sil, audit'e düşmeli
4. /api/tahsilat/odeme network-only mu? (cache'lenmemeli)
5. /tv/m (auth yok) hâlâ public mi?
6. /, /musteriler, /hayvanlar, /tahsilat, /kasa, /raporlar, /ayarlar — hepsi HTTP 200

PWA TESTİ
1. Chrome DevTools > Application > Manifest → ikonlar görünüyor, manifest hatasız
2. Application > Service Workers → sw.js registered, push event listening
3. Lighthouse PWA score → 90+ hedef
4. Mobil tarayıcıda "Ana ekrana ekle" pop-up çıkıyor mu?
5. Push gönder testi: /api/tv/push-gonder POST → web-push ile gerçek bildirim geliyor mu?
6. Sayfayı kapat, push gönder → arka planda bildirim gelmeli (KRİTİK)
7. Bildirime tıkla → uygulama açılıyor, doğru URL'e gidiyor mu?
8. Offline mod: WiFi kapat, sayfa yenile → /offline gösteriliyor mu?

RAPOR FORMATI
- Hangi dosyalar oluşturuldu/güncellendi (satır sayısı)
- Migration adı (eğer çalıştıysa)
- TSC + build çıktısı (özet)
- KUTSAL test sonucu
- PWA test sonuçları (8 madde)
- Lighthouse PWA skoru
- Atlanan/ileri tarihe bırakılan şeyler (gerekçe ile)
```

---

## 📝 Commit Mesajı (Sondaki)

```
feat(pwa): faz 9.6 - PWA + arka plan push (manifest + SW + web-push + VAPID)

FAZ 9.5'te eklenen push altyapisi (PushAbonelik, BildirimLog, hooks)
uzerine eksik kalan PWA katmani tamamlandi. Artik sayfa kapaliyken
bile bildirim gelir, ana ekrana ikon eklenir, offline calisir.

Paketler:
- next-pwa@5.6.0 (Workbox tabanli SW + manifest)
- web-push@3.6.7 (VAPID + payload encryption)

Manifest (public/manifest.json):
- Tilbe Kurban Bayrami 2026 markasi
- 8 standart ikon (72-512px) + 2 maskable + 4 Apple touch
- Tema rengi: #BD2C31 (logo kirmizisi)
- 3 shortcut: Tahsilat / TV Ekrani / Musteri Takip
- start_url: /?pwa=1 (role gore yonlendirme)

Service Worker (public/push-handler.js + next-pwa otomatik sw.js):
- push event: payload'i parse edip showNotification
- notificationclick: acik tab varsa odakla, yoksa yeni tab ac
- Workbox runtime cache: NetworkFirst (5sn timeout) + image CacheFirst
- KUTSAL: /api/tahsilat /api/tv/push-* /api/auth NetworkOnly

VAPID + web-push (shared/lib/web-push.ts):
- generateVAPIDKeys() ile .env'e yazilan keys
- pushGonder(): tek abonelige push, 410 Gone -> abonelik sil
- pushTopluGonder(): Promise.allSettled ile paralel
- BildirimLog'a durum (gonderildi/hata) + hata metni

Endpoint guncellemeleri:
- POST /api/tv/push-gonder: foreground polling + arka plan SW push (ikisi de)
  + audit log: push-gonderildi (hedefSayisi/basarili/hata/baslik)
- /api/tv/push-abonelik: p256dh + auth alanlari kaydedilir
- POST /api/audit/pwa-yukleme: opsiyonel telemetri

Hook (modules/tv/hooks/usePushBildirim.ts):
- PushManager.subscribe() ile gercek SW abonelik (FAZ 9.5'teki
  Notification API'yi degistirmiyor, genisletiyor)
- VAPID public key urlBase64ToUint8Array ile decode
- Abonelik ID DB'ye yazilir, hook state'te tutulur

UI:
- shared/components/PWAYukleBildirimi.tsx: beforeinstallprompt
  yakala + akilli zamanlama (24sa cooldown localStorage'ta)
- app/offline/page.tsx: agsiz fallback
- app/layout.tsx: Metadata API + viewport.themeColor + apple meta

Middleware:
- /?pwa=1 + oturum kontrolu: role gore yonlendirme
  * anonim -> /tv/m (musteri ekrani)
  * personel/kasiyer -> /tv/personel
  * admin -> / (mevcut dashboard)

DB (prisma migrate add: push_keys_eklendi):
- PushAbonelik.p256dh, auth alanlari (eksikse eklendi)

KUTSAL korundu:
- Tahsilat akisi bozulmadi (TKR-2026-NNN testi gecti)
- FAZ 9.5 endpoint'leri kirilmadi, sadece genisletildi
- Mevcut auth + iron-session degismedi
- Tum sayfalar 200

Test:
- pnpm tsc --noEmit temiz
- pnpm build temiz
- Lighthouse PWA: 9X
- Manifest valid (DevTools Application tab)
- SW registered + push event listening
- Arka plan push testi: sayfa kapaliyken bildirim geldi
- /offline gosterimi: WiFi kapaliyken dogru
- Notification click: dogru URL'e yonlendirdi
```
