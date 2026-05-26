/**
 * Yedek (.db) dosyasını direkt indirme.
 * SPRINT-YEDEK-V2 İŞ 3.
 *
 * Path traversal koruması: dosya adı yalnız [a-zA-Z0-9._-] + .db,
 * çözülen yol backups/ klasörü içinde olmalı.
 */
import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { aktifOturum } from "@/shared/lib/session";
import { adminMi } from "@/shared/lib/izinler";
import { auditLog, ipCikar } from "@/shared/lib/audit";

export const dynamic = "force-dynamic";

const YEDEK_KLASOR = path.join(process.cwd(), "backups");

export async function GET(req: NextRequest) {
  const oturum = await aktifOturum();
  if (!oturum || !adminMi(oturum.rol)) {
    return new NextResponse("Yetki yok", { status: 403 });
  }

  const dosya = req.nextUrl.searchParams.get("dosya");
  if (!dosya || !/^[a-zA-Z0-9._-]+\.db$/.test(dosya)) {
    return new NextResponse("Geçersiz dosya adı", { status: 400 });
  }

  const yedekYolu = path.join(YEDEK_KLASOR, dosya);
  const cozulen = path.resolve(yedekYolu);
  if (!cozulen.startsWith(path.resolve(YEDEK_KLASOR))) {
    return new NextResponse("Geçersiz yol", { status: 400 });
  }
  if (!fs.existsSync(yedekYolu)) {
    return new NextResponse("Dosya bulunamadı", { status: 404 });
  }

  const buffer = fs.readFileSync(yedekYolu);

  await auditLog({
    eylem: "yedek",
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: { islem: "indir", dosya, boyut: buffer.length },
  });

  // Convert Node Buffer to Uint8Array so Next.js Response body accepts it
  const body = new Uint8Array(buffer);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${dosya}"`,
      "Content-Length": String(buffer.length),
      "Cache-Control": "no-store",
    },
  });
}
