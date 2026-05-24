import { NextResponse } from "next/server";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { eksikHisseliMusteriler } from "@/modules/hayvanlar/lib/hisse-atama.service";

export const dynamic = "force-dynamic";

/**
 * Hisse atama sol paneli için müşteri listesi —
 * tüm aktif müşteriler + atanmış hisse özetleri.
 */
export async function GET() {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok" },
      { status: 401 },
    );
  }
  if (!izinKontrol(oturum, "musteriler.goruntule")) {
    return NextResponse.json(
      { basarili: false, hata: "Görüntüleme yetkiniz yok" },
      { status: 403 },
    );
  }
  try {
    const veri = await eksikHisseliMusteriler();
    return NextResponse.json({ basarili: true, veri });
  } catch (e) {
    console.error("eksik-hisseli hatası:", e);
    return NextResponse.json(
      { basarili: false, hata: "Veri alınamadı" },
      { status: 500 },
    );
  }
}
