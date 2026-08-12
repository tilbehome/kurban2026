import { BESI_AUTHORIZATION_MANIFEST } from "@tilbecore/tenant-core";
import type { ModuleConfig } from "@/shared/types/module.types";

/** Besi ekranları etkinleşmeden önce de tenant yetki şablonunun kaydedilebilmesini sağlar. */
export const besiModule: ModuleConfig = {
  id: "besi",
  ad: "Besi",
  aciklama: "Besi operasyonları yetki sözleşmesi",
  versiyon: "1.0.0",
  aktif: false,
  sira: 70,
  ikon: "Beef",
  anaRota: "/besi",
  izinler: [],
  sayfalar: [],
  sidebarGoster: false,
  authorizationManifest: BESI_AUTHORIZATION_MANIFEST,
};
