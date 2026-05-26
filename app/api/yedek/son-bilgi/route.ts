/**
 * En son yedek meta bilgisi — Dashboard yedek sağlık kartı için.
 * SPRINT-P1 İŞ 4.
 */
import { NextResponse } from "next/server";
import { aktifOturum } from "@/shared/lib/session";
import { sonYedekBilgisi } from "@/shared/lib/backup";

export async function GET() {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });
  }

  try {
    const bilgi = sonYedekBilgisi();
    return NextResponse.json(
      { basarili: true, veri: bilgi },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    console.error("[api/yedek/son-bilgi]", e);
    return NextResponse.json(
      { basarili: false, hata: "Yedek bilgisi alınamadı" },
      { status: 500 },
    );
  }
}
