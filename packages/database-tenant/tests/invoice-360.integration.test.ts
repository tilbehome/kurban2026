import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, test } from "vitest";
import { PrismaClient } from "../generated/client";
import { InvoiceService, type InvoiceActorContext } from "../../../modules/faturalar/application/invoice-service";
import { PrismaInvoiceRepository } from "../../../modules/faturalar/infrastructure/prisma/prisma-invoice-repository";
import { PrismaTenantMasterDataRepository } from "../src/repositories/prisma-tenant-master-data-repository";
import { PrismaUnitOfMeasureRepository } from "../src/repositories/prisma-unit-of-measure-repository";
import { UnitOfMeasureService } from "@tilbecore/tenant-core";

const shouldRun = process.env.RUN_INVOICE_POSTGRES_TESTS === "1";
const databaseUrl = shouldRun ? process.env.TENANT_DATABASE_URL : undefined;
if (shouldRun && !databaseUrl) throw new Error("Invoice PostgreSQL test environment is incomplete.");
const describePostgres = databaseUrl ? describe : describe.skip;
const db = databaseUrl ? new PrismaClient({ datasources: { db: { url: databaseUrl } } }) : undefined;
const suffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

describePostgres("Faturalar 360 gerçek PostgreSQL", () => {
  test("alış/satış/iade eksenleri, tenant sınırı, balanced ledger, allocation ve outbox atomik çalışır", async () => {
    if (!db) throw new Error("TEST_DATABASE_REQUIRED");
    const seasonId = `invoice_season_${suffix}`;
    const supplierId = `invoice_supplier_${suffix}`;
    const customerId = `invoice_customer_${suffix}`;
    const organizationId = `invoice_org_${suffix}`;
    await db.season.create({ data: { id: seasonId, name: "Sentetik Fatura Sezonu", status: "sales" } });
    await db.supplier.create({ data: { id: supplierId, displayName: "Sentetik Tedarikçi", normalizedName: "sentetik tedarikci", taxNumber: "1111111110" } });
    await db.customer.create({ data: { id: customerId, displayName: "Sentetik Müşteri", normalizedName: "sentetik musteri", identityNumber: "11111111111" } });
    const service = new InvoiceService(new PrismaInvoiceRepository(db));

    const createContext = context(organizationId, "create");
    const draft = {
      id: `invoice_${suffix}`, seasonId, uuid: randomUUID(), invoiceNo: `ALIS-${suffix}`, invoiceDate: new Date().toISOString(), direction: "INBOUND", tradeType: "PURCHASE", documentNature: "STANDARD", electronicChannel: "EFATURA", currency: "TRY", supplierId, partyTaxIdentity: "1111111110", partySnapshot: { displayName: "Sentetik Tedarikçi", city: "Test" },
      lines: [{ id: `line_${suffix}`, description: "Sentetik hayvan maliyeti", quantity: "2.000", unit: "ADET", unitPrice: "1000.0000", discountTotal: "100.0000", taxes: [{ id: `tax_${suffix}`, type: "KDV", rate: "20.0000" }] }],
    } as const;
    const created = await service.createDraft(createContext, draft);
    expect(await service.createDraft(createContext, draft)).toEqual(created);

    await service.submit(context(organizationId, "submit"), created.id);
    await service.approve(context(organizationId, "approve"), created.id);
    const posted = await service.post(context(organizationId, "post"), created.id);
    const journal = await db.journalEntry.findUniqueOrThrow({ where: { id: posted.journalEntryId }, include: { lines: true } });
    const debit = journal.lines.filter((line) => line.side === "debit").reduce((sum, line) => sum + Number(line.amount), 0);
    const credit = journal.lines.filter((line) => line.side === "credit").reduce((sum, line) => sum + Number(line.amount), 0);
    expect(debit).toBe(credit);
    expect(journal.lines).toHaveLength(2);
    await expect(service.get(context(`${organizationId}_other`, "read"), created.id)).rejects.toThrowError("INVOICE_NOT_FOUND");

    const supplierPaymentId = `supplier_payment_${suffix}`;
    await db.supplierPayment.create({ data: { id: supplierPaymentId, supplierId, seasonId, amount: "2500.0000", method: "bank_transfer", occurredAt: new Date(), idempotencyKey: `supplier_payment_idem_${suffix}` } });
    expect(await service.allocatePayment(context(organizationId, "allocation"), { id: created.id, allocationId: `allocation_${suffix}`, supplierPaymentId, amount: "2280.0000" })).toMatchObject({ paymentStatus: "PAID", paidTotal: "2280.0000" });
    await db.electronicDocumentConnection.create({ data: { id: `connection_${suffix}`, organizationId, providerKey: "mock-sandbox", unitMappingVersion: "mock-guide-v1", connectionName: "Sentetik sandbox", environment: "TEST", companyTaxIdentity: "1111111110", invoiceSeries: [], defaults: {}, emailOptions: {}, active: true, capabilities: {}, createdByUserId: `actor_${suffix}` } });
    await expect(service.enqueueElectronicDocument(context(organizationId, "send-mapping-missing"), { id: created.id, deliveryId: `delivery_missing_${suffix}`, providerKey: "mock-sandbox", correlationId: `correlation_missing_${suffix}` })).rejects.toThrowError("E_DOCUMENT_UNIT_MAPPING_REQUIRED");
    const invoiceUnitIds = (await db.purchaseInvoiceLine.findMany({ where: { purchaseInvoiceId: created.id }, select: { unitId: true } })).map((line) => line.unitId);
    await db.unitProviderMapping.createMany({ data: [...new Set(invoiceUnitIds)].map((unitOfMeasureId) => ({ id: `mapping_${unitOfMeasureId}_${suffix}`, tenantId: organizationId, providerKey: "mock-sandbox", mappingVersion: "mock-guide-v1", unitOfMeasureId, providerUnitCode: "MOCK_UNIT", createdByUserId: `actor_${suffix}` })) });
    await service.enqueueElectronicDocument(context(organizationId, "send"), { id: created.id, deliveryId: `delivery_${suffix}`, providerKey: "mock-sandbox", correlationId: `correlation_${suffix}` });
    expect(await db.electronicDocumentDelivery.count({ where: { purchaseInvoiceId: created.id, status: "QUEUED" } })).toBe(1);
    expect(await db.tenantOutboxMessage.count({ where: { payload: { path: ["invoiceId"], equals: created.id } } })).toBeGreaterThan(0);
  });

  test("20 satırlı alış faturası 20 tekil hayvan, 140 hisse ve balanced maliyet kaydını tek transaction'da üretir", async () => {
    if (!db) throw new Error("TEST_DATABASE_REQUIRED");
    const seasonId = `purchase_season_${suffix}`;
    const supplierId = `purchase_supplier_${suffix}`;
    const invoiceId = `purchase_invoice_${suffix}`;
    await db.season.create({ data: { id: seasonId, name: "Sentetik 20 Hayvan Sezonu", status: "preparation" } });
    await db.supplier.create({ data: { id: supplierId, displayName: "Sentetik 20 Hayvan Tedarikçisi", normalizedName: "sentetik 20 hayvan tedarikcisi" } });
    const repository = new PrismaTenantMasterDataRepository(db);
    const lines = Array.from({ length: 20 }, (_, index) => ({ id: `purchase_line_${suffix}_${index}`, description: `Sentetik hayvan ${index + 1}`, quantity: "1.000", unitPrice: "100.0000", lineTotal: "100.0000", animal: { id: `purchase_animal_${suffix}_${index}`, seasonId, supplierId, earTag: `SYN-${suffix}-${index}`, purchaseAmount: "100.0000" } }));
    const result = await repository.postPurchaseInvoice({ id: invoiceId, supplierId, seasonId, invoiceNo: `20-LINE-${suffix}`, invoiceDate: new Date().toISOString(), subtotal: "2000.0000", taxTotal: "0.0000", grandTotal: "2000.0000", lines }, { organizationId: `purchase_org_${suffix}`, actorUserId: `actor_${suffix}`, requestId: `request_purchase_${suffix}`, idempotencyKey: `idempotency_purchase_${suffix}`, requestHash: "a".repeat(64), occurredAt: new Date() });
    expect(result.animalIds).toHaveLength(20);
    expect(await db.animal.count({ where: { seasonId, supplierId } })).toBe(20);
    expect(await db.share.count({ where: { shareCard: { seasonId } } })).toBe(140);
    const invoice = await db.purchaseInvoice.findUniqueOrThrow({ where: { id: invoiceId }, include: { journalEntry: { include: { lines: true } } } });
    expect(invoice.journalEntry?.lines.map((line) => [line.side, line.amount.toString()])).toEqual([["debit", "2000"], ["credit", "2000"]]);
    expect((await db.supplierAccount.findUniqueOrThrow({ where: { supplierId_seasonId: { supplierId, seasonId } } })).balance.toString()).toBe("2000");
  });

  test("sistem ve firma birimleri tenant sınırında yönetilir; fatura snapshot'ı ve kullanılan birim değişmezliği korunur", async () => {
    if (!db) throw new Error("TEST_DATABASE_REQUIRED");
    const organizationId = `unit_org_${suffix}`;
    const otherOrganizationId = `unit_other_${suffix}`;
    const seasonId = `unit_season_${suffix}`;
    const supplierId = `unit_supplier_${suffix}`;
    const unitId = `unit_custom_${suffix}`;
    await db.season.create({ data: { id: seasonId, name: "Sentetik Birim Sezonu", status: "sales" } });
    await db.supplier.create({ data: { id: supplierId, displayName: "Sentetik Birim Tedarikçisi", normalizedName: "sentetik birim tedarikcisi" } });
    const units = new UnitOfMeasureService(new PrismaUnitOfMeasureRepository(db));
    const manageContext = { tenantId: organizationId, actorUserId: `actor_${suffix}`, permissions: ["definitions.units.read.organization", "definitions.units.create.organization", "definitions.units.update.organization", "definitions.units.activate.organization", "definitions.units.deactivate.organization"] };
    await units.create(manageContext, { id: unitId, code: "ÇUVAL", name: "Çuval", symbol: "çuval", category: "PACKAGE", decimalPrecision: 0, allowsFraction: false });
    expect((await units.list(manageContext)).some((unit) => unit.code === "ADET" && unit.isSystem)).toBe(true);
    expect((await units.list({ ...manageContext, tenantId: otherOrganizationId })).some((unit) => unit.id === unitId)).toBe(false);
    await expect(db.unitOfMeasure.update({ where: { id: "uom_system_adet" }, data: { name: "Değiştirilemez" } })).rejects.toThrow();
    await expect(db.unitOfMeasure.create({ data: { id: `unit_collision_${suffix}`, tenantId: organizationId, code: "ADET", name: "Çakışan", symbol: "ad", category: "COUNT", decimalPrecision: 0, allowsFraction: false, isSystem: false, createdByUserId: `actor_${suffix}`, updatedByUserId: `actor_${suffix}` } })).rejects.toThrow();

    const invoiceService = new InvoiceService(new PrismaInvoiceRepository(db));
    const invoiceId = `unit_invoice_${suffix}`;
    await invoiceService.createDraft(context(organizationId, "unit-create"), { id: invoiceId, seasonId, uuid: randomUUID(), invoiceNo: `UNIT-${suffix}`, invoiceDate: new Date().toISOString(), direction: "INBOUND", tradeType: "PURCHASE", documentNature: "STANDARD", electronicChannel: "NONE", currency: "TRY", supplierId, partySnapshot: { displayName: "Sentetik" }, lines: [{ id: `unit_line_${suffix}`, description: "Çuvallı yem", quantity: "2.000", unit: "çuval", unitPrice: "500.0000" }] });
    const line = await db.purchaseInvoiceLine.findFirstOrThrow({ where: { purchaseInvoiceId: invoiceId } });
    expect([line.unitId, line.unitCodeSnapshot, line.unitNameSnapshot, line.unitSymbolSnapshot]).toEqual([unitId, "ÇUVAL", "Çuval", "çuval"]);
    await expect(units.update(manageContext, unitId, { code: "ÇUVAL", name: "Değişmiş anlam", symbol: "çv", category: "PACKAGE", decimalPrecision: 0, allowsFraction: false })).rejects.toThrowError("UNIT_IN_USE_IMMUTABLE");
    await expect(db.unitOfMeasure.delete({ where: { id: unitId } })).rejects.toThrow();
    expect(await units.setActive(manageContext, unitId, false)).toMatchObject({ isActive: false });
  });
});

afterAll(async () => { await db?.$disconnect(); });

function context(organizationId: string, action: string): InvoiceActorContext {
  const all = ["invoice.invoice.read.organization", "invoice.invoice.create.organization", "invoice.invoice.submit.organization", "invoice.invoice.approve.organization", "invoice.invoice.post.organization", "invoice.invoice.pay.organization", "invoice.einvoice.send.organization"];
  return { organizationId, actorUserId: `actor_${suffix}`, requestId: `request_${action}_${suffix}`, idempotencyKey: `idempotency_${action}_${suffix}`, permissions: all, reauthenticatedAt: new Date().toISOString() };
}
