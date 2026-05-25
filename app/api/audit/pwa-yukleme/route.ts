import { NextResponse } from "next/server";
import { aktifOturum } from "@/shared/lib/session";
import { auditLog, ipCikar } from "@/shared/lib/audit";

export const dynamic = "force-dynamic";

/**
 * PWA yükleme telemetrisi — kullanıcı "Ana ekrana ekle"yi onayladığında çağırılır.
 * Auth zorunlu değil (public — anonim müşteri de yükleyebilir).
 */
export async function POST(req: Request) {
  const oturum = await aktifOturum();
  await auditLog({
    eylem: "pwa-yukleme",
    kullaniciId: oturum?.kullaniciId,
    ip: ipCikar(req),
    detaylar: {
      userAgent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
    },
  });
  return NextResponse.json({ basarili: true });
}
