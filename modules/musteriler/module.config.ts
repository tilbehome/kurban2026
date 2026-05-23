import type { ModuleConfig } from "@/shared/types/module.types";

export const musterilerModule: ModuleConfig = {
  id: "musteriler",
  ad: "Müşteriler",
  aciklama: "Müşteri yönetimi ve arama",
  versiyon: "1.0.0",
  aktif: true,
  sira: 10,
  ikon: "Users",
  anaRota: "/musteriler",
  izinler: ["admin", "kasiyer"],
  sayfalar: [
    { yol: "/musteriler", ad: "Müşteri Listesi" },
    { yol: "/musteriler/yeni", ad: "Yeni Müşteri", sidebarGoster: false },
    { yol: "/musteriler/[id]", ad: "Müşteri Detay", sidebarGoster: false },
  ],
  olaylar: {
    yayinla: ["musteri:olusturuldu", "musteri:guncellendi", "musteri:silindi"],
  },
};

export default musterilerModule;
