import { spawn } from "node:child_process";

const kind = process.env.WORKER_KIND;
const intervalMs = Number(process.env.WORKER_INTERVAL_MS ?? "5000");
if (!(["provisioning", "tenant-ops"].includes(kind ?? "")) || !Number.isSafeInteger(intervalMs) || intervalMs < 1000) {
  throw new Error("STAGING_WORKER_CONFIG_INVALID");
}

let stopping = false;
let child;
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    stopping = true;
    child?.kill(signal);
  });
}

while (!stopping) {
  const script = kind === "provisioning" ? "provisioning:worker" : "tenant:ops:worker";
  const exitCode = await runPnpm(script);
  if (exitCode !== 0) process.stderr.write(`${JSON.stringify({ code: "STAGING_WORKER_ITERATION_FAILED", kind, exitCode })}\n`);
  if (!stopping) await delay(intervalMs);
}

function runPnpm(script) {
  return new Promise((resolve) => {
    child = spawn(process.platform === "win32" ? "pnpm.cmd" : "pnpm", [script], { stdio: "inherit", shell: false });
    child.once("exit", (code) => { child = undefined; resolve(code ?? 1); });
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
