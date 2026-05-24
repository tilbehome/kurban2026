import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { auditLog, ipCikar } from "@/shared/lib/audit";
import type { GonderimKisa } from "@/modules/whatsapp/types";

export const dynamic = "force-dynamic";

const HedefSatirSchema = z.object({
  musteriId: z.string(),
  musteriAdSoyad: z.string(),
  telefon: z.string(),
  durum: z.enum(["bekliyor", "acildi", "atlandi", "hata"]),
  acilmaZamani: z.string().nullable(),
});

const GonderimOlusturSchema = z.object({
  sablonId: z.string().min(1),
  hedefler: z.array(HedefSatirSchema).min(1).max(500),
  hedefSayisi: z.number().int().nonnegative(),
  acilanSayisi: z.number().int().nonnegative(),
  atlananSayisi: z.number().int().nonnegative(),
  hataSayisi: z.number().int().nonnegative(),
  telefonsuzSayisi: z.number().int().nonnegative().default(0),
  baslamaTarihi: z.string(),
  bitisTarihi: z.string().nullable(),
  not: z.string().max(500).nullable().optional(),
});

/** GET: tüm gönderim geçmişi (en yeni önce) */
export async function GET() {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok" },
      { status: 401 },
    );
  }
  if (!izinKontrol(oturum, "whatsapp.gecmis")) {
    return NextResponse.json(
      { basarili: false, hata: "Görüntüleme yetkiniz yok" },
      { status: 403 },
    );
  }

  const gonderimler = await prisma.whatsAppGonderim.findMany({
    where: { silindiMi: false },
    orderBy: { baslamaTarihi: "desc" },
    take: 100,
    include: {
      sablon: { select: { id: true, ad: true, kategori: true } },
      kullanici: { select: { adSoyad: true } },
    },
  });

  const veri: GonderimKisa[] = gonderimler.map((g) => ({
    id: g.id,
    sablonId: g.sablonId,
    sablonAd: g.sablon.ad,
    sablonKategorisi: g.sablon.kategori as GonderimKisa["sablonKategorisi"],
    baslamaTarihi: g.baslamaTarihi.toISOString(),
    bitisTarihi: g.bitisTarihi?.toISOString() ?? null,
    hedefSayisi: g.hedefSayisi,
    acilanSayisi: g.acilanSayisi,
    atlananSayisi: g.atlananSayisi,
    hataSayisi: g.hataSayisi,
    telefonsuzSayisi: g.telefonsuzSayisi,
    kullaniciId: g.kullaniciId,
    kullaniciAdSoyad: g.kullanici.adSoyad,
    not: g.not,
  }));

  return NextResponse.json({ basarili: true, veri });
}

/** POST: gönderim sonucu kaydet */
export async function POST(req: Request) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok" },
      { status: 401 },
    );
  }
  if (!izinKontrol(oturum, "whatsapp.gonderim")) {
    return NextResponse.json(
      { basarili: false, hata: "Gönderim yetkiniz yok" },
      { status: 403 },
    );
  }

  let veri: z.infer<typeof GonderimOlusturSchema>;
  try {
    const govde = (await req.json()) as unknown;
    veri = GonderimOlusturSchema.parse(govde);
  } catch (e) {
    const m = e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz veri";
    return NextResponse.json({ basarili: false, hata: m }, { status: 400 });
  }

  // Şablon var mı?
  const sablon = await prisma.whatsAppSablonu.findUnique({
    where: { id: veri.sablonId },
  });
  if (!sablon || sablon.silindiMi) {
    return NextResponse.json(
      { basarili: false, hata: "Şablon bulunamadı" },
      { status: 404 },
    );
  }

  const gonderim = await prisma.whatsAppGonderim.create({
    data: {
      sablonId: veri.sablonId,
      baslamaTarihi: new Date(veri.baslamaTarihi),
      bitisTarihi: veri.bitisTarihi ? new Date(veri.bitisTarihi) : null,
      hedefSayisi: veri.hedefSayisi,
      acilanSayisi: veri.acilanSayisi,
      atlananSayisi: veri.atlananSayisi,
      hataSayisi: veri.hataSayisi,
      telefonsuzSayisi: veri.telefonsuzSayisi,
      not: veri.not ?? null,
      hedefler: JSON.stringify(veri.hedefler),
      kullaniciId: oturum.kullaniciId,
      olusturanId: oturum.kullaniciId,
    },
  });

  await auditLog({
    eylem: "whatsapp-toplu-gonderim",
    model: "WhatsAppGonderim",
    kayitId: gonderim.id,
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: {
      sablonId: veri.sablonId,
      sablonAd: sablon.ad,
      hedefSayisi: veri.hedefSayisi,
      acilanSayisi: veri.acilanSayisi,
    },
  });

  return NextResponse.json({ basarili: true, veri: gonderim });
}
