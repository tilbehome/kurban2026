import path from "node:path";
import {
  createPlatformPrismaClient,
  PrismaOrganizationRepository,
  PrismaTenantAdminInvitationRepository,
  PrismaProvisioningJobRepository,
  PrismaTenantDatabaseRefRepository,
  PrismaTenantInstanceRepository,
} from "@tilbecore/database-platform";
import { PostgresTenantDatabaseProvisioner } from "@tilbecore/database-tenant";
import {
  provisionTenant,
  rollbackProvisioningJob,
  safeProvisioningErrorCode,
  type ProvisioningJobRecord,
} from "@tilbecore/provisioning";
import { parseProvisioningCommand, readProvisioningCommand } from "./input";

type CommandName = "dry-run" | "create" | "status" | "resume" | "rollback" | "worker";

void main().catch((error) => {
  process.stderr.write(`${JSON.stringify({ ok: false, code: safeProvisioningErrorCode(error) })}\n`);
  process.exitCode = 1;
});

async function main(): Promise<void> {
  const commandName = process.argv[2] as CommandName | undefined;
  if (!commandName || !["dry-run", "create", "status", "resume", "rollback", "worker"].includes(commandName)) {
    throw new Error("PROVISIONING_CLI_COMMAND_INVALID");
  }

  if (commandName === "dry-run") {
    const input = await readProvisioningCommand(requiredArgument("--input"));
    print({
      ok: true,
      command: commandName,
      tenantInstanceId: input.tenant.id,
      databaseRefId: input.databaseRef.id,
      mutationApplied: false,
    });
    return;
  }

  const platformDatabaseUrl = requiredEnvironment("PLATFORM_DATABASE_URL");
  const platform = createPlatformPrismaClient(platformDatabaseUrl);
  const jobRepository = new PrismaProvisioningJobRepository(platform);
  try {
    if (commandName === "worker") {
      if (!process.argv.includes("--once")) throw new Error("PROVISIONING_WORKER_ONCE_REQUIRED");
      print(await runQueuedProvisioningCommand(platform, jobRepository));
      return;
    }
    if (commandName === "status") {
      const job = await jobRepository.findByTenantInstanceId(requiredArgument("--tenant-id") as ProvisioningJobRecord["tenantInstanceId"]);
      if (!job) throw new Error("PROVISIONING_JOB_NOT_FOUND");
      print(safeJobOutput(job));
      return;
    }

    const tenantProvisioner = new PostgresTenantDatabaseProvisioner({
      adminDatabaseUrl: requiredEnvironment("TENANT_DATABASE_ADMIN_URL"),
      repositoryRoot: path.resolve(process.cwd()),
    });

    if (commandName === "rollback") {
      const job = await rollbackProvisioningJob(
        { provisioningJobRepository: jobRepository, tenantDatabaseProvisioner: tenantProvisioner },
        {
          tenantInstanceId: requiredArgument("--tenant-id") as ProvisioningJobRecord["tenantInstanceId"],
          requestId: requiredArgument("--request-id"),
        },
      );
      print(safeJobOutput(job));
      return;
    }

    const input = await readProvisioningCommand(requiredArgument("--input"));
    const result = await provisionTenant({
      organizationRepository: new PrismaOrganizationRepository(platform),
      tenantDatabaseRefRepository: new PrismaTenantDatabaseRefRepository(platform),
      tenantInstanceRepository: new PrismaTenantInstanceRepository(platform),
      tenantAdminInvitationRepository: new PrismaTenantAdminInvitationRepository(platform),
      provisioningJobRepository: jobRepository,
      tenantDatabaseProvisioner: tenantProvisioner,
    }, input);
    print({ ...safeJobOutput(result.job), completedSteps: result.completedSteps });
  } finally {
    await platform.$disconnect();
  }
}

async function runQueuedProvisioningCommand(
  platform: ReturnType<typeof createPlatformPrismaClient>,
  jobRepository: PrismaProvisioningJobRepository,
): Promise<Record<string, unknown>> {
  const queued = await platform.platformAdminCommand.findFirst({
    where: { status: "pending", type: { in: ["tenant.provision", "tenant.provision.resume", "tenant.provision.rollback"] } },
    orderBy: { createdAt: "asc" },
  });
  if (!queued) return { ok: true, processed: false };
  const claimed = await platform.platformAdminCommand.updateMany({
    where: { id: queued.id, status: "pending", version: queued.version },
    data: { status: "running", startedAt: new Date(), attempts: { increment: 1 }, version: { increment: 1 } },
  });
  if (claimed.count !== 1) return { ok: true, processed: false, raced: true };
  const tenantProvisioner = new PostgresTenantDatabaseProvisioner({
    adminDatabaseUrl: requiredEnvironment("TENANT_DATABASE_ADMIN_URL"), repositoryRoot: path.resolve(process.cwd()),
  });
  try {
    if (!queued.tenantInstanceId) throw new Error("PROVISIONING_COMMAND_TENANT_REQUIRED");
    if (queued.type === "tenant.provision.rollback") {
      const job = await rollbackProvisioningJob({ provisioningJobRepository: jobRepository, tenantDatabaseProvisioner: tenantProvisioner }, { tenantInstanceId: queued.tenantInstanceId as ProvisioningJobRecord["tenantInstanceId"], requestId: queued.requestId });
      await completeQueuedCommand(platform, queued.id, job.id);
      return { ok: true, processed: true, commandId: queued.id, jobId: job.id, status: job.status };
    }
    const source = queued.type === "tenant.provision.resume"
      ? await platform.platformAdminCommand.findFirst({ where: { tenantInstanceId: queued.tenantInstanceId, type: "tenant.provision", status: { in: ["failed", "succeeded"] } }, orderBy: { createdAt: "desc" } })
      : queued;
    if (!source) throw new Error("PROVISIONING_SOURCE_COMMAND_NOT_FOUND");
    const payload = requireRecord(source.payload);
    const corePayload = Object.fromEntries(Object.entries(payload).filter(([key]) => key !== "onboarding"));
    const command = parseProvisioningCommand(corePayload);
    const result = await provisionTenant({
      organizationRepository: new PrismaOrganizationRepository(platform),
      tenantDatabaseRefRepository: new PrismaTenantDatabaseRefRepository(platform),
      tenantInstanceRepository: new PrismaTenantInstanceRepository(platform),
      tenantAdminInvitationRepository: new PrismaTenantAdminInvitationRepository(platform),
      provisioningJobRepository: jobRepository,
      tenantDatabaseProvisioner: tenantProvisioner,
    }, command);
    await finalizeOnboarding(platform, command, payload.onboarding, queued.requestedByUserId, queued.requestId);
    await completeQueuedCommand(platform, queued.id, result.job.id);
    return { ok: true, processed: true, commandId: queued.id, jobId: result.job.id, status: result.job.status };
  } catch (error) {
    const code = safeProvisioningErrorCode(error);
    await platform.platformAdminCommand.update({ where: { id: queued.id }, data: { status: "failed", errorCode: code, finishedAt: new Date() } });
    return { ok: false, processed: true, commandId: queued.id, code };
  }
}

async function finalizeOnboarding(
  platform: ReturnType<typeof createPlatformPrismaClient>,
  command: ReturnType<typeof parseProvisioningCommand>,
  onboardingValue: unknown,
  actorUserId: string,
  requestId: string,
): Promise<void> {
  const onboarding = requireRecord(onboardingValue);
  const domain = requiredText(onboarding.domain);
  const planId = requiredText(onboarding.planId);
  const limits = requireRecord(onboarding.limits);
  const moduleKeys = Array.isArray(onboarding.modules) ? onboarding.modules.filter((item): item is string => typeof item === "string") : [];
  const plan = await platform.platformPlan.findUnique({
    where: { id: planId }, include: { modules: { include: { module: true } } },
  });
  if (!plan) throw new Error("PROVISIONING_PLAN_NOT_FOUND");
  const allowedModules = plan.modules.filter((item) => item.enabled && item.module.status === "active");
  const modules = allowedModules.filter((item) => moduleKeys.includes(item.module.key)).map((item) => item.module);
  if (modules.length !== new Set(moduleKeys).size) throw new Error("PROVISIONING_MODULE_NOT_ENTITLED");
  const maxUsers = positiveInteger(limits.maxUsers);
  const maxAnimals = positiveInteger(limits.maxAnimals);
  const maxSeasons = positiveInteger(limits.maxSeasons);
  assertWithinPlanLimit("USERS", maxUsers, plan.maxUsers);
  assertWithinPlanLimit("ANIMALS", maxAnimals, plan.maxAnimals);
  assertWithinPlanLimit("SEASONS", maxSeasons, plan.maxSeasons);
  await platform.$transaction(async (tx) => {
    await tx.organization.update({ where: { id: command.organization.id }, data: { status: "active", version: { increment: 1 } } });
    await tx.tenantInstance.update({ where: { id: command.tenant.id }, data: { provisioningStatus: "active" } });
    await tx.organizationLifecycleEvent.upsert({
      where: { id: `lifecycle_${command.tenant.id}_activated` },
      create: {
        id: `lifecycle_${command.tenant.id}_activated`, organizationId: command.organization.id,
        fromStatus: command.organization.status, toStatus: "active", reason: "Provisioning başarıyla tamamlandı",
        impactSummary: "Tenant veritabanı ve platform metadata kaydı etkinleştirildi", approvedByUserId: actorUserId, requestId,
      },
      update: {},
    });
    await tx.tenantCustomDomain.upsert({
      where: { hostname: domain },
      create: { id: `domain_${command.tenant.id}_default`, tenantInstanceId: command.tenant.id, hostname: domain, status: "pending_verification", dnsVerified: false, tlsReady: false, isPrimary: true },
      update: {},
    });
    await tx.platformLicense.upsert({
      where: { id: `license_${command.organization.id}` },
      create: {
        id: `license_${command.organization.id}`, organizationId: command.organization.id, planId,
        status: "active", startsAt: new Date(), maxUsers,
        maxAnimals, maxSeasons,
        entitlements: { create: modules.map((module) => ({ moduleId: module.id, enabled: true })) },
      }, update: {},
    });
    await tx.platformAdminCommand.upsert({
      where: { idempotencyKey: `initial-backup:${command.tenant.id}` },
      create: {
        id: `initial_backup_${command.tenant.id}`, idempotencyKey: `initial-backup:${command.tenant.id}`,
        type: "tenant.backup.create", status: "pending", organizationId: command.organization.id,
        tenantInstanceId: command.tenant.id, requestedByUserId: actorUserId, requestId,
        traceId: requestId, approvalReason: "Provisioning sonrası ilk doğrulanabilir tenant yedeği",
        payload: { trigger: "provisioning_completion" },
      },
      update: {},
    });
  });
}

async function completeQueuedCommand(platform: ReturnType<typeof createPlatformPrismaClient>, id: string, resultRef: string): Promise<void> {
  await platform.platformAdminCommand.update({ where: { id }, data: { status: "succeeded", resultRef, errorCode: null, finishedAt: new Date() } });
}

function requireRecord(value: unknown): Record<string, unknown> { if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("PROVISIONING_COMMAND_PAYLOAD_INVALID"); return value as Record<string, unknown>; }
function requiredText(value: unknown): string { if (typeof value !== "string" || !value) throw new Error("PROVISIONING_COMMAND_PAYLOAD_INVALID"); return value; }
function positiveInteger(value: unknown): number { if (typeof value !== "number" || !Number.isInteger(value) || value < 1) throw new Error("PROVISIONING_COMMAND_LIMIT_INVALID"); return value; }
function assertWithinPlanLimit(name: string, requested: number, planLimit: number | null): void { if (planLimit !== null && requested > planLimit) throw new Error(`PROVISIONING_${name}_LIMIT_EXCEEDED`); }

function requiredEnvironment(name: "PLATFORM_DATABASE_URL" | "TENANT_DATABASE_ADMIN_URL"): string {
  const value = process.env[name];
  if (!value) throw new Error(`PROVISIONING_CLI_${name}_REQUIRED`);
  return value;
}

function requiredArgument(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value || value.startsWith("--")) throw new Error("PROVISIONING_CLI_ARGUMENT_REQUIRED");
  return value;
}

function safeJobOutput(job: ProvisioningJobRecord) {
  return {
    ok: true,
    jobId: job.id,
    tenantInstanceId: job.tenantInstanceId,
    databaseRefId: job.databaseRefId,
    status: job.status,
    currentStep: job.currentStep,
    failureCode: job.failureCode,
    rollbackStatus: job.rollbackStatus,
    steps: job.steps.map((step) => ({ key: step.key, status: step.status, attempts: step.attempts })),
  };
}

function print(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}
