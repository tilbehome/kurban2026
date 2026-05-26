/**
 * Yedek geri yükleme — DB dosyasını seçilen yedekle değiştirir.
 * SPRINT-YEDEK-V2 İŞ 1.
 *
 * Güvenlik:
 *  - Sadece admin
 *  - Path traversal koruması (regex + path.resolve check)
 *  - "YEDEK_YUKLE" onay sözcüğü (yanlışlık önleme)
 *  - Yükleme öncesi otomatik güvenlik yedeği alınır → rollback yolu
 *  - prisma.$disconnect + WAL/SHM temizleme + atomik rename
 *  - Audit log
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import { aktifOturum } from "@/shared/lib/session";
import { adminMi } from "@/shared/lib/izinler";
import { yedekAl } from "@/shared/lib/backup";
import { auditLog, ipCikar } from "@/shared/lib/audit";
import { prisma } from "@/shared/lib/prisma";

export const dynamic = "force-dynamic";

const Govde = z.object({
  yedekDosyaAdi: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-zA-Z0-9._-]+\.db$/, {
      message: "Geçersiz dosya adı (sadece harf/rakam/._- ve .db uzantı)",
    }),
  onaySozcugu: z.literal("YEDEK_YUKLE"),
});

const YEDEK_KLASOR = path.join(process.cwd(), "backups");

function dbDosyaYolu(): string {
  const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/tilbe.db";
  if (!dbUrl.startsWith("file:")) {
    throw new Error(`Backup desteklemez: ${dbUrl}`);
  }
  const rel = dbUrl.slice("file:".length);
  if (path.isAbsolute(rel)) return rel;
  const prismaYolu = path.join(process.cwd(), "prisma", rel);
  if (fs.existsSync(prismaYolu)) return prismaYolu;
  return path.join(process.cwd(), rel);
}

export async function POST(req: NextRequest) {
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
  } catch (e) {
    const m =
      e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz istek";
    return NextResponse.json({ basarili: false, hata: m }, { status: 400 });
  }

  const yedekYolu = path.join(YEDEK_KLASOR, govde.yedekDosyaAdi);
  const cozulen = path.resolve(yedekYolu);
  if (!cozulen.startsWith(path.resolve(YEDEK_KLASOR))) {
    return NextResponse.json(
      { basarili: false, hata: "Geçersiz yedek yolu" },
      { status: 400 },
    );
  }
  if (!fs.existsSync(yedekYolu)) {
    return NextResponse.json(
      { basarili: false, hata: "Yedek dosyası bulunamadı" },
      { status: 404 },
    );
  }

  const dbYolu = dbDosyaYolu();
  if (!fs.existsSync(dbYolu)) {
    return NextResponse.json(
      { basarili: false, hata: "Mevcut DB bulunamadı: " + dbYolu },
      { status: 500 },
    );
  }

  try {
    // 1) Mevcut DB güvenlik yedeği (rotasyon korumalı, yedek-noktasi formatı)
    const guvenlikYedek = await yedekAl(
      "yedek-noktasi-yukleme-oncesi-otomatik",
    );
    if (!guvenlikYedek.basarili) {
      return NextResponse.json(
        {
          basarili: false,
          hata: "Güvenlik yedeği alınamadı: " + guvenlikYedek.hata,
        },
        { status: 500 },
      );
    }

    // 2) Prisma bağlantısı kapat — dosya kilitli olmasın
    await prisma.$disconnect();

    // 3) WAL/SHM dosyaları temizle (yükleme sonrası tutarsızlık olmasın)
    const walYolu = dbYolu + "-wal";
    const shmYolu = dbYolu + "-shm";
    try {
      if (fs.existsSync(walYolu)) fs.unlinkSync(walYolu);
      if (fs.existsSync(shmYolu)) fs.unlinkSync(shmYolu);
    } catch (e) {
      console.warn("[yedek-yukle] WAL/SHM temizlenemedi:", e);
    }

    // 4) Yedek dosyasını mevcut DB üzerine kopyala (atomik move pattern)
    const geciciYol = dbYolu + ".yukleme-tmp";
    fs.copyFileSync(yedekYolu, geciciYol);
    fs.renameSync(geciciYol, dbYolu);

    // 5) Audit log (yeni DB'ye yazılır — taze veri)
    await auditLog({
      eylem: "yedek-geri-yukle",
      kullaniciId: oturum.kullaniciId,
      ip: ipCikar(req),
      detaylar: {
        kaynak: govde.yedekDosyaAdi,
        guvenlikYedek: guvenlikYedek.yedekYolu,
        zaman: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      basarili: true,
      mesaj: "Yedek başarıyla yüklendi. Sayfa yenilenecek.",
      guvenlikYedek: guvenlikYedek.yedekYolu,
    });
  } catch (e) {
    const m = e instanceof Error ? e.message : "Bilinmeyen hata";
    console.error("[yedek-yukle] hata:", e);
    return NextResponse.json(
      { basarili: false, hata: m },
      { status: 500 },
    );
  }
}
