import { describe, expect, it } from "vitest";
import {
  assertOrganizationLifecycleTransition,
  assertPlatformPayloadSafe,
  resolveRolePermissions,
} from "../domain/platform-admin";

describe("platform admin domain güvenlik kuralları", () => {
  it("aktif rollerin izinlerini birleştirir, pasif rolü yok sayar", () => {
    const permissions = resolveRolePermissions([
      { key: "platform_support", status: "active", permissions: [] },
      { key: "platform_super_admin", status: "suspended", permissions: ["platform.user.manage"] },
    ]);
    expect(permissions).toContain("platform.support.manage");
    expect(permissions).not.toContain("platform.user.manage");
  });

  it("yaşam döngüsünde doğrudan ve geri dönüşsüz hatalı sıçramaları reddeder", () => {
    expect(() => assertOrganizationLifecycleTransition("draft", "active")).toThrow("ORGANIZATION_LIFECYCLE_TRANSITION_DENIED");
    expect(() => assertOrganizationLifecycleTransition("active", "suspended")).not.toThrow();
    expect(() => assertOrganizationLifecycleTransition("archived", "active")).toThrow();
  });

  it("komut payloadında secret ve connection string adaylarını reddeder", () => {
    expect(() => assertPlatformPayloadSafe({ databaseUrl: "hidden" })).toThrow("PLATFORM_COMMAND_SECRET_FORBIDDEN");
    expect(() => assertPlatformPayloadSafe({ tenantInstanceId: "tenant_a", backupId: "backup_a" })).not.toThrow();
  });
});
