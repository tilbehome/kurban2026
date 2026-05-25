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
  // Offline fallback: /offline sayfası Workbox precache'inde otomatik;
  // next-pwa "fallbacks" config'i babel-loader gerektirdiği için manuel.
  // Workbox cache strategy
  runtimeCaching: [
    // KUTSAL — tahsilat, auth, push gönderim asla cache'lenmez
    {
      urlPattern:
        /\/api\/(tahsilat|auth|tv\/push-gonder|tv\/push-abonelik|tv\/kurban-asama|tv\/kesim-durum|tv\/ilerleme|tv\/sira-degistir|tv\/acil-durum)/,
      handler: "NetworkOnly",
      method: "POST",
    },
    {
      urlPattern:
        /\/api\/(tahsilat|auth|tv\/push-gonder|tv\/push-abonelik|tv\/kurban-asama|tv\/kesim-durum|tv\/ilerleme|tv\/sira-degistir|tv\/acil-durum)/,
      handler: "NetworkOnly",
      method: "GET",
    },
    // Diğer API'ler — NetworkFirst (5sn timeout)
    {
      urlPattern: /\/api\/.*/,
      handler: "NetworkFirst",
      method: "GET",
      options: {
        cacheName: "tilbe-api",
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 5 * 60,
        },
      },
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
    // Diğer her şey — NetworkFirst
    {
      urlPattern: /^https?.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "tilbe-runtime",
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
  ],
  buildExcludes: [/middleware-manifest\.json$/],
});

const nextConfig: NextConfig = {
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
