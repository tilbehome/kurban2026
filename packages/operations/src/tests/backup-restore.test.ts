import { describe, expect, test } from "vitest";
import type { TenantBackupMetadata } from "../backup-restore";
import { assertBackupMatchesTenant, createTenantRestorePlan } from "../backup-restore";

const metadata: TenantBackupMetadata = {
  id: "backup_12345678",
  tenantInstanceId: "tenant_a" as TenantBackupMetadata["tenantInstanceId"],
  databaseRefId: "dbref_a" as TenantBackupMetadata["databaseRefId"],
  createdAt: "2026-08-11T10:00:00.000Z",
  migrationVersion: "0003_tenant_provisioning_marker",
  checksumSha256: "a".repeat(64),
  sizeBytes: 100,
  status: "verified",
  verificationStatus: "verified",
  artifactFileName: "backup_12345678.dump",
  verifiedAt: "2026-08-11T10:05:00.000Z",
};

describe("tenant backup ve restore sözleşmesi", () => {
  test("başka tenant veya DB ref üzerine restore planı kurulmasını reddeder", () => {
    expect(() => assertBackupMatchesTenant(
      metadata,
      "tenant_b" as TenantBackupMetadata["tenantInstanceId"],
      metadata.databaseRefId,
    )).toThrow("BACKUP_TENANT_MISMATCH");
    expect(() => assertBackupMatchesTenant(
      metadata,
      metadata.tenantInstanceId,
      "dbref_b" as TenantBackupMetadata["databaseRefId"],
    )).toThrow("BACKUP_DATABASE_REF_MISMATCH");
  });

  test("restore planını destructive çalıştırmaz ve açık onay kapısı bırakır", () => {
    const plan = createTenantRestorePlan(metadata, "request_restore_123", "2026-08-11T10:10:00.000Z");
    expect(plan.destructiveRestoreEnabled).toBe(false);
    expect(plan.explicitApprovalRequired).toBe(true);
    expect(plan.steps).toContain("temporary_database.restore");
    expect(plan.steps.at(-1)).toBe("production_restore.manual_approval");
  });
});
