/**
 * Yedek dosyasını sil. SPRINT-YEDEK-V2 İŞ 1.
 *
 * Path traversal koruması + admin yetkisi + audit log.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import { aktifOturum } from "@/shared/lib/session";
import { adminMi } from "@/shared/lib/izinler";
import { auditLog, ipCikar } from "@/shared/lib/audit";

export const dynamic = "force-dynamic";

const Govde = z.object({
  yedekDosyaAdi: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-zA-Z0-9._-]+\.db$/),
});

const YEDEK_KLASOR = path.join(process.cwd(), "backups");

export async function DELETE(req: NextRequest) {
  const oturum = await aktifOturum();
  if (!oturum || !adminMi(oturum.rol)) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok" },
      { status: 403 },
    );
  }

  let govde: z.infer<typeof Govde>;
  try {
    govde = Govde.parse(await req.json());
  } catch {
    return NextResponse.json(
      { basarili: false, hata: "Geçersiz istek" },
      { status: 400 },
    );
  }

  const yedekYolu = path.join(YEDEK_KLASOR, govde.yedekDosyaAdi);
  const cozulen = path.resolve(yedekYolu);
  if (!cozulen.startsWith(path.resolve(YEDEK_KLASOR))) {
    return NextResponse.json(
      { basarili: false, hata: "Geçersiz yol" },
      { status: 400 },
    );
  }
  if (!fs.existsSync(yedekYolu)) {
    return NextResponse.json(
      { basarili: false, hata: "Dosya bulunamadı" },
      { status: 404 },
    );
  }

  try {
    fs.unlinkSync(yedekYolu);
    await auditLog({
      eylem: "yedek",
      kullaniciId: oturum.kullaniciId,
      ip: ipCikar(req),
      detaylar: { islem: "sil", dosya: govde.yedekDosyaAdi },
    });
    return NextResponse.json({ basarili: true });
  } catch (e) {
    const m = e instanceof Error ? e.message : "Bilinmeyen hata";
    return NextResponse.json(
      { basarili: false, hata: m },
      { status: 500 },
    );
  }
}
