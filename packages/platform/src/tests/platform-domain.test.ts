import { describe, expect, it } from "vitest";
import type {
  OrganizationId,
  TenantDatabaseRef,
  TenantSlug,
} from "../../../contracts/src";
import {
  assertLicenseConsistent,
  assertOrganizationSlugAvailable,
  assertPlanEntitlementsKnown,
  assertTenantDatabaseRefSafe,
  assertTenantLifecycleTransition,
  type ModuleDefinition,
  type Organization,
  type PlatformLicense,
  type PlatformModuleId,
  type PlatformPlan,
  type PlatformPlanId,
} from "../domain/platform-domain";

const moduleId = "module_sales" as PlatformModuleId;
const planId = "plan_starter" as PlatformPlanId;
const modules: ModuleDefinition[] = [
  { id: moduleId, key: "sales", displayName: "Satış", status: "active" },
];
const organization: Organization = {
  id: "org_1" as OrganizationId,
  slug: "firma-a" as TenantSlug,
  displayName: "Firma A",
  status: "active",
};
const plan: PlatformPlan = {
  id: planId,
  code: "starter",
  displayName: "Starter",
  status: "active",
  entitlements: [{ moduleId, enabled: true, limits: { maxUsers: 5 } }],
};

describe("platform domain sözleşmesi", () => {
  it("Organization slug benzersizliğini doğrular", () => {
    expect(() => assertOrganizationSlugAvailable(organization, organization.slug)).toThrow(
      "ORGANIZATION_SLUG_ALREADY_EXISTS",
    );
    expect(() => assertOrganizationSlugAvailable(null, organization.slug)).not.toThrow();
  });

  it("Tenant lifecycle durum geçişlerini doğrular", () => {
    expect(() => assertTenantLifecycleTransition("draft", "provisioning")).not.toThrow();
    expect(() => assertTenantLifecycleTransition("closed", "active")).toThrow(
      "TENANT_LIFECYCLE_TRANSITION_NOT_ALLOWED",
    );
  });

  it("geçersiz lisans tarih aralığını reddeder", () => {
    const license = licenseFixture({ startsAt: "2026-01-10T00:00:00.000Z", expiresAt: "2026-01-01T00:00:00.000Z" });

    expect(() => assertLicenseConsistent(license, plan, organization, modules)).toThrow("LICENSE_DATE_RANGE_INVALID");
  });

  it("negatif kullanıcı, cihaz ve depolama limitini reddeder", () => {
    const negativeLimitPlan: PlatformPlan = {
      ...plan,
      entitlements: [{ moduleId, enabled: true, limits: { maxUsers: -1, maxDevices: -1, maxStorageMb: -1 } }],
    };

    expect(() => assertPlanEntitlementsKnown(negativeLimitPlan.entitlements, modules)).toThrow(
      "ENTITLEMENT_LIMIT_INVALID",
    );
  });

  it("plan içinde bilinmeyen modül hakkını reddeder", () => {
    const unknownModulePlan: PlatformPlan = {
      ...plan,
      entitlements: [{ moduleId: "unknown_module" as PlatformModuleId, enabled: true, limits: {} }],
    };

    expect(() => assertPlanEntitlementsKnown(unknownModulePlan.entitlements, modules)).toThrow(
      "UNKNOWN_PLATFORM_MODULE",
    );
  });

  it("kapalı firmaya aktif lisans vermez", () => {
    const closedOrganization: Organization = { ...organization, status: "closed" };

    expect(() => assertLicenseConsistent(licenseFixture(), plan, closedOrganization, modules)).toThrow(
      "ACTIVE_LICENSE_REQUIRES_ACTIVE_ORGANIZATION",
    );
  });

  it("TenantDatabaseRef içinde açık DB URL veya parola alanını reddeder", () => {
    const unsafeRef = {
      id: "dbref_1",
      engine: "postgresql",
      managed: true,
      databaseUrl: "redacted-synthetic-db-url",
    } as unknown as TenantDatabaseRef;

    expect(() => assertTenantDatabaseRefSafe(unsafeRef)).toThrow("PLATFORM_TENANT_DESCRIPTOR_UNSAFE");
  });
});

function licenseFixture(overrides: Partial<PlatformLicense> = {}): PlatformLicense {
  return {
    id: "lic_1" as PlatformLicense["id"],
    organizationId: organization.id,
    planId,
    status: "active",
    startsAt: "2026-01-01T00:00:00.000Z",
    expiresAt: "2026-12-31T00:00:00.000Z",
    entitlements: [{ moduleId, enabled: true, limits: { maxUsers: 5 } }],
    ...overrides,
  };
}
