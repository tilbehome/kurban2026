import type { ModuleConfig } from "@/shared/types/module.types";
import {
  DEVICES_AUTHORIZATION_MANIFEST,
  FIELD_AUTHORIZATION_MANIFEST,
  INVENTORY_AUTHORIZATION_MANIFEST,
  LOGISTICS_AUTHORIZATION_MANIFEST,
  OPERATIONS_AUTHORIZATION_MANIFEST,
  PUBLIC_AUTHORIZATION_MANIFEST,
  QURBAN_OPERATIONS_AUTHORIZATION_MANIFEST,
} from "@tilbecore/tenant-core";

export const operationsModule: ModuleConfig = {
  id: "operations",
  ad: "Operasyon",
  aciklama: "Vekâlet, QR, kesim, tartım, paketleme, soğuk oda, teslimat, PWA ve TV operasyonları",
  versiyon: "1.0.0",
  aktif: true,
  sira: 25,
  ikon: "Scissors",
  anaRota: "/operasyon",
  izinler: ["admin", "kasiyer", "izleyici"],
  bagimliliklar: ["tahsilat", "hayvanlar"],
  sayfalar: [{ yol: "/operasyon", ad: "Kurban Operasyon Merkezi" }, { yol: "/saha", ad: "Saha PWA" }],
  authorizationManifest: OPERATIONS_AUTHORIZATION_MANIFEST,
  olaylar: {
    yayinla: ["proxy.document.created", "qr.token.issued", "slaughter.job.advanced", "weighing.recorded", "package.created", "delivery.recorded"],
    dinle: ["sale.confirmed", "approval.decided", "reservation.expired"],
  },
  sozlesme: {
    yuzeyler: ["desktop", "tablet", "mobile"],
    featureFlagler: ["faz7_10_operations"],
    entitlementlar: ["kurban_operations"],
    auditOlaylari: [
      "proxy.document.created",
      "qr.token.consumed",
      "slaughter.job.advanced",
      "weighing.recorded",
      "package.created",
      "delivery.reversed",
    ],
    domainOlaylari: [
      "qurban.proxy.updated",
      "qurban.qr.used",
      "qurban.slaughter.transitioned",
      "operations.weighing.appended",
      "operations.packaging.labeled",
      "logistics.delivery.completed",
    ],
    raporKatkilari: ["slaughter-bottleneck", "package-traceability", "delivery-exceptions"],
    offlineSinifi: "conflict_aware",
    migrationBilgisi: "Tenant schema operation-flow modelleri: ProxyDocument, QrToken, SlaughterJob, WeighingRecord, PackageRecord, DeliveryRecord.",
    veriSaklamaBilgisi: "Kritik operasyonlar fiziksel silinmez; iptal/geri alma bağlı olay ve audit/outbox ile yapılır.",
    runtimeKurali: {
      featureFlag: "faz7_10_operations",
      entitlement: "kurban_operations",
    },
    ayarSemasi: {
      manifests: [
        QURBAN_OPERATIONS_AUTHORIZATION_MANIFEST.moduleId,
        OPERATIONS_AUTHORIZATION_MANIFEST.moduleId,
        INVENTORY_AUTHORIZATION_MANIFEST.moduleId,
        LOGISTICS_AUTHORIZATION_MANIFEST.moduleId,
        FIELD_AUTHORIZATION_MANIFEST.moduleId,
        PUBLIC_AUTHORIZATION_MANIFEST.moduleId,
        DEVICES_AUTHORIZATION_MANIFEST.moduleId,
      ],
      offlineClasses: { tv: "read_only", fieldNotes: "queued_write", slaughter: "none", delivery: "none", finance: "none" },
    },
  },
};

export default operationsModule;
