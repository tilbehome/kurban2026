import type { ModuleConfig } from "@/shared/types/module.types";

export const tahsilatModule: ModuleConfig = {
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
