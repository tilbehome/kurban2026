import { createHash, randomUUID } from "node:crypto";
import type { Prisma, PrismaClient } from "@/packages/database-tenant/generated/client";
import { paymentStatus, reverseSide, type AccountingStatus } from "../../domain/invoice";
import type { CalculatedInvoiceDraftInput, InvoiceActorContext, InvoiceDraftInput, InvoiceListFilter, InvoiceRecord, InvoiceRepository } from "../../application/invoice-service";

export class PrismaInvoiceRepository implements InvoiceRepository {
  constructor(private readonly db: PrismaClient) {}

  async createDraft(input: CalculatedInvoiceDraftInput, context: InvoiceActorContext): Promise<{ id: string }> {
    return this.db.$transaction(async (tx) => {
      const replay = await tx.tenantIdempotencyRecord.findUnique({ where: { key: context.idempotencyKey } });
      if (replay) {
        if (replay.scope !== "invoice.create" || replay.requestHash !== stableDraftHash(input) || !replay.resultId) throw new Error("IDEMPOTENCY_KEY_REUSED");
        return { id: replay.resultId };
      }
      await assertReferences(tx, input, context.organizationId);
      const units = await resolveUnits(tx, context.organizationId, input.lines.map((line) => line.unit));
      await tx.tenantIdempotencyRecord.create({ data: { key: context.idempotencyKey, scope: "invoice.create", actorUserId: context.actorUserId, requestId: context.requestId, requestHash: stableDraftHash(input) } });
      await tx.purchaseInvoice.create({
        data: {
          id: input.id,
          organizationId: context.organizationId,
          supplierId: input.supplierId,
          customerId: input.customerId,
          seasonId: input.seasonId,
          locationId: input.locationId,
          uuid: input.uuid,
          invoiceNo: input.invoiceNo.trim(),
          series: input.series?.trim(),
          invoiceDate: new Date(input.invoiceDate),
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          direction: input.direction,
          tradeType: input.tradeType,
          documentNature: input.documentNature,
          electronicChannel: input.electronicChannel,
          electronicStatus: input.electronicChannel === "NONE" ? "NOT_APPLICABLE" : "PREPARING",
          currency: input.currency,
          partyTaxIdentity: input.partyTaxIdentity,
          partySnapshot: json(input.partySnapshot),
          subtotal: input.subtotal,
          discountTotal: input.discountTotal,
          taxTotal: input.taxTotal,
          grandTotal: input.grandTotal,
          idempotencyKey: context.idempotencyKey,
          requestId: context.requestId,
          originalInvoiceId: input.originalInvoiceId,
          createdByUserId: context.actorUserId,
          lines: {
            create: input.lines.map((line, index) => {
              const unit = units.get(normalizeUnitCode(line.unit));
              if (!unit) throw new Error("INVOICE_UNIT_NOT_CONFIGURED");
              return {
              id: line.id,
              lineNo: index + 1,
              description: line.description.trim(),
              quantity: line.quantity,
              unitId: unit.id,
              unitCodeSnapshot: unit.code,
              unitNameSnapshot: unit.name,
              unitSymbolSnapshot: unit.symbol,
              unitPrice: line.unitPrice,
              discountTotal: line.discountTotal,
              taxTotal: line.taxTotal,
              lineTotal: line.lineTotal,
              animalId: line.animalId,
              shareId: line.shareId,
              saleId: line.saleId,
              purchaseReference: line.purchaseReference,
              expenseDocumentId: line.expenseDocumentId,
            }; }),
          },
          taxComponents: {
            create: input.lines.flatMap((line) => line.taxComponents.map((tax) => ({
              id: tax.id,
              lineId: line.id,
              taxType: tax.type,
              rate: tax.rate,
              taxableAmount: tax.taxableAmount,
              taxAmount: tax.amount,
              exemptionCode: tax.exemptionCode,
            }))),
          },
          timeline: { create: { id: `invoice_event_${randomUUID()}`, type: "CREATED", outcome: "DRAFT", actorUserId: context.actorUserId, requestId: context.requestId, occurredAt: new Date() } },
        },
      });
      await evidence(tx, context, "invoice.created", input.id, { accountingStatus: "DRAFT", electronicChannel: input.electronicChannel });
      await tx.tenantIdempotencyRecord.update({ where: { key: context.idempotencyKey }, data: { status: "completed", resultType: "invoice", resultId: input.id, resultPayload: { id: input.id }, completedAt: new Date() } });
      return { id: input.id };
    }, { isolationLevel: "Serializable" });
  }

  async getById(organizationId: string, id: string): Promise<InvoiceRecord | null> {
    const row = await this.db.purchaseInvoice.findFirst({ where: { id, organizationId } });
    return row ? mapInvoice(row) : null;
  }

  async list(organizationId: string, filter: InvoiceListFilter): Promise<{ items: readonly InvoiceRecord[]; total: number }> {
    const where: Prisma.PurchaseInvoiceWhereInput = {
      organizationId,
      seasonId: filter.seasonId,
      locationId: filter.locationId,
      direction: filter.direction,
      tradeType: filter.tradeType,
      documentNature: filter.documentNature,
      electronicChannel: filter.electronicChannel,
      accountingStatus: filter.accountingStatus,
      paymentStatus: filter.paymentStatus,
      electronicStatus: filter.electronicStatus,
      invoiceDate: filter.from || filter.to ? { gte: filter.from ? new Date(filter.from) : undefined, lte: filter.to ? new Date(filter.to) : undefined } : undefined,
      dueDate: filter.overdueOnly ? { lt: new Date() } : undefined,
      grandTotal: filter.minTotal || filter.maxTotal ? { gte: filter.minTotal, lte: filter.maxTotal } : undefined,
      OR: filter.partyId ? [{ customerId: filter.partyId }, { supplierId: filter.partyId }] : filter.query ? [
        { invoiceNo: { contains: filter.query, mode: "insensitive" } },
        { uuid: { contains: filter.query, mode: "insensitive" } },
      ] : undefined,
    };
    const [rows, total] = await this.db.$transaction([
      this.db.purchaseInvoice.findMany({ where, orderBy: [{ invoiceDate: "desc" }, { createdAt: "desc" }], take: filter.limit, skip: filter.offset }),
      this.db.purchaseInvoice.count({ where }),
    ]);
    return { items: rows.map(mapInvoice), total };
  }

  async transition(input: { organizationId: string; id: string; from: AccountingStatus; to: AccountingStatus; actorUserId: string; requestId: string }): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const changed = await tx.purchaseInvoice.updateMany({ where: { id: input.id, organizationId: input.organizationId, accountingStatus: input.from }, data: {
        accountingStatus: input.to,
        approvedByUserId: input.to === "APPROVED" ? input.actorUserId : undefined,
        approvedAt: input.to === "APPROVED" ? new Date() : undefined,
        cancelledAt: input.to === "CANCELLED" ? new Date() : undefined,
      } });
      if (changed.count !== 1) throw new Error("INVOICE_STATE_CHANGED");
      await tx.invoiceTimelineEvent.create({ data: { id: `invoice_event_${randomUUID()}`, purchaseInvoiceId: input.id, type: "ACCOUNTING_STATUS_CHANGED", outcome: input.to, actorUserId: input.actorUserId, requestId: input.requestId, occurredAt: new Date() } });
      await evidence(tx, input, `invoice.${input.to.toLowerCase()}`, input.id, { from: input.from, to: input.to });
    });
  }

  async post(input: { organizationId: string; id: string; actorUserId: string; requestId: string; idempotencyKey: string }): Promise<{ journalEntryId: string }> {
    return this.db.$transaction(async (tx) => {
      const invoice = await tx.purchaseInvoice.findFirst({ where: { id: input.id, organizationId: input.organizationId }, include: { journalEntry: true } });
      if (!invoice) throw new Error("INVOICE_NOT_FOUND");
      if (invoice.journalEntryId) return { journalEntryId: invoice.journalEntryId };
      if (invoice.accountingStatus !== "APPROVED") throw new Error("INVOICE_NOT_APPROVED");
      const isPurchase = invoice.tradeType === "PURCHASE";
      const isReturn = invoice.documentNature === "RETURN";
      const debitCode = isPurchase ? "INVENTORY" : "ACCOUNTS_RECEIVABLE";
      const creditCode = isPurchase ? "ACCOUNTS_PAYABLE" : "SALES_REVENUE";
      const debit = await financialAccount(tx, debitCode, isPurchase ? "Stok ve Hayvan Maliyeti" : "Müşteri Alacakları", "asset", "debit", invoice.currency);
      const credit = await financialAccount(tx, creditCode, isPurchase ? "Tedarikçi Borçları" : "Satış Gelirleri", isPurchase ? "liability" : "revenue", "credit", invoice.currency);
      const journalEntryId = `journal_invoice_${invoice.id}`;
      const baseLines = [
        { id: `${journalEntryId}_debit`, accountId: debit.id, side: "debit" as const },
        { id: `${journalEntryId}_credit`, accountId: credit.id, side: "credit" as const },
      ];
      await tx.journalEntry.create({ data: {
        id: journalEntryId,
        seasonId: invoice.seasonId,
        sourceType: "invoice",
        sourceId: invoice.id,
        currency: invoice.currency,
        memo: "INVOICE_POSTED",
        idempotencyKey: input.idempotencyKey,
        occurredAt: invoice.invoiceDate,
        postedAt: new Date(),
        lines: { create: baseLines.map((line) => ({ id: line.id, accountId: line.accountId, side: isReturn ? reverseSide(line.side) : line.side, amount: invoice.grandTotal, currency: invoice.currency, customerId: invoice.customerId, memo: "INVOICE_BALANCED_ENTRY" })) },
      } });
      if (isPurchase && invoice.supplierId) await updateSupplierBalance(tx, invoice.supplierId, invoice.seasonId, invoice.grandTotal.toString(), isReturn);
      if (!isPurchase && invoice.customerId) await updateCustomerBalance(tx, invoice.customerId, invoice.seasonId, invoice.grandTotal.toString(), isReturn);
      const changed = await tx.purchaseInvoice.updateMany({ where: { id: invoice.id, accountingStatus: "APPROVED", journalEntryId: null }, data: { accountingStatus: "POSTED", journalEntryId, postedByUserId: input.actorUserId, postedAt: new Date() } });
      if (changed.count !== 1) throw new Error("INVOICE_ALREADY_POSTED");
      await tx.invoiceTimelineEvent.create({ data: { id: `invoice_event_${randomUUID()}`, purchaseInvoiceId: invoice.id, type: "POSTED", outcome: "BALANCED", actorUserId: input.actorUserId, requestId: input.requestId, occurredAt: new Date(), safeMetadata: { journalEntryId } } });
      await evidence(tx, input, "invoice.posted", invoice.id, { journalEntryId });
      return { journalEntryId };
    }, { isolationLevel: "Serializable" });
  }

  async allocatePayment(input: { organizationId: string; id: string; receiptId?: string; supplierPaymentId?: string; amount: string; allocationId: string; actorUserId: string; requestId: string; idempotencyKey: string }): Promise<{ paymentStatus: string; paidTotal: string }> {
    return this.db.$transaction(async (tx) => {
      const invoice = await tx.purchaseInvoice.findFirst({ where: { id: input.id, organizationId: input.organizationId }, include: { paymentAllocations: true } });
      if (!invoice || invoice.accountingStatus !== "POSTED") throw new Error("INVOICE_NOT_POSTED");
      if (input.receiptId) {
        const receipt = await tx.receipt.findUnique({ where: { id: input.receiptId } });
        if (!receipt || receipt.seasonId !== invoice.seasonId || receipt.customerId !== invoice.customerId) throw new Error("INVOICE_RECEIPT_SCOPE_MISMATCH");
      }
      if (input.supplierPaymentId) {
        const payment = await tx.supplierPayment.findUnique({ where: { id: input.supplierPaymentId } });
        if (!payment || payment.seasonId !== invoice.seasonId || payment.supplierId !== invoice.supplierId) throw new Error("INVOICE_SUPPLIER_PAYMENT_SCOPE_MISMATCH");
      }
      if (!/^\d+(?:\.\d{1,4})?$/.test(input.amount) || toUnits(input.amount) <= BigInt(0)) throw new Error("INVOICE_ALLOCATION_AMOUNT_INVALID");
      await tx.invoicePaymentAllocation.create({ data: { id: input.allocationId, purchaseInvoiceId: invoice.id, receiptId: input.receiptId, supplierPaymentId: input.supplierPaymentId, amount: input.amount, currency: invoice.currency, idempotencyKey: input.idempotencyKey } });
      const paidUnits = invoice.paymentAllocations.reduce((sum, item) => sum + toUnits(item.amount.toString()), BigInt(0)) + toUnits(input.amount);
      const paidTotal = fromUnits(paidUnits);
      const status = paymentStatus(invoice.grandTotal.toString(), paidTotal);
      await tx.purchaseInvoice.update({ where: { id: invoice.id }, data: { paidTotal, paymentStatus: status } });
      await tx.invoiceTimelineEvent.create({ data: { id: `invoice_event_${randomUUID()}`, purchaseInvoiceId: invoice.id, type: "PAYMENT_ALLOCATED", outcome: status, actorUserId: input.actorUserId, requestId: input.requestId, occurredAt: new Date(), safeMetadata: { allocationId: input.allocationId } } });
      await evidence(tx, input, "invoice.payment_allocated", invoice.id, { allocationId: input.allocationId, paymentStatus: status });
      return { paymentStatus: status, paidTotal };
    }, { isolationLevel: "Serializable" });
  }

  async enqueueElectronicDocument(input: { organizationId: string; id: string; deliveryId: string; providerKey: string; correlationId: string; actorUserId: string; requestId: string; idempotencyKey: string }): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const invoice = await tx.purchaseInvoice.findFirst({ where: { id: input.id, organizationId: input.organizationId }, include: { lines: { select: { unitId: true } } } });
      if (!invoice || invoice.accountingStatus !== "POSTED" || invoice.electronicChannel === "NONE") throw new Error("INVOICE_E_DOCUMENT_NOT_SENDABLE");
      const connection = await tx.electronicDocumentConnection.findFirst({ where: { organizationId: input.organizationId, providerKey: input.providerKey, active: true }, orderBy: { updatedAt: "desc" } });
      if (!connection) throw new Error("E_DOCUMENT_ACTIVE_CONNECTION_REQUIRED");
      const unitIds = [...new Set(invoice.lines.map((line) => line.unitId))];
      const mappings = await tx.unitProviderMapping.findMany({ where: { tenantId: input.organizationId, providerKey: input.providerKey, mappingVersion: connection.unitMappingVersion, unitOfMeasureId: { in: unitIds }, isActive: true }, select: { unitOfMeasureId: true } });
      if (new Set(mappings.map((mapping) => mapping.unitOfMeasureId)).size !== unitIds.length) throw new Error("E_DOCUMENT_UNIT_MAPPING_REQUIRED");
      await tx.electronicDocumentDelivery.create({ data: { id: input.deliveryId, purchaseInvoiceId: invoice.id, providerKey: input.providerKey, operation: "SEND", status: "QUEUED", correlationId: input.correlationId, idempotencyKey: input.idempotencyKey } });
      await tx.purchaseInvoice.update({ where: { id: invoice.id }, data: { providerKey: input.providerKey, electronicStatus: "QUEUED" } });
      await tx.tenantOutboxMessage.create({ data: { id: `outbox_${randomUUID()}`, topic: "einvoice.delivery.requested", payload: { invoiceId: invoice.id, deliveryId: input.deliveryId, providerKey: input.providerKey, correlationId: input.correlationId }, status: "pending", idempotencyKey: input.idempotencyKey } });
      await tx.invoiceTimelineEvent.create({ data: { id: `invoice_event_${randomUUID()}`, purchaseInvoiceId: invoice.id, type: "E_DOCUMENT_QUEUED", outcome: "QUEUED", actorUserId: input.actorUserId, requestId: input.requestId, occurredAt: new Date(), safeMetadata: { providerKey: input.providerKey, correlationId: input.correlationId } } });
      await evidence(tx, input, "einvoice.queued", invoice.id, { providerKey: input.providerKey, correlationId: input.correlationId });
    });
  }
}

function mapInvoice(row: {
  id: string; organizationId: string; accountingStatus: string; paymentStatus: string; electronicStatus: string; electronicChannel: string; grandTotal: { toString(): string }; paidTotal: { toString(): string }; tradeType: string; documentNature: string; originalInvoiceId: string | null; supplierId: string | null; customerId: string | null; journalEntryId: string | null; invoiceNo: string; uuid: string; invoiceDate: Date; dueDate: Date | null; currency: string; direction: string;
}): InvoiceRecord {
  return { id: row.id, organizationId: row.organizationId, accountingStatus: row.accountingStatus as InvoiceRecord["accountingStatus"], paymentStatus: row.paymentStatus, electronicStatus: row.electronicStatus, electronicChannel: row.electronicChannel as InvoiceRecord["electronicChannel"], grandTotal: row.grandTotal.toString(), paidTotal: row.paidTotal.toString(), tradeType: row.tradeType as InvoiceRecord["tradeType"], documentNature: row.documentNature as InvoiceRecord["documentNature"], originalInvoiceId: row.originalInvoiceId ?? undefined, supplierId: row.supplierId ?? undefined, customerId: row.customerId ?? undefined, journalEntryId: row.journalEntryId ?? undefined, invoiceNo: row.invoiceNo, uuid: row.uuid, invoiceDate: row.invoiceDate.toISOString(), dueDate: row.dueDate?.toISOString(), currency: row.currency, direction: row.direction as InvoiceRecord["direction"] };
}

async function assertReferences(tx: Prisma.TransactionClient, input: InvoiceDraftInput, organizationId: string): Promise<void> {
  const season = await tx.season.findUnique({ where: { id: input.seasonId } });
  if (!season || season.status === "archived") throw new Error("INVOICE_SEASON_NOT_WRITABLE");
  if (input.locationId && season.locationId !== input.locationId) throw new Error("INVOICE_LOCATION_SEASON_MISMATCH");
  if (input.originalInvoiceId) {
    const original = await tx.purchaseInvoice.findFirst({ where: { id: input.originalInvoiceId, organizationId, seasonId: input.seasonId, tradeType: input.tradeType, documentNature: "STANDARD", accountingStatus: "POSTED" } });
    if (!original) throw new Error("INVOICE_RETURN_ORIGINAL_INVALID");
  }
}

async function resolveUnits(tx: Prisma.TransactionClient, organizationId: string, codes: readonly string[]) {
  const normalized = [...new Set(codes.map(normalizeUnitCode))];
  const rows = await tx.unitOfMeasure.findMany({ where: { tenantId: { in: ["SYSTEM", organizationId] }, code: { in: normalized }, isActive: true } });
  const result = new Map<string, { id: string; code: string; name: string; symbol: string }>();
  for (const row of rows.sort((a, b) => Number(a.isSystem) - Number(b.isSystem))) {
    if (result.has(row.code)) throw new Error("INVOICE_UNIT_SCOPE_AMBIGUOUS");
    result.set(row.code, row);
  }
  if (normalized.some((code) => !result.has(code))) throw new Error("INVOICE_UNIT_NOT_CONFIGURED");
  return result;
}

function normalizeUnitCode(value: string): string {
  const code = value.trim().toLocaleUpperCase("tr-TR");
  if (!/^[A-ZÇĞİÖŞÜ0-9._-]{1,24}$/.test(code)) throw new Error("INVOICE_UNIT_CODE_INVALID");
  return code;
}

async function financialAccount(tx: Prisma.TransactionClient, code: string, name: string, type: string, normalSide: string, currency: string) {
  return tx.financialAccount.upsert({ where: { code }, create: { id: `financial_account_${code.toLowerCase()}`, code, name, type, normalSide, currency }, update: {} });
}

async function updateSupplierBalance(tx: Prisma.TransactionClient, supplierId: string, seasonId: string, amount: string, reverse: boolean) {
  await tx.supplierAccount.upsert({ where: { supplierId_seasonId: { supplierId, seasonId } }, create: { id: `supplier_account_${supplierId}_${seasonId}`, supplierId, seasonId, debitTotal: reverse ? "0" : amount, creditTotal: reverse ? amount : "0", balance: reverse ? `-${amount}` : amount }, update: reverse ? { creditTotal: { increment: amount }, balance: { decrement: amount } } : { debitTotal: { increment: amount }, balance: { increment: amount } } });
}

async function updateCustomerBalance(tx: Prisma.TransactionClient, customerId: string, seasonId: string, amount: string, reverse: boolean) {
  await tx.customerSeasonAccount.upsert({ where: { customerId_seasonId: { customerId, seasonId } }, create: { id: `customer_account_${customerId}_${seasonId}`, customerId, seasonId, debitTotal: reverse ? "0" : amount, creditTotal: reverse ? amount : "0", balance: reverse ? `-${amount}` : amount }, update: reverse ? { creditTotal: { increment: amount }, balance: { decrement: amount } } : { debitTotal: { increment: amount }, balance: { increment: amount } } });
}

async function evidence(tx: Prisma.TransactionClient, context: { actorUserId: string; requestId: string; idempotencyKey?: string }, action: string, targetId: string, metadata: Record<string, unknown>) {
  await tx.tenantAuditLog.create({ data: { id: `audit_${randomUUID()}`, actorUserId: context.actorUserId, action, targetType: "PurchaseInvoice", targetId, requestId: context.requestId, occurredAt: new Date(), metadata: json(metadata) } });
  await tx.tenantOutboxMessage.create({ data: { id: `outbox_${randomUUID()}`, topic: action, payload: json({ invoiceId: targetId, requestId: context.requestId, ...metadata }), status: "pending", idempotencyKey: context.idempotencyKey } });
}

function stableDraftHash(input: InvoiceDraftInput): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function toUnits(value: string): bigint {
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * BigInt(10_000) + BigInt(fraction.padEnd(4, "0").slice(0, 4));
}

function fromUnits(value: bigint): string {
  return `${value / BigInt(10_000)}.${(value % BigInt(10_000)).toString().padStart(4, "0")}`;
}
