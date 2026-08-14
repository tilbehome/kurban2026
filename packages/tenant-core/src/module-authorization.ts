import type { PermissionKey } from "./authorization-domain";
import type { ModuleAuthorizationManifest } from "./authorization-service";

const allow = (key: PermissionKey) => ({ key, effect: "ALLOW" as const });

export const IDENTITY_AUTHORIZATION_MANIFEST: ModuleAuthorizationManifest = {
  moduleId: "identity",
  version: "1.0.0",
  displayName: "Kimlik ve Yetki",
  permissions: [
    { key: "identity.role.assign.organization", description: "Firma üyelerine rol atar", riskLevel: "critical" },
    { key: "identity.role.revoke.organization", description: "Firma üyelerinden rol kaldırır", riskLevel: "critical" },
    { key: "identity.role.create.organization", description: "Rol şablonunu kopyalar ve özel rol oluşturur", riskLevel: "sensitive" },
    { key: "identity.delegation.create.organization", description: "Süreli yetki devri oluşturur", riskLevel: "critical" },
    { key: "identity.module.register.organization", description: "Modül yetki sözleşmesini kaydeder", riskLevel: "critical" },
    { key: "identity.audit.read.organization", description: "Yetkilendirme karar kayıtlarını görüntüler", riskLevel: "sensitive" },
    { key: "identity.approval.decide.organization", description: "İkinci onay kararını verir", riskLevel: "critical" },
    { key: "identity.service-account.manage.organization", description: "Servis hesaplarını ve izinlerini yönetir", riskLevel: "critical" },
    { key: "identity.device.manage.organization", description: "Cihaz kimliklerini ve izinlerini yönetir", riskLevel: "critical" },
    { key: "identity.external-user.manage.organization", description: "Harici kullanıcı erişimini yönetir", riskLevel: "critical" },
  ],
  defaultRoleTemplates: [],
  protectedRoles: [
    { code: "ORGANIZATION_OWNER", name: "Firma Sahibi", functionalArea: "organization_governance", accessLevel: "MANAGER", permissions: ["identity.role.assign.organization", "identity.role.revoke.organization", "identity.role.create.organization", "identity.delegation.create.organization", "identity.module.register.organization", "identity.audit.read.organization", "identity.approval.decide.organization", "identity.service-account.manage.organization", "identity.device.manage.organization", "identity.external-user.manage.organization"].map((key) => allow(key as PermissionKey)) },
    { code: "EXECUTIVE_ADMIN", name: "Yönetici", functionalArea: "executive_governance", accessLevel: "MANAGER", permissions: ["identity.role.create.organization", "identity.audit.read.organization"].map((key) => allow(key as PermissionKey)) },
    { code: "SECURITY_ADMIN", name: "Güvenlik Yöneticisi", functionalArea: "security", accessLevel: "MANAGER", permissions: ["identity.role.assign.organization", "identity.role.revoke.organization", "identity.delegation.create.organization", "identity.audit.read.organization", "identity.service-account.manage.organization", "identity.device.manage.organization"].map((key) => allow(key as PermissionKey)) },
    { code: "ACCESS_ADMIN", name: "Erişim Yöneticisi", functionalArea: "access_management", accessLevel: "MANAGER", permissions: ["identity.role.assign.organization", "identity.role.revoke.organization", "identity.role.create.organization", "identity.delegation.create.organization", "identity.external-user.manage.organization"].map((key) => allow(key as PermissionKey)) },
    { code: "COMPLIANCE_AUDITOR", name: "Uyum Denetçisi", functionalArea: "compliance", accessLevel: "VIEWER", permissions: [allow("identity.audit.read.organization")] },
    { code: "SUPPORT_APPROVER", name: "Destek Onay Yetkilisi", functionalArea: "support_approval", accessLevel: "AUTHORIZED_OPERATOR", permissions: [allow("identity.approval.decide.organization")] },
  ],
};

export const KURBAN_AUTHORIZATION_MANIFEST: ModuleAuthorizationManifest = {
  moduleId: "kurban",
  version: "1.0.0",
  displayName: "Kurban Operasyonları",
  permissions: [
    { key: "kurban.business.manage.organization", description: "Firma profili, lokasyon ve ayarları yönetir", riskLevel: "sensitive" },
    { key: "kurban.season.read.organization", description: "Sezonları görüntüler" },
    { key: "kurban.season.manage.organization", description: "Sezonu ve durum geçişlerini yönetir", riskLevel: "critical" },
    { key: "kurban.customer.read.organization", description: "Müşteri ve sezon geçmişini görüntüler", riskLevel: "sensitive" },
    { key: "kurban.customer.manage.organization", description: "Müşteri ana verisini yönetir", riskLevel: "sensitive" },
    { key: "kurban.supplier.read.organization", description: "Tedarikçi ve carisini görüntüler", riskLevel: "sensitive" },
    { key: "kurban.supplier.manage.organization", description: "Tedarikçi ana verisini yönetir", riskLevel: "sensitive" },
    { key: "kurban.purchase.manage.organization", description: "Alış faturası ve tedarikçi ödemesi işler", riskLevel: "critical" },
    { key: "kurban.expense.manage.organization", description: "Gider belgesi işler", riskLevel: "critical" },
    { key: "kurban.animal.read.organization", description: "Hayvan kayıtlarını görüntüler" },
    { key: "kurban.animal.manage.organization", description: "Hayvan ve tartım kayıtlarını yönetir", riskLevel: "sensitive" },
    { key: "kurban.animal-health.manage.assigned_record", description: "Atanmış hayvan sağlık olaylarını yönetir", riskLevel: "sensitive" },
    { key: "kurban.qurban-queue.manage.operational_period", description: "Kurban ve kesim sırası geçmişini yönetir", riskLevel: "sensitive" },
    { key: "kurban.pricing.manage.organization", description: "Sürümlü hisse fiyat tarifelerini yönetir", riskLevel: "sensitive" },
    { key: "kurban.share.read.operational_period", description: "Sezon hisselerini ve uygunluk durumunu görüntüler" },
    { key: "kurban.share.reserve.operational_period", description: "Kaporasız süreli hisse rezervasyonu yapar", riskLevel: "sensitive" },
    { key: "kurban.sale.confirm.operational_period", description: "Pozitif kapora ile kesin hisse satışı yapar", riskLevel: "critical" },
    { key: "kurban.sale.cancel.operational_period", description: "Satış iptali ve geri alma akışını başlatır", riskLevel: "critical" },
    { key: "kurban.sale.transfer.operational_period", description: "Hisseyi kontrollü olarak başka hayvana veya müşteriye taşır", riskLevel: "critical" },
    { key: "kurban.finance.receipt.create.organization", description: "Nakit, havale ve POS tahsilatı kaydeder", riskLevel: "critical" },
    { key: "kurban.finance.ledger.read.organization", description: "Çift taraflı ledger ve cari dökümünü görüntüler", riskLevel: "sensitive" },
  ],
  defaultRoleTemplates: [
    { templateKey: "operations-manager", name: "Kurban Operasyon Yöneticisi", functionalArea: "qurban_operations", accessLevel: "MANAGER", permissions: ["kurban.business.manage.organization", "kurban.season.read.organization", "kurban.season.manage.organization", "kurban.customer.read.organization", "kurban.customer.manage.organization", "kurban.supplier.read.organization", "kurban.supplier.manage.organization", "kurban.purchase.manage.organization", "kurban.expense.manage.organization", "kurban.animal.read.organization", "kurban.animal.manage.organization", "kurban.animal-health.manage.assigned_record", "kurban.qurban-queue.manage.operational_period", "kurban.pricing.manage.organization", "kurban.share.read.operational_period", "kurban.share.reserve.operational_period", "kurban.sale.confirm.operational_period", "kurban.sale.cancel.operational_period", "kurban.sale.transfer.operational_period", "kurban.finance.receipt.create.organization", "kurban.finance.ledger.read.organization"].map((key) => allow(key as PermissionKey)) },
    { templateKey: "customer-operator", name: "Müşteri Operatörü", functionalArea: "customer_operations", accessLevel: "OPERATOR", permissions: [allow("kurban.season.read.organization"), allow("kurban.customer.read.organization"), allow("kurban.customer.manage.organization")] },
    { templateKey: "procurement-operator", name: "Tedarik Operatörü", functionalArea: "procurement", accessLevel: "AUTHORIZED_OPERATOR", permissions: ["kurban.season.read.organization", "kurban.supplier.read.organization", "kurban.supplier.manage.organization", "kurban.purchase.manage.organization", "kurban.expense.manage.organization", "kurban.animal.read.organization", "kurban.animal.manage.organization"].map((key) => allow(key as PermissionKey)) },
    { templateKey: "sales-cashier", name: "Satış ve Tahsilat Yetkilisi", functionalArea: "qurban_sales", accessLevel: "AUTHORIZED_OPERATOR", permissions: ["kurban.season.read.organization", "kurban.customer.read.organization", "kurban.customer.manage.organization", "kurban.share.read.operational_period", "kurban.share.reserve.operational_period", "kurban.sale.confirm.operational_period", "kurban.finance.receipt.create.organization"].map((key) => allow(key as PermissionKey)) },
    { templateKey: "finance-viewer", name: "Finans İzleyicisi", functionalArea: "finance", accessLevel: "VIEWER", permissions: [allow("kurban.season.read.organization"), allow("kurban.customer.read.organization"), allow("kurban.finance.ledger.read.organization")] },
    { templateKey: "animal-health-operator", name: "Hayvan Sağlığı Operatörü", functionalArea: "animal_health", accessLevel: "OPERATOR", permissions: [allow("kurban.season.read.organization"), allow("kurban.animal.read.organization"), allow("kurban.animal-health.manage.assigned_record")] },
    { templateKey: "operations-viewer", name: "Kurban Operasyon İzleyicisi", functionalArea: "qurban_operations", accessLevel: "VIEWER", permissions: [allow("kurban.season.read.organization"), allow("kurban.customer.read.organization"), allow("kurban.supplier.read.organization"), allow("kurban.animal.read.organization")] },
  ],
};

export const BESI_AUTHORIZATION_MANIFEST: ModuleAuthorizationManifest = {
  moduleId: "besi",
  version: "1.0.0",
  displayName: "Besi Operasyonları",
  permissions: [
    { key: "besi.animal.read.organization", description: "Besi hayvanlarını görüntüler" },
    { key: "besi.animal.manage.organization", description: "Besi hayvanı ana verisini yönetir", riskLevel: "sensitive" },
    { key: "besi.weight.manage.assigned_record", description: "Atanmış hayvan tartımlarını yönetir", riskLevel: "sensitive" },
    { key: "besi.health.manage.assigned_record", description: "Atanmış hayvan sağlık olaylarını yönetir", riskLevel: "sensitive" },
  ],
  defaultRoleTemplates: [
    { templateKey: "farm-supervisor", name: "Besi Saha Sorumlusu", functionalArea: "livestock_field", accessLevel: "SUPERVISOR", permissions: [allow("besi.animal.read.organization"), allow("besi.animal.manage.organization"), allow("besi.weight.manage.assigned_record"), allow("besi.health.manage.assigned_record")] },
    { templateKey: "farm-operator", name: "Besi Saha Operatörü", functionalArea: "livestock_field", accessLevel: "OPERATOR", permissions: [allow("besi.animal.read.organization"), allow("besi.weight.manage.assigned_record"), allow("besi.health.manage.assigned_record")] },
  ],
};

export const DEFINITIONS_AUTHORIZATION_MANIFEST: ModuleAuthorizationManifest = {
  moduleId: "definitions",
  version: "1.0.0",
  displayName: "Firma Tanımları",
  permissions: [
    { key: "definitions.units.read.organization", description: "Ölçü ve işlem birimlerini görüntüler" },
    { key: "definitions.units.create.organization", description: "Firma ölçü ve işlem birimi oluşturur", riskLevel: "sensitive" },
    { key: "definitions.units.update.organization", description: "Kullanılmamış firma birimini günceller", riskLevel: "sensitive" },
    { key: "definitions.units.activate.organization", description: "Firma birimini etkinleştirir", riskLevel: "sensitive" },
    { key: "definitions.units.deactivate.organization", description: "Firma birimini fiziksel silmeden pasifleştirir", riskLevel: "sensitive" },
  ],
  defaultRoleTemplates: [
    { templateKey: "definitions-admin", name: "Firma Tanımları Yöneticisi", functionalArea: "organization_definitions", accessLevel: "MANAGER", permissions: ["definitions.units.read.organization", "definitions.units.create.organization", "definitions.units.update.organization", "definitions.units.activate.organization", "definitions.units.deactivate.organization"].map((key) => allow(key as PermissionKey)) },
    { templateKey: "definitions-viewer", name: "Firma Tanımları İzleyicisi", functionalArea: "organization_definitions", accessLevel: "VIEWER", permissions: [allow("definitions.units.read.organization")] },
  ],
};

export const TENANT_MODULE_AUTHORIZATION_MANIFESTS = [IDENTITY_AUTHORIZATION_MANIFEST, KURBAN_AUTHORIZATION_MANIFEST, BESI_AUTHORIZATION_MANIFEST, DEFINITIONS_AUTHORIZATION_MANIFEST] as const;
