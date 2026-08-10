import type {
  LicenseEntitlement,
  Organization,
  PlatformLicense,
  PlatformPlan,
  PlatformRole,
  PlatformUser,
  TenantDatabaseRefRecord,
  TenantInstance,
} from "../domain/platform-domain";
import type {
  OrganizationId,
  TenantDatabaseRefId,
  TenantInstanceId,
  TenantSlug,
} from "@tilbecore/contracts";

export interface OrganizationRepository {
  create(organization: Organization): Promise<Organization>;
  findById(id: OrganizationId): Promise<Organization | null>;
  findBySlug(slug: TenantSlug): Promise<Organization | null>;
}

export interface TenantInstanceRepository {
  create(tenant: TenantInstance): Promise<TenantInstance>;
  createWithDatabaseRef(
    tenant: TenantInstance,
    databaseRef: TenantDatabaseRefRecord,
  ): Promise<TenantInstance>;
  findById(id: TenantInstanceId): Promise<TenantInstance | null>;
  findBySlug(slug: TenantSlug): Promise<TenantInstance | null>;
}

export interface TenantDatabaseRefRepository {
  create(databaseRef: TenantDatabaseRefRecord): Promise<TenantDatabaseRefRecord>;
  findById(id: TenantDatabaseRefId): Promise<TenantDatabaseRefRecord | null>;
}

export interface PlanLicenseRepository {
  createPlan(plan: PlatformPlan): Promise<PlatformPlan>;
  findPlanById(id: PlatformPlan["id"]): Promise<PlatformPlan | null>;
  createLicense(license: PlatformLicense): Promise<PlatformLicense>;
  findLicenseById(id: PlatformLicense["id"]): Promise<PlatformLicense | null>;
  replaceLicenseEntitlements(
    licenseId: PlatformLicense["id"],
    entitlements: readonly LicenseEntitlement[],
  ): Promise<PlatformLicense>;
}

export interface PlatformUserRepository {
  createUser(user: PlatformUser): Promise<PlatformUser>;
  findUserById(id: PlatformUser["id"]): Promise<PlatformUser | null>;
  findUserByEmail(email: string): Promise<PlatformUser | null>;
  createRole(role: PlatformRole): Promise<PlatformRole>;
  assignRole(userId: PlatformUser["id"], roleId: PlatformRole["id"]): Promise<PlatformUser>;
}
