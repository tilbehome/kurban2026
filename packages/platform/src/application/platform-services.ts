import type {
  OrganizationRepository,
  PlanLicenseRepository,
  TenantDatabaseRefRepository,
  TenantInstanceRepository,
} from "../contracts/platform-repositories";
import {
  assertLicenseConsistent,
  assertOperationalLimits,
  assertOrganizationSlugAvailable,
  assertPlanEntitlementsKnown,
  assertTenantDatabaseRefSafe,
  type ModuleDefinition,
  type Organization,
  type PlatformLicense,
  type PlatformPlan,
  type TenantDatabaseRefRecord,
  type TenantInstance,
} from "../domain/platform-domain";

export async function registerOrganization(
  repository: OrganizationRepository,
  organization: Organization,
): Promise<Organization> {
  await assertOrganizationSlugAvailable(repository.findBySlug(organization.slug), organization.slug);
  return repository.create(organization);
}

export async function registerPlan(
  repository: PlanLicenseRepository,
  plan: PlatformPlan,
  modules: readonly ModuleDefinition[],
): Promise<PlatformPlan> {
  assertOperationalLimits(plan.limits);
  assertPlanEntitlementsKnown(plan.entitlements, modules);
  return repository.createPlan(plan);
}

export async function registerLicense(
  repository: PlanLicenseRepository,
  license: PlatformLicense,
  plan: PlatformPlan,
  organization: Organization,
  modules: readonly ModuleDefinition[],
): Promise<PlatformLicense> {
  assertLicenseConsistent(license, plan, organization, modules);
  return repository.createLicense(license);
}

export async function registerTenantDatabaseRef(
  repository: TenantDatabaseRefRepository,
  databaseRef: TenantDatabaseRefRecord,
): Promise<TenantDatabaseRefRecord> {
  assertTenantDatabaseRefSafe(databaseRef);
  if (databaseRef.status !== "active") {
    throw new Error(`TENANT_DATABASE_REF_NOT_ACTIVE:${databaseRef.status}`);
  }
  return repository.create(databaseRef);
}

export async function registerTenantInstanceWithDatabaseRef(
  repository: TenantInstanceRepository,
  tenant: TenantInstance,
  databaseRef: TenantDatabaseRefRecord,
): Promise<TenantInstance> {
  assertTenantDatabaseRefSafe(databaseRef);
  if (databaseRef.status !== "active" || tenant.databaseRef.id !== databaseRef.id) {
    throw new Error("TENANT_DATABASE_REF_MISMATCH");
  }
  return repository.createWithDatabaseRef(tenant, databaseRef);
}
