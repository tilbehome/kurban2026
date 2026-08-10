import type {
  Animal,
  AnimalId,
  CustomerId,
  DecimalString,
  IdempotencyKey,
  LedgerEntry,
  Sale,
  SeasonId,
  Share,
  Supplier,
  SupplierId,
  TenantAuditEvent,
  TenantOutboxMessage,
} from "./tenant-domain";
import { assertShareCanBeSold } from "./tenant-domain";
import { createReversalEntry } from "./finance-ledger";
import type { TenantInstanceId, UserId } from "@tilbecore/contracts";

export interface TenantCommandContext {
  tenantInstanceId: TenantInstanceId;
  actorUserId: UserId;
  requestId: string;
  idempotencyKey: IdempotencyKey;
  occurredAt: string;
}

export interface TenantCommandResult<TEntity> {
  entity: TEntity;
  audit: TenantAuditEvent;
  outbox: readonly TenantOutboxMessage[];
}

export interface RegisterSupplierInput {
  id: SupplierId;
  displayName: string;
  phone?: string;
  taxNumber?: string;
}

export interface RegisterAnimalInput {
  id: AnimalId;
  seasonId: SeasonId;
  supplierId?: SupplierId;
  earTag: string;
}

export interface ConfirmSaleInput {
  id: Sale["id"];
  seasonId: SeasonId;
  customerId: CustomerId;
  shares: readonly Share[];
  priceSnapshot: DecimalString;
}

export function registerSupplier(
  context: TenantCommandContext,
  input: RegisterSupplierInput,
): TenantCommandResult<Supplier> {
  const supplier: Supplier = {
    tenantInstanceId: context.tenantInstanceId,
    id: input.id,
    displayName: input.displayName,
    phone: input.phone,
    taxNumber: input.taxNumber,
  };
  return withAudit(context, supplier, "supplier.registered", "Supplier", input.id);
}

export function registerAnimal(
  context: TenantCommandContext,
  input: RegisterAnimalInput,
): TenantCommandResult<Animal> {
  const animal: Animal = {
    tenantInstanceId: context.tenantInstanceId,
    id: input.id,
    seasonId: input.seasonId,
    supplierId: input.supplierId,
    earTag: input.earTag,
    status: "draft",
  };
  return withAudit(context, animal, "animal.registered", "Animal", input.id);
}

export function confirmSale(
  context: TenantCommandContext,
  input: ConfirmSaleInput,
): TenantCommandResult<{ sale: Sale; ledger: LedgerEntry; shares: readonly Share[] }> {
  input.shares.forEach(assertShareCanBeSold);
  const shareIds = input.shares.map((share) => share.id);
  const sale: Sale = {
    tenantInstanceId: context.tenantInstanceId,
    id: input.id,
    seasonId: input.seasonId,
    customerId: input.customerId,
    shareIds,
    status: "confirmed",
    priceSnapshot: input.priceSnapshot,
    idempotencyKey: context.idempotencyKey,
  };
  const ledger: LedgerEntry = {
    tenantInstanceId: context.tenantInstanceId,
    id: `${input.id}_ledger_sale` as LedgerEntry["id"],
    seasonId: input.seasonId,
    type: "sale",
    amount: input.priceSnapshot,
    currency: "TRY",
    saleId: input.id,
    customerId: input.customerId,
    occurredAt: context.occurredAt,
  };
  const shares = input.shares.map((share) => ({
    ...share,
    status: "sold" as const,
    customerId: input.customerId,
    agreedPrice: input.priceSnapshot,
  }));
  return withAudit(context, { sale, ledger, shares }, "sale.confirmed", "Sale", input.id);
}

export function cancelSaleWithReversal(
  context: TenantCommandContext,
  sale: Sale,
  ledgerEntries: readonly LedgerEntry[],
): TenantCommandResult<{ sale: Sale; reversals: readonly LedgerEntry[] }> {
  if (sale.status !== "confirmed") throw new Error(`SALE_NOT_CANCELLABLE:${sale.status}`);
  const reversals = ledgerEntries
    .filter((entry) => entry.saleId === sale.id && !entry.reversalOfEntryId)
    .map((entry, index) =>
      createReversalEntry(entry, `${sale.id}_reversal_${index + 1}` as LedgerEntry["id"], context.occurredAt),
    );
  return withAudit(
    context,
    { sale: { ...sale, status: "cancelled" }, reversals },
    "sale.cancelled",
    "Sale",
    sale.id,
  );
}

function withAudit<TEntity>(
  context: TenantCommandContext,
  entity: TEntity,
  action: string,
  targetType: string,
  targetId: string,
): TenantCommandResult<TEntity> {
  return {
    entity,
    audit: {
      tenantInstanceId: context.tenantInstanceId,
      actorUserId: context.actorUserId,
      action,
      targetType,
      targetId,
      requestId: context.requestId,
      occurredAt: context.occurredAt,
    },
    outbox: [],
  };
}
