import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { auditLog, ipCikar } from "@/shared/lib/audit";
import { izinKontrol } from "@/shared/lib/izinler";

interface RouteParams {
  params: Promise<{ id: string }>;
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
