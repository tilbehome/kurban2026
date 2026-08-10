import type {
  OrganizationRepository,
  PlanLicenseRepository,
  TenantInstanceRepository,
} from "../../../platform/src";
import type {
  LicenseEntitlement,
  Organization,
  PlatformLicense,
  PlatformPlan,
  TenantInstance,
} from "../../../platform/src";
import type {
  OrganizationId,
  TenantDatabaseRef,
  TenantInstanceId,
  TenantSlug,
} from "../../../contracts/src";
import type { PlatformPrismaClientLike } from "../client";

export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly db: PlatformPrismaClientLike) {}

  async create(organization: Organization): Promise<Organization> {
    return mapOrganizationRow(await this.db.organization.create({ data: organizationToRow(organization) }));
  }

  async findById(id: OrganizationId): Promise<Organization | null> {
    const row = await this.db.organization.findUnique({ where: { id } });
    return row ? mapOrganizationRow(row) : null;
  }

  async findBySlug(slug: TenantSlug): Promise<Organization | null> {
    const row = await this.db.organization.findUnique({ where: { slug } });
    return row ? mapOrganizationRow(row) : null;
  }
}

export class PrismaTenantInstanceRepository implements TenantInstanceRepository {
  constructor(private readonly db: PlatformPrismaClientLike) {}

  async create(tenant: TenantInstance): Promise<TenantInstance> {
    return mapTenantInstanceRow(await this.db.tenantInstance.create({ data: tenantInstanceToRow(tenant) }));
  }

  async findById(id: TenantInstanceId): Promise<TenantInstance | null> {
    const row = await this.db.tenantInstance.findUnique({ where: { id } });
    return row ? mapTenantInstanceRow(row) : null;
  }

  async findBySlug(slug: TenantSlug): Promise<TenantInstance | null> {
    const row = await this.db.tenantInstance.findUnique({ where: { slug } });
    return row ? mapTenantInstanceRow(row) : null;
  }
}

export class PrismaPlanLicenseRepository implements PlanLicenseRepository {
  constructor(private readonly db: PlatformPrismaClientLike) {}

  async createPlan(plan: PlatformPlan): Promise<PlatformPlan> {
    return mapPlatformPlanRow(await this.db.platformPlan.create({ data: planToRow(plan) }));
  }

  async findPlanById(id: PlatformPlan["id"]): Promise<PlatformPlan | null> {
    const row = await this.db.platformPlan.findUnique({ where: { id } });
    return row ? mapPlatformPlanRow(row) : null;
  }

  async createLicense(license: PlatformLicense): Promise<PlatformLicense> {
    return mapPlatformLicenseRow(await this.db.platformLicense.create({ data: licenseToRow(license) }));
  }

  async findLicenseById(id: PlatformLicense["id"]): Promise<PlatformLicense | null> {
    const row = await this.db.platformLicense.findUnique({ where: { id } });
    return row ? mapPlatformLicenseRow(row) : null;
  }

  async replaceLicenseEntitlements(
    licenseId: PlatformLicense["id"],
    entitlements: readonly LicenseEntitlement[],
  ): Promise<PlatformLicense> {
    return mapPlatformLicenseRow(
      await this.db.platformLicense.update({
        where: { id: licenseId },
        data: { entitlements: entitlementRows(entitlements) },
      }),
    );
  }
}

function organizationToRow(organization: Organization): Record<string, unknown> {
  return {
    id: organization.id,
    slug: organization.slug,
    displayName: organization.displayName,
    status: organization.status,
  };
}

function tenantInstanceToRow(tenant: TenantInstance): Record<string, unknown> {
  return {
    id: tenant.id,
    organizationId: tenant.organizationId,
    slug: tenant.slug,
    displayName: tenant.displayName,
    provisioningStatus: tenant.provisioningStatus,
    releaseChannel: tenant.releaseChannel,
    databaseRefId: tenant.databaseRef.id,
  };
}

function planToRow(plan: PlatformPlan): Record<string, unknown> {
  return {
    id: plan.id,
    code: plan.code,
    displayName: plan.displayName,
    status: plan.status,
    modules: entitlementRows(plan.entitlements),
  };
}

function licenseToRow(license: PlatformLicense): Record<string, unknown> {
  return {
    id: license.id,
    organizationId: license.organizationId,
    planId: license.planId,
    status: license.status,
    startsAt: new Date(license.startsAt),
    expiresAt: license.expiresAt ? new Date(license.expiresAt) : null,
    entitlements: entitlementRows(license.entitlements),
  };
}

function entitlementRows(entitlements: readonly LicenseEntitlement[]): Record<string, unknown>[] {
  return entitlements.map((entitlement) => ({
    moduleId: entitlement.moduleId,
    enabled: entitlement.enabled,
    maxUsers: entitlement.limits.maxUsers,
    maxDevices: entitlement.limits.maxDevices,
    maxStorageMb: entitlement.limits.maxStorageMb,
  }));
}

function mapOrganizationRow(row: unknown): Organization {
  const value = row as Record<string, unknown>;
  return {
    id: value.id as OrganizationId,
    slug: value.slug as TenantSlug,
    displayName: String(value.displayName),
    status: value.status as Organization["status"],
  };
}

function mapTenantInstanceRow(row: unknown): TenantInstance {
  const value = row as Record<string, unknown>;
  return {
    id: value.id as TenantInstanceId,
    organizationId: value.organizationId as OrganizationId,
    slug: value.slug as TenantSlug,
    displayName: String(value.displayName),
    provisioningStatus: value.provisioningStatus as TenantInstance["provisioningStatus"],
    releaseChannel: value.releaseChannel as TenantInstance["releaseChannel"],
    databaseRef: {
      id: value.databaseRefId as TenantDatabaseRef["id"],
      engine: "postgresql",
      managed: true,
    },
  };
}

function mapPlatformPlanRow(row: unknown): PlatformPlan {
  const value = row as Record<string, unknown>;
  return {
    id: value.id as PlatformPlan["id"],
    code: String(value.code),
    displayName: String(value.displayName),
    status: value.status as PlatformPlan["status"],
    entitlements: mapEntitlements(value.modules),
  };
}

function mapPlatformLicenseRow(row: unknown): PlatformLicense {
  const value = row as Record<string, unknown>;
  return {
    id: value.id as PlatformLicense["id"],
    organizationId: value.organizationId as OrganizationId,
    planId: value.planId as PlatformPlan["id"],
    status: value.status as PlatformLicense["status"],
    startsAt: isoDate(value.startsAt),
    expiresAt: value.expiresAt ? isoDate(value.expiresAt) : undefined,
    entitlements: mapEntitlements(value.entitlements),
  };
}

function mapEntitlements(value: unknown): LicenseEntitlement[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      moduleId: row.moduleId as LicenseEntitlement["moduleId"],
      enabled: Boolean(row.enabled),
      limits: {
        maxUsers: optionalNumber(row.maxUsers),
        maxDevices: optionalNumber(row.maxDevices),
        maxStorageMb: optionalNumber(row.maxStorageMb),
      },
    };
  });
}

function isoDate(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}
