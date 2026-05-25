import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";

export const dynamic = "force-dynamic";

/**
 * Push gönder — Web Push API olmadığı için DB'ye log atar.
 * Client tarayıcı polling ile (her 10sn) çekecek (BildirimLog).
 *
 * Tetikleyiciler:
 *  - Aşama değişikliği (otomatik, /api/tv/kurban-asama tarafından çağırılabilir)
 *  - Admin manuel (TV kontrol panelinden)
 */

const PushSchema = z.object({
  musteriId: z.string().nullable().optional(),
  kurbanId: z.string().nullable().optional(),
  baslik: z.string().min(1).max(200),
  mesaj: z.string().min(1).max(500),
  sablon: z.string().max(80).optional(),
});

/** POST: bildirim gönder (admin/kasiyer) */
export async function POST(req: Request) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok" },
      { status: 401 },
    );
  }
  if (!izinKontrol(oturum, "tv.kontrol")) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok" },
      { status: 403 },
    );
  }

  let veri: z.infer<typeof PushSchema>;
  try {
    const govde = (await req.json()) as unknown;
    veri = PushSchema.parse(govde);
  } catch (e) {
    const m = e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz veri";
    return NextResponse.json({ basarili: false, hata: m }, { status: 400 });
  }

  const log = await prisma.bildirimLog.create({
    data: {
      musteriId: veri.musteriId ?? null,
      kanal: "push",
      sablon: veri.sablon,
      baslik: veri.baslik,
      mesaj: veri.mesaj,
      durum: "gonderildi",
    },
  });

  return NextResponse.json({ basarili: true, logId: log.id });
}

/**
 * GET: müşteri/kurban için yeni bildirimleri çek (client polling).
 * Query: ?musteriId=... veya ?kurbanId=... veya ?endpoint=...
 * Query: ?sonrasi=ISO (bu zamandan sonra olanlar)
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const musteriId = sp.get("musteriId");
  const kurbanId = sp.get("kurbanId");
  const sonrasi = sp.get("sonrasi");

  const where: Record<string, unknown> = { kanal: "push" };
  if (musteriId) where.musteriId = musteriId;
  if (sonrasi) {
    const d = new Date(sonrasi);
    if (!Number.isNaN(d.getTime())) {
      where.createdAt = { gt: d };
    }
  }
  // kurbanId verilmişse: o kurbana kayıtlı müşterilerin bildirimleri
  if (kurbanId && !musteriId) {
    const musteriIds = await prisma.hisse.findMany({
      where: { kurbanId, silindiMi: false, musteriId: { not: null } },
      select: { musteriId: true },
    });
    where.musteriId = {
      in: musteriIds.map((h) => h.musteriId).filter((id): id is string => !!id),
    };
  }

  const bildirimler = await prisma.bildirimLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      baslik: true,
      mesaj: true,
      sablon: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ basarili: true, veri: bildirimler });
}
