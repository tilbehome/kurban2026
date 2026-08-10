import { describe, expect, it } from "vitest";
import { readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";
import { execFileSync } from "node:child_process";

const repoRoot = join(__dirname, "..");
const sourceExtensions = /\.(ts|tsx|mts)$/;
const ignoredSegments = new Set(["node_modules", ".next", "dist", "coverage"]);

interface ImportLine {
  file: string;
  line: string;
}

function listTrackedSourceFiles(...roots: string[]) {
  const output = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", ...roots], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  return output
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((file) => sourceExtensions.test(file))
    .filter((file) => !file.split(/[\\/]/).some((part) => ignoredSegments.has(part)));
}

function importLines(files: string[]): ImportLine[] {
  return files.flatMap((file) => {
    const absolutePath = join(repoRoot, file);
    if (!statSync(absolutePath).isFile()) return [];

    return readFileSync(absolutePath, "utf8")
      .split(/\r?\n/)
      .map((line) => ({ file: file.split(sep).join("/"), line: line.trim() }))
      .filter(({ line }) =>
        /^(import|export)\s+.*\s+from\s+["']/.test(line) ||
        /^import\s+["']/.test(line),
      );
  });
}

function violations(files: string[], forbidden: RegExp[]) {
  return importLines(files).filter(({ line }) =>
    forbidden.some((pattern) => pattern.test(line)),
  );
}

describe("Faz 2A mimari bağımlılık sınırları", () => {
  it("workspace gerçek sözleşme paketlerini kapsar", () => {
    const workspace = readFileSync(join(repoRoot, "pnpm-workspace.yaml"), "utf8");

    expect(workspace).toContain("packages:");
    expect(workspace).toContain('"packages/*"');
  });

  it("packages/contracts uygulama, UI, Next, React veya Prisma'ya bağımlı değildir", () => {
    const files = listTrackedSourceFiles("packages/contracts");

    expect(files.length).toBeGreaterThan(0);
    expect(
      violations(files, [
        /from\s+["']next(\/|["'])/,
        /from\s+["']react["']/,
        /from\s+["']@prisma\/client["']/,
        /from\s+["']@\/(app|modules|shared|components)(\/|["'])/,
      ]),
    ).toEqual([]);
  });

  it("domain katmanı Next, React, Prisma ve route adapterlerine bağımlı değildir", () => {
    const files = listTrackedSourceFiles("modules").filter((file) =>
      file.split(/[\\/]/).includes("domain"),
    );

    expect(
      violations(files, [
        /from\s+["']next(\/|["'])/,
        /from\s+["']react["']/,
        /from\s+["']@prisma\/client["']/,
        /from\s+["']@\/shared\/lib\/prisma["']/,
        /from\s+["']@\/app(\/|["'])/,
        /from\s+["']@\/components(\/|["'])/,
        /from\s+["']node:(fs|path|crypto)["']/,
      ]),
    ).toEqual([]);
  });

  it("application katmanı Next/React ve doğrudan Prisma client değeri import etmez", () => {
    const files = listTrackedSourceFiles("modules").filter((file) =>
      file.split(/[\\/]/).includes("application"),
    );

    expect(
      violations(files, [
        /from\s+["']next(\/|["'])/,
        /from\s+["']react["']/,
        /^import\s+(?!type\b).*from\s+["']@prisma\/client["']/,
        /from\s+["']@\/shared\/lib\/prisma["']/,
        /from\s+["']@\/app(\/|["'])/,
        /from\s+["']@\/components(\/|["'])/,
      ]),
    ).toEqual([]);
  });
});
