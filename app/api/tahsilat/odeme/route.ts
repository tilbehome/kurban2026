import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { yedekAl } from "@/shared/lib/backup";
import { yayinla } from "@/shared/lib/events";
import { yuvarla, topla } from "@/shared/lib/para";
import { sonrakiDekontNo } from "@/modules/tahsilat/lib/tahsilat.service";
import { auditLog, ipCikar } from "@/shared/lib/audit";

const OdemeSchema = z.object({
  musteriId: z.string().min(1),
  hisseIds: z.array(z.string().min(1)).min(1),
  nakit: z.number().min(0).default(0),
  havale: z.number().min(0).default(0),
  kart: z.number().min(0).default(0),
  notlar: z.string().max(500).optional(),
  dagitim: z.enum(["esit", "sirayla", "manuel"]).default("esit"),
  manuelDagitim: z.record(z.string(), z.number()).optional(),
  /**
   * SPRINT-P3 İŞ 1: Idempotency — client UUID. Aynı UUID ile gelen ikinci
   * istek yeni ödeme oluşturmaz, ilk yanıtı replay eder.
   */
  clientRequestId: z.string().min(8).max(100),
});

/**
 * Validasyon veya iş kuralı hatalarında — pre-reserve edilmiş anahtarın
 * sonucJson'ına hata yazılır. Aynı UUID ile gelen tekrar istek 409 değil,
 * SAME error replay alır (UX takılma yaşamaz).
 * SPRINT-P4 İŞ 2.
 */
async function idempotencyHataKaydet(
  anahtar: string,
  yanit: Record<string, unknown>,
): Promise<void> {
  try {
    await prisma.islemAnahtari.update({
      where: { anahtar },
      data: { sonucJson: JSON.stringify(yanit) },
    });
  } catch {
    // Anahtar bulunamadı veya başka tx ile çakıştı — sessizce yut.
  }
}

/**
 * Transaction içinde fırlatılacak iş kuralı hatası — `detay` alanı
 * client'a JSON gövdesine dahil edilir (kalanBakiye, girilenTutar vs.).
 */
class TahsilatHatasi extends Error {
  readonly detay: Record<string, unknown>;
  constructor(mesaj: string, detay: Record<string, unknown> = {}) {
    super(mesaj);
    this.name = "TahsilatHatasi";
    this.detay = detay;
  }
}

export async function POST(req: Request) {
  // 1) Auth
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok" },
      { status: 401 },
    );
  }

  // 2) SPRINT-P4 İŞ 3: Granular izin — tahsilat.olustur olmayan kullanıcı
  // (örn. izleyici rolü) direkt endpoint çağırırsa engelle.
  if (!izinKontrol(oturum, "tahsilat.olustur")) {
    return NextResponse.json(
      { basarili: false, hata: "Bu işlem için yetkiniz yok" },
      { status: 403 },
    );
  }

  // 3) Zod
  let veri: z.infer<typeof OdemeSchema>;
  try {
    const govde = (await req.json()) as unknown;
    veri = OdemeSchema.parse(govde);
  } catch (e) {
    const m = e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz veri";
    return NextResponse.json({ basarili: false, hata: m }, { status: 400 });
  }

  // 4) SPRINT-P3 İŞ 1: Idempotency pre-reserve.
  try {
    await prisma.islemAnahtari.create({
      data: {
        anahtar: veri.clientRequestId,
        islemTipi: "odeme",
        kullaniciId: oturum.kullaniciId,
        ip: ipCikar(req),
      },
    });
  } catch {
    const mevcut = await prisma.islemAnahtari.findUnique({
      where: { anahtar: veri.clientRequestId },
    });
    if (mevcut?.sonucJson) {
      try {
        const eskiYanit = JSON.parse(mevcut.sonucJson) as Record<
          string,
          unknown
        >;
        await auditLog({
          eylem: "odeme",
          model: "Odeme",
          kayitId: mevcut.sonucId ?? undefined,
          kullaniciId: oturum.kullaniciId,
          ip: ipCikar(req),
          detaylar: {
            idempotent: true,
            clientRequestId: veri.clientRequestId,
          },
        });
        // sonucJson'da başarısız bir yanıt varsa orijinal status kodu
        // ile değil 200 ile döner — client `basarili: false` görür.
        return NextResponse.json(eskiYanit);
      } catch {
        /* JSON bozuksa 409'a düş */
      }
    }
    return NextResponse.json(
      {
        basarili: false,
        hata: "Bu istek işleniyor veya daha önce işlendi. Lütfen tahsilat listesini kontrol edin.",
      },
      { status: 409 },
    );
  }

  // 5) Basit toplam kontrolü (idempotency anahtarı zaten oluştu, hata replay
  // için sonucJson'a yaz).
  const nakit = yuvarla(veri.nakit);
  const havale = yuvarla(veri.havale);
  const kart = yuvarla(veri.kart);
  const toplam = yuvarla(nakit + havale + kart);

  if (toplam <= 0) {
    const yanit = {
      basarili: false,
      hata: "Toplam tutar 0'dan büyük olmalı",
    };
    await idempotencyHataKaydet(veri.clientRequestId, yanit);
    return NextResponse.json(yanit, { status: 400 });
  }

  // 6) SPRINT-P4 İŞ 1: Tüm bakiye okuma + validasyon + dağıtım + yazma
  // tek transaction'da. İki kasiyer aynı anda yazamasın → fazla tahsilat
  // riski kapanır.
  let txSonuc: { odemeIds: string[]; yontem: string };
  try {
    txSonuc = await prisma.$transaction(
      async (tx) => {
        const hisseler = await tx.hisse.findMany({
          where: {
            id: { in: veri.hisseIds },
            musteriId: veri.musteriId,
          },
          include: {
            odemeler: {
              where: { iptal: false },
              select: { toplamTutar: true },
            },
            kurban: { select: { kesimSirasi: true } },
          },
          orderBy: { no: "asc" },
        });

        if (hisseler.length !== veri.hisseIds.length) {
          throw new TahsilatHatasi(
            "Hisseler bulunamadı veya bu müşteriye ait değil",
          );
        }

        const kalanlar = hisseler.map((h) => {
          const odenmis = yuvarla(
            topla(...h.odemeler.map((o) => o.toplamTutar)),
          );
          return {
            id: h.id,
            no: h.no,
            kurban: h.kurban.kesimSirasi,
            kalan: yuvarla(h.hisseFiyati - odenmis),
          };
        });

        const toplamKalan = yuvarla(
          topla(...kalanlar.map((k) => Math.max(k.kalan, 0))),
        );

        if (toplamKalan <= 0) {
          throw new TahsilatHatasi(
            "Bu hisselerde ödenmemiş bakiye yok. Tüm ödemeler tamamlanmış.",
          );
        }

        if (toplam > toplamKalan + 0.01) {
          throw new TahsilatHatasi(
            `Tahsilat tutarı kalan bakiyeyi aşıyor. Kalan: ${toplamKalan.toFixed(2)} TL, Girilen: ${toplam.toFixed(2)} TL`,
            {
              kalanBakiye: toplamKalan,
              girilenTutar: toplam,
              fazla: yuvarla(toplam - toplamKalan),
            },
          );
        }

        const tahsisler = hisselereDagit(
          toplam,
          kalanlar,
          veri.dagitim,
          veri.manuelDagitim,
        );

        if (yuvarla(topla(...tahsisler.map((t) => t.tutar))) !== toplam) {
          throw new TahsilatHatasi("Dağıtım hatası: toplam eşleşmedi");
        }

        const yontem = belirleYontem(nakit, havale, kart);
        const odemeIds: string[] = [];

        for (const t of tahsisler) {
          if (t.tutar <= 0) continue;

          const oran = t.tutar / toplam;
          const tNakit = yuvarla(nakit * oran);
          const tHavale = yuvarla(havale * oran);
          const tKart = yuvarla(kart * oran);
          const tToplam = yuvarla(tNakit + tHavale + tKart);
          const fark = yuvarla(t.tutar - tToplam);
          const nakitDengeli = yuvarla(tNakit + fark);

          const dekontNo = await sonrakiDekontNo(tx);

          const odeme = await tx.odeme.create({
            data: {
              hisseId: t.hisseId,
              tarih: new Date(),
              nakit: nakitDengeli,
              havale: tHavale,
              kart: tKart,
              toplamTutar: yuvarla(nakitDengeli + tHavale + tKart),
              yontem,
              notlar: veri.notlar,
              dekontNo,
              kullaniciId: oturum.kullaniciId,
            },
          });
          odemeIds.push(odeme.id);

          const k = kalanlar.find((x) => x.id === t.hisseId);
          const hisseEt = k ? `Hisse ${k.kurban}.${k.no}` : "Hisse";

          if (nakitDengeli > 0) {
            await tx.kasaHareketi.create({
              data: {
                tip: "tahsilat",
                tutar: nakitDengeli,
                yontem: "nakit",
                aciklama: `${hisseEt} - ${dekontNo}`,
                odemeId: odeme.id,
                kullaniciId: oturum.kullaniciId,
                tarih: new Date(),
              },
            });
          }
          if (tHavale > 0) {
            await tx.kasaHareketi.create({
              data: {
                tip: "tahsilat",
                tutar: tHavale,
                yontem: "havale",
                aciklama: `${hisseEt} - ${dekontNo}`,
                odemeId: odeme.id,
                kullaniciId: oturum.kullaniciId,
                tarih: new Date(),
              },
            });
          }
          if (tKart > 0) {
            await tx.kasaHareketi.create({
              data: {
                tip: "tahsilat",
                tutar: tKart,
                yontem: "kart",
                aciklama: `${hisseEt} - ${dekontNo}`,
                odemeId: odeme.id,
                kullaniciId: oturum.kullaniciId,
                tarih: new Date(),
              },
            });
          }
        }

        return { odemeIds, yontem };
      },
      {
        // SQLite WAL ile bir writer aynı anda; uzun süren tahsilat
        // olursa diğer istek kuyrukta bekler. 10 saniye yeterli.
        timeout: 10_000,
      },
    );
  } catch (e) {
    if (e instanceof TahsilatHatasi) {
      const yanit: Record<string, unknown> = {
        basarili: false,
        hata: e.message,
        ...e.detay,
      };
      await idempotencyHataKaydet(veri.clientRequestId, yanit);
      return NextResponse.json(yanit, { status: 400 });
    }
    // dagitim helper'ından gelen normal Error
    if (e instanceof Error) {
      const yanit = { basarili: false, hata: e.message };
      await idempotencyHataKaydet(veri.clientRequestId, yanit);
      // Dağıtım hatası kullanıcı kaynaklı (limit aşımı vs.) — 400
      return NextResponse.json(yanit, { status: 400 });
    }
    console.error("[odeme] Transaction hatası:", e);
    const yanit = { basarili: false, hata: "Ödeme kaydedilemedi" };
    await idempotencyHataKaydet(veri.clientRequestId, yanit);
    return NextResponse.json(yanit, { status: 500 });
  }

  const { odemeIds, yontem } = txSonuc;

  // 7) Otomatik yedek (async, blocking değil)
  yedekAl(`odeme-${odemeIds[0] ?? "x"}`).catch((e) =>
    console.error("[odeme] Yedek hatası:", e),
  );

  const ilkId = odemeIds[0];
  const ilk = ilkId
    ? await prisma.odeme.findUnique({
        where: { id: ilkId },
        select: { dekontNo: true },
      })
    : null;

  // 8) Audit log — kritik işlem
  await auditLog({
    eylem: "odeme",
    model: "Odeme",
    kayitId: ilkId,
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: {
      odemeIds,
      musteriId: veri.musteriId,
      hisseIds: veri.hisseIds,
      toplam,
      yontem,
      nakit,
      havale,
      kart,
      dekontNo: ilk?.dekontNo,
    },
  });

  yayinla("odeme:tamamlandi", {
    odemeIds,
    musteriId: veri.musteriId,
    toplam,
    yontem,
  });

  const yanit = {
    basarili: true,
    odemeIds,
    dekontNo: ilk?.dekontNo,
    toplam,
    yontem,
  };

  // 9) İdempotency sonuç güncelle.
  try {
    await prisma.islemAnahtari.update({
      where: { anahtar: veri.clientRequestId },
      data: {
        sonucId: odemeIds[0] ?? null,
        sonucJson: JSON.stringify(yanit),
      },
    });
  } catch (e) {
    console.error("[odeme] IslemAnahtari sonuç güncellenemedi:", e);
  }

  return NextResponse.json(yanit);
}

function belirleYontem(n: number, h: number, k: number): string {
  const aktif = [n > 0, h > 0, k > 0].filter(Boolean).length;
  if (aktif > 1) return "karisik";
  if (n > 0) return "nakit";
  if (h > 0) return "havale";
  if (k > 0) return "kart";
  return "nakit";
}

interface Tahsis {
  hisseId: string;
  tutar: number;
}

function hisselereDagit(
  toplam: number,
  kalanlar: { id: string; no: number; kalan: number }[],
  yontem: "esit" | "sirayla" | "manuel",
  manuel?: Record<string, number>,
): Tahsis[] {
  if (yontem === "manuel" && manuel) {
    const sonuc = kalanlar.map((k) => {
      const istenen = yuvarla(manuel[k.id] ?? 0);
      const maxIzin = Math.max(k.kalan, 0);
      if (istenen > maxIzin + 0.01) {
        throw new Error(
          `Hisse ${k.no} için ${istenen.toFixed(2)} TL girildi ama kalan sadece ${maxIzin.toFixed(2)} TL`,
        );
      }
      return { hisseId: k.id, tutar: istenen };
    });
    return sonuc;
  }

  if (yontem === "sirayla") {
    let kalan = toplam;
    const sonuc: Tahsis[] = [];
    for (const k of kalanlar) {
      if (kalan <= 0) {
        sonuc.push({ hisseId: k.id, tutar: 0 });
        continue;
      }
      const al = yuvarla(Math.min(kalan, Math.max(k.kalan, 0)));
      sonuc.push({ hisseId: k.id, tutar: al });
      kalan = yuvarla(kalan - al);
    }
    if (kalan > 0.01) {
      throw new Error(
        `Dağıtım hatası: ${kalan.toFixed(2)} TL fazla, hisselere yerleşmedi`,
      );
    }
    return sonuc;
  }

  // esit: tüm hisselere eşit dağıt, son hisseye yuvarlama farkını ekle
  const her = yuvarla(toplam / kalanlar.length);
  const sonuc = kalanlar.map((k) => ({ hisseId: k.id, tutar: her }));
  const fark = yuvarla(toplam - her * kalanlar.length);
  if (fark !== 0 && sonuc.length > 0) {
    sonuc[sonuc.length - 1]!.tutar = yuvarla(
      sonuc[sonuc.length - 1]!.tutar + fark,
    );
  }

  // SPRINT-P2 İŞ 4: Eşit dağıtımda da hisse limit kontrolü.
  for (const t of sonuc) {
    const k = kalanlar.find((x) => x.id === t.hisseId);
    if (!k) continue;
    const maxIzin = Math.max(k.kalan, 0);
    if (t.tutar > maxIzin + 0.01) {
      throw new Error(
        `Eşit dağıtım Hisse ${k.no} kalanını aşıyor. Hisseye düşen: ${t.tutar.toFixed(2)} TL, Kalan: ${maxIzin.toFixed(2)} TL. "Sırayla" veya "Manuel" dağıtım deneyin.`,
      );
    }
  }

  return sonuc;
}
