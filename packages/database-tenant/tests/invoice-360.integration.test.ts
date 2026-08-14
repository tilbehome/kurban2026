import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, test } from "vitest";
import { PrismaClient } from "../generated/client";
import { InvoiceService, type InvoiceActorContext, type InvoiceDraftInput } from "../../../modules/faturalar/application/invoice-service";
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
    expect(journal.lines).toHaveLength(3);
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

  test("ödeme kaynağı toplamı, idempotency ve eşzamanlı tahsis yarışı fail-closed korunur", async () => {
    if (!db) throw new Error("TEST_DATABASE_REQUIRED");
    const caseId = `allocation_${suffix}`;
    const organizationId = `org_${caseId}`;
    const seasonId = `season_${caseId}`;
    const supplierId = `supplier_${caseId}`;
    const customerId = `customer_${caseId}`;
    await db.season.create({ data: { id: seasonId, name: "Tahsis bütünlük sezonu", status: "sales" } });
    await db.supplier.create({ data: { id: supplierId, displayName: "Tahsis Tedarikçisi", normalizedName: "tahsis tedarikcisi" } });
    await db.customer.create({ data: { id: customerId, displayName: "Tahsis Müşterisi", normalizedName: "tahsis musterisi" } });
    const service = new InvoiceService(new PrismaInvoiceRepository(db));
    const invoiceA = await createPostedInvoice(service, organizationId, `${caseId}_a`, purchaseDraft(caseId, "A", seasonId, supplierId, "100.0000"));
    const invoiceB = await createPostedInvoice(service, organizationId, `${caseId}_b`, purchaseDraft(caseId, "B", seasonId, supplierId, "100.0000"));
    const paymentId = `payment_${caseId}`;
    await db.supplierPayment.create({ data: { id: paymentId, supplierId, seasonId, amount: "100.0000", method: "bank_transfer", occurredAt: new Date(), idempotencyKey: `payment_idem_${caseId}` } });

    const replayContext = context(organizationId, `${caseId}_replay`);
    const allocation = { id: invoiceA, allocationId: `allocation_replay_${caseId}`, supplierPaymentId: paymentId, amount: "60.0000" };
    const first = await service.allocatePayment(replayContext, allocation);
    expect(await service.allocatePayment(replayContext, allocation)).toEqual(first);
    await expect(service.allocatePayment(replayContext, { ...allocation, amount: "61.0000" })).rejects.toThrowError("IDEMPOTENCY_KEY_REUSED");
    await expect(service.allocatePayment(context(organizationId, `${caseId}_excess`), { id: invoiceB, allocationId: `allocation_excess_${caseId}`, supplierPaymentId: paymentId, amount: "50.0000" })).rejects.toThrowError("INVOICE_PAYMENT_SOURCE_EXCEEDED");
    expect((await db.invoicePaymentAllocation.aggregate({ where: { supplierPaymentId: paymentId }, _sum: { amount: true } }))._sum.amount?.toString()).toBe("60");

    const salesA = await createPostedInvoice(service, organizationId, `${caseId}_sales_a`, salesDraft(caseId, "ALLOCATION-A", seasonId, customerId, "100.0000"));
    const salesB = await createPostedInvoice(service, organizationId, `${caseId}_sales_b`, salesDraft(caseId, "ALLOCATION-B", seasonId, customerId, "100.0000"));
    const receiptJournalId = `receipt_journal_${caseId}`;
    const receiptId = `receipt_${caseId}`;
    await db.journalEntry.create({ data: { id: receiptJournalId, seasonId, sourceType: "invoice_allocation_test_receipt", sourceId: receiptId, currency: "TRY", idempotencyKey: `receipt_journal_idem_${caseId}`, occurredAt: new Date(), postedAt: new Date() } });
    await db.receipt.create({ data: { id: receiptId, seasonId, customerId, journalEntryId: receiptJournalId, receiptNo: `RCPT-${caseId}`, totalAmount: "100.0000", currency: "TRY", occurredAt: new Date(), idempotencyKey: `receipt_idem_${caseId}` } });
    await service.allocatePayment(context(organizationId, `${caseId}_receipt_first`), { id: salesA, allocationId: `allocation_receipt_first_${caseId}`, receiptId, amount: "60.0000" });
    await expect(service.allocatePayment(context(organizationId, `${caseId}_receipt_excess`), { id: salesB, allocationId: `allocation_receipt_excess_${caseId}`, receiptId, amount: "50.0000" })).rejects.toThrowError("INVOICE_PAYMENT_SOURCE_EXCEEDED");
    expect((await db.invoicePaymentAllocation.aggregate({ where: { receiptId }, _sum: { amount: true } }))._sum.amount?.toString()).toBe("60");

    const racePaymentId = `payment_race_${caseId}`;
    await db.supplierPayment.create({ data: { id: racePaymentId, supplierId, seasonId, amount: "100.0000", method: "bank_transfer", occurredAt: new Date(), idempotencyKey: `payment_race_idem_${caseId}` } });
    const race = await Promise.allSettled([
      service.allocatePayment(context(organizationId, `${caseId}_race_a`), { id: invoiceA, allocationId: `allocation_race_a_${caseId}`, supplierPaymentId: racePaymentId, amount: "70.0000" }),
      service.allocatePayment(context(organizationId, `${caseId}_race_b`), { id: invoiceB, allocationId: `allocation_race_b_${caseId}`, supplierPaymentId: racePaymentId, amount: "70.0000" }),
    ]);
    expect(race.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(race.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect((await db.invoicePaymentAllocation.aggregate({ where: { supplierPaymentId: racePaymentId }, _sum: { amount: true } }))._sum.amount?.toString()).toBe("70");
  });

  test("iade kapsamı, taraflar, ters yön ve kümülatif tutar eşzamanlı olarak korunur", async () => {
    if (!db) throw new Error("TEST_DATABASE_REQUIRED");
    const caseId = `return_${suffix}`;
    const organizationId = `org_${caseId}`;
    const seasonId = `season_${caseId}`;
    const supplierA = `supplier_a_${caseId}`;
    const supplierB = `supplier_b_${caseId}`;
    const customerA = `customer_a_${caseId}`;
    const customerB = `customer_b_${caseId}`;
    await db.season.create({ data: { id: seasonId, name: "İade bütünlük sezonu", status: "sales" } });
    await db.supplier.createMany({ data: [{ id: supplierA, displayName: "İade Tedarikçisi A", normalizedName: "iade tedarikcisi a" }, { id: supplierB, displayName: "İade Tedarikçisi B", normalizedName: "iade tedarikcisi b" }] });
    await db.customer.createMany({ data: [{ id: customerA, displayName: "İade Müşterisi A", normalizedName: "iade musterisi a" }, { id: customerB, displayName: "İade Müşterisi B", normalizedName: "iade musterisi b" }] });
    const service = new InvoiceService(new PrismaInvoiceRepository(db));
    const purchaseOriginal = await createPostedInvoice(service, organizationId, `${caseId}_purchase`, purchaseDraft(caseId, "ORIGINAL", seasonId, supplierA, "100.0000"));
    const salesOriginal = await createPostedInvoice(service, organizationId, `${caseId}_sales`, salesDraft(caseId, "ORIGINAL", seasonId, customerA, "100.0000"));

    await expect(service.createDraft(context(organizationId, `${caseId}_wrong_supplier`), { ...purchaseDraft(caseId, "WRONG-SUPPLIER", seasonId, supplierB, "10.0000"), documentNature: "RETURN", direction: "OUTBOUND", originalInvoiceId: purchaseOriginal })).rejects.toThrowError("INVOICE_RETURN_SCOPE_MISMATCH");
    await expect(service.createDraft(context(organizationId, `${caseId}_wrong_direction`), { ...purchaseDraft(caseId, "WRONG-DIRECTION", seasonId, supplierA, "10.0000"), documentNature: "RETURN", direction: "INBOUND", originalInvoiceId: purchaseOriginal })).rejects.toThrowError("INVOICE_RETURN_DIRECTION_INVALID");
    await expect(service.createDraft(context(organizationId, `${caseId}_wrong_customer`), { ...salesDraft(caseId, "WRONG-CUSTOMER", seasonId, customerB, "10.0000"), documentNature: "RETURN", direction: "INBOUND", originalInvoiceId: salesOriginal })).rejects.toThrowError("INVOICE_RETURN_SCOPE_MISMATCH");

    const returnA = { ...purchaseDraft(caseId, "RETURN-A", seasonId, supplierA, "60.0000"), documentNature: "RETURN" as const, direction: "OUTBOUND" as const, originalInvoiceId: purchaseOriginal };
    const returnB = { ...purchaseDraft(caseId, "RETURN-B", seasonId, supplierA, "60.0000"), documentNature: "RETURN" as const, direction: "OUTBOUND" as const, originalInvoiceId: purchaseOriginal };
    await service.createDraft(context(organizationId, `${caseId}_return_a_create`), returnA);
    await service.createDraft(context(organizationId, `${caseId}_return_b_create`), returnB);
    for (const [id, key] of [[returnA.id, "a"], [returnB.id, "b"]] as const) {
      await service.submit(context(organizationId, `${caseId}_return_${key}_submit`), id);
      await service.approve(context(organizationId, `${caseId}_return_${key}_approve`), id);
    }
    const posted = await Promise.allSettled([
      service.post(context(organizationId, `${caseId}_return_a_post`), returnA.id),
      service.post(context(organizationId, `${caseId}_return_b_post`), returnB.id),
    ]);
    expect(posted.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(posted.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect((await db.purchaseInvoice.aggregate({ where: { originalInvoiceId: purchaseOriginal, accountingStatus: "POSTED" }, _sum: { grandTotal: true } }))._sum.grandTotal?.toString()).toBe("60");
    await expect(service.createDraft(context(organizationId, `${caseId}_return_excess`), { ...purchaseDraft(caseId, "RETURN-EXCESS", seasonId, supplierA, "50.0000"), documentNature: "RETURN", direction: "OUTBOUND", originalInvoiceId: purchaseOriginal })).rejects.toThrowError("INVOICE_RETURN_AMOUNT_EXCEEDED");
  });

  test("vergili alış/satış/iade journal sınıfları, TRY sınırı ve vergi satırı DB kapsamı korunur", async () => {
    if (!db) throw new Error("TEST_DATABASE_REQUIRED");
    const caseId = `tax_${suffix}`;
    const organizationId = `org_${caseId}`;
    const seasonId = `season_${caseId}`;
    const supplierId = `supplier_${caseId}`;
    const customerId = `customer_${caseId}`;
    await db.season.create({ data: { id: seasonId, name: "Vergi journal sezonu", status: "sales" } });
    await db.supplier.create({ data: { id: supplierId, displayName: "Vergi Tedarikçisi", normalizedName: "vergi tedarikcisi" } });
    await db.customer.create({ data: { id: customerId, displayName: "Vergi Müşterisi", normalizedName: "vergi musterisi" } });
    const service = new InvoiceService(new PrismaInvoiceRepository(db));
    const purchase = await createPostedInvoice(service, organizationId, `${caseId}_purchase`, taxedDraft(purchaseDraft(caseId, "PURCHASE", seasonId, supplierId, "100.0000"), `${caseId}_purchase`));
    const sale = await createPostedInvoice(service, organizationId, `${caseId}_sale`, taxedDraft(salesDraft(caseId, "SALE", seasonId, customerId, "200.0000"), `${caseId}_sale`));
    const purchaseReturn = await createPostedInvoice(service, organizationId, `${caseId}_purchase_return`, taxedDraft({ ...purchaseDraft(caseId, "PURCHASE-RETURN", seasonId, supplierId, "25.0000"), documentNature: "RETURN", direction: "OUTBOUND", originalInvoiceId: purchase }, `${caseId}_purchase_return`));
    const salesReturn = await createPostedInvoice(service, organizationId, `${caseId}_sales_return`, taxedDraft({ ...salesDraft(caseId, "SALES-RETURN", seasonId, customerId, "50.0000"), documentNature: "RETURN", direction: "INBOUND", originalInvoiceId: sale }, `${caseId}_sales_return`));

    await expectJournal(db, purchase, [["ACCOUNTS_PAYABLE", "credit", "120", "liability", "credit"], ["INPUT_TAX", "debit", "20", "asset", "debit"], ["INVENTORY", "debit", "100", "asset", "debit"]]);
    await expectJournal(db, sale, [["ACCOUNTS_RECEIVABLE", "debit", "240", "asset", "debit"], ["OUTPUT_TAX", "credit", "40", "liability", "credit"], ["SALES_REVENUE", "credit", "200", "revenue", "credit"]]);
    await expectJournal(db, purchaseReturn, [["ACCOUNTS_PAYABLE", "debit", "30", "liability", "credit"], ["INPUT_TAX", "credit", "5", "asset", "debit"], ["INVENTORY", "credit", "25", "asset", "debit"]]);
    await expectJournal(db, salesReturn, [["ACCOUNTS_RECEIVABLE", "credit", "60", "asset", "debit"], ["OUTPUT_TAX", "debit", "10", "liability", "credit"], ["SALES_REVENUE", "debit", "50", "revenue", "credit"]]);

    await expect(service.createDraft(context(organizationId, `${caseId}_usd`), { ...purchaseDraft(caseId, "USD", seasonId, supplierId, "10.0000"), currency: "USD" })).rejects.toThrowError("INVOICE_CURRENCY_NOT_SUPPORTED");
    const foreignLine = await db.purchaseInvoiceLine.findFirstOrThrow({ where: { purchaseInvoiceId: sale } });
    await expect(db.invoiceTaxComponent.create({ data: { id: `tax_scope_violation_${caseId}`, purchaseInvoiceId: purchase, lineId: foreignLine.id, taxType: "KDV", rate: "20.0000", taxableAmount: "1.0000", taxAmount: "0.2000" } })).rejects.toThrow();
  });
});

afterAll(async () => { await db?.$disconnect(); });

function context(organizationId: string, action: string): InvoiceActorContext {
  const all = ["invoice.invoice.read.organization", "invoice.invoice.create.organization", "invoice.invoice.submit.organization", "invoice.invoice.approve.organization", "invoice.invoice.post.organization", "invoice.invoice.pay.organization", "invoice.einvoice.send.organization"];
  return { organizationId, actorUserId: `actor_${suffix}`, requestId: `request_${action}_${suffix}`, idempotencyKey: `idempotency_${action}_${suffix}`, permissions: all, reauthenticatedAt: new Date().toISOString() };
}

function purchaseDraft(caseId: string, label: string, seasonId: string, supplierId: string, amount: string): InvoiceDraftInput {
  return { id: `invoice_purchase_${label}_${caseId}`, seasonId, uuid: randomUUID(), invoiceNo: `PURCHASE-${label}-${caseId}`, invoiceDate: new Date().toISOString(), direction: "INBOUND", tradeType: "PURCHASE", documentNature: "STANDARD", electronicChannel: "NONE", currency: "TRY", supplierId, partySnapshot: { displayName: "Sentetik Tedarikçi" }, lines: [{ id: `line_purchase_${label}_${caseId}`, description: `${label} sentetik satır`, quantity: "1.000", unit: "ADET", unitPrice: amount }] };
}

function salesDraft(caseId: string, label: string, seasonId: string, customerId: string, amount: string): InvoiceDraftInput {
  return { id: `invoice_sales_${label}_${caseId}`, seasonId, uuid: randomUUID(), invoiceNo: `SALES-${label}-${caseId}`, invoiceDate: new Date().toISOString(), direction: "OUTBOUND", tradeType: "SALES", documentNature: "STANDARD", electronicChannel: "NONE", currency: "TRY", customerId, partySnapshot: { displayName: "Sentetik Müşteri" }, lines: [{ id: `line_sales_${label}_${caseId}`, description: `${label} sentetik satır`, quantity: "1.000", unit: "ADET", unitPrice: amount }] };
}

function taxedDraft(input: InvoiceDraftInput, taxId: string): InvoiceDraftInput {
  return { ...input, lines: input.lines.map((line) => ({ ...line, taxes: [{ id: `tax_${taxId}`, type: "KDV", rate: "20.0000" }] })) };
}

async function createPostedInvoice(service: InvoiceService, organizationId: string, action: string, draft: InvoiceDraftInput): Promise<string> {
  await service.createDraft(context(organizationId, `${action}_create`), draft);
  await service.submit(context(organizationId, `${action}_submit`), draft.id);
  await service.approve(context(organizationId, `${action}_approve`), draft.id);
  await service.post(context(organizationId, `${action}_post`), draft.id);
  return draft.id;
}

async function expectJournal(client: PrismaClient, invoiceId: string, expected: readonly (readonly [string, string, string, string, string])[]) {
  const invoice = await client.purchaseInvoice.findUniqueOrThrow({ where: { id: invoiceId }, include: { journalEntry: { include: { lines: { include: { account: true } } } } } });
  const lines = invoice.journalEntry?.lines.map((line) => [line.account.code, line.side, line.amount.toString(), line.account.type, line.account.normalSide] as const).sort((a, b) => a[0].localeCompare(b[0])) ?? [];
  expect(lines).toEqual([...expected].sort((a, b) => a[0].localeCompare(b[0])));
  const debit = invoice.journalEntry?.lines.filter((line) => line.side === "debit").reduce((sum, line) => sum + Number(line.amount), 0) ?? 0;
  const credit = invoice.journalEntry?.lines.filter((line) => line.side === "credit").reduce((sum, line) => sum + Number(line.amount), 0) ?? 0;
  expect(debit).toBe(credit);
}
