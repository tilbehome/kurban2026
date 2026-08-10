import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { auditLog, ipCikar } from "@/shared/lib/audit";
import { yayinla } from "@/shared/lib/events";
import { yuvarla } from "@/shared/lib/para";
import {
  apiHataYaniti,
  beklenmeyenHataYaniti,
  zodHataYaniti,
} from "@/shared/lib/api-hata";
import { belirleYontem, hisselereDagit } from "@/modules/tahsilat/lib/dagitim";
import { sonrakiDekontNo } from "@/modules/tahsilat/lib/tahsilat.service";

const SahaSatisSchema = z.object({
  musteriId: z.string().min(1),
  hisseIds: z.array(z.string().min(1)).min(1).max(7),
  hisseFiyati: z.number().positive("Fiyat 0'dan büyük olmalı"),
  nakit: z.number().min(0).default(0),
  havale: z.number().min(0).default(0),
  kart: z.number().min(0).default(0),
  notlar: z.string().trim().max(500).optional(),
  clientRequestId: z.string().uuid(),
});

type SahaSatisBody =
  | { basarili: true; musteriId: string; hisseIds: string[]; odemeIds: string[] }
  | {
      basarili: false;
      hata: string;
      kod?: string;
      mesajAnahtari?: string;
      parametreler?: Record<string, string | number | boolean | null>;
      requestId?: string;
    };

export async function POST(req: Request) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return apiHataYaniti("AUTH_REQUIRED");
  }
  if (!izinKontrol(oturum, "hisseler.ata")) {
    return apiHataYaniti("PERMISSION_DENIED");
  }

  let veri: z.infer<typeof SahaSatisSchema>;
  try {
    veri = SahaSatisSchema.parse((await req.json()) as unknown);
  } catch (e) {
    if (e instanceof z.ZodError) return zodHataYaniti(e);
    return apiHataYaniti("VALIDATION_INVALID");
  }

  const toplamKapora = yuvarla(veri.nakit + veri.havale + veri.kart);
  const toplamBedel = yuvarla(veri.hisseFiyati * veri.hisseIds.length);
  if (toplamKapora > 0 && !izinKontrol(oturum, "tahsilat.olustur")) {
    return apiHataYaniti("PERMISSION_DENIED");
  }
  if (toplamKapora > toplamBedel + 0.01) {
    return apiHataYaniti("FINANCE_DOWN_PAYMENT_EXCEEDS_SALE");
  }

  try {
    const onceki = await prisma.islemAnahtari.findUnique({
      where: { anahtar: veri.clientRequestId },
    });
    if (onceki?.sonucJson) {
      return NextResponse.json(JSON.parse(onceki.sonucJson) as SahaSatisBody);
    }
    if (onceki) {
      return apiHataYaniti("REQUEST_ALREADY_PROCESSING");
    }

    const body = await prisma.$transaction(async (tx) => {
      await tx.islemAnahtari.create({
        data: {
          anahtar: veri.clientRequestId,
          islemTipi: "saha-satis",
          kullaniciId: oturum.kullaniciId,
          ip: ipCikar(req),
        },
      });

      const musteri = await tx.musteri.findFirst({
        where: { id: veri.musteriId, silindiMi: false },
        select: { id: true },
      });
      if (!musteri) throw new Error("MUSTERI_YOK");

      const hisseler = await tx.hisse.findMany({
        where: {
          id: { in: veri.hisseIds },
          silindiMi: false,
          kurban: {
            silindiMi: false,
            durum: { not: "iptal" },
            kesimDurumu: { not: "iptal" },
          },
        },
        select: {
          id: true,
          no: true,
          musteriId: true,
          hisseFiyati: true,
          kurban: {
            select: {
              kesimSirasi: true,
              durum: true,
              kesimDurumu: true,
              silindiMi: true,
            },
          },
          odemeler: {
            where: { iptal: false },
            select: { toplamTutar: true },
          },
        },
      });
      if (hisseler.length !== veri.hisseIds.length) throw new Error("HISSE_YOK");

      const doluHisse = hisseler.find((h) => h.musteriId !== null);
      if (doluHisse) {
        throw new Error(`HISSE_DOLU:${doluHisse.kurban.kesimSirasi}.${doluHisse.no}`);
      }

      const atama = await tx.hisse.updateMany({
        where: { id: { in: veri.hisseIds }, musteriId: null, silindiMi: false },
        data: {
          musteriId: veri.musteriId,
          hisseFiyati: yuvarla(veri.hisseFiyati),
        },
      });
      if (atama.count !== veri.hisseIds.length) {
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
          kaynak: "saha-satis",
          hisseIds: veri.hisseIds,
          musteriId: veri.musteriId,
          hisseFiyati: yuvarla(veri.hisseFiyati),
          toplam: toplamBedel,
        },
      });

      const odemeIds: string[] = [];
      if (toplamKapora > 0) {
        const kalanlar = hisseler.map((h) => ({
          id: h.id,
          no: h.no,
          kalan: yuvarla(
            yuvarla(veri.hisseFiyati) -
              h.odemeler.reduce((s, o) => s + o.toplamTutar, 0),
          ),
        }));
        const tahsisler = hisselereDagit(toplamKapora, kalanlar, "esit").filter(
          (t) => t.tutar > 0,
        );

        for (const t of tahsisler) {
          const oran = toplamKapora > 0 ? t.tutar / toplamKapora : 0;
          const nakit = yuvarla(veri.nakit * oran);
          const havale = yuvarla(veri.havale * oran);
          const kart = yuvarla(t.tutar - nakit - havale);
          const dekontNo = await sonrakiDekontNo(tx);

          const odeme = await tx.odeme.create({
            data: {
              hisseId: t.hisseId,
              nakit,
              havale,
              kart,
              toplamTutar: t.tutar,
              yontem: belirleYontem(nakit, havale, kart),
              notlar: veri.notlar?.trim() || "Saha satış kapora",
              dekontNo,
              kullaniciId: oturum.kullaniciId,
              olusturanId: oturum.kullaniciId,
            },
          });
          odemeIds.push(odeme.id);

          const hisse = hisseler.find((h) => h.id === t.hisseId);
          const etiket = hisse
            ? `Hisse ${hisse.kurban.kesimSirasi}.${hisse.no}`
            : "Hisse";
          for (const [yontem, tutar] of [
            ["nakit", nakit],
            ["havale", havale],
            ["kart", kart],
          ] as const) {
            if (tutar <= 0) continue;
            await tx.kasaHareketi.create({
              data: {
                tip: "tahsilat",
                tutar,
                yontem,
                aciklama: `${etiket} - ${dekontNo}`,
                odemeId: odeme.id,
                kullaniciId: oturum.kullaniciId,
                olusturanId: oturum.kullaniciId,
                tarih: new Date(),
              },
            });
          }
        }

        await auditLog({
          tx,
          eylem: "odeme",
          model: "Odeme",
          kayitId: odemeIds[0],
          kullaniciId: oturum.kullaniciId,
          ip: ipCikar(req),
          detaylar: {
            kaynak: "saha-satis",
            musteriId: veri.musteriId,
            hisseIds: veri.hisseIds,
            odemeIds,
            toplamTutar: toplamKapora,
            nakit: yuvarla(veri.nakit),
            havale: yuvarla(veri.havale),
            kart: yuvarla(veri.kart),
          },
        });
      }

      const sonuc: SahaSatisBody = {
        basarili: true,
        musteriId: veri.musteriId,
        hisseIds: veri.hisseIds,
        odemeIds,
      };
      await tx.islemAnahtari.update({
        where: { anahtar: veri.clientRequestId },
        data: {
          sonucId: odemeIds[0] ?? veri.hisseIds[0],
          sonucJson: JSON.stringify(sonuc),
        },
      });

      return sonuc;
    });

    yayinla("hisse:atandi", {
      hisseIds: veri.hisseIds,
      musteriId: veri.musteriId,
    });
    if (body.odemeIds.length > 0) {
      yayinla("tahsilat:olusturuldu", {
        musteriId: veri.musteriId,
        hisseIds: veri.hisseIds,
        odemeIds: body.odemeIds,
      });
    }

    return NextResponse.json(body);
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "MUSTERI_YOK") {
        return apiHataYaniti("CUSTOMER_NOT_FOUND");
      }
      if (e.message === "HISSE_YOK") {
        return apiHataYaniti("SHARES_NOT_FOUND");
      }
      if (e.message.startsWith("HISSE_DOLU:")) {
        return apiHataYaniti("SHARE_ALREADY_ASSIGNED", {
          shareLabel: e.message.slice("HISSE_DOLU:".length),
        });
      }
      if (e.message === "HISSE_ESZAMANLI_ATANDI") {
        return apiHataYaniti("SHARE_CONCURRENT_ASSIGNMENT");
      }
      return beklenmeyenHataYaniti(e, "INTERNAL_SALE_FAILED", "Saha satış tamamlanamadı");
    }
    return beklenmeyenHataYaniti(e, "INTERNAL_SALE_FAILED", "Saha satış tamamlanamadı");
  }
}
