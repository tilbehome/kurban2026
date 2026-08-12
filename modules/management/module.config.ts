import type { ModuleConfig } from "@/shared/types/module.types";
import { MANAGEMENT_AUTHORIZATION_MANIFEST } from "@tilbecore/tenant-core";

export const managementModule: ModuleConfig = {
  id: "management",
  ad: "Yönetim",
  aciklama: "Kurumsal komuta merkezi, raporlama, analitik, arama ve istisna yönetimi",
  versiyon: "1.0.0",
  aktif: true,
  sira: 5,
  ikon: "LayoutDashboard",
  anaRota: "/yonetim",
  izinler: ["admin", "kasiyer", "izleyici"],
  bagimliliklar: ["tahsilat", "operations", "kasa"],
  sayfalar: [{ yol: "/yonetim", ad: "Yönetim ve Analitik" }],
  authorizationManifest: MANAGEMENT_AUTHORIZATION_MANIFEST,
  olaylar: {
    yayinla: ["management.dashboard.view.saved", "management.report.requested", "management.exception.opened"],
    dinle: ["sale.confirmed", "receipt.recorded", "slaughter.job.advanced", "delivery.recorded", "approval.requested"],
  },
  sozlesme: {
    yuzeyler: ["desktop", "tablet", "mobile"],
    featureFlagler: ["faz11_management_analytics"],
    entitlementlar: ["management_analytics"],
    auditOlaylari: ["management.dashboard.view.saved", "management.report.export.requested", "management.search.performed"],
    domainOlaylari: ["management.exception.detected", "management.approval.pending", "management.widget.refreshed"],
    raporKatkilari: ["sales-occupancy", "operations-bottleneck", "delivery-cold-storage", "audit-exceptions"],
    dashboardKatkilari: ["sales-summary", "finance-summary", "operation-bottleneck", "approval-inbox", "cold-storage"],
    offlineSinifi: "read_only",
    migrationBilgisi: "SavedDashboardView ve Faz 7–10 operasyon query sözleşmeleri.",
    veriSaklamaBilgisi: "Rapor ve dashboard sonuçları tenant verisinden okunur; export sözleşmesi permission ve tenant scope ister.",
    runtimeKurali: {
      featureFlag: "faz11_management_analytics",
      entitlement: "management_analytics",
    },
    ayarSemasi: {
      searchProviders: ["customer", "animal", "package"],
      reportProviders: ["sales-occupancy", "operations-bottleneck", "delivery-cold-storage", "audit-exceptions"],
      exceptionSources: ["approval", "slaughter", "delivery", "finance", "proxy"],
      exportFormats: ["csv", "xlsx", "pdf"],
      exportRoutes: ["/api/tenant/management-analytics/export"],
      reportBuilder: { chartTypes: ["bar", "line", "table"], maxRows: 500 },
      syntheticDemo: { route: "/api/tenant/demo-data", mode: "dry-run-only", productionWriteBlocked: true },
      deviceSimulators: ["scale", "label_printer", "qr_reader"],
    },
  },
};

export default managementModule;
