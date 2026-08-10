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
export type IdempotencyKey = Brand<string, "IdempotencyKey">;

export type DecimalString = Brand<string, "DecimalString">;
export type KilogramString = Brand<string, "KilogramString">;

export type SeasonStatus = "preparation" | "sales" | "slaughter" | "delivery" | "reconciliation" | "archived";
export type AnimalStatus = "draft" | "available" | "reserved" | "sold_out" | "slaughtered" | "delivered" | "cancelled";
export type ShareStatus = "available" | "reserved" | "sold" | "cancelled" | "delivered";
export type SaleStatus = "draft" | "confirmed" | "cancelled" | "reversed";
export type LedgerEntryType = "sale" | "payment" | "discount" | "expense" | "refund" | "reversal" | "adjustment";
export type OutboxStatus = "pending" | "processing" | "sent" | "failed" | "dead";

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
  preparation: ["sales", "archived"],
  sales: ["slaughter", "reconciliation"],
  slaughter: ["delivery", "reconciliation"],
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

export function assertLedgerEntryImmutableUpdate(): never {
  throw new Error("LEDGER_ENTRY_IMMUTABLE_USE_REVERSAL");
}
