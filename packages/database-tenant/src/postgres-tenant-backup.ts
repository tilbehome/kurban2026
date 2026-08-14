import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import {
  access,
  appendFile,
  mkdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import type { TenantDatabaseRefId, TenantInstanceId } from "@tilbecore/contracts";
import {
  assertBackupMatchesTenant,
  createTenantRestorePlan,
  type TenantBackupAuditEvent,
  type TenantBackupAuditPort,
  type TenantBackupMetadata,
  type TenantRestorePlan,
} from "@tilbecore/operations";
import { PrismaClient } from "../generated/client";
import {
  quotePostgresIdentifier,
  TenantDatabaseLocator,
  tenantDatabaseNameForRef,
} from "./postgres-tenant-database";

const execFileAsync = promisify(execFile);
const DEFAULT_TIMEOUT_MS = 120_000;

export interface TenantBackupBinding {
  tenantInstanceId: TenantInstanceId;
  databaseRefId: TenantDatabaseRefId;
}

export interface PostgresProcessSpec {
  command: string;
  args: readonly string[];
  env: NodeJS.ProcessEnv;
  timeoutMs: number;
}

export interface PostgresProcessRunner {
  run(spec: PostgresProcessSpec): Promise<void>;
}

export interface PostgresTenantBackupOptions {
  adminDatabaseUrl: string;
  storageRoot: string;
  repositoryRoot?: string;
  postgresBinDirectory?: string;
  timeoutMs?: number;
  audit: TenantBackupAuditPort;
  runner?: PostgresProcessRunner;
  now?: () => string;
  idFactory?: () => string;
}

export class ExecFilePostgresProcessRunner implements PostgresProcessRunner {
  async run(spec: PostgresProcessSpec): Promise<void> {
    await execFileAsync(spec.command, [...spec.args], {
      env: spec.env,
      timeout: spec.timeoutMs,
      windowsHide: true,
      maxBuffer: 2 * 1024 * 1024,
    });
  }
}

export class JsonFileTenantBackupAuditPort implements TenantBackupAuditPort {
  constructor(private readonly storageRoot: string) {}

  async record(event: TenantBackupAuditEvent): Promise<void> {
    validateIdentifier(event.tenantInstanceId, "BACKUP_TENANT_IDENTIFIER_INVALID");
    const auditDirectory = path.join(this.storageRoot, "audit");
    await mkdir(auditDirectory, { recursive: true });
    await appendFile(
      path.join(auditDirectory, `${event.tenantInstanceId}.jsonl`),
      `${JSON.stringify(event)}\n`,
      { encoding: "utf8", mode: 0o600 },
    );
  }
}

export class PostgresTenantBackupService {
  private readonly adminUrl: URL;
  private readonly locator: TenantDatabaseLocator;
  private readonly storageRoot: string;
  private readonly postgresBinDirectory?: string;
  private readonly timeoutMs: number;
  private readonly runner: PostgresProcessRunner;
  private readonly now: () => string;
  private readonly idFactory: () => string;

  constructor(private readonly options: PostgresTenantBackupOptions) {
    this.adminUrl = parsePostgresUrl(options.adminDatabaseUrl);
    this.locator = new TenantDatabaseLocator(options.adminDatabaseUrl);
    this.storageRoot = assertExternalStorageRoot(
      options.storageRoot,
      options.repositoryRoot ?? process.cwd(),
    );
    this.postgresBinDirectory = options.postgresBinDirectory
      ? assertAbsoluteDirectory(options.postgresBinDirectory)
      : undefined;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    if (!Number.isInteger(this.timeoutMs) || this.timeoutMs < 1_000 || this.timeoutMs > 600_000) {
      throw new TenantBackupError("BACKUP_TIMEOUT_INVALID");
    }
    this.runner = options.runner ?? new ExecFilePostgresProcessRunner();
    this.now = options.now ?? (() => new Date().toISOString());
    this.idFactory = options.idFactory ?? (() => `backup_${Date.now().toString(36)}_${randomUUID().replace(/-/g, "").slice(0, 12)}`);
  }

  async createBackup(binding: TenantBackupBinding, requestId: string): Promise<TenantBackupMetadata> {
    validateBinding(binding);
    validateRequestId(requestId);
    const id = this.idFactory();
    validateBackupId(id);
    const paths = await this.pathsFor(binding.tenantInstanceId, id);
    const migrationVersion = await this.currentMigrationVersion(binding.databaseRefId);
    let metadata: TenantBackupMetadata = {
      id,
      tenantInstanceId: binding.tenantInstanceId,
      databaseRefId: binding.databaseRefId,
      createdAt: this.now(),
      migrationVersion,
      status: "pending",
      verificationStatus: "not_started",
      artifactFileName: path.basename(paths.artifact),
    };
    await this.writeMetadata(paths.metadata, metadata);

    try {
      await this.audit("tenant.backup.create", binding, id, requestId, "started");
      await this.runTool("pg_dump", [
        "--format=custom",
        "--no-owner",
        "--no-privileges",
        "--file",
        paths.partial,
      ], tenantDatabaseNameForRef(binding.databaseRefId));
      await assertArtifactDoesNotContainSecrets(paths.partial, [
        this.options.adminDatabaseUrl,
        decodeURIComponent(this.adminUrl.password),
      ]);
      await rename(paths.partial, paths.artifact);
      const artifactStat = await stat(paths.artifact);
      metadata = {
        ...metadata,
        checksumSha256: await sha256File(paths.artifact),
        sizeBytes: artifactStat.size,
        status: "completed",
      };
      await this.writeMetadata(paths.metadata, metadata);
      await this.audit("tenant.backup.create", binding, id, requestId, "succeeded");
      return metadata;
    } catch (error) {
      const failureCode = safeTenantBackupError(error).code;
      await rm(paths.partial, { force: true }).catch(() => undefined);
      await rm(paths.artifact, { force: true }).catch(() => undefined);
      metadata = { ...metadata, status: "failed", failureCode };
      await this.writeMetadata(paths.metadata, metadata).catch(() => undefined);
      await this.audit("tenant.backup.create", binding, id, requestId, "failed", failureCode).catch(() => undefined);
      throw new TenantBackupError(failureCode);
    }
  }

  async getStatus(binding: TenantBackupBinding, backupId: string): Promise<TenantBackupMetadata> {
    validateBinding(binding);
    validateBackupId(backupId);
    const metadata = await this.readMetadata(binding.tenantInstanceId, backupId);
    assertBackupMatchesTenant(metadata, binding.tenantInstanceId, binding.databaseRefId);
    return metadata;
  }

  async verifyBackup(
    binding: TenantBackupBinding,
    backupId: string,
    requestId: string,
  ): Promise<TenantBackupMetadata> {
    return this.verifyWithTemporaryDatabase(binding, backupId, requestId, "tenant.backup.verify");
  }

  async createRestorePlan(
    binding: TenantBackupBinding,
    backupId: string,
    requestId: string,
  ): Promise<TenantRestorePlan> {
    validateRequestId(requestId);
    const metadata = await this.getStatus(binding, backupId);
    const plan = createTenantRestorePlan(metadata, requestId, this.now());
    await this.audit("tenant.restore.plan", binding, backupId, requestId, "succeeded");
    return plan;
  }

  async verifyRestorePlan(
    binding: TenantBackupBinding,
    backupId: string,
    requestId: string,
  ): Promise<TenantBackupMetadata> {
    return this.verifyWithTemporaryDatabase(binding, backupId, requestId, "tenant.restore.verify");
  }

  private async verifyWithTemporaryDatabase(
    binding: TenantBackupBinding,
    backupId: string,
    requestId: string,
    action: TenantBackupAuditEvent["action"],
  ): Promise<TenantBackupMetadata> {
    validateRequestId(requestId);
    let metadata = await this.getStatus(binding, backupId);
    if (metadata.status !== "completed" && metadata.status !== "verified") {
      throw new TenantBackupError("BACKUP_NOT_VERIFIABLE");
    }
    const paths = await this.pathsFor(binding.tenantInstanceId, backupId);
    await this.audit(action, binding, backupId, requestId, "started");
    metadata = { ...metadata, verificationStatus: "running", failureCode: undefined };
    await this.writeMetadata(paths.metadata, metadata);
    const verificationDatabase = verificationDatabaseName(metadata, requestId);
    let verificationDatabaseCreated = false;

    try {
      const artifactStat = await stat(paths.artifact);
      if (artifactStat.size !== metadata.sizeBytes) throw new TenantBackupError("BACKUP_SIZE_MISMATCH");
      if (await sha256File(paths.artifact) !== metadata.checksumSha256) {
        throw new TenantBackupError("BACKUP_CHECKSUM_MISMATCH");
      }
      await this.createVerificationDatabase(verificationDatabase);
      verificationDatabaseCreated = true;
      await this.runTool("pg_restore", [
        "--exit-on-error",
        "--no-owner",
        "--no-privileges",
        "--dbname",
        verificationDatabase,
        paths.artifact,
      ], verificationDatabase);
      await this.assertRestoredTenant(binding, metadata, verificationDatabase);
      metadata = {
        ...metadata,
        status: "verified",
        verificationStatus: "verified",
        verifiedAt: this.now(),
        failureCode: undefined,
      };
      await this.writeMetadata(paths.metadata, metadata);
      await this.audit(action, binding, backupId, requestId, "succeeded");
      return metadata;
    } catch (error) {
      const failureCode = safeTenantBackupError(error).code;
      metadata = { ...metadata, verificationStatus: "failed", failureCode };
      await this.writeMetadata(paths.metadata, metadata).catch(() => undefined);
      await this.audit(action, binding, backupId, requestId, "failed", failureCode).catch(() => undefined);
      throw new TenantBackupError(failureCode);
    } finally {
      if (verificationDatabaseCreated) {
        await this.dropVerificationDatabase(verificationDatabase).catch(() => undefined);
      }
    }
  }

  private async currentMigrationVersion(databaseRefId: TenantDatabaseRefId): Promise<string> {
    const tenant = this.tenantClient(databaseRefId);
    try {
      const rows = await tenant.$queryRawUnsafe<Array<{ migration_name: string }>>(
        `SELECT migration_name FROM "_prisma_migrations"
         WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
         ORDER BY finished_at DESC, migration_name DESC LIMIT 1`,
      );
      if (!rows[0]?.migration_name) throw new TenantBackupError("BACKUP_MIGRATION_VERSION_MISSING");
      return rows[0].migration_name;
    } catch (error) {
      throw asBackupError(error, "BACKUP_MIGRATION_VERSION_FAILED");
    } finally {
      await tenant.$disconnect().catch(() => undefined);
    }
  }

  private async assertRestoredTenant(
    binding: TenantBackupBinding,
    metadata: TenantBackupMetadata,
    databaseName: string,
  ): Promise<void> {
    const client = new PrismaClient({ datasources: { db: { url: this.databaseUrl(databaseName) } } });
    try {
      const marker = await client.$queryRawUnsafe<Array<{ tenantInstanceId: string; databaseRefId: string }>>(
        `SELECT "tenantInstanceId", "databaseRefId" FROM "TenantProvisioningMarker" WHERE "id" = 'tenant'`,
      );
      if (
        marker[0]?.tenantInstanceId !== binding.tenantInstanceId ||
        marker[0]?.databaseRefId !== binding.databaseRefId
      ) {
        throw new TenantBackupError("BACKUP_RESTORED_TENANT_MISMATCH");
      }
      const migrations = await client.$queryRawUnsafe<Array<{ migration_name: string }>>(
        `SELECT migration_name FROM "_prisma_migrations"
         WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
         ORDER BY finished_at DESC, migration_name DESC LIMIT 1`,
      );
      if (migrations[0]?.migration_name !== metadata.migrationVersion) {
        throw new TenantBackupError("BACKUP_MIGRATION_VERSION_MISMATCH");
      }
      const tables = await client.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT count(*)::bigint AS count FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name IN ('Season', 'Customer', 'TenantProvisioningMarker')`,
      );
      if (Number(tables[0]?.count ?? 0) !== 3) throw new TenantBackupError("BACKUP_SCHEMA_VERIFY_FAILED");
    } catch (error) {
      throw asBackupError(error, "BACKUP_RESTORE_VERIFY_FAILED");
    } finally {
      await client.$disconnect().catch(() => undefined);
    }
  }

  private async createVerificationDatabase(databaseName: string): Promise<void> {
    const admin = this.adminClient();
    try {
      await admin.$executeRawUnsafe(`CREATE DATABASE ${quotePostgresIdentifier(databaseName)}`);
    } catch (error) {
      throw asBackupError(error, "BACKUP_VERIFY_DATABASE_CREATE_FAILED");
    } finally {
      await admin.$disconnect().catch(() => undefined);
    }
  }

  private async dropVerificationDatabase(databaseName: string): Promise<void> {
    const admin = this.adminClient();
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

  private adminClient(): PrismaClient {
    return new PrismaClient({ datasources: { db: { url: this.locator.adminConnectionUrl() } } });
  }

  private tenantClient(databaseRefId: TenantDatabaseRefId): PrismaClient {
    return new PrismaClient({ datasources: { db: { url: this.locator.tenantConnectionUrl(databaseRefId) } } });
  }

  private databaseUrl(databaseName: string): string {
    const url = new URL(this.adminUrl);
    url.pathname = `/${databaseName}`;
    url.searchParams.delete("schema");
    return url.toString();
  }

  private async runTool(tool: "pg_dump" | "pg_restore", args: readonly string[], databaseName: string): Promise<void> {
    const command = this.postgresBinDirectory
      ? path.join(this.postgresBinDirectory, process.platform === "win32" ? `${tool}.exe` : tool)
      : tool;
    if (this.postgresBinDirectory) await access(command);
    const env = postgresProcessEnvironment(this.adminUrl, databaseName, this.timeoutMs);
    try {
      await this.runner.run({ command, args, env, timeoutMs: this.timeoutMs });
    } catch (error) {
      throw asBackupError(error, tool === "pg_dump" ? "BACKUP_DUMP_FAILED" : "BACKUP_RESTORE_FAILED");
    }
  }

  private async pathsFor(tenantInstanceId: TenantInstanceId, backupId: string) {
    validateIdentifier(tenantInstanceId, "BACKUP_TENANT_IDENTIFIER_INVALID");
    validateBackupId(backupId);
    const directory = path.join(this.storageRoot, tenantInstanceId);
    await mkdir(directory, { recursive: true });
    return {
      artifact: path.join(directory, `${backupId}.dump`),
      partial: path.join(directory, `${backupId}.dump.partial`),
      metadata: path.join(directory, `${backupId}.json`),
    };
  }

  private async readMetadata(tenantInstanceId: TenantInstanceId, backupId: string): Promise<TenantBackupMetadata> {
    const paths = await this.pathsFor(tenantInstanceId, backupId);
    try {
      const value = JSON.parse(await readFile(paths.metadata, "utf8")) as TenantBackupMetadata;
      validateStoredMetadata(value);
      return value;
    } catch (error) {
      throw asBackupError(error, "BACKUP_METADATA_NOT_FOUND");
    }
  }

  private async writeMetadata(filePath: string, metadata: TenantBackupMetadata): Promise<void> {
    validateStoredMetadata(metadata);
    const temporary = `${filePath}.${randomUUID().replace(/-/g, "")}.tmp`;
    try {
      await writeFile(temporary, `${JSON.stringify(metadata, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
      await rename(temporary, filePath);
    } finally {
      await rm(temporary, { force: true }).catch(() => undefined);
    }
  }

  private async audit(
    action: TenantBackupAuditEvent["action"],
    binding: TenantBackupBinding,
    backupId: string,
    requestId: string,
    result: TenantBackupAuditEvent["result"],
    failureCode?: string,
  ): Promise<void> {
    await this.options.audit.record({
      action,
      tenantInstanceId: binding.tenantInstanceId,
      backupId,
      requestId,
      result,
      occurredAt: this.now(),
      failureCode,
    });
  }
}

export class TenantBackupError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "TenantBackupError";
  }
}

export function safeTenantBackupError(error: unknown): { code: string } {
  if (error instanceof TenantBackupError) return { code: error.code };
  if (error instanceof Error) {
    const candidate = error.message.split(":", 1)[0];
    if (/^[A-Z][A-Z0-9_]{2,100}$/.test(candidate)) return { code: candidate };
  }
  return { code: "TENANT_BACKUP_FAILURE" };
}

function postgresProcessEnvironment(url: URL, databaseName: string, timeoutMs: number): NodeJS.ProcessEnv {
  return {
    ...process.env,
    PGHOST: url.hostname,
    PGPORT: url.port || "5432",
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGDATABASE: databaseName,
    PGCONNECT_TIMEOUT: String(Math.max(1, Math.ceil(timeoutMs / 1_000))),
    PGAPPNAME: "tilbecore-tenant-backup",
    PGSSLMODE: url.searchParams.get("sslmode") ?? process.env.PGSSLMODE,
  };
}

function verificationDatabaseName(metadata: TenantBackupMetadata, requestId: string): string {
  const digest = createHash("sha256")
    .update(`${metadata.tenantInstanceId}:${metadata.databaseRefId}:${metadata.id}:${requestId}:${randomUUID()}`)
    .digest("hex")
    .slice(0, 32);
  return `tc_verify_${digest}`;
}

async function sha256File(filePath: string): Promise<string> {
  const hash = createHash("sha256");
  await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", resolve);
  });
  return hash.digest("hex");
}

async function assertArtifactDoesNotContainSecrets(filePath: string, candidates: readonly string[]): Promise<void> {
  const needles = candidates.filter((value) => value.length >= 4).map((value) => Buffer.from(value, "utf8"));
  if (needles.length === 0) return;
  const maxNeedle = Math.max(...needles.map((needle) => needle.length));
  let tail = Buffer.alloc(0);
  await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => {
      const buffer = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
      const combined = Buffer.concat([tail, buffer]);
      if (needles.some((needle) => combined.includes(needle))) {
        stream.destroy(new TenantBackupError("BACKUP_ARTIFACT_SECRET_DETECTED"));
        return;
      }
      tail = combined.subarray(Math.max(0, combined.length - maxNeedle + 1));
    });
    stream.on("error", reject);
    stream.on("end", resolve);
  });
}

function validateBinding(binding: TenantBackupBinding): void {
  validateIdentifier(binding.tenantInstanceId, "BACKUP_TENANT_IDENTIFIER_INVALID");
  tenantDatabaseNameForRef(binding.databaseRefId);
}

function validateStoredMetadata(metadata: TenantBackupMetadata): void {
  validateBackupId(metadata.id);
  validateBinding(metadata);
  if (!/^[0-9]{4}_[a-z0-9_]{3,100}$/.test(metadata.migrationVersion)) {
    throw new TenantBackupError("BACKUP_MIGRATION_VERSION_INVALID");
  }
  if (!/^[a-zA-Z0-9_.-]+\.dump$/.test(metadata.artifactFileName)) {
    throw new TenantBackupError("BACKUP_ARTIFACT_NAME_INVALID");
  }
  if (metadata.checksumSha256 && !/^[a-f0-9]{64}$/.test(metadata.checksumSha256)) {
    throw new TenantBackupError("BACKUP_CHECKSUM_INVALID");
  }
}

function validateIdentifier(value: string, code: string): void {
  if (!/^[a-zA-Z0-9_-]{3,100}$/.test(value)) throw new TenantBackupError(code);
}

function validateBackupId(value: string): void {
  if (!/^backup_[a-z0-9_]{8,80}$/.test(value)) throw new TenantBackupError("BACKUP_ID_INVALID");
}

function validateRequestId(value: string): void {
  if (!/^[a-zA-Z0-9._:-]{8,128}$/.test(value)) throw new TenantBackupError("BACKUP_REQUEST_ID_INVALID");
}

function assertExternalStorageRoot(storageRoot: string, repositoryRoot: string): string {
  const resolvedStorage = path.resolve(storageRoot);
  const resolvedRepository = path.resolve(repositoryRoot);
  if (!path.isAbsolute(storageRoot) || isSameOrChildPath(resolvedStorage, resolvedRepository)) {
    throw new TenantBackupError("TENANT_BACKUP_ROOT_MUST_BE_OUTSIDE_REPOSITORY");
  }
  return resolvedStorage;
}

function assertAbsoluteDirectory(directory: string): string {
  if (!path.isAbsolute(directory)) throw new TenantBackupError("POSTGRES_BIN_DIRECTORY_INVALID");
  return path.resolve(directory);
}

function isSameOrChildPath(candidate: string, parent: string): boolean {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function parsePostgresUrl(value: string): URL {
  try {
    const url = new URL(value);
    if ((url.protocol !== "postgresql:" && url.protocol !== "postgres:") || !url.hostname || !url.pathname) {
      throw new Error();
    }
    return url;
  } catch {
    throw new TenantBackupError("TENANT_DATABASE_ADMIN_URL_INVALID");
  }
}

function asBackupError(error: unknown, fallback: string): TenantBackupError {
  return error instanceof TenantBackupError ? error : new TenantBackupError(fallback);
}
