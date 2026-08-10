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

interface PackageManifest {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
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

function listTrackedPackageManifests(...roots: string[]) {
  const output = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", ...roots], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  return output
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((file) => file.endsWith("package.json"))
    .filter((file) => !file.split(/[\\/]/).some((part) => ignoredSegments.has(part)));
}

function manifestDependencies(file: string) {
  const manifest = JSON.parse(readFileSync(join(repoRoot, file), "utf8")) as PackageManifest;
  const dependencyGroups = [
    manifest.dependencies ?? {},
    manifest.devDependencies ?? {},
    manifest.peerDependencies ?? {},
    manifest.optionalDependencies ?? {},
  ];

  return dependencyGroups.flatMap((dependencies) => Object.keys(dependencies));
}

describe("Faz 2A mimari bağımlılık sınırları", () => {
  it("workspace gerçek sözleşme paketlerini kapsar", () => {
    const workspace = readFileSync(join(repoRoot, "pnpm-workspace.yaml"), "utf8");

    expect(workspace).toContain("packages:");
    expect(workspace).toContain('"packages/*"');
  });

  it("workspace paket manifestleri uygulama frameworklerine veya veritabanına bağlanmaz", () => {
    const manifests = listTrackedPackageManifests("packages");
    const forbiddenDependencies = [
      "next",
      "react",
      "react-dom",
      "@prisma/client",
      "prisma",
      "@/app",
      "@/modules",
      "@/shared",
      "@/components",
    ];

    expect(manifests.length).toBeGreaterThan(0);
    expect(
      manifests.flatMap((file) =>
        manifestDependencies(file)
          .filter((dependency) => forbiddenDependencies.includes(dependency))
          .map((dependency) => ({ file, dependency })),
      ),
    ).toEqual([]);
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

  it("packages/config yalnız contracts ve standart TypeScript'e bağımlıdır", () => {
    const files = listTrackedSourceFiles("packages/config");

    expect(files.length).toBeGreaterThan(0);
    expect(
      violations(files, [
        /from\s+["']next(\/|["'])/,
        /from\s+["']react["']/,
        /from\s+["']@prisma\/client["']/,
        /from\s+["']@\/(app|modules|shared|components)(\/|["'])/,
        /from\s+["']@\/packages\/(?!contracts)([^"']+)/,
      ]),
    ).toEqual([]);
  });

  it("packages/platform framework, Prisma ve tenant uygulama katmanlarına bağımlı değildir", () => {
    const files = listTrackedSourceFiles("packages/platform");

    expect(files.length).toBeGreaterThan(0);
    expect(
      violations(files, [
        /from\s+["']next(\/|["'])/,
        /from\s+["']react["']/,
        /from\s+["']@prisma\/client["']/,
        /from\s+["']@\/(app|modules|shared|components)(\/|["'])/,
        /from\s+["'](\.\.\/)+database-platform(\/|["'])/,
      ]),
    ).toEqual([]);
  });

  it("packages/database-platform tenant uygulamasına ve framework katmanlarına ters bağımlılık oluşturmaz", () => {
    const files = listTrackedSourceFiles("packages/database-platform");

    expect(files.length).toBeGreaterThan(0);
    expect(
      violations(files, [
        /from\s+["']next(\/|["'])/,
        /from\s+["']react["']/,
        /from\s+["']@\/(app|modules|shared|components)(\/|["'])/,
      ]),
    ).toEqual([]);
  });

  it("tenant uygulama kodu platform database paketine doğrudan bağlanmaz", () => {
    const files = listTrackedSourceFiles("app", "modules", "shared", "components");

    expect(
      violations(files, [
        /from\s+["']@tilbecore\/database-platform(\/|["'])/,
        /from\s+["'](\.\.\/)+packages\/database-platform(\/|["'])/,
      ]),
    ).toEqual([]);
  });

  it("uygulama katmanları paketlerin yalnız public export yüzeyini kullanır", () => {
    const files = listTrackedSourceFiles("app", "modules", "shared", "components", "tests");

    expect(
      violations(files, [
        /from\s+["']@tilbecore\/[^"']+\/src(\/|["'])/,
        /from\s+["'](\.\.\/)+packages\/[^"']+\/src(\/|["'])/,
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
