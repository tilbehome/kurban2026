import { NextRequest, NextResponse } from "next/server";
import { akilliAra } from "@/modules/tv/lib/musteri-bul";

export const dynamic = "force-dynamic";

/**
 * Public akıllı arama — müşteri / kurban / telefon / kod.
 * /tv/m giriş ekranı için.
 */
export async function GET(req: NextRequest) {
  const sorgu = req.nextUrl.searchParams.get("q") ?? "";
  if (sorgu.trim().length === 0) {
    return NextResponse.json({ basarili: true, sonuc: { tip: null } });
  }
  try {
    const sonuc = await akilliAra(sorgu);
    return NextResponse.json({ basarili: true, sonuc });
  } catch (e) {
    console.error("musteri-bul hatası:", e);
    return NextResponse.json(
      { basarili: false, hata: "Arama hatası" },
      { status: 500 },
    );
  }
}
