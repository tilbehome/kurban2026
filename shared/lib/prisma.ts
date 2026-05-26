/**
 * Singleton Prisma client. Next.js dev mode hot-reload sırasında
 * birden fazla client oluşmasını engeller.
 *
 * SPRINT-P1: SQLite WAL mode + busy_timeout + foreign keys aktif.
 * Bayram günü concurrent kasiyer + TV + yedekleme yükü için optimize.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaPragmaUygulandi: boolean | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// SQLite optimize — sadece bir kez (hot-reload'da tekrar çalışmaz).
if (!globalForPrisma.prismaPragmaUygulandi) {
  globalForPrisma.prismaPragmaUygulandi = true;
  void (async () => {
    try {
      await prisma.$executeRawUnsafe("PRAGMA journal_mode=WAL");
      await prisma.$executeRawUnsafe("PRAGMA busy_timeout=5000");
      await prisma.$executeRawUnsafe("PRAGMA synchronous=NORMAL");
      await prisma.$executeRawUnsafe("PRAGMA foreign_keys=ON");
    } catch (e) {
      console.error("[prisma] SQLite pragma hatası:", e);
    }
  })();
}
