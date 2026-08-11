import { describe, expect, test } from "vitest";
import { createTilbeCoreDomainConfig } from "@tilbecore/config";
import type {
  PlatformTenantDescriptor,
  SupportSessionContract,
  TenantDatabaseRefId,
  TenantInstanceId,
  TenantSlug,
} from "@tilbecore/contracts";
import {
  TenantAwareConnectionPool,
  TenantRequestRuntime,
  safeTenantRequestFailure,
  type PlatformUserSessionIdentity,
  type TenantConnectionFactory,
  type TenantPoolEvent,
  type TenantPoolMetric,
  type TenantRequestAuditEvent,
  type TenantUserSessionIdentity,
} from "../src";

interface TestClient { tenantId: string }

describe("tenant request runtime", () => {
  test("eşzamanlı firma isteklerini request-scope context ve ayrı client ile çalıştırır", async () => {
    const descriptors = [descriptor("a"), descriptor("b")];
    const events: TenantPoolEvent[] = [];
    const metrics: TenantPoolMetric[] = [];
    const audits: TenantRequestAuditEvent[] = [];
    const disposed: string[] = [];
    const factory: TenantConnectionFactory<TestClient> = {
      async create(binding) {
        return {
          client: { tenantId: binding.tenantInstanceId },
          async dispose() { disposed.push(binding.tenantInstanceId); },
        };
      },
    };
    const pool = new TenantAwareConnectionPool(factory, 100, () => 1_000, {
      emit(event) { events.push(event); },
      recordMetric(metric) { metrics.push(metric); },
    });
    const runtime = createRuntime(descriptors, pool, audits);

    const [resultA, resultB] = await Promise.all([
      runtime.execute(request("a"), async ({ context, client }) => ({ context, client })),
      runtime.execute(request("b"), async ({ context, client }) => ({ context, client })),
    ]);

    expect(resultA.client.tenantId).toBe("tenant_a");
    expect(resultB.client.tenantId).toBe("tenant_b");
    expect(resultA.context.tenantId).toBe("tenant_a");
    expect(resultB.context.tenantId).toBe("tenant_b");
    expect(resultA.context.normalizedHost).toBe("firma-a.tilbecore.test");
    expect(JSON.stringify(resultA.context)).not.toMatch(/postgresql|password|secret|databaseUrl/i);
    expect(events.map((event) => event.name)).toEqual(["tenant.pool.create", "tenant.pool.create"]);
    expect(metrics.filter((metric) => metric.name === "tenant.pool.created")).toHaveLength(2);
    expect(audits.filter((event) => event.result === "success")).toHaveLength(2);

    await runtime.shutdown();
    expect(disposed.sort()).toEqual(["tenant_a", "tenant_b"]);
  });

  test("yanlış firma session'ı, public takip kimliği ve desteksiz platform erişimini reddeder", async () => {
    const descriptors = [descriptor("a"), descriptor("b")];
    const audits: TenantRequestAuditEvent[] = [];
    const pool = new TenantAwareConnectionPool<TestClient>({
      async create(binding) { return { client: { tenantId: binding.tenantInstanceId }, async dispose() {} }; },
    }, 100);
    const runtime = createRuntime(descriptors, pool, audits);

    await expect(runtime.execute({ ...request("a"), session: session("b") }, async () => null))
      .rejects.toThrow("TENANT_SESSION_ORGANIZATION_MISMATCH");
    await expect(runtime.execute({
      ...request("a"),
      session: { kind: "public_tracking", tenantInstanceId: "tenant_a" as TenantInstanceId, purpose: "customerTracking", tokenId: "opaque_id" },
    }, async () => null)).rejects.toThrow("PUBLIC_TRACKING_SESSION_NOT_TENANT_SESSION");
    await expect(runtime.execute({ ...request("a"), session: platformSession() }, async () => null))
      .rejects.toThrow("SUPPORT_SESSION_REQUIRED");
    await expect(runtime.execute({
      ...request("a"),
      requestedScope: "finance.write",
    }, async () => null)).rejects.toThrow("TENANT_PERMISSION_DENIED");

    expect(audits.filter((event) => event.result === "denied")).toHaveLength(4);
    expect(audits.map((event) => event.failureCode)).not.toContain(expect.stringMatching(/postgres|password/i));
  });

  test("onaylı SupportSession yalnız tenant, süre ve scope sınırında çalışır ve auditlenir", async () => {
    const descriptors = [descriptor("a")];
    const audits: TenantRequestAuditEvent[] = [];
    const pool = new TenantAwareConnectionPool<TestClient>({
      async create(binding) { return { client: { tenantId: binding.tenantInstanceId }, async dispose() {} }; },
    }, 100);
    const runtime = createRuntime(descriptors, pool, audits, supportSession());
    const input = { ...request("a"), session: { ...platformSession(), supportSessionId: "support_a" } };

    const result = await runtime.execute(input, async ({ context }) => context);
    expect(result.actorKind).toBe("platform");
    expect(result.supportSession).toMatchObject({ id: "support_a", reason: "Firma onaylı inceleme" });
    expect(audits.at(-1)).toMatchObject({
      result: "success",
      supportSessionId: "support_a",
      requestedScope: "customer.read",
    });

    const denied = await runtime.execute({ ...input, requestedScope: "finance.write" }, async () => null)
      .catch(safeTenantRequestFailure);
    expect(denied).toEqual({ code: "SUPPORT_SESSION_SCOPE_DENIED" });
  });
});

function createRuntime(
  descriptors: PlatformTenantDescriptor[],
  pool: TenantAwareConnectionPool<TestClient>,
  audits: TenantRequestAuditEvent[],
  support?: SupportSessionContract,
) {
  return new TenantRequestRuntime(
    createTilbeCoreDomainConfig("local"),
    {
      async findBySlug(slug) { return descriptors.find((item) => item.slug === slug) ?? null; },
      async findCustomDomains() { return []; },
    },
    pool,
    { async findById(id) { return support?.id === id ? support : null; } },
    { async record(event) { audits.push(event); } },
    () => "2026-08-11T10:00:00.000Z",
  );
}

function descriptor(label: string): PlatformTenantDescriptor {
  return {
    organizationId: `org_${label}` as PlatformTenantDescriptor["organizationId"],
    organizationStatus: "active",
    tenantInstanceId: `tenant_${label}` as TenantInstanceId,
    slug: `firma-${label}` as TenantSlug,
    displayName: `Firma ${label.toUpperCase()}`,
    deploymentMode: "managed",
    provisioningStatus: "active",
    runtimeStatus: "healthy",
    releaseChannel: "stable",
    databaseRef: { id: `dbref_${label}` as TenantDatabaseRefId, engine: "postgresql", managed: true },
    databaseRefStatus: "active",
    moduleEntitlements: [],
    limits: {},
  };
}

function session(label: string): TenantUserSessionIdentity {
  return {
    kind: "tenant",
    organizationId: `org_${label}` as TenantUserSessionIdentity["organizationId"],
    tenantInstanceId: `tenant_${label}` as TenantInstanceId,
    databaseRefId: `dbref_${label}` as TenantDatabaseRefId,
    sessionId: `session_${label}_123`,
    userId: `user_${label}_123`,
    roleIds: ["firm_admin"],
    permissions: ["customer.read"],
  };
}

function platformSession(): PlatformUserSessionIdentity {
  return {
    kind: "platform",
    sessionId: "platform_session_123",
    userId: "platform_user_123",
    roleIds: ["platform_admin"],
    permissions: ["tenant.support"],
  };
}

function request(label: string) {
  return {
    hostHeader: `firma-${label}.tilbecore.test`,
    requestId: `request_${label}_123`,
    traceId: `trace_${label}_12345`,
    requestedScope: "customer.read",
    session: session(label),
  };
}

function supportSession(): SupportSessionContract {
  return {
    id: "support_a" as SupportSessionContract["id"],
    organizationId: "org_a" as SupportSessionContract["organizationId"],
    tenantInstanceId: "tenant_a" as TenantInstanceId,
    reason: "Firma onaylı inceleme",
    approvedByUserId: "approver_123" as SupportSessionContract["approvedByUserId"],
    startsAt: "2026-08-11T09:00:00.000Z",
    expiresAt: "2026-08-11T11:00:00.000Z",
    scopes: ["customer.read"],
  };
}
