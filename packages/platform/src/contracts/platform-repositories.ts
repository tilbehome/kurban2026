import type {
  LicenseEntitlement,
  Organization,
  PlatformLicense,
  PlatformPlan,
  TenantInstance,
} from "../domain/platform-domain";
import type {
  OrganizationId,
  TenantInstanceId,
  TenantSlug,
} from "../../../contracts/src";

export interface OrganizationRepository {
  create(organization: Organization): Promise<Organization>;
  findById(id: OrganizationId): Promise<Organization | null>;
  findBySlug(slug: TenantSlug): Promise<Organization | null>;
}

export interface TenantInstanceRepository {
  create(tenant: TenantInstance): Promise<TenantInstance>;
  findById(id: TenantInstanceId): Promise<TenantInstance | null>;
  findBySlug(slug: TenantSlug): Promise<TenantInstance | null>;
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
