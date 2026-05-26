/**
 * Veri sıfırlama — TEHLİKELİ. SPRINT-SIFIRLA-V1.
 *
 * Tüm test verisini siler. Sezon başlangıcı veya bayram öncesi tek
 * seferlik kullanım. 4 katmanlı koruma:
 *   1. Admin yetkisi (aktifOturum + adminMi)
 *   2. "SIFIRLA_VERIYI" onay sözcüğü (Zod z.literal)
 *   3. Zorunlu otomatik güvenlik yedeği (yedek-noktasi-* → rotasyondan korumalı)
 *   4. UI tarafında 5 sn geri sayım
 *
 * Silinir: Odeme, KasaHareketi, Sayac, IslemAnahtari, Vekalet, Hisse,
 *           Kurban, Not, PushAbonelik, WhatsAppGonderim, BildirimLog,
 *           Musteri, AuditLog
 *
 * Korunur: Kullanici, Ayar, ModulDurum, TvAyari, WhatsAppSablonu
 *           (admin hesabı + sistem ayarları + WhatsApp şablonları)
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aktifOturum } from "@/shared/lib/session";
import { adminMi } from "@/shared/lib/izinler";
import { yedekAl } from "@/shared/lib/backup";
import { auditLog, ipCikar } from "@/shared/lib/audit";
import { prisma } from "@/shared/lib/prisma";

export const dynamic = "force-dynamic";

const Govde = z.object({
  onaySozcugu: z.literal("SIFIRLA_VERIYI"),
});

export async function POST(req: NextRequest) {
  const oturum = await aktifOturum();
  if (!oturum || !adminMi(oturum.rol)) {
    return NextResponse.json(
      { basarili: false, hata: "Yetki yok — sadece admin" },
      { status: 403 },
    );
  }

  try {
    Govde.parse(await req.json());
  } catch (e) {
    const m =
      e instanceof z.ZodError ? e.issues[0]?.message : "Geçersiz onay sözcüğü";
    return NextResponse.json({ basarili: false, hata: m }, { status: 400 });
  }

  // 1) Zorunlu otomatik yedek (rotasyondan korumalı yedek noktası adıyla)
  const yedek = await yedekAl("yedek-noktasi-sifirlama-oncesi-OTOMATIK");
  if (!yedek.basarili) {
    return NextResponse.json(
      {
        basarili: false,
        hata: "Güvenlik yedeği alınamadı, sıfırlama iptal: " + yedek.hata,
      },
      { status: 500 },
    );
  }

  // 2) Rapor için silme öncesi sayım
  const [musteriOnce, kurbanOnce, hisseOnce, odemeOnce, kasaOnce] =
    await prisma.$transaction([
      prisma.musteri.count(),
      prisma.kurban.count(),
      prisma.hisse.count(),
      prisma.odeme.count(),
      prisma.kasaHareketi.count(),
    ]);

  // 3) Toplu silme — FK sırası önemli: en bağımlıdan en bağımsıza
  try {
    await prisma.$transaction([
      // Tahsilat zinciri (Odeme → Hisse, Odeme → KasaHareketi)
      prisma.kasaHareketi.deleteMany({}),
      prisma.odeme.deleteMany({}),

      // Atomic counter + idempotency
      prisma.islemAnahtari.deleteMany({}),
      prisma.sayac.deleteMany({}),

      // Vekalet (Hisse'ye bağlı)
      prisma.vekalet.deleteMany({}),

      // Hisse (Kurban + Musteri'ye bağlı)
      prisma.hisse.deleteMany({}),

      // Kurban (atanmış hissesi silinince serbest)
      prisma.kurban.deleteMany({}),

      // Musteri ilişkili kayıtlar
      prisma.not.deleteMany({}),
      prisma.pushAbonelik.deleteMany({}),
      prisma.whatsAppGonderim.deleteMany({}),
      prisma.bildirimLog.deleteMany({}),

      // Musteri (artık serbest)
      prisma.musteri.deleteMany({}),

      // AuditLog (en son, sıfırlama log'unu sonradan ekleyeceğiz)
      prisma.auditLog.deleteMany({}),
    ]);
  } catch (e) {
    const m = e instanceof Error ? e.message : "Bilinmeyen hata";
    console.error("[sifirla] hata:", e);
    return NextResponse.json(
      { basarili: false, hata: "Sıfırlama hatası: " + m },
      { status: 500 },
    );
  }

  // 4) Sıfırlama sonrası ilk audit log — kim, ne zaman, ne sildi
  await auditLog({
    eylem: "yedek",
    kullaniciId: oturum.kullaniciId,
    ip: ipCikar(req),
    detaylar: {
      islem: "veri-sifirla",
      guvenlikYedek: yedek.yedekYolu,
      silinen: {
        musteri: musteriOnce,
        kurban: kurbanOnce,
        hisse: hisseOnce,
        odeme: odemeOnce,
        kasaHareketi: kasaOnce,
      },
      zaman: new Date().toISOString(),
    },
  });

  return NextResponse.json({
    basarili: true,
    mesaj: "Tüm veri sıfırlandı. Sistem temiz, yeni veriler için hazır.",
    guvenlikYedek: yedek.yedekYolu,
    silinen: {
      musteri: musteriOnce,
      kurban: kurbanOnce,
      hisse: hisseOnce,
      odeme: odemeOnce,
      kasaHareketi: kasaOnce,
    },
  });
}
