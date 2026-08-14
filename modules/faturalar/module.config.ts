import type { ModuleAuthorizationManifest, PermissionKey } from "@tilbecore/tenant-core";
import type { ModuleConfig } from "@/shared/types/module.types";

const permissionDefinitions = [
  ["invoice.invoice.read.organization", "Faturaları ve Fatura 360 görünümünü okur", undefined],
  ["invoice.invoice.create.organization", "Taslak alış, satış ve iade faturası oluşturur", "sensitive"],
  ["invoice.invoice.update_draft.organization", "Taslak faturayı günceller", "sensitive"],
  ["invoice.invoice.submit.organization", "Faturayı onaya gönderir", "sensitive"],
  ["invoice.invoice.approve.organization", "Faturayı onaylar veya reddeder", "critical"],
  ["invoice.invoice.post.organization", "Onaylı faturayı ledger'a işler", "critical"],
  ["invoice.invoice.reverse.organization", "İşlenmiş faturayı belgeli ters kayda alır", "critical"],
  ["invoice.invoice.return.organization", "Asıl faturaya bağlı iade faturası oluşturur", "critical"],
  ["invoice.invoice.cancel.organization", "Uygun durumdaki faturayı iptal eder", "critical"],
  ["invoice.invoice.pay.organization", "Ödeme veya tahsilatı faturaya tahsis eder", "critical"],
  ["invoice.invoice.export.organization", "Yetkili fatura belgesini dışa aktarır", "sensitive"],
  ["invoice.einvoice.send.organization", "e-Belgeyi güvenilir kuyruğa alır", "critical"],
  ["invoice.einvoice.respond.organization", "Gelen e-Faturaya kabul veya red yanıtı verir", "critical"],
  ["invoice.einvoice.cancel.organization", "e-Belge iptal akışını başlatır", "critical"],
  ["invoice.einvoice.retry.organization", "Başarısız e-Belge işini yeniden dener", "critical"],
  ["invoice.einvoice.settings_manage.organization", "Firma e-Belge bağlantı ayarlarını yönetir", "critical"],
  ["invoice.einvoice.audit_read.organization", "e-Belge audit ve webhook geçmişini okur", "sensitive"],
] as const;

const permissions = permissionDefinitions.map(([key, description, riskLevel]) => ({ key: key as PermissionKey, description, riskLevel }));
const allow = (key: string) => ({ key: key as PermissionKey, effect: "ALLOW" as const });

export const INVOICE_AUTHORIZATION_MANIFEST: ModuleAuthorizationManifest = {
  moduleId: "invoice",
  version: "1.0.0",
  displayName: "Faturalar 360 ve e-Belge Merkezi",
  permissions,
  defaultRoleTemplates: [
    { templateKey: "invoice-accountant", name: "Fatura Muhasebe Yetkilisi", functionalArea: "invoice_accounting", accessLevel: "AUTHORIZED_OPERATOR", permissions: permissions.filter((item) => !item.key.includes("settings_manage")).map((item) => allow(item.key)) },
    { templateKey: "invoice-viewer", name: "Fatura İzleyicisi", functionalArea: "invoice_accounting", accessLevel: "VIEWER", permissions: [allow("invoice.invoice.read.organization"), allow("invoice.einvoice.audit_read.organization")] },
  ],
  protectedRoles: [],
};

export const faturalarModule: ModuleConfig = {
  authorizationManifest: INVOICE_AUTHORIZATION_MANIFEST,
  id: "faturalar",
  ad: "Faturalar 360",
  aciklama: "Alış, satış, iade, ledger ve sağlayıcı bağımsız e-Belge merkezi",
  versiyon: "1.0.0",
  aktif: true,
  sira: 25,
  ikon: "FileText",
  anaRota: "/faturalar",
  izinler: ["admin", "kasiyer", "izleyici"],
  bagimliliklar: ["musteriler", "hayvanlar", "tahsilat", "kasa"],
  sayfalar: [
    { yol: "/faturalar", ad: "Tüm Faturalar" },
    { yol: "/faturalar/[id]", ad: "Fatura 360", sidebarGoster: false },
    { yol: "/faturalar/e-belge", ad: "e-Belge Merkezi" },
    { yol: "/ayarlar/entegrasyon/e-belge", ad: "e-Belge Entegrasyonu", sidebarGoster: false, izin: ["admin"] },
    { yol: "/ayarlar/tanimlar/olcu-birimleri", ad: "Ölçü ve İşlem Birimleri", sidebarGoster: false, izin: ["admin"] },
  ],
  olaylar: {
    yayinla: ["invoice:created", "invoice:posted", "invoice:payment-allocated", "einvoice:queued"],
    dinle: ["sale:confirmed", "receipt:recorded", "supplier:payment-recorded", "approval:decided"],
  },
  sozlesme: {
    yuzeyler: ["desktop", "tablet", "mobile"],
    featureFlagler: ["invoice_360"],
    entitlementlar: ["invoice_360"],
    auditOlaylari: ["invoice.created", "invoice.submitted", "invoice.approved", "invoice.posted", "invoice.payment_allocated", "einvoice.queued", "einvoice.webhook_received"],
    domainOlaylari: ["invoice.posted", "invoice.reversed", "invoice.payment_allocated", "einvoice.delivery_requested"],
    dashboardKatkilari: ["invoice-aging", "e-document-failure-queue", "invoice-ledger-reconciliation"],
    offlineSinifi: "none",
    migrationBilgisi: "0008_invoice_360_e_document_center",
    veriSaklamaBilgisi: "İşlenmiş faturalar fiziksel silinmez; iade, iptal ve ters kayıt ayrı auditli belgelerle izlenir.",
    runtimeKurali: { featureFlag: "invoice_360", entitlement: "invoice_360" },
  },
};

export default faturalarModule;
