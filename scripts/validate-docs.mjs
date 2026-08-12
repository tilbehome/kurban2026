import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const inventoryPath = "docs/governance/GOV-012-MARKDOWN-ENVANTERI-VE-TASNIF.md";
export const requiredMetadata = [
  "id", "status", "owner", "source_role", "source_of_truth", "last_reviewed", "verified_against_commit",
];

const allowedStatuses = new Set([
  "VERIFIED", "IMPLEMENTED_UNVERIFIED", "IMPLEMENTING", "PLANNED", "NOT_RUN", "SUPERSEDED", "ARCHIVED",
]);
const ignoredDirectories = new Set([".git", ".next", "node_modules", "generated"]);
const categoryOrder = [
  "root-governance", "architecture", "adr", "governance", "product", "domains", "workflows",
  "personas", "ux", "accessibility", "i18n", "security", "privacy", "testing", "infrastructure",
  "operations", "reliability", "runbooks", "releases", "training", "evidence", "archive",
  "app-package-readme", "third-party-generated",
];
const textConfigExtensions = new Set([
  ".md", ".mdx", ".mjs", ".cjs", ".js", ".jsx", ".mts", ".cts", ".ts", ".tsx", ".json",
  ".yaml", ".yml", ".toml", ".ini", ".properties", ".xml", ".env", ".example", ".sh", ".ps1", ".bat",
]);

function walk(directory, include) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) return [];
    const absolute = resolve(directory, entry.name);
    if (entry.isDirectory()) return walk(absolute, include);
    return include(absolute, entry.name) ? [absolute] : [];
  });
}

function repoPath(root, absolute) {
  return relative(root, absolute).split(sep).join("/");
}

export function parseMetadata(content) {
  const block = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/) ?? content.match(/```yaml\s*\r?\n([\s\S]*?)\r?\n```/i);
  if (!block) return {};
  return Object.fromEntries(block[1].split(/\r?\n/).map((line) => {
    const match = line.match(/^([a-z_]+):\s*(.*?)\s*$/i);
    return match ? [match[1], match[2].replace(/^['"]|['"]$/g, "")] : null;
  }).filter(Boolean));
}

function category(path) {
  if (path === "AGENTS.md" || path === "README.md") return "root-governance";
  if (path === "docs/README.md") return "governance";
  if (/^(apps|packages)\/.+\/README\.md$/i.test(path)) return "app-package-readme";
  if (path.startsWith("docs/archive/")) return "archive";
  if (path.startsWith("docs/")) return path.split("/")[1] ?? "third-party-generated";
  return "third-party-generated";
}

function titleOf(content, path) {
  return content.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? path.split("/").at(-1);
}

export function readDocuments(root) {
  const paths = walk(root, (absolute) => extname(absolute).toLowerCase() === ".md")
    .map((absolute) => repoPath(root, absolute)).sort((a, b) => a.localeCompare(b, "tr"));
  return paths.map((path) => {
    const content = readFileSync(resolve(root, path), "utf8");
    const realMeta = parseMetadata(content);
    const group = category(path);
    const active = group !== "archive";
    const meta = realMeta;
    return {
      path, content, realMeta, meta, group, active,
      id: meta.id,
      title: titleOf(content, path),
      status: meta.status,
      sourceOfTruth: meta.source_of_truth,
      sourceRole: meta.source_role,
      owner: meta.owner,
      freshness: `${meta.last_reviewed ?? "eksik"}; ${meta.verified_against_commit ?? "eksik"}`,
    };
  });
}

function escapeCell(value) {
  return String(value ?? "").replaceAll("|", "\\|").replace(/\r?\n/g, " ");
}

function inventoryLink(path) {
  const target = path.startsWith("docs/") ? `../${path.slice(5)}` : `../../${path}`;
  return target.replaceAll("(", "%28").replaceAll(")", "%29").replaceAll(" ", "%20");
}

function masterSource(group) {
  const map = {
    architecture: "RMP-001 / TRK-001", adr: "RMP-001", governance: "GOV-001", product: "PRD-001 / RMP-001",
    domains: "RMP-001 / REQ-003", workflows: "RMP-001 / REQ-003", personas: "PRD-001 / RMP-001",
    ux: "PRD-001 / RMP-001", accessibility: "PRD-001 / RMP-001", i18n: "PRD-001 / RMP-001",
    security: "ADR-0002 / RMP-001", privacy: "ADR-0002 / RMP-001", testing: "TST-001",
    infrastructure: "RMP-001 / TST-001", operations: "RMP-001 / TST-001", reliability: "RMP-001 / TST-001",
    runbooks: "RMP-001 / TST-001", releases: "RMP-001 / TST-001", training: "RMP-001 / TST-001",
    evidence: "TST-001 / GOV-003", archive: "GOV-011", "root-governance": "GOV-001 / GOV-003",
    "app-package-readme": "ilgili uygulama/paket", "third-party-generated": "yok",
  };
  return map[group] ?? "GOV-002";
}

export function generateInventoryContent(documents) {
  const inventoryDocument = documents.find((document) => document.path === inventoryPath);
  const inventoryMeta = {
    id: "GOV-012", status: "VERIFIED", owner: "Architecture-and-Documentation",
    source_role: "complete_markdown_inventory_and_classification", source_of_truth: "true",
    last_reviewed: "not_applicable", verified_against_commit: "not_applicable",
    code_baseline_commit: "not_applicable",
    ...(inventoryDocument?.realMeta ?? {}),
  };
  inventoryMeta.verified_against_commit = "not_applicable";
  const rows = documents.map((document) => document.path === inventoryPath ? {
    ...document, meta: inventoryMeta, id: inventoryMeta.id, status: inventoryMeta.status,
    sourceOfTruth: inventoryMeta.source_of_truth, owner: inventoryMeta.owner,
    sourceRole: inventoryMeta.source_role,
    freshness: `${inventoryMeta.last_reviewed}; ${inventoryMeta.verified_against_commit}`,
  } : document).sort((a, b) => a.path.localeCompare(b.path, "tr"));
  const counts = new Map();
  for (const row of rows) counts.set(row.group, (counts.get(row.group) ?? 0) + 1);
  const lines = [
    "# Markdown Envanteri ve Tasnif Kararları", "", "```yaml",
    `id: ${inventoryMeta.id}`, `status: ${inventoryMeta.status}`, `owner: ${inventoryMeta.owner}`,
    `source_role: ${inventoryMeta.source_role}`, `source_of_truth: ${inventoryMeta.source_of_truth}`,
    `last_reviewed: ${inventoryMeta.last_reviewed}`, "verified_against_commit: not_applicable",
    `code_baseline_commit: ${inventoryMeta.code_baseline_commit}`, "```", "",
    "Bu envanter `pnpm validate:docs:write` ile deterministik üretilir. Normal `pnpm validate:docs` ve `--check-inventory` dosya yazmaz; yeniden üretilecek içerik izlenen dosyadan farklıysa kalite kapısı hata verir. `code_baseline_commit` yalnız uygulama kodu/migration/test fotoğrafıdır; envanterin kendi güncellik veya commit kanıtı değildir. Validator satır yolunu, ID’yi, başlığı, durumu, `source_of_truth`, `source_role`, kategori, sahip ve güncellik alanlarını yapısal olarak karşılaştırır.",
    "", "## Kategori özeti", "", "| Kategori | Belge sayısı |", "|---|---:|",
    ...categoryOrder.map((group) => `| ${group} | ${counts.get(group) ?? 0} |`),
    "", "## Belge envanteri", "",
    "| Yol | ID | Başlık | Durum | Ana kaynak | Kaynak rolü | Kategori | Sahip | Güncellik | Bağlı ana kaynak | Aynı konu kaynağı | Karar |",
    "|---|---|---|---|---|---|---|---|---|---|---|---|",
  ];
  for (const row of rows) {
    const related = row.id === masterSource(row.group) || row.id === "GOV-012" ? "yok" : masterSource(row.group);
    const decision = row.group === "archive" ? "arşivde tutulacak" : row.status === "SUPERSEDED" ? "superseded; uyumluluk için tutulacak" : "tutulacak";
    lines.push(`| [${escapeCell(row.path)}](${inventoryLink(row.path)}) | ${escapeCell(row.id)} | ${escapeCell(row.title)} | ${escapeCell(row.status)} | ${escapeCell(row.sourceOfTruth)} | ${escapeCell(row.sourceRole)} | ${escapeCell(row.group)} | ${escapeCell(row.owner)} | ${escapeCell(row.freshness)} | ${escapeCell(masterSource(row.group))} | ${escapeCell(related)} | ${decision} |`);
  }
  lines.push("", "## Tasnif sonucu", "",
    "- Aktif belgeler kendi uzmanlık dizinlerinde tutulur ve gerçek gezinme/bağlam belgelerinden erişilir; GOV-012’nin otomatik envanter bağlantıları yetim-belge erişilebilirliği oluşturmaz.",
    "- `ARC-010`, `TST-001` ana planına yönlendiren `SUPERSEDED` uyumluluk belgesidir; silinmez.",
    "- `docs/archive` tarihsel kayıttır ve aktif karar kaynağı değildir; yine de fallback olmadan gerçek `ARCHIVED` metadata taşır.",
    "- GOV-012 içindeki bağlantı hedefleri ve anchor’lar doğrulanır; yalnız reachability grafiğine kaynak sayılmaz.",
  );
  return `${lines.join("\n")}\n`;
}

function stripFencedCode(content) {
  return content.replace(/```[\s\S]*?```/g, "");
}

function markdownTargets(document, errors) {
  const content = stripFencedCode(document.content);
  const definitions = new Map();
  for (const match of content.matchAll(/^ {0,3}\[([^\]]+)\]:\s*(<[^>]+>|\S+)/gm)) {
    definitions.set(match[1].trim().toLowerCase(), match[2].replace(/^<|>$/g, ""));
  }
  const inline = inlineMarkdownTargets(content);
  const targets = inline.targets;
  const characters = [...content];
  for (const [start, end] of inline.spans) characters.fill(" ", start, end);
  const withoutInline = characters.join("").replace(/^ {0,3}\[[^\]]+\]:.*$/gm, "");
  for (const match of withoutInline.matchAll(/!?\[([^\]]*)\]\[([^\]]*)\]/g)) {
    const key = (match[2] || match[1]).trim().toLowerCase();
    if (!definitions.has(key)) errors.push(`kırık reference-style bağlantı: ${document.path} -> ${key}`);
    else targets.push(definitions.get(key));
  }
  for (const target of definitions.values()) targets.push(target);
  return [...new Set(targets)];
}

function inlineMarkdownTargets(content) {
  const targets = [];
  const spans = [];
  for (let start = 0; start < content.length; start += 1) {
    const labelStart = content[start] === "!" && content[start + 1] === "[" ? start + 1 : start;
    if (content[labelStart] !== "[") continue;
    const labelEnd = content.indexOf("](", labelStart + 1);
    if (labelEnd < 0) continue;
    let cursor = labelEnd + 2;
    let target = "";
    if (content[cursor] === "<") {
      const close = content.indexOf(">", cursor + 1);
      if (close < 0) continue;
      target = content.slice(cursor + 1, close);
      cursor = close + 1;
    } else {
      let depth = 1;
      const targetStart = cursor;
      while (cursor < content.length) {
        const character = content[cursor];
        if (character === "(") depth += 1;
        else if (character === ")") {
          if (depth === 1) break;
          depth -= 1;
        } else if (/\s/.test(character) && depth === 1) break;
        cursor += 1;
      }
      target = content.slice(targetStart, cursor);
    }
    let depth = 1;
    while (cursor < content.length && depth > 0) {
      if (content[cursor] === "(") depth += 1;
      else if (content[cursor] === ")") depth -= 1;
      cursor += 1;
    }
    if (!target || depth !== 0) continue;
    targets.push(target);
    spans.push([start, cursor]);
    start = cursor - 1;
  }
  return { targets, spans };
}

export function githubSlug(text) {
  return text.trim().toLowerCase().replace(/<[^>]+>/g, "")
    .replace(/[`*_~]/g, "").replace(/[^\p{L}\p{N}\s_-]/gu, "").replace(/\s+/g, "-");
}

function anchorsFor(content) {
  const anchors = new Set();
  const seen = new Map();
  const stripped = stripFencedCode(content);
  for (const match of stripped.matchAll(/^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$/gm)) {
    const base = githubSlug(match[1]);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    anchors.add(count ? `${base}-${count}` : base);
  }
  for (const match of stripped.matchAll(/\bid=["']([^"']+)["']/gi)) anchors.add(match[1]);
  return anchors;
}

function splitTarget(target) {
  const hash = target.indexOf("#");
  if (hash < 0) return { path: target, anchor: "" };
  return { path: target.slice(0, hash), anchor: decodeURIComponent(target.slice(hash + 1)) };
}

function splitTableRow(line) {
  const cells = [];
  let cell = "";
  for (let index = 1; index < line.length - 1; index += 1) {
    if (line[index] === "|" && line[index - 1] !== "\\") { cells.push(cell.trim().replaceAll("\\|", "|")); cell = ""; }
    else cell += line[index];
  }
  cells.push(cell.trim().replaceAll("\\|", "|"));
  return cells;
}

function sectionTable(content, heading) {
  const start = content.indexOf(heading);
  if (start < 0) return [];
  const lines = content.slice(start + heading.length).split(/\r?\n/);
  const table = [];
  let started = false;
  for (const line of lines) {
    if (line.startsWith("|")) { started = true; table.push(splitTableRow(line)); }
    else if (started && line.trim()) break;
  }
  return table.length >= 2 ? table.filter((_, index) => index !== 1) : [];
}

function parseInventory(content, errors) {
  const countTable = sectionTable(content, "## Kategori özeti");
  const rowTable = sectionTable(content, "## Belge envanteri");
  if (!countTable.length) errors.push("envanter kategori tablosu yapısal olarak okunamadı");
  if (!rowTable.length) errors.push("envanter belge tablosu yapısal olarak okunamadı");
  const counts = new Map(countTable.slice(1).map((row) => [row[0], Number(row[1])]));
  const rows = rowTable.slice(1).map((row) => ({
    path: row[0]?.match(/^\[([^\]]+)\]\(/)?.[1], id: row[1], title: row[2], status: row[3],
    sourceOfTruth: row[4], sourceRole: row[5], group: row[6], owner: row[7], freshness: row[8],
  }));
  return { counts, rows };
}

function listValue(value) {
  if (!value || value === "null" || value === "[]") return [];
  if (value.startsWith("[") && value.endsWith("]")) return value.slice(1, -1).split(",").map((item) => item.trim()).filter(Boolean);
  return [value];
}

function validateSupersession(active, errors) {
  const byId = new Map(active.filter((document) => document.id).map((document) => [document.id, document]));
  for (const document of active) {
    for (const targetId of listValue(document.meta.supersedes)) {
      const target = byId.get(targetId);
      if (!target) errors.push(`supersedes hedefi yok: ${document.path} -> ${targetId}`);
      else if (!listValue(target.meta.superseded_by).includes(document.id)) errors.push(`supersedes karşılığı eksik: ${document.id} -> ${targetId}`);
    }
    for (const sourceId of listValue(document.meta.superseded_by)) {
      const source = byId.get(sourceId);
      if (!source) errors.push(`superseded_by kaynağı yok: ${document.path} -> ${sourceId}`);
      else if (!listValue(source.meta.supersedes).includes(document.id)) errors.push(`superseded_by karşılığı eksik: ${document.id} <- ${sourceId}`);
    }
  }
}

function allowedFixtureValues(path) {
  if (path === ".github/workflows/webpack.yml") return [
    "tilbecore_test_password",
    "ci_only_session_secret_32_chars_minimum",
    "ci_only_dekont_secret_32_chars_minimum",
  ];
  const testFixtureAllowlist = new Map([
    ["packages/provisioning/tests/tenant-provisioning.test.ts", "postgresql://user:" + "password@example.test/db"],
    ["packages/tenant-runtime/tests/tenant-connection-pool.test.ts", "postgresql://user:" + "password@host/private_database"],
  ]);
  const allowedValue = testFixtureAllowlist.get(path);
  return allowedValue ? [allowedValue] : [];
}

function removeExactAllowedFixtures(line, fixtures) {
  return fixtures.reduce((value, fixture) => {
    const escaped = fixture.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return value.replace(new RegExp(`(?<![A-Za-z0-9_])${escaped}(?![A-Za-z0-9_])`, "g"), "");
  }, line);
}

function isTextConfigFile(absolute) {
  const name = basename(absolute).toLowerCase();
  return name === ".env" || name.startsWith(".env.") || textConfigExtensions.has(extname(name).toLowerCase());
}

function secretErrors(root) {
  const patterns = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /\b(?:ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[0-9A-Z]{16})\b/,
    /\b(?:sk_live_[A-Za-z0-9]{16,}|xox[baprs]-[A-Za-z0-9-]{20,})\b/,
    /postgres(?:ql)?:\/\/[^\s:@/]+:[^\s@/]{8,}@[^\s/]+/i,
  ];
  let files;
  try {
    files = execFileSync("git", ["-C", root, "ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
      .split(/\r?\n/).filter(Boolean).map((path) => resolve(root, path))
      .filter((absolute) => existsSync(absolute) && statSync(absolute).isFile())
      .filter(isTextConfigFile);
  } catch {
    files = walk(root, (absolute) => isTextConfigFile(absolute));
  }
  const errors = [];
  for (const absolute of files) {
    const path = repoPath(root, absolute);
    let content;
    try { content = readFileSync(absolute, "utf8"); } catch { continue; }
    let count = 0;
    for (const line of content.split(/\r?\n/)) {
      const candidate = removeExactAllowedFixtures(line, allowedFixtureValues(path));
      if (patterns.some((pattern) => pattern.test(candidate))) count += 1;
    }
    if (count) errors.push(`hassas bilgi adayı: ${path} (${count} eşleşme; değer gösterilmedi)`);
  }
  return errors;
}

function isIsoCalendarDate(value) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function validateRepository(root, options = {}) {
  const errors = [];
  const warnings = [];
  const documents = readDocuments(root);
  const active = documents.filter((document) => document.active);
  for (const document of documents) {
    for (const key of requiredMetadata) if (!document.realMeta[key]) errors.push(`eksik metadata ${key}: ${document.path}`);
    if (document.status && !allowedStatuses.has(document.status)) errors.push(`geçersiz durum: ${document.path} (${document.status})`);
    if (document.meta.source_of_truth && !["true", "false"].includes(document.meta.source_of_truth)) errors.push(`geçersiz source_of_truth: ${document.path}`);
    const reviewed = document.meta.last_reviewed;
    const archiveException = document.group === "archive" && document.status === "ARCHIVED" && reviewed === "not_applicable";
    if (reviewed && !archiveException && !isIsoCalendarDate(reviewed)) errors.push(`geçersiz last_reviewed: ${document.path} (${reviewed})`);
    const verified = document.meta.verified_against_commit;
    if (verified && verified !== "not_applicable" && !/^[a-f0-9]{40}$/i.test(verified)) errors.push(`geçersiz verified_against_commit: ${document.path}`);
  }
  const idMap = new Map();
  for (const document of documents) {
    if (!document.id) continue;
    const paths = idMap.get(document.id) ?? [];
    paths.push(document.path); idMap.set(document.id, paths);
  }
  for (const [id, paths] of idMap) if (paths.length > 1) errors.push(`mükerrer ID ${id}: ${paths.join(", ")}`);
  validateSupersession(active, errors);

  const byPath = new Map(documents.map((document) => [document.path, document]));
  const graph = new Map(active.map((document) => [document.path, new Set()]));
  for (const document of active) {
    const targets = markdownTargets(document, errors);
    for (const rawTarget of targets) {
      if (/^(?:https?:|mailto:|tel:)/i.test(rawTarget)) continue;
      const { path: targetPart, anchor } = splitTarget(rawTarget);
      const targetAbsolute = targetPart ? resolve(dirname(resolve(root, document.path)), decodeURIComponent(targetPart)) : resolve(root, document.path);
      if (!existsSync(targetAbsolute)) { errors.push(`kırık bağlantı: ${document.path} -> ${targetPart || rawTarget}`); continue; }
      const resolvedPath = statSync(targetAbsolute).isDirectory()
        ? repoPath(root, resolve(targetAbsolute, "README.md")) : repoPath(root, targetAbsolute);
      if (document.path !== inventoryPath && graph.has(document.path) && byPath.get(resolvedPath)?.active) graph.get(document.path).add(resolvedPath);
      if (anchor) {
        const targetDocument = byPath.get(resolvedPath);
        if (!targetDocument || !anchorsFor(targetDocument.content).has(anchor)) errors.push(`kırık anchor: ${document.path} -> ${rawTarget}`);
      }
    }
  }

  const roots = ["AGENTS.md", "README.md", "docs/README.md"].filter((path) => graph.has(path));
  const reachable = new Set(roots);
  const queue = [...roots];
  while (queue.length) {
    const current = queue.shift();
    for (const target of graph.get(current) ?? []) if (!reachable.has(target)) { reachable.add(target); queue.push(target); }
  }
  for (const document of active) if (!reachable.has(document.path)) errors.push(`yetim aktif belge: ${document.path}`);

  const inventory = byPath.get(inventoryPath);
  if (!inventory) errors.push(`envanter yok: ${inventoryPath}`);
  else {
    const parsed = parseInventory(inventory.content, errors);
    const inventoryRows = new Map();
    for (const row of parsed.rows) {
      if (!row.path) { errors.push("envanter satırında yol okunamadı"); continue; }
      if (inventoryRows.has(row.path)) errors.push(`mükerrer envanter satırı: ${row.path}`);
      inventoryRows.set(row.path, row);
      if (!byPath.has(row.path)) errors.push(`envanterde olmayan yol: ${row.path}`);
    }
    for (const document of documents) {
      const row = inventoryRows.get(document.path);
      if (!row) { errors.push(`envanter dışı belge: ${document.path}`); continue; }
      const expected = { id: document.id, title: document.title, status: document.status, sourceOfTruth: document.sourceOfTruth, sourceRole: document.sourceRole, group: document.group, owner: document.owner, freshness: document.freshness };
      for (const key of Object.keys(expected)) {
        const label = key === "sourceRole" ? "source_role" : key;
        if (row[key] !== expected[key]) errors.push(`envanter metadata uyumsuzluğu ${label}: ${document.path}`);
      }
    }
    const actualCounts = new Map();
    for (const document of documents) actualCounts.set(document.group, (actualCounts.get(document.group) ?? 0) + 1);
    for (const group of categoryOrder) if (parsed.counts.get(group) !== (actualCounts.get(group) ?? 0)) errors.push(`yanlış kategori sayısı ${group}: envanter=${parsed.counts.get(group)} gerçek=${actualCounts.get(group) ?? 0}`);
    for (const group of parsed.counts.keys()) if (!categoryOrder.includes(group)) errors.push(`bilinmeyen envanter kategorisi: ${group}`);
    if (options.checkInventory !== false) {
      const expectedContent = generateInventoryContent(documents);
      if (inventory.content.replace(/\r\n/g, "\n") !== expectedContent) errors.push("güncel olmayan envanter: pnpm validate:docs:write çalıştırılmalı");
    }
  }

  const hashes = new Map();
  for (const document of documents) {
    const hash = createHash("sha256").update(document.content.replace(/\r\n/g, "\n").trim()).digest("hex");
    const paths = hashes.get(hash) ?? []; paths.push(document.path); hashes.set(hash, paths);
  }
  for (const paths of hashes.values()) if (paths.length > 1) warnings.push(`birebir mükerrer: ${paths.join(", ")}`);
  errors.push(...secretErrors(root));
  const counts = Object.fromEntries([...documents.reduce((map, document) => map.set(document.group, (map.get(document.group) ?? 0) + 1), new Map()).entries()].sort(([a], [b]) => a.localeCompare(b, "tr")));
  return { markdownCount: documents.length, categories: counts, duplicateIds: [...idMap.values()].filter((paths) => paths.length > 1).length, warnings, errors };
}

export function runCli(argv = process.argv.slice(2)) {
  const rootIndex = argv.indexOf("--root");
  const root = rootIndex >= 0 ? resolve(argv[rootIndex + 1]) : resolve(dirname(fileURLToPath(import.meta.url)), "..");
  if (argv.includes("--write-inventory")) {
    const documents = readDocuments(root);
    writeFileSync(resolve(root, inventoryPath), generateInventoryContent(documents), "utf8");
  }
  const result = validateRepository(root, { checkInventory: true });
  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length) process.exitCode = 1;
  return result;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) runCli();
