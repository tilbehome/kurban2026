import { describe, expect, it } from "vitest";
import type {
  OrganizationId,
  TenantDatabaseRefId,
  TenantInstanceId,
  TenantSlug,
} from "@tilbecore/contracts";
import type {
  PlatformLicense,
  PlatformModuleId,
  PlatformPlanId,
  TenantDatabaseRefRecord,
} from "@tilbecore/platform";
import type { PlatformPrismaClientLike } from "../src/client";
import {
  PrismaPlanLicenseRepository,
  PrismaTenantDatabaseRefRepository,
  PrismaTenantInstanceRepository,
} from "../src/repositories/platform-prisma-repositories";

describe("platform Prisma repository adaptörleri", () => {
  it("TenantDatabaseRef metadata'sını secret taşımadan oluşturur ve gerçek mapper değerlerini döndürür", async () => {
    const calls: unknown[] = [];
    const db = fakeDb({ calls });
    const refs = new PrismaTenantDatabaseRefRepository(db);

    const created = await refs.create(databaseRefFixture({ managed: false, region: "eu-central-1" }));

    expect(created).toEqual(databaseRefFixture({ managed: false, region: "eu-central-1" }));
    expect(JSON.stringify(calls)).not.toMatch(/databaseUrl|connectionString|password|secret|token/i);
  });

  it("TenantInstance mevcut DatabaseRef'e connect olur ve mapper engine/managed/region değerlerini relation'dan okur", async () => {
    const calls: unknown[] = [];
    const db = fakeDb({ calls });
    const tenants = new PrismaTenantInstanceRepository(db);

    const tenant = await tenants.create({
      id: "tenant_1" as TenantInstanceId,
      organizationId: "org_1" as OrganizationId,
      slug: "firma-a" as TenantSlug,
      displayName: "Firma A",
      provisioningStatus: "draft",
      releaseChannel: "pilot",
      databaseRef: { id: "dbref_1" as TenantDatabaseRefId, engine: "postgresql", managed: false, region: "eu" },
    });

    expect(calls.at(-1)).toMatchObject({
      data: {
        organization: { connect: { id: "org_1" } },
        databaseRef: { connect: { id: "dbref_1" } },
      },
      include: { databaseRef: true },
    });
    expect(tenant.databaseRef).toEqual({
      id: "dbref_1",
      engine: "postgresql",
      managed: false,
      region: "eu",
    });
  });

  it("TenantInstance ile DatabaseRef'i tek transaction içinde oluşturabilir", async () => {
    const calls: unknown[] = [];
    const db = fakeDb({ calls });
    const tenants = new PrismaTenantInstanceRepository(db);

    await tenants.createWithDatabaseRef(
      {
        id: "tenant_1" as TenantInstanceId,
        organizationId: "org_1" as OrganizationId,
        slug: "firma-a" as TenantSlug,
        displayName: "Firma A",
        provisioningStatus: "draft",
        releaseChannel: "pilot",
        databaseRef: { id: "dbref_1" as TenantDatabaseRefId, engine: "postgresql", managed: true },
      },
      databaseRefFixture(),
    );

    expect(calls.map((call) => (call as { op: string }).op)).toEqual([
      "transaction",
      "tenantDatabaseRef.create",
      "tenantInstance.create",
    ]);
  });

  it("plan modüllerini nested relation olarak oluşturur ve validUntil değerini korur", async () => {
    const calls: unknown[] = [];
    const db = fakeDb({ calls });
    const repository = new PrismaPlanLicenseRepository(db);
    const moduleId = "module_sales" as PlatformModuleId;

    const plan = await repository.createPlan({
      id: "plan_starter" as PlatformPlanId,
      code: "starter",
      displayName: "Starter",
      status: "active",
      limits: { maxUsers: 5 },
      entitlements: [{ moduleId, enabled: true, validUntil: "2026-12-31T00:00:00.000Z" }],
    });

    expect(calls.at(-1)).toMatchObject({
      data: {
        modules: {
          create: [
            {
              module: { connect: { id: moduleId } },
              enabled: true,
            },
          ],
        },
      },
      include: { modules: true },
    });
    expect(plan.limits.maxUsers).toBe(5);
    expect(plan.entitlements[0]?.validUntil).toBe("2026-12-31T00:00:00.000Z");
  });

  it("lisans entitlement'larını nested relation olarak oluşturur ve limitleri lisans genelinde tutar", async () => {
    const calls: unknown[] = [];
    const db = fakeDb({ calls });
    const repository = new PrismaPlanLicenseRepository(db);
    const moduleId = "module_sales" as PlatformModuleId;

    const license = await repository.createLicense(licenseFixture(moduleId));

    expect(calls.at(-1)).toMatchObject({
      data: {
        organization: { connect: { id: "org_1" } },
        plan: { connect: { id: "plan_starter" } },
        maxUsers: 5,
        entitlements: {
          create: [
            {
              module: { connect: { id: moduleId } },
              enabled: true,
            },
          ],
        },
      },
      include: { entitlements: true },
    });
    expect(license.limits.maxUsers).toBe(5);
    expect(license.entitlements[0]?.validUntil).toBe("2026-12-31T00:00:00.000Z");
  });

  it("entitlement replacement deleteMany + createMany + reload işlemlerini tek transaction içinde yapar", async () => {
    const calls: unknown[] = [];
    const db = fakeDb({ calls });
    const repository = new PrismaPlanLicenseRepository(db);
    const moduleId = "module_sales" as PlatformModuleId;

    const license = await repository.replaceLicenseEntitlements("lic_1" as PlatformLicense["id"], [
      { moduleId, enabled: false, validUntil: "2026-06-01T00:00:00.000Z" },
    ]);

    expect(calls.map((call) => (call as { op: string }).op)).toEqual([
      "transaction",
      "platformLicenseEntitlement.deleteMany",
      "platformLicenseEntitlement.createMany",
      "platformLicense.findUnique",
    ]);
    expect(license.entitlements).toEqual([
      { moduleId, enabled: false, validUntil: "2026-06-01T00:00:00.000Z" },
    ]);
  });
});

function databaseRefFixture(overrides: Partial<TenantDatabaseRefRecord> = {}): TenantDatabaseRefRecord {
  return {
    id: "dbref_1" as TenantDatabaseRefId,
    engine: "postgresql",
    managed: true,
    status: "active",
    ...overrides,
  };
}

function licenseFixture(moduleId: PlatformModuleId): PlatformLicense {
  return {
    id: "lic_1" as PlatformLicense["id"],
    organizationId: "org_1" as OrganizationId,
    planId: "plan_starter" as PlatformPlanId,
    status: "active",
    startsAt: "2026-01-01T00:00:00.000Z",
    expiresAt: "2026-12-31T00:00:00.000Z",
    limits: { maxUsers: 5 },
    entitlements: [{ moduleId, enabled: true, validUntil: "2026-12-31T00:00:00.000Z" }],
  };
}

function fakeDb({ calls }: { calls: unknown[] }): PlatformPrismaClientLike {
  const db = {
    $transaction: async (fn: (tx: unknown) => unknown) => {
      calls.push({ op: "transaction" });
      return fn(db);
    },
    organization: {
      create: async ({ data }: { data: Record<string, unknown> }) => data,
      findUnique: async () => null,
    },
    tenantDatabaseRef: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        calls.push({ op: "tenantDatabaseRef.create", data });
        return { ...data, region: data.region ?? null };
      },
      findUnique: async () => null,
    },
    tenantInstance: {
      create: async (args: { data: Record<string, unknown>; include: unknown }) => {
        calls.push({ op: "tenantInstance.create", ...args });
        const data = args.data;
        return {
          id: data.id,
          organizationId: (data.organization as { connect: { id: string } }).connect.id,
          slug: data.slug,
          displayName: data.displayName,
          provisioningStatus: data.provisioningStatus,
          runtimeStatus: "unknown",
          releaseChannel: data.releaseChannel,
          databaseRefId: (data.databaseRef as { connect: { id: string } }).connect.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          databaseRef: {
            id: (data.databaseRef as { connect: { id: string } }).connect.id,
            engine: "postgresql",
            managed: false,
            region: "eu",
            status: "active",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        };
      },
      findUnique: async () => null,
    },
    platformPlan: {
      create: async (args: { data: Record<string, unknown>; include: unknown }) => {
        calls.push({ op: "platformPlan.create", ...args });
        const modules = (args.data.modules as { create: Record<string, unknown>[] }).create;
        return {
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date(),
          modules: modules.map((module) => ({
            planId: args.data.id,
            moduleId: ((module.module as { connect: { id: string } }).connect.id),
            enabled: module.enabled,
            validUntil: module.validUntil,
          })),
        };
      },
      findUnique: async () => null,
    },
    platformLicense: {
      create: async (args: { data: Record<string, unknown>; include: unknown }) => {
        calls.push({ op: "platformLicense.create", ...args });
        return licenseRowFromData(args.data);
      },
      findUnique: async () => {
        calls.push({ op: "platformLicense.findUnique" });
        return licenseRowFromData({
          id: "lic_1",
          organization: { connect: { id: "org_1" } },
          plan: { connect: { id: "plan_starter" } },
          status: "active",
          startsAt: new Date("2026-01-01T00:00:00.000Z"),
          expiresAt: new Date("2026-12-31T00:00:00.000Z"),
          maxUsers: 5,
          entitlements: {
            create: [
              {
                module: { connect: { id: "module_sales" } },
                enabled: false,
                validUntil: new Date("2026-06-01T00:00:00.000Z"),
              },
            ],
          },
        });
      },
    },
    platformLicenseEntitlement: {
      deleteMany: async (args: unknown) => {
        calls.push({ op: "platformLicenseEntitlement.deleteMany", args });
        return { count: 1 };
      },
      createMany: async (args: unknown) => {
        calls.push({ op: "platformLicenseEntitlement.createMany", args });
        return { count: 1 };
      },
    },
  };
  return db as unknown as PlatformPrismaClientLike;
}

function licenseRowFromData(data: Record<string, unknown>) {
  const entitlements = (data.entitlements as { create: Record<string, unknown>[] }).create;
  return {
    id: data.id,
    organizationId: (data.organization as { connect: { id: string } }).connect.id,
    planId: (data.plan as { connect: { id: string } }).connect.id,
    status: data.status,
    startsAt: data.startsAt,
    expiresAt: data.expiresAt,
    maxUsers: data.maxUsers ?? null,
    maxDevices: data.maxDevices ?? null,
    maxStorageMb: data.maxStorageMb ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
    entitlements: entitlements.map((entitlement) => ({
      licenseId: data.id,
      moduleId: (entitlement.module as { connect: { id: string } }).connect.id,
      enabled: entitlement.enabled,
      validUntil: entitlement.validUntil,
    })),
  };
}
