import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { yayinla } from "@/shared/lib/events";
import { auditLog, ipCikar } from "@/shared/lib/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const TransferSchema = z.object({
  yeniMusteriId: z.string().min(1),
  sebep: z.string().max(500).optional(),
});

/**
 * Hisseyi başka müşteriye devret.
 * - Mevcut müşterinin yapılan ödemeleri korunur (ödeme kaydı hisseId ile bağlı)
 * - Yeni müşteri hisseyi üstlenir (musteriId güncellenir)
 * - Audit log ile her iki taraf da kaydedilir
 *
 * NOT: Ödeme transferi yapılmaz — ödemeler hisseye bağlı, hisse yeni
 * müşteriye geçtiğinde ödeme de "yeni müşterinin lehine" sayılır.
 * Burhan Bey'in iş kuralı: hisse devirleri kapanış sırasında manuel
 * mahsuplaşır.
 */
export async function POST(req: Request, { params }: RouteParams) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok" },
      { status: 401 },
    );
  }
  if (!izinKontrol(oturum, "hisseler.transfer")) {
    return NextResponse.json(
      { basarili: false, hata: "Transfer yetkiniz yok" },
      { status: 403 },
    );
  }

  const { id: hisseId } = await params;

  let veri: z.infer<typeof TransferSchema>;
  try {
    const govde = (await req.json()) as unknown;
    veri = TransferSchema.parse(govde);
  } catch (e) {
    const m = e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz veri";
    return NextResponse.json({ basarili: false, hata: m }, { status: 400 });
  }

  const hisse = await prisma.hisse.findUnique({
    where: { id: hisseId },
    include: { musteri: { select: { id: true, adSoyad: true } } },
  });
  if (!hisse) {
    return NextResponse.json(
      { basarili: false, hata: "Hisse bulunamadı" },
      { status: 404 },
    );
  }
  if (hisse.silindiMi) {
    return NextResponse.json(
      { basarili: false, hata: "Silinmiş hisse transfer edilemez" },
      { status: 400 },
    );
  }
  if (!hisse.musteriId) {
    return NextResponse.json(
      { basarili: false, hata: "Boş hisse transfer edilemez (atayın)" },
      { status: 400 },
    );
  }

  const yeniMusteri = await prisma.musteri.findUnique({
    where: { id: veri.yeniMusteriId },
    select: { id: true, adSoyad: true },
  });
  if (!yeniMusteri) {
    return NextResponse.json(
      { basarili: false, hata: "Hedef müşteri bulunamadı" },
      { status: 404 },
    );
  }
  if (yeniMusteri.id === hisse.musteriId) {
    return NextResponse.json(
      {
        basarili: false,
        hata: "Hedef müşteri zaten bu hissenin sahibi",
      },
      { status: 400 },
    );
  }

  const eskiMusteriId = hisse.musteriId;
  const eskiMusteriAd = hisse.musteri?.adSoyad ?? "?";

  await prisma.hisse.update({
    where: { id: hisseId },
    data: { musteriId: yeniMusteri.id },
  });

  await auditLog({
    eylem: "hisse-transfer",
    model: "Hisse",
    kayitId: hisseId,
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: {
      eskiMusteriId,
      eskiMusteriAd,
      yeniMusteriId: yeniMusteri.id,
      yeniMusteriAd: yeniMusteri.adSoyad,
      sebep: veri.sebep ?? null,
    },
  });

  yayinla("hisse:transfer", {
    hisseId,
    eskiMusteriId,
    yeniMusteriId: yeniMusteri.id,
  });

  return NextResponse.json({ basarili: true });
}
