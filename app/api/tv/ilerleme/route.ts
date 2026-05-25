import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { auditLog, ipCikar } from "@/shared/lib/audit";

const IlerlemeSchema = z
  .object({
    // Geriye uyum: hisseId hala kabul edilir
    hisseId: z.string().min(1).optional(),
    // Yeni: kurban bazlı (SPRINT-9)
    kurbanId: z.string().min(1).optional(),
    ilerlemeYuzde: z.number().int().min(0).max(100).optional(),
    kalanSureDk: z.number().int().min(0).max(1440).nullable().optional(),
    asama: z.string().nullable().optional(),
    // SPRINT-11: aşama sayacını manuel sıfırla
    resetSayac: z.boolean().optional(),
  })
  .refine((v) => v.hisseId || v.kurbanId, {
    message: "hisseId veya kurbanId zorunlu",
  });

/**
 * Kurban veya hisse seviyesi ilerleme güncelle (admin/kasiyer).
 *
 * - kurbanId verilirse: Kurban + tüm aktif hisseleri senkron güncellenir
 * - hisseId verilirse: tek hisse güncellenir (eski davranış)
 */
export async function PATCH(req: Request) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok" },
      { status: 401 },
    );
  }
  if (!izinKontrol(oturum, "tv.kontrol")) {
    return NextResponse.json(
      { basarili: false, hata: "TV kontrol yetkiniz yok" },
      { status: 403 },
    );
  }

  let veri: z.infer<typeof IlerlemeSchema>;
  try {
    const govde = (await req.json()) as unknown;
    veri = IlerlemeSchema.parse(govde);
  } catch (e) {
    const m = e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz veri";
    return NextResponse.json({ basarili: false, hata: m }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (veri.ilerlemeYuzde !== undefined) data.ilerlemeYuzde = veri.ilerlemeYuzde;
  if (veri.kalanSureDk !== undefined) data.kalanSureDk = veri.kalanSureDk;
  if (veri.asama !== undefined) data.asama = veri.asama;
  // resetSayac sadece Kurban tablosunda var (Hisse'de yok)
  const kurbanData = { ...data } as Record<string, unknown>;
  if (veri.resetSayac && veri.kurbanId) {
    kurbanData.asamaBaslangic = new Date();
  }

  if (Object.keys(kurbanData).length === 0 && Object.keys(data).length === 0) {
    return NextResponse.json(
      { basarili: false, hata: "Güncellenecek alan yok" },
      { status: 400 },
    );
  }

  try {
    if (veri.kurbanId) {
      await prisma.$transaction([
        prisma.kurban.update({
          where: { id: veri.kurbanId },
          data: kurbanData,
        }),
        prisma.hisse.updateMany({
          where: { kurbanId: veri.kurbanId, silindiMi: false },
          data,
        }),
      ]);

      await auditLog({
        eylem: "tv-ilerleme-guncelle",
        model: "Kurban",
        kayitId: veri.kurbanId,
        kullaniciId: oturum.kullaniciId,
        ip: ipCikar(req),
        detaylar: kurbanData,
      });

      return NextResponse.json({ basarili: true });
    }

    // Hisse bazlı (eski davranış)
    const guncel = await prisma.hisse.update({
      where: { id: veri.hisseId! },
      data,
    });

    await auditLog({
      eylem: "tv-ilerleme-guncelle",
      model: "Hisse",
      kayitId: veri.hisseId!,
      kullaniciId: oturum.kullaniciId,
      ip: ipCikar(req),
      detaylar: data,
    });

    return NextResponse.json({ basarili: true, veri: guncel });
  } catch (e) {
    console.error("ilerleme guncelle hatası:", e);
    return NextResponse.json(
      { basarili: false, hata: "Kayıt bulunamadı veya güncellenemedi" },
      { status: 404 },
    );
  }
}
