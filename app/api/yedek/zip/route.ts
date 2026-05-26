/**
 * Yedek (.db) dosyasını ZIP olarak indirme — USB stick için sıkıştırılmış.
 * SPRINT-YEDEK-V2 İŞ 3.
 *
 * archiver paketi ile streaming ZIP (büyük DB'ler için memory-friendly).
 */
import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { aktifOturum } from "@/shared/lib/session";
import { adminMi } from "@/shared/lib/izinler";
import { auditLog, ipCikar } from "@/shared/lib/audit";

// archiver@8 CJS modülü — static `import x from "archiver"` Webpack'te
// "default export yok" warning üretir. Dinamik import ile runtime'da CJS
// resolution çalışır; build-time static analysis warning vermez.
type ArchiverFactory = typeof import("archiver");
async function archiverYukle(): Promise<ArchiverFactory> {
  const mod = await import("archiver");
  const m = mod as unknown as { default?: ArchiverFactory };
  return m.default ?? (mod as unknown as ArchiverFactory);
}

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

  const archiver = await archiverYukle();
  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.file(yedekYolu, { name: dosya });
  archive.finalize();

  await auditLog({
    eylem: "yedek",
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: { islem: "zip-indir", dosya },
  });

  const zipDosyaAdi = dosya.replace(/\.db$/, ".zip");
  // Node Readable → Web ReadableStream (Next.js Response body API'si)
  const stream = Readable.toWeb(archive) as unknown as ReadableStream<Uint8Array>;

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipDosyaAdi}"`,
      "Cache-Control": "no-store",
    },
  });
}
