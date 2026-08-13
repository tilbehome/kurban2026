import type { NextConfig } from "next";
// @ts-expect-error — next-pwa CommonJS modülü, .d.ts'i Next.js 16 ile tam uyumlu değil
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  // Dev'de SW'yi devre dışı bırak (Turbopack ile çakışmasın)
  disable: process.env.NODE_ENV === "development",
  // Custom push handler dahil et
  importScripts: ["/push-handler.js"],
  // Hassas veya oturum bağlı veri cache'e girmez. API cache politikası
  // deny-by-default'tur; yalnız PII içermediği ayrıca doğrulanan public akış
  // açıkça READ_CACHE listesine alınabilir.
  runtimeCaching: [
    {
      urlPattern: /\/api\/.*/,
      handler: "NetworkOnly",
      method: "POST",
    },
    {
      urlPattern: /\/api\/public\/operations-tv(?:\?.*)?$/,
      handler: "NetworkFirst",
      method: "GET",
      options: {
        cacheName: "tilbecore-public-tv-read-cache-v1",
        networkTimeoutSeconds: 3,
        expiration: { maxEntries: 10, maxAgeSeconds: 30 },
      },
    },
    {
      urlPattern: /\/api\/.*/,
      handler: "NetworkOnly",
      method: "GET",
    },
    // Resimler — CacheFirst
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "tilbe-images",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        },
      },
    },
  ],
  buildExcludes: [
    /middleware-manifest\.json$/,
    /packages[\\/]database-platform[\\/]generated[\\/]/,
    /packages[\\/]database-tenant[\\/]generated[\\/]/,
    /packages[\\/][^\\/]+[\\/]node_modules[\\/]/,
  ],
});

const nextConfig: NextConfig = {
  output: "standalone",
  // next-pwa Webpack tabanlı plugin → Next 16 Turbopack varsayılan ile
  // çakışıyor. Dev'de PWA disable (zaten yukarıda) + bu boş Turbopack
  // config ile uyarı susturulur. Build için --webpack flag kullanılır.
  turbopack: {},
  // Next.js 16+ : dev sunucusu LAN IP'lerinden gelen istekleri "cross-origin"
  // sayar ve uyarı verir. Bayram operasyonunda Burhan farklı cihazlardan
  // erişecek (TV, tablet, telefon) → tüm yerel ağ aralıklarını izinli yap.
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.0.0/16",
    "192.168.1.89",
    "10.0.0.0/8",
    "172.16.0.0/12",
    "*.local",
  ],
};

export default withPWA(nextConfig);
