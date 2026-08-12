import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, relative, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const inventoryPath = "docs/governance/GOV-012-MARKDOWN-ENVANTERI-VE-TASNIF.md";
const allowedStatuses = new Set([
  "VERIFIED",
  "IMPLEMENTED_UNVERIFIED",
  "IMPLEMENTING",
  "PLANNED",
  "NOT_RUN",
  "SUPERSEDED",
  "ARCHIVED",
]);
const ignoredDirectories = new Set([".git", ".next", "node_modules", "generated"]);
const categoryOrder = [
  "root-governance", "architecture", "adr", "governance", "product", "domains", "workflows",
  "personas", "ux", "accessibility", "i18n", "security", "privacy", "testing", "infrastructure",
  "operations", "reliability", "runbooks", "releases", "training", "evidence", "archive",
  "app-package-readme", "third-party-generated",
];

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) return [];
    const absolute = resolve(directory, entry.name);
    if (entry.isDirectory()) return walk(absolute);
    return extname(entry.name).toLowerCase() === ".md" ? [absolute] : [];
  });
}

function repoPath(absolute) {
  return relative(root, absolute).split(sep).join("/");
}

function metadata(content) {
  const block = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/) ?? content.match(/```yaml\s*\r?\n([\s\S]*?)\r?\n```/i);
  if (!block) return {};
  return Object.fromEntries(
    block[1]
      .split(/\r?\n/)
      .map((line) => line.match(/^([a-z_]+):\s*(.*?)\s*$/i))
      .filter(Boolean)
      .map((match) => [match[1], match[2].replace(/^['"]|['"]$/g, "")]),
  );
}

function category(path) {
  if (path === "AGENTS.md" || path === "README.md") return "root-governance";
  if (path === "docs/README.md") return "governance";
  if (/^(apps|packages)\/.+\/README\.md$/i.test(path)) return "app-package-readme";
  if (path.startsWith("docs/archive/")) return "archive";
  if (path.startsWith("docs/")) return path.split("/")[1] ?? "docs-root";
  return "third-party-generated";
}

function fallbackId(path, index) {
  if (path === "AGENTS.md") return "GOV-ROOT-001";
  if (path === "README.md") return "GOV-ROOT-002";
  if (path.startsWith("docs/archive/legacy/")) return `ARCH-LEGACY-${String(index + 1).padStart(3, "0")}`;
  if (path.startsWith("docs/archive/prompts/")) return `ARCH-PROMPT-${String(index + 1).padStart(3, "0")}`;
  if (path.startsWith("docs/archive/sprints/")) return `ARCH-SPRINT-${String(index + 1).padStart(3, "0")}`;
  return `DOC-${String(index + 1).padStart(3, "0")}`;
}

function masterSource(group) {
  const map = {
    architecture: "RMP-001 / TRK-001",
    adr: "RMP-001",
    governance: "GOV-001",
    product: "PRD-001 / RMP-001",
    domains: "RMP-001 / REQ-003",
    workflows: "RMP-001 / REQ-003",
    personas: "PRD-001 / RMP-001",
    ux: "PRD-001 / RMP-001",
    accessibility: "PRD-001 / RMP-001",
    i18n: "PRD-001 / RMP-001",
    security: "ADR-0002 / RMP-001",
    privacy: "ADR-0002 / RMP-001",
    testing: "TST-001",
    infrastructure: "RMP-001 / TST-001",
    operations: "RMP-001 / TST-001",
    reliability: "RMP-001 / TST-001",
    runbooks: "RMP-001 / TST-001",
    releases: "RMP-001 / TST-001",
    training: "RMP-001 / TST-001",
    evidence: "TST-001 / GOV-003",
    archive: "GOV-011",
    "root-governance": "GOV-001",
    "app-package-readme": "ilgili uygulama/paket",
    "third-party-generated": "yok",
  };
  return map[group] ?? "GOV-002";
}

function titleOf(content, path) {
  return content.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? path.split("/").at(-1);
}

function readDocuments() {
  const paths = walk(root).map(repoPath).sort((a, b) => a.localeCompare(b, "tr"));
  return paths.map((path, index) => {
    const content = readFileSync(resolve(root, path), "utf8");
    const meta = metadata(content);
    const group = category(path);
    const archived = group === "archive";
    const rootGovernance = group === "root-governance";
    return {
      path,
      content,
      meta,
      group,
      id: meta.id ?? fallbackId(path, index),
      title: titleOf(content, path),
      status: meta.status ?? (archived ? "ARCHIVED" : rootGovernance ? "VERIFIED" : "PLANNED"),
      sourceOfTruth: meta.source_of_truth ?? (path === "AGENTS.md" || path === "README.md" ? "true" : "false"),
      owner: meta.owner ?? (archived ? "Historical" : rootGovernance ? "Repository" : "Unassigned"),
      freshness: archived
        ? "tarihsel; güncellik uygulanmaz"
        : `${meta.last_reviewed ?? "eksik"}; ${meta.verified_against_commit ?? "eksik"}`,
    };
  });
}

function escapeCell(value) {
  return String(value).replaceAll("|", "\\|").replace(/\r?\n/g, " ");
}

function inventoryLink(path) {
  const target = path.startsWith("docs/") ? `../${path.slice(5)}` : `../../${path}`;
  return target.replaceAll("(", "%28").replaceAll(")", "%29").replaceAll(" ", "%20");
}

function writeInventory(documents) {
  const withoutInventory = documents.filter((document) => document.path !== inventoryPath);
  const inventory = {
    path: inventoryPath,
    id: "GOV-012",
    title: "Markdown Envanteri ve Tasnif Kararları",
    status: "VERIFIED",
    sourceOfTruth: "true",
    group: "governance",
    owner: "Architecture-and-Documentation",
    freshness: "2026-08-12; 74915b6f3f1f8d53116b760b6a6be9797111efa5",
  };
  const rows = [...withoutInventory, inventory].sort((a, b) => a.path.localeCompare(b.path, "tr"));
  const counts = new Map();
  for (const row of rows) counts.set(row.group, (counts.get(row.group) ?? 0) + 1);

  const lines = [
    "# Markdown Envanteri ve Tasnif Kararları",
    "",
    "```yaml",
    "id: GOV-012",
    "status: VERIFIED",
    "owner: Architecture-and-Documentation",
    "source_role: complete_markdown_inventory_and_classification",
    "source_of_truth: true",
    "last_reviewed: 2026-08-12",
    "verified_against_commit: 74915b6f3f1f8d53116b760b6a6be9797111efa5",
    "```",
    "",
    "Bu envanter `scripts/validate-docs.mjs --write-inventory` ile repo içindeki bütün Markdown dosyalarından üretilir. `node_modules`, `.next` ve `generated` dizinleri üçüncü taraf/üretilmiş içerik oldukları için tarama dışında tutulur. Envanterde bulunmak, bir hedefin uygulandığı anlamına gelmez; `status` ve kanıt kapsamı birlikte okunur.",
    "",
    "## Kategori özeti",
    "",
    "| Kategori | Belge sayısı |",
    "|---|---:|",
    ...categoryOrder.map((group) => `| ${group} | ${counts.get(group) ?? 0} |`),
    "",
    "## Belge envanteri",
    "",
    "| Yol | ID | Başlık | Durum | Ana kaynak | Kategori | Sahip | Güncellik | Bağlı ana kaynak | Aynı konu kaynağı | Karar |",
    "|---|---|---|---|---|---|---|---|---|---|---|",
  ];

  for (const row of rows) {
    const archived = row.group === "archive";
    const superseded = row.status === "SUPERSEDED";
    const related = row.id === masterSource(row.group) || row.id === "GOV-012" ? "yok" : masterSource(row.group);
    const decision = archived ? "arşivde tutulacak" : superseded ? "superseded; uyumluluk için tutulacak" : "tutulacak";
    lines.push(
      `| [${escapeCell(row.path)}](${inventoryLink(row.path)}) | ${escapeCell(row.id)} | ${escapeCell(row.title)} | ${escapeCell(row.status)} | ${escapeCell(row.sourceOfTruth)} | ${escapeCell(row.group)} | ${escapeCell(row.owner)} | ${escapeCell(row.freshness)} | ${escapeCell(masterSource(row.group))} | ${escapeCell(related)} | ${decision} |`,
    );
  }

  lines.push(
    "",
    "## Tasnif sonucu",
    "",
    "- Aktif belgeler kendi uzmanlık dizinlerinde tutulur ve `docs/README.md` üzerinden bu envantere bağlanır.",
    "- `ARC-010`, yeni `TST-001` ana planına yönlendiren `SUPERSEDED` uyumluluk belgesidir; silinmez.",
    "- `docs/archive` içerikleri tarihsel kayıttır, aktif karar kaynağı değildir ve `ARCHIVED` kabul edilir.",
    "- İnceleme birebir içerik kopyası göstermedikçe yalnız benzer başlık nedeniyle belge birleştirilmez veya silinmez.",
    "- Uygulama/paket README ve üçüncü taraf/üretilmiş Markdown kategorilerinde bu taramada kayıt yoksa kategori sayısı sıfırdır; üretilmiş dizinler kaynak belge sayılmaz.",
  );
  writeFileSync(resolve(root, inventoryPath), `${lines.join("\n")}\n`, "utf8");
}

function markdownLinks(document) {
  return [...document.content.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1].trim());
}

function normalizeForDuplicate(content) {
  return content.replace(/\r\n/g, "\n").trim();
}

function main() {
  let documents = readDocuments();
  if (process.argv.includes("--write-inventory")) {
    writeInventory(documents);
    documents = readDocuments();
  }

  const errors = [];
  const warnings = [];
  const active = documents.filter((document) => document.group !== "archive");
  for (const document of active) {
    if (!allowedStatuses.has(document.status)) errors.push(`geçersiz durum: ${document.path} (${document.status})`);
    if (document.group !== "root-governance") {
      for (const key of ["id", "status", "owner", "source_role", "source_of_truth", "last_reviewed", "verified_against_commit"]) {
        if (!document.meta[key]) errors.push(`eksik metadata ${key}: ${document.path}`);
      }
    }
  }

  const idMap = new Map();
  for (const document of active) {
    const paths = idMap.get(document.id) ?? [];
    paths.push(document.path);
    idMap.set(document.id, paths);
  }
  for (const [id, paths] of idMap) if (paths.length > 1) errors.push(`mükerrer ID ${id}: ${paths.join(", ")}`);

  for (const document of documents) {
    for (const link of markdownLinks(document)) {
      if (/^(?:https?:|mailto:|tel:|#)/i.test(link)) continue;
      const target = decodeURIComponent(link.split("#")[0].replace(/^<|>$/g, ""));
      if (!target) continue;
      const absolute = resolve(dirname(resolve(root, document.path)), target);
      if (!existsSync(absolute)) errors.push(`kırık bağlantı: ${document.path} -> ${target}`);
    }
  }

  const hashMap = new Map();
  for (const document of documents) {
    const hash = createHash("sha256").update(normalizeForDuplicate(document.content)).digest("hex");
    const paths = hashMap.get(hash) ?? [];
    paths.push(document.path);
    hashMap.set(hash, paths);
  }
  for (const paths of hashMap.values()) if (paths.length > 1) warnings.push(`birebir mükerrer: ${paths.join(", ")}`);

  const normalizedTitles = new Map();
  for (const document of documents) {
    const normalized = document.title
      .toLocaleLowerCase("tr")
      .normalize("NFKD")
      .replace(/[^a-z0-9çğıöşü]+/gi, " ")
      .trim();
    const paths = normalizedTitles.get(normalized) ?? [];
    paths.push(document.path);
    normalizedTitles.set(normalized, paths);
  }
  for (const paths of normalizedTitles.values()) if (paths.length > 1) warnings.push(`aynı başlık: ${paths.join(", ")}`);

  const tokenSets = documents.map((document) => new Set(
    document.content
      .toLocaleLowerCase("tr")
      .normalize("NFKD")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/[^a-z0-9çğıöşü]+/gi, " ")
      .split(/\s+/)
      .filter((token) => token.length > 3),
  ));
  for (let left = 0; left < documents.length; left += 1) {
    if (tokenSets[left].size < 40) continue;
    for (let right = left + 1; right < documents.length; right += 1) {
      if (tokenSets[right].size < 40) continue;
      let intersection = 0;
      for (const token of tokenSets[left]) if (tokenSets[right].has(token)) intersection += 1;
      const union = tokenSets[left].size + tokenSets[right].size - intersection;
      if (intersection / union >= 0.82) warnings.push(`çok benzer içerik: ${documents[left].path}, ${documents[right].path}`);
    }
  }

  const sensitivePatterns = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    /\b(?:ghp|github_pat|sk_live|sk_test)_[A-Za-z0-9_\-]{12,}\b/g,
    /postgres(?:ql)?:\/\/[^\s:@/]+:[^\s@/]+@/gi,
  ];
  for (const document of documents) {
    const count = sensitivePatterns.reduce((sum, pattern) => sum + [...document.content.matchAll(pattern)].length, 0);
    if (count) errors.push(`hassas bilgi adayı: ${document.path} (${count} eşleşme; değer gösterilmedi)`);
  }

  const inventory = documents.find((document) => document.path === inventoryPath);
  if (!inventory) errors.push(`envanter yok: ${inventoryPath}`);
  else {
    for (const document of documents) {
      if (document.path !== inventoryPath && !inventory.content.includes(document.path)) errors.push(`envanter dışı belge: ${document.path}`);
    }
  }

  const counts = Object.fromEntries(
    [...documents.reduce((map, document) => map.set(document.group, (map.get(document.group) ?? 0) + 1), new Map()).entries()].sort(([a], [b]) => a.localeCompare(b, "tr")),
  );
  console.log(JSON.stringify({ markdownCount: documents.length, categories: counts, duplicateIds: [...idMap.values()].filter((paths) => paths.length > 1).length, warnings, errors }, null, 2));
  if (errors.length) process.exitCode = 1;
}

main();
