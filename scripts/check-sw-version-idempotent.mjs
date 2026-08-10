import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const swVersionPath = path.join(process.cwd(), "public", "sw-version.json");

if (!fs.existsSync(swVersionPath)) {
  throw new Error("public/sw-version.json bulunamadı; önce pnpm build çalışmalıdır.");
}

const before = fs.readFileSync(swVersionPath, "utf8");
execFileSync(process.execPath, ["scripts/sw-version-gen.mjs"], {
  cwd: process.cwd(),
  stdio: "inherit",
});
const after = fs.readFileSync(swVersionPath, "utf8");

if (before !== after) {
  throw new Error("sw-version.json aynı service worker hash'iyle yeniden yazıldı.");
}

console.log("sw-version.json idempotency kontrolü temiz.");
