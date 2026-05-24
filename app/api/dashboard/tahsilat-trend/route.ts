import { NextRequest, NextResponse } from "next/server";
import { aktifOturum } from "@/shared/lib/session";
import { tahsilatTrendVerisi } from "@/modules/dashboard/lib/dashboard.service";
import type { TrendAraligi } from "@/modules/dashboard/types";

export const dynamic = "force-dynamic";

const GECERLI_ARALIKLAR: TrendAraligi[] = ["bugun", "7gun", "30gun"];

export async function GET(req: NextRequest) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok" },
      { status: 401 },
    );
  }

  const aralik = req.nextUrl.searchParams.get("aralik") ?? "bugun";
  if (!GECERLI_ARALIKLAR.includes(aralik as TrendAraligi)) {
    return NextResponse.json(
      { basarili: false, hata: "Geçersiz aralık" },
      { status: 400 },
    );
  }

  try {
    const veri = await tahsilatTrendVerisi(aralik as TrendAraligi);
    return NextResponse.json({ basarili: true, veri });
  } catch (e) {
    console.error("trend hatası:", e);
    return NextResponse.json(
      { basarili: false, hata: "Veri alınamadı" },
      { status: 500 },
    );
  }
}
