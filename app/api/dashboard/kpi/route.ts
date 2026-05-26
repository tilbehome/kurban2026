import { NextResponse } from "next/server";
import { aktifOturum } from "@/shared/lib/session";
import { kpiVerileri } from "@/modules/dashboard/lib/dashboard.service";

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
    const veri = await kpiVerileri(oturum);
    return NextResponse.json({ basarili: true, veri });
  } catch (e) {
    console.error("dashboard kpi hatası:", e);
    return NextResponse.json(
      { basarili: false, hata: "Veri alınamadı" },
      { status: 500 },
    );
  }
}
