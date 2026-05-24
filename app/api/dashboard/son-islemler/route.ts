import { NextResponse } from "next/server";
import { aktifOturum } from "@/shared/lib/session";
import { sonIslemler } from "@/modules/dashboard/lib/dashboard.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok" },
      { status: 401 },
    );
  }
  try {
    const veri = await sonIslemler(10);
    return NextResponse.json({ basarili: true, veri });
  } catch (e) {
    console.error("son işlemler hatası:", e);
    return NextResponse.json(
      { basarili: false, hata: "Veri alınamadı" },
      { status: 500 },
    );
  }
}
