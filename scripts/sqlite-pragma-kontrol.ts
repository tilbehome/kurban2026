/**
 * SQLite pragma değerlerini kontrol et.
 *
 * Çalıştır:  pnpm tsx scripts/sqlite-pragma-kontrol.ts
 *
 * Beklenen değerler (bayram günü konkürans için optimize):
 *   journal_mode     = wal       (Write-Ahead Logging — concurrent okuma)
 *   busy_timeout     = 5000      (5sn — kilitlenmeyi bekle)
 *   synchronous      = 1         (NORMAL — WAL ile dengeli)
 *   foreign_keys     = 1         (ON — FK constraint zorlanır)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface PragmaSatir {
  [key: string]: number | string | null;
}

async function pragmaOku(ad: string): Promise<string> {
  const sonuc = await prisma.$queryRawUnsafe<PragmaSatir[]>(`PRAGMA ${ad}`);
  if (sonuc.length === 0) return "(boş)";
  const ilk = sonuc[0];
  if (!ilk) return "(yok)";
  // Pragma sonucu tek sütun döner, key adı pragma ile aynı veya farklı olabilir
  const degerler = Object.values(ilk);
  return degerler.length > 0 ? String(degerler[0]) : "(yok)";
}

async function kontrol(): Promise<void> {
  console.log("\nSQLITE PRAGMA KONTROL\n");

  const pragmalar = [
    { ad: "journal_mode", beklenen: "wal" },
    { ad: "busy_timeout", beklenen: "5000" },
    { ad: "synchronous", beklenen: "1" },
    { ad: "foreign_keys", beklenen: "1" },
  ];

  let hepsiTamam = true;
  for (const p of pragmalar) {
    const deger = await pragmaOku(p.ad);
    const tamam = deger === p.beklenen;
    const isaret = tamam ? "✓" : "✗";
    console.log(
      `  ${isaret} ${p.ad}: ${deger}${tamam ? "" : ` (beklenen: ${p.beklenen})`}`,
    );
    if (!tamam) hepsiTamam = false;
  }

  // Bilgi pragmaları
  console.log("\nBilgi:");
  console.log(`  cache_size: ${await pragmaOku("cache_size")}`);
  console.log(`  wal_autocheckpoint: ${await pragmaOku("wal_autocheckpoint")}`);
  console.log(`  page_size: ${await pragmaOku("page_size")}`);

  console.log(
    `\n${hepsiTamam ? "✓ TÜM PRAGMALAR OPTIMAL" : "! Bazı pragmalar eksik — uygulama prisma.ts üzerinden bir kez başlatılmalı"}\n`,
  );

  await prisma.$disconnect();
}

kontrol().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
