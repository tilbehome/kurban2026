import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import type {
  GonderimDetay,
  GecmisHedefSatir,
} from "@/modules/whatsapp/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

/** GET: tek gönderim detayı (hedef listesi ile) */
export async function GET(_req: Request, { params }: RouteParams) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok" },
      { status: 401 },
    );
  }
  if (!izinKontrol(oturum, "whatsapp.gecmis")) {
    return NextResponse.json(
      { basarili: false, hata: "Görüntüleme yetkiniz yok" },
      { status: 403 },
    );
  }

  const { id } = await params;
  const g = await prisma.whatsAppGonderim.findUnique({
    where: { id },
    include: {
      sablon: { select: { id: true, ad: true, kategori: true } },
      kullanici: { select: { adSoyad: true } },
    },
  });
  if (!g || g.silindiMi) {
    return NextResponse.json(
      { basarili: false, hata: "Gönderim bulunamadı" },
      { status: 404 },
    );
  }

  let hedefler: GecmisHedefSatir[] = [];
  try {
    const parsed = JSON.parse(g.hedefler) as unknown;
    if (Array.isArray(parsed))
      hedefler = parsed as GecmisHedefSatir[];
  } catch {
    hedefler = [];
  }

  const veri: GonderimDetay = {
    id: g.id,
    sablonId: g.sablonId,
    sablonAd: g.sablon.ad,
    sablonKategorisi: g.sablon.kategori as GonderimDetay["sablonKategorisi"],
    baslamaTarihi: g.baslamaTarihi.toISOString(),
    bitisTarihi: g.bitisTarihi?.toISOString() ?? null,
    hedefSayisi: g.hedefSayisi,
    acilanSayisi: g.acilanSayisi,
    atlananSayisi: g.atlananSayisi,
    hataSayisi: g.hataSayisi,
    telefonsuzSayisi: g.telefonsuzSayisi,
    kullaniciId: g.kullaniciId,
    kullaniciAdSoyad: g.kullanici.adSoyad,
    not: g.not,
    hedefler,
  };

  return NextResponse.json({ basarili: true, veri });
}
