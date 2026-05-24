/**
 * Müşteriler modülü — public API (MIMARI.md §4.4).
 *
 * Başka modüller SADECE bu dosyayı import etmeli, içerikleri DİREKT okumamalı.
 */

// Tipler
export type {
  MusteriOzet,
  ListeFiltreleri,
  ListeSonucu,
} from "./lib/musteri.service";
export type { MusteriIstatistik } from "./lib/istatistik";
export type { AvatarRenk } from "./lib/avatar";

// API helper'ları
export {
  musterileriListele,
  musteriDetayi,
  ayniIsimSayisi,
} from "./lib/musteri.service";
export { musteriIstatistik } from "./lib/istatistik";

// Helper'lar
export { avatarRenk, ilkHarfler, alfabeHarfi } from "./lib/avatar";

// Paylaşılabilir bileşenler
export { MusteriAvatar } from "./components/MusteriAvatar";
export { MusteriRozetler } from "./components/MusteriRozetler";
export type { MusteriRozetVerisi } from "./components/MusteriRozetler";

// Modül config
export { default as musterilerModule } from "./module.config";
