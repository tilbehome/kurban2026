import { NextRequest, NextResponse } from "next/server";
import { akilliAra } from "@/modules/tv/lib/musteri-bul";
import { rateLimitKontrol } from "@/shared/lib/rate-limit";
import { telefonMaskele } from "@/shared/lib/telefon";
import { ipCikar } from "@/shared/lib/audit";

export const dynamic = "force-dynamic";

const MIN_SORGU = 3;
const MAX_ISTEK = 30;
const PENCERE_SN = 60;

/**
 * Public akıllı arama — müşteri / kurban / telefon / kod.
 * /tv/m giriş ekranı için.
 *
 * Güvenlik:
 *  - IP bazlı rate limit (30 istek / dakika)
 *  - Minimum 3 karakter (alfabe tarama saldırısını engeller)
 *  - Telefon PII maskelendi
 */
export async function GET(req: NextRequest) {
  const ip = ipCikar(req) ?? "bilinmiyor";
  const limit = rateLimitKontrol(`musteri-bul:${ip}`, MAX_ISTEK, PENCERE_SN);
  if (!limit.izinli) {
    return NextResponse.json(
      {
        basarili: false,
        hata: `Çok hızlı sorgu. ${limit.kalanSn}sn sonra tekrar deneyin.`,
      },
      { status: 429 },
    );
  }

  const sorgu = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (sorgu.length < MIN_SORGU) {
    return NextResponse.json({
      basarili: true,
      sonuc: { tip: null, mesaj: `En az ${MIN_SORGU} karakter girin` },
    });
  }

  try {
    const sonuc = await akilliAra(sorgu);

    // PII maskele
    if (sonuc.musteri?.telefon) {
      sonuc.musteri.telefon = telefonMaskele(sonuc.musteri.telefon);
    }
    if (sonuc.musteriler) {
      sonuc.musteriler = sonuc.musteriler.map((m) => ({
        ...m,
        telefon: telefonMaskele(m.telefon),
      }));
    }

    return NextResponse.json({ basarili: true, sonuc });
  } catch (e) {
    console.error("musteri-bul hatası:", e);
    return NextResponse.json(
      { basarili: false, hata: "Arama hatası" },
      { status: 500 },
    );
  }
}
