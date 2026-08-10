import { execFile } from "node:child_process";
import { access, readdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import type { TenantDatabaseRefId } from "@tilbecore/contracts";
import {
  TenantProvisioningError,
  type TenantDatabaseOperationInput,
  type TenantDatabaseProvisioner,
  type TenantDatabaseRollbackInput,
} from "@tilbecore/provisioning";
import type {
  TenantConnectionBinding,
  TenantConnectionFactory,
  TenantConnectionResource,
} from "@tilbecore/tenant-runtime";
import { PrismaClient } from "../generated/client";

const execFileAsync = promisify(execFile);
const MARKER_ID = "tenant";
const DEFAULT_TIMEOUT_MS = 30_000;

export type TenantPrismaClient = PrismaClient;

export interface PostgresTenantDatabaseOptions {
  adminDatabaseUrl: string;
  repositoryRoot?: string;
  migrationsPath?: string;
  schemaPath?: string;
  timeoutMs?: number;
}

interface ProvisioningMarkerRow {
  provisioningJobId: string;
  tenantInstanceId: string;
  databaseRefId: string;
}

interface DatabaseMarkerRow {
  marker: string | null;
}

export class TenantDatabaseLocator {
  private readonly adminUrl: URL;

  constructor(adminDatabaseUrl: string, private readonly connectTimeoutSeconds = 10) {
    this.adminUrl = parsePostgresUrl(adminDatabaseUrl);
    if (!Number.isInteger(connectTimeoutSeconds) || connectTimeoutSeconds < 1 || connectTimeoutSeconds > 60) {
      throw new TenantProvisioningError("TENANT_DATABASE_TIMEOUT_INVALID");
    }
  }

  adminConnectionUrl(): string {
    return withConnectionTimeout(this.adminUrl, this.connectTimeoutSeconds).toString();
  }

  tenantConnectionUrl(databaseRefId: TenantDatabaseRefId): string {
    const url = new URL(this.adminUrl);
    url.pathname = `/${tenantDatabaseNameForRef(databaseRefId)}`;
    url.searchParams.delete("schema");
    return withConnectionTimeout(url, this.connectTimeoutSeconds).toString();
  }
}

export class PostgresTenantDatabaseProvisioner implements TenantDatabaseProvisioner {
  private readonly locator: TenantDatabaseLocator;
  private readonly repositoryRoot: string;
  private readonly migrationsPath: string;
  private readonly schemaPath: string;
  private readonly timeoutMs: number;

  constructor(options: PostgresTenantDatabaseOptions) {
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    if (!Number.isInteger(this.timeoutMs) || this.timeoutMs < 1_000 || this.timeoutMs > 300_000) {
      throw new TenantProvisioningError("TENANT_DATABASE_TIMEOUT_INVALID");
    }
    this.repositoryRoot = path.resolve(options.repositoryRoot ?? process.cwd());
    this.migrationsPath = path.resolve(
      options.migrationsPath ?? path.join(this.repositoryRoot, "packages/database-tenant/prisma/migrations"),
    );
    this.schemaPath = path.resolve(
      options.schemaPath ?? path.join(this.repositoryRoot, "packages/database-tenant/prisma/schema.prisma"),
    );
    this.locator = new TenantDatabaseLocator(
      options.adminDatabaseUrl,
      Math.min(60, Math.ceil(this.timeoutMs / 1_000)),
    );
  }

  async createDatabase(input: TenantDatabaseOperationInput) {
    validateOperationInput(input);
    if (await this.databaseExists(input)) {
      await this.assertOwnedMarker(input);
      return { createdNow: false, ownedByProvisioningJob: true as const };
    }

    const databaseName = tenantDatabaseNameForRef(input.databaseRefId);
    const admin = new PrismaClient({ datasources: { db: { url: this.locator.adminConnectionUrl() } } });
    try {
      await withTimeout(
        admin.$executeRawUnsafe(`CREATE DATABASE ${quotePostgresIdentifier(databaseName)}`),
        this.timeoutMs,
        "TENANT_DATABASE_CREATE_TIMEOUT",
      );
    } catch (error) {
      if (await this.waitForOwnedDatabase(input)) {
        return { createdNow: false, ownedByProvisioningJob: true as const };
      }
      throw safeDatabaseError(error, "TENANT_DATABASE_CREATE_FAILED");
    } finally {
      await admin.$disconnect().catch(() => undefined);
    }

    try {
      await this.writeDatabaseOwnershipMarker(input);
    } catch (error) {
      await this.dropDatabaseWithoutMarker(databaseName).catch(() => undefined);
      throw safeDatabaseError(error, "TENANT_DATABASE_MARKER_FAILED");
    }
    return { createdNow: true, ownedByProvisioningJob: true as const };
  }

  async databaseExists(input: TenantDatabaseOperationInput): Promise<boolean> {
    validateOperationInput(input);
    const databaseName = tenantDatabaseNameForRef(input.databaseRefId);
    const admin = new PrismaClient({ datasources: { db: { url: this.locator.adminConnectionUrl() } } });
    try {
      const rows = await withTimeout(
        admin.$queryRawUnsafe<Array<{ exists: number }>>(
          "SELECT 1 AS exists FROM pg_database WHERE datname = $1",
          databaseName,
        ),
        this.timeoutMs,
        "TENANT_DATABASE_STATUS_TIMEOUT",
      );
      return rows.length === 1;
    } catch (error) {
      throw safeDatabaseError(error, "TENANT_DATABASE_STATUS_FAILED");
    } finally {
      await admin.$disconnect().catch(() => undefined);
    }
  }

  async applyMigrations(input: TenantDatabaseOperationInput): Promise<void> {
    validateOperationInput(input);
    await this.assertOwnedMarker(input);
    try {
      const invocation = await pnpmInvocation();
      await execFileAsync(
        invocation.command,
        [...invocation.prefix, "exec", "prisma", "migrate", "deploy", "--schema", this.schemaPath],
        {
          cwd: this.repositoryRoot,
          env: {
            ...process.env,
            TENANT_DATABASE_URL: this.locator.tenantConnectionUrl(input.databaseRefId),
          },
          timeout: this.timeoutMs,
          windowsHide: true,
          maxBuffer: 2 * 1024 * 1024,
        },
      );
      await this.writeTenantOwnershipMarker(input);
    } catch {
      throw new TenantProvisioningError("TENANT_MIGRATION_FAILED");
    }
  }

  async verifyIsolation(input: TenantDatabaseOperationInput): Promise<void> {
    validateOperationInput(input);
    await this.assertOwnedMarker(input);
    await this.assertTenantOwnedMarker(input);
    const expectedMigrations = (await readdir(this.migrationsPath, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    const tenant = this.tenantClient(input.databaseRefId);
    try {
      const applied = await withTimeout(
        tenant.$queryRawUnsafe<Array<{ migration_name: string }>>(
          `SELECT migration_name FROM "_prisma_migrations"
           WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
           ORDER BY migration_name`,
        ),
        this.timeoutMs,
        "TENANT_MIGRATION_VERIFY_TIMEOUT",
      );
      const tables = await tenant.$queryRawUnsafe<Array<{ table_name: string }>>(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name IN ('Season', 'TenantAuditLog', 'TenantProvisioningMarker')`,
      );
      if (
        JSON.stringify(applied.map((row) => row.migration_name)) !== JSON.stringify(expectedMigrations) ||
        tables.length !== 3
      ) {
        throw new TenantProvisioningError("TENANT_MIGRATION_VERIFY_FAILED");
      }
    } catch (error) {
      throw safeDatabaseError(error, "TENANT_MIGRATION_VERIFY_FAILED");
    } finally {
      await tenant.$disconnect().catch(() => undefined);
    }
  }

  async rollbackDatabase(input: TenantDatabaseRollbackInput): Promise<{ dropped: boolean }> {
    validateOperationInput(input);
    if (input.platformRegistrationCompleted) {
      throw new TenantProvisioningError("TENANT_DATABASE_ROLLBACK_PLATFORM_REGISTERED");
    }
    if (!(await this.databaseExists(input))) return { dropped: false };
    await this.assertOwnedMarker(input);
    const databaseName = tenantDatabaseNameForRef(input.databaseRefId);
    const admin = new PrismaClient({ datasources: { db: { url: this.locator.adminConnectionUrl() } } });
    try {
      await withTimeout(
        admin.$queryRawUnsafe(
          "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()",
          databaseName,
        ),
        this.timeoutMs,
        "TENANT_DATABASE_ROLLBACK_TIMEOUT",
      );
      await withTimeout(
        admin.$executeRawUnsafe(`DROP DATABASE ${quotePostgresIdentifier(databaseName)}`),
        this.timeoutMs,
        "TENANT_DATABASE_ROLLBACK_TIMEOUT",
      );
      return { dropped: true };
    } catch (error) {
      throw safeDatabaseError(error, "TENANT_DATABASE_ROLLBACK_FAILED");
    } finally {
      await admin.$disconnect().catch(() => undefined);
    }
  }

  private tenantClient(databaseRefId: TenantDatabaseRefId): PrismaClient {
    return new PrismaClient({
      datasources: { db: { url: this.locator.tenantConnectionUrl(databaseRefId) } },
    });
  }

  private async writeDatabaseOwnershipMarker(input: TenantDatabaseOperationInput): Promise<void> {
    const databaseName = tenantDatabaseNameForRef(input.databaseRefId);
    const marker = databaseOwnershipMarker(input);
    const admin = new PrismaClient({ datasources: { db: { url: this.locator.adminConnectionUrl() } } });
    try {
      await withTimeout(
        admin.$executeRawUnsafe(
          `COMMENT ON DATABASE ${quotePostgresIdentifier(databaseName)} IS '${marker}'`,
        ),
        this.timeoutMs,
        "TENANT_DATABASE_MARKER_TIMEOUT",
      );
      await this.assertDatabaseOwnedMarkerWithClient(admin, input);
    } finally {
      await admin.$disconnect().catch(() => undefined);
    }
  }

  private async writeTenantOwnershipMarker(input: TenantDatabaseOperationInput): Promise<void> {
    const tenant = this.tenantClient(input.databaseRefId);
    try {
      await tenant.$executeRawUnsafe(
        `INSERT INTO "TenantProvisioningMarker"
          ("id", "provisioningJobId", "tenantInstanceId", "databaseRefId")
         VALUES ($1, $2, $3, $4)
         ON CONFLICT ("id") DO NOTHING`,
        MARKER_ID,
        input.provisioningJobId,
        input.tenantInstanceId,
        input.databaseRefId,
      );
      await this.assertOwnedMarkerWithClient(tenant, input);
    } finally {
      await tenant.$disconnect().catch(() => undefined);
    }
  }

  private async assertOwnedMarker(input: TenantDatabaseOperationInput): Promise<void> {
    const admin = new PrismaClient({ datasources: { db: { url: this.locator.adminConnectionUrl() } } });
    try {
      await this.assertDatabaseOwnedMarkerWithClient(admin, input);
    } catch (error) {
      throw safeDatabaseError(error, "TENANT_DATABASE_NOT_OWNED_BY_JOB");
    } finally {
      await admin.$disconnect().catch(() => undefined);
    }
  }

  private async assertDatabaseOwnedMarkerWithClient(
    admin: PrismaClient,
    input: TenantDatabaseOperationInput,
  ): Promise<void> {
    const rows = await withTimeout(
      admin.$queryRawUnsafe<DatabaseMarkerRow[]>(
        `SELECT shobj_description(oid, 'pg_database') AS marker
         FROM pg_database WHERE datname = $1`,
        tenantDatabaseNameForRef(input.databaseRefId),
      ),
      this.timeoutMs,
      "TENANT_DATABASE_MARKER_TIMEOUT",
    );
    if (rows[0]?.marker !== databaseOwnershipMarker(input)) {
      throw new TenantProvisioningError("TENANT_DATABASE_NOT_OWNED_BY_JOB");
    }
  }

  private async assertTenantOwnedMarker(input: TenantDatabaseOperationInput): Promise<void> {
    const tenant = this.tenantClient(input.databaseRefId);
    try {
      await this.assertOwnedMarkerWithClient(tenant, input);
    } catch (error) {
      throw safeDatabaseError(error, "TENANT_DATABASE_NOT_OWNED_BY_JOB");
    } finally {
      await tenant.$disconnect().catch(() => undefined);
    }
  }

  private async assertOwnedMarkerWithClient(
    tenant: PrismaClient,
    input: TenantDatabaseOperationInput,
  ): Promise<void> {
    const rows = await withTimeout(
      tenant.$queryRawUnsafe<ProvisioningMarkerRow[]>(
        `SELECT "provisioningJobId", "tenantInstanceId", "databaseRefId"
         FROM "TenantProvisioningMarker" WHERE "id" = $1`,
        MARKER_ID,
      ),
      this.timeoutMs,
      "TENANT_DATABASE_MARKER_TIMEOUT",
    );
    const marker = rows[0];
    if (
      !marker ||
      marker.provisioningJobId !== input.provisioningJobId ||
      marker.tenantInstanceId !== input.tenantInstanceId ||
      marker.databaseRefId !== input.databaseRefId
    ) {
      throw new TenantProvisioningError("TENANT_DATABASE_NOT_OWNED_BY_JOB");
    }
  }

  private async dropDatabaseWithoutMarker(databaseName: string): Promise<void> {
    const admin = new PrismaClient({ datasources: { db: { url: this.locator.adminConnectionUrl() } } });
    try {
      await admin.$queryRawUnsafe(
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()",
        databaseName,
      );
      await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS ${quotePostgresIdentifier(databaseName)}`);
    } finally {
      await admin.$disconnect().catch(() => undefined);
    }
  }

  private async waitForOwnedDatabase(input: TenantDatabaseOperationInput): Promise<boolean> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      if (await this.databaseExists(input).catch(() => false)) {
        try {
          await this.assertOwnedMarker(input);
          return true;
        } catch {
          // Aynı idempotent işin ownership marker yazmasını kısa ve sınırlı süre bekle.
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return false;
  }
}

export class PrismaTenantConnectionFactory implements TenantConnectionFactory<PrismaClient> {
  constructor(
    private readonly locator: TenantDatabaseLocator,
    private readonly timeoutMs = DEFAULT_TIMEOUT_MS,
  ) {}

  async create(binding: TenantConnectionBinding): Promise<TenantConnectionResource<PrismaClient>> {
    const client = new PrismaClient({
      datasources: { db: { url: this.locator.tenantConnectionUrl(binding.databaseRefId) } },
    });
    try {
      await withTimeout(client.$connect(), this.timeoutMs, "TENANT_DATABASE_CONNECTION_TIMEOUT");
      return { client, dispose: () => client.$disconnect() };
    } catch {
      await client.$disconnect().catch(() => undefined);
      throw new TenantProvisioningError("TENANT_DATABASE_CONNECTION_FAILED");
    }
  }
}

export function tenantDatabaseNameForRef(databaseRefId: TenantDatabaseRefId | string): string {
  const value = String(databaseRefId);
  if (!/^[a-z][a-z0-9_]{2,55}$/.test(value)) {
    throw new TenantProvisioningError("TENANT_DATABASE_IDENTIFIER_INVALID");
  }
  const databaseName = `tc_${value}`;
  if (Buffer.byteLength(databaseName, "utf8") > 63) {
    throw new TenantProvisioningError("TENANT_DATABASE_IDENTIFIER_INVALID");
  }
  return databaseName;
}

export function quotePostgresIdentifier(identifier: string): string {
  if (!/^[a-z][a-z0-9_]{2,62}$/.test(identifier)) {
    throw new TenantProvisioningError("TENANT_DATABASE_IDENTIFIER_INVALID");
  }
  return `"${identifier}"`;
}

function validateOperationInput(input: TenantDatabaseOperationInput): void {
  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(input.provisioningJobId)) {
    throw new TenantProvisioningError("PROVISIONING_JOB_IDENTIFIER_INVALID");
  }
  if (!/^[a-zA-Z0-9_-]{3,80}$/.test(input.tenantInstanceId)) {
    throw new TenantProvisioningError("TENANT_INSTANCE_IDENTIFIER_INVALID");
  }
  tenantDatabaseNameForRef(input.databaseRefId);
  if (!/^[a-zA-Z0-9_-]{3,100}$/.test(input.requestId)) {
    throw new TenantProvisioningError("PROVISIONING_REQUEST_ID_INVALID");
  }
}

function databaseOwnershipMarker(input: TenantDatabaseOperationInput): string {
  validateOperationInput(input);
  return `tilbecore:v1:${input.provisioningJobId}:${input.tenantInstanceId}:${input.databaseRefId}`;
}

function parsePostgresUrl(value: string): URL {
  try {
    const url = new URL(value);
    if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") throw new Error();
    if (!url.hostname || !url.pathname || url.pathname === "/") throw new Error();
    url.searchParams.delete("schema");
    return url;
  } catch {
    throw new TenantProvisioningError("TENANT_DATABASE_ADMIN_URL_INVALID");
  }
}

function withConnectionTimeout(url: URL, seconds: number): URL {
  const copy = new URL(url);
  copy.searchParams.set("connect_timeout", String(seconds));
  return copy;
}

async function pnpmInvocation(): Promise<{ command: string; prefix: string[] }> {
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
      try {
        await access(candidate);
        return { command: process.execPath, prefix: [candidate] };
      } catch {
        // Bir sonraki sabit pnpm kurulum yolunu dene.
      }
    }
  }
  throw new TenantProvisioningError("TENANT_MIGRATION_TOOL_UNAVAILABLE");
}

function safeDatabaseError(error: unknown, fallback: string): TenantProvisioningError {
  return error instanceof TenantProvisioningError ? error : new TenantProvisioningError(fallback);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, code: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new TenantProvisioningError(code)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
