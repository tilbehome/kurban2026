import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { auditLog, ipCikar } from "@/shared/lib/audit";
import { izinKontrol } from "@/shared/lib/izinler";
import {
  vekaletDosyaYoluBul,
  vekaletMimeTipi,
} from "@/shared/lib/vekalet-dosya";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  const oturum = await aktifOturum();
  if (!oturum || !izinKontrol(oturum, "musteriler.vekalet.oku")) {
    return NextResponse.json({ basarili: false, hata: "Yetki yok" }, { status: 403 });
  }
  const { id } = await params;

  const vekalet = await prisma.vekalet.findFirst({
    where: { id, silindiMi: false },
    select: {
      id: true,
      hisseId: true,
      dosyaUrl: true,
      dosyaTipi: true,
    },
  });
  if (!vekalet) {
    return NextResponse.json(
      { basarili: false, hata: "Vekalet bulunamadı" },
      { status: 404 },
    );
  }

  const dosyaYolu = vekaletDosyaYoluBul(vekalet.dosyaUrl);
  if (!dosyaYolu) {
    return NextResponse.json(
      { basarili: false, hata: "Vekalet dosya yolu geçersiz" },
      { status: 404 },
    );
  }

  let buffer: Buffer;
  try {
    buffer = await fs.readFile(dosyaYolu);
  } catch {
    return NextResponse.json(
      { basarili: false, hata: "Vekalet dosyası bulunamadı" },
      { status: 404 },
    );
  }

  await auditLog({
    eylem: "guncelle",
    model: "Vekalet",
    kayitId: id,
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: { islem: "dosya-goruntuleme", hisseId: vekalet.hisseId },
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": vekaletMimeTipi(vekalet.dosyaTipi),
      "Content-Disposition": `inline; filename="vekalet-${vekalet.id}.${vekalet.dosyaTipi}"`,
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
    },
  });
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const oturum = await aktifOturum();
  if (!oturum || !izinKontrol(oturum, "musteriler.vekalet.yaz")) {
    return NextResponse.json({ basarili: false, hata: "Yetki yok" }, { status: 403 });
  }
  const { id } = await params;

  const vekalet = await prisma.vekalet.findFirst({
    where: { id, silindiMi: false },
  });
  if (!vekalet) {
    return NextResponse.json(
      { basarili: false, hata: "Vekalet bulunamadı" },
      { status: 404 },
    );
  }

  // Soft delete
  await prisma.vekalet.update({
    where: { id },
    data: { silindiMi: true, silinmeTarihi: new Date() },
  });

  // Hisse'nin vekaletAlindi bayrağını temizle
  await prisma.hisse.update({
    where: { id: vekalet.hisseId },
    data: { vekaletAlindi: false, vekaletTarihi: null },
  });

  await auditLog({
    eylem: "sil",
    model: "Vekalet",
    kayitId: id,
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: { hisseId: vekalet.hisseId, dosyaUrl: vekalet.dosyaUrl },
  });

  return NextResponse.json({ basarili: true });
}
