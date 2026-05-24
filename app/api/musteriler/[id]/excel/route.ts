import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { formatTarih, formatTarihSaat } from "@/shared/lib/tarih";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Müşteri Excel export — 3 sheet:
 *  1. Özet (KPI)
 *  2. Hisseler
 *  3. Tahsilatlar
 */
export async function GET(_req: Request, { params }: RouteParams) {
  const oturum = await aktifOturum();
  if (!oturum || !izinKontrol(oturum, "musteriler.goruntule")) {
    return NextResponse.json({ basarili: false, hata: "Yetki yok" }, { status: 403 });
  }
  const { id } = await params;

  const musteri = await prisma.musteri.findFirst({
    where: { id, silindiMi: false },
    include: {
      hisseler: {
        where: { silindiMi: false },
        include: {
          kurban: { select: { kesimSirasi: true, kupeNo: true } },
          odemeler: {
            orderBy: { tarih: "desc" },
            include: { kullanici: { select: { adSoyad: true } } },
          },
        },
        orderBy: [{ kurban: { kesimSirasi: "asc" } }, { no: "asc" }],
      },
    },
  });
  if (!musteri) {
    return NextResponse.json(
      { basarili: false, hata: "Müşteri bulunamadı" },
      { status: 404 },
    );
  }

  const toplamBedel = musteri.hisseler.reduce((s, h) => s + h.hisseFiyati, 0);
  const toplamOdenen = musteri.hisseler
    .flatMap((h) => h.odemeler.filter((o) => !o.iptal))
    .reduce((s, o) => s + o.toplamTutar, 0);
  const kalan = toplamBedel - toplamOdenen;

  const wb = XLSX.utils.book_new();

  // 1) Özet
  const ozetSatirlari = [
    ["MÜŞTERİ ÖZETİ", ""],
    ["Ad Soyad", musteri.adSoyad],
    ["Telefon", musteri.telefon ?? "—"],
    ["TC Kimlik", musteri.tcKimlik ?? "—"],
    ["Adres", musteri.adres ?? "—"],
    ["Kayıt Tarihi", formatTarih(musteri.createdAt)],
    [],
    ["İSTATİSTİK", ""],
    ["Toplam Hisse", musteri.hisseler.length],
    ["Toplam Bedel (TL)", toplamBedel],
    ["Ödenen (TL)", toplamOdenen],
    ["Kalan (TL)", kalan],
    [],
    ["Düzenleme Tarihi", formatTarihSaat(new Date())],
  ];
  const wsOzet = XLSX.utils.aoa_to_sheet(ozetSatirlari);
  wsOzet["!cols"] = [{ wch: 22 }, { wch: 36 }];
  XLSX.utils.book_append_sheet(wb, wsOzet, "Özet");

  // 2) Hisseler
  const hisselerVeri = musteri.hisseler.map((h, i) => {
    const odenen = h.odemeler
      .filter((o) => !o.iptal)
      .reduce((s, o) => s + o.toplamTutar, 0);
    return {
      Sıra: i + 1,
      Kurban: h.kurban.kesimSirasi,
      "Hisse No": h.no,
      "Küpe No": h.kurban.kupeNo ?? "",
      Fiyat: h.hisseFiyati,
      Ödenen: odenen,
      Kalan: h.hisseFiyati - odenen,
      Vekalet: h.vekaletAlindi ? "Alındı" : "Bekliyor",
      Atanma: formatTarih(h.createdAt),
    };
  });
  const wsHisseler = XLSX.utils.json_to_sheet(hisselerVeri);
  wsHisseler["!cols"] = [
    { wch: 5 },
    { wch: 8 },
    { wch: 8 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, wsHisseler, "Hisseler");

  // 3) Tahsilatlar
  const tahsilatVeri = musteri.hisseler
    .flatMap((h) =>
      h.odemeler.map((o) => ({
        Tarih: formatTarihSaat(o.tarih),
        Dekont: o.dekontNo,
        Hisse: `${h.kurban.kesimSirasi}.${h.no}`,
        Tutar: o.toplamTutar,
        Yöntem: o.yontem,
        Nakit: o.nakit,
        Havale: o.havale,
        Kart: o.kart,
        Kasiyer: o.kullanici.adSoyad,
        İptal: o.iptal ? "EVET" : "",
        Notlar: o.notlar ?? "",
      })),
    )
    .sort((a, b) => b.Tarih.localeCompare(a.Tarih));
  const wsTahsilat = XLSX.utils.json_to_sheet(tahsilatVeri);
  wsTahsilat["!cols"] = [
    { wch: 18 },
    { wch: 18 },
    { wch: 8 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 16 },
    { wch: 8 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTahsilat, "Tahsilatlar");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  const safeAd = musteri.adSoyad.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
  const tarihStr = formatTarih(new Date()).replace(/\./g, "-");

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="musteri-${safeAd}-${tarihStr}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
