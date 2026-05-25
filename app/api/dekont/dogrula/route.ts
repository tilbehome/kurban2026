/**
 * Public dekont doğrulama endpoint'i — auth gerektirmez.
 *
 * Body: { dekontNo: string, dogrulamaKodu: string }
 * Yanıt: { gecerli: boolean, dekont?: {...} }
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { formatTarihSaat } from "@/shared/lib/tarih";
import { dogrulamaKoduGecerliMi } from "@/modules/tahsilat/dekont/dekont-dogrulama-kodu";

const Body = z.object({
  dekontNo: z.string().min(3).max(50),
  dogrulamaKodu: z.string().min(3).max(20),
});

export async function POST(req: NextRequest) {
  let payload: z.infer<typeof Body>;
  try {
    payload = Body.parse(await req.json());
  } catch {
    return NextResponse.json(
      { gecerli: false, hata: "Geçersiz istek" },
      { status: 400 },
    );
  }

  const odeme = await prisma.odeme.findUnique({
    where: { dekontNo: payload.dekontNo },
    include: {
      hisse: {
        include: {
          kurban: { select: { kesimSirasi: true } },
          musteri: { select: { adSoyad: true } },
        },
      },
    },
  });

  if (!odeme || odeme.iptal) {
    return NextResponse.json({ gecerli: false }, { status: 200 });
  }

  const dogruMu = dogrulamaKoduGecerliMi(
    {
      dekontNo: odeme.dekontNo,
      tarih: odeme.tarih,
      toplamTutar: odeme.toplamTutar,
    },
    payload.dogrulamaKodu,
  );

  if (!dogruMu) {
    return NextResponse.json({ gecerli: false }, { status: 200 });
  }

  return NextResponse.json({
    gecerli: true,
    dekont: {
      dekontNo: odeme.dekontNo,
      tarih: formatTarihSaat(odeme.tarih),
      toplamTutar: odeme.toplamTutar,
      musteriAdi: odeme.hisse.musteri?.adSoyad ?? "—",
      kurbanNo: odeme.hisse.kurban.kesimSirasi,
      hisseNo: odeme.hisse.no,
    },
  });
}
