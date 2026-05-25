/**
 * SPRINT-11 sonrası tek seferlik backfill.
 *
 * Mevcut kurbanlardan beklemede olmayanların asamaBaslangic alanı null.
 * En iyi tahmin: kesimBaslama varsa o, yoksa updatedAt.
 *
 * Çalıştır: pnpm tsx scripts/asama-baslangic-backfill.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function backfill() {
  const kurbanlar = await prisma.kurban.findMany({
    where: {
      silindiMi: false,
      asamaBaslangic: null,
      kesimDurumu: { not: "beklemede" },
    },
    select: {
      id: true,
      kesimSirasi: true,
      kesimBaslama: true,
      updatedAt: true,
      kesimDurumu: true,
    },
  });

  console.log(
    `${kurbanlar.length} kurban için asamaBaslangic atanacak...`,
  );

  let updated = 0;
  for (const k of kurbanlar) {
    const tahmin = k.kesimBaslama ?? k.updatedAt;
    await prisma.kurban.update({
      where: { id: k.id },
      data: { asamaBaslangic: tahmin },
    });
    updated++;
    console.log(
      `  #${k.kesimSirasi} (${k.kesimDurumu}) → ${tahmin.toISOString()}`,
    );
  }

  console.log(`\n✓ ${updated} kurban güncellendi.`);
}

backfill()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
