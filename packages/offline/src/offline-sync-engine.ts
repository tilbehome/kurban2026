import { assertOfflinePayloadSafe, assertQueueAllowed } from "./policy";
import type {
  EnqueueOfflineCommand,
  OfflineBinding,
  OfflinePermissionPort,
  OfflineQueueItem,
  OfflineQueueRepository,
  OfflineSyncSummary,
  OfflineSyncTransport,
  SyncTransportResult,
} from "./types";

const MAX_ATTEMPTS = 5;
const MAX_RETRY_DELAY_MS = 5 * 60_000;

export async function enqueueOfflineCommand(
  repository: OfflineQueueRepository,
  command: EnqueueOfflineCommand,
): Promise<OfflineQueueItem> {
  assertIdentifiers(command);
  assertQueueAllowed(command.operation);
  assertOfflinePayloadSafe(command.payload);
  if (!Number.isSafeInteger(command.ttlMs) || command.ttlMs < 1_000 || command.ttlMs > 24 * 60 * 60_000) {
    throw new Error("OFFLINE_TTL_INVALID");
  }
  if (!Number.isSafeInteger(command.expectedVersion) || command.expectedVersion < 0) throw new Error("OFFLINE_EXPECTED_VERSION_INVALID");
  const existing = await repository.find(command.clientOperationId);
  if (existing) {
    if (existing.idempotencyKey !== command.idempotencyKey || existing.operation !== command.operation) {
      throw new Error("OFFLINE_CLIENT_OPERATION_REUSED");
    }
    return existing;
  }
  const created = Date.parse(command.createdAt);
  if (!Number.isFinite(created)) throw new Error("OFFLINE_CREATED_AT_INVALID");
  const item: OfflineQueueItem = {
    ...command,
    capability: "QUEUE_ALLOWED",
    status: "pending",
    expiresAt: new Date(created + command.ttlMs).toISOString(),
    attempts: 0,
    nextAttemptAt: command.createdAt,
  };
  await repository.put(item);
  return item;
}

export async function syncOfflineQueue(input: {
  repository: OfflineQueueRepository;
  permission: OfflinePermissionPort;
  transport: OfflineSyncTransport;
  binding: OfflineBinding;
  now: string;
}): Promise<OfflineSyncSummary> {
  assertBinding(input.binding);
  const nowMs = Date.parse(input.now);
  if (!Number.isFinite(nowMs)) throw new Error("OFFLINE_SYNC_TIME_INVALID");
  const items = await input.repository.listByBinding(input.binding);
  const summary: OfflineSyncSummary = { attempted: 0, synced: 0, failed: 0, conflicted: 0, poisoned: 0, pending: 0 };

  for (const candidate of items) {
    if (!isProcessable(candidate, nowMs)) {
      countStatus(summary, candidate.status);
      continue;
    }
    summary.attempted += 1;
    const validationCode = validatePersistedItem(candidate, input.binding, nowMs);
    if (validationCode) {
      const poisoned = { ...candidate, status: "poisoned" as const, lastErrorCode: validationCode };
      await input.repository.put(poisoned);
      summary.poisoned += 1;
      continue;
    }
    const permission = await input.permission.revalidate(candidate);
    if (!permission.allowed) {
      await input.repository.put({ ...candidate, status: "failed", lastErrorCode: permission.code });
      summary.failed += 1;
      continue;
    }
    await input.repository.put({ ...candidate, status: "syncing" });
    let result: SyncTransportResult;
    try {
      result = await input.transport.send(candidate);
    } catch {
      result = { kind: "retryable", code: "SYNC_RESPONSE_LOST" };
    }
    const updated = transition(candidate, result, nowMs);
    await input.repository.put(updated);
    countStatus(summary, updated.status);
  }
  return summary;
}

function transition(item: OfflineQueueItem, result: SyncTransportResult, nowMs: number): OfflineQueueItem {
  switch (result.kind) {
    case "applied":
    case "duplicate":
      return { ...item, status: "synced", serverResultId: result.serverResultId, lastErrorCode: undefined };
    case "conflict":
      return { ...item, status: "conflict", conflictCode: result.code, lastErrorCode: undefined };
    case "rejected":
      return { ...item, status: "failed", lastErrorCode: result.code };
    case "retryable": {
      const attempts = item.attempts + 1;
      if (attempts >= MAX_ATTEMPTS) {
        return { ...item, status: "poisoned", attempts, lastErrorCode: result.code };
      }
      return {
        ...item,
        status: "pending",
        attempts,
        lastErrorCode: result.code,
        nextAttemptAt: new Date(nowMs + retryDelayMs(attempts)).toISOString(),
      };
    }
  }
}

function retryDelayMs(attempt: number): number {
  return Math.min(1_000 * 2 ** Math.max(0, attempt - 1), MAX_RETRY_DELAY_MS);
}

function isProcessable(item: OfflineQueueItem, nowMs: number): boolean {
  return item.status === "pending" && Date.parse(item.nextAttemptAt) <= nowMs;
}

function validatePersistedItem(item: OfflineQueueItem, binding: OfflineBinding, nowMs: number): string | null {
  try {
    assertIdentifiers(item);
    assertQueueAllowed(item.operation);
    assertOfflinePayloadSafe(item.payload);
  } catch {
    return "OFFLINE_QUEUE_CORRUPTED";
  }
  if (!sameBinding(item, binding)) return "OFFLINE_BINDING_MISMATCH";
  if (!Number.isFinite(Date.parse(item.expiresAt)) || Date.parse(item.expiresAt) <= nowMs) return "OFFLINE_TTL_EXPIRED";
  return null;
}

function assertIdentifiers(input: Pick<EnqueueOfflineCommand, keyof OfflineBinding | "clientOperationId" | "idempotencyKey" | "operation">): void {
  assertBinding(input);
  if (!/^[a-zA-Z0-9_-]{8,160}$/.test(input.clientOperationId)) throw new Error("OFFLINE_CLIENT_OPERATION_ID_INVALID");
  if (!/^[a-zA-Z0-9:_-]{8,200}$/.test(input.idempotencyKey)) throw new Error("OFFLINE_IDEMPOTENCY_KEY_INVALID");
  if (!/^[a-z][a-z0-9.]{2,80}$/.test(input.operation)) throw new Error("OFFLINE_OPERATION_INVALID");
}

function assertBinding(binding: OfflineBinding): void {
  for (const value of [binding.tenantId, binding.seasonId, binding.userId, binding.deviceId]) {
    if (!/^[a-zA-Z0-9_-]{3,160}$/.test(value)) throw new Error("OFFLINE_BINDING_INVALID");
  }
  if (!Number.isSafeInteger(binding.sessionVersion) || binding.sessionVersion < 1) throw new Error("OFFLINE_SESSION_VERSION_INVALID");
}

function sameBinding(left: OfflineBinding, right: OfflineBinding): boolean {
  return left.tenantId === right.tenantId && left.seasonId === right.seasonId && left.userId === right.userId && left.deviceId === right.deviceId && left.sessionVersion === right.sessionVersion;
}

function countStatus(summary: OfflineSyncSummary, status: OfflineQueueItem["status"]): void {
  if (status === "synced") summary.synced += 1;
  else if (status === "failed") summary.failed += 1;
  else if (status === "conflict") summary.conflicted += 1;
  else if (status === "poisoned") summary.poisoned += 1;
  else if (status === "pending") summary.pending += 1;
}
