/**
 * SPRINT-12 sonrası tek seferlik temizlik.
 *
 * Eski kodda Hisse/Kurban.kesimDurumu için iki typo değer kullanılıyordu:
 *   - "vekalet_onay"   → doğrusu "vekalet_bekliyor"
 *   - "teslim_edildi"  → doğrusu "tamamlandi"
 *
 * Bu script DB'deki eski değerleri canonical değerlerle değiştirir.
 * Çalıştır:  pnpm tsx scripts/durum-typo-duzelt.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function duzelt() {
  console.log("\nSPRINT-12 — durum typo temizliği başlıyor...\n");

  const h1 = await prisma.hisse.updateMany({
    where: { kesimDurumu: "vekalet_onay" },
    data: { kesimDurumu: "vekalet_bekliyor" },
  });
  console.log(`  hisse  vekalet_onay   → vekalet_bekliyor : ${h1.count}`);

  const h2 = await prisma.hisse.updateMany({
    where: { kesimDurumu: "teslim_edildi" },
    data: { kesimDurumu: "tamamlandi" },
  });
  console.log(`  hisse  teslim_edildi  → tamamlandi       : ${h2.count}`);

  const k1 = await prisma.kurban.updateMany({
    where: { kesimDurumu: "vekalet_onay" },
    data: { kesimDurumu: "vekalet_bekliyor" },
  });
  console.log(`  kurban vekalet_onay   → vekalet_bekliyor : ${k1.count}`);

  const k2 = await prisma.kurban.updateMany({
    where: { kesimDurumu: "teslim_edildi" },
    data: { kesimDurumu: "tamamlandi" },
  });
  console.log(`  kurban teslim_edildi  → tamamlandi       : ${k2.count}`);

  console.log("\nTemizlik tamamlandı.\n");
}

duzelt()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
