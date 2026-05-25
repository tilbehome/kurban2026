/**
 * Tek seferlik temizleme — DB'deki WhatsApp şablonlarında hard-coded
 * "Adabereket Hayvancılık" geçişlerini `{sirketAdi}` placeholder'ı ile
 * değiştirir. Seed-only güncelleme yetersiz çünkü mevcut DB kayıtlarına
 * dokunmaz.
 *
 * Çalıştır: pnpm tsx scripts/duzelt-whatsapp-sablon.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const sablonlar = await prisma.whatsAppSablonu.findMany({
    where: { icerik: { contains: "Adabereket Hayvancılık" } },
  });

  if (sablonlar.length === 0) {
    console.log("Düzeltilecek şablon yok. (Belki seed-only ile zaten temiz)");
    return;
  }

  for (const s of sablonlar) {
    const yeni = s.icerik.replace(/Adabereket Hayvancılık/g, "{sirketAdi}");
    await prisma.whatsAppSablonu.update({
      where: { id: s.id },
      data: { icerik: yeni },
    });
    console.log(`✓ Düzeltildi: ${s.ad}`);
  }

  console.log(`\nToplam ${sablonlar.length} şablon güncellendi.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
