import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { yuvarla } from "@/shared/lib/para";
import { yayinla } from "@/shared/lib/events";
import { auditLog, ipCikar } from "@/shared/lib/audit";
import {
  apiHataGovdesi,
  apiHataYaniti,
  beklenmeyenHataYaniti,
  zodHataYaniti,
} from "@/shared/lib/api-hata";

const AtamaSchema = z.object({
  hisseIds: z.array(z.string().min(1)).min(1),
  musteriId: z.string().min(1),
  hisseFiyati: z.number().positive("Fiyat 0'dan büyük olmalı"),
});

export async function POST(req: Request) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return apiHataYaniti("AUTH_REQUIRED");
  }
  if (!izinKontrol(oturum, "hisseler.ata")) {
    return apiHataYaniti("PERMISSION_DENIED");
  }

  let veri: z.infer<typeof AtamaSchema>;
  try {
    const govde = (await req.json()) as unknown;
    veri = AtamaSchema.parse(govde);
  } catch (e) {
    if (e instanceof z.ZodError) return zodHataYaniti(e);
    return apiHataYaniti("VALIDATION_INVALID");
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
        body: apiHataGovdesi("CUSTOMER_NOT_FOUND"),
      };
    }

    const hisseler = await tx.hisse.findMany({
      where: { id: { in: veri.hisseIds } },
      select: { id: true, musteriId: true, no: true },
    });
    if (hisseler.length !== veri.hisseIds.length) {
      return {
        status: 404,
        body: apiHataGovdesi("SHARES_NOT_FOUND"),
      };
    }

    const doluHisse = hisseler.find((h) => h.musteriId !== null);
    if (doluHisse) {
      return {
        status: 409,
        body: apiHataGovdesi("SHARE_ALREADY_ASSIGNED", {
          shareLabel: doluHisse.no,
        }),
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
      return apiHataYaniti("SHARE_CONCURRENT_ASSIGNMENT");
    }
    return beklenmeyenHataYaniti(e);
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
