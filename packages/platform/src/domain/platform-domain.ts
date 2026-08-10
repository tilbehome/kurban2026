import type {
  OrganizationId,
  ReleaseChannel,
  TenantDatabaseRef,
  TenantInstanceId,
  TenantProvisioningStatus,
  TenantSlug,
} from "../../../contracts/src";
import { assertPlatformTenantDescriptorSafe } from "../../../contracts/src";

type Brand<TValue, TBrand extends string> = TValue & { readonly __brand: TBrand };

export type PlatformPlanId = Brand<string, "PlatformPlanId">;
export type PlatformModuleId = Brand<string, "PlatformModuleId">;
export type PlatformLicenseId = Brand<string, "PlatformLicenseId">;

export type OrganizationStatus = "draft" | "active" | "suspended" | "closed";
export type PlatformPlanStatus = "draft" | "active" | "retired";
export type PlatformModuleStatus = "active" | "retired";
export type PlatformLicenseStatus = "draft" | "active" | "suspended" | "expired" | "cancelled";

export interface Organization {
  id: OrganizationId;
  slug: TenantSlug;
  displayName: string;
  status: OrganizationStatus;
}

export interface TenantInstance {
  id: TenantInstanceId;
  organizationId: OrganizationId;
  slug: TenantSlug;
  displayName: string;
  provisioningStatus: TenantProvisioningStatus;
  releaseChannel: ReleaseChannel;
  databaseRef: TenantDatabaseRef;
}

export interface ModuleDefinition {
  id: PlatformModuleId;
  key: string;
  displayName: string;
  status: PlatformModuleStatus;
}

export interface EntitlementLimits {
  maxUsers?: number;
  maxDevices?: number;
  maxStorageMb?: number;
}

export interface LicenseEntitlement {
  moduleId: PlatformModuleId;
  enabled: boolean;
  limits: EntitlementLimits;
}

export interface PlatformPlan {
  id: PlatformPlanId;
  code: string;
  displayName: string;
  status: PlatformPlanStatus;
  entitlements: readonly LicenseEntitlement[];
}

export interface PlatformLicense {
  id: PlatformLicenseId;
  organizationId: OrganizationId;
  planId: PlatformPlanId;
  status: PlatformLicenseStatus;
  startsAt: string;
  expiresAt?: string;
  entitlements: readonly LicenseEntitlement[];
}

const ALLOWED_TENANT_TRANSITIONS: Record<TenantProvisioningStatus, readonly TenantProvisioningStatus[]> = {
  draft: ["provisioning", "closed"],
  provisioning: ["active", "failed", "closed"],
  active: ["maintenance", "suspended", "closed"],
  maintenance: ["active", "suspended", "closed"],
  suspended: ["active", "closed"],
  failed: ["provisioning", "closed"],
  closed: [],
};

export function assertOrganizationSlugAvailable(
  existingOrganization: Promise<Organization | null> | Organization | null,
  slug: TenantSlug,
): Promise<void> | void {
  if (existingOrganization instanceof Promise) {
    return existingOrganization.then((existing) => {
      if (existing) throw new Error(`ORGANIZATION_SLUG_ALREADY_EXISTS:${slug}`);
    });
  }
  if (existingOrganization) throw new Error(`ORGANIZATION_SLUG_ALREADY_EXISTS:${slug}`);
}

export function assertTenantLifecycleTransition(
  current: TenantProvisioningStatus,
  next: TenantProvisioningStatus,
): void {
  if (current === next) return;
  if (!ALLOWED_TENANT_TRANSITIONS[current].includes(next)) {
    throw new Error(`TENANT_LIFECYCLE_TRANSITION_NOT_ALLOWED:${current}:${next}`);
  }
}

export function assertPlanEntitlementsKnown(
  entitlements: readonly LicenseEntitlement[],
  modules: readonly ModuleDefinition[],
): void {
  const knownModuleIds = new Set(modules.map((module) => module.id));
  for (const entitlement of entitlements) {
    if (!knownModuleIds.has(entitlement.moduleId)) {
      throw new Error(`UNKNOWN_PLATFORM_MODULE:${entitlement.moduleId}`);
    }
    assertEntitlementLimits(entitlement.limits);
  }
}

export function assertLicenseConsistent(
  license: PlatformLicense,
  plan: PlatformPlan,
  organization: Organization,
  modules: readonly ModuleDefinition[],
): void {
  assertLicenseDateRange(license);
  if (license.status === "active" && organization.status !== "active") {
    throw new Error(`ACTIVE_LICENSE_REQUIRES_ACTIVE_ORGANIZATION:${organization.status}`);
  }
  if (license.planId !== plan.id) {
    throw new Error("LICENSE_PLAN_MISMATCH");
  }
  assertPlanEntitlementsKnown(plan.entitlements, modules);
  assertPlanEntitlementsKnown(license.entitlements, modules);
}

export function assertLicenseDateRange(license: PlatformLicense): void {
  const startsAt = Date.parse(license.startsAt);
  const expiresAt = license.expiresAt ? Date.parse(license.expiresAt) : undefined;
  if (Number.isNaN(startsAt)) throw new Error("LICENSE_START_DATE_INVALID");
  if (expiresAt !== undefined && Number.isNaN(expiresAt)) {
    throw new Error("LICENSE_END_DATE_INVALID");
  }
  if (expiresAt !== undefined && expiresAt <= startsAt) {
    throw new Error("LICENSE_DATE_RANGE_INVALID");
  }
}

export function assertTenantDatabaseRefSafe(databaseRef: TenantDatabaseRef): TenantDatabaseRef {
  return assertPlatformTenantDescriptorSafe({
    organizationId: "org_check" as OrganizationId,
    tenantInstanceId: "tenant_check" as TenantInstanceId,
    slug: "tenant-check" as TenantSlug,
    displayName: "Tenant check",
    deploymentMode: "managed",
    provisioningStatus: "draft",
    runtimeStatus: "unknown",
    releaseChannel: "pilot",
    databaseRef,
    moduleEntitlements: [],
    limits: {},
  }).databaseRef;
}

function assertEntitlementLimits(limits: EntitlementLimits): void {
  for (const [key, value] of Object.entries(limits)) {
    if (value !== undefined && (!Number.isInteger(value) || value < 0)) {
      throw new Error(`ENTITLEMENT_LIMIT_INVALID:${key}`);
    }
  }
}
