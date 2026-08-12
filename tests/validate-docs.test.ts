import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { generateInventoryContent, githubSlug, inventoryPath, readDocuments, validateRepository } from "../scripts/validate-docs.mjs";

const roots: string[] = [];

function metadata(id: string, role = "fixture_document", reviewed = "2026-08-12") {
  return `\`\`\`yaml
id: ${id}
status: PLANNED
owner: Fixture
source_role: ${role}
source_of_truth: false
last_reviewed: ${reviewed}
verified_against_commit: not_applicable
\`\`\``;
}

function write(root: string, path: string, content: string) {
  const absolute = join(root, path);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, content, "utf8");
}

function refreshInventory(root: string) {
  write(root, inventoryPath, generateInventoryContent(readDocuments(root)));
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "tilbecore-docs-"));
  roots.push(root);
  execFileSync("git", ["init", "--quiet"], { cwd: root });
  execFileSync("git", ["config", "core.autocrlf", "false"], { cwd: root });
  write(root, "AGENTS.md", `# Agent\n\n${metadata("GOV-ROOT-001", "agent_policy")}\n`);
  write(root, "README.md", `# Repo\n\n${metadata("GOV-ROOT-002", "repository_entrypoint")}\n\n[Belge indeksi](docs/README.md)\n`);
  write(root, "docs/README.md", `# İndeks\n\n${metadata("GOV-002", "document_index")}\n\n[Envanter](governance/GOV-012-MARKDOWN-ENVANTERI-VE-TASNIF.md)\n\n[Örnek](sample.md)\n`);
  write(root, inventoryPath, `# Markdown Envanteri ve Tasnif Kararları\n\n${metadata("GOV-012", "inventory")}\n`);
  write(root, "docs/sample.md", `# Örnek Başlık\n\n${metadata("DOC-001")}\n`);
  refreshInventory(root);
  execFileSync("git", ["add", "."], { cwd: root });
  expect(validateRepository(root).errors).toEqual([]);
  return root;
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop()!, { recursive: true, force: true });
});

describe("dokümantasyon doğrulayıcı", () => {
  it("eksik kök metadata için fallback üretmez", () => {
    const root = fixture();
    write(root, "AGENTS.md", "# Agent\n");
    const result = validateRepository(root);
    expect(result.errors).toContain("eksik metadata id: AGENTS.md");
  });

  it("yanlış envanter ID ve durumunu yakalar", () => {
    const root = fixture();
    const path = join(root, inventoryPath);
    const content = readFileSync(path, "utf8").replace("| DOC-001 | Örnek Başlık | PLANNED |", "| WRONG-ID | Örnek Başlık | VERIFIED |");
    writeFileSync(path, content, "utf8");
    const result = validateRepository(root);
    expect(result.errors.some((error) => error.includes("envanter metadata uyumsuzluğu id: docs/sample.md"))).toBe(true);
    expect(result.errors.some((error) => error.includes("envanter metadata uyumsuzluğu status: docs/sample.md"))).toBe(true);
  });

  it("source_role değişip envanter yenilenmezse reddeder", () => {
    const root = fixture();
    write(root, "docs/sample.md", readFileSync(join(root, "docs/sample.md"), "utf8").replace("source_role: fixture_document", "source_role: changed_role"));
    const result = validateRepository(root);
    expect(result.errors).toContain("envanter metadata uyumsuzluğu source_role: docs/sample.md");
    expect(result.errors.some((error) => error.startsWith("güncel olmayan envanter"))).toBe(true);
  });

  it("yanlış kategori sayısını yakalar", () => {
    const root = fixture();
    const path = join(root, inventoryPath);
    const content = readFileSync(path, "utf8").replace("| governance | 2 |", "| governance | 99 |");
    writeFileSync(path, content, "utf8");
    expect(validateRepository(root).errors.some((error) => error.includes("yanlış kategori sayısı governance"))).toBe(true);
  });

  it("yetim aktif belgeyi yakalar", () => {
    const root = fixture();
    write(root, "docs/orphan.md", `# Yetim\n\n${metadata("DOC-ORPHAN")}\n`);
    refreshInventory(root);
    const result = validateRepository(root);
    expect(result.errors).toContain("yetim aktif belge: docs/orphan.md");
  });

  it("gerçek kökten erişilen aktif belgeyi yetim saymaz", () => {
    const root = fixture();
    write(root, "docs/reachable.md", `# Erişilen\n\n${metadata("DOC-REACHABLE")}\n`);
    write(root, "docs/README.md", `${readFileSync(join(root, "docs/README.md"), "utf8")}\n[Erişilen](reachable.md)\n`);
    refreshInventory(root);
    expect(validateRepository(root).errors).toEqual([]);
  });

  it("kırık reference-style bağlantıyı yakalar", () => {
    const root = fixture();
    write(root, "docs/sample.md", `# Örnek Başlık\n\n${metadata("DOC-001")}\n\n[Kırık][olmayan]\n`);
    refreshInventory(root);
    expect(validateRepository(root).errors).toContain("kırık reference-style bağlantı: docs/sample.md -> olmayan");
  });

  it("kırık anchor hedefini yakalar", () => {
    const root = fixture();
    write(root, "docs/sample.md", `# Örnek Başlık\n\n${metadata("DOC-001")}\n\n[Kırık](#olmayan-anchor)\n`);
    refreshInventory(root);
    expect(validateRepository(root).errors).toContain("kırık anchor: docs/sample.md -> #olmayan-anchor");
  });

  it("GitHub uyumlu locale-bağımsız anchor üretir", () => {
    const root = fixture();
    write(root, "docs/sample.md", `# Firma IAM\n\n${metadata("DOC-001")}\n\n[Başlık](#firma-iam)\n`);
    refreshInventory(root);
    expect(validateRepository(root).errors).toEqual([]);
  });

  it("GitHub Unicode anchor birleşim işaretlerini korur", () => {
    expect(githubSlug("İ")).toBe("i\u0307");
    expect(githubSlug("I İ ı i")).toBe("i-i\u0307-ı-i");
  });

  it("yüzde kodlu Unicode anchorı ve tekrarlanan başlık suffixini kabul eder", () => {
    const root = fixture();
    write(root, "docs/sample.md", `# İ\n\n${metadata("DOC-001")}\n\n[İlk](#i%CC%87)\n\n# İ\n\n[İkinci](#i%CC%87-1)\n`);
    refreshInventory(root);
    expect(validateRepository(root).errors).toEqual([]);
  });

  it("Unicode birleşim işareti eksik anchor hedefini reddeder", () => {
    const root = fixture();
    write(root, "docs/sample.md", `# İ\n\n${metadata("DOC-001")}\n\n[Yanlış](#i)\n`);
    refreshInventory(root);
    expect(validateRepository(root).errors).toContain("kırık anchor: docs/sample.md -> #i");
  });

  it("locale-bağımsız anchor için yanlış Türkçe küçük harf hedefini reddeder", () => {
    const root = fixture();
    write(root, "docs/sample.md", `# Firma IAM\n\n${metadata("DOC-001")}\n\n[Yanlış](#firma-ıam)\n`);
    refreshInventory(root);
    expect(validateRepository(root).errors).toContain("kırık anchor: docs/sample.md -> #firma-ıam");
  });

  it("dengeli parantezli inline hedefi ayrıştırır ve kırık hedefi reddeder", () => {
    const root = fixture();
    write(root, "docs/existing(x).md", `# Parantezli\n\n${metadata("DOC-PAREN")}\n`);
    write(root, "docs/sample.md", `# Örnek Başlık\n\n${metadata("DOC-001")}\n\n[Geçerli](existing(x).md)\n`);
    write(root, "docs/README.md", `${readFileSync(join(root, "docs/README.md"), "utf8")}\n[Parantezli](existing%28x%29.md)\n`);
    refreshInventory(root);
    expect(validateRepository(root).errors).toEqual([]);
    write(root, "docs/sample.md", readFileSync(join(root, "docs/sample.md"), "utf8").replace("existing(x).md", "missing(x).md"));
    expect(validateRepository(root).errors).toContain("kırık bağlantı: docs/sample.md -> missing(x).md");
  });

  it("dengesiz inline bağlantı adayını redakte edilmiş hatayla reddeder", () => {
    const root = fixture();
    write(root, "docs/sample.md", `# Örnek Başlık\n\n${metadata("DOC-001")}\n\n[Kırık](missing(x.md)\n`);
    refreshInventory(root);
    const errors = validateRepository(root).errors;
    expect(errors).toContain("dengesiz inline bağlantı: docs/sample.md (1 aday; hedef gösterilmedi)");
    expect(errors.join("\n")).not.toContain("missing(x.md");
  });

  it("geçerli inline ve reference-style bağlantıları korur", () => {
    const root = fixture();
    write(root, "docs/sample.md", `# Örnek Başlık\n\n${metadata("DOC-001")}\n\n[Inline](README.md)\n\n[Referans][indeks]\n\n[indeks]: README.md\n`);
    refreshInventory(root);
    expect(validateRepository(root).errors).toEqual([]);
  });

  it("hassas bilgi adayını değeri göstermeden yakalar", () => {
    const root = fixture();
    write(root, "config.ts", `export const token = "${"github_pat_" + "A".repeat(40)}";\n`);
    const result = validateRepository(root);
    const error = result.errors.find((item) => item.startsWith("hassas bilgi adayı: config.ts"));
    expect(error).toBeTruthy();
    expect(error).not.toContain("github_pat_");
  });

  it("tracked .env ve non-ignored .env.local tokenlarını yakalar", () => {
    const root = fixture();
    const token = "github_pat_" + "A".repeat(40);
    write(root, ".env", `TOKEN=${token}\n`);
    execFileSync("git", ["add", "-f", ".env"], { cwd: root });
    write(root, ".env.local", `TOKEN=${token}\n`);
    const result = validateRepository(root);
    expect(result.errors.some((error) => error.startsWith("hassas bilgi adayı: .env "))).toBe(true);
    expect(result.errors.some((error) => error.startsWith("hassas bilgi adayı: .env.local "))).toBe(true);
    expect(result.errors.join("\n")).not.toContain(token);
  });

  it("izin verilen fixture yanındaki tokenı yine yakalar", () => {
    const root = fixture();
    const token = "ghp_" + "A".repeat(40);
    const databaseFixture = "postgresql://user:" + "password@example.test/db";
    write(root, "packages/provisioning/tests/tenant-provisioning.test.ts", `const fixture = "${databaseFixture} ${token}";\n`);
    const result = validateRepository(root);
    expect(result.errors.some((error) => error.startsWith("hassas bilgi adayı: packages/provisioning/tests/tenant-provisioning.test.ts"))).toBe(true);
    expect(result.errors.join("\n")).not.toContain(token);
  });

  it("yalnız izin verilen sahte PostgreSQL fixture değerini kabul eder", () => {
    const root = fixture();
    const databaseFixture = "postgresql://user:" + "password@example.test/db";
    write(root, "packages/provisioning/tests/tenant-provisioning.test.ts", `const fixture = "${databaseFixture}";\n`);
    expect(validateRepository(root).errors).toEqual([]);
  });

  it("allowlist değerinin genişletilmiş credential biçimini kabul etmez", () => {
    const root = fixture();
    const extendedCredential = "postgresql://user:" + "tilbecore_test_password_extra@example.test/db";
    write(root, ".github/workflows/webpack.yml", `DATABASE_URL: ${extendedCredential}\n`);
    expect(validateRepository(root).errors.some((error) => error.startsWith("hassas bilgi adayı: .github/workflows/webpack.yml"))).toBe(true);
  });

  it("geçerli ISO takvim tarihini kabul eder", () => {
    const root = fixture();
    write(root, "docs/sample.md", `# Örnek Başlık\n\n${metadata("DOC-001", "fixture_document", "2024-02-29")}\n`);
    refreshInventory(root);
    expect(validateRepository(root).errors).toEqual([]);
  });

  it.each(["tomorrow", "not_applicable", "2026-02-30"])("aktif belgede geçersiz last_reviewed değerini reddeder: %s", (reviewed) => {
    const root = fixture();
    write(root, "docs/sample.md", `# Örnek Başlık\n\n${metadata("DOC-001", "fixture_document", reviewed)}\n`);
    refreshInventory(root);
    expect(validateRepository(root).errors).toContain(`geçersiz last_reviewed: docs/sample.md (${reviewed})`);
  });

  it("güncel olmayan envanteri yazmadan reddeder", () => {
    const root = fixture();
    write(root, "docs/sample.md", readFileSync(join(root, "docs/sample.md"), "utf8").replace("owner: Fixture", "owner: Changed"));
    const before = readFileSync(join(root, inventoryPath), "utf8");
    const result = validateRepository(root);
    expect(result.errors.some((error) => error.startsWith("güncel olmayan envanter"))).toBe(true);
    expect(readFileSync(join(root, inventoryPath), "utf8")).toBe(before);
  });
});
