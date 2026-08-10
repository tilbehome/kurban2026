import { readFile } from "node:fs/promises";
import type { ProvisionTenantCommand, ProvisioningIdempotencyKey } from "@tilbecore/provisioning";
import { validateProvisionTenantCommand } from "@tilbecore/provisioning";
import { tenantDatabaseNameForRef } from "@tilbecore/database-tenant";

export async function readProvisioningCommand(filePath: string): Promise<ProvisionTenantCommand> {
  let value: unknown;
  try {
    value = JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    throw new Error("PROVISIONING_INPUT_INVALID");
  }
  const command = parseProvisioningCommand(value);
  validateProvisionTenantCommand(command);
  tenantDatabaseNameForRef(command.databaseRef.id);
  return command;
}

export function parseProvisioningCommand(value: unknown): ProvisionTenantCommand {
  if (!isRecord(value)) throw new Error("PROVISIONING_INPUT_INVALID");
  if (/postgres(?:ql)?:\/\/|password|secret|token|connectionString|databaseUrl/i.test(JSON.stringify(value))) {
    throw new Error("PROVISIONING_SECRET_LEAK");
  }
  const organization = requireRecord(value.organization);
  const tenant = requireRecord(value.tenant);
  const tenantDatabaseRef = requireRecord(tenant.databaseRef);
  const databaseRef = requireRecord(value.databaseRef);
  const adminUser = requireRecord(value.adminUser);
  assertAllowedKeys(value, ["actorUserId", "requestId", "idempotencyKey", "occurredAt", "organization", "tenant", "databaseRef", "adminUser"]);
  assertAllowedKeys(organization, ["id", "slug", "displayName", "status"]);
  assertAllowedKeys(tenant, ["id", "organizationId", "slug", "displayName", "provisioningStatus", "releaseChannel", "databaseRef"]);
  assertAllowedKeys(tenantDatabaseRef, ["id", "engine", "managed", "region"]);
  assertAllowedKeys(databaseRef, ["id", "engine", "managed", "region", "status"]);
  assertAllowedKeys(adminUser, ["id", "email", "displayName", "status"]);

  return {
    actorUserId: requiredString(value.actorUserId) as ProvisionTenantCommand["actorUserId"],
    requestId: requiredString(value.requestId),
    idempotencyKey: requiredString(value.idempotencyKey) as ProvisioningIdempotencyKey,
    occurredAt: requiredIsoDate(value.occurredAt),
    organization: {
      id: requiredString(organization.id) as ProvisionTenantCommand["organization"]["id"],
      slug: requiredString(organization.slug) as ProvisionTenantCommand["organization"]["slug"],
      displayName: requiredString(organization.displayName),
      status: requiredString(organization.status) as ProvisionTenantCommand["organization"]["status"],
    },
    tenant: {
      id: requiredString(tenant.id) as ProvisionTenantCommand["tenant"]["id"],
      organizationId: requiredString(tenant.organizationId) as ProvisionTenantCommand["tenant"]["organizationId"],
      slug: requiredString(tenant.slug) as ProvisionTenantCommand["tenant"]["slug"],
      displayName: requiredString(tenant.displayName),
      provisioningStatus: requiredString(tenant.provisioningStatus) as ProvisionTenantCommand["tenant"]["provisioningStatus"],
      releaseChannel: requiredString(tenant.releaseChannel) as ProvisionTenantCommand["tenant"]["releaseChannel"],
      databaseRef: {
        id: requiredString(tenantDatabaseRef.id) as ProvisionTenantCommand["tenant"]["databaseRef"]["id"],
        engine: requiredString(tenantDatabaseRef.engine) as "postgresql",
        managed: requiredBoolean(tenantDatabaseRef.managed),
        region: optionalString(tenantDatabaseRef.region),
      },
    },
    databaseRef: {
      id: requiredString(databaseRef.id) as ProvisionTenantCommand["databaseRef"]["id"],
      engine: requiredString(databaseRef.engine) as "postgresql",
      managed: requiredBoolean(databaseRef.managed),
      region: optionalString(databaseRef.region),
      status: requiredString(databaseRef.status) as ProvisionTenantCommand["databaseRef"]["status"],
    },
    adminUser: {
      id: requiredString(adminUser.id) as ProvisionTenantCommand["adminUser"]["id"],
      email: requiredString(adminUser.email),
      displayName: requiredString(adminUser.displayName),
      status: requiredString(adminUser.status) as ProvisionTenantCommand["adminUser"]["status"],
      roles: [],
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new Error("PROVISIONING_INPUT_INVALID");
  return value;
}

function requiredString(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) throw new Error("PROVISIONING_INPUT_INVALID");
  return value;
}

function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  return requiredString(value);
}

function requiredBoolean(value: unknown): boolean {
  if (typeof value !== "boolean") throw new Error("PROVISIONING_INPUT_INVALID");
  return value;
}

function requiredIsoDate(value: unknown): string {
  const date = requiredString(value);
  if (Number.isNaN(Date.parse(date))) throw new Error("PROVISIONING_INPUT_INVALID");
  return date;
}

function assertAllowedKeys(value: Record<string, unknown>, allowed: readonly string[]): void {
  if (Object.keys(value).some((key) => !allowed.includes(key))) {
    throw new Error("PROVISIONING_INPUT_UNKNOWN_FIELD");
  }
}
