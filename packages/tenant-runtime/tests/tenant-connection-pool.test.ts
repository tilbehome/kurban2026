import { describe, expect, it } from "vitest";
import type {
  TenantDatabaseRef,
  TenantDatabaseRefId,
  TenantInstanceId,
  TenantRuntimeContext,
} from "@tilbecore/contracts";
import {
  TenantAwareConnectionPool,
  assertTenantOperationAccess,
  safeTenantRuntimeFailure,
  type TenantConnectionFactory,
} from "../src";

describe("tenant-aware connection pool", () => {
  it("tenant başına ayrı kaynak açar, eşzamanlı istekte aynı kaynağı kullanır ve idle kaynağı kapatır", async () => {
    let now = 100;
    const created: string[] = [];
    const closed: string[] = [];
    const factory: TenantConnectionFactory<{ key: string }> = {
      async create(binding) {
        const key = `${binding.tenantInstanceId}:${binding.databaseRefId}`;
        created.push(key);
        return { client: { key }, async dispose() { closed.push(key); } };
      },
    };
    const pool = new TenantAwareConnectionPool(factory, 50, () => now);

    const [first, second] = await Promise.all([
      pool.acquire(bindingFor("a")),
      pool.acquire(bindingFor("a")),
    ]);
    const other = await pool.acquire(bindingFor("b"));

    expect(first.client).toBe(second.client);
    expect(first.client).not.toBe(other.client);
    expect(created).toHaveLength(2);
    first.release();
    second.release();
    other.release();
    now = 151;
    await expect(pool.closeIdle()).resolves.toBe(2);
    expect(closed).toHaveLength(2);
  });

  it("aynı databaseRef'i farklı tenant için kullanmaz ve factory ayrıntısını güvenli koda indirger", async () => {
    const factory: TenantConnectionFactory<object> = {
      async create() { return { client: {}, async dispose() {} }; },
    };
    const pool = new TenantAwareConnectionPool(factory, 100);
    const lease = await pool.acquire(bindingFor("a"));

    await expect(pool.acquire({
      context: contextFor("b", "dbref_a"),
      resolvedDatabaseRef: databaseRef("dbref_a"),
    })).rejects.toThrow("TENANT_DATABASE_REF_OWNER_MISMATCH");
    lease.release();
    await pool.shutdown();

    const failing = new TenantAwareConnectionPool<object>({
      async create() { throw new Error("postgresql://user:password@host/private_database"); },
    }, 100);
    const failure = await failing.acquire(bindingFor("c")).catch(safeTenantRuntimeFailure);
    expect(failure).toEqual({ code: "TENANT_DATABASE_CONNECTION_FAILED" });
    expect(JSON.stringify(failure)).not.toMatch(/postgres|password|private_database/i);
  });

  it("platform aktörü SupportSession olmadan tenant operasyon verisine erişemez", () => {
    const tenantInstanceId = "tenant_a" as TenantInstanceId;
    expect(() => assertTenantOperationAccess({
      actorKind: "platform",
      tenantInstanceId,
      requestedScope: "customer.read",
      nowIso: "2026-08-10T10:00:00.000Z",
    })).toThrow("SUPPORT_SESSION_REQUIRED");

    expect(() => assertTenantOperationAccess({
      actorKind: "platform",
      tenantInstanceId,
      requestedScope: "customer.read",
      nowIso: "2026-08-10T10:00:00.000Z",
      supportSession: {
        id: "support_1" as never,
        organizationId: "org_a" as never,
        tenantInstanceId,
        reason: "Test",
        approvedByUserId: "approver_1" as never,
        startsAt: "2026-08-10T09:00:00.000Z",
        expiresAt: "2026-08-10T11:00:00.000Z",
        scopes: ["customer.read"],
      },
    })).not.toThrow();
  });
});

function bindingFor(label: string) {
  return {
    context: contextFor(label, `dbref_${label}`),
    resolvedDatabaseRef: databaseRef(`dbref_${label}`),
  };
}

function contextFor(label: string, databaseRefId: string): TenantRuntimeContext {
  return {
    organizationId: `org_${label}` as never,
    tenantInstanceId: `tenant_${label}` as TenantInstanceId,
    slug: `tenant-${label}` as never,
    databaseRefId: databaseRefId as TenantDatabaseRefId,
    deploymentMode: "managed",
    normalizedHost: `tenant-${label}.tilbecore.test`,
    requestId: `request_${label}`,
    traceId: `trace_${label}`,
  };
}

function databaseRef(id: string): TenantDatabaseRef {
  return { id: id as TenantDatabaseRefId, engine: "postgresql", managed: true };
}
