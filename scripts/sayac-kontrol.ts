/**
 * Sayac modelinin durumunu ve dekont numara sayım tutarlılığını kontrol et.
 *
 * Çalıştır:  pnpm tsx scripts/sayac-kontrol.ts
 *
 * Beklenen çıktı (örnek):
 *   dekont_ABH-2026- = 8
 *   Son ABH: ABH-2026-000007
 *   ✓ Sayaç tutarlı (sayaç: 8, son: 7)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function kontrol(): Promise<void> {
  console.log("\nSAYAÇ KONTROL\n");

  const sayaclar = await prisma.sayac.findMany();
  console.log(`Toplam sayaç: ${sayaclar.length}`);
  for (const s of sayaclar) {
    console.log(`  ${s.anahtar} = ${s.deger}`);
  }

  const abhSayisi = await prisma.odeme.count({
    where: { dekontNo: { startsWith: "ABH-2026-" } },
  });
  const tkrSayisi = await prisma.odeme.count({
    where: { dekontNo: { startsWith: "TKR-2026-" } },
  });

  console.log(`\nDekont sayıları:`);
  console.log(`  ABH-2026-*: ${abhSayisi}`);
  console.log(`  TKR-2026-*: ${tkrSayisi}`);

  const sonABH = await prisma.odeme.findFirst({
    where: { dekontNo: { startsWith: "ABH-2026-" } },
    orderBy: { id: "desc" },
    select: { dekontNo: true },
  });
  console.log(`  Son ABH: ${sonABH?.dekontNo ?? "yok"}`);

  const abhSayac = sayaclar.find((s) => s.anahtar === "dekont_ABH-2026-");
  if (abhSayac && sonABH?.dekontNo) {
    // Sayac.deger = son verilen dekont numarası (upsert + increment sonrası).
    // Bir sonraki POST /odeme update.increment yapıp deger+1 atayacak.
    const sonSira = parseInt(sonABH.dekontNo.slice(9), 10);
    if (abhSayac.deger >= sonSira) {
      console.log(
        `✓ Sayaç tutarlı (sayaç: ${abhSayac.deger}, son verilen no: ${sonSira})`,
      );
      console.log(`  Bir sonraki dekont: ABH-2026-${String(abhSayac.deger + 1).padStart(6, "0")}`);
    } else {
      console.log(
        `! Sayaç KÜÇÜK (sayaç: ${abhSayac.deger}, son: ${sonSira}) — manuel düzeltme gerekebilir`,
      );
    }
  } else if (!abhSayac && sonABH?.dekontNo) {
    console.log(`Sayaç henüz oluşturulmamış (ilk POST /odeme'de yaratılır)`);
  }

  await prisma.$disconnect();
}

kontrol().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
