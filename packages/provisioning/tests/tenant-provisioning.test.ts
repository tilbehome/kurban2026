import { describe, expect, it } from "vitest";
import {
  assertNoSecretInProvisioningResult,
  provisionTenant,
  type ProvisionTenantCommand,
  type TenantDatabaseProvisioner,
} from "../src/tenant-provisioning";
import type {
  Organization,
  OrganizationRepository,
  PlatformUser,
  PlatformUserRepository,
  PlatformUserId,
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
  UserId,
} from "@tilbecore/contracts";
import type { ProvisioningIdempotencyKey } from "../src/tenant-provisioning";

describe("tenant provisioning orchestration", () => {
  it("tenant DB oluşturma, migration, izolasyon doğrulama, platform kayıt ve admin davetini sıralı çalıştırır", async () => {
    const calls: string[] = [];
    const dependencies = dependenciesFor(calls);

    const result = await provisionTenant(dependencies, commandFor());

    expect(result.completedSteps).toEqual([
      "tenant_database.create",
      "tenant_database.migrate",
      "tenant_database.verify_isolation",
      "platform.organization.register",
      "platform.tenant.register",
      "platform.admin_invite.prepare",
    ]);
    expect(calls).toEqual([
      "db.create",
      "db.migrate",
      "db.verify",
      "organization.findBySlug",
      "organization.create",
      "tenant.createWithDatabaseRef",
      "platformUser.createUser",
    ]);
    expect(result.adminInvite).toMatchObject({
      email: "admin@example.test",
      roleKey: "firm_admin",
    });
    expect(JSON.stringify(result)).not.toContain("postgresql://");
  });

  it("migration başarısızsa platform kayıtlarına geçmez ve oluşturulan tenant DB için rollback çağırır", async () => {
    const calls: string[] = [];
    const dependencies = dependenciesFor(calls, {
      provisioner: {
        failAt: "migrate",
      },
    });

    await expect(provisionTenant(dependencies, commandFor())).rejects.toThrow("TENANT_MIGRATION_FAILED");

    expect(calls).toEqual(["db.create", "db.migrate", "db.rollback:TENANT_MIGRATION_FAILED"]);
    expect(calls).not.toContain("organization.create");
    expect(calls).not.toContain("tenant.createWithDatabaseRef");
  });

  it("yanlış databaseRef, aktif olmayan ref ve secret içeren ref fail-closed reddedilir", async () => {
    await expect(
      provisionTenant(dependenciesFor([]), {
        ...commandFor(),
        tenant: { ...tenant(), databaseRef: { ...databaseRef(), id: "other_db" as TenantDatabaseRefId } },
      }),
    ).rejects.toThrow("PROVISIONING_DATABASE_REF_MISMATCH");

    await expect(
      provisionTenant(dependenciesFor([]), {
        ...commandFor(),
        databaseRef: { ...databaseRef(), status: "provisioning" as TenantDatabaseRefRecord["status"] },
      }),
    ).rejects.toThrow("PROVISIONING_DATABASE_REF_NOT_ACTIVE:provisioning");

    expect(() =>
      assertNoSecretInProvisioningResult({
        id: "db_1",
        databaseUrl: "postgresql://user:password@example.test/db",
      }),
    ).toThrow("PROVISIONING_SECRET_LEAK");
  });
});

function commandFor(): ProvisionTenantCommand {
  return {
    actorUserId: "platform_user_actor" as UserId,
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
  return {
    id: "org_ada" as OrganizationId,
    slug: "ada-bereket" as TenantSlug,
    displayName: "Ada Bereket",
    status: "active",
  };
}

function databaseRef(): TenantDatabaseRefRecord {
  return {
    id: "dbref_ada" as TenantDatabaseRefId,
    engine: "postgresql",
    managed: true,
    region: "tr-test",
    status: "active",
  };
}

function tenant(): TenantInstance {
  return {
    id: "tenant_ada" as TenantInstanceId,
    organizationId: "org_ada" as OrganizationId,
    slug: "ada-bereket" as TenantSlug,
    displayName: "Ada Bereket",
    provisioningStatus: "active",
    releaseChannel: "stable",
    databaseRef: {
      id: "dbref_ada" as TenantDatabaseRefId,
      engine: "postgresql",
      managed: true,
      region: "tr-test",
    },
  };
}

function adminUser(): PlatformUser {
  return {
    id: "platform_user_admin" as PlatformUserId,
    email: "admin@example.test",
    displayName: "Firma Admin",
    status: "active",
    roles: [],
  };
}

function dependenciesFor(
  calls: string[],
  options: { provisioner?: { failAt?: "create" | "migrate" | "verify" } } = {},
) {
  const organizationRepository: OrganizationRepository = {
    async create(input) {
      calls.push("organization.create");
      return input;
    },
    async findById() {
      return null;
    },
    async findBySlug() {
      calls.push("organization.findBySlug");
      return null;
    },
  };
  const tenantDatabaseRefRepository: TenantDatabaseRefRepository = {
    async create(input) {
      calls.push("databaseRef.create");
      return input;
    },
    async findById() {
      return null;
    },
  };
  const tenantInstanceRepository: TenantInstanceRepository = {
    async create(input) {
      calls.push("tenant.create");
      return input;
    },
    async createWithDatabaseRef(input) {
      calls.push("tenant.createWithDatabaseRef");
      return input;
    },
    async findById() {
      return null;
    },
    async findBySlug() {
      return null;
    },
  };
  const platformUserRepository: PlatformUserRepository = {
    async createUser(input) {
      calls.push("platformUser.createUser");
      return input;
    },
    async findUserById() {
      return null;
    },
    async findUserByEmail() {
      return null;
    },
    async createRole(input) {
      return input;
    },
    async assignRole() {
      return adminUser();
    },
  };
  const tenantDatabaseProvisioner: TenantDatabaseProvisioner = {
    async createDatabase() {
      calls.push("db.create");
      if (options.provisioner?.failAt === "create") throw new Error("TENANT_DATABASE_CREATE_FAILED");
    },
    async applyMigrations() {
      calls.push("db.migrate");
      if (options.provisioner?.failAt === "migrate") throw new Error("TENANT_MIGRATION_FAILED");
    },
    async verifyIsolation() {
      calls.push("db.verify");
      if (options.provisioner?.failAt === "verify") throw new Error("TENANT_ISOLATION_FAILED");
    },
    async rollbackDatabase(input) {
      calls.push(`db.rollback:${input.reason}`);
    },
  };

  return {
    organizationRepository,
    tenantDatabaseRefRepository,
    tenantInstanceRepository,
    platformUserRepository,
    tenantDatabaseProvisioner,
  };
}
