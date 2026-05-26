import { NextRequest, NextResponse } from "next/server";
import { akilliAra } from "@/modules/tv/lib/musteri-bul";
import { rateLimitKontrol } from "@/shared/lib/rate-limit";
import { telefonMaskele } from "@/shared/lib/telefon";
import { ipCikar } from "@/shared/lib/audit";

export const dynamic = "force-dynamic";

// SPRINT-MUSTERI-GIRIS-V2: saf rakam (kurban sıra no) için 1 hane yeterli;
// telefon/metin için min 3 (alfabe tarama saldırısı koruması + KVKK).
const MIN_SORGU_GENEL = 3;
const MIN_SORGU_KURBAN_NO = 1;
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

  // Saf rakam (1-4 hane) → kurban sıra no araması, 1 karakter yeter.
  // Diğer (telefon/metin) → min 3 karakter (KVKK + bot tarama).
  const sadeceRakam = /^\d+$/.test(sorgu);
  const kurbanNoAramasi = sadeceRakam && sorgu.length <= 4;

  if (sorgu.length < MIN_SORGU_KURBAN_NO) {
    return NextResponse.json({ basarili: true, sonuc: { tip: null } });
  }
  if (!kurbanNoAramasi && sorgu.length < MIN_SORGU_GENEL) {
    return NextResponse.json({
      basarili: true,
      sonuc: {
        tip: null,
        mesaj: `En az ${MIN_SORGU_GENEL} karakter girin (kurban no için 1+ rakam yeterli)`,
      },
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
