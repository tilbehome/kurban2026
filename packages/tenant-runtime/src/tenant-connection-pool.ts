import type {
  SupportSessionContract,
  TenantDatabaseRef,
  TenantInstanceId,
  TenantRuntimeContext,
} from "@tilbecore/contracts";
import { createTenantConnectionPoolKey } from "./tenant-connection-policy";

export interface TenantConnectionBinding {
  tenantInstanceId: TenantInstanceId;
  databaseRefId: TenantDatabaseRef["id"];
}

export interface TenantConnectionResource<TClient> {
  client: TClient;
  dispose(): Promise<void>;
}

export interface TenantConnectionFactory<TClient> {
  create(binding: TenantConnectionBinding): Promise<TenantConnectionResource<TClient>>;
}

export interface TenantConnectionLease<TClient> {
  client: TClient;
  release(): void;
}

export interface TenantPoolMetric {
  name:
    | "tenant.pool.created"
    | "tenant.pool.reused"
    | "tenant.pool.active_leases"
    | "tenant.pool.closed"
    | "tenant.pool.error";
  value: number;
  attributes: {
    tenantId: string;
    reason?: "idle" | "shutdown" | "connection";
  };
}

export interface TenantPoolEvent {
  name: "tenant.pool.create" | "tenant.pool.reuse" | "tenant.pool.close" | "tenant.pool.failure";
  tenantId: string;
  requestId?: string;
  traceId?: string;
  occurredAt: string;
}

export interface TenantPoolObservabilityPort {
  recordMetric(metric: TenantPoolMetric): void;
  emit(event: TenantPoolEvent): void;
}

interface PoolEntry<TClient> extends TenantConnectionResource<TClient> {
  binding: TenantConnectionBinding;
  activeLeases: number;
  lastUsedAt: number;
  closed: boolean;
}

export class TenantAwareConnectionPool<TClient> {
  private readonly entries = new Map<string, PoolEntry<TClient>>();
  private readonly pending = new Map<string, Promise<PoolEntry<TClient>>>();
  private readonly databaseRefOwners = new Map<string, TenantInstanceId>();
  private shuttingDown = false;

  constructor(
    private readonly factory: TenantConnectionFactory<TClient>,
    private readonly idleTimeoutMs: number,
    private readonly clock: () => number = Date.now,
    private readonly observability?: TenantPoolObservabilityPort,
  ) {
    if (!Number.isFinite(idleTimeoutMs) || idleTimeoutMs < 1) {
      throw new TenantRuntimeError("TENANT_POOL_IDLE_TIMEOUT_INVALID");
    }
  }

  async acquire(input: {
    context: TenantRuntimeContext;
    resolvedDatabaseRef: TenantDatabaseRef;
  }): Promise<TenantConnectionLease<TClient>> {
    if (this.shuttingDown) throw new TenantRuntimeError("TENANT_POOL_SHUTTING_DOWN");
    const key = createTenantConnectionPoolKey({
      tenantInstanceId: input.context.tenantInstanceId,
      expectedDatabaseRefId: input.context.databaseRefId,
      resolvedDatabaseRef: input.resolvedDatabaseRef,
    });
    const binding: TenantConnectionBinding = key;
    const serializedKey = poolKey(binding);
    this.assertDatabaseRefOwnership(binding);
    if (!this.databaseRefOwners.has(binding.databaseRefId)) {
      this.databaseRefOwners.set(binding.databaseRefId, binding.tenantInstanceId);
    }

    let entry = this.entries.get(serializedKey);
    let createdByAcquire = false;
    if (!entry) {
      let creation = this.pending.get(serializedKey);
      if (!creation) {
        creation = this.createEntry(binding);
        this.pending.set(serializedKey, creation);
        createdByAcquire = true;
      }
      try {
        entry = await creation;
      } finally {
        this.pending.delete(serializedKey);
      }
    }
    if (entry.closed) throw new TenantRuntimeError("TENANT_POOL_ENTRY_CLOSED");

    entry.activeLeases += 1;
    entry.lastUsedAt = this.clock();
    this.observe(createdByAcquire ? "tenant.pool.create" : "tenant.pool.reuse", binding, input.context);
    this.metric(createdByAcquire ? "tenant.pool.created" : "tenant.pool.reused", 1, binding);
    this.metric("tenant.pool.active_leases", entry.activeLeases, binding);
    let released = false;
    return {
      client: entry.client,
      release: () => {
        if (released) return;
        released = true;
        entry.activeLeases = Math.max(0, entry.activeLeases - 1);
        entry.lastUsedAt = this.clock();
        this.metric("tenant.pool.active_leases", entry.activeLeases, binding);
      },
    };
  }

  async closeIdle(now = this.clock()): Promise<number> {
    let closed = 0;
    for (const [key, entry] of this.entries) {
      if (entry.activeLeases > 0 || now - entry.lastUsedAt < this.idleTimeoutMs) continue;
      await this.closeEntry(key, entry, "idle");
      closed += 1;
    }
    return closed;
  }

  async shutdown(): Promise<void> {
    this.shuttingDown = true;
    await Promise.allSettled([...this.pending.values()]);
    const entries = [...this.entries.entries()];
    await Promise.all(entries.map(([key, entry]) => this.closeEntry(key, entry, "shutdown")));
  }

  snapshot(): readonly { tenantInstanceId: TenantInstanceId; databaseRefId: TenantDatabaseRef["id"]; activeLeases: number }[] {
    return [...this.entries.values()].map((entry) => ({
      tenantInstanceId: entry.binding.tenantInstanceId,
      databaseRefId: entry.binding.databaseRefId,
      activeLeases: entry.activeLeases,
    }));
  }

  private async createEntry(binding: TenantConnectionBinding): Promise<PoolEntry<TClient>> {
    try {
      const resource = await this.factory.create(binding);
      const entry: PoolEntry<TClient> = {
        ...resource,
        binding,
        activeLeases: 0,
        lastUsedAt: this.clock(),
        closed: false,
      };
      this.entries.set(poolKey(binding), entry);
      this.databaseRefOwners.set(binding.databaseRefId, binding.tenantInstanceId);
      return entry;
    } catch {
      if (!this.entries.has(poolKey(binding))) {
        this.databaseRefOwners.delete(binding.databaseRefId);
      }
      this.observe("tenant.pool.failure", binding);
      this.metric("tenant.pool.error", 1, binding, "connection");
      throw new TenantRuntimeError("TENANT_DATABASE_CONNECTION_FAILED");
    }
  }

  private assertDatabaseRefOwnership(binding: TenantConnectionBinding): void {
    const owner = this.databaseRefOwners.get(binding.databaseRefId);
    if (owner && owner !== binding.tenantInstanceId) {
      throw new TenantRuntimeError("TENANT_DATABASE_REF_OWNER_MISMATCH");
    }
  }

  private async closeEntry(
    key: string,
    entry: PoolEntry<TClient>,
    reason: "idle" | "shutdown",
  ): Promise<void> {
    if (entry.closed) return;
    entry.closed = true;
    try {
      await entry.dispose();
    } finally {
      this.entries.delete(key);
      this.databaseRefOwners.delete(entry.binding.databaseRefId);
      this.observe("tenant.pool.close", entry.binding);
      this.metric("tenant.pool.closed", 1, entry.binding, reason);
    }
  }

  private observe(
    name: TenantPoolEvent["name"],
    binding: TenantConnectionBinding,
    context?: TenantRuntimeContext,
  ): void {
    try {
      this.observability?.emit({
        name,
        tenantId: binding.tenantInstanceId,
        requestId: context?.requestId,
        traceId: context?.traceId,
        occurredAt: new Date(this.clock()).toISOString(),
      });
    } catch {
      // Gözlemlenebilirlik sağlayıcısı request veya pool yaşam döngüsünü bozamaz.
    }
  }

  private metric(
    name: TenantPoolMetric["name"],
    value: number,
    binding: TenantConnectionBinding,
    reason?: TenantPoolMetric["attributes"]["reason"],
  ): void {
    try {
      this.observability?.recordMetric({
        name,
        value,
        attributes: { tenantId: binding.tenantInstanceId, reason },
      });
    } catch {
      // Gözlemlenebilirlik sağlayıcısı request veya pool yaşam döngüsünü bozamaz.
    }
  }
}

export function assertTenantOperationAccess(input: {
  actorKind: "tenant" | "platform";
  organizationId?: TenantRuntimeContext["organizationId"];
  tenantInstanceId: TenantInstanceId;
  requestedScope: string;
  nowIso: string;
  supportSession?: SupportSessionContract;
}): void {
  if (input.actorKind === "tenant") return;
  const session = input.supportSession;
  if (!session) throw new TenantRuntimeError("SUPPORT_SESSION_REQUIRED");
  if (input.organizationId && session.organizationId !== input.organizationId) {
    throw new TenantRuntimeError("SUPPORT_SESSION_ORGANIZATION_MISMATCH");
  }
  if (session.tenantInstanceId !== input.tenantInstanceId) {
    throw new TenantRuntimeError("SUPPORT_SESSION_TENANT_MISMATCH");
  }
  if (!session.scopes.includes(input.requestedScope)) {
    throw new TenantRuntimeError("SUPPORT_SESSION_SCOPE_DENIED");
  }
  if (!session.reason.trim() || !session.approvedByUserId) {
    throw new TenantRuntimeError("SUPPORT_SESSION_APPROVAL_REQUIRED");
  }
  const now = Date.parse(input.nowIso);
  if (
    Number.isNaN(now) ||
    Date.parse(session.startsAt) > now ||
    Date.parse(session.expiresAt) <= now
  ) {
    throw new TenantRuntimeError("SUPPORT_SESSION_NOT_ACTIVE");
  }
}

export function safeTenantRuntimeFailure(error: unknown): { code: string } {
  if (error instanceof TenantRuntimeError) return { code: error.code };
  if (error instanceof Error) {
    const candidate = error.message.split(":", 1)[0];
    if (candidate && /^[A-Z][A-Z0-9_]{2,80}$/.test(candidate)) return { code: candidate };
  }
  return { code: "TENANT_RUNTIME_FAILURE" };
}

export class TenantRuntimeError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "TenantRuntimeError";
  }
}

function poolKey(binding: TenantConnectionBinding): string {
  return `${binding.tenantInstanceId}::${binding.databaseRefId}`;
}
