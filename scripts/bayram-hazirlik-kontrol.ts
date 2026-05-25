/**
 * Bayram öncesi sistem sağlık kontrolü.
 *
 * Çalıştır:
 *   pnpm tsx scripts/bayram-hazirlik-kontrol.ts
 *
 * Verir:
 *   - Veri sayımı (müşteri, kurban, hisse, ödeme, dekont)
 *   - Mali durum (toplam bedel/ödenen/borç, tahsilat oranı)
 *   - Vekalet durumu
 *   - Aktif kullanıcılar (rol + görev)
 *   - Sistem ayarları
 *   - Telefonsuz müşteri sayısı
 *   - Bayram sayacı
 *   - Uyarılar
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function kontrol() {
  console.log("\nADA BEREKET HAYVANCILIK — BAYRAM HAZIRLIK KONTROL\n");
  console.log("=".repeat(60));

  const [
    musteriSayisi,
    kurbanSayisi,
    hisseSayisi,
    doluHisse,
    odemeSayisi,
    dekontSayisi,
  ] = await Promise.all([
    prisma.musteri.count({ where: { silindiMi: false } }),
    prisma.kurban.count({ where: { silindiMi: false } }),
    prisma.hisse.count({ where: { silindiMi: false } }),
    prisma.hisse.count({
      where: { silindiMi: false, musteriId: { not: null } },
    }),
    prisma.odeme.count({ where: { silindiMi: false, iptal: false } }),
    prisma.odeme.count({ where: { dekontNo: { startsWith: "ABH-2026-" } } }),
  ]);

  console.log("\nVERİ SAYIMI");
  console.log(`  Müşteriler: ${musteriSayisi}`);
  console.log(`  Kurbanlar: ${kurbanSayisi}`);
  console.log(
    `  Hisseler: ${hisseSayisi} (${doluHisse} dolu, ${hisseSayisi - doluHisse} boş)`,
  );
  console.log(`  Aktif ödemeler: ${odemeSayisi}`);
  console.log(`  ABH-2026 dekontlar: ${dekontSayisi}`);

  const tumHisseler = await prisma.hisse.findMany({
    where: { silindiMi: false, musteriId: { not: null } },
    select: {
      hisseFiyati: true,
      odemeler: {
        where: { iptal: false, silindiMi: false },
        select: { toplamTutar: true },
      },
    },
  });

  let toplamBedel = 0;
  let toplamOdenen = 0;
  tumHisseler.forEach((h) => {
    toplamBedel += h.hisseFiyati;
    h.odemeler.forEach((o) => (toplamOdenen += o.toplamTutar));
  });
  const toplamBorc = toplamBedel - toplamOdenen;
  const tahsilatOrani =
    toplamBedel > 0 ? ((toplamOdenen / toplamBedel) * 100).toFixed(1) : "0.0";

  console.log("\nMALİ DURUM");
  console.log(`  Toplam bedel:  ${toplamBedel.toLocaleString("tr-TR")} TL`);
  console.log(`  Toplam ödenen: ${toplamOdenen.toLocaleString("tr-TR")} TL`);
  console.log(`  Toplam borç:   ${toplamBorc.toLocaleString("tr-TR")} TL`);
  console.log(`  Tahsilat oranı: %${tahsilatOrani}`);

  const vekaletAlinan = await prisma.hisse.count({
    where: {
      silindiMi: false,
      musteriId: { not: null },
      vekaletAlindi: true,
    },
  });
  const vekaletEksik = doluHisse - vekaletAlinan;

  console.log("\nVEKALET DURUMU");
  console.log(`  Vekaleti alınan: ${vekaletAlinan}/${doluHisse}`);
  console.log(`  Eksik vekalet:   ${vekaletEksik}`);

  const kullanicilar = await prisma.kullanici.findMany({
    where: { silindiMi: false, aktif: true },
    select: { kullaniciAdi: true, adSoyad: true, rol: true, gorev: true },
  });
  console.log("\nAKTİF KULLANICILAR");
  kullanicilar.forEach((k) => {
    const gorev = k.gorev ? `, görev: ${k.gorev}` : "";
    console.log(`  ${k.kullaniciAdi} (${k.adSoyad}, ${k.rol}${gorev})`);
  });

  const ayarlar = await prisma.ayar.findMany({
    where: {
      anahtar: {
        in: [
          "firma_adi",
          "firma_telefon",
          "marka_rengi",
          "dekont_prefix",
          "public_url",
          "firma_sube_aktif",
        ],
      },
    },
  });
  console.log("\nSİSTEM AYARLARI");
  ayarlar.forEach((a) => {
    console.log(`  ${a.anahtar}: ${a.deger}`);
  });

  const telefonsuzMusteri = await prisma.musteri.count({
    where: {
      silindiMi: false,
      OR: [{ telefon: null }, { telefon: "" }],
    },
  });
  console.log("\nİLETİŞİM");
  console.log(
    `  Telefonsuz müşteri: ${telefonsuzMusteri} (WhatsApp gönderilemez)`,
  );

  const hisseGrubuKayitli = await prisma.kurban.count({
    where: { silindiMi: false, hisseGrubu: { not: null } },
  });
  const hisseGrubuEksik = kurbanSayisi - hisseGrubuKayitli;
  console.log("\nHİSSE GRUBU (KG)");
  console.log(`  Kayıtlı: ${hisseGrubuKayitli}/${kurbanSayisi}`);
  console.log(`  Eksik:   ${hisseGrubuEksik}`);

  const bugun = new Date();
  const bayram = new Date("2026-05-27T00:00:00+03:00");
  const fark = Math.floor(
    (bayram.getTime() - bugun.getTime()) / (1000 * 60 * 60 * 24),
  );
  console.log("\nBAYRAM SAYACI");
  console.log(`  Bugün: ${bugun.toLocaleDateString("tr-TR")}`);
  console.log(`  Bayram: 27 Mayıs 2026 Çarşamba`);
  console.log(
    `  Kalan: ${fark >= 0 ? `${fark} gün` : `${Math.abs(fark)} gün geçti`}`,
  );

  console.log("\n" + "=".repeat(60));
  console.log("KONTROL TAMAMLANDI\n");

  const uyarilar: string[] = [];
  if (vekaletEksik > 0) {
    uyarilar.push(`! ${vekaletEksik} hisse vekalet eksik`);
  }
  if (hisseSayisi - doluHisse > 0) {
    uyarilar.push(`! ${hisseSayisi - doluHisse} boş hisse var`);
  }
  if (toplamBorc > 0) {
    uyarilar.push(
      `! Toplam ${toplamBorc.toLocaleString("tr-TR")} TL borç açık`,
    );
  }
  if (telefonsuzMusteri > 0) {
    uyarilar.push(`! ${telefonsuzMusteri} müşterinin telefonu eksik`);
  }
  if (hisseGrubuEksik > 0) {
    uyarilar.push(`! ${hisseGrubuEksik} kurbanın hisse grubu (kg) belirsiz`);
  }
  if (dekontSayisi === 0) {
    uyarilar.push(`! Henüz ABH-2026 dekont yok (tahsilat başlamamış)`);
  }

  if (uyarilar.length > 0) {
    console.log("UYARILAR:");
    uyarilar.forEach((u) => console.log("  " + u));
  } else {
    console.log("Hiçbir uyarı yok — sistem bayrama hazır!");
  }

  console.log("\n");

  await prisma.$disconnect();
}

kontrol().catch(async (e) => {
  console.error("Kontrol hatası:", e);
  await prisma.$disconnect();
  process.exit(1);
});
