import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import { promisify } from "node:util";
import { afterAll, describe, expect, test } from "vitest";
import {
  createPlatformPrismaClient,
  PrismaOrganizationRepository,
  PrismaProvisioningJobRepository,
  PrismaTenantAdminInvitationRepository,
  PrismaTenantDatabaseRefRepository,
  PrismaTenantInstanceRepository,
} from "@tilbecore/database-platform";
import {
  PrismaTenantRequestAuditPort,
  PrismaTenantRuntimeRegistry,
} from "@tilbecore/tenant-web-runtime";
import {
  PostgresTenantDatabaseProvisioner,
  PrismaTenantConnectionFactory,
  TenantDatabaseLocator,
  tenantDatabaseNameForRef,
  quotePostgresIdentifier,
} from "../src";
import { PrismaClient as TenantPrismaClient } from "../generated/client";
import {
  provisionTenant,
  createProvisioningJob,
  type ProvisionTenantCommand,
  type ProvisioningIdempotencyKey,
} from "@tilbecore/provisioning";
import {
  TenantAwareConnectionPool,
  TenantRequestRuntime,
  assertTenantOperationAccess,
  resolveTenantRuntimeContext,
  safeTenantRuntimeFailure,
  type TenantRegistry,
  type TenantPoolEvent,
  type TenantPoolMetric,
  type TenantUserSessionIdentity,
} from "@tilbecore/tenant-runtime";
import { createTilbeCoreDomainConfig } from "@tilbecore/config";
import type {
  OrganizationId,
  PlatformTenantDescriptor,
  SupportSessionId,
  TenantDatabaseRefId,
  TenantInstanceId,
  TenantSlug,
} from "@tilbecore/contracts";
import type { PlatformUserId } from "@tilbecore/platform";

const shouldRun = process.env.RUN_TENANT_ISOLATION_TESTS === "1";
const execFileAsync = promisify(execFile);
const platformUrl = shouldRun ? process.env.PLATFORM_TEST_DATABASE_URL : undefined;
const tenantAdminUrl = shouldRun ? process.env.TENANT_DATABASE_ADMIN_URL : undefined;
if (shouldRun && (!platformUrl || !tenantAdminUrl)) {
  throw new Error("Tenant isolation test environment is incomplete.");
}

const describePostgres = platformUrl && tenantAdminUrl ? describe : describe.skip;
const suffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const createdRefs: TenantDatabaseRefId[] = [];
const temporaryRoots: string[] = [];
let pool: TenantAwareConnectionPool<TenantPrismaClient> | undefined;

describePostgres("iki firma gerçek PostgreSQL izolasyonu", () => {
  test("provisioning, runtime pool, tenant/session/ref ve rollback sınırları fail-closed çalışır", async () => {
    if (!platformUrl || !tenantAdminUrl) throw new Error("TEST_ENV_REQUIRED");
    const platform = createPlatformPrismaClient(platformUrl);
    const actorId = `platform_actor_${suffix}` as PlatformUserId;
    await platform.platformUser.create({
      data: {
        id: actorId,
        email: `${actorId}@example.test`,
        displayName: "Isolation Actor",
        status: "active",
      },
    });

    const dependencies = {
      organizationRepository: new PrismaOrganizationRepository(platform),
      tenantDatabaseRefRepository: new PrismaTenantDatabaseRefRepository(platform),
      tenantInstanceRepository: new PrismaTenantInstanceRepository(platform),
      tenantAdminInvitationRepository: new PrismaTenantAdminInvitationRepository(platform),
      provisioningJobRepository: new PrismaProvisioningJobRepository(platform),
      tenantDatabaseProvisioner: new PostgresTenantDatabaseProvisioner({
        adminDatabaseUrl: tenantAdminUrl,
        repositoryRoot: process.cwd(),
        timeoutMs: 90_000,
      }),
    };

    const commandA = commandFor("a", actorId);
    const commandB = commandFor("b", actorId);
    createdRefs.push(commandA.databaseRef.id, commandB.databaseRef.id);
    const resultA = await provisionTenant(dependencies, commandA);
    const resultB = await provisionTenant(dependencies, commandB);
    expect(resultA.job.status).toBe("succeeded");
    expect(resultB.job.status).toBe("succeeded");

    const descriptors = [descriptorFor(commandA), descriptorFor(commandB)];
    const registry: TenantRegistry = {
      async findBySlug(slug) { return descriptors.find((item) => item.slug === slug) ?? null; },
      async findCustomDomains() { return []; },
    };
    const config = createTilbeCoreDomainConfig("local");
    const contextA = await resolveTenantRuntimeContext(config, registry, {
      hostHeader: `${commandA.tenant.slug}.${config.baseDomain}`,
      requestId: `runtime_a_${suffix}`,
      traceId: `trace_runtime_a_${suffix}`,
      session: {
        kind: "tenant",
        organizationId: commandA.organization.id,
        tenantInstanceId: commandA.tenant.id,
        databaseRefId: commandA.databaseRef.id,
        sessionId: `session_a_${suffix}`,
        userId: `user_a_${suffix}`,
        roleIds: ["firm_admin"],
        permissions: ["customer.read"],
      },
    });
    const contextB = await resolveTenantRuntimeContext(config, registry, {
      hostHeader: `${commandB.tenant.slug}.${config.baseDomain}`,
      requestId: `runtime_b_${suffix}`,
      traceId: `trace_runtime_b_${suffix}`,
      session: {
        kind: "tenant",
        organizationId: commandB.organization.id,
        tenantInstanceId: commandB.tenant.id,
        databaseRefId: commandB.databaseRef.id,
        sessionId: `session_b_${suffix}`,
        userId: `user_b_${suffix}`,
        roleIds: ["firm_admin"],
        permissions: ["customer.read"],
      },
    });

    pool = new TenantAwareConnectionPool(
      new PrismaTenantConnectionFactory(new TenantDatabaseLocator(tenantAdminUrl), 30_000),
      60_000,
    );
    const leaseA = await pool.acquire({ context: contextA, resolvedDatabaseRef: commandA.databaseRef });
    const leaseB = await pool.acquire({ context: contextB, resolvedDatabaseRef: commandB.databaseRef });
    expect(leaseA.client).not.toBe(leaseB.client);

    const sharedSeasonId = `season_same_${suffix}`;
    const sharedCustomerId = `customer_same_${suffix}`;
    await leaseA.client.season.create({ data: { id: sharedSeasonId, name: "Firma A Sezonu", status: "preparation" } });
    await leaseB.client.season.create({ data: { id: sharedSeasonId, name: "Firma B Sezonu", status: "preparation" } });
    await leaseA.client.customer.create({
      data: { id: sharedCustomerId, seasonId: sharedSeasonId, displayName: "Yalnız Firma A" },
    });
    await leaseB.client.customer.create({
      data: { id: sharedCustomerId, seasonId: sharedSeasonId, displayName: "Yalnız Firma B" },
    });

    await expect(leaseA.client.customer.findUnique({ where: { id: sharedCustomerId } }))
      .resolves.toMatchObject({ displayName: "Yalnız Firma A" });
    await expect(leaseB.client.customer.findUnique({ where: { id: sharedCustomerId } }))
      .resolves.toMatchObject({ displayName: "Yalnız Firma B" });

    await expect(resolveTenantRuntimeContext(config, registry, {
      hostHeader: `${commandA.tenant.slug}.${config.baseDomain}`,
      requestId: `wrong_session_${suffix}`,
      traceId: `trace_wrong_session_${suffix}`,
      session: {
        kind: "tenant",
        organizationId: commandB.organization.id,
        tenantInstanceId: commandB.tenant.id,
        databaseRefId: commandB.databaseRef.id,
        sessionId: `session_wrong_${suffix}`,
        userId: `user_wrong_${suffix}`,
        roleIds: [],
        permissions: [],
      },
    })).rejects.toThrow(/TENANT_SESSION_(ORGANIZATION_)?MISMATCH/);
    await expect(resolveTenantRuntimeContext(config, registry, {
      hostHeader: `console.${config.baseDomain}`,
      requestId: `reserved_host_${suffix}`,
    })).rejects.toThrow("TENANT_HOST_REQUIRED");
    await expect(resolveTenantRuntimeContext(config, registry, {
      hostHeader: "unknown.example.test",
      requestId: `unknown_host_${suffix}`,
    })).rejects.toThrow("UNKNOWN_HOST");
    await expect(pool.acquire({ context: contextB, resolvedDatabaseRef: commandA.databaseRef }))
      .rejects.toThrow("TENANT_DATABASE_REF_FAIL_CLOSED");

    expect(() => assertTenantOperationAccess({
      actorKind: "platform",
      tenantInstanceId: commandA.tenant.id,
      requestedScope: "customer.read",
      nowIso: "2026-08-10T10:00:00.000Z",
    })).toThrow("SUPPORT_SESSION_REQUIRED");

    const safeFailure = await pool.acquire({ context: contextB, resolvedDatabaseRef: commandA.databaseRef })
      .catch(safeTenantRuntimeFailure);
    const serializedFailure = JSON.stringify(safeFailure);
    expect(serializedFailure).not.toContain(tenantAdminUrl);
    expect(serializedFailure).not.toContain(tenantDatabaseNameForRef(commandA.databaseRef.id));
    expect(serializedFailure).not.toMatch(/password|postgresql:\/\//i);

    leaseA.release();
    leaseB.release();
    await pool.shutdown();

    await platform.tenantCustomDomain.create({
      data: {
        id: `domain_${suffix}`,
        tenantInstanceId: commandA.tenant.id,
        hostname: `firma-a-${suffix.replace(/_/g, "-")}.example.test`,
        status: "ACTIVE",
        dnsVerified: true,
        tlsReady: true,
      },
    });
    const registryFromPlatform = new PrismaTenantRuntimeRegistry(platform);
    const requestAudit = new PrismaTenantRequestAuditPort(platform);
    const poolEvents: TenantPoolEvent[] = [];
    const poolMetrics: TenantPoolMetric[] = [];
    pool = new TenantAwareConnectionPool(
      new PrismaTenantConnectionFactory(new TenantDatabaseLocator(tenantAdminUrl), 30_000),
      1_000,
      Date.now,
      {
        emit(event) { poolEvents.push(event); },
        recordMetric(metric) { poolMetrics.push(metric); },
      },
    );
    const requestRuntime = new TenantRequestRuntime(
      config,
      registryFromPlatform,
      pool,
      registryFromPlatform,
      requestAudit,
      () => "2026-08-11T10:00:00.000Z",
    );
    const requestFor = (command: ProvisionTenantCommand, label: string) => ({
      hostHeader: `${command.tenant.slug}.${config.baseDomain}`,
      requestId: `web_request_${label}_${suffix}`,
      traceId: `web_trace_${label}_${suffix}`,
      requestedScope: "customer.read",
      session: tenantSessionFor(command, label),
    });
    const [webA, webB] = await Promise.all([
      requestRuntime.execute(requestFor(commandA, "a"), async ({ context, client }) => ({
        context,
        customer: await client.customer.findUnique({ where: { id: sharedCustomerId } }),
      })),
      requestRuntime.execute(requestFor(commandB, "b"), async ({ context, client }) => ({
        context,
        customer: await client.customer.findUnique({ where: { id: sharedCustomerId } }),
      })),
    ]);
    expect(webA.customer?.displayName).toBe("Yalnız Firma A");
    expect(webB.customer?.displayName).toBe("Yalnız Firma B");
    expect(webA.context.tenantId).toBe(commandA.tenant.id);
    expect(webB.context.tenantId).toBe(commandB.tenant.id);
    expect(JSON.stringify([webA.context, webB.context])).not.toMatch(/postgresql:\/\/|password|connectionString/i);
    expect(poolEvents.filter((event) => event.name === "tenant.pool.create")).toHaveLength(2);
    expect(poolMetrics.filter((metric) => metric.name === "tenant.pool.created")).toHaveLength(2);
    const customDomainResult = await requestRuntime.execute({
      ...requestFor(commandA, "custom_domain"),
      hostHeader: `firma-a-${suffix.replace(/_/g, "-")}.example.test`,
    }, async ({ client }) => client.customer.findUnique({ where: { id: sharedCustomerId } }));
    expect(customDomainResult?.displayName).toBe("Yalnız Firma A");
    await platform.tenantInstance.update({
      where: { id: commandB.tenant.id },
      data: { provisioningStatus: "suspended" },
    });
    await expect(requestRuntime.execute(requestFor(commandB, "suspended"), async () => null))
      .rejects.toThrow("TENANT_NOT_ACTIVE");
    await platform.tenantInstance.update({
      where: { id: commandB.tenant.id },
      data: { provisioningStatus: "active" },
    });

    await expect(requestRuntime.execute({
      ...requestFor(commandA, "cross"),
      session: tenantSessionFor(commandB, "cross"),
    }, async () => null)).rejects.toThrow(/TENANT_SESSION_(ORGANIZATION_)?MISMATCH/);
    await expect(requestRuntime.execute({
      ...requestFor(commandA, "wrong_ref"),
      session: { ...tenantSessionFor(commandA, "wrong_ref"), databaseRefId: commandB.databaseRef.id },
    }, async () => null)).rejects.toThrow("TENANT_SESSION_DATABASE_REF_MISMATCH");
    await expect(requestRuntime.execute({
      ...requestFor(commandA, "reserved"),
      hostHeader: `console.${config.baseDomain}`,
    }, async () => null)).rejects.toThrow("TENANT_HOST_REQUIRED");
    await expect(requestRuntime.execute({
      ...requestFor(commandA, "unknown"),
      hostHeader: "unknown.example.test",
    }, async () => null)).rejects.toThrow("UNKNOWN_HOST");
    const platformSession = {
      kind: "platform" as const,
      sessionId: `platform_session_${suffix}`,
      userId: actorId,
      roleIds: ["platform_admin"],
      permissions: ["tenant.support"],
    };
    await expect(requestRuntime.execute({
      ...requestFor(commandA, "platform_denied"),
      session: platformSession,
    }, async () => null)).rejects.toThrow("SUPPORT_SESSION_REQUIRED");

    const supportSessionId = `support_${suffix}` as SupportSessionId;
    await platform.platformSupportSession.create({
      data: {
        id: supportSessionId,
        organizationId: commandA.organization.id,
        tenantInstanceId: commandA.tenant.id,
        platformUserId: actorId,
        approvedByUserId: `tenant_approver_${suffix}`,
        reason: "Firma onaylı entegrasyon testi",
        status: "active",
        scopes: ["customer.read"],
        startsAt: new Date("2026-08-11T09:00:00.000Z"),
        expiresAt: new Date("2026-08-11T11:00:00.000Z"),
      },
    });
    const supportResult = await requestRuntime.execute({
      ...requestFor(commandA, "support"),
      session: { ...platformSession, supportSessionId },
    }, async ({ context, client }) => ({
      context,
      customer: await client.customer.findUnique({ where: { id: sharedCustomerId } }),
    }));
    expect(supportResult.customer?.displayName).toBe("Yalnız Firma A");
    expect(supportResult.context.supportSession?.id).toBe(supportSessionId);
    expect(await platform.platformAuditLog.count({
      where: { supportSessionId, action: "tenant.support.access", result: "success" },
    })).toBe(1);
    await requestRuntime.shutdown();

    await dependencies.tenantDatabaseProvisioner.applyMigrations({
      provisioningJobId: resultA.job.id,
      tenantInstanceId: commandA.tenant.id,
      databaseRefId: commandA.databaseRef.id,
      requestId: `repeat_migration_${suffix}`,
    });
    const checkB = new TenantPrismaClient({
      datasources: { db: { url: new TenantDatabaseLocator(tenantAdminUrl).tenantConnectionUrl(commandB.databaseRef.id) } },
    });
    await expect(checkB.customer.findUnique({ where: { id: sharedCustomerId } }))
      .resolves.toMatchObject({ displayName: "Yalnız Firma B" });
    await checkB.$disconnect();

    const cliCommand = commandFor("cli", actorId);
    createdRefs.push(cliCommand.databaseRef.id);
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "tilbecore-provisioning-cli-"));
    const inputPath = path.join(tempRoot, "tenant.json");
    await writeFile(inputPath, JSON.stringify(cliInput(cliCommand)), "utf8");
    const dryRun = await runCli(["dry-run", "--input", inputPath], platformUrl, tenantAdminUrl);
    expect(JSON.parse(dryRun.stdout)).toMatchObject({ command: "dry-run", mutationApplied: false });
    const cliCreate = await runCli(["create", "--input", inputPath], platformUrl, tenantAdminUrl);
    expect(JSON.parse(cliCreate.stdout)).toMatchObject({ status: "succeeded" });
    const cliStatus = await runCli(["status", "--tenant-id", cliCommand.tenant.id], platformUrl, tenantAdminUrl);
    expect(JSON.parse(cliStatus.stdout)).toMatchObject({ status: "succeeded" });
    const cliResume = await runCli(["resume", "--input", inputPath], platformUrl, tenantAdminUrl);
    expect(JSON.parse(cliResume.stdout)).toMatchObject({ status: "succeeded" });
    await expect(runCli([
      "rollback",
      "--tenant-id",
      cliCommand.tenant.id,
      "--request-id",
      `request_cli_rollback_denied_${suffix}`,
    ], platformUrl, tenantAdminUrl)).rejects.toThrow();
    await rm(tempRoot, { recursive: true, force: true });

    const backupRoot = await mkdtemp(path.join(os.tmpdir(), "tilbecore-tenant-backup-"));
    temporaryRoots.push(backupRoot);
    const backupCreate = await runTenantOpsCli([
      "tenant", "backup", "create",
      "--tenant-id", commandA.tenant.id,
      "--request-id", `backup_create_${suffix}`,
    ], platformUrl, tenantAdminUrl, backupRoot);
    const backupOutput = JSON.parse(backupCreate.stdout) as { backupId: string; status: string };
    expect(backupOutput.status).toBe("completed");
    expect(backupCreate.stdout).not.toContain(tenantAdminUrl);
    expect(backupCreate.stdout).not.toContain(tenantDatabaseNameForRef(commandA.databaseRef.id));
    const backupStatus = await runTenantOpsCli([
      "tenant", "backup", "status",
      "--tenant-id", commandA.tenant.id,
      "--backup-id", backupOutput.backupId,
    ], platformUrl, tenantAdminUrl, backupRoot);
    expect(JSON.parse(backupStatus.stdout)).toMatchObject({ status: "completed" });
    const backupVerify = await runTenantOpsCli([
      "tenant", "backup", "verify",
      "--tenant-id", commandA.tenant.id,
      "--backup-id", backupOutput.backupId,
      "--request-id", `backup_verify_${suffix}`,
    ], platformUrl, tenantAdminUrl, backupRoot);
    expect(JSON.parse(backupVerify.stdout)).toMatchObject({ status: "verified", verificationStatus: "verified" });
    const restorePlan = await runTenantOpsCli([
      "tenant", "restore", "plan",
      "--tenant-id", commandA.tenant.id,
      "--backup-id", backupOutput.backupId,
      "--request-id", `restore_plan_${suffix}`,
    ], platformUrl, tenantAdminUrl, backupRoot);
    expect(JSON.parse(restorePlan.stdout)).toMatchObject({
      destructiveRestoreEnabled: false,
      explicitApprovalRequired: true,
    });
    const restoreVerify = await runTenantOpsCli([
      "tenant", "restore", "verify",
      "--tenant-id", commandA.tenant.id,
      "--backup-id", backupOutput.backupId,
      "--request-id", `restore_verify_${suffix}`,
    ], platformUrl, tenantAdminUrl, backupRoot);
    expect(JSON.parse(restoreVerify.stdout)).toMatchObject({
      verificationStatus: "verified",
      productionRestoreApplied: false,
    });
    await expect(runTenantOpsCli([
      "tenant", "backup", "status",
      "--tenant-id", commandB.tenant.id,
      "--backup-id", backupOutput.backupId,
    ], platformUrl, tenantAdminUrl, backupRoot)).rejects.toThrow();
    const verificationDatabases = await platform.$queryRawUnsafe<Array<{ count: bigint }>>(
      "SELECT count(*)::bigint AS count FROM pg_database WHERE datname LIKE 'tc_verify_%'",
    );
    expect(Number(verificationDatabases[0]?.count ?? 0)).toBe(0);

    const rollbackCommand = commandFor("rollback", actorId);
    createdRefs.push(rollbackCommand.databaseRef.id);
    const rollbackJob = createProvisioningJob({
      ...rollbackCommand,
      requestedByUserId: actorId,
      now: "2026-08-10T10:00:00.000Z",
    });
    await dependencies.provisioningJobRepository.create(rollbackJob);
    const rollbackInput = {
      provisioningJobId: rollbackJob.id,
      tenantInstanceId: rollbackCommand.tenant.id,
      databaseRefId: rollbackCommand.databaseRef.id,
      requestId: `request_rollback_create_${suffix}`,
    };
    await dependencies.tenantDatabaseProvisioner.createDatabase(rollbackInput);
    await dependencies.provisioningJobRepository.update({
      ...rollbackJob,
      status: "failed",
      databaseCreatedByJob: true,
      failureCode: "TEST_INTERRUPTED",
    });
    const cliRollback = await runCli([
      "rollback",
      "--tenant-id",
      rollbackCommand.tenant.id,
      "--request-id",
      `request_rollback_apply_${suffix}`,
    ], platformUrl, tenantAdminUrl);
    expect(JSON.parse(cliRollback.stdout)).toMatchObject({ status: "rolled_back", rollbackStatus: "succeeded" });
    await expect(dependencies.tenantDatabaseProvisioner.databaseExists(rollbackInput)).resolves.toBe(false);
    await expect(dependencies.tenantDatabaseProvisioner.databaseExists({
      provisioningJobId: resultA.job.id,
      tenantInstanceId: commandA.tenant.id,
      databaseRefId: commandA.databaseRef.id,
      requestId: `status_a_${suffix}`,
    })).resolves.toBe(true);
    await expect(dependencies.tenantDatabaseProvisioner.databaseExists({
      provisioningJobId: resultB.job.id,
      tenantInstanceId: commandB.tenant.id,
      databaseRefId: commandB.databaseRef.id,
      requestId: `status_b_${suffix}`,
    })).resolves.toBe(true);

    const repeated = await provisionTenant(dependencies, commandA);
    expect(repeated.job.id).toBe(resultA.job.id);
    expect(await platform.platformProvisioningJob.count({ where: { tenantInstanceId: commandA.tenant.id } })).toBe(1);
    expect(await platform.tenantInstance.count({ where: { id: commandA.tenant.id } })).toBe(1);

    await platform.$disconnect();
  }, 240_000);
});

afterAll(async () => {
  if (!tenantAdminUrl) return;
  if (pool) await pool.shutdown().catch(() => undefined);
  const admin = new TenantPrismaClient({ datasources: { db: { url: new TenantDatabaseLocator(tenantAdminUrl).adminConnectionUrl() } } });
  for (const ref of createdRefs) {
    const databaseName = tenantDatabaseNameForRef(ref);
    await admin.$queryRawUnsafe(
      "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()",
      databaseName,
    ).catch(() => undefined);
    await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS ${quotePostgresIdentifier(databaseName)}`).catch(() => undefined);
  }
  await admin.$disconnect().catch(() => undefined);
  for (const temporaryRoot of temporaryRoots) {
    await rm(temporaryRoot, { recursive: true, force: true }).catch(() => undefined);
  }
});

function commandFor(label: "a" | "b" | "cli" | "rollback", actorUserId: PlatformUserId): ProvisionTenantCommand {
  const organizationId = `org_${label}_${suffix}` as OrganizationId;
  const tenantInstanceId = `tenant_${label}_${suffix}` as TenantInstanceId;
  const databaseRefId = `dbref_${label}_${suffix}` as TenantDatabaseRefId;
  const slug = `firma-${label}-${suffix.replace(/_/g, "-")}` as TenantSlug;
  return {
    actorUserId,
    requestId: `request_${label}_${suffix}`,
    idempotencyKey: `idem_${label}_${suffix}` as ProvisioningIdempotencyKey,
    occurredAt: "2026-08-10T10:00:00.000Z",
    organization: { id: organizationId, slug, displayName: `Firma ${label.toUpperCase()}`, status: "active" },
    tenant: {
      id: tenantInstanceId,
      organizationId,
      slug,
      displayName: `Firma ${label.toUpperCase()}`,
      provisioningStatus: "active",
      releaseChannel: "stable",
      databaseRef: { id: databaseRefId, engine: "postgresql", managed: true, region: "ci" },
    },
    databaseRef: { id: databaseRefId, engine: "postgresql", managed: true, region: "ci", status: "active" },
    adminUser: {
      id: `admin_${label}_${suffix}` as PlatformUserId,
      email: `admin_${label}_${suffix}@example.test`,
      displayName: `Firma ${label.toUpperCase()} Admin`,
      status: "active",
      roles: [],
    },
  };
}

function descriptorFor(command: ProvisionTenantCommand): PlatformTenantDescriptor {
  return {
    organizationId: command.organization.id,
    organizationStatus: "active",
    tenantInstanceId: command.tenant.id,
    slug: command.tenant.slug,
    displayName: command.tenant.displayName,
    deploymentMode: "managed",
    provisioningStatus: "active",
    runtimeStatus: "healthy",
    releaseChannel: "stable",
    databaseRef: command.databaseRef,
    databaseRefStatus: "active",
    moduleEntitlements: [],
    limits: {},
  };
}

function cliInput(command: ProvisionTenantCommand) {
  return {
    ...command,
    adminUser: {
      id: command.adminUser.id,
      email: command.adminUser.email,
      displayName: command.adminUser.displayName,
      status: command.adminUser.status,
    },
  };
}

function tenantSessionFor(command: ProvisionTenantCommand, label: string): TenantUserSessionIdentity {
  return {
    kind: "tenant",
    organizationId: command.organization.id,
    tenantInstanceId: command.tenant.id,
    databaseRefId: command.databaseRef.id,
    sessionId: `tenant_session_${label}_${suffix}`,
    userId: `tenant_user_${label}_${suffix}`,
    roleIds: ["firm_admin"],
    permissions: ["customer.read"],
  };
}

function runCli(
  args: readonly string[],
  platformDatabaseUrl: string,
  tenantDatabaseAdminUrl: string,
) {
  const invocation = pnpmInvocation();
  return execFileAsync(
    invocation.command,
    [...invocation.prefix, "provisioning:cli", ...args],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PLATFORM_DATABASE_URL: platformDatabaseUrl,
        TENANT_DATABASE_ADMIN_URL: tenantDatabaseAdminUrl,
      },
      timeout: 120_000,
      windowsHide: true,
      maxBuffer: 2 * 1024 * 1024,
    },
  );
}

function runTenantOpsCli(
  args: readonly string[],
  platformDatabaseUrl: string,
  tenantDatabaseAdminUrl: string,
  backupRoot: string,
) {
  const invocation = pnpmInvocation();
  return execFileAsync(
    invocation.command,
    [...invocation.prefix, "tenant:ops", ...args],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PLATFORM_DATABASE_URL: platformDatabaseUrl,
        TENANT_DATABASE_ADMIN_URL: tenantDatabaseAdminUrl,
        TENANT_BACKUP_ROOT: backupRoot,
      },
      timeout: 180_000,
      windowsHide: true,
      maxBuffer: 2 * 1024 * 1024,
    },
  );
}

function pnpmInvocation(): { command: string; prefix: string[] } {
  if (process.platform !== "win32") return { command: "pnpm", prefix: [] };
  const directories = (process.env.PATH ?? "")
    .split(path.delimiter)
    .map((entry) => entry.replace(/^\"|\"$/g, ""))
    .filter(Boolean);
  const relativeCandidates = [
    "node_modules/pnpm/bin/pnpm.mjs",
    "node_modules/pnpm/bin/pnpm.cjs",
    "node_modules/corepack/dist/pnpm.js",
  ];
  for (const relativeCandidate of relativeCandidates) {
    for (const directory of directories) {
      const candidate = path.join(directory, relativeCandidate);
      if (fs.existsSync(candidate)) return { command: process.execPath, prefix: [candidate] };
    }
  }
  throw new Error("PNPM_WINDOWS_SCRIPT_NOT_FOUND");
}
