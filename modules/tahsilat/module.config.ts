import type { ModuleConfig } from "@/shared/types/module.types";
import { KURBAN_AUTHORIZATION_MANIFEST } from "@tilbecore/tenant-core";

export const tahsilatModule: ModuleConfig = {
  authorizationManifest: KURBAN_AUTHORIZATION_MANIFEST,
  id: "tahsilat",
  ad: "Tahsilat",
  aciklama: "Müşteri ödemeleri, satış, rezervasyon ve dekont yönetimi",
  versiyon: "1.1.0",
  aktif: true,
  sira: 20,
  ikon: "Wallet",
  anaRota: "/tahsilat",
  izinler: ["admin", "kasiyer"],
  bagimliliklar: ["musteriler", "hayvanlar"],
  sayfalar: [
    { yol: "/tahsilat", ad: "Tahsilat" },
    { yol: "/tahsilat/calisma-alani", ad: "Satış Finans Çalışma Alanı" },
    { yol: "/tahsilat/musteri/[id]", ad: "Tahsilat — Müşteri", sidebarGoster: false },
  ],
  olaylar: {
    yayinla: ["odeme:tamamlandi", "odeme:iptal", "sale:confirmed", "reservation:expired"],
    dinle: ["musteri:silindi", "approval:decided"],
  },
  sozlesme: {
    yuzeyler: ["desktop", "tablet", "mobile"],
    featureFlagler: ["faz5_6_sales_finance"],
    entitlementlar: ["kurban_sales_finance"],
    auditOlaylari: [
      "kurban.share_reserved",
      "kurban.sale_confirmed",
      "kurban.receipt_recorded",
      "kurban.sale_cancel_requested",
      "kurban.share_transferred",
    ],
    domainOlaylari: [
      "reservation.expired",
      "sale.confirmed",
      "receipt.recorded",
      "journal.posted",
      "approval.requested",
    ],
    dashboardKatkilari: ["reservation-aging", "mixed-payment-total", "approval-exception-queue"],
    offlineSinifi: "queued_write",
    migrationBilgisi: "0006_share_sales_finance_ledger",
    veriSaklamaBilgisi: "Finansal kayıtlar fiziksel silinmez; iade/iptal/mahsup ters kayıtla izlenir.",
    runtimeKurali: {
      featureFlag: "faz5_6_sales_finance",
      entitlement: "kurban_sales_finance",
    },
  },
};

export default tahsilatModule;
