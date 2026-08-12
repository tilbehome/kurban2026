import type { PermissionKey } from "./authorization-domain";
import type { ModuleAuthorizationManifest } from "./authorization-service";

const allow = (key: PermissionKey) => ({ key, effect: "ALLOW" as const });

const role = (
  templateKey: string,
  name: string,
  functionalArea: string,
  accessLevel: "MANAGER" | "SUPERVISOR" | "AUTHORIZED_OPERATOR" | "OPERATOR" | "VIEWER",
  permissions: PermissionKey[],
) => ({ templateKey, name, functionalArea, accessLevel, permissions: permissions.map((key) => allow(key)) });

export const QURBAN_OPERATIONS_AUTHORIZATION_MANIFEST: ModuleAuthorizationManifest = {
  moduleId: "qurban",
  version: "1.1.0",
  displayName: "Kurban Vekâlet, Belge, QR ve Kesim",
  permissions: [
    { key: "qurban.proxy.manage.operational_period" as PermissionKey, description: "Hisse bazlı vekâlet belgelerini yönetir", riskLevel: "critical" },
    { key: "qurban.proxy.read.operational_period" as PermissionKey, description: "Vekâlet durumunu görüntüler", riskLevel: "sensitive" },
    { key: "qurban.document.manage.operational_period" as PermissionKey, description: "Kesim/teslim belge sürümü, iptal ve yeniden üretimini yönetir", riskLevel: "critical" },
    { key: "qurban.qr.issue.operational_period" as PermissionKey, description: "Amaç sınırlı, tahmin edilemez, süreli QR üretir", riskLevel: "critical" },
    { key: "qurban.qr.consume.operational_period" as PermissionKey, description: "Tek kullanımlık QR tüketir", riskLevel: "critical" },
    { key: "qurban.slaughter.manage.operational_period" as PermissionKey, description: "Kesim operasyon motorunu ve sırasını yönetir", riskLevel: "critical" },
  ],
  defaultRoleTemplates: [
    role("proxy-document-operator", "Vekâlet ve Belge Operatörü", "proxy_document", "AUTHORIZED_OPERATOR", [
      "qurban.proxy.manage.operational_period",
      "qurban.proxy.read.operational_period",
      "qurban.document.manage.operational_period",
      "qurban.qr.issue.operational_period",
    ] as PermissionKey[]),
    role("slaughter-command-manager", "Kesim Komuta Yöneticisi", "slaughter_command", "MANAGER", [
      "qurban.proxy.read.operational_period",
      "qurban.qr.consume.operational_period",
      "qurban.slaughter.manage.operational_period",
    ] as PermissionKey[]),
  ],
};

export const OPERATIONS_AUTHORIZATION_MANIFEST: ModuleAuthorizationManifest = {
  moduleId: "operations",
  version: "1.0.0",
  displayName: "Tartım ve Paketleme Operasyonları",
  permissions: [
    { key: "operations.weighing.record.assigned_record" as PermissionKey, description: "Hayvan ve hisse bazlı append-only tartım kaydeder", riskLevel: "critical" },
    { key: "operations.packaging.manage.assigned_record" as PermissionKey, description: "Paketleme, etiket ve yeniden baskı akışını yönetir", riskLevel: "critical" },
  ],
  defaultRoleTemplates: [
    role("weighing-operator", "Tartım Operatörü", "weighing_station", "OPERATOR", ["operations.weighing.record.assigned_record" as PermissionKey]),
    role("packaging-supervisor", "Paketleme Sorumlusu", "packaging_station", "SUPERVISOR", ["operations.packaging.manage.assigned_record" as PermissionKey]),
  ],
};

export const INVENTORY_AUTHORIZATION_MANIFEST: ModuleAuthorizationManifest = {
  moduleId: "inventory",
  version: "1.0.0",
  displayName: "Soğuk Oda ve Stok",
  permissions: [
    { key: "inventory.cold_storage.manage.facility" as PermissionKey, description: "Soğuk oda, bölüm, raf ve konum yönetir", riskLevel: "sensitive" },
  ],
  defaultRoleTemplates: [
    role("cold-storage-operator", "Soğuk Oda Operatörü", "cold_storage", "OPERATOR", ["inventory.cold_storage.manage.facility" as PermissionKey]),
  ],
};

export const LOGISTICS_AUTHORIZATION_MANIFEST: ModuleAuthorizationManifest = {
  moduleId: "logistics",
  version: "1.0.0",
  displayName: "Teslimat Lojistiği",
  permissions: [
    { key: "logistics.delivery.manage.operational_period" as PermissionKey, description: "Teslimat, yükleme, geri alma ve kanıt akışını yönetir", riskLevel: "critical" },
  ],
  defaultRoleTemplates: [
    role("delivery-operator", "Teslimat Operatörü", "delivery", "AUTHORIZED_OPERATOR", ["logistics.delivery.manage.operational_period" as PermissionKey]),
  ],
};

export const FIELD_AUTHORIZATION_MANIFEST: ModuleAuthorizationManifest = {
  moduleId: "field",
  version: "1.0.0",
  displayName: "Saha PWA",
  permissions: [
    { key: "field.pwa.sync.assigned_record" as PermissionKey, description: "Güvenli offline kuyruk ve saha senkronizasyonu kullanır", riskLevel: "sensitive" },
  ],
  defaultRoleTemplates: [
    role("field-operator", "Saha PWA Operatörü", "field_operations", "OPERATOR", ["field.pwa.sync.assigned_record" as PermissionKey]),
  ],
};

export const PUBLIC_AUTHORIZATION_MANIFEST: ModuleAuthorizationManifest = {
  moduleId: "public",
  version: "1.0.0",
  displayName: "Anonim TV ve Müşteri Takip",
  permissions: [
    { key: "public.tv.read.organization" as PermissionKey, description: "PII içermeyen TV operasyon projection okur" },
    { key: "public.tracking.read.assigned_record" as PermissionKey, description: "Tahmin edilemez token ile minimum müşteri takip bilgisi okur", riskLevel: "sensitive" },
  ],
  defaultRoleTemplates: [
    role("public-display-viewer", "Public Projection İzleyicisi", "public_projection", "VIEWER", [
      "public.tv.read.organization",
      "public.tracking.read.assigned_record",
    ] as PermissionKey[]),
  ],
};

export const DEVICES_AUTHORIZATION_MANIFEST: ModuleAuthorizationManifest = {
  moduleId: "devices",
  version: "1.0.0",
  displayName: "Cihaz Adapterleri",
  permissions: [
    { key: "devices.adapters.manage.organization" as PermissionKey, description: "Terazi, QR okuyucu ve etiket yazıcı adapterlerini yönetir", riskLevel: "critical" },
  ],
  defaultRoleTemplates: [
    role("device-admin", "Cihaz Yöneticisi", "device_administration", "MANAGER", ["devices.adapters.manage.organization" as PermissionKey]),
  ],
};

export const MANAGEMENT_AUTHORIZATION_MANIFEST: ModuleAuthorizationManifest = {
  moduleId: "management",
  version: "1.0.0",
  displayName: "Yönetim, Raporlama ve Analitik",
  permissions: [
    { key: "management.dashboard.read.organization" as PermissionKey, description: "Kurumsal komuta merkezi ve dashboard sonuçlarını okur", riskLevel: "sensitive" },
    { key: "management.dashboard.manage.organization" as PermissionKey, description: "Kaydedilmiş dashboard görünümü ve widget düzenini yönetir", riskLevel: "sensitive" },
    { key: "management.reporting.read.organization" as PermissionKey, description: "Tenant rapor ve analitik sonuçlarını okur", riskLevel: "sensitive" },
    { key: "management.reporting.export.organization" as PermissionKey, description: "Yetkili Excel/CSV/PDF dışa aktarma sözleşmesini kullanır", riskLevel: "critical" },
    { key: "management.search.read.organization" as PermissionKey, description: "Evrensel arama sağlayıcılarından yetkili sonuçları okur", riskLevel: "sensitive" },
    { key: "management.exception.manage.organization" as PermissionKey, description: "Merkezi istisna ve onay kutusunu yönetir", riskLevel: "critical" },
    { key: "management.company.manage.organization" as PermissionKey, description: "Firma, tesis, modül, KVKK ve veri yönetim alanlarını yönetir", riskLevel: "critical" },
  ],
  defaultRoleTemplates: [
    role("command-center-manager", "Kurumsal Komuta Merkezi Yöneticisi", "management_command", "MANAGER", [
      "management.dashboard.read.organization",
      "management.dashboard.manage.organization",
      "management.reporting.read.organization",
      "management.reporting.export.organization",
      "management.search.read.organization",
      "management.exception.manage.organization",
      "management.company.manage.organization",
    ] as PermissionKey[]),
    role("reporting-analyst", "Raporlama Analisti", "reporting_analytics", "VIEWER", [
      "management.dashboard.read.organization",
      "management.reporting.read.organization",
      "management.search.read.organization",
    ] as PermissionKey[]),
  ],
};

export const FAZ_7_10_AUTHORIZATION_MANIFESTS = [
  QURBAN_OPERATIONS_AUTHORIZATION_MANIFEST,
  OPERATIONS_AUTHORIZATION_MANIFEST,
  INVENTORY_AUTHORIZATION_MANIFEST,
  LOGISTICS_AUTHORIZATION_MANIFEST,
  FIELD_AUTHORIZATION_MANIFEST,
  PUBLIC_AUTHORIZATION_MANIFEST,
  DEVICES_AUTHORIZATION_MANIFEST,
  MANAGEMENT_AUTHORIZATION_MANIFEST,
] as const;
