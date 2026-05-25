/**
 * 8 hazır WhatsApp şablonu seed scripti.
 *
 * Çalıştır: pnpm tsx prisma/seed-whatsapp-sablonlari.ts
 *
 * Varsayilan=true olan şablonlar silinemez (UI guard).
 * Tekrar çalıştırılırsa: aynı ada sahip varsayılan şablonlar atlanır.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface SeedSablon {
  ad: string;
  kategori: "tahsilat" | "bayram" | "kesim" | "genel";
  icerik: string;
}

const SABLONLAR: SeedSablon[] = [
  {
    ad: "Borç Hatırlatma (Yumuşak)",
    kategori: "tahsilat",
    icerik: `Sayın {adSoyad},

Kurban ödemenizden {kalanTutar} kalmıştır. Bayrama {bayramGun} gün kaldı, en kısa sürede tarafınızdan ödenmesini rica ederiz.

Saygılarımızla,
{sirketAdi}
{sirketTel}`,
  },
  {
    ad: "Borç Hatırlatma (Sert)",
    kategori: "tahsilat",
    icerik: `Sayın {adSoyad},

Kurban ödemenizden hâlâ {kalanTutar} bekleniyor. Bayrama yalnızca {bayramGun} gün kaldı. Kesim öncesi ödemenin tamamlanması zorunludur. Bugün ödeme yapmanızı bekliyoruz.

{sirketAdi}
{sirketTel}`,
  },
  {
    ad: "Tahsilat Onayı",
    kategori: "tahsilat",
    icerik: `Sayın {adSoyad},

Ödemeniz alınmıştır. Dekont No: {dekontNo}
Ödenen Tutar: {odenenTutar}
Kalan: {kalanTutar}

Teşekkür ederiz.
{sirketAdi}`,
  },
  {
    ad: "Bayram Tebriği",
    kategori: "bayram",
    icerik: `Sayın {adSoyad},

Kurban Bayramınızı en içten dileklerimizle kutlar, sağlık, mutluluk ve bereket dolu günler dileriz. 🐂

{sirketAdi} ailesi olarak bayramınızın hayırlı olmasını temenni ediyoruz.`,
  },
  {
    ad: "Kurban Hazır - Et Teslimi",
    kategori: "kesim",
    icerik: `Sayın {adSoyad},

Kurban etiniz teslime hazırdır. Bugün {bugun} itibariyle çiftliğimizden alabilirsiniz.

Adres: {sirketAdi}
İletişim: {sirketTel}

Hayırlı bayramlar.`,
  },
  {
    ad: "Kesim Saati Bildirimi",
    kategori: "kesim",
    icerik: `Sayın {adSoyad},

Hisseniz bugün {bugun} tarihinde kesime alınacaktır. Hazır bulunmak isterseniz çiftliğimize gelebilirsiniz.

Hisse: {hisseSayisi} adet
İletişim: {sirketTel}

{sirketAdi}`,
  },
  {
    ad: "Genel Bilgilendirme",
    kategori: "genel",
    icerik: `Sayın {adSoyad},

[Buraya özel mesajınızı yazın]

Saygılarımızla,
{sirketAdi}
{sirketTel}`,
  },
  {
    ad: "Şehir Dışı Müşteri - Kargo",
    kategori: "kesim",
    icerik: `Sayın {adSoyad},

Kurban etiniz kargoya hazırlanmaktadır. Tahmini teslim 1-2 iş günü içindedir. Kargo takip kodu gönderildiğinde tarafınıza bilgi verilecektir.

Sorularınız için: {sirketTel}

{sirketAdi}`,
  },
];

async function main() {
  console.log("WhatsApp şablonları seed ediliyor...");
  let eklenen = 0;
  let atlanan = 0;

  for (const s of SABLONLAR) {
    const mevcut = await prisma.whatsAppSablonu.findFirst({
      where: { ad: s.ad, varsayilan: true },
    });
    if (mevcut) {
      atlanan++;
      console.log(`  ⏭  Zaten var: ${s.ad}`);
      continue;
    }
    await prisma.whatsAppSablonu.create({
      data: {
        ad: s.ad,
        kategori: s.kategori,
        icerik: s.icerik,
        aktifMi: true,
        varsayilan: true,
      },
    });
    eklenen++;
    console.log(`  ✓ Eklendi: ${s.ad}`);
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
