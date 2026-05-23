/**
 * Tilbe Kurban — veritabanı seed.
 *
 *  - admin / tilbe2026 kullanıcısı oluştur
 *  - Genel ayarları kaydet
 *  - seed-data.json'dan 63 kurban + hisseler + hissedarlar (müşteri olarak) + ödemeler yükle
 *
 *  Çalıştırma:  pnpm db:seed
 */

import fs from "node:fs";
import path from "node:path";
import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface SeedOdeme {
  sira: number;
  tutar: number;
  tarih: string;
}

interface SeedHisse {
  no: number;
  hissedar: string | null;
  telefon: string | null;
  hisse_fiyati: number;
  odemeler: SeedOdeme[];
  toplam_odenen: number;
  kalan: number;
}

interface SeedKurban {
  kesim_sirasi: number;
  kesim_saati: string | null;
  kupe_no: string | null;
  ad_soyad: string | null;
  hisse_sayisi: number;
  satis_bedeli: number;
  toplam_odenen: number;
  kalan: number;
  karkas_agirlik: number;
  canli_agirlik: number;
  hisseler: SeedHisse[];
}

interface SeedDosya {
  kurbanlar: SeedKurban[];
}

function yuvarla(n: number): number {
  return Math.round(n * 100) / 100;
}

function normalize(ad: string | null): string {
  return (ad ?? "").trim().toUpperCase();
}

async function adminKullaniciOlustur() {
  const mevcut = await prisma.kullanici.findUnique({
    where: { kullaniciAdi: "admin" },
  });
  if (mevcut) {
    console.log("✓ admin kullanıcısı zaten var, atlanıyor");
    return mevcut;
  }

  const sifreHash = await bcrypt.hash("tilbe2026", 10);
  const k = await prisma.kullanici.create({
    data: {
      kullaniciAdi: "admin",
      sifreHash,
      adSoyad: "Tilbe Yönetici",
      rol: "admin",
    },
  });
  console.log("✓ admin kullanıcısı oluşturuldu (admin / tilbe2026)");
  return k;
}

async function varsayilanAyarlar() {
  const ayarlar: { anahtar: string; deger: string }[] = [
    { anahtar: "firma_adi", deger: "Tilbe Kurban" },
    { anahtar: "firma_telefon", deger: "0530 889 54 34" },
    { anahtar: "firma_adres", deger: "Sakarya / Serdivan" },
    {
      anahtar: "dekont_alt_yazi",
      deger: "Tilbe Kurban'a güvendiğiniz için teşekkür ederiz.",
    },
    { anahtar: "dekont_prefix", deger: "TKR-2026-" },
    { anahtar: "yedek_saatlik_aktif", deger: "true" },
  ];

  for (const a of ayarlar) {
    await prisma.ayar.upsert({
      where: { anahtar: a.anahtar },
      update: {},
      create: a,
    });
  }
  console.log(`✓ ${ayarlar.length} varsayılan ayar yüklendi`);
}

async function musteriBulVeyaOlustur(
  ad: string,
  telefon: string | null,
): Promise<number> {
  const adNorm = normalize(ad);
  if (!adNorm) {
    throw new Error("Hissedar adı boş");
  }

  // Aynı ad + telefon kombinasyonu varsa onu kullan
  if (telefon) {
    const mevcut = await prisma.musteri.findFirst({
      where: { adSoyad: adNorm, telefon },
    });
    if (mevcut) return mevcut.id;
  } else {
    const mevcut = await prisma.musteri.findFirst({
      where: { adSoyad: adNorm, telefon: null },
    });
    if (mevcut) return mevcut.id;
  }

  const yeni = await prisma.musteri.create({
    data: { adSoyad: adNorm, telefon: telefon ?? null },
  });
  return yeni.id;
}

let dekontSayac = 0;

function yeniDekontNo(prefix = "TKR-2026-"): string {
  dekontSayac += 1;
  return prefix + String(dekontSayac).padStart(6, "0");
}

async function seedKurbanlar(kullaniciId: number) {
  const dosyaYolu = path.join(process.cwd(), "seed-data.json");
  if (!fs.existsSync(dosyaYolu)) {
    console.log("! seed-data.json bulunamadı, kurban seed atlanıyor");
    return;
  }

  const ham = fs.readFileSync(dosyaYolu, "utf-8");
  const veri = JSON.parse(ham) as SeedDosya;
  console.log(`→ ${veri.kurbanlar.length} kurban yükleniyor…`);

  // Dekont sayacını mevcut en yüksek sayıdan devam ettir
  const sonOdeme = await prisma.odeme.findFirst({
    orderBy: { id: "desc" },
    select: { dekontNo: true },
  });
  if (sonOdeme?.dekontNo) {
    const m = sonOdeme.dekontNo.match(/(\d+)$/);
    if (m) dekontSayac = parseInt(m[1]!, 10);
  }

  let kurbanSayisi = 0;
  let hisseSayisi = 0;
  let odemeSayisi = 0;

  for (const k of veri.kurbanlar) {
    const kurban = await prisma.kurban.upsert({
      where: { kesimSirasi: k.kesim_sirasi },
      update: {
        kupeNo: k.kupe_no,
        kesimSaati: k.kesim_saati,
        hisseSayisi: k.hisse_sayisi || 7,
        satisBedeli: yuvarla(k.satis_bedeli),
        canliAgirlik: k.canli_agirlik || 0,
        karkasAgirlik: k.karkas_agirlik || 0,
      },
      create: {
        kesimSirasi: k.kesim_sirasi,
        kesimSaati: k.kesim_saati,
        kupeNo: k.kupe_no,
        hisseSayisi: k.hisse_sayisi || 7,
        satisBedeli: yuvarla(k.satis_bedeli),
        canliAgirlik: k.canli_agirlik || 0,
        karkasAgirlik: k.karkas_agirlik || 0,
        durum: "aktif",
      },
    });
    kurbanSayisi += 1;

    for (const h of k.hisseler) {
      const musteriId = h.hissedar
        ? await musteriBulVeyaOlustur(h.hissedar, h.telefon)
        : null;

      const hisse = await prisma.hisse.upsert({
        where: {
          kurbanId_no: { kurbanId: kurban.id, no: h.no },
        },
        update: {
          musteriId,
          hisseFiyati: yuvarla(h.hisse_fiyati),
        },
        create: {
          kurbanId: kurban.id,
          no: h.no,
          musteriId,
          hisseFiyati: yuvarla(h.hisse_fiyati),
        },
      });
      hisseSayisi += 1;

      for (const o of h.odemeler) {
        const dekontNo = yeniDekontNo();
        // Mevcut bir kayıt varsa atla (idempotent seed)
        const tutar = yuvarla(o.tutar);
        await prisma.odeme.create({
          data: {
            hisseId: hisse.id,
            tarih: new Date(o.tarih),
            nakit: tutar,
            havale: 0,
            kart: 0,
            toplamTutar: tutar,
            yontem: "nakit",
            notlar: `Seed: kapora #${o.sira}`,
            dekontNo,
            kullaniciId,
          },
        });

        await prisma.kasaHareketi.create({
          data: {
            tip: "tahsilat",
            tutar,
            yontem: "nakit",
            aciklama: `Kapora — ${kurban.kesimSirasi}.${h.no}`,
            tarih: new Date(o.tarih),
            kullaniciId,
          },
        });
        odemeSayisi += 1;
      }
    }
  }

  console.log(
    `✓ ${kurbanSayisi} kurban / ${hisseSayisi} hisse / ${odemeSayisi} ödeme yüklendi`,
  );
}

async function main() {
  console.log("\n=== Tilbe Kurban Seed ===\n");
  const admin = await adminKullaniciOlustur();
  await varsayilanAyarlar();
  await seedKurbanlar(admin.id);
  console.log("\n✓ Seed tamamlandı.\n");
}

main()
  .catch((e) => {
    console.error("Seed hatası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
