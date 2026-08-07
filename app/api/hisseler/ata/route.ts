import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
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
  if (!izinKontrol(oturum, "hisseler.ata")) {
    return NextResponse.json(
      { basarili: false, hata: "Atama yetkiniz yok" },
      { status: 403 },
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

  let sonuc: {
    status: number;
    body: { basarili: boolean; hata?: string; atananSayi?: number };
  };
  try {
    sonuc = await prisma.$transaction(async (tx) => {
    const musteri = await tx.musteri.findUnique({
      where: { id: veri.musteriId },
    });
    if (!musteri) {
      return {
        status: 404,
        body: { basarili: false, hata: "Müşteri bulunamadı" },
      };
    }

    const hisseler = await tx.hisse.findMany({
      where: { id: { in: veri.hisseIds } },
      select: { id: true, musteriId: true, no: true },
    });
    if (hisseler.length !== veri.hisseIds.length) {
      return {
        status: 400,
        body: { basarili: false, hata: "Hisseler bulunamadı" },
      };
    }

    const doluHisse = hisseler.find((h) => h.musteriId !== null);
    if (doluHisse) {
      return {
        status: 409,
        body: {
          basarili: false,
          hata: `Hisse #${doluHisse.no} zaten dolu (önce serbest bırakın)`,
        },
      };
    }

    const guncelleme = await tx.hisse.updateMany({
      where: { id: { in: veri.hisseIds }, musteriId: null },
      data: {
        musteriId: veri.musteriId,
        hisseFiyati: yuvarla(veri.hisseFiyati),
      },
    });
    if (guncelleme.count !== veri.hisseIds.length) {
      throw new Error("HISSE_ESZAMANLI_ATANDI");
    }

    await auditLog({
      tx,
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

    return {
      status: 200,
      body: { basarili: true, atananSayi: veri.hisseIds.length },
    };
    });
  } catch (e) {
    if (e instanceof Error && e.message === "HISSE_ESZAMANLI_ATANDI") {
      return NextResponse.json(
        {
          basarili: false,
          hata: "Hisselerden biri eşzamanlı başka kullanıcı tarafından dolduruldu. Listeyi yenileyip tekrar deneyin.",
        },
        { status: 409 },
      );
    }
    throw e;
  }

  if (sonuc.status !== 200) {
    return NextResponse.json(sonuc.body, { status: sonuc.status });
  }

  yayinla("hisse:atandi", {
    hisseIds: veri.hisseIds,
    musteriId: veri.musteriId,
  });

  return NextResponse.json(sonuc.body);
}
