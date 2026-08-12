import type { TenantInstanceId } from "@tilbecore/contracts";
import type { CommandMeta, TenantUseCaseContext } from "./master-data-domain";
import {
  assertConfirmedSaleHasPositiveDeposit,
  assertJournalBalanced,
  assertNonNegativeMoney,
  assertPositiveMoney,
  decimal,
  decimalAdd,
  decimalCompare,
  decimalMultiplyInt,
  decimalSubtract,
  type DecimalString,
  type JournalLineDraft,
} from "./tenant-domain";

export type TenantSalesFinancePermission =
  | "kurban.pricing.manage.organization"
  | "kurban.share.read.operational_period"
  | "kurban.share.reserve.operational_period"
  | "kurban.sale.confirm.operational_period"
  | "kurban.sale.cancel.operational_period"
  | "kurban.sale.transfer.operational_period"
  | "kurban.finance.receipt.create.organization"
  | "kurban.finance.ledger.read.organization";

export interface PriceTariffItemInput {
  id: string;
  shareGroup: string;
  sequenceNo?: number;
  listPrice: string;
  minDepositAmount?: string;
}

export interface PublishPriceTariffInput {
  id: string;
  seasonId: string;
  name: string;
  versionId: string;
  version: number;
  validFrom?: string;
  validUntil?: string;
  changeReason: string;
  items: readonly PriceTariffItemInput[];
}

export interface ReserveShareInput {
  id: string;
  seasonId: string;
  shareId: string;
  customerId: string;
  reservedUntil: string;
  reason?: string;
}

export interface ConfirmSaleInput {
  id: string;
  seasonId: string;
  customerId: string;
  payerCustomerId?: string;
  shareIds: readonly string[];
  listPricePerShare: string;
  discountPerShare?: string;
  downPayment: {
    receiptId: string;
    receiptNo: string;
    methodSplits: readonly ReceiptMethodSplitInput[];
  };
}

export interface ReceiptMethodSplitInput {
  id: string;
  method: "cash" | "bank_transfer" | "pos";
  amount: string;
  referenceNo?: string;
  posInstallmentCount?: number;
  posFeeAmount?: string;
}

export interface PaymentAllocationInput {
  id: string;
  saleId?: string;
  customerId: string;
  shareId?: string;
  amount: string;
}

export interface RecordReceiptInput {
  id: string;
  seasonId: string;
  customerId: string;
  payerCustomerId?: string;
  saleId?: string;
  receiptNo: string;
  methodSplits: readonly ReceiptMethodSplitInput[];
  allocations: readonly PaymentAllocationInput[];
  occurredAt: string;
}

export interface CancelSaleInput {
  saleId: string;
  seasonId: string;
  reason: string;
}

export interface TransferShareInput {
  id: string;
  seasonId: string;
  sourceShareId: string;
  targetShareId: string;
  toCustomerId: string;
  reason: string;
}

export interface ExpireReservationsInput {
  seasonId: string;
  now: string;
  limit?: number;
}

export interface ShareAvailability {
  id: string;
  seasonId: string;
  shareCardId: string;
  sequenceNo: number;
  status: "available" | "reserved" | "sold" | "cancelled" | "delivered";
  customerId?: string;
  reservedByCustomerId?: string;
  reservedUntil?: string;
  qurbanEligibility: string;
}

export interface TenantSalesFinanceRepository {
  getSeason(id: string): Promise<{ id: string; status: string } | null>;
  publishPriceTariff(input: NormalizedPublishPriceTariffInput, meta: CommandMeta): Promise<{ id: string; versionId: string }>;
  reserveShare(input: NormalizedReserveShareInput, meta: CommandMeta): Promise<{ id: string; shareId: string }>;
  expireReservations(input: ExpireReservationsInput, meta: CommandMeta): Promise<{ expiredCount: number; shareIds: string[] }>;
  confirmSale(input: NormalizedConfirmSaleInput, meta: CommandMeta): Promise<{ id: string; receiptId: string; journalEntryIds: string[] }>;
  recordReceipt(input: NormalizedRecordReceiptInput, meta: CommandMeta): Promise<{ id: string; journalEntryId: string }>;
  cancelSale(input: CancelSaleInput, meta: CommandMeta): Promise<{ id: string }>;
  transferShare(input: TransferShareInput, meta: CommandMeta): Promise<{ id: string }>;
  listShareAvailability(seasonId: string): Promise<ShareAvailability[]>;
}

export type NormalizedPublishPriceTariffInput = Omit<PublishPriceTariffInput, "items"> & {
  items: Array<Omit<PriceTariffItemInput, "listPrice" | "minDepositAmount"> & { listPrice: DecimalString; minDepositAmount: DecimalString }>;
};

export type NormalizedReserveShareInput = ReserveShareInput;

export type NormalizedConfirmSaleInput = Omit<ConfirmSaleInput, "listPricePerShare" | "discountPerShare" | "downPayment"> & {
  listPricePerShare: DecimalString;
  discountPerShare: DecimalString;
  agreedPricePerShare: DecimalString;
  listPriceTotal: DecimalString;
  discountTotal: DecimalString;
  agreedPriceTotal: DecimalString;
  downPayment: {
    receiptId: string;
    receiptNo: string;
    totalAmount: DecimalString;
    methodSplits: NormalizedReceiptMethodSplitInput[];
  };
};

export type NormalizedReceiptMethodSplitInput = Omit<ReceiptMethodSplitInput, "amount" | "posFeeAmount"> & {
  amount: DecimalString;
  posFeeAmount: DecimalString;
};

export type NormalizedPaymentAllocationInput = Omit<PaymentAllocationInput, "amount"> & { amount: DecimalString };

export type NormalizedRecordReceiptInput = Omit<RecordReceiptInput, "methodSplits" | "allocations"> & {
  totalAmount: DecimalString;
  methodSplits: NormalizedReceiptMethodSplitInput[];
  allocations: NormalizedPaymentAllocationInput[];
};

export function normalizePriceTariff(input: PublishPriceTariffInput): NormalizedPublishPriceTariffInput {
  if (input.items.length === 0) throw new TenantSalesFinanceError("PRICE_TARIFF_ITEM_REQUIRED");
  return {
    ...input,
    items: input.items.map((item) => {
      const listPrice = positiveMoney(item.listPrice);
      const minDepositAmount = money(item.minDepositAmount ?? "0");
      if (item.sequenceNo !== undefined && (!Number.isInteger(item.sequenceNo) || item.sequenceNo < 1 || item.sequenceNo > 7)) {
        throw new TenantSalesFinanceError("SHARE_SEQUENCE_OUT_OF_RANGE");
      }
      return { ...item, listPrice, minDepositAmount };
    }),
  };
}

export function normalizeReserveShare(input: ReserveShareInput): NormalizedReserveShareInput {
  const reservedUntil = new Date(input.reservedUntil);
  if (Number.isNaN(reservedUntil.getTime()) || reservedUntil.getTime() <= Date.now()) throw new TenantSalesFinanceError("RESERVATION_WINDOW_INVALID");
  return input;
}

export function normalizeConfirmSale(input: ConfirmSaleInput): NormalizedConfirmSaleInput {
  if (input.shareIds.length === 0 || input.shareIds.length > 7) throw new TenantSalesFinanceError("SHARE_COUNT_INVALID");
  const listPricePerShare = positiveMoney(input.listPricePerShare);
  const discountPerShare = money(input.discountPerShare ?? "0");
  assertNonNegativeMoney(discountPerShare);
  if (decimalCompare(discountPerShare, listPricePerShare) > 0) throw new TenantSalesFinanceError("DISCOUNT_EXCEEDS_LIST_PRICE");
  const agreedPricePerShare = decimalSubtract(listPricePerShare, discountPerShare);
  assertPositiveMoney(agreedPricePerShare);
  const listPriceTotal = decimalMultiplyInt(listPricePerShare, input.shareIds.length);
  const discountTotal = decimalMultiplyInt(discountPerShare, input.shareIds.length);
  const agreedPriceTotal = decimalMultiplyInt(agreedPricePerShare, input.shareIds.length);
  const methodSplits = normalizeReceiptMethodSplits(input.downPayment.methodSplits);
  const totalAmount = decimalAdd(methodSplits.map((split) => split.amount));
  assertConfirmedSaleHasPositiveDeposit(totalAmount);
  if (decimalCompare(totalAmount, agreedPriceTotal) > 0) throw new TenantSalesFinanceError("FINANCE_DOWN_PAYMENT_EXCEEDS_SALE");
  return {
    ...input,
    listPricePerShare,
    discountPerShare,
    agreedPricePerShare,
    listPriceTotal,
    discountTotal,
    agreedPriceTotal,
    downPayment: { ...input.downPayment, totalAmount, methodSplits },
  };
}

export function normalizeReceipt(input: RecordReceiptInput): NormalizedRecordReceiptInput {
  const methodSplits = normalizeReceiptMethodSplits(input.methodSplits);
  const allocations = input.allocations.map((allocation) => ({ ...allocation, amount: positiveMoney(allocation.amount) }));
  const totalAmount = decimalAdd(methodSplits.map((split) => split.amount));
  const allocated = decimalAdd(allocations.map((allocation) => allocation.amount));
  if (decimalCompare(totalAmount, allocated) !== 0) throw new TenantSalesFinanceError("PAYMENT_ALLOCATION_TOTAL_MISMATCH");
  return { ...input, totalAmount, methodSplits, allocations };
}

export function buildSaleJournalLines(input: NormalizedConfirmSaleInput): JournalLineDraft[] {
  const lines: JournalLineDraft[] = [
    { accountCode: "120.01", side: "debit", amount: input.agreedPriceTotal, customerId: input.customerId as never, saleId: input.id as never, memo: "Kurban hisse satış alacağı" },
    { accountCode: "600.01", side: "credit", amount: input.agreedPriceTotal, customerId: input.customerId as never, saleId: input.id as never, memo: "Kurban hisse satış geliri" },
  ];
  assertJournalBalanced(lines);
  return lines;
}

export function buildReceiptJournalLines(input: NormalizedRecordReceiptInput): JournalLineDraft[] {
  const debitLines = input.methodSplits.map((split): JournalLineDraft => ({
    accountCode: split.method === "cash" ? "100.01" : split.method === "bank_transfer" ? "102.01" : "108.01",
    side: "debit",
    amount: split.amount,
    customerId: input.customerId as never,
    saleId: input.saleId as never,
    memo: "Tahsilat",
  }));
  const lines: JournalLineDraft[] = [
    ...debitLines,
    { accountCode: "120.01", side: "credit", amount: input.totalAmount, customerId: input.customerId as never, saleId: input.saleId as never, memo: "Müşteri alacağı kapanışı" },
  ];
  assertJournalBalanced(lines);
  return lines;
}

export function assertShareEligibleForSale(share: ShareAvailability, customerId: string, now: Date): void {
  if (share.qurbanEligibility === "blocked" || share.qurbanEligibility === "not_eligible") throw new TenantSalesFinanceError("QURBAN_ELIGIBILITY_BLOCKED");
  if (share.status === "available") return;
  if (share.status === "reserved" && share.reservedByCustomerId === customerId && share.reservedUntil && new Date(share.reservedUntil).getTime() > now.getTime()) return;
  throw new TenantSalesFinanceError("SHARE_NOT_SELLABLE");
}

export function assertSeasonAllowsSales(status: string): void {
  if (status !== "sales") throw new TenantSalesFinanceError(status === "archived" ? "SEASON_ARCHIVED_READ_ONLY" : "SEASON_OPERATION_NOT_ALLOWED");
}

export function assertTenantContext(context: TenantUseCaseContext): TenantInstanceId {
  return context.tenantInstanceId;
}

function normalizeReceiptMethodSplits(input: readonly ReceiptMethodSplitInput[]): NormalizedReceiptMethodSplitInput[] {
  if (input.length === 0) throw new TenantSalesFinanceError("RECEIPT_METHOD_REQUIRED");
  return input.map((split) => {
    const amount = positiveMoney(split.amount);
    const posFeeAmount = money(split.posFeeAmount ?? "0");
    assertNonNegativeMoney(posFeeAmount);
    if (split.method !== "pos" && (split.posInstallmentCount || decimalCompare(posFeeAmount, decimal("0")) > 0)) {
      throw new TenantSalesFinanceError("POS_FIELDS_REQUIRE_POS_METHOD");
    }
    return { ...split, amount, posFeeAmount };
  });
}

function money(value: string): DecimalString {
  try {
    return decimal(value);
  } catch {
    throw new TenantSalesFinanceError("MONEY_INVALID");
  }
}

function positiveMoney(value: string): DecimalString {
  const parsed = money(value);
  try {
    assertPositiveMoney(parsed);
    return parsed;
  } catch {
    throw new TenantSalesFinanceError("POSITIVE_AMOUNT_REQUIRED");
  }
}

export class TenantSalesFinanceError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "TenantSalesFinanceError";
  }
}
