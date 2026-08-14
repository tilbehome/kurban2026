export type OfflineCapability =
  | "ONLINE_REQUIRED"
  | "QUEUE_ALLOWED"
  | "READ_CACHE"
  | "NEVER_CACHE_SENSITIVE";

export type OfflineQueueStatus =
  | "pending"
  | "syncing"
  | "synced"
  | "failed"
  | "conflict"
  | "poisoned";

export interface OfflineBinding {
  tenantId: string;
  seasonId: string;
  userId: string;
  deviceId: string;
  sessionVersion: number;
}

export interface OfflineQueueItem extends OfflineBinding {
  clientOperationId: string;
  idempotencyKey: string;
  operation: string;
  expectedVersion: number;
  capability: "QUEUE_ALLOWED";
  payload: Readonly<Record<string, unknown>>;
  status: OfflineQueueStatus;
  createdAt: string;
  expiresAt: string;
  attempts: number;
  nextAttemptAt: string;
  lastErrorCode?: string;
  conflictCode?: string;
  serverResultId?: string;
}

export interface EnqueueOfflineCommand extends OfflineBinding {
  clientOperationId: string;
  idempotencyKey: string;
  operation: string;
  expectedVersion: number;
  payload: Readonly<Record<string, unknown>>;
  createdAt: string;
  ttlMs: number;
}

export interface OfflineQueueRepository {
  put(item: OfflineQueueItem): Promise<void>;
  find(clientOperationId: string): Promise<OfflineQueueItem | null>;
  listByBinding(binding: OfflineBinding): Promise<readonly OfflineQueueItem[]>;
}

export type PermissionDecision =
  | { allowed: true }
  | {
      allowed: false;
      code:
        | "PERMISSION_REVOKED"
        | "SESSION_REVOKED"
        | "DEVICE_REVOKED"
        | "TENANT_SUSPENDED";
    };

export interface OfflinePermissionPort {
  revalidate(item: OfflineQueueItem): Promise<PermissionDecision>;
}

export type SyncTransportResult =
  | { kind: "applied" | "duplicate"; serverResultId: string }
  | { kind: "conflict"; code: string }
  | { kind: "rejected"; code: string }
  | { kind: "retryable"; code: string };

export interface OfflineSyncTransport {
  send(item: OfflineQueueItem): Promise<SyncTransportResult>;
}

export interface OfflineSyncSummary {
  attempted: number;
  synced: number;
  failed: number;
  conflicted: number;
  poisoned: number;
  pending: number;
}
