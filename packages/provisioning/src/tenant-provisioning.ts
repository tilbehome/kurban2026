import type {
  Organization,
  OrganizationRepository,
  PlatformUser,
  PlatformUserRepository,
  TenantDatabaseRefRecord,
  TenantDatabaseRefRepository,
  TenantInstance,
  TenantInstanceRepository,
} from "@tilbecore/platform";
import {
  registerOrganization,
  registerPlatformUser,
  registerTenantInstanceWithDatabaseRef,
} from "@tilbecore/platform";
import type { UserId } from "@tilbecore/contracts";

type Brand<TValue, TBrand extends string> = TValue & { readonly __brand: TBrand };

export type ProvisioningIdempotencyKey = Brand<string, "ProvisioningIdempotencyKey">;

export type ProvisioningStep =
  | "tenant_database.create"
  | "tenant_database.migrate"
  | "tenant_database.verify_isolation"
  | "platform.organization.register"
  | "platform.tenant.register"
  | "platform.admin_invite.prepare";

export type ProvisioningRollbackStep =
  | "tenant_database.rollback"
  | "tenant_database.rollback_failed";

export interface ProvisioningAuditEvent {
  action: ProvisioningStep | ProvisioningRollbackStep;
  actorUserId: UserId;
  requestId: string;
  targetId: string;
  occurredAt: string;
}

export interface TenantAdminInviteDraft {
  email: string;
  displayName: string;
  tenantId: TenantInstance["id"];
  organizationId: Organization["id"];
  roleKey: "firm_admin";
}

export interface TenantDatabaseProvisioner {
  createDatabase(input: TenantDatabaseOperationInput): Promise<void>;
  applyMigrations(input: TenantDatabaseOperationInput): Promise<void>;
  verifyIsolation(input: TenantDatabaseOperationInput): Promise<void>;
  rollbackDatabase(input: TenantDatabaseRollbackInput): Promise<void>;
}

export interface TenantDatabaseOperationInput {
  tenant: TenantInstance;
  databaseRef: TenantDatabaseRefRecord;
  requestId: string;
}

export interface TenantDatabaseRollbackInput extends TenantDatabaseOperationInput {
  reason: string;
}

export interface ProvisionTenantDependencies {
  organizationRepository: OrganizationRepository;
  tenantDatabaseRefRepository: TenantDatabaseRefRepository;
  tenantInstanceRepository: TenantInstanceRepository;
  platformUserRepository: PlatformUserRepository;
  tenantDatabaseProvisioner: TenantDatabaseProvisioner;
}

export interface ProvisionTenantCommand {
  actorUserId: UserId;
  requestId: string;
  idempotencyKey: ProvisioningIdempotencyKey;
  occurredAt: string;
  organization: Organization;
  tenant: TenantInstance;
  databaseRef: TenantDatabaseRefRecord;
  adminUser: PlatformUser;
}

export interface ProvisionTenantResult {
  organization: Organization;
  tenant: TenantInstance;
  adminInvite: TenantAdminInviteDraft;
  completedSteps: readonly ProvisioningStep[];
  audit: readonly ProvisioningAuditEvent[];
}

export async function provisionTenant(
  dependencies: ProvisionTenantDependencies,
  command: ProvisionTenantCommand,
): Promise<ProvisionTenantResult> {
  assertProvisioningCommand(command);

  const completedSteps: ProvisioningStep[] = [];
  const audit: ProvisioningAuditEvent[] = [];
  const databaseInput = {
    tenant: command.tenant,
    databaseRef: command.databaseRef,
    requestId: command.requestId,
  };
  let databaseCreated = false;

  try {
    await dependencies.tenantDatabaseProvisioner.createDatabase(databaseInput);
    databaseCreated = true;
    record("tenant_database.create");

    await dependencies.tenantDatabaseProvisioner.applyMigrations(databaseInput);
    record("tenant_database.migrate");

    await dependencies.tenantDatabaseProvisioner.verifyIsolation(databaseInput);
    record("tenant_database.verify_isolation");

    const organization = await registerOrganization(
      dependencies.organizationRepository,
      command.organization,
    );
    record("platform.organization.register");

    const tenant = await registerTenantInstanceWithDatabaseRef(
      dependencies.tenantInstanceRepository,
      command.tenant,
      command.databaseRef,
    );
    record("platform.tenant.register");

    await registerPlatformUser(dependencies.platformUserRepository, command.adminUser);
    const adminInvite = createAdminInvite(command, tenant);
    record("platform.admin_invite.prepare");

    return { organization, tenant, adminInvite, completedSteps, audit };
  } catch (error) {
    if (databaseCreated) {
      try {
        await dependencies.tenantDatabaseProvisioner.rollbackDatabase({
          ...databaseInput,
          reason: provisioningErrorCode(error),
        });
        audit.push(auditEvent(command, "tenant_database.rollback"));
      } catch {
        audit.push(auditEvent(command, "tenant_database.rollback_failed"));
      }
    }
    throw error;
  }

  function record(step: ProvisioningStep): void {
    completedSteps.push(step);
    audit.push(auditEvent(command, step));
  }
}

function assertProvisioningCommand(command: ProvisionTenantCommand): void {
  if (!command.requestId) throw new Error("PROVISIONING_REQUEST_ID_REQUIRED");
  if (!command.idempotencyKey) throw new Error("PROVISIONING_IDEMPOTENCY_REQUIRED");
  if (command.tenant.organizationId !== command.organization.id) {
    throw new Error("PROVISIONING_ORGANIZATION_TENANT_MISMATCH");
  }
  if (command.tenant.databaseRef.id !== command.databaseRef.id) {
    throw new Error("PROVISIONING_DATABASE_REF_MISMATCH");
  }
  if (command.databaseRef.engine !== "postgresql") {
    throw new Error("PROVISIONING_POSTGRESQL_REQUIRED");
  }
  if (command.databaseRef.status !== "active") {
    throw new Error(`PROVISIONING_DATABASE_REF_NOT_ACTIVE:${command.databaseRef.status}`);
  }
  assertNoSecretInProvisioningResult(command.databaseRef);
}

export function assertNoSecretInProvisioningResult(value: unknown): void {
  const serialized = JSON.stringify(value);
  if (/postgresql:\/\/|password|secret|token|connectionString|databaseUrl/i.test(serialized)) {
    throw new Error("PROVISIONING_SECRET_LEAK");
  }
}

function createAdminInvite(
  command: ProvisionTenantCommand,
  tenant: TenantInstance,
): TenantAdminInviteDraft {
  return {
    email: command.adminUser.email,
    displayName: command.adminUser.displayName,
    tenantId: tenant.id,
    organizationId: tenant.organizationId,
    roleKey: "firm_admin",
  };
}

function auditEvent(
  command: ProvisionTenantCommand,
  action: ProvisioningAuditEvent["action"],
): ProvisioningAuditEvent {
  return {
    action,
    actorUserId: command.actorUserId,
    requestId: command.requestId,
    targetId: command.tenant.id,
    occurredAt: command.occurredAt,
  };
}

function provisioningErrorCode(error: unknown): string {
  return error instanceof Error ? error.message : "UNKNOWN_PROVISIONING_ERROR";
}
