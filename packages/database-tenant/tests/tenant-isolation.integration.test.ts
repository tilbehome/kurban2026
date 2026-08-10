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
  PrismaPlatformUserRepository,
  PrismaProvisioningJobRepository,
  PrismaTenantDatabaseRefRepository,
  PrismaTenantInstanceRepository,
} from "@tilbecore/database-platform";
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
  assertTenantOperationAccess,
  resolveTenantRuntimeContext,
  safeTenantRuntimeFailure,
  type TenantRegistry,
} from "@tilbecore/tenant-runtime";
import { createTilbeCoreDomainConfig } from "@tilbecore/config";
import type {
  OrganizationId,
  PlatformTenantDescriptor,
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
      platformUserRepository: new PrismaPlatformUserRepository(platform),
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
      session: {
        tenantInstanceId: commandA.tenant.id,
        databaseRefId: commandA.databaseRef.id,
        userId: `user_a_${suffix}`,
        roleIds: ["firm_admin"],
      },
    });
    const contextB = await resolveTenantRuntimeContext(config, registry, {
      hostHeader: `${commandB.tenant.slug}.${config.baseDomain}`,
      requestId: `runtime_b_${suffix}`,
      session: {
        tenantInstanceId: commandB.tenant.id,
        databaseRefId: commandB.databaseRef.id,
        userId: `user_b_${suffix}`,
        roleIds: ["firm_admin"],
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
      session: {
        tenantInstanceId: commandB.tenant.id,
        databaseRefId: commandB.databaseRef.id,
        roleIds: [],
      },
    })).rejects.toThrow("TENANT_SESSION_MISMATCH");
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
    tenantInstanceId: command.tenant.id,
    slug: command.tenant.slug,
    displayName: command.tenant.displayName,
    deploymentMode: "managed",
    provisioningStatus: "active",
    runtimeStatus: "healthy",
    releaseChannel: "stable",
    databaseRef: command.databaseRef,
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
