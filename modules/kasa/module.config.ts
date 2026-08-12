import type { ModuleConfig } from "@/shared/types/module.types";
import { KURBAN_AUTHORIZATION_MANIFEST } from "@tilbecore/tenant-core";

export const kasaModule: ModuleConfig = {
  authorizationManifest: KURBAN_AUTHORIZATION_MANIFEST,
  id: "kasa",
  ad: "Kasa",
  aciklama: "Günlük kasa, mutabakat ve ledger hareketleri",
  versiyon: "1.1.0",
  aktif: true,
  sira: 30,
  ikon: "Calculator",
  anaRota: "/kasa",
  izinler: ["admin", "kasiyer"],
  bagimliliklar: ["tahsilat"],
  sayfalar: [
    { yol: "/kasa", ad: "Kasa" },
    { yol: "/tahsilat/calisma-alani", ad: "Kasa ve Mutabakat Çalışma Alanı" },
  ],
  olaylar: {
    dinle: ["odeme:tamamlandi", "odeme:iptal", "receipt:recorded", "journal:posted"],
    yayinla: ["cash:opened", "cash:closed", "reconciliation:exception"],
  },
  sozlesme: {
    yuzeyler: ["desktop", "tablet", "mobile"],
    featureFlagler: ["faz5_6_sales_finance"],
    entitlementlar: ["kurban_sales_finance"],
    auditOlaylari: [
      "kurban.cash_open_requested",
      "kurban.cash_close_requested",
      "kurban.cash_count_difference",
      "kurban.reconciliation_exception",
      "kurban.reversal_requested",
    ],
    domainOlaylari: ["cash.session.changed", "reconciliation.exception", "journal.reversal.requested"],
    raporKatkilari: ["cash-closing", "bank-pos-reconciliation", "ledger-exceptions"],
    offlineSinifi: "conflict_aware",
    migrationBilgisi: "0006_share_sales_finance_ledger",
    veriSaklamaBilgisi: "Kasa ve ledger düzeltmeleri ters kayıt/onay izi ile tutulur; fiziksel silme yoktur.",
    runtimeKurali: {
      featureFlag: "faz5_6_sales_finance",
      entitlement: "kurban_sales_finance",
    },
  },
};

export default kasaModule;
