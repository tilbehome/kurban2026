import { describe, expect, it, vi } from "vitest";
import {
  assertOrganizationLifecycleTransition,
  assertPlatformPayloadSafe,
  resolveRolePermissions,
} from "../domain/platform-admin";
import { assertIncidentTransition, assertMaintenanceTransition, assertRecentReauthentication, assertTenantOperationAllowed, operationNeedsSecondApproval, type TenantAccessPolicy } from "../domain/platform-control-plane-completion";
import { authenticatePlatformUserWithRecovery, hashRecoveryCode } from "../application/platform-control-plane-services";
import type { PlatformAdminRepository } from "../contracts/platform-admin-repository";
import type { PlatformControlPlaneRepository } from "../contracts/platform-control-plane-repository";

describe("platform admin domain güvenlik kuralları", () => {
  it("aktif rollerin izinlerini birleştirir, pasif rolü yok sayar", () => {
    const permissions = resolveRolePermissions([
      { key: "platform_support", status: "active", permissions: [] },
      { key: "platform_super_admin", status: "suspended", permissions: ["platform.user.manage"] },
    ]);
    expect(permissions).toContain("platform.support.manage");
    expect(permissions).not.toContain("platform.user.manage");
  });

  it("acil durdurma ve yalnız okuma politikasında yazıları fail-closed reddeder",()=>{
    const base={organizationId:"org_a" as TenantAccessPolicy["organizationId"],tenantInstanceId:"tenant_a" as TenantAccessPolicy["tenantInstanceId"],organizationStatus:"active",blockedScopes:[],sourceIds:[]} satisfies Omit<TenantAccessPolicy,"mode">;
    expect(()=>assertTenantOperationAllowed({...base,mode:"read_only"},"customer.read")).not.toThrow();
    expect(()=>assertTenantOperationAllowed({...base,mode:"read_only"},"sale.write")).toThrow("TENANT_CRITICAL_WRITE_BLOCKED");
    expect(()=>assertTenantOperationAllowed({...base,mode:"full_stop"},"customer.read")).toThrow("TENANT_EMERGENCY_STOP_ACTIVE");
  });

  it("olay, bakım, ikinci onay ve yeniden doğrulama kurallarını uygular",()=>{
    expect(()=>assertIncidentTransition("open","investigating")).not.toThrow();expect(()=>assertIncidentTransition("resolved","open")).toThrow();
    expect(()=>assertMaintenanceTransition("planned","active")).not.toThrow();expect(()=>assertMaintenanceTransition("completed","active")).toThrow();
    expect(operationNeedsSecondApproval("ownership_transfer")).toBe(true);expect(operationNeedsSecondApproval("freeze")).toBe(false);
    expect(()=>assertRecentReauthentication("2026-08-12T09:55:00.000Z","2026-08-12T10:00:00.000Z")).not.toThrow();
    expect(()=>assertRecentReauthentication(undefined,"2026-08-12T10:00:00.000Z")).toThrow("PLATFORM_REAUTHENTICATION_REQUIRED");
  });
  it("recovery kodunu kullanıcı ve pepper ile tek yönlü hashler",()=>{const hash=hashRecoveryCode("user_a","ABCD1234-EFGH5678","p".repeat(32));expect(hash).toMatch(/^[a-f0-9]{64}$/);expect(hash).not.toContain("ABCD1234");expect(hashRecoveryCode("user_b","ABCD1234-EFGH5678","p".repeat(32))).not.toBe(hash)});

  it("recovery girişindeki beşinci hatada hesabı süreli kilitler ve reddi auditler", async () => {
    const markLoginFailure = vi.fn().mockResolvedValue(undefined);
    const recordAudit = vi.fn().mockResolvedValue(undefined);
    const repository = {
      findAuthUserByEmail: vi.fn().mockResolvedValue({
        id: "platform_user_a", email: "admin@example.test", displayName: "Admin", status: "active",
        passwordHash: "opaque", failedLoginCount: 4, mfaRequired: true, authVersion: 0, roles: [],
      }),
      markLoginFailure,
      recordAudit,
    } as unknown as PlatformAdminRepository & PlatformControlPlaneRepository;
    await expect(authenticatePlatformUserWithRecovery(repository, { verify: async () => false }, {
      email: "admin@example.test", password: "wrong", recoveryCode: "AAAAAAAA-BBBBBBBB", pepper: "p".repeat(32),
      requestId: "request_a", occurredAt: "2026-08-12T10:00:00.000Z",
    })).rejects.toThrow("PLATFORM_AUTH_INVALID");
    expect(markLoginFailure).toHaveBeenCalledWith("platform_user_a", 5, "2026-08-12T10:15:00.000Z");
    expect(recordAudit).toHaveBeenCalledWith(expect.objectContaining({ requestId: "request_a", result: "denied" }));
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
