import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "../../..");
const stagingRoot = resolve(root, "infrastructure/staging");
const envFile = resolve(stagingRoot, process.argv[2] ?? "staging.env");
const env = parseEnv(await readFile(envFile, "utf8"));
const allowedDomains = ["staging.tilbecore.com", "tilbecore.test"];

if (required(env, "TILBECORE_ENV") !== "staging") fail("STAGING_ENVIRONMENT_REQUIRED");
for (const key of ["APP_VERSION", "TENANT_MIGRATION_VERSION"]) {
  if (!/^[A-Za-z0-9._-]+$/.test(required(env, key))) fail("STAGING_VERSION_METADATA_INVALID", key);
}

for (const key of ["STAGING_BASE_DOMAIN", "PLATFORM_HOST", "TENANT_A_HOST", "TENANT_B_HOST"]) {
  const value = required(env, key).toLowerCase();
  if (!allowedDomains.some((domain) => value === domain || value.endsWith(`.${domain}`))) fail("STAGING_DOMAIN_SCOPE_INVALID", key);
  if (value === "tilbecore.com" || (value.endsWith(".tilbecore.com") && !value.endsWith(".staging.tilbecore.com"))) fail("PRODUCTION_DOMAIN_FORBIDDEN", key);
}

for (const name of ["platform_db_password", "tenant_db_password", "platform_session_secret", "tenant_session_secret", "platform_mfa_encryption_key", "receipt_hmac_secret"]) {
  const path = resolve(stagingRoot, "secrets", `${name}.txt`);
  await access(path, constants.R_OK).catch(() => fail("STAGING_SECRET_FILE_REQUIRED", name));
  const value = (await readFile(path, "utf8")).trim();
  if (value.length < 32 || /change|example|password/i.test(value)) fail("STAGING_SECRET_WEAK_OR_PLACEHOLDER", name);
  if (name.endsWith("db_password") && !/^[A-Za-z0-9_-]+$/.test(value)) fail("STAGING_DB_PASSWORD_MUST_BE_URL_SAFE", name);
}

const compose = spawnSync("docker", ["compose", "--env-file", envFile, "-f", resolve(stagingRoot, "compose.yml"), "config", "--quiet"], { cwd: root, stdio: "inherit", shell: false });
if (compose.error?.code === "ENOENT") fail("DOCKER_NOT_AVAILABLE");
if (compose.status !== 0) fail("STAGING_COMPOSE_CONFIG_INVALID");
process.stdout.write(`${JSON.stringify({ ok: true, code: "STAGING_PREFLIGHT_PASSED", environment: env.TILBECORE_ENV, productionWrite: false })}\n`);

function parseEnv(text) {
  return Object.fromEntries(text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#")).map((line) => {
    const index = line.indexOf("=");
    if (index < 1) fail("STAGING_ENV_INVALID");
    return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")];
  }));
}
function required(envMap, key) { const value = envMap[key]; if (!value) fail("STAGING_ENV_REQUIRED", key); return value; }
function fail(code, detail) { throw new Error(detail ? `${code}:${detail}` : code); }
