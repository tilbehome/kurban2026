import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { auditLog, ipCikar } from "@/shared/lib/audit";
import {
  kurbanAsamaGuncelle,
  kurbanSonrakiAsama,
} from "@/modules/tv/lib/kurban-asama.service";
import {
  ASAMA_BILDIRIM_KODU,
  ASAMA_ETIKETLERI,
  type KurbanKesimDurumu,
} from "@/modules/tv/lib/asama-akisi";

const KurbanDurumuSchema = z.enum([
  "beklemede",
  "vekalet_bekliyor",
  "siradaki",
  "hazirlik",
  "kesimde",
  "deri_yuzme",
  "parcalama",
  "tartimda",
  "paketleme",
  "teslime_hazir",
  "tamamlandi",
  "iptal",
]);

const AsamaSchema = z.object({
  kurbanId: z.string().min(1),
  // Yeni durum verilmezse otomatik sonrakine geç
  yeniDurum: KurbanDurumuSchema.optional(),
  operasyonSira: z.number().int().nullable().optional(),
  asama: z.string().nullable().optional(),
  ilerlemeYuzde: z.number().int().min(0).max(100).optional(),
  kalanSureDk: z.number().int().min(0).max(1440).nullable().optional(),
  toplamKg: z.number().min(0).nullable().optional(),
});

/**
 * Kurban aşamasını değiştir. yeniDurum verilmezse otomatik bir sonraki aşamaya geçer.
 * Personel "Sonraki Aşamaya Geç" butonu için optimum.
 */
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
      { basarili: false, hata: "TV kontrol yetkiniz yok" },
      { status: 403 },
    );
  }

  let veri: z.infer<typeof AsamaSchema>;
  try {
    const govde = (await req.json()) as unknown;
    veri = AsamaSchema.parse(govde);
  } catch (e) {
    const m = e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz veri";
    return NextResponse.json({ basarili: false, hata: m }, { status: 400 });
  }

  try {
    let eskiDurum: KurbanKesimDurumu;
    let yeniDurum: KurbanKesimDurumu;
    let etkilenenHisse = 0;

    if (veri.yeniDurum) {
      const sonuc = await kurbanAsamaGuncelle({
        kurbanId: veri.kurbanId,
        yeniDurum: veri.yeniDurum,
        operasyonSira: veri.operasyonSira,
        asama: veri.asama,
        ilerlemeYuzde: veri.ilerlemeYuzde,
        kalanSureDk: veri.kalanSureDk,
        toplamKg: veri.toplamKg,
      });
      eskiDurum = sonuc.eskiDurum;
      yeniDurum = sonuc.yeniDurum;
      etkilenenHisse = sonuc.etkilenenHisse;
    } else {
      const sonuc = await kurbanSonrakiAsama(veri.kurbanId);
      if (!sonuc) {
        return NextResponse.json(
          {
            basarili: false,
            hata:
              "Bu kurban son aşamada veya iptal — geçilebilecek aşama yok",
          },
          { status: 400 },
        );
      }
      eskiDurum = sonuc.eskiDurum;
      yeniDurum = sonuc.yeniDurum;
    }

    await auditLog({
      eylem: "tv-kurban-asama",
      model: "Kurban",
      kayitId: veri.kurbanId,
      kullaniciId: oturum.kullaniciId,
      ip: ipCikar(req),
      detaylar: {
        eskiDurum,
        yeniDurum,
        etkilenenHisse,
        ilerleme: veri.ilerlemeYuzde,
        kalan: veri.kalanSureDk,
      },
    });

    // Otomatik bildirim — eşlenmiş aşama varsa BildirimLog'a yaz
    // Tüm aboneliklere değil, sadece bu kurbana atanmış müşterilere
    const sablonKod = ASAMA_BILDIRIM_KODU[yeniDurum];
    if (sablonKod) {
      try {
        const kurbanInfo = await prisma.kurban.findUnique({
          where: { id: veri.kurbanId },
          select: {
            kesimSirasi: true,
            hisseler: {
              where: { silindiMi: false, musteriId: { not: null } },
              select: { musteriId: true },
            },
          },
        });
        if (kurbanInfo) {
          const baslik = `DANA-${kurbanInfo.kesimSirasi} → ${ASAMA_ETIKETLERI[yeniDurum]}`;
          const mesaj = otomatikMesaj(sablonKod, kurbanInfo.kesimSirasi);
          // Tek log (broadcast) — tüm müşteriler bunu polling ile çekecek
          await prisma.bildirimLog.create({
            data: {
              musteriId: null, // broadcast
              kanal: "push",
              sablon: sablonKod,
              baslik,
              mesaj,
              durum: "gonderildi",
            },
          });
          // Müşteri başına da log (çoklu push aboneliği için)
          for (const h of kurbanInfo.hisseler) {
            if (!h.musteriId) continue;
            await prisma.bildirimLog.create({
              data: {
                musteriId: h.musteriId,
                kanal: "push",
                sablon: sablonKod,
                baslik,
                mesaj,
                durum: "gonderildi",
              },
            });
          }
        }
      } catch (e) {
        // Bildirim hatası ana akışı bozmamalı
        console.error("bildirim log hatası:", e);
      }
    }

    return NextResponse.json({
      basarili: true,
      eskiDurum,
      yeniDurum,
      etkilenenHisse,
    });
  } catch (e) {
    console.error("kurban-asama hatası:", e);
    const m = e instanceof Error ? e.message : "Sunucu hatası";
    return NextResponse.json({ basarili: false, hata: m }, { status: 500 });
  }
}

function otomatikMesaj(sablonKod: string, danaNo: number): string {
  switch (sablonKod) {
    case "kesim_basladi":
      return `DANA-${danaNo} kesime alındı 🔪`;
    case "tartim_basladi":
      return `DANA-${danaNo} tartım aşamasında ⚖️`;
    case "paket_hazir":
      return `DANA-${danaNo} hissesi hazır! Teslim noktasına gelin 📦`;
    case "sira_yaklasti":
      return `DANA-${danaNo} sıraya alındı, hazır olun ⏰`;
    default:
      return `DANA-${danaNo} aşaması güncellendi`;
  }
}
