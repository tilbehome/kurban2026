import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { PrismaClient } from "../generated/client";
import {
  PrismaOrganizationRepository,
  PrismaPlanLicenseRepository,
  PrismaTenantDatabaseRefRepository,
  PrismaTenantInstanceRepository,
} from "../src/repositories/platform-prisma-repositories";
import { PrismaPlatformAdminRepository } from "../src/repositories/platform-admin-prisma-repository";
import type {
  Organization,
  PlatformLicense,
  PlatformModuleId,
  PlatformPlan,
  PlatformPlanId,
  PlatformUserId,
  TenantDatabaseRefRecord,
  TenantInstance,
} from "@tilbecore/platform";
import type {
  OrganizationId,
  TenantDatabaseRefId,
  TenantInstanceId,
  TenantSlug,
} from "@tilbecore/contracts";

const shouldRunPostgresTests = process.env.RUN_PLATFORM_POSTGRES_TESTS === "1";
const baseDatabaseUrl = shouldRunPostgresTests ? process.env.PLATFORM_TEST_DATABASE_URL : undefined;
const currentFile = fileURLToPath(import.meta.url);

if (shouldRunPostgresTests && !baseDatabaseUrl) {
  throw new Error("RUN_PLATFORM_POSTGRES_TESTS=1 iken PLATFORM_TEST_DATABASE_URL tanımlı olmalıdır.");
}

const describePostgres = baseDatabaseUrl ? describe : describe.skip;
const schemaPrefix = `tc_${Date.now().toString(36)}`.toLowerCase();
const createdSchemas = new Set<string>();
const platformMigrationChain = [
  "0001_platform_baseline",
  "0002_platform_baseline_hardening",
  "0003_platform_control_plane_metadata",
  "0004_resumable_tenant_provisioning",
  "0005_tenant_request_runtime_metadata",
  "0006_platform_admin_operations",
] as const;

describePostgres("platform PostgreSQL migration zinciri", () => {
  test("boş PostgreSQL şemasına güncel platform migration zinciri uygulanır, drift kalmaz ve tekrar deploy veri bozmaz", async () => {
    const schema = await createSchema("empty_chain");
    const url = databaseUrlForSchema(schema);

    const output = runMigrateDeploy(url, createMigrationFixture(platformMigrationChain));
    expect(output).toContain("migrations found");

    await expectNoDrift(url);
    const secondOutput = runMigrateDeploy(url, createMigrationFixture(platformMigrationChain));
    expect(secondOutput).toContain("No pending migrations to apply");
  }, 30_000);

  test("0001 sonrası örnek kayıtlar varken güncel migration zinciri uygulanır ve PlatformUser ile Organization silinmez", async () => {
    const schema = await createSchema("seeded_upgrade");
    const url = databaseUrlForSchema(schema);
    const oneMigration = createMigrationFixture(["0001_platform_baseline"]);
    const currentMigrations = createMigrationFixture(platformMigrationChain);

    runMigrateDeploy(url, oneMigration);

    const db = prismaFor(url);
    const ids = idsFor("seeded");
    await db.$executeRawUnsafe(
      `INSERT INTO "Organization" ("id", "slug", "displayName", "status", "updatedAt")
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
      ids.organizationId,
      ids.slug,
      "Seeded Organization",
      "active",
    );
    await db.$executeRawUnsafe(
      `INSERT INTO "PlatformUser" ("id", "organizationId", "email", "displayName", "status", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
      ids.userId,
      ids.organizationId,
      `${ids.slug}@example.test`,
      "Seeded User",
      "active",
    );

    runMigrateDeploy(url, currentMigrations);

    const users = await db.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT "id" FROM "PlatformUser" WHERE "id" = $1`,
      ids.userId,
    );
    const organizations = await db.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT "id" FROM "Organization" WHERE "id" = $1`,
      ids.organizationId,
    );
    const organizationIdColumns = await db.$queryRawUnsafe<Array<{ column_name: string }>>(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = $1 AND table_name = 'PlatformUser' AND column_name = 'organizationId'`,
      schema,
    );

    expect(users).toHaveLength(1);
    expect(organizations).toHaveLength(1);
    expect(organizationIdColumns).toHaveLength(0);

    await db.$disconnect();
    fs.rmSync(oneMigration.root, { recursive: true, force: true });
    fs.rmSync(currentMigrations.root, { recursive: true, force: true });
  }, 30_000);

  test("check constraint, foreign key ve unique kuralları gerçek PostgreSQL üzerinde reddeder", async () => {
    const schema = await createSchema("constraints");
    const url = databaseUrlForSchema(schema);
    runMigrateDeploy(url, createMigrationFixture(platformMigrationChain));

    const db = prismaFor(url);
    const ids = idsFor("constraints");

    await expect(
      db.$executeRawUnsafe(
        `INSERT INTO "Organization" ("id", "slug", "displayName", "status", "updatedAt")
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        ids.organizationId,
        ids.slug,
        "Invalid Organization",
        "invalid",
      ),
    ).rejects.toThrow();

    await expect(
      db.$executeRawUnsafe(
        `INSERT INTO "TenantDatabaseRef" ("id", "engine", "managed", "region", "status", "updatedAt")
         VALUES ($1, $2, true, NULL, $3, CURRENT_TIMESTAMP)`,
        ids.databaseRefId,
        "mysql",
        "active",
      ),
    ).rejects.toThrow();

    await expect(
      db.$executeRawUnsafe(
        `INSERT INTO "PlatformPlan" ("id", "code", "displayName", "status", "maxUsers", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
        ids.planId,
        ids.slug,
        "Invalid Plan",
        "active",
        -1,
      ),
    ).rejects.toThrow();

    await db.organization.create({
      data: { id: ids.organizationId, slug: ids.slug, displayName: "Valid Organization", status: "active" },
    });
    await expect(
      db.organization.create({
        data: { id: `${ids.organizationId}_2`, slug: ids.slug, displayName: "Duplicate", status: "active" },
      }),
    ).rejects.toThrow();
    await expect(
      db.tenantInstance.create({
        data: {
          id: ids.tenantInstanceId,
          slug: `${ids.slug}-tenant`,
          displayName: "Invalid Tenant",
          provisioningStatus: "active",
          releaseChannel: "stable",
          organization: { connect: { id: "missing_org" } },
          databaseRef: { connect: { id: "missing_db_ref" } },
        },
      }),
    ).rejects.toThrow();

    await db.$disconnect();
  }, 30_000);
});

describePostgres("platform repository gerçek PostgreSQL integration", () => {
  let schema: string;
  let db: PrismaClient;
  let organizationRepository: PrismaOrganizationRepository;
  let databaseRefRepository: PrismaTenantDatabaseRefRepository;
  let tenantRepository: PrismaTenantInstanceRepository;
  let planLicenseRepository: PrismaPlanLicenseRepository;

  beforeAll(async () => {
    schema = await createSchema("repo");
    const url = databaseUrlForSchema(schema);
    runMigrateDeploy(url, createMigrationFixture(platformMigrationChain));
    db = prismaFor(url);
    organizationRepository = new PrismaOrganizationRepository(db);
    databaseRefRepository = new PrismaTenantDatabaseRefRepository(db);
    tenantRepository = new PrismaTenantInstanceRepository(db);
    planLicenseRepository = new PrismaPlanLicenseRepository(db);
  }, 30_000);

  afterAll(async () => {
    await db?.$disconnect();
  });

  test("Organization oluşturur ve slug tekilliğini gerçek unique index ile korur", async () => {
    const ids = idsFor("org");
    const organization = await organizationRepository.create(organizationFor(ids));

    expect(organization.slug).toBe(ids.slug);
    await expect(organizationRepository.create({ ...organization, id: `${ids.organizationId}_dup` as OrganizationId })).rejects.toThrow();
  });

  test("TenantDatabaseRef ve TenantInstance doğru ilişkiyle yazılır, yanlış ref reddedilir ve secret sızmaz", async () => {
    const ids = idsFor("tenant");
    await organizationRepository.create(organizationFor(ids));
    const databaseRef = await databaseRefRepository.create(databaseRefFor(ids));

    const tenant = await tenantRepository.create(tenantFor(ids));
    expect(tenant.databaseRef.id).toBe(databaseRef.id);
    expect(tenant.databaseRef.engine).toBe("postgresql");
    expect(JSON.stringify(tenant)).not.toContain("postgresql://");
    expect(JSON.stringify(databaseRef)).not.toContain("postgresql://");

    const wrongIds = idsFor("wrong_ref");
    await expect(
      tenantRepository.create({
        ...tenantFor(wrongIds),
        organizationId: ids.organizationId,
        databaseRef: { id: "missing_ref" as TenantDatabaseRefId, engine: "postgresql", managed: true },
      }),
    ).rejects.toThrow();
  });

  test("Plan, modül, plan hakkı, lisans ve entitlement nested relation write ile çalışır", async () => {
    const ids = idsFor("license");
    await organizationRepository.create(organizationFor(ids));
    await db.platformModule.create({
      data: { id: ids.moduleId, key: `${ids.slug}_module`, displayName: "Kesim Modülü", status: "active" },
    });

    const validUntil = "2027-06-01T00:00:00.000Z";
    const plan = await planLicenseRepository.createPlan(planFor(ids, validUntil));
    const license = await planLicenseRepository.createLicense(licenseFor(ids, validUntil));

    expect(plan.limits).toEqual({ maxUsers: 10, maxDevices: 5, maxStorageMb: 2048 });
    expect(plan.entitlements[0]?.validUntil).toBe(validUntil);
    expect(license.limits).toEqual({ maxUsers: 7, maxDevices: 3, maxStorageMb: 1024 });
    expect(license.entitlements[0]?.validUntil).toBe(validUntil);
  });

  test("Transaction başarılıysa commit eder, hata olduğunda rollback yapar", async () => {
    const commitIds = idsFor("tx_commit");
    await organizationRepository.create(organizationFor(commitIds));
    const committed = await tenantRepository.createWithDatabaseRef(tenantFor(commitIds), databaseRefFor(commitIds));

    expect(committed.id).toBe(commitIds.tenantInstanceId);
    await expect(databaseRefRepository.findById(commitIds.databaseRefId)).resolves.not.toBeNull();

    const rollbackIds = idsFor("tx_rollback");
    await expect(
      tenantRepository.createWithDatabaseRef(
        tenantFor({ ...rollbackIds, organizationId: "missing_org" as OrganizationId }),
        databaseRefFor(rollbackIds),
      ),
    ).rejects.toThrow();
    await expect(databaseRefRepository.findById(rollbackIds.databaseRefId)).resolves.toBeNull();
  });

  test("Platform Admin komut kuyruğu pending durumunu ve idempotent tekrarı gerçek DB'de korur", async () => {
    const actorId = `platform_actor_${schemaPrefix}` as PlatformUserId;
    await db.platformUser.create({ data: { id: actorId, email: `${actorId}@example.test`, displayName: "Platform Actor", status: "active", passwordHash: "sensitive-password-hash" } });
    await db.platformMfaEnrollment.create({ data: { id: `mfa_${schemaPrefix}`, userId: actorId, method: "totp", status: "active", secretCiphertext: "sensitive-mfa-ciphertext" } });
    const repository = new PrismaPlatformAdminRepository(db);
    const draft = {
      id: `command_${schemaPrefix}`,
      idempotencyKey: `idempotency_${schemaPrefix}`,
      type: "tenant.backup.create" as const,
      organizationId: `org_command_${schemaPrefix}` as OrganizationId,
      tenantInstanceId: `tenant_command_${schemaPrefix}` as TenantInstanceId,
      requestedByUserId: actorId,
      requestId: `request_${schemaPrefix}`,
      traceId: `trace_${schemaPrefix}`,
      approvalReason: "Entegrasyon testi için onaylandı",
      payload: {},
    };
    await expect(repository.enqueueCommand(draft)).resolves.toMatchObject({ status: "pending", duplicate: false });
    await expect(repository.enqueueCommand({ ...draft, id: `${draft.id}_again` })).resolves.toMatchObject({ status: "pending", duplicate: true });
    await expect(db.platformAdminCommand.count({ where: { idempotencyKey: draft.idempotencyKey } })).resolves.toBe(1);
    const safeUsers = JSON.stringify(await repository.listPlatformUsers());
    expect(safeUsers).not.toContain("sensitive-password-hash");
    expect(safeUsers).not.toContain("sensitive-mfa-ciphertext");
  });
});

function prismaFor(url: string): PrismaClient {
  return new PrismaClient({ datasources: { db: { url } } });
}

async function createSchema(label: string): Promise<string> {
  if (!baseDatabaseUrl) throw new Error("PLATFORM_TEST_DATABASE_URL tanımlı değil.");
  const schema = `${schemaPrefix}_${safeLabel(label)}_${createdSchemas.size}`;
  createdSchemas.add(schema);
  const admin = prismaFor(databaseUrlForSchema("public"));
  await admin.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
  await admin.$disconnect();
  return schema;
}

afterAll(async () => {
  if (!baseDatabaseUrl) return;
  const admin = prismaFor(databaseUrlForSchema("public"));
  for (const schema of createdSchemas) {
    await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  }
  await admin.$disconnect();
});

function databaseUrlForSchema(schema: string): string {
  if (!baseDatabaseUrl) throw new Error("PLATFORM_TEST_DATABASE_URL tanımlı değil.");
  const url = new URL(baseDatabaseUrl);
  url.searchParams.set("schema", schema);
  return url.toString();
}

function runMigrateDeploy(databaseUrl: string, fixture: MigrationFixture): string {
  return runPnpmSync(["exec", "prisma", "migrate", "deploy", "--schema", fixture.schemaPath], {
    cwd: repoRoot(),
    env: { ...process.env, PLATFORM_DATABASE_URL: databaseUrl },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function expectNoDrift(databaseUrl: string): Promise<void> {
  expect(() =>
    runPnpmSync(
      [
        "exec",
        "prisma",
        "migrate",
        "diff",
        "--from-url",
        databaseUrl,
        "--to-schema-datamodel",
        platformSchemaPath(),
        "--exit-code",
      ],
      {
        cwd: repoRoot(),
        env: { ...process.env, PLATFORM_DATABASE_URL: databaseUrl },
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    ),
  ).not.toThrow();
}

interface MigrationFixture {
  root: string;
  schemaPath: string;
}

function createMigrationFixture(migrationNames: readonly string[]): MigrationFixture {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tilbecore-platform-prisma-"));
  const prismaDir = path.join(root, "prisma");
  const migrationsDir = path.join(prismaDir, "migrations");
  fs.mkdirSync(migrationsDir, { recursive: true });
  fs.copyFileSync(platformSchemaPath(), path.join(prismaDir, "schema.prisma"));
  for (const migrationName of migrationNames) {
    fs.cpSync(path.join(platformMigrationsPath(), migrationName), path.join(migrationsDir, migrationName), {
      recursive: true,
    });
  }
  return { root, schemaPath: path.join(prismaDir, "schema.prisma") };
}

function repoRoot(): string {
  return path.resolve(path.dirname(currentFile), "../../..");
}

function platformSchemaPath(): string {
  return path.join(repoRoot(), "packages/database-platform/prisma/schema.prisma");
}

function platformMigrationsPath(): string {
  return path.join(repoRoot(), "packages/database-platform/prisma/migrations");
}

function runPnpmSync(
  args: readonly string[],
  options: Parameters<typeof execFileSync>[2],
): string {
  const invocation = pnpmInvocation();
  return execFileSync(invocation.command, [...invocation.prefix, ...args], options) as string;
}

function pnpmInvocation(): { command: string; prefix: string[] } {
  if (process.platform !== "win32") return { command: "pnpm", prefix: [] };
  const script = findWindowsPnpmScript();
  if (!script) throw new Error("PNPM_WINDOWS_SCRIPT_NOT_FOUND");
  return { command: process.execPath, prefix: [script] };
}

function findWindowsPnpmScript(): string | undefined {
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
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return undefined;
}

function safeLabel(label: string): string {
  return label.replace(/[^a-z0-9_]/gi, "_").toLowerCase();
}

function idsFor(label: string) {
  const suffix = `${safeLabel(label)}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    organizationId: `org_${suffix}` as OrganizationId,
    tenantInstanceId: `tenant_${suffix}` as TenantInstanceId,
    databaseRefId: `dbref_${suffix}` as TenantDatabaseRefId,
    planId: `plan_${suffix}` as PlatformPlanId,
    moduleId: `module_${suffix}` as PlatformModuleId,
    licenseId: `license_${suffix}` as PlatformLicense["id"],
    userId: `user_${suffix}`,
    slug: `slug-${suffix.replace(/_/g, "-")}` as TenantSlug,
  };
}

function organizationFor(ids: ReturnType<typeof idsFor>): Organization {
  return {
    id: ids.organizationId,
    slug: ids.slug,
    displayName: "Test Organization",
    status: "active",
  };
}

function databaseRefFor(ids: ReturnType<typeof idsFor>): TenantDatabaseRefRecord {
  return {
    id: ids.databaseRefId,
    engine: "postgresql",
    managed: true,
    region: "eu-test",
    status: "active",
  };
}

function tenantFor(ids: ReturnType<typeof idsFor>): TenantInstance {
  return {
    id: ids.tenantInstanceId,
    organizationId: ids.organizationId,
    slug: ids.slug,
    displayName: "Test Tenant",
    provisioningStatus: "active",
    releaseChannel: "stable",
    databaseRef: {
      id: ids.databaseRefId,
      engine: "postgresql",
      managed: true,
      region: "eu-test",
    },
  };
}

function planFor(ids: ReturnType<typeof idsFor>, validUntil: string): PlatformPlan {
  return {
    id: ids.planId,
    code: `${ids.slug}_plan`,
    displayName: "Test Plan",
    status: "active",
    limits: { maxUsers: 10, maxDevices: 5, maxStorageMb: 2048 },
    entitlements: [{ moduleId: ids.moduleId, enabled: true, validUntil }],
  };
}

function licenseFor(ids: ReturnType<typeof idsFor>, validUntil: string): PlatformLicense {
  return {
    id: ids.licenseId,
    organizationId: ids.organizationId,
    planId: ids.planId,
    status: "active",
    startsAt: "2026-01-01T00:00:00.000Z",
    limits: { maxUsers: 7, maxDevices: 3, maxStorageMb: 1024 },
    entitlements: [{ moduleId: ids.moduleId, enabled: true, validUntil }],
  };
}
