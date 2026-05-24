import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { auditLog, ipCikar } from "@/shared/lib/audit";
import { izinKontrol } from "@/shared/lib/izinler";

const UPLOAD_KLASOR = path.join(process.cwd(), "public", "uploads", "vekalet");
const MAX_BYTE = 5 * 1024 * 1024; // 5 MB
const KABUL_EDILEN = ["application/pdf", "image/jpeg", "image/png"];

function uzantiBul(mime: string): string {
  if (mime === "application/pdf") return "pdf";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  return "bin";
}

/**
 * POST /api/vekaletler
 * Multipart form:
 *  - hisseId: cuid
 *  - dosya: File (PDF/JPG/PNG, max 5MB)
 */
export async function POST(req: Request) {
  const oturum = await aktifOturum();
  if (!oturum || !izinKontrol(oturum, "musteriler.vekalet.yaz")) {
    return NextResponse.json({ basarili: false, hata: "Yetki yok" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { basarili: false, hata: "Geçersiz form" },
      { status: 400 },
    );
  }

  const hisseId = form.get("hisseId");
  const dosya = form.get("dosya");

  if (typeof hisseId !== "string" || !hisseId) {
    return NextResponse.json(
      { basarili: false, hata: "hisseId gerekli" },
      { status: 400 },
    );
  }
  if (!(dosya instanceof File)) {
    return NextResponse.json(
      { basarili: false, hata: "Dosya gerekli" },
      { status: 400 },
    );
  }
  if (dosya.size > MAX_BYTE) {
    return NextResponse.json(
      { basarili: false, hata: "Dosya 5MB'dan büyük" },
      { status: 400 },
    );
  }
  if (!KABUL_EDILEN.includes(dosya.type)) {
    return NextResponse.json(
      { basarili: false, hata: "Sadece PDF/JPG/PNG kabul edilir" },
      { status: 400 },
    );
  }

  const hisse = await prisma.hisse.findFirst({
    where: { id: hisseId, silindiMi: false },
    include: { vekalet: true },
  });
  if (!hisse) {
    return NextResponse.json(
      { basarili: false, hata: "Hisse bulunamadı" },
      { status: 404 },
    );
  }

  await fs.mkdir(UPLOAD_KLASOR, { recursive: true });

  const uzanti = uzantiBul(dosya.type);
  const dosyaAdi = `${hisseId}-${randomBytes(8).toString("hex")}.${uzanti}`;
  const fizikselYol = path.join(UPLOAD_KLASOR, dosyaAdi);
  const dosyaUrl = `/uploads/vekalet/${dosyaAdi}`;

  const buffer = Buffer.from(await dosya.arrayBuffer());
  await fs.writeFile(fizikselYol, buffer);

  // Eski vekalet varsa soft-delete (fiziksel dosyayı tutuyoruz audit için)
  if (hisse.vekalet && !hisse.vekalet.silindiMi) {
    await prisma.vekalet.update({
      where: { id: hisse.vekalet.id },
      data: { silindiMi: true, silinmeTarihi: new Date() },
    });
  }

  // Yeni vekalet — hisseId unique, eski silindiyse yenisi oluşur
  // Ama Prisma unique constraint nedeniyle eskiyi unique ihlali yapmadan silmek lazım.
  // Çözüm: eskiyi tamamen sil (cascade ile vekalet kaydı gider), yenisini ekle.
  if (hisse.vekalet) {
    await prisma.vekalet.delete({ where: { id: hisse.vekalet.id } });
  }

  const yeni = await prisma.vekalet.create({
    data: {
      hisseId,
      dosyaUrl,
      dosyaTipi: uzanti,
      dosyaBoyutu: dosya.size,
      olusturanId: oturum.kullaniciId,
    },
  });

  // Hisse'nin vekaletAlindi bayrağını da set et (legacy uyum için)
  await prisma.hisse.update({
    where: { id: hisseId },
    data: { vekaletAlindi: true, vekaletTarihi: new Date() },
  });

  await auditLog({
    eylem: "olustur",
    model: "Vekalet",
    kayitId: yeni.id,
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: { hisseId, boyut: dosya.size, tip: uzanti },
  });

  return NextResponse.json({ basarili: true, veri: yeni });
}
