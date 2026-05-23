import type { ModuleConfig } from "@/shared/types/module.types";

export const hayvanlarModule: ModuleConfig = {
  id: "hayvanlar",
  ad: "Hayvanlar",
  aciklama: "Kurban ve hisse yönetimi",
  versiyon: "1.0.0",
  aktif: true,
  sira: 15,
  ikon: "Beef",
  anaRota: "/hayvanlar",
  izinler: ["admin", "kasiyer"],
  bagimliliklar: ["musteriler"],
  sayfalar: [
    { yol: "/hayvanlar", ad: "Hayvan Listesi" },
    { yol: "/hayvanlar/[id]", ad: "Hayvan Detay", sidebarGoster: false },
  ],
  olaylar: {
    yayinla: ["hisse:atandi", "hisse:silindi", "kurban:guncellendi"],
  },
};

export default hayvanlarModule;
