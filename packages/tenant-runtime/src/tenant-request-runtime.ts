import type {
  OrganizationId,
  SupportSessionContract,
  SupportSessionId,
  TenantInstanceId,
  TenantRequestContext,
  UserId,
} from "@tilbecore/contracts";
import type { TilbeCoreDomainConfig } from "@tilbecore/config";
import {
  assertTenantOperationAccess,
  safeTenantRuntimeFailure,
  TenantAwareConnectionPool,
  type TenantConnectionLease,
  TenantRuntimeError,
} from "./tenant-connection-pool";
import {
  resolveTenantRuntime,
  type PlatformUserSessionIdentity,
  type TenantRegistry,
  type TenantSessionIdentity,
} from "./tenant-resolution";

export interface SupportSessionRegistry {
  findById(id: SupportSessionId): Promise<SupportSessionContract | null>;
}

export interface TenantRequestAuditEvent {
  organizationId?: OrganizationId;
  tenantInstanceId?: TenantInstanceId;
  actorKind?: "tenant" | "platform" | "public_tracking";
  actorUserId?: UserId;
  supportSessionId?: SupportSessionId;
  supportReason?: string;
  requestedScope: string;
  requestId: string;
  traceId: string;
  result: "success" | "denied" | "failure";
  failureCode?: string;
  occurredAt: string;
}

export interface TenantRequestAuditPort {
  record(event: TenantRequestAuditEvent): Promise<void>;
}

export interface ExecuteTenantRequestInput {
  hostHeader: string;
  requestId: string;
  traceId: string;
  requestedScope: string;
  session: TenantSessionIdentity;
}

export class TenantRequestRuntime<TClient> {
  constructor(
    private readonly config: TilbeCoreDomainConfig,
    private readonly registry: TenantRegistry,
    private readonly pool: TenantAwareConnectionPool<TClient>,
    private readonly supportSessions: SupportSessionRegistry,
    private readonly audit: TenantRequestAuditPort,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async execute<TResult>(
    input: ExecuteTenantRequestInput,
    handler: (args: { context: TenantRequestContext; client: TClient }) => Promise<TResult>,
  ): Promise<TResult> {
    assertSafeRequestIdentifier(input.requestId, "TENANT_REQUEST_ID_INVALID");
    assertSafeRequestIdentifier(input.traceId, "TENANT_TRACE_ID_INVALID");
    assertSafeScope(input.requestedScope);
    let event = baseAuditEvent(input, this.now());
    let resolved: Awaited<ReturnType<typeof resolveTenantRuntime>>;
    let supportSession: SupportSessionContract | undefined;
    let context: TenantRequestContext;
    try {
      resolved = await resolveTenantRuntime(this.config, this.registry, input);
      event = {
        ...event,
        organizationId: resolved.context.organizationId,
        tenantInstanceId: resolved.context.tenantInstanceId,
      };
      supportSession = await this.resolveAccess(
        input.session,
        resolved.context.organizationId,
        resolved.context.tenantInstanceId,
        input.requestedScope,
      );
      context = createRequestContext(input, resolved.context.organizationId, resolved.context.tenantInstanceId,
        resolved.normalizedHost, resolved.context.databaseRefId, supportSession);
      assertTenantRequestContextSafe(context);
      event = {
        ...event,
        organizationId: context.organizationId,
        tenantInstanceId: context.tenantId,
        actorUserId: context.userId,
        supportSessionId: context.supportSession?.id,
        supportReason: context.supportSession?.reason,
      };

    } catch (error) {
      await this.recordAudit({
        ...event,
        result: "denied",
        failureCode: safeTenantRuntimeFailure(error).code,
      });
      throw error;
    }

    let lease: TenantConnectionLease<TClient> | undefined;
    try {
      lease = await this.pool.acquire({
        context: resolved.context,
        resolvedDatabaseRef: resolved.descriptor.databaseRef,
      });
      const result = await handler({ context, client: lease.client });
      await this.recordAudit({ ...event, result: "success" });
      return result;
    } catch (error) {
      await this.recordAudit({
        ...event,
        result: "failure",
        failureCode: safeTenantRuntimeFailure(error).code,
      });
      throw error;
    } finally {
      lease?.release();
    }
  }

  async closeIdle(): Promise<number> {
    return this.pool.closeIdle();
  }

  async shutdown(): Promise<void> {
    await this.pool.shutdown();
  }

  private async resolveAccess(
    session: TenantSessionIdentity,
    organizationId: OrganizationId,
    tenantInstanceId: TenantInstanceId,
    requestedScope: string,
  ): Promise<SupportSessionContract | undefined> {
    if (session.kind === "public_tracking") {
      throw new TenantRuntimeError("PUBLIC_TRACKING_SESSION_NOT_TENANT_SESSION");
    }
    if (session.kind === "tenant") {
      if (!session.permissions.includes(requestedScope)) {
        throw new TenantRuntimeError("TENANT_PERMISSION_DENIED");
      }
      assertTenantOperationAccess({
        actorKind: "tenant",
        organizationId,
        tenantInstanceId,
        requestedScope,
        nowIso: this.now(),
      });
      return undefined;
    }
    if (!session.permissions.includes("tenant.support")) {
      throw new TenantRuntimeError("PLATFORM_SUPPORT_PERMISSION_REQUIRED");
    }
    const supportSession = await this.resolvePlatformSupportSession(session);
    assertTenantOperationAccess({
      actorKind: "platform",
      organizationId,
      tenantInstanceId,
      requestedScope,
      nowIso: this.now(),
      supportSession,
    });
    return supportSession;
  }

  private async resolvePlatformSupportSession(
    session: PlatformUserSessionIdentity,
  ): Promise<SupportSessionContract> {
    if (!session.supportSessionId) throw new TenantRuntimeError("SUPPORT_SESSION_REQUIRED");
    const supportSession = await this.supportSessions.findById(session.supportSessionId as SupportSessionId);
    if (!supportSession) throw new TenantRuntimeError("SUPPORT_SESSION_NOT_FOUND");
    return supportSession;
  }

  private async recordAudit(event: TenantRequestAuditEvent): Promise<void> {
    try {
      await this.audit.record(event);
    } catch {
      throw new TenantRuntimeError("TENANT_REQUEST_AUDIT_FAILED");
    }
  }
}

export function assertTenantRequestContextSafe(context: TenantRequestContext): TenantRequestContext {
  const serialized = JSON.stringify(context);
  if (/postgres(?:ql)?:\/\/|password|secret|connectionString|databaseUrl|privateKey/i.test(serialized)) {
    throw new TenantRuntimeError("TENANT_REQUEST_CONTEXT_UNSAFE");
  }
  return context;
}

export function safeTenantRequestFailure(error: unknown): { code: string; requestId?: string } {
  return safeTenantRuntimeFailure(error);
}

function createRequestContext(
  input: ExecuteTenantRequestInput,
  organizationId: OrganizationId,
  tenantInstanceId: TenantInstanceId,
  normalizedHost: string,
  databaseRefId: TenantRequestContext["tenantDatabaseRefId"],
  supportSession: SupportSessionContract | undefined,
): TenantRequestContext {
  if (input.session.kind === "public_tracking") {
    throw new TenantRuntimeError("PUBLIC_TRACKING_SESSION_NOT_TENANT_SESSION");
  }
  return {
    organizationId,
    tenantId: tenantInstanceId,
    normalizedHost,
    tenantDatabaseRefId: databaseRefId,
    userId: input.session.userId as UserId,
    sessionId: input.session.sessionId,
    actorKind: input.session.kind,
    roleIds: [...input.session.roleIds],
    permissions: [...input.session.permissions],
    supportSession: supportSession ? {
      id: supportSession.id,
      reason: supportSession.reason,
      scopes: [...supportSession.scopes],
      startsAt: supportSession.startsAt,
      expiresAt: supportSession.expiresAt,
    } : undefined,
    requestId: input.requestId,
    traceId: input.traceId,
  };
}

function baseAuditEvent(input: ExecuteTenantRequestInput, occurredAt: string): TenantRequestAuditEvent {
  return {
    actorKind: input.session.kind,
    actorUserId: input.session.kind === "public_tracking" ? undefined : input.session.userId as UserId,
    requestedScope: input.requestedScope,
    requestId: input.requestId,
    traceId: input.traceId,
    result: "denied",
    occurredAt,
  };
}

function assertSafeRequestIdentifier(value: string, code: string): void {
  if (!/^[a-zA-Z0-9._:-]{8,128}$/.test(value)) throw new TenantRuntimeError(code);
}

function assertSafeScope(value: string): void {
  if (!/^[a-z][a-z0-9_.:-]{2,100}$/.test(value)) {
    throw new TenantRuntimeError("TENANT_REQUEST_SCOPE_INVALID");
  }
}
