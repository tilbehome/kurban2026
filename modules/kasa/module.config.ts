import type { ModuleConfig } from "@/shared/types/module.types";
import { KURBAN_AUTHORIZATION_MANIFEST } from "@tilbecore/tenant-core";

export const kasaModule: ModuleConfig = {
  authorizationManifest: KURBAN_AUTHORIZATION_MANIFEST,
  id: "kasa",
  ad: "Kasa",
  aciklama: "Günlük kasa raporu ve hareketler",
  versiyon: "1.0.0",
  aktif: true,
  sira: 30,
  ikon: "Calculator",
  anaRota: "/kasa",
  izinler: ["admin", "kasiyer"],
  bagimliliklar: ["tahsilat"],
  sayfalar: [{ yol: "/kasa", ad: "Kasa" }],
  olaylar: {
    dinle: ["odeme:tamamlandi", "odeme:iptal"],
  },
};

export default kasaModule;
