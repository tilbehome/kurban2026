import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { auditLog, ipCikar } from "@/shared/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Push abonelik kaydı (public — müşteri ve personel telefonlarından).
 *
 * Bu uygulamada Web Push protokolünü kullanmıyoruz (server push paketi yok).
 * Bunun yerine endpoint'i DB'de tutuyoruz ve client polling ile
 * yeni bildirimleri çekiyor (BildirimLog tablosu).
 *
 * NOT: Tarayıcının Notification API'sı sayfa açıkken bildirim gösterir.
 * Tarayıcı arka plandayken sadece Web Push API ile çalışır (paket gerekir).
 * Bayram öncesi: müşteri sayfayı açık tutar → bildirim çalışır.
 */

const AbonelikSchema = z.object({
  musteriId: z.string().nullable().optional(),
  kurbanId: z.string().nullable().optional(),
  // Client-side oluşturulmuş kimlik (sayfada localStorage'da)
  endpoint: z.string().min(8).max(500),
  p256dh: z.string().max(500).default(""),
  auth: z.string().max(500).default(""),
  userAgent: z.string().max(300).optional(),
});

export async function POST(req: Request) {
  let veri: z.infer<typeof AbonelikSchema>;
  try {
    const govde = (await req.json()) as unknown;
    veri = AbonelikSchema.parse(govde);
  } catch (e) {
    const m = e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz veri";
    return NextResponse.json({ basarili: false, hata: m }, { status: 400 });
  }

  // Upsert: aynı endpoint varsa güncelle
  const abonelik = await prisma.pushAbonelik.upsert({
    where: { endpoint: veri.endpoint },
    update: {
      musteriId: veri.musteriId ?? null,
      oturumKey: veri.kurbanId ?? null,
      p256dh: veri.p256dh,
      auth: veri.auth,
      aktif: true,
      userAgent: veri.userAgent,
    },
    create: {
      musteriId: veri.musteriId ?? null,
      oturumKey: veri.kurbanId ?? null,
      endpoint: veri.endpoint,
      p256dh: veri.p256dh,
      auth: veri.auth,
      userAgent: veri.userAgent,
      aktif: true,
    },
  });

  await auditLog({
    eylem: "tv-push-abonelik",
    model: "PushAbonelik",
    kayitId: abonelik.id,
    ip: ipCikar(req),
    detaylar: {
      musteriId: veri.musteriId,
      kurbanId: veri.kurbanId,
    },
  });

  return NextResponse.json({ basarili: true, abonelikId: abonelik.id });
}

/** DELETE: aboneliği pasifle */
export async function DELETE(req: Request) {
  let veri: { endpoint?: string };
  try {
    veri = (await req.json()) as { endpoint?: string };
  } catch {
    return NextResponse.json(
      { basarili: false, hata: "Geçersiz veri" },
      { status: 400 },
    );
  }
  if (!veri.endpoint) {
    return NextResponse.json(
      { basarili: false, hata: "endpoint gerekli" },
      { status: 400 },
    );
  }
  await prisma.pushAbonelik.updateMany({
    where: { endpoint: veri.endpoint },
    data: { aktif: false },
  });
  return NextResponse.json({ basarili: true });
}
