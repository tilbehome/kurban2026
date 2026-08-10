import type { Customer, CustomerId, LedgerEntry, SeasonId } from "./tenant-domain";
import type { TenantInstanceId } from "@tilbecore/contracts";
import { sumDecimal } from "./finance-ledger";

export interface CustomerSeasonAccount {
  tenantInstanceId: TenantInstanceId;
  seasonId: SeasonId;
  customerId: CustomerId;
  debitTotal: string;
  creditTotal: string;
  balance: string;
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) throw new Error("PHONE_INVALID");
  return digits.startsWith("90") ? digits : `90${digits.slice(-10)}`;
}

export function createCustomer(input: {
  tenantInstanceId: TenantInstanceId;
  id: CustomerId;
  displayName: string;
  phone?: string;
  kvkkConsentAt?: string;
  communicationConsentAt?: string;
}): Customer {
  return {
    tenantInstanceId: input.tenantInstanceId,
    id: input.id,
    displayName: input.displayName.trim(),
    phone: input.phone,
    normalizedPhone: input.phone ? normalizePhone(input.phone) : undefined,
    kvkkConsentAt: input.kvkkConsentAt,
    communicationConsentAt: input.communicationConsentAt,
  };
}

export function calculateCustomerSeasonAccount(input: {
  tenantInstanceId: TenantInstanceId;
  seasonId: SeasonId;
  customerId: CustomerId;
  entries: readonly LedgerEntry[];
}): CustomerSeasonAccount {
  const ownEntries = input.entries.filter(
    (entry) => entry.seasonId === input.seasonId && entry.customerId === input.customerId,
  );
  const debits = ownEntries
    .filter((entry) => entry.type === "sale" || entry.type === "expense" || entry.type === "adjustment")
    .map((entry) => entry.amount);
  const credits = ownEntries
    .filter((entry) => entry.type === "payment" || entry.type === "discount" || entry.type === "refund" || entry.type === "reversal")
    .map((entry) => entry.amount);
  const debitTotal = sumDecimal(debits);
  const creditTotal = sumDecimal(credits);
  return {
    tenantInstanceId: input.tenantInstanceId,
    seasonId: input.seasonId,
    customerId: input.customerId,
    debitTotal,
    creditTotal,
    balance: sumDecimal([debitTotal, (`-${creditTotal}`) as never]),
  };
}
