import { describe, expect, it } from "vitest";
import {
  assertPlatformTenantDescriptorSafe,
  platformCanReadTenantOperationData,
  type PlatformTenantDescriptor,
} from "@tilbecore/contracts";

const descriptor: PlatformTenantDescriptor = {
  organizationId: "org_1" as PlatformTenantDescriptor["organizationId"],
  organizationStatus: "active",
  tenantInstanceId: "tenant_1" as PlatformTenantDescriptor["tenantInstanceId"],
  slug: "ada-bereket" as PlatformTenantDescriptor["slug"],
  displayName: "Ada Bereket",
  deploymentMode: "local_hybrid",
  provisioningStatus: "active",
  runtimeStatus: "healthy",
  releaseChannel: "stable",
  databaseRef: {
    id: "dbref_1" as PlatformTenantDescriptor["databaseRef"]["id"],
    engine: "postgresql",
    managed: false,
  },
  databaseRefStatus: "active",
  moduleEntitlements: [{ moduleId: "kurban", enabled: true }],
  limits: { maxUsers: 20, maxDevices: 50 },
};

describe("platform/tenant sözleşmeleri", () => {
  it("platform descriptor içinde bağlantı sırrı taşımaz", () => {
    expect(assertPlatformTenantDescriptorSafe(descriptor)).toBe(descriptor);

    expect(() =>
      assertPlatformTenantDescriptorSafe({
        ...descriptor,
        databaseRef: {
          ...descriptor.databaseRef,
          connectionString: "masked",
        },
      } as PlatformTenantDescriptor),
    ).toThrow("PLATFORM_TENANT_DESCRIPTOR_UNSAFE");
  });

  it("support session yoksa platform operasyon verisini okuyamaz", () => {
    expect(platformCanReadTenantOperationData("platformMetadata")).toBe(true);
    expect(platformCanReadTenantOperationData("tenantHealth")).toBe(true);
    expect(platformCanReadTenantOperationData("customer")).toBe(false);
    expect(platformCanReadTenantOperationData("finance")).toBe(false);
  });
});
