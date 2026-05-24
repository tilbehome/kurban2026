import { NextResponse } from "next/server";
import { aktifOturum } from "@/shared/lib/session";
import { sidebarBildirimleri } from "@/shared/lib/sidebar-bildirim.service";

export const dynamic = "force-dynamic";

/**
 * Sidebar bildirim sayıları — borçlu, boş hisse, eksik vekalet vs.
 * Frontend her 30 saniyede bir polling yapar.
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
    const veri = await sidebarBildirimleri();
    return NextResponse.json({ basarili: true, veri });
  } catch (e) {
    console.error("sidebar bildirim hatası:", e);
    return NextResponse.json(
      { basarili: false, hata: "Bildirimler alınamadı" },
      { status: 500 },
    );
  }
}
