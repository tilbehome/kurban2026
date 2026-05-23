import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { aktifOturum } from "@/shared/lib/session";
import { borclular } from "@/modules/raporlar/lib/rapor.service";
import { formatTarih } from "@/shared/lib/tarih";

export async function GET() {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json({ hata: "Yetki yok" }, { status: 401 });
  }

  const liste = await borclular();

  const veri = liste.map((b, i) => ({
    Sıra: i + 1,
    "Ad Soyad": b.adSoyad,
    Telefon: b.telefon ?? "",
    "Hisse Sayısı": b.hisseSayisi,
    "Toplam Bedel": b.toplamBedel,
    Ödenen: b.toplamOdenen,
    Kalan: b.kalan,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(veri);
  ws["!cols"] = [
    { wch: 5 },
    { wch: 30 },
    { wch: 16 },
    { wch: 6 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Borclular");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="tilbe-borclular-${formatTarih(new Date()).replace(/\./g, "-")}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
