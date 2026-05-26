import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { auditLog, ipCikar } from "@/shared/lib/audit";
import {
  pushFiltreliGonder,
  vapidHazirMi,
  type PushPayload,
} from "@/shared/lib/web-push";

export const dynamic = "force-dynamic";

/**
 * Push gönder — FAZ 9.6: web-push ile gerçek arka plan bildirim + DB log.
 *
 * İki katman:
 * 1. BildirimLog DB'ye yazılır (foreground polling için — FAZ 9.5 davranışı)
 * 2. web-push ile abonelere arka plan push (sayfa kapalıyken de bildirim)
 *
 * Tetikleyiciler:
 *  - Aşama değişikliği (otomatik, /api/tv/kurban-asama içinden tetiklenir)
 *  - Admin manuel (TV kontrol panelinden)
 */

const PushSchema = z.object({
  musteriId: z.string().nullable().optional(),
  kurbanId: z.string().nullable().optional(),
  baslik: z.string().min(1).max(200),
  mesaj: z.string().min(1).max(500),
  url: z.string().max(500).optional(),
  sablon: z.string().max(80).optional(),
  onemli: z.boolean().optional(),
  /** true ise tüm aktif abonelere yayın (sadece admin) */
  tumune: z.boolean().optional(),
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

  // KATMAN 1 — DB log (foreground polling fallback)
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

  // KATMAN 2 — web-push ile arka plan bildirim
  let pushSonuc = { basarili: 0, hata: 0, toplam: 0 };
  if (vapidHazirMi()) {
    const payload: PushPayload = {
      baslik: veri.baslik,
      govde: veri.mesaj,
      url: veri.url ?? "/",
      etiket: veri.sablon,
      bildirimId: log.id,
      onemli: veri.onemli,
    };

    if (veri.tumune) {
      pushSonuc = await pushFiltreliGonder(
        { tumune: true },
        payload,
        oturum.kullaniciId,
      );
    } else if (veri.musteriId) {
      pushSonuc = await pushFiltreliGonder(
        { musteriId: veri.musteriId },
        payload,
        oturum.kullaniciId,
      );
    } else if (veri.kurbanId) {
      pushSonuc = await pushFiltreliGonder(
        { oturumKey: veri.kurbanId },
        payload,
        oturum.kullaniciId,
      );
    }
  }

  await auditLog({
    eylem: "tv-push-abonelik",
    model: "BildirimLog",
    kayitId: log.id,
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: {
      baslik: veri.baslik,
      pushSonuc,
      hedef: veri.tumune
        ? "tumune"
        : veri.musteriId
          ? "musteri"
          : veri.kurbanId
            ? "kurban"
            : "log-only",
    },
  });

  return NextResponse.json({
    basarili: true,
    logId: log.id,
    push: pushSonuc,
  });
}

/**
 * GET: müşteri/kurban için yeni bildirimleri çek (client polling).
 * Query: ?musteriId=... veya ?kurbanId=... veya ?endpoint=...
 * Query: ?sonrasi=ISO (bu zamandan sonra olanlar)
 *
 * SPRINT-P4 İŞ 4: BildirimLog PII içerir (başlık + müşteri eşleşmesi).
 * Auth zorunlu (önceki sürümde middleware whitelist'inde olduğundan
 * herkese açıktı).
 */
export async function GET(req: NextRequest) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok" },
      { status: 401 },
    );
  }

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
