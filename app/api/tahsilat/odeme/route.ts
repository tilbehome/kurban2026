import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { yedekAl } from "@/shared/lib/backup";
import { yayinla } from "@/shared/lib/events";
import { yuvarla, topla } from "@/shared/lib/para";
import { sonrakiDekontNo } from "@/modules/tahsilat/lib/tahsilat.service";

const OdemeSchema = z.object({
  musteriId: z.number().int().positive(),
  hisseIds: z.array(z.number().int().positive()).min(1),
  nakit: z.number().min(0).default(0),
  havale: z.number().min(0).default(0),
  kart: z.number().min(0).default(0),
  notlar: z.string().max(500).optional(),
  dagitim: z.enum(["esit", "sirayla", "manuel"]).default("esit"),
  manuelDagitim: z.record(z.string(), z.number()).optional(),
});

export async function POST(req: Request) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok" },
      { status: 401 },
    );
  }

  let veri: z.infer<typeof OdemeSchema>;
  try {
    const govde = (await req.json()) as unknown;
    veri = OdemeSchema.parse(govde);
  } catch (e) {
    const m = e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz veri";
    return NextResponse.json({ basarili: false, hata: m }, { status: 400 });
  }

  const nakit = yuvarla(veri.nakit);
  const havale = yuvarla(veri.havale);
  const kart = yuvarla(veri.kart);
  const toplam = yuvarla(nakit + havale + kart);

  if (toplam <= 0) {
    return NextResponse.json(
      { basarili: false, hata: "Toplam tutar 0'dan büyük olmalı" },
      { status: 400 },
    );
  }

  const hisseler = await prisma.hisse.findMany({
    where: {
      id: { in: veri.hisseIds },
      musteriId: veri.musteriId,
    },
    include: {
      odemeler: { where: { iptal: false }, select: { toplamTutar: true } },
      kurban: { select: { kesimSirasi: true } },
    },
    orderBy: { no: "asc" },
  });

  if (hisseler.length !== veri.hisseIds.length) {
    return NextResponse.json(
      { basarili: false, hata: "Hisseler bulunamadı veya bu müşteriye ait değil" },
      { status: 400 },
    );
  }

  const kalanlar = hisseler.map((h) => {
    const odenmis = yuvarla(topla(...h.odemeler.map((o) => o.toplamTutar)));
    return { id: h.id, no: h.no, kurban: h.kurban.kesimSirasi, kalan: yuvarla(h.hisseFiyati - odenmis) };
  });

  const tahsisler = hisselereDagit(toplam, kalanlar, veri.dagitim, veri.manuelDagitim);

  if (yuvarla(topla(...tahsisler.map((t) => t.tutar))) !== toplam) {
    return NextResponse.json(
      { basarili: false, hata: "Dağıtım hatası: toplam eşleşmedi" },
      { status: 400 },
    );
  }

  const yontem = belirleYontem(nakit, havale, kart);

  const odemeIds: number[] = [];

  try {
    await prisma.$transaction(async (tx) => {
      for (const t of tahsisler) {
        if (t.tutar <= 0) continue;

        // Yöntemleri orana göre böl (eğer karışık ödeme ise)
        const oran = t.tutar / toplam;
        const tNakit = yuvarla(nakit * oran);
        const tHavale = yuvarla(havale * oran);
        const tKart = yuvarla(kart * oran);
        const tToplam = yuvarla(tNakit + tHavale + tKart);
        // Yuvarlama hatasını tutarda dengele
        const fark = yuvarla(t.tutar - tToplam);
        const nakitDengeli = yuvarla(tNakit + fark);

        const dekontNo = await sonrakiDekontNo();

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

        const hisseEt = `Hisse ${kalanlar.find((k) => k.id === t.hisseId)?.kurban}.${
          kalanlar.find((k) => k.id === t.hisseId)?.no
        }`;

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
    });
  } catch (e) {
    console.error("[odeme] Transaction hatası:", e);
    return NextResponse.json(
      { basarili: false, hata: "Ödeme kaydedilemedi" },
      { status: 500 },
    );
  }

  // Otomatik yedek (kritik: her ödemede)
  yedekAl(`odeme-${odemeIds[0] ?? "x"}`).catch((e) =>
    console.error("[odeme] Yedek hatası:", e),
  );

  const ilk = await prisma.odeme.findUnique({
    where: { id: odemeIds[0] },
    select: { dekontNo: true },
  });

  yayinla("odeme:tamamlandi", {
    odemeIds,
    musteriId: veri.musteriId,
    toplam,
    yontem,
  });

  return NextResponse.json({
    basarili: true,
    odemeIds,
    dekontNo: ilk?.dekontNo,
    toplam,
    yontem,
  });
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
  hisseId: number;
  tutar: number;
}

function hisselereDagit(
  toplam: number,
  kalanlar: { id: number; kalan: number }[],
  yontem: "esit" | "sirayla" | "manuel",
  manuel?: Record<string, number>,
): Tahsis[] {
  if (yontem === "manuel" && manuel) {
    const sonuc = kalanlar.map((k) => ({
      hisseId: k.id,
      tutar: yuvarla(manuel[String(k.id)] ?? 0),
    }));
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
    // Hâlâ kalan varsa son hisseye ekle (fazla ödeme)
    if (kalan > 0 && sonuc.length > 0) {
      const sonHisse = sonuc[sonuc.length - 1]!;
      sonHisse.tutar = yuvarla(sonHisse.tutar + kalan);
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
  return sonuc;
}
