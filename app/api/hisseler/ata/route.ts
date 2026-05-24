import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { yuvarla } from "@/shared/lib/para";
import { yayinla } from "@/shared/lib/events";
import { auditLog, ipCikar } from "@/shared/lib/audit";

const AtamaSchema = z.object({
  hisseIds: z.array(z.string().min(1)).min(1),
  musteriId: z.string().min(1),
  hisseFiyati: z.number().positive("Fiyat 0'dan büyük olmalı"),
});

export async function POST(req: Request) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok" },
      { status: 401 },
    );
  }

  let veri: z.infer<typeof AtamaSchema>;
  try {
    const govde = (await req.json()) as unknown;
    veri = AtamaSchema.parse(govde);
  } catch (e) {
    const m = e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz veri";
    return NextResponse.json({ basarili: false, hata: m }, { status: 400 });
  }

  const musteri = await prisma.musteri.findUnique({
    where: { id: veri.musteriId },
  });
  if (!musteri) {
    return NextResponse.json(
      { basarili: false, hata: "Müşteri bulunamadı" },
      { status: 404 },
    );
  }

  const hisseler = await prisma.hisse.findMany({
    where: { id: { in: veri.hisseIds } },
  });
  if (hisseler.length !== veri.hisseIds.length) {
    return NextResponse.json(
      { basarili: false, hata: "Hisseler bulunamadı" },
      { status: 400 },
    );
  }

  const doluHisse = hisseler.find((h) => h.musteriId !== null);
  if (doluHisse) {
    return NextResponse.json(
      {
        basarili: false,
        hata: `Hisse #${doluHisse.no} zaten dolu (önce serbest bırakın)`,
      },
      { status: 409 },
    );
  }

  await prisma.hisse.updateMany({
    where: { id: { in: veri.hisseIds } },
    data: {
      musteriId: veri.musteriId,
      hisseFiyati: yuvarla(veri.hisseFiyati),
    },
  });

  await auditLog({
    eylem: "hisse-atama",
    model: "Hisse",
    kayitId: veri.hisseIds[0],
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: {
      hisseIds: veri.hisseIds,
      musteriId: veri.musteriId,
      hisseFiyati: yuvarla(veri.hisseFiyati),
      toplam: yuvarla(veri.hisseFiyati * veri.hisseIds.length),
    },
  });

  yayinla("hisse:atandi", {
    hisseIds: veri.hisseIds,
    musteriId: veri.musteriId,
  });

  return NextResponse.json({ basarili: true, atananSayi: veri.hisseIds.length });
}
