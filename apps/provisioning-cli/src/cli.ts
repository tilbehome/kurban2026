import path from "node:path";
import {
  createPlatformPrismaClient,
  PrismaOrganizationRepository,
  PrismaPlatformUserRepository,
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
import { readProvisioningCommand } from "./input";

type CommandName = "dry-run" | "create" | "status" | "resume" | "rollback";

void main().catch((error) => {
  process.stderr.write(`${JSON.stringify({ ok: false, code: safeProvisioningErrorCode(error) })}\n`);
  process.exitCode = 1;
});

async function main(): Promise<void> {
  const commandName = process.argv[2] as CommandName | undefined;
  if (!commandName || !["dry-run", "create", "status", "resume", "rollback"].includes(commandName)) {
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
      platformUserRepository: new PrismaPlatformUserRepository(platform),
      provisioningJobRepository: jobRepository,
      tenantDatabaseProvisioner: tenantProvisioner,
    }, input);
    print({ ...safeJobOutput(result.job), completedSteps: result.completedSteps });
  } finally {
    await platform.$disconnect();
  }
}

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
