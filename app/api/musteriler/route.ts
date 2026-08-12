import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { izinKontrol } from "@/shared/lib/izinler";
import { yayinla } from "@/shared/lib/events";
import { auditLog, ipCikar } from "@/shared/lib/audit";
import { musterileriListele } from "@/modules/musteriler/lib/musteri.service";
import { randomUUID } from "node:crypto";
import {
  masterDataMode,
  tenantActiveSeasonId,
  tenantMasterDataService,
  tenantUseCaseContext,
} from "@/shared/lib/tenant-master-data-adapter";

const MusteriSchema = z.object({
  adSoyad: z.string().trim().min(2, "Ad soyad en az 2 karakter"),
  telefon: z
    .string()
    .trim()
    .max(30)
    .optional()
    .transform((v) => (v ? v : null)),
  tcKimlik: z
    .string()
    .trim()
    .max(11)
    .optional()
    .transform((v) => (v ? v : null)),
  adres: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v ? v : null)),
  notlar: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v ? v : null)),
  // SPRINT-10: Yeni müşteri formundan gelen etiketler JSON string olarak
  // saklanır (mevcut Musteri.etiketler alanı String?). Eski tüketiciler
  // (BorclularClient, EtiketModal) aynı JSON formatını okuyor.
  etiketler: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v ? v : null)),
});

export async function GET(req: Request) {
  const oturum = await aktifOturum();
  if (!oturum) return NextResponse.json({ hata: "Yetki yok" }, { status: 401 });
  if (!izinKontrol(oturum, "musteriler.goruntule")) {
    return NextResponse.json({ hata: "Yetki yok" }, { status: 403 });
  }

  const url = new URL(req.url);
  const arama = url.searchParams.get("arama") ?? undefined;
  const limit = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);

  if (masterDataMode() === "postgres") {
    const sonuc = await tenantMasterDataService().searchCustomers(
      tenantUseCaseContext(oturum, { request: req, readOnly: true }),
      { query: arama, seasonId: url.searchParams.get("seasonId") ?? tenantActiveSeasonId(), limit },
    );
    return NextResponse.json({
      liste: sonuc.items.map((m) => ({
        id: m.id,
        adSoyad: m.displayName,
        telefon: m.phone ?? null,
        hisseSayisi: m.shareCount,
        toplamBedel: Number(m.seasonAccount?.debitTotal ?? 0),
        toplamOdenen: Number(m.seasonAccount?.creditTotal ?? 0),
        kalan: Number(m.seasonAccount?.balance ?? 0),
        kayitTarihi: m.createdAt,
      })),
      toplam: sonuc.total,
      kaynak: "tenant-postgresql",
    });
  }

  const { liste, toplam } = await musterileriListele({
    arama,
    durum: "hepsi",
    limit: Math.min(Math.max(limit, 1), 200),
  });
  return NextResponse.json({ liste, toplam });
}

export async function POST(req: Request) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return NextResponse.json({ basarili: false, hata: "Yetki yok" }, { status: 401 });
  }
  if (!izinKontrol(oturum, "musteriler.olustur")) {
    return NextResponse.json(
      { basarili: false, hata: "Müşteri oluşturma yetkiniz yok" },
      { status: 403 },
    );
  }

  let veri: z.infer<typeof MusteriSchema>;
  try {
    const govde = (await req.json()) as unknown;
    veri = MusteriSchema.parse(govde);
  } catch (e) {
    const m = e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz veri";
    return NextResponse.json({ basarili: false, hata: m }, { status: 400 });
  }

  if (masterDataMode() === "postgres") {
    const id = `customer_${randomUUID()}`;
    const sonuc = await tenantMasterDataService().createCustomer(
      tenantUseCaseContext(oturum, { request: req, payload: veri }),
      tenantActiveSeasonId(),
      {
        id,
        displayName: veri.adSoyad,
        phone: veri.telefon ?? undefined,
        identityNumber: veri.tcKimlik ?? undefined,
        address: veri.adres ? { addressLine: veri.adres, label: "Ana adres" } : undefined,
        notes: veri.notlar ?? undefined,
      },
    );
    return NextResponse.json({
      basarili: true,
      id: sonuc.id,
      mukerrerUyarisi: sonuc.duplicateWarning,
      kaynak: "tenant-postgresql",
    });
  }

  const yeni = await prisma.musteri.create({
    data: {
      adSoyad: veri.adSoyad.toLocaleUpperCase("tr-TR"),
      telefon: veri.telefon,
      tcKimlik: veri.tcKimlik,
      adres: veri.adres,
      notlar: veri.notlar,
      etiketler: veri.etiketler,
      olusturanId: oturum.kullaniciId,
    },
  });

  await auditLog({
    eylem: "olustur",
    model: "Musteri",
    kayitId: yeni.id,
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: { adSoyad: yeni.adSoyad, telefon: yeni.telefon },
  });

  yayinla("musteri:olusturuldu", { id: yeni.id, adSoyad: yeni.adSoyad });
  return NextResponse.json({ basarili: true, id: yeni.id });
}
