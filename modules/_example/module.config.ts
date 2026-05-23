/**
 * YENİ MODÜL ŞABLONU
 *
 * Yeni modül eklemek için:
 *  1. Bu klasörü kopyala: cp -r modules/_example modules/yeni-modul
 *  2. id, ad, ikon, sayfalar alanlarını düzenle
 *  3. shared/lib/module-loader.ts'ye import ekle
 *  4. (Opsiyonel) prisma/schema.prisma'ya yeni model ekle, migrate çek
 *  5. Karşılık gelen app/<yol>/page.tsx dosyalarını oluştur
 *
 * 30 dakikada yeni modül hazır.
 */

import type { ModuleConfig } from "@/shared/types/module.types";

const exampleModule: ModuleConfig = {
  id: "_example",
  ad: "Örnek Modül",
  aciklama: "Yeni modül oluşturmak için şablon — kopyala, düzenle, ekle",
  versiyon: "1.0.0",
  aktif: false, // Şablon — varsayılan kapalı
  sira: 999,
  ikon: "Sparkles",
  anaRota: "/example",
  izinler: ["admin"],
  sayfalar: [{ yol: "/example", ad: "Örnek Sayfa" }],
};

export default exampleModule;
