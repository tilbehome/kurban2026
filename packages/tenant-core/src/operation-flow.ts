import type {
  AnimalId,
  CustomerId,
  IdempotencyKey,
  KilogramString,
  LedgerEntry,
  SeasonId,
  ShareCardId,
  ShareId,
} from "./tenant-domain";
import type { TenantInstanceId, UserId } from "@tilbecore/contracts";

type Brand<TValue, TBrand extends string> = TValue & { readonly __brand: TBrand };

export type ProxyDocumentId = Brand<string, "ProxyDocumentId">;
export type QrTokenId = Brand<string, "QrTokenId">;
export type SlaughterJobId = Brand<string, "SlaughterJobId">;
export type PackageId = Brand<string, "PackageId">;
export type DeliveryId = Brand<string, "DeliveryId">;
export type OfflineQueueItemId = Brand<string, "OfflineQueueItemId">;
export type DeviceAdapterId = Brand<string, "DeviceAdapterId">;

export type ProxyDocumentStatus = "draft" | "received" | "signed" | "revoked" | "invalid" | "lost";
export type ProxyMethod = "face_to_face" | "phone" | "oral" | "written" | "other" | "voice_recording" | "face_to_face_oral";
export type QrPurpose = "proxyDocument" | "slaughterCheck" | "package" | "delivery" | "customerTracking";
export type SlaughterStatus = "preparation" | "waiting" | "ready" | "in_slaughter" | "slaughtering" | "slaughtered" | "skinning" | "cutting" | "weighing" | "packaging" | "packing" | "ready_for_delivery" | "delivered" | "done" | "exception";
export type OperationMode = "normal" | "restricted" | "read_only" | "emergency_stop";
export type DeliveryStatus = "pending" | "partial" | "delivered" | "reversed";
export type OfflineQueueStatus = "queued" | "syncing" | "synced" | "conflict" | "failed" | "poisoned" | "expired";
export type DeviceAdapterKind = "scale" | "barcode_reader" | "qr_reader" | "label_printer" | "thermal_printer" | "tv_display";
export type WeighingType = "purchase" | "live" | "control" | "carcass" | "share" | "package";
export type PackageStatus = "created" | "stored" | "picked" | "loaded" | "delivered" | "missing" | "wrong" | "damaged" | "void";

export interface ProxyDocument {
  tenantInstanceId: TenantInstanceId;
  id: ProxyDocumentId;
  customerId: CustomerId;
  shareIds: readonly ShareId[];
  status: ProxyDocumentStatus;
  version: number;
  storageKey: string;
  method: ProxyMethod;
  policyVersion: string;
  receivedAt?: string;
  receivedPlace?: string;
  receivedByUserId?: UserId;
  description?: string;
  signedAt?: string;
  revokedAt?: string;
}

export interface ProxyGrantor {
  customerId: CustomerId;
  shareIds: readonly ShareId[];
  relationshipToShareholder?: string;
}

export interface ProxyDocumentHistory {
  proxyDocumentId: ProxyDocumentId;
  fromStatus?: ProxyDocumentStatus;
  toStatus: ProxyDocumentStatus;
  reason?: string;
  actorUserId: UserId;
  occurredAt: string;
}

export interface QrToken {
  tenantInstanceId: TenantInstanceId;
  id: QrTokenId;
  purpose: QrPurpose;
  targetId: string;
  opaqueToken: string;
  expiresAt?: string;
  revokedAt?: string;
}

export interface SlaughterJob {
  tenantInstanceId: TenantInstanceId;
  id: SlaughterJobId;
  seasonId: SeasonId;
  animalId: AnimalId;
  shareCardId: ShareCardId;
  status: SlaughterStatus;
  queueNo?: number;
  assignedUserId?: UserId;
  updatedAt: string;
}

export interface WeighingRecord {
  tenantInstanceId: TenantInstanceId;
  animalId: AnimalId;
  carcassWeightKg: KilogramString;
  recordedByUserId: UserId;
  recordedAt: string;
}

export interface PackageRecord {
  tenantInstanceId: TenantInstanceId;
  id: PackageId;
  shareId: ShareId;
  grossWeightKg: KilogramString;
  labelNo: string;
  createdAt: string;
}

export interface DeliveryRecord {
  tenantInstanceId: TenantInstanceId;
  id: DeliveryId;
  shareId: ShareId;
  customerId: CustomerId;
  status: DeliveryStatus;
  deliveredAt?: string;
  reversedAt?: string;
  reversalReason?: string;
}

export interface OfflineQueueItem {
  tenantInstanceId: TenantInstanceId;
  id: OfflineQueueItemId;
  idempotencyKey: IdempotencyKey;
  operation: string;
  payload: Record<string, string | number | boolean | null>;
  status: OfflineQueueStatus;
  createdAt: string;
}

export interface DeviceAdapterContract {
  id: DeviceAdapterId;
  kind: DeviceAdapterKind;
  displayName: string;
  capabilities: readonly string[];
  enabled: boolean;
}

export interface ScaleAdapterPort {
  readKilograms(input: { deviceAdapterId: DeviceAdapterId; operationId: string }): Promise<{ kilograms: KilogramString; measuredAt: string; calibrationRef?: string }>;
}

export interface CodeScannerAdapterPort {
  scan(input: { deviceAdapterId: DeviceAdapterId; expected: "barcode" | "qr" }): Promise<{ value: string; scannedAt: string }>;
}

export interface LabelPrinterAdapterPort {
  print(input: { deviceAdapterId: DeviceAdapterId; templateVersion: string; packageId: PackageId; copies: number }): Promise<{ providerJobId: string }>;
}

export function calculateWeightShortfallAdjustment(input: { agreedPrice: string; targetWeightKg: string; actualWeightKg: string }): string {
  const scale = 10_000n;
  const money = decimalToScaled(input.agreedPrice, 4);
  const target = decimalToScaled(input.targetWeightKg, 3);
  const actual = decimalToScaled(input.actualWeightKg, 3);
  if (target <= 0n || money < 0n || actual < 0n) throw new Error("WEIGHT_SHORTFALL_INPUT_INVALID");
  const missing = target > actual ? target - actual : 0n;
  const amount = (money * missing) / target;
  return scaledToDecimal(amount, scale, 4);
}

function decimalToScaled(value: string, precision: number): bigint {
  if (!/^\d+(\.\d+)?$/.test(value)) throw new Error("DECIMAL_INVALID");
  const [whole = "0", fraction = ""] = value.split(".");
  if (fraction.length > precision) throw new Error("DECIMAL_PRECISION_INVALID");
  const normalized = `${whole}${fraction.padEnd(precision, "0")}`;
  return BigInt(normalized);
}

function scaledToDecimal(value: bigint, scale: bigint, precision: number): string {
  const whole = value / scale;
  const fraction = (value % scale).toString().padStart(precision, "0");
  return `${whole}.${fraction}`;
}

const SLAUGHTER_TRANSITIONS: Record<SlaughterStatus, readonly SlaughterStatus[]> = {
  preparation: ["waiting", "exception"],
  waiting: ["ready", "exception"],
  ready: ["in_slaughter", "slaughtering", "exception"],
  in_slaughter: ["slaughtered", "exception"],
  slaughtering: ["slaughtered", "skinning", "exception"],
  slaughtered: ["skinning", "exception"],
  skinning: ["cutting", "exception"],
  cutting: ["weighing", "exception"],
  weighing: ["packaging", "packing", "exception"],
  packaging: ["ready_for_delivery", "exception"],
  packing: ["ready_for_delivery", "exception"],
  ready_for_delivery: ["delivered", "exception"],
  delivered: ["done"],
  done: [],
  exception: ["waiting", "ready"],
};

export function assertProxyDocumentAccessible(document: ProxyDocument): void {
  if (document.status !== "signed") throw new Error(`PROXY_DOCUMENT_NOT_ACCESSIBLE:${document.status}`);
  if (!document.storageKey || document.storageKey.startsWith("public/")) {
    throw new Error("PROXY_DOCUMENT_STORAGE_NOT_PROTECTED");
  }
}

export function assertQrTokenUsable(token: QrToken, nowIso: string): void {
  if (token.revokedAt) throw new Error("QR_TOKEN_REVOKED");
  if (token.expiresAt && Date.parse(token.expiresAt) <= Date.parse(nowIso)) {
    throw new Error("QR_TOKEN_EXPIRED");
  }
}

export function assertSlaughterTransition(current: SlaughterStatus, next: SlaughterStatus): void {
  if (current === next) return;
  if (!SLAUGHTER_TRANSITIONS[current].includes(next)) {
    throw new Error(`SLAUGHTER_TRANSITION_NOT_ALLOWED:${current}:${next}`);
  }
}

export function createDeliveryReversal(
  delivery: DeliveryRecord,
  reason: string,
  reversedAt: string,
): DeliveryRecord {
  if (delivery.status !== "delivered") throw new Error(`DELIVERY_NOT_REVERSIBLE:${delivery.status}`);
  return { ...delivery, status: "reversed", reversedAt, reversalReason: reason };
}

export function assertOfflineQueueItemSafe(item: OfflineQueueItem): void {
  const serialized = JSON.stringify(item.payload);
  if (/password|secret|token|databaseUrl|connectionString/i.test(serialized)) {
    throw new Error("OFFLINE_QUEUE_SECRET_FORBIDDEN");
  }
}

export function assertDeviceAdapterAllowed(adapter: DeviceAdapterContract): void {
  if (!adapter.enabled) throw new Error("DEVICE_ADAPTER_DISABLED");
  if (adapter.capabilities.length === 0) throw new Error("DEVICE_ADAPTER_CAPABILITY_REQUIRED");
}

export function createWeightDifferenceLedgerEntry(input: {
  tenantInstanceId: TenantInstanceId;
  id: LedgerEntry["id"];
  seasonId: SeasonId;
  customerId: CustomerId;
  amount: LedgerEntry["amount"];
  occurredAt: string;
}): LedgerEntry {
  return {
    tenantInstanceId: input.tenantInstanceId,
    id: input.id,
    seasonId: input.seasonId,
    type: "adjustment",
    amount: input.amount,
    currency: "TRY",
    customerId: input.customerId,
    occurredAt: input.occurredAt,
  };
}
