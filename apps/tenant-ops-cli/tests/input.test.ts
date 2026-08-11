import { describe, expect, test } from "vitest";
import { parseTenantOpsCommand } from "../src/input";

describe("tenant operations CLI input", () => {
  test("beş izinli komutu tipli olarak ayrıştırır", () => {
    expect(parseTenantOpsCommand(["tenant", "backup", "create", "--tenant-id", "tenant_123", "--request-id", "request_123"]).name).toBe("backup.create");
    expect(parseTenantOpsCommand(["tenant", "backup", "status", "--tenant-id", "tenant_123", "--backup-id", "backup_12345678"]).name).toBe("backup.status");
    expect(parseTenantOpsCommand(["tenant", "backup", "verify", "--tenant-id", "tenant_123", "--backup-id", "backup_12345678", "--request-id", "request_123"]).name).toBe("backup.verify");
    expect(parseTenantOpsCommand(["tenant", "restore", "plan", "--tenant-id", "tenant_123", "--backup-id", "backup_12345678", "--request-id", "request_123"]).name).toBe("restore.plan");
    expect(parseTenantOpsCommand(["tenant", "restore", "verify", "--tenant-id", "tenant_123", "--backup-id", "backup_12345678", "--request-id", "request_123"]).name).toBe("restore.verify");
  });

  test("SQL, secret ve bilinmeyen argümanları reddeder", () => {
    expect(() => parseTenantOpsCommand(["tenant", "backup", "create", "--tenant-id", "tenant_123", "--request-id", "request_123", "--sql", "DROP"])).toThrow("TENANT_OPS_SECRET_OR_SQL_ARGUMENT_FORBIDDEN");
    expect(() => parseTenantOpsCommand(["tenant", "backup", "create", "--tenant-id", "tenant_123", "--request-id", "request_123", "--force", "true"])).toThrow("TENANT_OPS_ARGUMENT_UNKNOWN");
  });
});
