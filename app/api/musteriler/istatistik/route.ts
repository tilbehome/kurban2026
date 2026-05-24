import { NextResponse } from "next/server";
import { aktifOturum } from "@/shared/lib/session";
import { musteriIstatistik } from "@/modules/musteriler/lib/istatistik";

export async function GET() {
  const oturum = await aktifOturum();
  if (!oturum) return NextResponse.json({ hata: "Yetki yok" }, { status: 401 });

  const veri = await musteriIstatistik();
  return NextResponse.json({ basarili: true, ...veri });
}
