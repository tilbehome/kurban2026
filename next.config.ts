import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16+ : dev sunucusu LAN IP'lerinden gelen istekleri "cross-origin"
  // sayar ve uyarı verir. Bayram operasyonunda Burhan farklı cihazlardan
  // erişecek (TV, tablet, telefon) → tüm yerel ağ aralıklarını izinli yap.
  //
  // 192.168.x.x  — ev/ofis WiFi (en yaygın)
  // 10.x.x.x     — büyük LAN
  // 172.16-31.x  — daha az kullanılan özel aralık
  // *.local      — mDNS / Bonjour
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

export default nextConfig;
