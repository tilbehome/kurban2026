import { describe, expect, it } from "vitest";
import type { OrganizationId, TenantDatabaseRefId, TenantInstanceId, TenantSlug } from "../../contracts/src";
import type { PlatformPrismaClientLike } from "../src/client";
import {
  PrismaOrganizationRepository,
  PrismaPlanLicenseRepository,
  PrismaTenantInstanceRepository,
} from "../src/repositories/platform-prisma-repositories";
import type { PlatformLicense, PlatformModuleId, PlatformPlanId } from "../../platform/src";

describe("platform Prisma repository adaptörleri", () => {
  it("Organization ve TenantInstance eşlemelerini domain nesnesi olarak döndürür", async () => {
    const db = fakeDb();
    const organizations = new PrismaOrganizationRepository(db);
    const tenants = new PrismaTenantInstanceRepository(db);

    const organization = await organizations.create({
      id: "org_1" as OrganizationId,
      slug: "firma-a" as TenantSlug,
      displayName: "Firma A",
      status: "active",
    });
    const tenant = await tenants.create({
      id: "tenant_1" as TenantInstanceId,
      organizationId: organization.id,
      slug: organization.slug,
      displayName: "Firma A",
      provisioningStatus: "draft",
      releaseChannel: "pilot",
      databaseRef: { id: "dbref_1" as TenantDatabaseRefId, engine: "postgresql", managed: true },
    });

    expect(await organizations.findBySlug("firma-a" as TenantSlug)).toEqual(organization);
    expect(await tenants.findById(tenant.id)).toEqual(tenant);
  });

  it("plan ve lisans repositoryleri Prisma satırını dışarı sızdırmadan domain nesnesi döndürür", async () => {
    const db = fakeDb();
    const repository = new PrismaPlanLicenseRepository(db);
    const moduleId = "module_sales" as PlatformModuleId;
    const planId = "plan_starter" as PlatformPlanId;

    const plan = await repository.createPlan({
      id: planId,
      code: "starter",
      displayName: "Starter",
      status: "active",
      entitlements: [{ moduleId, enabled: true, limits: { maxUsers: 5 } }],
    });
    const license = await repository.createLicense({
      id: "lic_1" as PlatformLicense["id"],
      organizationId: "org_1" as OrganizationId,
      planId,
      status: "active",
      startsAt: "2026-01-01T00:00:00.000Z",
      expiresAt: "2026-12-31T00:00:00.000Z",
      entitlements: [{ moduleId, enabled: true, limits: { maxUsers: 5 } }],
    });

    expect(plan.entitlements[0]?.limits.maxUsers).toBe(5);
    expect(license.entitlements[0]?.moduleId).toBe(moduleId);
    expect(license).not.toHaveProperty("createdAt");
  });
});

function fakeDb(): PlatformPrismaClientLike {
  const organizationRows = new Map<string, Record<string, unknown>>();
  const tenantRows = new Map<string, Record<string, unknown>>();
  const planRows = new Map<string, Record<string, unknown>>();
  const licenseRows = new Map<string, Record<string, unknown>>();

  return {
    organization: {
      async create({ data }) {
        organizationRows.set(String(data.id), data);
        return data;
      },
      async findUnique({ where }) {
        if (where.id) return organizationRows.get(String(where.id)) ?? null;
        return [...organizationRows.values()].find((row) => row.slug === where.slug) ?? null;
      },
    },
    tenantInstance: {
      async create({ data }) {
        tenantRows.set(String(data.id), data);
        return data;
      },
      async findUnique({ where }) {
        if (where.id) return tenantRows.get(String(where.id)) ?? null;
        return [...tenantRows.values()].find((row) => row.slug === where.slug) ?? null;
      },
    },
    platformPlan: {
      async create({ data }) {
        planRows.set(String(data.id), data);
        return data;
      },
      async findUnique({ where }) {
        return planRows.get(String(where.id)) ?? null;
      },
    },
    platformLicense: {
      async create({ data }) {
        licenseRows.set(String(data.id), data);
        return data;
      },
      async findUnique({ where }) {
        return licenseRows.get(String(where.id)) ?? null;
      },
      async update({ where, data }) {
        const current = licenseRows.get(String(where.id)) ?? {};
        const next = { ...current, ...data };
        licenseRows.set(String(where.id), next);
        return next;
      },
    },
  };
}
