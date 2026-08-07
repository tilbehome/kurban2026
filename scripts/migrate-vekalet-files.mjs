#!/usr/bin/env node
/**
 * Legacy vekalet dosyalarını public/uploads/vekalet altından korumalı
 * data/uploads/vekalet alanına taşımak için güvenli migration aracı.
 *
 * Varsayılan dry-run'dır:
 *   node scripts/migrate-vekalet-files.mjs
 *
 * Gerçek taşıma için:
 *   node scripts/migrate-vekalet-files.mjs --apply
 *
 * Not: Gerçek işlemden önce veritabanı ve public/uploads klasörünün yedeğini alın.
 */

import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const APPLY = process.argv.includes("--apply");
const ROOT = process.cwd();
const LEGACY_PREFIX = "/uploads/vekalet/";
const SOURCE_DIR = path.join(ROOT, "public", "uploads", "vekalet");
const TARGET_DIR = path.join(ROOT, "data", "uploads", "vekalet");

function safeFileName(name) {
  return /^[a-zA-Z0-9_-]+\.(pdf|jpg|jpeg|png)$/i.test(name) ? name : null;
}

function ensureInside(base, candidate) {
  const baseResolved = path.resolve(base);
  const candidateResolved = path.resolve(candidate);
  if (
    candidateResolved !== baseResolved &&
    !candidateResolved.startsWith(baseResolved + path.sep)
  ) {
    throw new Error(`Path traversal engellendi: ${candidate}`);
  }
  return candidateResolved;
}

async function sha256(filePath) {
  const buffer = await fs.readFile(filePath);
  return createHash("sha256").update(buffer).digest("hex");
}

const prisma = new PrismaClient();
const rapor = {
  mode: APPLY ? "apply" : "dry-run",
  moved: [],
  skipped: [],
  failed: [],
};

try {
  const vekaletler = await prisma.vekalet.findMany({
    where: {
      dosyaUrl: { startsWith: LEGACY_PREFIX },
    },
    select: {
      id: true,
      hisseId: true,
      dosyaUrl: true,
      dosyaBoyutu: true,
      silindiMi: true,
    },
  });

  await fs.mkdir(TARGET_DIR, { recursive: true });

  for (const v of vekaletler) {
    try {
      const fileName = safeFileName(v.dosyaUrl.slice(LEGACY_PREFIX.length));
      if (!fileName) {
        rapor.failed.push({ id: v.id, reason: "guvensiz-dosya-adi" });
        continue;
      }

      const source = ensureInside(SOURCE_DIR, path.join(SOURCE_DIR, fileName));
      const target = ensureInside(TARGET_DIR, path.join(TARGET_DIR, fileName));
      const targetUrl = `vekalet://${fileName}`;

      const sourceStat = await fs.stat(source).catch(() => null);
      if (!sourceStat?.isFile()) {
        rapor.failed.push({ id: v.id, fileName, reason: "kaynak-yok" });
        continue;
      }
      if (sourceStat.size !== v.dosyaBoyutu) {
        rapor.skipped.push({
          id: v.id,
          fileName,
          reason: "boyut-uyusmazligi",
          dbSize: v.dosyaBoyutu,
          fileSize: sourceStat.size,
        });
        continue;
      }

      const targetExists = await fs.stat(target).catch(() => null);
      const sourceHash = await sha256(source);
      let targetHash = null;
      if (targetExists?.isFile()) {
        targetHash = await sha256(target);
        if (targetHash !== sourceHash) {
          rapor.skipped.push({
            id: v.id,
            fileName,
            reason: "hedef-cakismasi",
            sourceHash,
            targetHash,
          });
          continue;
        }
      }

      const item = {
        id: v.id,
        hisseId: v.hisseId,
        fileName,
        source,
        target,
        targetUrl,
        size: sourceStat.size,
        sha256: sourceHash,
        silindiMi: v.silindiMi,
      };

      if (APPLY) {
        if (!targetExists) {
          await fs.copyFile(source, target);
        }
        await prisma.vekalet.update({
          where: { id: v.id },
          data: { dosyaUrl: targetUrl },
        });
      }

      rapor.moved.push(item);
    } catch (error) {
      rapor.failed.push({
        id: v.id,
        reason: error instanceof Error ? error.message : "bilinmeyen-hata",
      });
    }
  }

  console.log(JSON.stringify(rapor, null, 2));
  if (!APPLY) {
    console.error(
      "DRY-RUN tamamlandı. Gerçek taşıma için önce yedek alın, sonra --apply kullanın.",
    );
  }
} finally {
  await prisma.$disconnect();
}
