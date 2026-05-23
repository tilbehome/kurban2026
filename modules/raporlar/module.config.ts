import type { ModuleConfig } from "@/shared/types/module.types";

export const raporlarModule: ModuleConfig = {
  id: "raporlar",
  ad: "Raporlar",
  aciklama: "Borçlular, tahsilat, kurban ve kullanıcı raporları",
  versiyon: "1.0.0",
  aktif: true,
  sira: 40,
  ikon: "FileBarChart",
  anaRota: "/raporlar",
  izinler: ["admin", "kasiyer"],
  bagimliliklar: ["tahsilat", "hayvanlar"],
  sayfalar: [{ yol: "/raporlar", ad: "Raporlar" }],
};

export default raporlarModule;
