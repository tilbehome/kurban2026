import { NextResponse } from "next/server";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import {
  kasaDurumu,
  whatsappMetrik,
} from "@/modules/dashboard/lib/dashboard.service";

export const dynamic = "force-dynamic";

/**
 * Kasa durumu + WhatsApp metrik birlikte dönüyor — dashboard sağ alt
 * iki kart aynı interval'da refresh ediliyor, tek endpoint daha verimli.
 */
export async function GET() {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok" },
      { status: 401 },
    );
  }
  // Kasa görme izni gerekli
  if (!izinKontrol(oturum, "kasa.goruntule")) {
    return NextResponse.json(
      { basarili: false, hata: "Kasa görme yetkiniz yok" },
      { status: 403 },
    );
  }
  try {
    const [kasa, whatsapp] = await Promise.all([
      kasaDurumu(),
      whatsappMetrik(),
    ]);
    return NextResponse.json({ basarili: true, veri: { kasa, whatsapp } });
  } catch (e) {
    console.error("kasa durumu hatası:", e);
    return NextResponse.json(
      { basarili: false, hata: "Veri alınamadı" },
      { status: 500 },
    );
  }
}
