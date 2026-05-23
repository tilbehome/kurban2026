import type { ModuleConfig } from "@/shared/types/module.types";

export const kasaModule: ModuleConfig = {
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
