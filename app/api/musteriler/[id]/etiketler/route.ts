import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { auditLog, ipCikar } from "@/shared/lib/audit";
import { izinKontrol } from "@/shared/lib/izinler";
import { etiketleriSerilizle } from "@/modules/musteriler/lib/aktivite.service";

const EtiketSchema = z.object({
  etiketler: z.array(z.string().trim().min(1).max(40)).max(20),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const oturum = await aktifOturum();
  if (!oturum || !izinKontrol(oturum, "musteriler.etiket")) {
    return NextResponse.json({ basarili: false, hata: "Yetki yok" }, { status: 403 });
  }
  const { id } = await params;

  let veri: z.infer<typeof EtiketSchema>;
  try {
    const govde = (await req.json()) as unknown;
    veri = EtiketSchema.parse(govde);
  } catch (e) {
    const m = e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz veri";
    return NextResponse.json({ basarili: false, hata: m }, { status: 400 });
  }

  const musteri = await prisma.musteri.findFirst({
    where: { id, silindiMi: false },
  });
  if (!musteri) {
    return NextResponse.json(
      { basarili: false, hata: "Müşteri bulunamadı" },
      { status: 404 },
    );
  }

  // Tekrarsız + boş silinmiş
  const benzersiz = Array.from(new Set(veri.etiketler.filter((e) => e.trim())));

  await prisma.musteri.update({
    where: { id },
    data: { etiketler: etiketleriSerilizle(benzersiz) },
  });

  await auditLog({
    eylem: "guncelle",
    model: "Musteri",
    kayitId: id,
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: { etiketler: benzersiz },
  });

  return NextResponse.json({ basarili: true, veri: { etiketler: benzersiz } });
}
