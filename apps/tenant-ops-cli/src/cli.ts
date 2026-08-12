import path from "node:path";
import type { TenantDatabaseRefId, TenantInstanceId } from "@tilbecore/contracts";
import { createPlatformPrismaClient } from "@tilbecore/database-platform";
import {
  JsonFileTenantBackupAuditPort,
  PostgresTenantBackupService,
  safeTenantBackupError,
  type TenantBackupBinding,
} from "@tilbecore/database-tenant";
import { parseTenantOpsCommand } from "./input";

void main().catch((error) => {
  process.stderr.write(`${JSON.stringify({ ok: false, code: safeCliError(error) })}\n`);
  process.exitCode = 1;
});

async function main(): Promise<void> {
  const platform = createPlatformPrismaClient(requiredEnvironment("PLATFORM_DATABASE_URL"));
  const storageRoot = requiredEnvironment("TENANT_BACKUP_ROOT");
  try {
    if (process.argv[2] === "worker") {
      if (!process.argv.includes("--once")) throw new Error("TENANT_OPS_WORKER_ONCE_REQUIRED");
      print(await runQueuedTenantOperation(platform, storageRoot));
      return;
    }
    const command = parseTenantOpsCommand(process.argv.slice(2));
    const binding = await resolveActiveTenantBinding(platform, command.tenantId);
    const service = new PostgresTenantBackupService({
      adminDatabaseUrl: requiredEnvironment("TENANT_DATABASE_ADMIN_URL"),
      storageRoot,
      repositoryRoot: path.resolve(process.cwd()),
      postgresBinDirectory: optionalEnvironment("POSTGRES_BIN_DIR"),
      audit: new JsonFileTenantBackupAuditPort(storageRoot),
    });

    switch (command.name) {
      case "backup.create":
        print(safeMetadata(await service.createBackup(binding, command.requestId)));
        return;
      case "backup.status":
        print(safeMetadata(await service.getStatus(binding, command.backupId)));
        return;
      case "backup.verify":
        print(safeMetadata(await service.verifyBackup(binding, command.backupId, command.requestId)));
        return;
      case "restore.plan":
        print({ ok: true, ...(await service.createRestorePlan(binding, command.backupId, command.requestId)) });
        return;
      case "restore.verify":
        print({
          ...safeMetadata(await service.verifyRestorePlan(binding, command.backupId, command.requestId)),
          productionRestoreApplied: false,
        });
        return;
    }
  } finally {
    await platform.$disconnect();
  }
}

async function runQueuedTenantOperation(
  platform: ReturnType<typeof createPlatformPrismaClient>,
  storageRoot: string,
): Promise<Record<string, unknown>> {
  const queued = await platform.platformAdminCommand.findFirst({
    where: { status: "pending", type: { in: ["tenant.backup.create", "tenant.backup.verify", "tenant.restore.verify"] } },
    orderBy: { createdAt: "asc" },
  });
  if (!queued) return { ok: true, processed: false };
  const claimed = await platform.platformAdminCommand.updateMany({
    where: { id: queued.id, status: "pending", version: queued.version },
    data: { status: "running", startedAt: new Date(), attempts: { increment: 1 }, version: { increment: 1 } },
  });
  if (claimed.count !== 1) return { ok: true, processed: false, raced: true };
  try {
    if (!queued.tenantInstanceId) throw new Error("TENANT_OPS_TENANT_ID_REQUIRED");
    const binding = await resolveActiveTenantBinding(platform, queued.tenantInstanceId);
    const service = new PostgresTenantBackupService({
      adminDatabaseUrl: requiredEnvironment("TENANT_DATABASE_ADMIN_URL"), storageRoot,
      repositoryRoot: path.resolve(process.cwd()), postgresBinDirectory: optionalEnvironment("POSTGRES_BIN_DIR"),
      audit: new JsonFileTenantBackupAuditPort(storageRoot),
    });
    const payload = queued.payload && typeof queued.payload === "object" && !Array.isArray(queued.payload) ? queued.payload as Record<string, unknown> : {};
    let metadata;
    if (queued.type === "tenant.backup.create") metadata = await service.createBackup(binding, queued.requestId);
    else {
      const backupId = typeof payload.backupId === "string" ? payload.backupId : undefined;
      if (!backupId) throw new Error("TENANT_OPS_BACKUP_ID_REQUIRED");
      metadata = queued.type === "tenant.backup.verify"
        ? await service.verifyBackup(binding, backupId, queued.requestId)
        : await service.verifyRestorePlan(binding, backupId, queued.requestId);
    }
    await platform.platformTenantBackup.upsert({
      where: { id: metadata.id },
      create: {
        id: metadata.id, tenantInstanceId: metadata.tenantInstanceId, databaseRefId: metadata.databaseRefId,
        createdAt: new Date(metadata.createdAt), migrationVersion: metadata.migrationVersion,
        checksumSha256: metadata.checksumSha256, sizeBytes: metadata.sizeBytes === undefined ? null : BigInt(metadata.sizeBytes), status: metadata.status,
        verificationStatus: metadata.verificationStatus, verifiedAt: metadata.verifiedAt ? new Date(metadata.verifiedAt) : null,
        failureCode: metadata.failureCode,
      },
      update: {
        checksumSha256: metadata.checksumSha256, sizeBytes: metadata.sizeBytes === undefined ? null : BigInt(metadata.sizeBytes), status: metadata.status,
        verificationStatus: metadata.verificationStatus, verifiedAt: metadata.verifiedAt ? new Date(metadata.verifiedAt) : null,
        failureCode: metadata.failureCode,
      },
    });
    if (queued.type === "tenant.backup.create" && metadata.status === "completed") {
      await platform.tenantAdminInvitation.updateMany({
        where: { tenantInstanceId: queued.tenantInstanceId, status: "prepared" },
        data: { status: "ready" },
      });
    }
    await platform.platformAdminCommand.update({ where: { id: queued.id }, data: { status: "succeeded", resultRef: metadata.id, finishedAt: new Date(), errorCode: null } });
    return { ok: true, processed: true, commandId: queued.id, resultRef: metadata.id, productionRestoreApplied: false };
  } catch (error) {
    const code = safeCliError(error);
    await platform.platformAdminCommand.update({ where: { id: queued.id }, data: { status: "failed", errorCode: code, finishedAt: new Date() } });
    return { ok: false, processed: true, commandId: queued.id, code };
  }
}

async function resolveActiveTenantBinding(
  platform: ReturnType<typeof createPlatformPrismaClient>,
  tenantId: string,
): Promise<TenantBackupBinding> {
  if (!/^[a-zA-Z0-9_-]{3,100}$/.test(tenantId)) throw new Error("TENANT_OPS_TENANT_ID_INVALID");
  const tenant = await platform.tenantInstance.findUnique({
    where: { id: tenantId },
    include: { organization: true, databaseRef: true },
  });
  if (!tenant) throw new Error("TENANT_OPS_TENANT_NOT_FOUND");
  if (tenant.organization.status !== "active" || tenant.provisioningStatus !== "active") {
    throw new Error("TENANT_OPS_TENANT_NOT_ACTIVE");
  }
  if (tenant.databaseRef.status !== "active" || tenant.databaseRef.engine !== "postgresql") {
    throw new Error("TENANT_OPS_DATABASE_REF_NOT_ACTIVE");
  }
  return {
    tenantInstanceId: tenant.id as TenantInstanceId,
    databaseRefId: tenant.databaseRef.id as TenantDatabaseRefId,
  };
}

function safeMetadata(metadata: Awaited<ReturnType<PostgresTenantBackupService["getStatus"]>>) {
  return {
    ok: true,
    backupId: metadata.id,
    tenantId: metadata.tenantInstanceId,
    createdAt: metadata.createdAt,
    migrationVersion: metadata.migrationVersion,
    checksumSha256: metadata.checksumSha256,
    sizeBytes: metadata.sizeBytes,
    status: metadata.status,
    verificationStatus: metadata.verificationStatus,
    verifiedAt: metadata.verifiedAt,
    failureCode: metadata.failureCode,
  };
}

function requiredEnvironment(name: "PLATFORM_DATABASE_URL" | "TENANT_DATABASE_ADMIN_URL" | "TENANT_BACKUP_ROOT"): string {
  const value = process.env[name];
  if (!value) throw new Error(`TENANT_OPS_${name}_REQUIRED`);
  return value;
}

function optionalEnvironment(name: "POSTGRES_BIN_DIR"): string | undefined {
  return process.env[name] || undefined;
}

function safeCliError(error: unknown): string {
  const backupCode = safeTenantBackupError(error).code;
  if (backupCode !== "TENANT_BACKUP_FAILURE") return backupCode;
  if (error instanceof Error) {
    const candidate = error.message.split(":", 1)[0];
    if (/^[A-Z][A-Z0-9_]{2,100}$/.test(candidate)) return candidate;
  }
  return "TENANT_OPS_FAILURE";
}

function print(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}
