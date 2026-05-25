/**
 * TvAyari seed — alt bilgi şeridi için varsayılan metinler.
 *
 * Çalıştır: pnpm tsx prisma/seed-tv-ayar.ts
 *
 * Tekrar çalıştırılırsa: mevcut anahtarlar atlanır (upsert değil — değer korunur).
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface SeedAyar {
  anahtarKey: string;
  deger: string;
}

const VARSAYILAN_AYARLAR: SeedAyar[] = [
  {
    anahtarKey: "duyuru",
    deger: "Kesim alanında anonsları takip ediniz.",
  },
  {
    anahtarKey: "sira_hatirlatma",
    deger:
      "Sıranız geldiğinde ekranda ve anonsla bilgilendirileceksiniz.",
  },
  {
    anahtarKey: "hijyen",
    deger:
      "Hijyen kurallarına uyalım, sağlığımızı birlikte koruyalım.",
  },
  { anahtarKey: "whatsapp_tel", deger: "0532 123 45 67" },
  { anahtarKey: "lokasyon", deger: "Merkez Kesim Alanı" },
];

async function main() {
  console.log("TV ayarları seed ediliyor...");
  let eklenen = 0;
  let atlanan = 0;

  for (const ayar of VARSAYILAN_AYARLAR) {
    const mevcut = await prisma.tvAyari.findUnique({
      where: { anahtarKey: ayar.anahtarKey },
    });
    if (mevcut) {
      atlanan++;
      console.log(`  ⏭  Zaten var: ${ayar.anahtarKey}`);
      continue;
    }
    await prisma.tvAyari.create({
      data: { anahtarKey: ayar.anahtarKey, deger: ayar.deger, aktif: true },
    });
    eklenen++;
    console.log(`  ✓ Eklendi: ${ayar.anahtarKey}`);
  }

  console.log(`\nToplam: ${eklenen} eklendi, ${atlanan} atlandı.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
