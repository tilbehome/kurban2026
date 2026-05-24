import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { auditLog, ipCikar } from "@/shared/lib/audit";
import { adminMi, izinKontrol } from "@/shared/lib/izinler";

const GuncelleSchema = z.object({
  icerik: z.string().trim().min(1).max(1000).optional(),
  renk: z.enum(["bilgi", "uyari", "onemli", "hatirlat"]).optional(),
  sabitlendiMi: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string; notId: string }>;
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const oturum = await aktifOturum();
  if (!oturum || !izinKontrol(oturum, "musteriler.notlar.yaz")) {
    return NextResponse.json({ basarili: false, hata: "Yetki yok" }, { status: 403 });
  }
  const { id, notId } = await params;

  let veri: z.infer<typeof GuncelleSchema>;
  try {
    const govde = (await req.json()) as unknown;
    veri = GuncelleSchema.parse(govde);
  } catch (e) {
    const m = e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz veri";
    return NextResponse.json({ basarili: false, hata: m }, { status: 400 });
  }

  const not = await prisma.not.findFirst({
    where: { id: notId, musteriId: id, silindiMi: false },
  });
  if (!not) {
    return NextResponse.json(
      { basarili: false, hata: "Not bulunamadı" },
      { status: 404 },
    );
  }

  // Sadece sahip veya admin düzenleyebilir
  if (not.olusturanId !== oturum.kullaniciId && !adminMi(oturum.rol)) {
    return NextResponse.json(
      { basarili: false, hata: "Sadece kendi notunuzu düzenleyebilirsiniz" },
      { status: 403 },
    );
  }

  const guncelle: Record<string, unknown> = {};
  if (veri.icerik !== undefined) guncelle.icerik = veri.icerik;
  if (veri.renk !== undefined) guncelle.renk = veri.renk;
  if (veri.sabitlendiMi !== undefined) guncelle.sabitlendiMi = veri.sabitlendiMi;

  await prisma.not.update({ where: { id: notId }, data: guncelle });

  await auditLog({
    eylem: "guncelle",
    model: "Not",
    kayitId: id,
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: { notId, degisiklik: veri },
  });

  return NextResponse.json({ basarili: true });
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const oturum = await aktifOturum();
  if (!oturum || !izinKontrol(oturum, "musteriler.notlar.yaz")) {
    return NextResponse.json({ basarili: false, hata: "Yetki yok" }, { status: 403 });
  }
  const { id, notId } = await params;

  const not = await prisma.not.findFirst({
    where: { id: notId, musteriId: id, silindiMi: false },
  });
  if (!not) {
    return NextResponse.json(
      { basarili: false, hata: "Not bulunamadı" },
      { status: 404 },
    );
  }

  if (not.olusturanId !== oturum.kullaniciId && !adminMi(oturum.rol)) {
    return NextResponse.json(
      { basarili: false, hata: "Sadece kendi notunuzu silebilirsiniz" },
      { status: 403 },
    );
  }

  await prisma.not.update({
    where: { id: notId },
    data: { silindiMi: true, silinmeTarihi: new Date() },
  });

  await auditLog({
    eylem: "sil",
    model: "Not",
    kayitId: id,
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: { notId },
  });

  return NextResponse.json({ basarili: true });
}
