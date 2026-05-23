import type { ModuleConfig } from "@/shared/types/module.types";

export const coreModule: ModuleConfig = {
  id: "_core",
  ad: "Çekirdek",
  aciklama: "Auth, ayarlar, yedekleme — her zaman aktif",
  versiyon: "1.0.0",
  aktif: true,
  sira: 0,
  ikon: "Shield",
  anaRota: "/",
  izinler: ["admin", "kasiyer"],
  sidebarGoster: false,
  sayfalar: [],
};

export default coreModule;
