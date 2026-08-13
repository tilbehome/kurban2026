import type { OfflineCapability } from "./types";

const OPERATION_POLICIES = {
  "scan.observation": "QUEUE_ALLOWED",
  "task.note": "QUEUE_ALLOWED",
  "device.diagnostic": "QUEUE_ALLOWED",
  "task.reference.read": "READ_CACHE",
  "public.queue.read": "READ_CACHE",
  "sale.create": "ONLINE_REQUIRED",
  "reservation.confirm": "ONLINE_REQUIRED",
  "payment.collect": "ONLINE_REQUIRED",
  "cash.post": "ONLINE_REQUIRED",
  "slaughter.confirm": "ONLINE_REQUIRED",
  "delivery.close": "ONLINE_REQUIRED",
  "ownership.transfer": "ONLINE_REQUIRED",
  "finance.ledger.read": "NEVER_CACHE_SENSITIVE",
  "proxy.document.read": "NEVER_CACHE_SENSITIVE",
  "auth.session.read": "NEVER_CACHE_SENSITIVE",
} as const satisfies Record<string, OfflineCapability>;

export type KnownOfflineOperation = keyof typeof OPERATION_POLICIES;

export function offlineCapabilityFor(operation: string): OfflineCapability {
  return OPERATION_POLICIES[operation as KnownOfflineOperation] ?? "ONLINE_REQUIRED";
}

export function assertQueueAllowed(operation: string): void {
  const capability = offlineCapabilityFor(operation);
  if (capability !== "QUEUE_ALLOWED") {
    throw new Error(`OFFLINE_OPERATION_NOT_QUEUEABLE:${capability}`);
  }
}

const forbiddenPayloadKey = /password|secret|token|authorization|cookie|connection|string|phone|email|address|financial|ledger|document/i;

export function assertOfflinePayloadSafe(payload: Readonly<Record<string, unknown>>): void {
  const serialized = JSON.stringify(payload);
  if (serialized.length > 16_384) throw new Error("OFFLINE_PAYLOAD_TOO_LARGE");
  visit(payload, 0);
}

function visit(value: unknown, depth: number): void {
  if (depth > 8) throw new Error("OFFLINE_PAYLOAD_TOO_DEEP");
  if (Array.isArray(value)) {
    for (const child of value) visit(child, depth + 1);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenPayloadKey.test(key)) throw new Error("OFFLINE_SENSITIVE_PAYLOAD_REJECTED");
    visit(child, depth + 1);
  }
}
