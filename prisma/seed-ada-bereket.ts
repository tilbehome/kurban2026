/**
 * Ada Bereket Hayvancılık firma ayarlarını seed eder.
 *
 * Çalıştır: pnpm tsx prisma/seed-ada-bereket.ts
 *
 * Mevcut anahtarlar UPDATE edilir, yoksa CREATE.
 * TilbeCore yazılım markası footer/branding'de kalır.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface SeedAyar {
  anahtar: string;
  deger: string;
}

const ADA_BEREKET_AYARLARI: SeedAyar[] = [
  // Kimlik
  { anahtar: "firma_adi", deger: "Ada Bereket Hayvancılık" },
  { anahtar: "firma_kisa_ad", deger: "Ada Bereket" },
  { anahtar: "firma_slogan", deger: "Güvenilir Hizmet, Bereketli Kazanç" },

  // İletişim
  { anahtar: "firma_telefon", deger: "+90 536 390 44 18" },
  { anahtar: "firma_whatsapp", deger: "905363904418" },
  { anahtar: "firma_email", deger: "adaberekethayvancilik@gmail.com" },
  { anahtar: "firma_web", deger: "adaberekethayvancilik.com.tr" },

  // Adres
  { anahtar: "firma_adres", deger: "Harmantepe, Örgün Sokak No: 24" },
  { anahtar: "firma_il", deger: "Sakarya" },
  { anahtar: "firma_ilce", deger: "Adapazarı" },
  { anahtar: "firma_posta_kodu", deger: "54104" },

  // Sosyal Medya
  { anahtar: "firma_instagram", deger: "@adaberekethayvancilik" },
  { anahtar: "firma_tiktok", deger: "@adaberekethayvancilik" },
  { anahtar: "firma_youtube", deger: "@adaberekethayvancilik" },
  { anahtar: "firma_facebook", deger: "" },

  // Marka
  { anahtar: "marka_rengi", deger: "#DE0B1E" },

  // Dekont
  { anahtar: "dekont_prefix", deger: "ABH-2026-" },
  {
    anahtar: "dekont_alt_yazi",
    deger: "Ada Bereket'e güvendiğiniz için teşekkür ederiz.",
  },

  // Yazılım branding (sadece footer'da görünür)
  {
    anahtar: "yazilim_branding",
    deger: "Bu sistem TilbeCore Kurban Yönetim Sistemi tarafından sağlanmaktadır.",
  },

  // Public URL (QR kodlarda kullanılır)
  { anahtar: "public_url", deger: "https://adaberekethayvancilik.com.tr" },

  // Şube
  { anahtar: "firma_sube_aktif", deger: "Merkez Kesim Alanı" },
];

async function main() {
  console.log("Ada Bereket ayarları seed ediliyor...");
  let guncellenen = 0;
  let eklenen = 0;

  for (const ayar of ADA_BEREKET_AYARLARI) {
    const mevcut = await prisma.ayar.findUnique({
      where: { anahtar: ayar.anahtar },
    });
    if (mevcut) {
      await prisma.ayar.update({
        where: { anahtar: ayar.anahtar },
        data: { deger: ayar.deger, guncelTarih: new Date() },
      });
      guncellenen++;
      console.log(`  ↻ Güncellendi: ${ayar.anahtar}`);
    } else {
      await prisma.ayar.create({
        data: { anahtar: ayar.anahtar, deger: ayar.deger },
      });
      eklenen++;
      console.log(`  ✓ Eklendi: ${ayar.anahtar}`);
    }
  }

  console.log(
    `\nToplam: ${eklenen} yeni, ${guncellenen} güncellendi.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
