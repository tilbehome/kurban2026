import { NextResponse } from "next/server";
import { getTumVeriler } from "@/modules/tv/lib/tv.service";

export const dynamic = "force-dynamic";

/**
 * TV verileri REST fallback — SSE bağlanamazsa veya ilk SSR yüklemesi için.
 *
 * NOT: /tv public display olduğundan auth ZORUNLU DEĞİL.
 * (Müşteri ekranı + personel ortak görüyor; PII korunmuş — sadece kısaltma.)
 */
export async function GET() {
  try {
    const veri = await getTumVeriler();
    return NextResponse.json({ basarili: true, veri });
  } catch (e) {
    console.error("tv veriler hatası:", e);
    return NextResponse.json(
      { basarili: false, hata: "Veri alınamadı" },
      { status: 500 },
    );
  }
}
