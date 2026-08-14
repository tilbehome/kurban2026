import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import { prisma } from "@/shared/lib/prisma";
import { aktifOturum } from "@/shared/lib/session";
import { auditLog, ipCikar } from "@/shared/lib/audit";
import { izinKontrol } from "@/shared/lib/izinler";
import { apiHataYaniti, beklenmeyenHataYaniti } from "@/shared/lib/api-hata";
import { masterDataMode, tenantConfiguredActiveSeasonId, tenantOperationsService, tenantUseCaseContext } from "@/shared/lib/tenant-master-data-adapter";
import {
  vekaletDosyaYoluBul,
  vekaletMimeTipi,
} from "@/shared/lib/vekalet-dosya";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  const oturum = await aktifOturum();
  if (!oturum) {
    return apiHataYaniti("PERMISSION_DENIED");
  }
  if (!izinKontrol(oturum, "musteriler.vekalet.oku")) {
    return apiHataYaniti("PERMISSION_DENIED");
  }
  const { id } = await params;

  if (masterDataMode() === "postgres") {
    const seasonId = new URL(req.url).searchParams.get("seasonId") ?? tenantConfiguredActiveSeasonId();
    if (!seasonId) return apiHataYaniti("VALIDATION_INVALID");
    let document;
    try {
      document = await tenantOperationsService().getProxyDocument(
        tenantUseCaseContext(oturum, { request: req, readOnly: true }),
        { id, seasonId },
      );
    } catch (error) {
      return beklenmeyenHataYaniti(error, "TENANT_OPERATIONS_FAILED", "Vekâlet belgesi okunamadı");
    }
    const filePath = vekaletDosyaYoluBul(document.storageKey);
    if (!filePath) return apiHataYaniti("FILE_INVALID_PROXY_PATH");
    try {
      const buffer = await fs.readFile(filePath);
      return new NextResponse(new Uint8Array(buffer), { headers: {
        "Content-Type": document.mimeType ?? "application/octet-stream",
        "Content-Disposition": `inline; filename="vekalet-${document.id}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      } });
    } catch {
      return apiHataYaniti("FILE_PROXY_NOT_FOUND");
    }
  }

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
    return apiHataYaniti("PROXY_NOT_FOUND");
  }

  const dosyaYolu = vekaletDosyaYoluBul(vekalet.dosyaUrl);
  if (!dosyaYolu) {
    return apiHataYaniti("FILE_INVALID_PROXY_PATH");
  }

  let buffer: Buffer;
  try {
    buffer = await fs.readFile(dosyaYolu);
  } catch {
    return apiHataYaniti("FILE_PROXY_NOT_FOUND");
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
  if (!oturum) {
    return apiHataYaniti("PERMISSION_DENIED");
  }
  if (!izinKontrol(oturum, "musteriler.vekalet.yaz")) {
    return apiHataYaniti("PERMISSION_DENIED");
  }
  if (masterDataMode() === "postgres") return NextResponse.json({ basarili: false, code: "LEGACY_PROXY_DELETE_DISABLED", route: "/api/tenant/operations" }, { status: 409 });
  const { id } = await params;

  const vekalet = await prisma.vekalet.findFirst({
    where: { id, silindiMi: false },
  });
  if (!vekalet) {
    return apiHataYaniti("PROXY_NOT_FOUND");
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
