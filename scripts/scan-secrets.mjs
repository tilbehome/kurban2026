import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const candidates = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], {
  cwd: root,
  encoding: "utf8",
}).split("\0").filter(Boolean);

const textExtensions = new Set([
  "", ".cjs", ".css", ".env", ".example", ".html", ".js", ".json", ".jsx", ".md", ".mjs",
  ".prisma", ".sh", ".sql", ".ts", ".tsx", ".txt", ".yaml", ".yml",
]);
const highConfidenceRules = [
  ["PRIVATE_KEY", new RegExp(["-----BEGIN ", "PRIVATE KEY-----"].join(""), "g")],
  ["GITHUB_TOKEN", /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b/g],
  ["GITHUB_FINE_GRAINED_TOKEN", /\bgithub_pat_[A-Za-z0-9_]{60,}\b/g],
  ["AWS_ACCESS_KEY", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ["SLACK_TOKEN", /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g],
  ["OPENAI_TOKEN", /\bsk-[A-Za-z0-9_-]{40,}\b/g],
];
const findings = [];

for (const relativePath of candidates) {
  if (!textExtensions.has(extname(relativePath).toLowerCase())) continue;
  const content = await readFile(resolve(root, relativePath), "utf8").catch(() => undefined);
  if (content === undefined || content.includes("\0")) continue;
  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const [rule, pattern] of highConfidenceRules) {
      pattern.lastIndex = 0;
      if (pattern.test(line)) findings.push({ file: relativePath, line: index + 1, rule });
    }
    const assignment = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|PRIVATE_KEY)[A-Z0-9_]*)\s*=\s*["']?([^"'#\s]{16,})/);
    if (assignment && !isSafePlaceholder(assignment[2])) findings.push({ file: relativePath, line: index + 1, rule: "LITERAL_SECRET_ASSIGNMENT" });
  });
}

if (findings.length > 0) {
  for (const finding of findings) process.stderr.write(`${finding.file}:${finding.line}:${finding.rule}\n`);
  throw new Error(`SECRET_SCAN_FAILED:${findings.length}`);
}
process.stdout.write(`${JSON.stringify({ ok: true, code: "SECRET_SCAN_PASSED", scannedFiles: candidates.length })}\n`);

function isSafePlaceholder(value) {
  const normalized = value.toLowerCase();
  return normalized.includes("${") || /(?:example|placeholder|change|synthetic|test|build[_-]?only|ci[_-]?only|minimum)/.test(normalized);
}
