/**
 * Manuel yedek tetikleme — SPRINT-P1 İŞ 4.
 *
 * Mevcut `/api/yedek` POST sadece admin'e izin verir; bu endpoint
 * granular izin sistemini (yedek.manuel) kullanır, kasiyer rolünün
 * de bayram günü yedek tetikleyebilmesi için ayrılmıştır.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { yedekAl, yedekDogrula, sonYedekBilgisi } from "@/shared/lib/backup";
import { auditLog, ipCikar } from "@/shared/lib/audit";

const Govde = z.object({
  neden: z.string().max(40).optional(),
});

export async function POST(req: Request) {
  const oturum = await aktifOturum();
  if (!oturum || !izinKontrol(oturum, "yedek.manuel")) {
    return NextResponse.json({ hata: "Yetki yok" }, { status: 403 });
  }

  let neden: string | undefined;
  try {
    const govde = (await req.json()) as unknown;
    neden = Govde.parse(govde).neden;
  } catch {
    neden = "manuel";
  }

  const sonuc = await yedekAl(neden ?? "manuel");

  // Yedek alındı, integrity verify et
  let dogrulamaMesaj: string | null = null;
  if (sonuc.basarili && sonuc.yedekYolu) {
    const d = yedekDogrula(sonuc.yedekYolu);
    if (!d.gecerliMi) {
      dogrulamaMesaj = d.hata;
    }
  }

  await auditLog({
    eylem: "yedek-manuel",
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: {
      neden: neden ?? "manuel",
      basarili: sonuc.basarili,
      yedekYolu: sonuc.yedekYolu,
      boyutKB: sonuc.boyutKB,
      hata: sonuc.hata,
      dogrulama: dogrulamaMesaj ?? "ok",
    },
  });

  if (!sonuc.basarili) {
    return NextResponse.json(
      { basarili: false, hata: sonuc.hata },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      ...sonuc,
      dogrulama: dogrulamaMesaj ? { hata: dogrulamaMesaj } : { gecerli: true },
      sonBilgi: sonYedekBilgisi(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
