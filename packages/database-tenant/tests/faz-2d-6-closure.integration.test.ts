import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, test } from "vitest";
import { PrismaClient } from "../generated/client";
import { PrismaTenantMasterDataRepository } from "../src/repositories/prisma-tenant-master-data-repository";
import { PrismaTenantOperationsRepository } from "../src/repositories/prisma-tenant-operations-repository";
import { PrismaTenantSalesFinanceRepository } from "../src/repositories/prisma-tenant-sales-finance-repository";
import { normalizeConfirmSale, normalizeReceipt, type CommandMeta } from "@tilbecore/tenant-core";

const shouldRun = process.env.RUN_CORE_POSTGRES_TESTS === "1";
const databaseUrl = shouldRun ? process.env.TENANT_DATABASE_URL : undefined;
if (shouldRun && !databaseUrl) throw new Error("Faz 2D-6 PostgreSQL test environment is incomplete.");
const describePostgres = databaseUrl ? describe : describe.skip;
const db = databaseUrl ? new PrismaClient({ datasources: { db: { url: databaseUrl } } }) : undefined;
const suffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

describePostgres("Faz 2D-6 gerçek PostgreSQL kapanış kabulleri", () => {
  test("rezervasyon finans üretmez; kesin satış tahsis limitini, reversal iptalini ve değişmez hisse geçmişini korur", async () => {
    if (!db) throw new Error("TEST_DATABASE_REQUIRED");
    const seasonId = `core_season_${suffix}`;
    const customerId = `core_customer_${suffix}`;
    const animalId = `core_animal_${suffix}`;
    await db.season.create({ data: { id: seasonId, name: "Sentetik Kapanış Sezonu", status: "sales" } });
    await db.customer.create({ data: { id: customerId, displayName: "Sentetik Kapanış Müşterisi", normalizedName: "SENTETIK KAPANIS MUSTERISI" } });
    const master = new PrismaTenantMasterDataRepository(db);
    await master.createAnimal({ id: animalId, seasonId, earTag: `SYN-${suffix}`, liveWeightKg: "700.000" }, meta("animal"));
    const shares = await db.share.findMany({ where: { shareCard: { animalId } }, orderBy: { sequenceNo: "asc" } });
    const sales = new PrismaTenantSalesFinanceRepository(db);
    await sales.reserveShare({ id: `reservation_${suffix}`, seasonId, shareId: shares[0]!.id, customerId, reservedUntil: new Date(Date.now() + 60_000).toISOString() }, meta("reserve"));
    expect(await db.sale.count({ where: { seasonId } })).toBe(0);
    expect(await db.receipt.count({ where: { seasonId } })).toBe(0);
    expect(await db.journalEntry.count({ where: { seasonId } })).toBe(0);

    const saleId = `sale_${suffix}`;
    await sales.confirmSale(normalizeConfirmSale({
      id: saleId, seasonId, customerId, shareIds: [shares[0]!.id], listPricePerShare: "100.0000",
      downPayment: { receiptId: `deposit_${suffix}`, receiptNo: `D-${suffix}`, methodSplits: [{ id: `deposit_split_${suffix}`, method: "cash", amount: "10.0000" }] },
    }), meta("sale"));
    const otherSaleId = `sale_other_${suffix}`;
    const thirdSaleId = `sale_third_${suffix}`;
    await sales.confirmSale(normalizeConfirmSale({
      id: otherSaleId, seasonId, customerId, shareIds: [shares[1]!.id], listPricePerShare: "100.0000",
      downPayment: { receiptId: `deposit_other_${suffix}`, receiptNo: `DO-${suffix}`, methodSplits: [{ id: `deposit_other_split_${suffix}`, method: "cash", amount: "10.0000" }] },
    }), meta("sale-other"));
    await sales.confirmSale(normalizeConfirmSale({
      id: thirdSaleId, seasonId, customerId, shareIds: [shares[2]!.id], listPricePerShare: "100.0000",
      downPayment: { receiptId: `deposit_third_${suffix}`, receiptNo: `DT-${suffix}`, methodSplits: [{ id: `deposit_third_split_${suffix}`, method: "cash", amount: "10.0000" }] },
    }), meta("sale-third"));
    await sales.recordReceipt(normalizeReceipt({
      id: `receipt_shared_${suffix}`, seasonId, customerId, receiptNo: `RS-${suffix}`, occurredAt: new Date().toISOString(),
      methodSplits: [{ id: `receipt_shared_split_${suffix}`, method: "cash", amount: "2.0000" }],
      allocations: [
        { id: `receipt_shared_other_${suffix}`, saleId: otherSaleId, customerId, shareId: shares[1]!.id, amount: "1.0000" },
        { id: `receipt_shared_third_${suffix}`, saleId: thirdSaleId, customerId, shareId: shares[2]!.id, amount: "1.0000" },
      ],
    }), meta("receipt-shared"));
    await expect(sales.cancelSale({ saleId: otherSaleId, seasonId, reason: "Paylaşımlı tahsilat reddi" }, meta("cancel-shared"))).rejects.toThrowError("SALE_WITH_SHARED_PAYMENT_REQUIRES_REFUND_FLOW");
    await expect(sales.recordReceipt(normalizeReceipt({
      id: `receipt_over_${suffix}`, seasonId, customerId, saleId, receiptNo: `RO-${suffix}`, occurredAt: new Date().toISOString(),
      methodSplits: [{ id: `receipt_over_split_${suffix}`, method: "cash", amount: "91.0000" }],
      allocations: [{ id: `receipt_over_allocation_${suffix}`, saleId, customerId, shareId: shares[0]!.id, amount: "91.0000" }],
    }), meta("receipt-over"))).rejects.toThrowError("PAYMENT_ALLOCATION_EXCEEDS_SALE");
    await sales.recordReceipt(normalizeReceipt({
      id: `receipt_${suffix}`, seasonId, customerId, saleId, receiptNo: `R-${suffix}`, occurredAt: new Date().toISOString(),
      methodSplits: [{ id: `receipt_split_${suffix}`, method: "bank_transfer", amount: "90.0000" }],
      allocations: [{ id: `receipt_allocation_${suffix}`, saleId, customerId, shareId: shares[0]!.id, amount: "90.0000" }],
    }), meta("receipt"));
    await sales.cancelSale({ saleId, seasonId, reason: "Sentetik kontrollü iptal" }, meta("cancel"));
    expect(await db.share.findUniqueOrThrow({ where: { id: shares[0]!.id } })).toMatchObject({ status: "available", customerId: null });
    expect(await db.saleShare.findUniqueOrThrow({ where: { saleId_shareId: { saleId, shareId: shares[0]!.id } } })).toMatchObject({ active: false });
    const account = await db.customerSeasonAccount.findUniqueOrThrow({ where: { customerId_seasonId: { customerId, seasonId } } });
    expect(account.balance.toString()).toBe("178");
    expect(account.debitTotal.toString()).toBe("200");
    expect(account.creditTotal.toString()).toBe("22");
    expect(await db.journalEntry.count({ where: { reversalOfId: { not: null }, seasonId } })).toBe(3);
  });

  test("aynı müşterinin hisse transferi eski bağlantıyı silmez; müşteri değişimi ödeme varken fail-closed kalır", async () => {
    if (!db) throw new Error("TEST_DATABASE_REQUIRED");
    const seasonId = `transfer_season_${suffix}`;
    const customerId = `transfer_customer_${suffix}`;
    const otherCustomerId = `transfer_other_${suffix}`;
    const animalId = `transfer_animal_${suffix}`;
    await db.season.create({ data: { id: seasonId, name: "Sentetik Transfer Sezonu", status: "sales" } });
    await db.customer.createMany({ data: [
      { id: customerId, displayName: "Sentetik Transfer Müşterisi", normalizedName: "TRANSFER MUSTERISI" },
      { id: otherCustomerId, displayName: "Sentetik Diğer Müşteri", normalizedName: "DIGER MUSTERI" },
    ] });
    await new PrismaTenantMasterDataRepository(db).createAnimal({ id: animalId, seasonId, earTag: `TR-${suffix}` }, meta("transfer-animal"));
    const shares = await db.share.findMany({ where: { shareCard: { animalId } }, orderBy: { sequenceNo: "asc" } });
    const sales = new PrismaTenantSalesFinanceRepository(db);
    const saleId = `transfer_sale_${suffix}`;
    await sales.confirmSale(normalizeConfirmSale({ id: saleId, seasonId, customerId, shareIds: [shares[0]!.id], listPricePerShare: "100.0000", downPayment: { receiptId: `transfer_deposit_${suffix}`, receiptNo: `TD-${suffix}`, methodSplits: [{ id: `transfer_split_${suffix}`, method: "cash", amount: "10.0000" }] } }), meta("transfer-sale"));
    await expect(sales.transferShare({ id: `customer_transfer_${suffix}`, seasonId, sourceShareId: shares[0]!.id, targetShareId: shares[1]!.id, toCustomerId: otherCustomerId, reason: "Sentetik müşteri değişimi" }, meta("customer-transfer"))).rejects.toThrowError("CUSTOMER_TRANSFER_WITH_PAYMENT_REQUIRES_REVERSAL_FLOW");
    await sales.transferShare({ id: `share_transfer_${suffix}`, seasonId, sourceShareId: shares[0]!.id, targetShareId: shares[1]!.id, toCustomerId: customerId, reason: "Sentetik hayvan içi hisse değişimi" }, meta("share-transfer"));
    const history = await db.saleShare.findMany({ where: { saleId }, orderBy: { shareId: "asc" } });
    expect(history).toHaveLength(2);
    expect(history.filter((item) => item.active).map((item) => item.shareId)).toEqual([shares[1]!.id]);
    expect(await db.shareTransfer.count({ where: { saleId } })).toBe(1);
  });

  test("vergili alış, tedarikçi ödeme, gider, padok ve vekâlet kapsamları atomik ve tenant-season güvenlidir", async () => {
    if (!db) throw new Error("TEST_DATABASE_REQUIRED");
    const seasonId = `master_season_${suffix}`;
    const supplierId = `master_supplier_${suffix}`;
    const customerId = `master_customer_${suffix}`;
    const animalId = `master_animal_${suffix}`;
    await db.season.create({ data: { id: seasonId, name: "Sentetik Ana Veri Sezonu", status: "sales" } });
    await db.supplier.create({ data: { id: supplierId, displayName: "Sentetik Tedarikçi", normalizedName: "SENTETIK TEDARIKCI" } });
    await db.customer.create({ data: { id: customerId, displayName: "Sentetik Vekâlet Veren", normalizedName: "SENTETIK VEKALET VEREN" } });
    const master = new PrismaTenantMasterDataRepository(db);
    await master.postPurchaseInvoice({ id: `master_invoice_${suffix}`, supplierId, seasonId, invoiceNo: `MI-${suffix}`, invoiceDate: new Date().toISOString(), subtotal: "100.0000", taxTotal: "20.0000", grandTotal: "120.0000", lines: [{ id: `master_line_${suffix}`, description: "Sentetik hayvan", quantity: "1.000", unitPrice: "100.0000", lineTotal: "100.0000", animal: { id: animalId, earTag: `MD-${suffix}` } }] }, meta("master-invoice"));
    const invoiceJournal = await db.journalEntry.findUniqueOrThrow({ where: { sourceType_sourceId: { sourceType: "invoice", sourceId: `master_invoice_${suffix}` } }, include: { lines: { include: { account: true } } } });
    expect(invoiceJournal.lines.map((line) => [line.account.code, line.side, line.amount.toString()]).sort()).toEqual([["ACCOUNTS_PAYABLE", "credit", "120"], ["INPUT_TAX", "debit", "20"], ["INVENTORY", "debit", "100"]]);
    await master.recordSupplierPayment({ id: `master_payment_${suffix}`, supplierId, seasonId, amount: "20.0000", method: "bank", occurredAt: new Date().toISOString() }, meta("master-payment"));
    await master.recordExpense({ id: `master_expense_${suffix}`, seasonId, category: "Nakliye", description: "Sentetik nakliye", amount: "5.0000", sourceType: "manual", sourceRef: `EXP-${suffix}`, occurredAt: new Date().toISOString() }, meta("master-expense"));
    expect(await db.journalEntry.count({ where: { sourceType: { in: ["supplier_payment", "expense"] }, seasonId } })).toBe(2);

    const paddockId = `paddock_${suffix}`;
    await master.createPaddock({ id: paddockId, seasonId, code: "P1", name: "Sentetik Padok", capacity: 1 }, meta("paddock"));
    await master.assignAnimalToPaddock({ id: `paddock_assignment_${suffix}`, seasonId, animalId, paddockId }, meta("paddock-assign"));
    expect(await db.animalPaddockAssignment.count({ where: { animalId, active: true } })).toBe(1);

    const share = await db.share.findFirstOrThrow({ where: { shareCard: { animalId } } });
    await db.share.update({ where: { id: share.id }, data: { status: "sold", customerId } });
    const operations = new PrismaTenantOperationsRepository(db);
    await operations.createProxyDocument({ id: `proxy_${suffix}`, seasonId, grantorCustomerId: customerId, shareIds: [share.id], method: "face_to_face_oral", storageKey: `vekalet://proxy_${suffix}.pdf`, mimeType: "application/pdf", sizeBytes: 128, status: "signed" }, meta("proxy"));
    await expect(operations.createProxyDocument({ id: `proxy_invalid_${suffix}`, seasonId, grantorCustomerId: `unknown_${suffix}`, shareIds: [share.id], method: "phone", storageKey: `vekalet://proxy_invalid_${suffix}.pdf`, status: "signed" }, meta("proxy-invalid"))).rejects.toThrowError("PROXY_GRANTOR_SHARE_MISMATCH");
    expect(await operations.getProxyDocument({ id: `proxy_${suffix}`, seasonId })).toMatchObject({ customerId, mimeType: "application/pdf", sizeBytes: 128 });
  });
});

afterAll(async () => {
  await db?.$disconnect();
});

function meta(scope: string): CommandMeta {
  return { organizationId: `org_${suffix}`, actorUserId: `actor_${suffix}`, requestId: `request_${scope}_${randomUUID()}`, idempotencyKey: `idem_${scope}_${randomUUID()}`, requestHash: randomUUID().replaceAll("-", "").padEnd(64, "0"), occurredAt: new Date() };
}
