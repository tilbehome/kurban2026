#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const EXCLUDED_DIRS = new Set([
  ".git",
  ".next",
  "node_modules",
  "dist",
  "coverage",
  "backups",
  "data",
  "public/uploads",
]);

const EXCLUDED_FILES = new Set([
  "public/sw.js",
  "public/workbox-*.js",
  "public/sw-version.json",
]);

const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".css",
  ".scss",
  ".html",
  ".sql",
  ".prisma",
  ".bat",
  ".ps1",
  ".yml",
  ".yaml",
  ".toml",
]);

const MOJIBAKE_PATTERNS = [
  new RegExp("\\u00c3\\u0192", "u"),
  new RegExp("\\u00c3\\u201a", "u"),
  new RegExp("\\u00c3\\u201e", "u"),
  new RegExp("\\u00c3\\u2026", "u"),
  new RegExp("\\u00c3\\u00af\\u00c2\\u00bf\\u00c2\\u00bd", "u"),
  new RegExp("\\ufffd", "u"),
  new RegExp("Sat\\u00c3", "u"),
  new RegExp("\\u00c4\\u00b1\\u00c5", "u"),
  new RegExp("i\\u00c5", "u"),
];

function slash(p) {
  return p.split(path.sep).join("/");
}

function excluded(relativePath) {
  const normalized = slash(relativePath);
  if (normalized.split("/").some((segment) => [".next", "node_modules", "dist", "coverage"].includes(segment))) {
    return true;
  }
  for (const dir of EXCLUDED_DIRS) {
    if (normalized === dir || normalized.startsWith(`${dir}/`)) return true;
  }
  for (const file of EXCLUDED_FILES) {
    if (file.includes("*")) {
      const [prefix, suffix] = file.split("*");
      if (normalized.startsWith(prefix) && normalized.endsWith(suffix)) return true;
    } else if (normalized === file) {
      return true;
    }
  }
  return false;
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full);
    if (excluded(rel)) continue;
    if (entry.isDirectory()) {
      walk(full, files);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!TEXT_EXTENSIONS.has(path.extname(entry.name))) continue;
    files.push(full);
  }
  return files;
}

const findings = [];
for (const file of walk(ROOT)) {
  const rel = slash(path.relative(ROOT, file));
  const buffer = fs.readFileSync(file);
  const text = buffer.toString("utf8");
  if (text.includes("\uFFFD")) {
    findings.push({ file: rel, pattern: "U+FFFD replacement character" });
    continue;
  }
  for (const pattern of MOJIBAKE_PATTERNS) {
    if (pattern.test(text)) {
      findings.push({ file: rel, pattern: String(pattern) });
      break;
    }
  }
}

if (findings.length > 0) {
  console.error("UTF-8/mojibake kontrolü başarısız:");
  for (const f of findings) {
    console.error(`- ${f.file}: ${f.pattern}`);
  }
  process.exit(1);
}

console.log("UTF-8/mojibake kontrolü temiz.");
