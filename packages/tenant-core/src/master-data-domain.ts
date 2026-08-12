import type { TenantInstanceId, UserId } from "@tilbecore/contracts";
import type { DecimalString, KilogramString, SeasonId, SeasonStatus } from "./tenant-domain";
import { assertSeasonTransition, decimal, kilogram } from "./tenant-domain";

export type TenantMasterDataPermission =
  | "kurban.business.manage.organization"
  | "kurban.season.read.organization"
  | "kurban.season.manage.organization"
  | "kurban.customer.read.organization"
  | "kurban.customer.manage.organization"
  | "kurban.supplier.read.organization"
  | "kurban.supplier.manage.organization"
  | "kurban.purchase.manage.organization"
  | "kurban.expense.manage.organization"
  | "kurban.animal.read.organization"
  | "kurban.animal.manage.organization"
  | "kurban.animal-health.manage.assigned_record"
  | "kurban.qurban-queue.manage.operational_period";

export interface TenantUseCaseContext {
  tenantInstanceId: TenantInstanceId;
  actorUserId: UserId;
  identityKind?: "ORGANIZATION_USER" | "SERVICE_ACCOUNT" | "DEVICE_IDENTITY" | "EXTERNAL_USER";
  actorIdentityId?: string;
  organizationMembershipId?: string;
  sessionId?: string;
  organizationId?: string;
  facilityId?: string;
  departmentId?: string;
  operationalPeriodId?: string;
  trustedDevice?: boolean;
  network?: string;
  mfaLevel?: number;
  lastReauthenticatedAt?: string;
  authorizationMode?: "database" | "legacy_bridge";
  approval?: {
    requestId: string;
    approved: boolean;
    approvalCount: number;
    distinctApproverCount: number;
  };
  permissions: readonly string[];
  requestId: string;
  idempotencyKey: string;
  requestHash: string;
  occurredAt: string;
}

export interface CommandMeta {
  actorUserId: string;
  requestId: string;
  idempotencyKey: string;
  requestHash: string;
  occurredAt: Date;
}

export interface BusinessProfileInput {
  legalName: string;
  displayName: string;
  taxOffice?: string;
  taxNumber?: string;
  phone?: string;
  email?: string;
}

export interface LocationInput {
  code: string;
  name: string;
  addressLine?: string;
  district?: string;
  city?: string;
  phone?: string;
}

export interface SeasonInput {
  id: string;
  locationId?: string;
  name: string;
  year?: number;
  startsAt?: string;
  endsAt?: string;
}

export interface CustomerInput {
  id: string;
  displayName: string;
  phone?: string;
  identityNumber?: string;
  address?: {
    label?: string;
    addressLine: string;
    district?: string;
    city?: string;
    postalCode?: string;
  };
  notes?: string;
  kvkkConsentAt?: string;
  communicationConsentAt?: string;
}

export interface CustomerPatchInput {
  displayName?: string;
  phone?: string | null;
  identityNumber?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface CustomerSearchInput {
  query?: string;
  seasonId?: string;
  limit?: number;
  offset?: number;
}

export interface SupplierInput {
  id: string;
  displayName: string;
  phone?: string;
  taxNumber?: string;
}

export interface AnimalInput {
  id: string;
  seasonId: string;
  supplierId?: string;
  earTag: string;
  purchaseAmount?: string;
  liveWeightKg?: string;
  notes?: string;
}

export interface PurchaseInvoiceLineInput {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
  animal?: Omit<AnimalInput, "seasonId" | "supplierId" | "purchaseAmount">;
  expenseSourceRef?: string;
}

export interface PurchaseInvoiceInput {
  id: string;
  supplierId: string;
  seasonId: string;
  invoiceNo: string;
  invoiceDate: string;
  subtotal: string;
  taxTotal?: string;
  grandTotal: string;
  lines: readonly PurchaseInvoiceLineInput[];
}

export interface ExpenseDocumentInput {
  id: string;
  seasonId: string;
  documentNo?: string;
  category: string;
  description: string;
  amount: string;
  sourceType: string;
  sourceRef: string;
  occurredAt: string;
}

export interface SupplierPaymentInput {
  id: string;
  supplierId: string;
  seasonId: string;
  amount: string;
  method: string;
  referenceNo?: string;
  occurredAt: string;
}

export interface AnimalWeightInput {
  id: string;
  animalId: string;
  seasonId: string;
  kind: "purchase" | "live" | "carcass" | "control";
  weightKg: string;
  measuredAt: string;
  note?: string;
}

export interface AnimalHealthEventInput {
  id: string;
  animalId: string;
  seasonId: string;
  eventType: string;
  status: string;
  notes?: string;
  occurredAt: string;
}

export interface QurbanAssignmentInput {
  id: string;
  animalId: string;
  seasonId: string;
  qurbanNo?: string;
  queueNo?: number;
  reason?: string;
}

export interface DuplicateCustomerCandidate {
  id: string;
  displayName: string;
  phone?: string;
  reason: "same_phone" | "same_name";
}

export interface CustomerListItem {
  id: string;
  displayName: string;
  phone?: string;
  active: boolean;
  createdAt: string;
  shareCount: number;
  seasonAccount?: { seasonId: string; debitTotal: string; creditTotal: string; balance: string };
}

export interface CustomerHistoryItem {
  seasonId: string;
  seasonName: string;
  seasonStatus: SeasonStatus;
  debitTotal: string;
  creditTotal: string;
  balance: string;
}

export interface CustomerDetail {
  id: string;
  displayName: string;
  identityNumber?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
  phones: Array<{ id: string; label?: string; phone: string; isPrimary: boolean }>;
  addresses: Array<{ id: string; label?: string; addressLine: string; district?: string; city?: string; postalCode?: string; isPrimary: boolean }>;
  history: CustomerHistoryItem[];
}

export interface SeasonListItem {
  id: string;
  name: string;
  year?: number;
  status: SeasonStatus;
  locationName?: string;
  startsAt?: string;
  endsAt?: string;
}

export interface SupplierListItem {
  id: string;
  displayName: string;
  phone?: string;
  taxNumber?: string;
  balance?: string;
}

export interface AnimalListItem {
  id: string;
  seasonId: string;
  earTag: string;
  status: string;
  supplierName?: string;
  purchaseAmount?: string;
  liveWeightKg?: string;
  qurbanNo?: string;
  queueNo?: number;
}

export interface AnimalDetail extends AnimalListItem {
  qurbanEligibility: string;
  notes?: string;
  weights: Array<{ id: string; kind: string; weightKg: string; measuredAt: string; note?: string }>;
  healthEvents: Array<{ id: string; eventType: string; status: string; occurredAt: string; notes?: string }>;
  assignments: Array<{ id: string; qurbanNo?: string; queueNo?: number; active: boolean; assignedAt: string; endedAt?: string; reason?: string }>;
}

export interface TenantMasterDataRepository {
  getSeason(id: string): Promise<{ id: string; status: SeasonStatus } | null>;
  listSeasons(): Promise<SeasonListItem[]>;
  listSuppliers(seasonId?: string): Promise<SupplierListItem[]>;
  listAnimals(seasonId: string): Promise<AnimalListItem[]>;
  getAnimal(id: string): Promise<AnimalDetail | null>;
  upsertBusinessProfile(input: BusinessProfileInput, meta: CommandMeta): Promise<{ id: string }>;
  createLocation(input: LocationInput & { id: string }, meta: CommandMeta): Promise<{ id: string }>;
  upsertSetting(input: { id: string; scope: string; key: string; value: unknown }, meta: CommandMeta): Promise<{ id: string; version: number }>;
  createSeason(input: SeasonInput, meta: CommandMeta): Promise<{ id: string; status: SeasonStatus }>;
  transitionSeason(input: { seasonId: string; from: SeasonStatus; to: SeasonStatus }, meta: CommandMeta): Promise<{ id: string; status: SeasonStatus }>;
  findCustomerDuplicates(input: { normalizedName: string; normalizedPhone?: string; excludeId?: string }): Promise<DuplicateCustomerCandidate[]>;
  createCustomer(input: CustomerInput & { normalizedName: string; normalizedPhone?: string; seasonId: string }, meta: CommandMeta): Promise<{ id: string }>;
  updateCustomer(input: CustomerPatchInput & { id: string; seasonId: string; normalizedName?: string; normalizedPhone?: string | null }, meta: CommandMeta): Promise<{ id: string }>;
  deactivateCustomer(input: { id: string; seasonId: string }, meta: CommandMeta): Promise<{ id: string }>;
  searchCustomers(input: CustomerSearchInput & { normalizedQuery?: string; normalizedPhone?: string }): Promise<{ items: CustomerListItem[]; total: number }>;
  getCustomerHistory(customerId: string): Promise<CustomerHistoryItem[]>;
  getCustomer(customerId: string): Promise<CustomerDetail | null>;
  createSupplier(input: SupplierInput & { normalizedName: string; seasonId: string }, meta: CommandMeta): Promise<{ id: string }>;
  postPurchaseInvoice(input: PurchaseInvoiceInput, meta: CommandMeta): Promise<{ id: string; animalIds: string[] }>;
  recordSupplierPayment(input: SupplierPaymentInput, meta: CommandMeta): Promise<{ id: string }>;
  recordExpense(input: ExpenseDocumentInput, meta: CommandMeta): Promise<{ id: string }>;
  createAnimal(input: AnimalInput, meta: CommandMeta): Promise<{ id: string }>;
  recordAnimalWeight(input: AnimalWeightInput, meta: CommandMeta): Promise<{ id: string }>;
  recordAnimalHealthEvent(input: AnimalHealthEventInput, meta: CommandMeta): Promise<{ id: string }>;
  assignQurban(input: QurbanAssignmentInput, meta: CommandMeta): Promise<{ id: string }>;
}

const WRITEABLE_SEASON_STATES: Record<string, readonly SeasonStatus[]> = {
  customer: ["preparation", "sales", "slaughter", "delivery", "reconciliation"],
  supplier: ["preparation", "sales"],
  purchase: ["preparation", "sales"],
  expense: ["preparation", "sales", "slaughter", "delivery", "reconciliation"],
  animal: ["preparation", "sales"],
  animal_health: ["preparation", "sales", "slaughter"],
  qurban_queue: ["preparation", "sales", "slaughter"],
};

export function assertPermission(context: TenantUseCaseContext, permission: TenantMasterDataPermission): void {
  if (!context.permissions.includes("*") && !context.permissions.includes(permission)) {
    throw new TenantMasterDataError("TENANT_PERMISSION_DENIED");
  }
}

export function assertWritableSeason(status: SeasonStatus, operation: keyof typeof WRITEABLE_SEASON_STATES): void {
  if (!WRITEABLE_SEASON_STATES[operation].includes(status)) {
    throw new TenantMasterDataError(status === "archived" ? "SEASON_ARCHIVED_READ_ONLY" : "SEASON_OPERATION_NOT_ALLOWED");
  }
}

export function validateSeasonTransition(current: SeasonStatus, next: SeasonStatus): void {
  try {
    assertSeasonTransition(current, next);
  } catch {
    throw new TenantMasterDataError("SEASON_TRANSITION_NOT_ALLOWED");
  }
}

export function normalizePersonName(value: string): string {
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 180) throw new TenantMasterDataError("CUSTOMER_NAME_INVALID");
  return name.toLocaleUpperCase("tr-TR");
}

export function normalizeSearchText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleUpperCase("tr-TR");
}

export function normalizePhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 13) throw new TenantMasterDataError("PHONE_INVALID");
  if (digits.startsWith("90") && digits.length === 12) return digits;
  return `90${digits.slice(-10)}`;
}

export function normalizeEarTag(value: string): string {
  const result = value.trim().replace(/\s+/g, "").toLocaleUpperCase("tr-TR");
  if (result.length < 3 || result.length > 40) throw new TenantMasterDataError("ANIMAL_EAR_TAG_INVALID");
  return result;
}

export function money(value: string): DecimalString {
  try {
    const parsed = decimal(value);
    if (parsed.startsWith("-")) throw new Error();
    return parsed;
  } catch {
    throw new TenantMasterDataError("MONEY_INVALID");
  }
}

export function positiveMoney(value: string): DecimalString {
  const parsed = money(value);
  if (/^0(?:\.0{1,4})?$/.test(parsed)) throw new TenantMasterDataError("POSITIVE_AMOUNT_REQUIRED");
  return parsed;
}

export function weight(value: string): KilogramString {
  try {
    const parsed = kilogram(value);
    if (/^0(?:\.0{1,3})?$/.test(parsed)) throw new Error();
    return parsed;
  } catch {
    throw new TenantMasterDataError("WEIGHT_INVALID");
  }
}

export function commandMeta(context: TenantUseCaseContext): CommandMeta {
  if (!/^[a-zA-Z0-9._:-]{8,128}$/.test(context.requestId)) throw new TenantMasterDataError("REQUEST_ID_INVALID");
  if (!/^[a-zA-Z0-9._:-]{8,128}$/.test(context.idempotencyKey)) throw new TenantMasterDataError("IDEMPOTENCY_KEY_INVALID");
  if (!/^[a-fA-F0-9]{32,128}$/.test(context.requestHash)) throw new TenantMasterDataError("REQUEST_HASH_INVALID");
  const occurredAt = new Date(context.occurredAt);
  if (Number.isNaN(occurredAt.getTime())) throw new TenantMasterDataError("OCCURRED_AT_INVALID");
  return { actorUserId: context.actorUserId, requestId: context.requestId, idempotencyKey: context.idempotencyKey, requestHash: context.requestHash, occurredAt };
}

export class TenantMasterDataError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "TenantMasterDataError";
  }
}
