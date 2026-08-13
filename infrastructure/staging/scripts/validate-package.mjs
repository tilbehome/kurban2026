import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";

const root = resolve(import.meta.dirname, "../../..");
const stagingRoot = resolve(root, "infrastructure/staging");
const composePath = resolve(stagingRoot, "compose.yml");
const compose = parse(await readFile(composePath, "utf8"));

const requiredServices = [
  "postgres-platform",
  "postgres-tenant-a",
  "postgres-tenant-b",
  "migrate-platform",
  "provision-tenant-a",
  "provision-tenant-b",
  "platform-admin",
  "tenant-web-a",
  "tenant-web-b",
  "provisioning-worker",
  "tenant-ops-worker-a",
  "tenant-ops-worker-b",
  "reverse-proxy",
  "otel-collector",
  "prometheus",
  "backup-tenant-a",
  "pitr-tenant-a",
];
const requiredSecrets = [
  "platform_db_password",
  "tenant_db_password",
  "platform_session_secret",
  "tenant_session_secret",
  "platform_mfa_encryption_key",
  "receipt_hmac_secret",
];

assert(compose?.name === "tilbecore-staging", "STAGING_COMPOSE_NAME_INVALID");
for (const service of requiredServices) assert(compose.services?.[service], `STAGING_SERVICE_MISSING:${service}`);
for (const secret of requiredSecrets) {
  assert(compose.secrets?.[secret]?.file === `./secrets/${secret}.txt`, `STAGING_SECRET_BINDING_INVALID:${secret}`);
  await access(resolve(stagingRoot, "secrets", `${secret}.example`), constants.R_OK);
}

assert(compose.networks?.data?.internal === true, "STAGING_DATA_NETWORK_MUST_BE_INTERNAL");
assert(compose.networks?.telemetry?.internal === true, "STAGING_TELEMETRY_NETWORK_MUST_BE_INTERNAL");
assert(compose.services?.["pitr-tenant-a"]?.profiles?.includes("pitr"), "STAGING_PITR_PROFILE_REQUIRED");
assert(compose.services?.["backup-tenant-a"]?.profiles?.includes("backup"), "STAGING_BACKUP_PROFILE_REQUIRED");
assert(compose.services?.["tenant-web-a"]?.environment?.TENANT_DB_HOST === "postgres-tenant-a", "TENANT_A_DATABASE_BINDING_INVALID");
assert(compose.services?.["tenant-web-b"]?.environment?.TENANT_DB_HOST === "postgres-tenant-b", "TENANT_B_DATABASE_BINDING_INVALID");

const caddy = await readFile(resolve(stagingRoot, "Caddyfile"), "utf8");
for (const host of ["staging.tilbecore.com", "console.staging.tilbecore.com", "demo.staging.tilbecore.com", "sentetik-b.staging.tilbecore.com"]) {
  assert(caddy.includes(host), `STAGING_PROXY_HOST_MISSING:${host}`);
}
assert(!/(^|\s)tilbecore\.com([\s,{:]|$)/m.test(caddy), "PRODUCTION_HOST_FORBIDDEN");
assert(/demo\.staging\.tilbecore\.com[\s\S]*?reverse_proxy tenant-web-a:3000/.test(caddy), "TENANT_A_PROXY_BINDING_INVALID");
assert(/sentetik-b\.staging\.tilbecore\.com[\s\S]*?reverse_proxy tenant-web-b:3000/.test(caddy), "TENANT_B_PROXY_BINDING_INVALID");

for (const relativePath of [
  "Dockerfile.tenant",
  "Dockerfile.platform",
  "postgres/Dockerfile",
  "otel-collector.yml",
  "prometheus.yml",
  "staging.env.example",
  "fixtures/tenant-a.json",
  "fixtures/tenant-b.json",
  "scripts/base-backup.sh",
  "scripts/pitr-prepare.sh",
  "scripts/preflight.mjs",
  "scripts/with-secrets.sh",
]) {
  await access(resolve(stagingRoot, relativePath), constants.R_OK);
}

process.stdout.write(`${JSON.stringify({ ok: true, code: "STAGING_PACKAGE_STATIC_VALIDATION_PASSED", productionWrite: false })}\n`);

function assert(condition, code) {
  if (!condition) throw new Error(code);
}
