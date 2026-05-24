/**
 * YENİ MODÜL ŞABLONU — MIMARI.md §4.7
 *
 * Yeni modül oluştururken:
 *  1. cp -r modules/_example modules/yeni-modul
 *  2. Bu dosyada: id, ad, aciklama, ikon, renk, anaRota, sayfalar düzenle
 *  3. index.ts'i de güncelle (public API)
 *  4. shared/lib/module-loader.ts'a import + tumModuller dizisine ekle
 *  5. shared/lib/sidebar-config.ts'a 12 ana menü içine girişi ekle (akordiyon)
 *  6. (DB modeli gerekirse) prisma/schema.prisma'ya model ekle:
 *     pnpm prisma migrate dev --name yeni-modul-tablosu
 *  7. app/<yol>/page.tsx — gerçek sayfa dosyalarını oluştur
 *  8. modules/yeni-modul/api/, lib/, components/ klasörlerini doldur
 *
 * 30 dakikada yeni modül hazır.
 */

import type { ModuleConfig } from "@/shared/types/module.types";
import { log } from "@/shared/lib/log";

const exampleModule: ModuleConfig = {
  // Kimlik
  id: "_example",
  ad: "Örnek Modül",
  aciklama: "Yeni modül oluşturmak için şablon — kopyala, düzenle, ekle",
  versiyon: "1.0.0",

  // Durum
  aktif: false, // Şablon — varsayılan kapalı
  sira: 999, // En sona

  // Görünüm
  ikon: "Sparkles", // lucide-react adı
  renk: "#ea580c", // Tilbe Orange (opsiyonel)

  // Rotalar
  anaRota: "/example",
  sayfalar: [
    { yol: "/example", ad: "Örnek Sayfa" },
    // { yol: "/example/yeni", ad: "Yeni Kayıt", sidebarGoster: false },
  ],

  // Yetkilendirme — MIMARI §10
  izinler: ["admin"], // sadece admin görür

  // Modüller arası bağımlılık (silinince ne kırılır?)
  bagimliliklar: ["_core"],

  // Pub/sub olayları — MIMARI §9
  olaylar: {
    yayinla: ["_example:tetiklendi"],
    dinle: ["odeme:tamamlandi"],
  },

  // Lifecycle hook'ları (opsiyonel) — MIMARI §4.3
  onYukle: async () => {
    log.bilgi("[_example] modül yüklendi");
  },
  onKapat: async () => {
    log.bilgi("[_example] modül kapatıldı");
  },
};

export default exampleModule;
