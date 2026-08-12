import type { TenantInstanceId, UserId } from "@tilbecore/contracts";

type Brand<TValue, TBrand extends string> = TValue & { readonly __brand: TBrand };

export type SeasonId = Brand<string, "SeasonId">;
export type CustomerId = Brand<string, "CustomerId">;
export type SupplierId = Brand<string, "SupplierId">;
export type AnimalId = Brand<string, "AnimalId">;
export type ShareCardId = Brand<string, "ShareCardId">;
export type ShareId = Brand<string, "ShareId">;
export type SaleId = Brand<string, "SaleId">;
export type LedgerEntryId = Brand<string, "LedgerEntryId">;
export type ReceiptId = Brand<string, "ReceiptId">;
export type JournalEntryId = Brand<string, "JournalEntryId">;
export type FinancialAccountId = Brand<string, "FinancialAccountId">;
export type IdempotencyKey = Brand<string, "IdempotencyKey">;

export type DecimalString = Brand<string, "DecimalString">;
export type KilogramString = Brand<string, "KilogramString">;

export type SeasonStatus = "preparation" | "sales" | "slaughter" | "delivery" | "reconciliation" | "archived";
export type AnimalStatus = "draft" | "available" | "reserved" | "sold_out" | "slaughtered" | "delivered" | "cancelled";
export type ShareStatus = "available" | "reserved" | "sold" | "cancelled" | "delivered";
export type SaleStatus = "draft" | "confirmed" | "cancelled" | "reversed" | "transferred";
export type LedgerEntryType = "sale" | "payment" | "discount" | "expense" | "refund" | "reversal" | "adjustment";
export type OutboxStatus = "pending" | "processing" | "sent" | "failed" | "dead";
export type JournalSide = "debit" | "credit";
export type ReceiptMethod = "cash" | "bank_transfer" | "pos";

export interface TenantEntity {
  tenantInstanceId: TenantInstanceId;
}

export interface Season extends TenantEntity {
  id: SeasonId;
  name: string;
  status: SeasonStatus;
  startsAt?: string;
  endsAt?: string;
}

export interface Customer extends TenantEntity {
  id: CustomerId;
  displayName: string;
  phone?: string;
  normalizedPhone?: string;
  kvkkConsentAt?: string;
  communicationConsentAt?: string;
}

export interface Supplier extends TenantEntity {
  id: SupplierId;
  displayName: string;
  phone?: string;
  taxNumber?: string;
}

export interface Animal extends TenantEntity {
  id: AnimalId;
  seasonId: SeasonId;
  supplierId?: SupplierId;
  earTag: string;
  status: AnimalStatus;
  purchaseAmount?: DecimalString;
  liveWeightKg?: KilogramString;
  carcassWeightKg?: KilogramString;
}

export interface ShareCard extends TenantEntity {
  id: ShareCardId;
  seasonId: SeasonId;
  animalId: AnimalId;
  displayNo?: string;
  targetShareCount: 7;
}

export interface Share extends TenantEntity {
  id: ShareId;
  shareCardId: ShareCardId;
  sequenceNo: number;
  status: ShareStatus;
  customerId?: CustomerId;
  agreedPrice?: DecimalString;
  reservedUntil?: string;
}

export interface Sale extends TenantEntity {
  id: SaleId;
  seasonId: SeasonId;
  customerId: CustomerId;
  shareIds: readonly ShareId[];
  status: SaleStatus;
  priceSnapshot: DecimalString;
  discountAmount?: DecimalString;
  idempotencyKey: IdempotencyKey;
}

export interface LedgerEntry extends TenantEntity {
  id: LedgerEntryId;
  seasonId: SeasonId;
  type: LedgerEntryType;
  amount: DecimalString;
  currency: "TRY";
  saleId?: SaleId;
  customerId?: CustomerId;
  reversalOfEntryId?: LedgerEntryId;
  occurredAt: string;
}

export interface JournalLineDraft {
  accountCode: string;
  side: JournalSide;
  amount: DecimalString;
  customerId?: CustomerId;
  saleId?: SaleId;
  shareId?: ShareId;
  memo?: string;
}

export interface ReceiptMethodSplitDraft {
  method: ReceiptMethod;
  amount: DecimalString;
  referenceNo?: string;
  posInstallmentCount?: number;
  posFeeAmount?: DecimalString;
}

export interface TenantAuditEvent extends TenantEntity {
  action: string;
  actorUserId?: UserId;
  targetType: string;
  targetId?: string;
  requestId: string;
  occurredAt: string;
}

export interface TenantOutboxMessage extends TenantEntity {
  id: string;
  topic: string;
  payload: Record<string, string | number | boolean | null>;
  status: OutboxStatus;
  idempotencyKey?: IdempotencyKey;
  createdAt: string;
}

const SEASON_TRANSITIONS: Record<SeasonStatus, readonly SeasonStatus[]> = {
  preparation: ["sales"],
  sales: ["slaughter"],
  slaughter: ["delivery"],
  delivery: ["reconciliation"],
  reconciliation: ["archived"],
  archived: [],
};

export function decimal(value: string): DecimalString {
  if (!/^-?\d+(\.\d{1,4})?$/.test(value)) throw new Error("DECIMAL_INVALID");
  return value as DecimalString;
}

export function kilogram(value: string): KilogramString {
  if (!/^\d+(\.\d{1,3})?$/.test(value)) throw new Error("KILOGRAM_INVALID");
  return value as KilogramString;
}

export function assertSeasonTransition(current: SeasonStatus, next: SeasonStatus): void {
  if (current === next) return;
  if (!SEASON_TRANSITIONS[current].includes(next)) {
    throw new Error(`SEASON_TRANSITION_NOT_ALLOWED:${current}:${next}`);
  }
}

export function assertShareCardCapacity(shares: readonly Share[]): void {
  const sequences = new Set<number>();
  for (const share of shares) {
    if (share.sequenceNo < 1 || share.sequenceNo > 7) throw new Error("SHARE_SEQUENCE_OUT_OF_RANGE");
    if (sequences.has(share.sequenceNo)) throw new Error("SHARE_SEQUENCE_DUPLICATE");
    sequences.add(share.sequenceNo);
  }
  if (shares.length > 7) throw new Error("SHARE_CARD_CAPACITY_EXCEEDED");
}

export function assertShareCanBeSold(share: Share): void {
  if (share.status !== "available" && share.status !== "reserved") {
    throw new Error(`SHARE_NOT_SELLABLE:${share.status}`);
  }
}

export function assertPositiveMoney(value: DecimalString): void {
  if (/^-/.test(value) || /^0(?:\.0{1,4})?$/.test(value)) throw new Error("POSITIVE_AMOUNT_REQUIRED");
}

export function assertNonNegativeMoney(value: DecimalString): void {
  if (/^-/.test(value)) throw new Error("NEGATIVE_AMOUNT_FORBIDDEN");
}

export function assertConfirmedSaleHasPositiveDeposit(amount: DecimalString): void {
  assertPositiveMoney(amount);
}

export function assertJournalBalanced(lines: readonly JournalLineDraft[]): void {
  const debit = lines.filter((line) => line.side === "debit").map((line) => line.amount);
  const credit = lines.filter((line) => line.side === "credit").map((line) => line.amount);
  if (fixedUnitsSum(debit) !== fixedUnitsSum(credit)) throw new Error("JOURNAL_ENTRY_NOT_BALANCED");
}

export function decimalAdd(values: readonly DecimalString[]): DecimalString {
  return fixedUnitsToDecimal(fixedUnitsSum(values));
}

export function decimalSubtract(left: DecimalString, right: DecimalString): DecimalString {
  return fixedUnitsToDecimal(toFixedUnits(left) - toFixedUnits(right));
}

export function decimalCompare(left: DecimalString, right: DecimalString): number {
  const l = toFixedUnits(left);
  const r = toFixedUnits(right);
  return l === r ? 0 : l > r ? 1 : -1;
}

export function decimalMultiplyInt(value: DecimalString, multiplier: number): DecimalString {
  if (!Number.isInteger(multiplier) || multiplier < 0) throw new Error("DECIMAL_MULTIPLIER_INVALID");
  return fixedUnitsToDecimal(toFixedUnits(value) * BigInt(multiplier));
}

export function assertLedgerEntryImmutableUpdate(): never {
  throw new Error("LEDGER_ENTRY_IMMUTABLE_USE_REVERSAL");
}

function fixedUnitsSum(values: readonly DecimalString[]): bigint {
  return values.reduce((sum, value) => sum + toFixedUnits(value), BigInt(0));
}

function toFixedUnits(value: DecimalString): bigint {
  const negative = value.startsWith("-");
  const source = negative ? value.slice(1) : value;
  const [whole, fraction = ""] = source.split(".");
  const units = BigInt(whole) * BigInt(10000) + BigInt(fraction.padEnd(4, "0").slice(0, 4));
  return negative ? -units : units;
}

function fixedUnitsToDecimal(value: bigint): DecimalString {
  const negative = value < BigInt(0);
  const absolute = negative ? -value : value;
  const whole = absolute / BigInt(10000);
  const fraction = (absolute % BigInt(10000)).toString().padStart(4, "0").replace(/0+$/, "");
  return decimal(`${negative ? "-" : ""}${whole.toString()}${fraction ? `.${fraction}` : ""}`);
}
