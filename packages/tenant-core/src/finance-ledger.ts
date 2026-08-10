import type {
  CustomerId,
  DecimalString,
  LedgerEntry,
  LedgerEntryId,
  SaleId,
  SeasonId,
} from "./tenant-domain";
import { decimal } from "./tenant-domain";
import type { TenantInstanceId } from "@tilbecore/contracts";

export interface MoneyAllocation {
  targetSaleId?: SaleId;
  targetCustomerId?: CustomerId;
  amount: DecimalString;
}

export interface PaymentCommand {
  tenantInstanceId: TenantInstanceId;
  seasonId: SeasonId;
  customerId: CustomerId;
  amount: DecimalString;
  allocations: readonly MoneyAllocation[];
  occurredAt: string;
}

export function sumDecimal(values: readonly DecimalString[]): DecimalString {
  const cents = values.reduce((total, value) => total + decimalToFixedUnits(value), BigInt(0));
  return fixedUnitsToDecimal(cents);
}

export function assertPaymentAllocationsMatch(command: PaymentCommand): void {
  const allocated = sumDecimal(command.allocations.map((allocation) => allocation.amount));
  if (allocated !== command.amount) {
    throw new Error("PAYMENT_ALLOCATION_TOTAL_MISMATCH");
  }
}

export function createPaymentLedgerEntries(
  command: PaymentCommand,
  idFactory: (suffix: string) => LedgerEntryId,
): readonly LedgerEntry[] {
  assertPaymentAllocationsMatch(command);
  return command.allocations.map((allocation, index) => ({
    tenantInstanceId: command.tenantInstanceId,
    id: idFactory(`payment_${index + 1}`),
    seasonId: command.seasonId,
    type: "payment",
    amount: allocation.amount,
    currency: "TRY",
    saleId: allocation.targetSaleId,
    customerId: allocation.targetCustomerId ?? command.customerId,
    occurredAt: command.occurredAt,
  }));
}

export function createReversalEntry(
  original: LedgerEntry,
  id: LedgerEntryId,
  occurredAt: string,
): LedgerEntry {
  return {
    tenantInstanceId: original.tenantInstanceId,
    id,
    seasonId: original.seasonId,
    type: "reversal",
    amount: negateDecimal(original.amount),
    currency: original.currency,
    saleId: original.saleId,
    customerId: original.customerId,
    reversalOfEntryId: original.id,
    occurredAt,
  };
}

export function assertNoFloatMoney(value: unknown): void {
  if (typeof value === "number") throw new Error("FLOAT_MONEY_FORBIDDEN");
}

function decimalToFixedUnits(value: DecimalString): bigint {
  const [whole, fraction = ""] = value.split(".");
  const normalizedFraction = fraction.padEnd(4, "0").slice(0, 4);
  return BigInt(whole) * BigInt(10000) + BigInt(normalizedFraction) * (whole.startsWith("-") ? BigInt(-1) : BigInt(1));
}

function fixedUnitsToDecimal(value: bigint): DecimalString {
  const negative = value < BigInt(0);
  const absolute = negative ? -value : value;
  const whole = absolute / BigInt(10000);
  const fraction = (absolute % BigInt(10000)).toString().padStart(4, "0").replace(/0+$/, "");
  return decimal(`${negative ? "-" : ""}${whole.toString()}${fraction ? `.${fraction}` : ""}`);
}

function negateDecimal(value: DecimalString): DecimalString {
  return value.startsWith("-") ? decimal(value.slice(1)) : decimal(`-${value}`);
}
