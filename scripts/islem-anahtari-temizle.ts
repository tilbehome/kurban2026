/**
 * IslemAnahtari tablosundan eski (7+ gün) kayıtları temizler.
 *
 * SPRINT-P3 İŞ 1: Idempotency anahtarları sınırsız büyür. Bayram günü
 * trafiği sonrası periyodik temizleme. Genelde günlük cron olarak çalıştırılır;
 * manuel: `pnpm tsx scripts/islem-anahtari-temizle.ts`.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ESKI_SINIR_GUN = 7;

async function temizle(): Promise<void> {
  const sinir = new Date(Date.now() - ESKI_SINIR_GUN * 24 * 60 * 60 * 1000);
  const sonuc = await prisma.islemAnahtari.deleteMany({
    where: { createdAt: { lt: sinir } },
  });
  console.log(
    `✓ ${sonuc.count} adet ${ESKI_SINIR_GUN}+ gün eski IslemAnahtari silindi`,
  );
}

temizle()
  .catch((e: unknown) => {
    console.error("[islem-anahtari-temizle] hata:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
