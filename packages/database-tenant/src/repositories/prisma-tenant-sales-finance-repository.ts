import { randomUUID } from "node:crypto";
import {
  buildReceiptJournalLines,
  buildSaleJournalLines,
  assertShareEligibleForSale,
  TenantSalesFinanceError,
  type CancelSaleInput,
  type CommandMeta,
  type ExpireReservationsInput,
  type NormalizedConfirmSaleInput,
  type NormalizedPublishPriceTariffInput,
  type NormalizedRecordReceiptInput,
  type NormalizedReserveShareInput,
  type ShareAvailability,
  type TenantSalesFinanceRepository,
  type TransferShareInput,
  decimal,
  type DecimalString,
  type JournalLineDraft,
} from "@tilbecore/tenant-core";
import type { Prisma, PrismaClient } from "../../generated/client";

type Tx = Prisma.TransactionClient;
type CommandResult = { id?: string; versionId?: string; shareId?: string; receiptId?: string; journalEntryId?: string; journalEntryIds?: string[]; expiredCount?: number; shareIds?: string[] };

export class PrismaTenantSalesFinanceRepository implements TenantSalesFinanceRepository {
  constructor(private readonly db: PrismaClient) {}

  async getSeason(id: string) {
    const season = await this.db.season.findUnique({ where: { id }, select: { id: true, status: true } });
    return season ? { id: season.id, status: season.status } : null;
  }

  async listShareAvailability(seasonId: string): Promise<ShareAvailability[]> {
    const rows = await this.db.share.findMany({
      where: { shareCard: { seasonId } },
      include: { shareCard: { include: { animal: true } } },
      orderBy: [{ shareCardId: "asc" }, { sequenceNo: "asc" }],
    });
    return rows.map((row) => ({
      id: row.id,
      seasonId: row.shareCard.seasonId,
      shareCardId: row.shareCardId,
      sequenceNo: row.sequenceNo,
      status: row.status as ShareAvailability["status"],
      customerId: row.customerId ?? undefined,
      reservedByCustomerId: row.reservedByCustomerId ?? undefined,
      reservedUntil: row.reservedUntil?.toISOString(),
      qurbanEligibility: row.shareCard.animal.qurbanEligibility,
    }));
  }

  publishPriceTariff(input: NormalizedPublishPriceTariffInput, meta: CommandMeta) {
    return this.command("pricing.tariff.publish", meta, async (tx) => {
      await lockSeason(tx, input.seasonId, ["preparation", "sales"]);
      await tx.priceTariff.upsert({
        where: { id: input.id },
        create: { id: input.id, seasonId: input.seasonId, name: input.name.trim(), status: "active" },
        update: { name: input.name.trim(), status: "active" },
      });
      await tx.priceTariffVersion.updateMany({ where: { priceTariffId: input.id, status: "published" }, data: { status: "retired" } });
      await tx.priceTariffVersion.create({
        data: {
          id: input.versionId,
          priceTariffId: input.id,
          version: input.version,
          status: "published",
          validFrom: input.validFrom ? new Date(input.validFrom) : meta.occurredAt,
          validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
          publishedAt: meta.occurredAt,
          createdByUserId: meta.actorUserId,
          changeReason: input.changeReason,
          items: { create: input.items.map((item) => ({ ...item, listPrice: item.listPrice, minDepositAmount: item.minDepositAmount })) },
        },
      });
      await evidence(tx, meta, "pricing.tariff.published", "PriceTariffVersion", input.versionId, { seasonId: input.seasonId, itemCount: input.items.length });
      return { id: input.id, versionId: input.versionId };
    });
  }

  reserveShare(input: NormalizedReserveShareInput, meta: CommandMeta) {
    return this.command("share.reserve", meta, async (tx) => {
      await lockSeason(tx, input.seasonId, ["sales"]);
      const share = await lockedShare(tx, input.shareId);
      assertShareInSeason(share, input.seasonId);
      assertShareEligibleForSale(mapAvailability(share), input.customerId, meta.occurredAt);
      if (share.status === "reserved" && share.reservedByCustomerId === input.customerId) {
        await tx.shareReservation.updateMany({ where: { shareId: input.shareId, status: "active" }, data: { status: "cancelled", cancelledAt: meta.occurredAt, reason: "renewed" } });
      }
      await tx.shareReservation.create({
        data: { id: input.id, seasonId: input.seasonId, shareId: input.shareId, customerId: input.customerId, reservedUntil: new Date(input.reservedUntil), reason: input.reason, idempotencyKey: meta.idempotencyKey },
      });
      await tx.share.update({
        where: { id: input.shareId },
        data: { status: "reserved", reservedByCustomerId: input.customerId, customerId: null, reservedUntil: new Date(input.reservedUntil), reservationId: input.id },
      });
      await evidence(tx, meta, "share.reserved", "Share", input.shareId, { customerId: input.customerId, reservedUntil: input.reservedUntil });
      return { id: input.id, shareId: input.shareId };
    });
  }

  expireReservations(input: ExpireReservationsInput, meta: CommandMeta) {
    return this.command("share.reservation.expire", meta, async (tx) => {
      await lockSeason(tx, input.seasonId, ["sales", "slaughter", "delivery", "reconciliation"]);
      const now = new Date(input.now);
      const reservations = await tx.shareReservation.findMany({
        where: { seasonId: input.seasonId, status: "active", reservedUntil: { lte: now } },
        orderBy: { reservedUntil: "asc" },
        take: input.limit ?? 100,
        select: { id: true, shareId: true },
      });
      const shareIds = reservations.map((reservation) => reservation.shareId);
      if (shareIds.length > 0) {
        await tx.shareReservation.updateMany({ where: { id: { in: reservations.map((item) => item.id) } }, data: { status: "expired", expiredAt: now } });
        await tx.share.updateMany({
          where: { id: { in: shareIds }, status: "reserved", customerId: null },
          data: { status: "available", reservedByCustomerId: null, reservedUntil: null, reservationId: null },
        });
      }
      await evidence(tx, meta, "share.reservation.expired", "ShareReservation", input.seasonId, { expiredCount: shareIds.length, shareIds });
      return { expiredCount: shareIds.length, shareIds };
    });
  }

  confirmSale(input: NormalizedConfirmSaleInput, meta: CommandMeta) {
    return this.command("sale.confirm", meta, async (tx) => {
      await lockSeason(tx, input.seasonId, ["sales"]);
      const shares = await lockedShares(tx, input.shareIds);
      if (shares.length !== input.shareIds.length) throw new TenantSalesFinanceError("SHARES_NOT_FOUND");
      for (const share of shares) {
        assertShareInSeason(share, input.seasonId);
        assertShareEligibleForSale(mapAvailability(share), input.customerId, meta.occurredAt);
      }
      await tx.sale.create({
        data: {
          id: input.id,
          seasonId: input.seasonId,
          customerId: input.customerId,
          payerCustomerId: input.payerCustomerId,
          status: "confirmed",
          listPriceSnapshot: input.listPriceTotal,
          priceSnapshot: input.agreedPriceTotal,
          discountAmount: input.discountTotal,
          downPaymentAmount: input.downPayment.totalAmount,
          confirmedAt: meta.occurredAt,
          idempotencyKey: meta.idempotencyKey,
          shares: {
            create: shares.map((share) => ({
              shareId: share.id,
              listPriceSnapshot: input.listPricePerShare,
              discountAmountSnapshot: input.discountPerShare,
              agreedPriceSnapshot: input.agreedPricePerShare,
            })),
          },
        },
      });
      const saleJournal = await createJournalEntry(tx, {
        seasonId: input.seasonId,
        sourceType: "sale",
        sourceId: input.id,
        idempotencyKey: `${meta.idempotencyKey}:sale-journal`,
        occurredAt: meta.occurredAt,
        lines: buildSaleJournalLines(input),
      });
      await tx.share.updateMany({
        where: { id: { in: [...input.shareIds] }, status: { in: ["available", "reserved"] } },
        data: {
          status: "sold",
          customerId: input.customerId,
          reservedByCustomerId: null,
          reservedUntil: null,
          reservationId: null,
          listPriceSnapshot: input.listPricePerShare,
          discountAmountSnapshot: input.discountPerShare,
          agreedPrice: input.agreedPricePerShare,
          soldAt: meta.occurredAt,
        },
      });
      await tx.shareReservation.updateMany({ where: { shareId: { in: [...input.shareIds] }, status: "active" }, data: { status: "confirmed", confirmedAt: meta.occurredAt, saleId: input.id } });
      await tx.customerSeasonAccount.upsert({
        where: { customerId_seasonId: { customerId: input.customerId, seasonId: input.seasonId } },
        create: { id: `account_${input.customerId}_${input.seasonId}`, customerId: input.customerId, seasonId: input.seasonId, debitTotal: input.agreedPriceTotal, balance: input.agreedPriceTotal },
        update: { debitTotal: { increment: input.agreedPriceTotal }, balance: { increment: input.agreedPriceTotal } },
      });
      const receipt = await createReceipt(tx, {
        id: input.downPayment.receiptId,
        seasonId: input.seasonId,
        customerId: input.customerId,
        payerCustomerId: input.payerCustomerId,
        saleId: input.id,
        receiptNo: input.downPayment.receiptNo,
        totalAmount: input.downPayment.totalAmount,
        methodSplits: input.downPayment.methodSplits,
        allocations: input.shareIds.map((shareId, index) => ({ id: `allocation_${input.downPayment.receiptId}_${index + 1}`, saleId: input.id, customerId: input.customerId, shareId, amount: splitEvenly(input.downPayment.totalAmount, input.shareIds.length, index) })),
        occurredAt: meta.occurredAt.toISOString(),
      }, meta);
      await tx.saleEvent.create({ data: { id: `sale_event_${randomUUID()}`, saleId: input.id, type: "confirmed", actorUserId: meta.actorUserId, occurredAt: meta.occurredAt, payload: { shareIds: input.shareIds, saleJournalEntryId: saleJournal.id, receiptId: receipt.id } } });
      await evidence(tx, meta, "sale.confirmed", "Sale", input.id, { shareIds: input.shareIds, customerId: input.customerId, receiptId: receipt.id });
      return { id: input.id, receiptId: receipt.id, journalEntryIds: [saleJournal.id, receipt.journalEntryId] };
    });
  }

  recordReceipt(input: NormalizedRecordReceiptInput, meta: CommandMeta) {
    return this.command("receipt.record", meta, async (tx) => {
      await lockSeason(tx, input.seasonId, ["sales", "slaughter", "delivery", "reconciliation"]);
      const receipt = await createReceipt(tx, input, meta);
      await evidence(tx, meta, "receipt.recorded", "Receipt", receipt.id, { customerId: input.customerId, saleId: input.saleId ?? null, totalAmount: input.totalAmount });
      return receipt;
    });
  }

  cancelSale(input: CancelSaleInput, meta: CommandMeta) {
    return this.command("sale.cancel", meta, async (tx) => {
      await lockSeason(tx, input.seasonId, ["sales", "slaughter", "delivery", "reconciliation"]);
      const sale = await tx.sale.findUnique({ where: { id: input.saleId }, include: { shares: true } });
      if (!sale || sale.seasonId !== input.seasonId) throw new TenantSalesFinanceError("SALE_NOT_FOUND");
      if (sale.status !== "confirmed") throw new TenantSalesFinanceError("SALE_NOT_CANCELLABLE");
      const paid = await tx.paymentAllocation.aggregate({ where: { saleId: sale.id }, _sum: { amount: true } });
      if ((paid._sum.amount?.toString() ?? "0") !== "0" && paid._sum.amount !== null) throw new TenantSalesFinanceError("SALE_WITH_PAYMENT_REQUIRES_REVERSAL_FLOW");
      await tx.sale.update({ where: { id: sale.id }, data: { status: "cancelled", cancelledAt: meta.occurredAt, cancellationReason: input.reason } });
      await tx.share.updateMany({ where: { id: { in: sale.shares.map((item) => item.shareId) }, status: "sold" }, data: { status: "available", customerId: null, agreedPrice: null, soldAt: null, cancelledAt: meta.occurredAt, cancellationReason: input.reason } });
      await tx.customerSeasonAccount.updateMany({ where: { customerId: sale.customerId, seasonId: sale.seasonId }, data: { debitTotal: { decrement: sale.priceSnapshot }, balance: { decrement: sale.priceSnapshot } } });
      await tx.saleEvent.create({ data: { id: `sale_event_${randomUUID()}`, saleId: sale.id, type: "cancelled", reason: input.reason, actorUserId: meta.actorUserId, occurredAt: meta.occurredAt } });
      await evidence(tx, meta, "sale.cancelled", "Sale", sale.id, { reason: input.reason });
      return { id: sale.id };
    });
  }

  transferShare(input: TransferShareInput, meta: CommandMeta) {
    return this.command("share.transfer", meta, async (tx) => {
      await lockSeason(tx, input.seasonId, ["sales", "slaughter", "delivery", "reconciliation"]);
      const locked = await lockedShares(tx, [input.sourceShareId, input.targetShareId]);
      const source = locked.find((share) => share.id === input.sourceShareId);
      const target = locked.find((share) => share.id === input.targetShareId);
      if (!source || !target) throw new TenantSalesFinanceError("SHARES_NOT_FOUND");
      assertShareInSeason(source, input.seasonId);
      assertShareInSeason(target, input.seasonId);
      if (source.status !== "sold" || !source.customerId) throw new TenantSalesFinanceError("SOURCE_SHARE_NOT_TRANSFERABLE");
      if (target.status !== "available") throw new TenantSalesFinanceError("TARGET_SHARE_NOT_AVAILABLE");
      if (target.shareCard.animal.qurbanEligibility === "blocked" || target.shareCard.animal.qurbanEligibility === "not_eligible") throw new TenantSalesFinanceError("QURBAN_ELIGIBILITY_BLOCKED");
      const saleShare = await tx.saleShare.findFirst({ where: { shareId: source.id }, include: { sale: true } });
      await tx.share.update({ where: { id: target.id }, data: { status: "sold", customerId: input.toCustomerId, agreedPrice: source.agreedPrice, listPriceSnapshot: source.listPriceSnapshot, discountAmountSnapshot: source.discountAmountSnapshot, soldAt: meta.occurredAt } });
      await tx.share.update({ where: { id: source.id }, data: { status: "available", customerId: null, agreedPrice: null, soldAt: null } });
      if (saleShare) {
        await tx.saleShare.delete({ where: { saleId_shareId: { saleId: saleShare.saleId, shareId: source.id } } });
        await tx.saleShare.create({ data: { saleId: saleShare.saleId, shareId: target.id, listPriceSnapshot: saleShare.listPriceSnapshot, discountAmountSnapshot: saleShare.discountAmountSnapshot, agreedPriceSnapshot: saleShare.agreedPriceSnapshot } });
      }
      await tx.shareTransfer.create({ data: { id: input.id, seasonId: input.seasonId, sourceShareId: source.id, targetShareId: target.id, fromCustomerId: source.customerId, toCustomerId: input.toCustomerId, saleId: saleShare?.saleId, reason: input.reason, occurredAt: meta.occurredAt } });
      await tx.saleEvent.create({ data: { id: `sale_event_${randomUUID()}`, saleId: saleShare?.saleId, shareId: target.id, type: "share_transferred", reason: input.reason, actorUserId: meta.actorUserId, occurredAt: meta.occurredAt, payload: { sourceShareId: source.id, targetShareId: target.id } } });
      await evidence(tx, meta, "share.transferred", "ShareTransfer", input.id, { sourceShareId: source.id, targetShareId: target.id, toCustomerId: input.toCustomerId });
      return { id: input.id };
    });
  }

  private async command<TResult extends CommandResult>(scope: string, meta: CommandMeta, handler: (tx: Tx) => Promise<TResult>): Promise<TResult> {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.tenantIdempotencyRecord.findUnique({ where: { key: meta.idempotencyKey } });
      if (existing) {
        if (existing.scope !== scope || existing.requestHash !== meta.requestHash) throw new TenantSalesFinanceError("IDEMPOTENCY_KEY_REUSED");
        if (existing.status !== "completed" || !existing.resultPayload) throw new TenantSalesFinanceError("IDEMPOTENCY_REQUEST_IN_PROGRESS");
        return existing.resultPayload as unknown as TResult;
      }
      await tx.tenantIdempotencyRecord.create({ data: { key: meta.idempotencyKey, scope, actorUserId: meta.actorUserId, requestId: meta.requestId, requestHash: meta.requestHash } });
      await ensureFinancialAccounts(tx);
      const result = await handler(tx);
      await tx.tenantIdempotencyRecord.update({ where: { key: meta.idempotencyKey }, data: { status: "completed", resultType: scope, resultId: result.id, resultPayload: JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue, completedAt: meta.occurredAt } });
      return result;
    }, { isolationLevel: "Serializable" });
  }
}

async function createReceipt(tx: Tx, input: Omit<NormalizedRecordReceiptInput, "occurredAt"> & { occurredAt: string }, meta: CommandMeta): Promise<{ id: string; journalEntryId: string }> {
  const journal = await createJournalEntry(tx, {
    seasonId: input.seasonId,
    sourceType: "receipt",
    sourceId: input.id,
    idempotencyKey: `${meta.idempotencyKey}:receipt-journal:${input.id}`,
    occurredAt: new Date(input.occurredAt),
    lines: buildReceiptJournalLines(input),
  });
  await tx.receipt.create({
    data: {
      id: input.id,
      seasonId: input.seasonId,
      customerId: input.customerId,
      payerCustomerId: input.payerCustomerId,
      saleId: input.saleId,
      journalEntryId: journal.id,
      receiptNo: input.receiptNo,
      totalAmount: input.totalAmount,
      occurredAt: new Date(input.occurredAt),
      idempotencyKey: `${meta.idempotencyKey}:receipt:${input.id}`,
      methodSplits: { create: input.methodSplits.map((split) => ({ ...split })) },
      allocations: { create: input.allocations.map((allocation) => ({ ...allocation })) },
    },
  });
  await tx.customerSeasonAccount.upsert({
    where: { customerId_seasonId: { customerId: input.customerId, seasonId: input.seasonId } },
    create: { id: `account_${input.customerId}_${input.seasonId}`, customerId: input.customerId, seasonId: input.seasonId, creditTotal: input.totalAmount, balance: `-${input.totalAmount}` },
    update: { creditTotal: { increment: input.totalAmount }, balance: { decrement: input.totalAmount } },
  });
  return { id: input.id, journalEntryId: journal.id };
}

async function createJournalEntry(tx: Tx, input: { seasonId: string; sourceType: string; sourceId: string; idempotencyKey: string; occurredAt: Date; lines: JournalLineDraft[] }): Promise<{ id: string }> {
  const id = `journal_${randomUUID()}`;
  await tx.journalEntry.create({
    data: {
      id,
      seasonId: input.seasonId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      idempotencyKey: input.idempotencyKey,
      occurredAt: input.occurredAt,
      postedAt: input.occurredAt,
      lines: {
        create: await Promise.all(input.lines.map(async (line, index) => ({
          id: `journal_line_${randomUUID()}`,
          accountId: await accountId(tx, line.accountCode),
          side: line.side,
          amount: line.amount,
          currency: "TRY",
          customerId: line.customerId,
          saleId: line.saleId,
          shareId: line.shareId,
          memo: line.memo ?? `${input.sourceType} line ${index + 1}`,
        }))),
      },
    },
  });
  return { id };
}

async function ensureFinancialAccounts(tx: Tx): Promise<void> {
  const accounts = [
    { id: "account_100_01", code: "100.01", name: "Nakit Kasa", type: "asset", normalSide: "debit" },
    { id: "account_102_01", code: "102.01", name: "Banka/Havale", type: "asset", normalSide: "debit" },
    { id: "account_108_01", code: "108.01", name: "POS Alacakları", type: "asset", normalSide: "debit" },
    { id: "account_120_01", code: "120.01", name: "Müşteri Cari", type: "asset", normalSide: "debit" },
    { id: "account_600_01", code: "600.01", name: "Kurban Hisse Satış Geliri", type: "revenue", normalSide: "credit" },
  ];
  for (const account of accounts) await tx.financialAccount.upsert({ where: { code: account.code }, create: account, update: { name: account.name, type: account.type, normalSide: account.normalSide, active: true } });
}

async function accountId(tx: Tx, code: string): Promise<string> {
  const account = await tx.financialAccount.findUnique({ where: { code }, select: { id: true } });
  if (!account) throw new TenantSalesFinanceError("FINANCIAL_ACCOUNT_NOT_FOUND");
  return account.id;
}

async function lockSeason(tx: Tx, seasonId: string, allowed: readonly string[]): Promise<void> {
  const rows = await tx.$queryRawUnsafe<Array<{ status: string }>>('SELECT "status" FROM "Season" WHERE "id" = $1 FOR UPDATE', seasonId);
  if (!rows[0]) throw new TenantSalesFinanceError("SEASON_NOT_FOUND");
  if (!allowed.includes(rows[0].status)) throw new TenantSalesFinanceError(rows[0].status === "archived" ? "SEASON_ARCHIVED_READ_ONLY" : "SEASON_OPERATION_NOT_ALLOWED");
}

async function lockedShare(tx: Tx, shareId: string) {
  const rows = await tx.$queryRawUnsafe<Array<{ id: string }>>('SELECT "id" FROM "Share" WHERE "id" = $1 FOR UPDATE', shareId);
  if (!rows[0]) throw new TenantSalesFinanceError("SHARE_NOT_FOUND");
  const share = await tx.share.findUnique({ where: { id: shareId }, include: { shareCard: { include: { animal: true } } } });
  if (!share) throw new TenantSalesFinanceError("SHARE_NOT_FOUND");
  return share;
}

async function lockedShares(tx: Tx, shareIds: readonly string[]) {
  if (shareIds.length === 0) return [];
  const placeholders = shareIds.map((_, index) => `$${index + 1}`).join(", ");
  await tx.$queryRawUnsafe(`SELECT "id" FROM "Share" WHERE "id" IN (${placeholders}) FOR UPDATE`, ...shareIds);
  return tx.share.findMany({ where: { id: { in: [...shareIds] } }, include: { shareCard: { include: { animal: true } } }, orderBy: { id: "asc" } });
}

function assertShareInSeason(share: Awaited<ReturnType<typeof lockedShare>>, seasonId: string): void {
  if (share.shareCard.seasonId !== seasonId) throw new TenantSalesFinanceError("SHARE_SEASON_MISMATCH");
}

function mapAvailability(share: Awaited<ReturnType<typeof lockedShare>>): ShareAvailability {
  return {
    id: share.id,
    seasonId: share.shareCard.seasonId,
    shareCardId: share.shareCardId,
    sequenceNo: share.sequenceNo,
    status: share.status as ShareAvailability["status"],
    customerId: share.customerId ?? undefined,
    reservedByCustomerId: share.reservedByCustomerId ?? undefined,
    reservedUntil: share.reservedUntil?.toISOString(),
    qurbanEligibility: share.shareCard.animal.qurbanEligibility,
  };
}

function splitEvenly(total: string, count: number, index: number): DecimalString {
  const [whole, fraction = ""] = total.split(".");
  const units = BigInt(whole) * BigInt(10000) + BigInt(fraction.padEnd(4, "0").slice(0, 4));
  const base = units / BigInt(count);
  const remainder = units % BigInt(count);
  const value = base + (BigInt(index) < remainder ? BigInt(1) : BigInt(0));
  const amountWhole = value / BigInt(10000);
  const amountFraction = (value % BigInt(10000)).toString().padStart(4, "0").replace(/0+$/, "");
  return decimal(`${amountWhole.toString()}${amountFraction ? `.${amountFraction}` : ""}`);
}

async function evidence(tx: Tx, meta: CommandMeta, action: string, targetType: string, targetId: string, metadata: Record<string, unknown>): Promise<void> {
  const safeMetadata = JSON.parse(JSON.stringify(metadata)) as Prisma.InputJsonValue;
  const payload = JSON.parse(JSON.stringify({ targetType, targetId, requestId: meta.requestId, occurredAt: meta.occurredAt.toISOString(), ...metadata })) as Prisma.InputJsonValue;
  await tx.tenantAuditLog.create({ data: { id: `audit_${randomUUID()}`, actorUserId: meta.actorUserId, action, targetType, targetId, requestId: meta.requestId, occurredAt: meta.occurredAt, metadata: safeMetadata } });
  await tx.tenantOutboxMessage.create({ data: { id: `outbox_${randomUUID()}`, topic: action, payload, status: "pending", idempotencyKey: meta.idempotencyKey } });
}
