import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { generateInventoryContent, inventoryPath, readDocuments, validateRepository } from "../scripts/validate-docs.mjs";

const roots: string[] = [];

function metadata(id: string, role = "fixture_document") {
  return `\`\`\`yaml
id: ${id}
status: PLANNED
owner: Fixture
source_role: ${role}
source_of_truth: false
last_reviewed: 2026-08-12
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
  write(root, "AGENTS.md", `# Agent\n\n${metadata("GOV-ROOT-001", "agent_policy")}\n`);
  write(root, "README.md", `# Repo\n\n${metadata("GOV-ROOT-002", "repository_entrypoint")}\n\n[Belge indeksi](docs/README.md)\n`);
  write(root, "docs/README.md", `# İndeks\n\n${metadata("GOV-002", "document_index")}\n\n[Envanter](governance/GOV-012-MARKDOWN-ENVANTERI-VE-TASNIF.md)\n\n[Örnek](sample.md)\n`);
  write(root, inventoryPath, `# Markdown Envanteri ve Tasnif Kararları\n\n${metadata("GOV-012", "inventory")}\n`);
  write(root, "docs/sample.md", `# Örnek Başlık\n\n${metadata("DOC-001")}\n`);
  refreshInventory(root);
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
    const result = validateRepository(root);
    expect(result.errors).toContain("yetim aktif belge: docs/orphan.md");
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

  it("hassas bilgi adayını değeri göstermeden yakalar", () => {
    const root = fixture();
    write(root, "config.ts", `export const token = "${"github_pat_" + "A".repeat(40)}";\n`);
    const result = validateRepository(root);
    const error = result.errors.find((item) => item.startsWith("hassas bilgi adayı: config.ts"));
    expect(error).toBeTruthy();
    expect(error).not.toContain("github_pat_");
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
