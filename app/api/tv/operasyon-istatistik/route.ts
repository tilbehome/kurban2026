import { NextResponse } from "next/server";
import { getOperasyonIstatistik } from "@/modules/tv/lib/tv.service";

export const dynamic = "force-dynamic";

/**
 * 5 aşama (vekalet/kesim/parcalama/tartim/teslim) sayıları.
 * REST fallback — SSE zaten getTumVeriler içinde bunu da push ediyor.
 */
export async function GET() {
  try {
    const veri = await getOperasyonIstatistik();
    return NextResponse.json({ basarili: true, veri });
  } catch (e) {
    console.error("operasyon-istatistik hatası:", e);
    return NextResponse.json(
      { basarili: false, hata: "Veri alınamadı" },
      { status: 500 },
    );
  }
}
