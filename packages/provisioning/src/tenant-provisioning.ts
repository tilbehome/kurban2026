import type {
  Organization,
  OrganizationRepository,
  PlatformUser,
  TenantDatabaseRefRecord,
  TenantDatabaseRefRepository,
  TenantInstance,
  TenantInstanceRepository,
} from "@tilbecore/platform";
import {
  assertPlatformUserEmail,
  assertTenantDatabaseRefSafe,
} from "@tilbecore/platform";
import {
  createProvisioningJob,
  provisioningCommandFingerprint,
  safeProvisioningErrorCode,
  TenantProvisioningError,
  type ProvisioningIdempotencyKey,
  type ProvisioningJobRecord,
  type ProvisioningJobRepository,
  type ProvisioningStep,
} from "./provisioning-job";

export interface ProvisioningAuditEvent {
  action: ProvisioningStep | "tenant_database.rollback" | "tenant_database.rollback_failed";
  actorUserId: PlatformUser["id"];
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

export interface TenantAdminInvitationRepository {
  ensureInvitation(input: TenantAdminInviteDraft & {
    id: string;
    invitedByUserId: PlatformUser["id"];
  }): Promise<void>;
}

export interface TenantDatabaseOperationInput {
  provisioningJobId: ProvisioningJobRecord["id"];
  tenantInstanceId: TenantInstance["id"];
  databaseRefId: TenantDatabaseRefRecord["id"];
  requestId: string;
}

export interface TenantDatabaseCreateResult {
  createdNow: boolean;
  ownedByProvisioningJob: true;
}

export interface TenantDatabaseRollbackInput extends TenantDatabaseOperationInput {
  platformRegistrationCompleted: boolean;
}

export interface TenantDatabaseProvisioner {
  createDatabase(input: TenantDatabaseOperationInput): Promise<TenantDatabaseCreateResult>;
  databaseExists(input: TenantDatabaseOperationInput): Promise<boolean>;
  applyMigrations(input: TenantDatabaseOperationInput): Promise<void>;
  verifyIsolation(input: TenantDatabaseOperationInput): Promise<void>;
  rollbackDatabase(input: TenantDatabaseRollbackInput): Promise<{ dropped: boolean }>;
}

export interface ProvisionTenantDependencies {
  organizationRepository: OrganizationRepository;
  tenantDatabaseRefRepository: TenantDatabaseRefRepository;
  tenantInstanceRepository: TenantInstanceRepository;
  tenantAdminInvitationRepository: TenantAdminInvitationRepository;
  provisioningJobRepository: ProvisioningJobRepository;
  tenantDatabaseProvisioner: TenantDatabaseProvisioner;
  now?: () => string;
}

export interface ProvisionTenantCommand {
  actorUserId: PlatformUser["id"];
  requestId: string;
  idempotencyKey: ProvisioningIdempotencyKey;
  occurredAt: string;
  organization: Organization;
  tenant: TenantInstance;
  databaseRef: TenantDatabaseRefRecord;
  adminUser: PlatformUser;
}

export interface ProvisionTenantResult {
  job: ProvisioningJobRecord;
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
  validateProvisionTenantCommand(command);
  const now = dependencies.now ?? (() => new Date().toISOString());
  const audit: ProvisioningAuditEvent[] = [];
  let job = await loadOrCreateJob(dependencies.provisioningJobRepository, command, now());

  if (job.status === "rolled_back") {
    job = await dependencies.provisioningJobRepository.update(resetRolledBackJob(job, now()));
  }
  if (job.status === "succeeded") {
    return completedResult(dependencies, command, job, audit);
  }

  const databaseInput = (): TenantDatabaseOperationInput => ({
    provisioningJobId: job.id,
    tenantInstanceId: command.tenant.id,
    databaseRefId: command.databaseRef.id,
    requestId: command.requestId,
  });

  try {
    await runStep("tenant_database.create", async () => {
      const result = await dependencies.tenantDatabaseProvisioner.createDatabase(databaseInput());
      if (!result.ownedByProvisioningJob) throw new TenantProvisioningError("TENANT_DATABASE_OWNERSHIP_REQUIRED");
      job = { ...job, databaseCreatedByJob: true };
    });

    await runStep("tenant_database.migrate", async () => {
      await dependencies.tenantDatabaseProvisioner.applyMigrations(databaseInput());
    });

    await runStep("tenant_database.verify_isolation", async () => {
      await dependencies.tenantDatabaseProvisioner.verifyIsolation(databaseInput());
    });

    let organization = command.organization;
    await runStep("platform.organization.register", async () => {
      organization = await ensureOrganization(dependencies.organizationRepository, command.organization);
    });

    let tenant = command.tenant;
    await runStep("platform.tenant.register", async () => {
      tenant = await ensureTenantRegistered(dependencies, command);
      job = { ...job, platformRegistrationCompleted: true };
    });

    await runStep("platform.admin_invite.prepare", async () => {
      const invite = createAdminInvite(command, tenant);
      await dependencies.tenantAdminInvitationRepository.ensureInvitation({
        ...invite,
        id: `tenant_admin_invite_${tenant.id}`,
        invitedByUserId: command.actorUserId,
      });
    });

    job = await dependencies.provisioningJobRepository.update({
      ...job,
      status: "succeeded",
      currentStep: undefined,
      failureCode: undefined,
      rollbackStatus: "not_required",
      updatedAt: now(),
    });

    return {
      job,
      organization,
      tenant,
      adminInvite: createAdminInvite(command, tenant),
      completedSteps: succeededSteps(job),
      audit,
    };
  } catch (error) {
    const failureCode = safeProvisioningErrorCode(error);
    job = await persistBestEffort(dependencies.provisioningJobRepository, {
      ...job,
      status: "failed",
      failureCode,
      currentStep: undefined,
      updatedAt: now(),
    });

    if (job.databaseCreatedByJob && !job.platformRegistrationCompleted) {
      try {
        await dependencies.tenantDatabaseProvisioner.rollbackDatabase({
          ...databaseInput(),
          platformRegistrationCompleted: false,
        });
        audit.push(auditEvent(command, "tenant_database.rollback"));
        job = await persistBestEffort(dependencies.provisioningJobRepository, {
          ...job,
          status: "rolled_back",
          databaseCreatedByJob: false,
          rollbackStatus: "succeeded",
          updatedAt: now(),
        });
      } catch {
        audit.push(auditEvent(command, "tenant_database.rollback_failed"));
        job = await persistBestEffort(dependencies.provisioningJobRepository, {
          ...job,
          rollbackStatus: "failed",
          updatedAt: now(),
        });
      }
    }
    throw new TenantProvisioningError(failureCode);
  }

  async function runStep(step: ProvisioningStep, action: () => Promise<void>): Promise<void> {
    const current = job.steps.find((item) => item.key === step);
    if (!current) throw new TenantProvisioningError("PROVISIONING_STEP_UNKNOWN");
    if (current.status === "succeeded") return;

    job = await dependencies.provisioningJobRepository.update({
      ...job,
      status: "running",
      currentStep: step,
      failureCode: undefined,
      steps: job.steps.map((item) => item.key === step
        ? { ...item, status: "running", attempts: item.attempts + 1, startedAt: now(), failureCode: undefined }
        : item),
      updatedAt: now(),
    });

    try {
      await action();
      job = await dependencies.provisioningJobRepository.update({
        ...job,
        steps: job.steps.map((item) => item.key === step
          ? { ...item, status: "succeeded", finishedAt: now(), failureCode: undefined }
          : item),
        updatedAt: now(),
      });
      audit.push(auditEvent(command, step));
    } catch (error) {
      const failureCode = safeProvisioningErrorCode(error);
      job = await persistBestEffort(dependencies.provisioningJobRepository, {
        ...job,
        steps: job.steps.map((item) => item.key === step
          ? { ...item, status: "failed", finishedAt: now(), failureCode }
          : item),
        updatedAt: now(),
      });
      throw new TenantProvisioningError(failureCode);
    }
  }
}

export async function rollbackProvisioningJob(
  dependencies: Pick<ProvisionTenantDependencies, "provisioningJobRepository" | "tenantDatabaseProvisioner" | "now">,
  input: { tenantInstanceId: TenantInstance["id"]; requestId: string },
): Promise<ProvisioningJobRecord> {
  const now = dependencies.now ?? (() => new Date().toISOString());
  const job = await dependencies.provisioningJobRepository.findByTenantInstanceId(input.tenantInstanceId);
  if (!job) throw new TenantProvisioningError("PROVISIONING_JOB_NOT_FOUND");
  if (job.platformRegistrationCompleted) {
    throw new TenantProvisioningError("PROVISIONING_ROLLBACK_PLATFORM_REGISTERED");
  }

  await dependencies.tenantDatabaseProvisioner.rollbackDatabase({
    provisioningJobId: job.id,
    tenantInstanceId: job.tenantInstanceId,
    databaseRefId: job.databaseRefId,
    requestId: input.requestId,
    platformRegistrationCompleted: false,
  });

  return dependencies.provisioningJobRepository.update({
    ...job,
    status: "rolled_back",
    databaseCreatedByJob: false,
    rollbackStatus: "succeeded",
    currentStep: undefined,
    updatedAt: now(),
  });
}

export function validateProvisionTenantCommand(command: ProvisionTenantCommand): void {
  if (!command.requestId) throw new TenantProvisioningError("PROVISIONING_REQUEST_ID_REQUIRED");
  if (!command.idempotencyKey) throw new TenantProvisioningError("PROVISIONING_IDEMPOTENCY_REQUIRED");
  if (command.tenant.organizationId !== command.organization.id) {
    throw new TenantProvisioningError("PROVISIONING_ORGANIZATION_TENANT_MISMATCH");
  }
  if (command.tenant.databaseRef.id !== command.databaseRef.id) {
    throw new TenantProvisioningError("PROVISIONING_DATABASE_REF_MISMATCH");
  }
  if (command.databaseRef.engine !== "postgresql") {
    throw new TenantProvisioningError("PROVISIONING_POSTGRESQL_REQUIRED");
  }
  if (command.databaseRef.status !== "active") {
    throw new TenantProvisioningError("PROVISIONING_DATABASE_REF_NOT_ACTIVE");
  }
  assertTenantDatabaseRefSafe(command.databaseRef);
  assertPlatformUserEmail(command.adminUser.email);
  assertNoSecretInProvisioningResult(command);
}

export function assertNoSecretInProvisioningResult(value: unknown): void {
  const serialized = JSON.stringify(value);
  if (/postgres(?:ql)?:\/\/|password|secret|token|connectionString|databaseUrl/i.test(serialized)) {
    throw new TenantProvisioningError("PROVISIONING_SECRET_LEAK");
  }
}

async function loadOrCreateJob(
  repository: ProvisioningJobRepository,
  command: ProvisionTenantCommand,
  now: string,
): Promise<ProvisioningJobRecord> {
  const fingerprint = provisioningCommandFingerprint(command);
  const byKey = await repository.findByIdempotencyKey(command.idempotencyKey);
  if (byKey) return assertJobMatches(byKey, command, fingerprint);

  const byTenant = await repository.findByTenantInstanceId(command.tenant.id);
  if (byTenant) return assertJobMatches(byTenant, command, fingerprint);

  const newJob = createProvisioningJob({
    ...command,
    requestedByUserId: command.actorUserId,
    now,
  });
  try {
    return await repository.create(newJob);
  } catch (error) {
    const raced = await repository.findByIdempotencyKey(command.idempotencyKey)
      ?? await repository.findByTenantInstanceId(command.tenant.id);
    if (raced) return assertJobMatches(raced, command, fingerprint);
    throw new TenantProvisioningError(safeOrFallback(error, "PROVISIONING_JOB_CREATE_FAILED"));
  }
}

function assertJobMatches(
  job: ProvisioningJobRecord,
  command: ProvisionTenantCommand,
  fingerprint: string,
): ProvisioningJobRecord {
  if (job.tenantInstanceId !== command.tenant.id || job.commandFingerprint !== fingerprint) {
    throw new TenantProvisioningError("PROVISIONING_IDEMPOTENCY_CONFLICT");
  }
  return job;
}

function resetRolledBackJob(job: ProvisioningJobRecord, now: string): ProvisioningJobRecord {
  return {
    ...job,
    status: "pending",
    currentStep: undefined,
    failureCode: undefined,
    rollbackStatus: undefined,
    steps: job.steps.map((step) => ({
      key: step.key,
      status: "pending",
      attempts: step.attempts,
    })),
    updatedAt: now,
  };
}

async function ensureOrganization(
  repository: OrganizationRepository,
  expected: Organization,
): Promise<Organization> {
  const byId = await repository.findById(expected.id);
  const bySlug = await repository.findBySlug(expected.slug);
  const existing = byId ?? bySlug;
  if (!existing) {
    try {
      return await repository.create(expected);
    } catch (error) {
      const raced = await repository.findById(expected.id) ?? await repository.findBySlug(expected.slug);
      if (raced && raced.id === expected.id && raced.slug === expected.slug) return raced;
      throw new TenantProvisioningError(safeOrFallback(error, "PROVISIONING_ORGANIZATION_CONFLICT"));
    }
  }
  if (existing.id !== expected.id || existing.slug !== expected.slug) {
    throw new TenantProvisioningError("PROVISIONING_ORGANIZATION_CONFLICT");
  }
  return existing;
}

async function ensureTenantRegistered(
  dependencies: Pick<ProvisionTenantDependencies, "tenantDatabaseRefRepository" | "tenantInstanceRepository">,
  command: ProvisionTenantCommand,
): Promise<TenantInstance> {
  const byId = await dependencies.tenantInstanceRepository.findById(command.tenant.id);
  const bySlug = await dependencies.tenantInstanceRepository.findBySlug(command.tenant.slug);
  const existing = byId ?? bySlug;
  if (existing) {
    if (
      existing.id !== command.tenant.id ||
      existing.organizationId !== command.organization.id ||
      existing.databaseRef.id !== command.databaseRef.id
    ) {
      throw new TenantProvisioningError("PROVISIONING_TENANT_CONFLICT");
    }
    return existing;
  }

  const databaseRef = await dependencies.tenantDatabaseRefRepository.findById(command.databaseRef.id);
  if (databaseRef) {
    if (databaseRef.engine !== "postgresql" || databaseRef.id !== command.databaseRef.id) {
      throw new TenantProvisioningError("PROVISIONING_DATABASE_REF_CONFLICT");
    }
    try {
      return await dependencies.tenantInstanceRepository.create(command.tenant);
    } catch (error) {
      const raced = await dependencies.tenantInstanceRepository.findById(command.tenant.id);
      if (raced && raced.databaseRef.id === command.databaseRef.id) return raced;
      throw new TenantProvisioningError(safeOrFallback(error, "PROVISIONING_TENANT_CONFLICT"));
    }
  }
  try {
    return await dependencies.tenantInstanceRepository.createWithDatabaseRef(command.tenant, command.databaseRef);
  } catch (error) {
    const raced = await dependencies.tenantInstanceRepository.findById(command.tenant.id);
    if (
      raced &&
      raced.organizationId === command.organization.id &&
      raced.databaseRef.id === command.databaseRef.id
    ) return raced;
    throw new TenantProvisioningError(safeOrFallback(error, "PROVISIONING_TENANT_CONFLICT"));
  }
}

async function completedResult(
  dependencies: ProvisionTenantDependencies,
  command: ProvisionTenantCommand,
  job: ProvisioningJobRecord,
  audit: ProvisioningAuditEvent[],
): Promise<ProvisionTenantResult> {
  const organization = await dependencies.organizationRepository.findById(command.organization.id);
  const tenant = await dependencies.tenantInstanceRepository.findById(command.tenant.id);
  if (!organization || !tenant) throw new TenantProvisioningError("PROVISIONING_COMPLETED_STATE_MISSING");
  return {
    job,
    organization,
    tenant,
    adminInvite: createAdminInvite(command, tenant),
    completedSteps: succeededSteps(job),
    audit,
  };
}

function succeededSteps(job: ProvisioningJobRecord): ProvisioningStep[] {
  return job.steps.filter((step) => step.status === "succeeded").map((step) => step.key);
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

async function persistBestEffort(
  repository: ProvisioningJobRepository,
  job: ProvisioningJobRecord,
): Promise<ProvisioningJobRecord> {
  try {
    return await repository.update(job);
  } catch {
    return job;
  }
}

function safeOrFallback(error: unknown, fallback: string): string {
  const code = safeProvisioningErrorCode(error);
  return code === "PROVISIONING_STEP_FAILED" ? fallback : code;
}
