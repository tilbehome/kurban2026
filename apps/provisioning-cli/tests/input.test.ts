import { describe, expect, it } from "vitest";
import { parseProvisioningCommand } from "../src/input";
import { validateProvisionTenantCommand } from "@tilbecore/provisioning";

describe("provisioning CLI input", () => {
  it("secret içermeyen kontrollü JSON komutunu kabul eder", () => {
    const command = parseProvisioningCommand(validInput());
    expect(() => validateProvisionTenantCommand(command)).not.toThrow();
    expect(command.databaseRef.id).toBe("dbref_cli_test");
  });

  it("ham SQL, eksik input ve connection string alanını reddeder", () => {
    expect(() => parseProvisioningCommand({ tenant: {} })).toThrow("PROVISIONING_INPUT_INVALID");
    expect(() => validateProvisionTenantCommand(parseProvisioningCommand({
      ...validInput(),
      databaseUrl: "postgresql://example.invalid/forbidden",
    }))).toThrow("PROVISIONING_SECRET_LEAK");
    expect(() => parseProvisioningCommand({
      ...validInput(),
      rawSql: "SELECT 1",
    })).toThrow("PROVISIONING_INPUT_UNKNOWN_FIELD");
  });
});

function validInput() {
  return {
    actorUserId: "platform_actor",
    requestId: "request_cli_1",
    idempotencyKey: "idem_cli_1",
    occurredAt: "2026-08-10T10:00:00.000Z",
    organization: { id: "org_cli", slug: "cli-test", displayName: "CLI Test", status: "active" },
    tenant: {
      id: "tenant_cli",
      organizationId: "org_cli",
      slug: "cli-test",
      displayName: "CLI Test",
      provisioningStatus: "active",
      releaseChannel: "stable",
      databaseRef: { id: "dbref_cli_test", engine: "postgresql", managed: true },
    },
    databaseRef: { id: "dbref_cli_test", engine: "postgresql", managed: true, status: "active" },
    adminUser: { id: "platform_admin_cli", email: "admin@example.test", displayName: "Admin", status: "active" },
  };
}
