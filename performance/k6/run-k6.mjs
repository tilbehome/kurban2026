import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "../..");
const script = resolve(import.meta.dirname, "tilbecore-staging.js");
const baseUrl = process.env.K6_BASE_URL;
if (!baseUrl) throw new Error("K6_BASE_URL_REQUIRED");
assertSafeTarget(baseUrl);
if (process.env.K6_TENANT_B_URL) assertSafeTarget(process.env.K6_TENANT_B_URL);
mkdirSync(resolve(root, "artifacts/k6"), { recursive: true });

const k6Command = resolveK6Command();
const local = spawnSync(k6Command, ["version"], { cwd: root, stdio: "ignore", shell: false });
let result;
if (!local.error && local.status === 0) {
  result = spawnSync(k6Command, ["run", script], { cwd: root, stdio: "inherit", shell: false, env: process.env });
} else {
  const docker = spawnSync("docker", ["version"], { cwd: root, stdio: "ignore", shell: false });
  if (docker.error || docker.status !== 0) throw new Error("K6_OR_DOCKER_REQUIRED");
  result = spawnSync("docker", ["run", "--rm", "--network", "host", "-v", `${root}:/workspace`, "-w", "/workspace", ...environmentArgs(), "grafana/k6:2.2.0", "run", "/workspace/performance/k6/tilbecore-staging.js"], { cwd: root, stdio: "inherit", shell: false });
}

function resolveK6Command() {
  if (process.env.K6_BIN) return process.env.K6_BIN;
  const windowsDefault = "C:\\Program Files\\k6\\k6.exe";
  if (process.platform === "win32" && existsSync(windowsDefault)) return windowsDefault;
  return "k6";
}
process.exitCode = result.status ?? 1;

function assertSafeTarget(value) {
  const url = new URL(value);
  const staging = url.hostname === "staging.tilbecore.com" || url.hostname.endsWith(".staging.tilbecore.com");
  const localTarget = url.hostname === "tilbecore.test" || url.hostname.endsWith(".tilbecore.test");
  if (url.protocol !== "https:" || (!staging && !localTarget)) throw new Error("K6_PRODUCTION_OR_UNSAFE_TARGET_FORBIDDEN");
}

function environmentArgs() {
  return Object.entries(process.env)
    .filter(([key]) => key.startsWith("K6_"))
    .flatMap(([key, value]) => ["-e", `${key}=${value}`]);
}
