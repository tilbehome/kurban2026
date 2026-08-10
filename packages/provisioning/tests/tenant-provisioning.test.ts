import { describe, expect, it } from "vitest";
import {
  assertNoSecretInProvisioningResult,
  provisionTenant,
  type ProvisionTenantCommand,
  type ProvisioningJobRecord,
  type ProvisioningJobRepository,
  type TenantDatabaseProvisioner,
} from "../src";
import type {
  Organization,
  OrganizationRepository,
  PlatformUser,
  PlatformUserId,
  PlatformUserRepository,
  TenantDatabaseRefRecord,
  TenantDatabaseRefRepository,
  TenantInstance,
  TenantInstanceRepository,
} from "@tilbecore/platform";
import type {
  OrganizationId,
  TenantDatabaseRefId,
  TenantInstanceId,
  TenantSlug,
} from "@tilbecore/contracts";
import type { ProvisioningIdempotencyKey } from "../src";

describe("tenant provisioning orchestration", () => {
  it("adımları kalıcı sırayla çalıştırır ve aynı tenant isteğini mükerrer oluşturmadan döndürür", async () => {
    const fixture = createFixture();
    const first = await provisionTenant(fixture.dependencies, commandFor());
    const callsAfterFirst = [...fixture.calls];
    const second = await provisionTenant(fixture.dependencies, commandFor());

    expect(first.job.status).toBe("succeeded");
    expect(first.completedSteps).toEqual([
      "tenant_database.create",
      "tenant_database.migrate",
      "tenant_database.verify_isolation",
      "platform.organization.register",
      "platform.tenant.register",
      "platform.admin_invite.prepare",
    ]);
    expect(fixture.calls).toEqual(callsAfterFirst);
    expect(second.job.id).toBe(first.job.id);
    expect(fixture.jobs.items).toHaveLength(1);
    expect(JSON.stringify(first)).not.toContain("postgresql://");
  });

  it("migration başarısızsa yalnız bu işin oluşturduğu DB'yi rollback eder ve resume yeniden tamamlar", async () => {
    const fixture = createFixture({ failMigrationOnce: true });
    await expect(provisionTenant(fixture.dependencies, commandFor())).rejects.toThrow("TENANT_MIGRATION_FAILED");

    expect(fixture.calls).toEqual(["db.create", "db.migrate", "db.rollback"]);
    expect(fixture.jobs.items[0]).toMatchObject({ status: "rolled_back", rollbackStatus: "succeeded" });

    const resumed = await provisionTenant(fixture.dependencies, commandFor());
    expect(resumed.job.status).toBe("succeeded");
    expect(fixture.calls.filter((call) => call === "db.create")).toHaveLength(2);
  });

  it("platform tenant kaydı tamamlandıktan sonraki hata DB rollback yapmaz ve güvenli adımdan devam eder", async () => {
    const fixture = createFixture({ failAdminOnce: true });
    await expect(provisionTenant(fixture.dependencies, commandFor())).rejects.toThrow("PLATFORM_ADMIN_CREATE_FAILED");
    expect(fixture.calls).not.toContain("db.rollback");
    expect(fixture.jobs.items[0]).toMatchObject({
      status: "failed",
      platformRegistrationCompleted: true,
    });

    const resumed = await provisionTenant(fixture.dependencies, commandFor());
    expect(resumed.job.status).toBe("succeeded");
    expect(fixture.calls.filter((call) => call === "db.create")).toHaveLength(1);
    expect(fixture.calls.filter((call) => call === "tenant.createWithDatabaseRef")).toHaveLength(1);
  });

  it("yanlış databaseRef ve secret içeren değerleri fail-closed reddeder", async () => {
    await expect(provisionTenant(createFixture().dependencies, {
      ...commandFor(),
      tenant: { ...tenant(), databaseRef: { ...databaseRef(), id: "other_db" as TenantDatabaseRefId } },
    })).rejects.toThrow("PROVISIONING_DATABASE_REF_MISMATCH");

    expect(() => assertNoSecretInProvisioningResult({
      id: "db_1",
      databaseUrl: "postgresql://user:password@example.test/db",
    })).toThrow("PROVISIONING_SECRET_LEAK");
  });
});

function createFixture(options: { failMigrationOnce?: boolean; failAdminOnce?: boolean } = {}) {
  const calls: string[] = [];
  const organizations = new Map<string, Organization>();
  const tenants = new Map<string, TenantInstance>();
  const refs = new Map<string, TenantDatabaseRefRecord>();
  const users = new Map<string, PlatformUser>();
  const jobs = new InMemoryJobRepository();
  let migrationFailed = false;
  let adminFailed = false;

  const organizationRepository: OrganizationRepository = {
    async create(input) { calls.push("organization.create"); organizations.set(input.id, input); return input; },
    async findById(id) { return organizations.get(id) ?? null; },
    async findBySlug(slug) { return [...organizations.values()].find((item) => item.slug === slug) ?? null; },
  };
  const tenantDatabaseRefRepository: TenantDatabaseRefRepository = {
    async create(input) { refs.set(input.id, input); return input; },
    async findById(id) { return refs.get(id) ?? null; },
  };
  const tenantInstanceRepository: TenantInstanceRepository = {
    async create(input) { calls.push("tenant.create"); tenants.set(input.id, input); return input; },
    async createWithDatabaseRef(input, ref) {
      calls.push("tenant.createWithDatabaseRef");
      refs.set(ref.id, ref);
      tenants.set(input.id, input);
      return input;
    },
    async findById(id) { return tenants.get(id) ?? null; },
    async findBySlug(slug) { return [...tenants.values()].find((item) => item.slug === slug) ?? null; },
  };
  const platformUserRepository: PlatformUserRepository = {
    async createUser(input) {
      calls.push("platformUser.createUser");
      if (options.failAdminOnce && !adminFailed) {
        adminFailed = true;
        throw new Error("PLATFORM_ADMIN_CREATE_FAILED:private-detail");
      }
      users.set(input.id, input);
      return input;
    },
    async findUserById(id) { return users.get(id) ?? null; },
    async findUserByEmail(email) { return [...users.values()].find((item) => item.email === email) ?? null; },
    async createRole(input) { return input; },
    async assignRole() { return adminUser(); },
  };
  const tenantDatabaseProvisioner: TenantDatabaseProvisioner = {
    async createDatabase() { calls.push("db.create"); return { createdNow: true, ownedByProvisioningJob: true }; },
    async databaseExists() { return true; },
    async applyMigrations() {
      calls.push("db.migrate");
      if (options.failMigrationOnce && !migrationFailed) {
        migrationFailed = true;
        throw new Error("TENANT_MIGRATION_FAILED:private-database");
      }
    },
    async verifyIsolation() { calls.push("db.verify"); },
    async rollbackDatabase() { calls.push("db.rollback"); return { dropped: true }; },
  };

  return {
    calls,
    jobs,
    dependencies: {
      organizationRepository,
      tenantDatabaseRefRepository,
      tenantInstanceRepository,
      platformUserRepository,
      provisioningJobRepository: jobs,
      tenantDatabaseProvisioner,
      now: () => "2026-08-10T00:00:00.000Z",
    },
  };
}

class InMemoryJobRepository implements ProvisioningJobRepository {
  items: ProvisioningJobRecord[] = [];
  async create(job: ProvisioningJobRecord) { this.items.push(structuredClone(job)); return structuredClone(job); }
  async update(job: ProvisioningJobRecord) {
    const index = this.items.findIndex((item) => item.id === job.id);
    this.items[index] = structuredClone(job);
    return structuredClone(job);
  }
  async findById(id: ProvisioningJobRecord["id"]) { return this.clone(this.items.find((item) => item.id === id)); }
  async findByIdempotencyKey(key: ProvisioningIdempotencyKey) { return this.clone(this.items.find((item) => item.idempotencyKey === key)); }
  async findByTenantInstanceId(id: TenantInstanceId) { return this.clone(this.items.find((item) => item.tenantInstanceId === id)); }
  private clone(job: ProvisioningJobRecord | undefined) { return job ? structuredClone(job) : null; }
}

function commandFor(): ProvisionTenantCommand {
  return {
    actorUserId: "platform_user_actor" as PlatformUserId,
    requestId: "req_provision_1",
    idempotencyKey: "idem_provision_1" as ProvisioningIdempotencyKey,
    occurredAt: "2026-08-10T00:00:00.000Z",
    organization: organization(),
    tenant: tenant(),
    databaseRef: databaseRef(),
    adminUser: adminUser(),
  };
}

function organization(): Organization {
  return { id: "org_ada" as OrganizationId, slug: "ada-bereket" as TenantSlug, displayName: "Ada Bereket", status: "active" };
}

function databaseRef(): TenantDatabaseRefRecord {
  return { id: "dbref_ada" as TenantDatabaseRefId, engine: "postgresql", managed: true, region: "tr-test", status: "active" };
}

function tenant(): TenantInstance {
  return {
    id: "tenant_ada" as TenantInstanceId,
    organizationId: "org_ada" as OrganizationId,
    slug: "ada-bereket" as TenantSlug,
    displayName: "Ada Bereket",
    provisioningStatus: "active",
    releaseChannel: "stable",
    databaseRef: { id: "dbref_ada" as TenantDatabaseRefId, engine: "postgresql", managed: true, region: "tr-test" },
  };
}

function adminUser(): PlatformUser {
  return { id: "platform_user_admin" as PlatformUserId, email: "admin@example.test", displayName: "Firma Admin", status: "active", roles: [] };
}
