import type { OrganizationRepository, PlanLicenseRepository } from "../contracts/platform-repositories";
import {
  assertLicenseConsistent,
  assertOrganizationSlugAvailable,
  assertPlanEntitlementsKnown,
  type ModuleDefinition,
  type Organization,
  type PlatformLicense,
  type PlatformPlan,
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
