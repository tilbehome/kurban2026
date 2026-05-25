import { redirect } from "next/navigation";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { prisma } from "@/shared/lib/prisma";
import { KasaTeslimRaporuClient } from "@/modules/raporlar/components/KasaTeslimRaporuClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kasa Teslim Raporu · Ada Bereket Hayvancılık",
};

interface PageProps {
  searchParams: Promise<{ tarih?: string }>;
}

function gunBaslangic(tarih: Date): Date {
  const t = new Date(tarih);
  t.setHours(0, 0, 0, 0);
  return t;
}

function gunSonu(tarih: Date): Date {
  const t = new Date(tarih);
  t.setHours(23, 59, 59, 999);
  return t;
}

function tarihParse(metin: string | undefined): Date {
  if (!metin) return new Date();
  const t = new Date(metin);
  if (Number.isNaN(t.getTime())) return new Date();
  return t;
}

export default async function KasaTeslimRaporuPage({ searchParams }: PageProps) {
  const oturum = await aktifOturum();
  if (!oturum) {
    redirect("/giris?next=/raporlar/kasa-teslim");
  }
  if (!izinKontrol(oturum, "kasa.goruntule")) {
    redirect("/giris?next=/raporlar/kasa-teslim");
  }

  const params = await searchParams;
  const tarih = tarihParse(params.tarih);
  const baslangic = gunBaslangic(tarih);
  const sonu = gunSonu(tarih);

  const [odemeler, kasaHareketleri, firmaAdiRow, firmaAdresRow, firmaTelRow, firmaWebRow] =
    await Promise.all([
      prisma.odeme.findMany({
        where: {
          silindiMi: false,
          tarih: { gte: baslangic, lte: sonu },
        },
        orderBy: { tarih: "asc" },
        select: {
          id: true,
          dekontNo: true,
          tarih: true,
          nakit: true,
          havale: true,
          kart: true,
          toplamTutar: true,
          yontem: true,
          iptal: true,
          iptalSebep: true,
          iptalTarihi: true,
          notlar: true,
          kullanici: {
            select: { adSoyad: true, kullaniciAdi: true },
          },
          hisse: {
            select: {
              no: true,
              kurban: { select: { kesimSirasi: true } },
              musteri: { select: { adSoyad: true, telefon: true } },
            },
          },
        },
      }),
      prisma.kasaHareketi.findMany({
        where: {
          silindiMi: false,
          tarih: { gte: baslangic, lte: sonu },
        },
        orderBy: { tarih: "asc" },
        select: {
          id: true,
          tip: true,
          tutar: true,
          yontem: true,
          aciklama: true,
          tarih: true,
          kullanici: { select: { adSoyad: true } },
        },
      }),
      prisma.ayar.findUnique({ where: { anahtar: "firma_adi" } }),
      prisma.ayar.findUnique({ where: { anahtar: "firma_adres" } }),
      prisma.ayar.findUnique({ where: { anahtar: "firma_telefon" } }),
      prisma.ayar.findUnique({ where: { anahtar: "firma_web" } }),
    ]);

  return (
    <KasaTeslimRaporuClient
      tarihIso={baslangic.toISOString()}
      duzenleyenAd={oturum.adSoyad}
      firmaAdi={firmaAdiRow?.deger || "Ada Bereket Hayvancılık"}
      firmaAdres={firmaAdresRow?.deger || ""}
      firmaTelefon={firmaTelRow?.deger || ""}
      firmaWeb={firmaWebRow?.deger || "adaberekethayvancilik.com.tr"}
      odemeler={odemeler.map((o) => ({
        ...o,
        tarih: o.tarih.toISOString(),
        iptalTarihi: o.iptalTarihi?.toISOString() ?? null,
      }))}
      kasaHareketleri={kasaHareketleri.map((h) => ({
        ...h,
        tarih: h.tarih.toISOString(),
      }))}
    />
  );
}
