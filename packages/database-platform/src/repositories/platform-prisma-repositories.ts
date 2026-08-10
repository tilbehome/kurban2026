import type {
  LicenseEntitlement,
  Organization,
  OrganizationRepository,
  PlanLicenseRepository,
  PlatformLicense,
  PlatformPlan,
  PlatformRole,
  PlatformUser,
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
import type {
  OrganizationRow,
  PlatformLicenseWithEntitlementsRow,
  PlatformPlanWithModulesRow,
  PlatformPrismaClientLike,
  PlatformRoleRow,
  PlatformTransactionClient,
  PlatformUserWithRolesRow,
  TenantDatabaseRefRow,
  TenantInstanceWithDatabaseRefRow,
} from "../client";

const TENANT_INCLUDE_DATABASE_REF = { databaseRef: true } as const;
const PLAN_INCLUDE_MODULES = { modules: true } as const;
const LICENSE_INCLUDE_ENTITLEMENTS = { entitlements: true } as const;
const USER_INCLUDE_ROLES = { roles: { include: { role: true } } } as const;

export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly db: PlatformPrismaClientLike) {}

  async create(organization: Organization): Promise<Organization> {
    return mapOrganizationRow(
      await this.db.organization.create({
        data: organizationToCreateInput(organization),
      }),
    );
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

export class PrismaTenantDatabaseRefRepository implements TenantDatabaseRefRepository {
  constructor(private readonly db: PlatformPrismaClientLike) {}

  async create(databaseRef: TenantDatabaseRefRecord): Promise<TenantDatabaseRefRecord> {
    return mapTenantDatabaseRefRow(
      await this.db.tenantDatabaseRef.create({
        data: databaseRefToCreateInput(databaseRef),
      }),
    );
  }

  async findById(id: TenantDatabaseRefId): Promise<TenantDatabaseRefRecord | null> {
    const row = await this.db.tenantDatabaseRef.findUnique({ where: { id } });
    return row ? mapTenantDatabaseRefRow(row) : null;
  }
}

export class PrismaTenantInstanceRepository implements TenantInstanceRepository {
  constructor(private readonly db: PlatformPrismaClientLike) {}

  async create(tenant: TenantInstance): Promise<TenantInstance> {
    return mapTenantInstanceRow(
      await this.db.tenantInstance.create({
        data: tenantInstanceToCreateInput(tenant),
        include: TENANT_INCLUDE_DATABASE_REF,
      }),
    );
  }

  async createWithDatabaseRef(
    tenant: TenantInstance,
    databaseRef: TenantDatabaseRefRecord,
  ): Promise<TenantInstance> {
    return this.db.$transaction(async (tx) => {
      await tx.tenantDatabaseRef.create({
        data: databaseRefToCreateInput(databaseRef),
      });
      return mapTenantInstanceRow(
        await tx.tenantInstance.create({
          data: tenantInstanceToCreateInput(tenant),
          include: TENANT_INCLUDE_DATABASE_REF,
        }),
      );
    });
  }

  async findById(id: TenantInstanceId): Promise<TenantInstance | null> {
    const row = await this.db.tenantInstance.findUnique({
      where: { id },
      include: TENANT_INCLUDE_DATABASE_REF,
    });
    return row ? mapTenantInstanceRow(row) : null;
  }

  async findBySlug(slug: TenantSlug): Promise<TenantInstance | null> {
    const row = await this.db.tenantInstance.findUnique({
      where: { slug },
      include: TENANT_INCLUDE_DATABASE_REF,
    });
    return row ? mapTenantInstanceRow(row) : null;
  }
}

export class PrismaPlanLicenseRepository implements PlanLicenseRepository {
  constructor(private readonly db: PlatformPrismaClientLike) {}

  async createPlan(plan: PlatformPlan): Promise<PlatformPlan> {
    return mapPlatformPlanRow(
      await this.db.platformPlan.create({
        data: planToCreateInput(plan),
        include: PLAN_INCLUDE_MODULES,
      }),
    );
  }

  async findPlanById(id: PlatformPlan["id"]): Promise<PlatformPlan | null> {
    const row = await this.db.platformPlan.findUnique({
      where: { id },
      include: PLAN_INCLUDE_MODULES,
    });
    return row ? mapPlatformPlanRow(row) : null;
  }

  async createLicense(license: PlatformLicense): Promise<PlatformLicense> {
    return mapPlatformLicenseRow(
      await this.db.platformLicense.create({
        data: licenseToCreateInput(license),
        include: LICENSE_INCLUDE_ENTITLEMENTS,
      }),
    );
  }

  async findLicenseById(id: PlatformLicense["id"]): Promise<PlatformLicense | null> {
    const row = await this.db.platformLicense.findUnique({
      where: { id },
      include: LICENSE_INCLUDE_ENTITLEMENTS,
    });
    return row ? mapPlatformLicenseRow(row) : null;
  }

  async replaceLicenseEntitlements(
    licenseId: PlatformLicense["id"],
    entitlements: readonly LicenseEntitlement[],
  ): Promise<PlatformLicense> {
    return this.db.$transaction(async (tx) => replaceLicenseEntitlements(tx, licenseId, entitlements));
  }
}

export class PrismaPlatformUserRepository implements PlatformUserRepository {
  constructor(private readonly db: PlatformPrismaClientLike) {}

  async createUser(user: PlatformUser): Promise<PlatformUser> {
    return mapPlatformUserRow(
      await this.db.platformUser.create({
        data: userToCreateInput(user),
        include: USER_INCLUDE_ROLES,
      }),
    );
  }

  async findUserById(id: PlatformUser["id"]): Promise<PlatformUser | null> {
    const row = await this.db.platformUser.findUnique({
      where: { id },
      include: USER_INCLUDE_ROLES,
    });
    return row ? mapPlatformUserRow(row) : null;
  }

  async findUserByEmail(email: string): Promise<PlatformUser | null> {
    const row = await this.db.platformUser.findUnique({
      where: { email },
      include: USER_INCLUDE_ROLES,
    });
    return row ? mapPlatformUserRow(row) : null;
  }

  async createRole(role: PlatformRole): Promise<PlatformRole> {
    return mapPlatformRoleRow(
      await this.db.platformRole.create({
        data: roleToCreateInput(role),
      }),
    );
  }

  async assignRole(userId: PlatformUser["id"], roleId: PlatformRole["id"]): Promise<PlatformUser> {
    await this.db.platformUserRole.create({
      data: {
        user: { connect: { id: userId } },
        role: { connect: { id: roleId } },
      },
    });
    const row = await this.db.platformUser.findUnique({
      where: { id: userId },
      include: USER_INCLUDE_ROLES,
    });
    if (!row) throw new Error("PLATFORM_USER_NOT_FOUND");
    return mapPlatformUserRow(row);
  }
}

async function replaceLicenseEntitlements(
  tx: PlatformTransactionClient,
  licenseId: PlatformLicense["id"],
  entitlements: readonly LicenseEntitlement[],
): Promise<PlatformLicense> {
  await tx.platformLicenseEntitlement.deleteMany({ where: { licenseId } });
  if (entitlements.length > 0) {
    await tx.platformLicenseEntitlement.createMany({
      data: entitlements.map((entitlement) => entitlementToCreateManyInput(licenseId, entitlement)),
    });
  }
  const row = await tx.platformLicense.findUnique({
    where: { id: licenseId },
    include: LICENSE_INCLUDE_ENTITLEMENTS,
  });
  if (!row) throw new Error("PLATFORM_LICENSE_NOT_FOUND");
  return mapPlatformLicenseRow(row);
}

function organizationToCreateInput(organization: Organization) {
  return {
    id: organization.id,
    slug: organization.slug,
    displayName: organization.displayName,
    status: organization.status,
  };
}

function databaseRefToCreateInput(databaseRef: TenantDatabaseRefRecord) {
  return {
    id: databaseRef.id,
    engine: databaseRef.engine,
    managed: databaseRef.managed,
    region: databaseRef.region,
    status: databaseRef.status,
  };
}

function tenantInstanceToCreateInput(tenant: TenantInstance) {
  return {
    id: tenant.id,
    slug: tenant.slug,
    displayName: tenant.displayName,
    provisioningStatus: tenant.provisioningStatus,
    releaseChannel: tenant.releaseChannel,
    organization: { connect: { id: tenant.organizationId } },
    databaseRef: { connect: { id: tenant.databaseRef.id } },
  };
}

function planToCreateInput(plan: PlatformPlan) {
  return {
    id: plan.id,
    code: plan.code,
    displayName: plan.displayName,
    status: plan.status,
    maxUsers: plan.limits.maxUsers,
    maxDevices: plan.limits.maxDevices,
    maxStorageMb: plan.limits.maxStorageMb,
    modules: {
      create: plan.entitlements.map((entitlement) => ({
        module: { connect: { id: entitlement.moduleId } },
        enabled: entitlement.enabled,
        validUntil: optionalDate(entitlement.validUntil),
      })),
    },
  };
}

function licenseToCreateInput(license: PlatformLicense) {
  return {
    id: license.id,
    status: license.status,
    startsAt: new Date(license.startsAt),
    expiresAt: optionalDate(license.expiresAt),
    maxUsers: license.limits.maxUsers,
    maxDevices: license.limits.maxDevices,
    maxStorageMb: license.limits.maxStorageMb,
    organization: { connect: { id: license.organizationId } },
    plan: { connect: { id: license.planId } },
    entitlements: {
      create: license.entitlements.map((entitlement) => ({
        module: { connect: { id: entitlement.moduleId } },
        enabled: entitlement.enabled,
        validUntil: optionalDate(entitlement.validUntil),
      })),
    },
  };
}

function userToCreateInput(user: PlatformUser) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    status: user.status,
    roles: {
      create: user.roles.map((role) => ({
        role: { connect: { id: role.id } },
      })),
    },
  };
}

function roleToCreateInput(role: PlatformRole) {
  return {
    id: role.id,
    key: role.key,
    displayName: role.displayName,
  };
}

function entitlementToCreateManyInput(
  licenseId: PlatformLicense["id"],
  entitlement: LicenseEntitlement,
) {
  return {
    licenseId,
    moduleId: entitlement.moduleId,
    enabled: entitlement.enabled,
    validUntil: optionalDate(entitlement.validUntil),
  };
}

function mapOrganizationRow(row: OrganizationRow): Organization {
  return {
    id: row.id as OrganizationId,
    slug: row.slug as TenantSlug,
    displayName: row.displayName,
    status: row.status as Organization["status"],
  };
}

function mapTenantDatabaseRefRow(row: TenantDatabaseRefRow): TenantDatabaseRefRecord {
  return {
    id: row.id as TenantDatabaseRefRecord["id"],
    engine: row.engine as TenantDatabaseRefRecord["engine"],
    managed: row.managed,
    region: row.region ?? undefined,
    status: row.status as TenantDatabaseRefRecord["status"],
  };
}

function mapTenantInstanceRow(row: TenantInstanceWithDatabaseRefRow): TenantInstance {
  return {
    id: row.id as TenantInstanceId,
    organizationId: row.organizationId as OrganizationId,
    slug: row.slug as TenantSlug,
    displayName: row.displayName,
    provisioningStatus: row.provisioningStatus as TenantInstance["provisioningStatus"],
    releaseChannel: row.releaseChannel as TenantInstance["releaseChannel"],
    databaseRef: {
      id: row.databaseRef.id as TenantDatabaseRefId,
      engine: row.databaseRef.engine as TenantInstance["databaseRef"]["engine"],
      managed: row.databaseRef.managed,
      region: row.databaseRef.region ?? undefined,
    },
  };
}

function mapPlatformPlanRow(row: PlatformPlanWithModulesRow): PlatformPlan {
  return {
    id: row.id as PlatformPlan["id"],
    code: row.code,
    displayName: row.displayName,
    status: row.status as PlatformPlan["status"],
    limits: {
      maxUsers: row.maxUsers ?? undefined,
      maxDevices: row.maxDevices ?? undefined,
      maxStorageMb: row.maxStorageMb ?? undefined,
    },
    entitlements: row.modules.map((module) => ({
      moduleId: module.moduleId as LicenseEntitlement["moduleId"],
      enabled: module.enabled,
      validUntil: module.validUntil ? module.validUntil.toISOString() : undefined,
    })),
  };
}

function mapPlatformLicenseRow(row: PlatformLicenseWithEntitlementsRow): PlatformLicense {
  return {
    id: row.id as PlatformLicense["id"],
    organizationId: row.organizationId as OrganizationId,
    planId: row.planId as PlatformPlan["id"],
    status: row.status as PlatformLicense["status"],
    startsAt: row.startsAt.toISOString(),
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : undefined,
    limits: {
      maxUsers: row.maxUsers ?? undefined,
      maxDevices: row.maxDevices ?? undefined,
      maxStorageMb: row.maxStorageMb ?? undefined,
    },
    entitlements: row.entitlements.map((entitlement) => ({
      moduleId: entitlement.moduleId as LicenseEntitlement["moduleId"],
      enabled: entitlement.enabled,
      validUntil: entitlement.validUntil ? entitlement.validUntil.toISOString() : undefined,
    })),
  };
}

function mapPlatformRoleRow(row: PlatformRoleRow): PlatformRole {
  return {
    id: row.id as PlatformRole["id"],
    key: row.key,
    displayName: row.displayName,
  };
}

function mapPlatformUserRow(row: PlatformUserWithRolesRow): PlatformUser {
  return {
    id: row.id as PlatformUser["id"],
    email: row.email,
    displayName: row.displayName,
    status: row.status as PlatformUser["status"],
    roles: row.roles.map((userRole) => mapPlatformRoleRow(userRole.role)),
  };
}

function optionalDate(value: string | undefined): Date | undefined {
  return value ? new Date(value) : undefined;
}
