export type TenantOpsCommand =
  | { name: "backup.create"; tenantId: string; requestId: string }
  | { name: "backup.status"; tenantId: string; backupId: string }
  | { name: "backup.verify"; tenantId: string; backupId: string; requestId: string }
  | { name: "restore.plan"; tenantId: string; backupId: string; requestId: string }
  | { name: "restore.verify"; tenantId: string; backupId: string; requestId: string };

export function parseTenantOpsCommand(args: readonly string[]): TenantOpsCommand {
  if (args[0] !== "tenant") throw new Error("TENANT_OPS_COMMAND_INVALID");
  const area = args[1];
  const action = args[2];
  const flags = parseFlags(args.slice(3));
  const tenantId = requiredFlag(flags, "--tenant-id");

  if (area === "backup" && action === "create") {
    assertOnlyFlags(flags, ["--tenant-id", "--request-id"]);
    return { name: "backup.create", tenantId, requestId: requiredFlag(flags, "--request-id") };
  }
  if (area === "backup" && action === "status") {
    assertOnlyFlags(flags, ["--tenant-id", "--backup-id"]);
    return { name: "backup.status", tenantId, backupId: requiredFlag(flags, "--backup-id") };
  }
  if (area === "backup" && action === "verify") {
    assertOnlyFlags(flags, ["--tenant-id", "--backup-id", "--request-id"]);
    return {
      name: "backup.verify",
      tenantId,
      backupId: requiredFlag(flags, "--backup-id"),
      requestId: requiredFlag(flags, "--request-id"),
    };
  }
  if (area === "restore" && (action === "plan" || action === "verify")) {
    assertOnlyFlags(flags, ["--tenant-id", "--backup-id", "--request-id"]);
    return {
      name: action === "plan" ? "restore.plan" : "restore.verify",
      tenantId,
      backupId: requiredFlag(flags, "--backup-id"),
      requestId: requiredFlag(flags, "--request-id"),
    };
  }
  throw new Error("TENANT_OPS_COMMAND_INVALID");
}

function parseFlags(args: readonly string[]): Map<string, string> {
  if (args.length % 2 !== 0) throw new Error("TENANT_OPS_ARGUMENT_INVALID");
  const flags = new Map<string, string>();
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];
    if (!key?.startsWith("--") || !value || value.startsWith("--") || flags.has(key)) {
      throw new Error("TENANT_OPS_ARGUMENT_INVALID");
    }
    if (/sql|password|secret|token|connection|string|database-url/i.test(key)) {
      throw new Error("TENANT_OPS_SECRET_OR_SQL_ARGUMENT_FORBIDDEN");
    }
    flags.set(key, value);
  }
  return flags;
}

function requiredFlag(flags: Map<string, string>, name: string): string {
  const value = flags.get(name);
  if (!value) throw new Error("TENANT_OPS_ARGUMENT_REQUIRED");
  return value;
}

function assertOnlyFlags(flags: Map<string, string>, allowed: readonly string[]): void {
  if ([...flags.keys()].some((key) => !allowed.includes(key))) {
    throw new Error("TENANT_OPS_ARGUMENT_UNKNOWN");
  }
}
