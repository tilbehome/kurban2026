import { NextResponse } from "next/server";
import { aktifOturum } from "@/shared/lib/session";
import { kesimAkisiVerisi } from "@/modules/dashboard/lib/dashboard.service";

export const dynamic = "force-dynamic";

/**
 * Kesim operasyon akışı — şu an demo veri (gerçek kesim modülü Faz 2'de).
 */
export async function GET() {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok" },
      { status: 401 },
    );
  }
  try {
    const veri = await kesimAkisiVerisi();
    return NextResponse.json({ basarili: true, veri });
  } catch (e) {
    console.error("kesim akış hatası:", e);
    return NextResponse.json(
      { basarili: false, hata: "Veri alınamadı" },
      { status: 500 },
    );
  }
}
