import type { ModuleConfig } from "@/shared/types/module.types";
import { KURBAN_AUTHORIZATION_MANIFEST } from "@tilbecore/tenant-core";

export const tahsilatModule: ModuleConfig = {
  authorizationManifest: KURBAN_AUTHORIZATION_MANIFEST,
  id: "tahsilat",
  ad: "Tahsilat",
  aciklama: "Müşteri ödemeleri ve dekont yönetimi",
  versiyon: "1.0.0",
  aktif: true,
  sira: 20,
  ikon: "Wallet",
  anaRota: "/tahsilat",
  izinler: ["admin", "kasiyer"],
  bagimliliklar: ["musteriler", "hayvanlar"],
  sayfalar: [
    { yol: "/tahsilat", ad: "Tahsilat" },
    { yol: "/tahsilat/musteri/[id]", ad: "Tahsilat — Müşteri", sidebarGoster: false },
  ],
  olaylar: {
    yayinla: ["odeme:tamamlandi", "odeme:iptal"],
    dinle: ["musteri:silindi"],
  },
};

export default tahsilatModule;
