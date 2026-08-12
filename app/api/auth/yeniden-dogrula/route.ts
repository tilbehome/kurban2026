import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { getOturum } from "@/shared/lib/session";
import { markTenantSessionReauthenticated } from "@/shared/lib/tenant-master-data-adapter";
import { auditLog, ipCikar } from "@/shared/lib/audit";
import { rateLimitKontrol, rateLimitSifirla } from "@/shared/lib/rate-limit";

const Body = z.object({ sifre: z.string().min(1).max(256) });

export async function POST(request: Request) {
  const ironSession = await getOturum();
  const session = ironSession.oturum;
  if (!session) return NextResponse.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 });
  const ip = ipCikar(request);
  const rateKey = `reauth:${session.kullaniciId}:${ip ?? "unknown"}`;
  if (!rateLimitKontrol(rateKey, 5, 5 * 60).izinli) return NextResponse.json({ error: "REAUTHENTICATION_RATE_LIMITED" }, { status: 429 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "REAUTHENTICATION_INPUT_INVALID" }, { status: 400 });
  const user = await prisma.kullanici.findUnique({ where: { id: session.kullaniciId }, select: { sifreHash: true, aktif: true } });
  if (!user?.aktif || !await bcrypt.compare(parsed.data.sifre, user.sifreHash)) {
    await auditLog({ eylem: "yeniden-dogrulama-basarisiz", kullaniciId: session.kullaniciId, ip });
    return NextResponse.json({ error: "REAUTHENTICATION_FAILED" }, { status: 401 });
  }
  const occurredAt = new Date();
  try { await markTenantSessionReauthenticated(session.tenantSessionId, occurredAt); }
  catch { return NextResponse.json({ error: "TENANT_SESSION_NOT_ACTIVE" }, { status: 401 }); }
  session.lastReauthenticatedAt = occurredAt.toISOString();
  ironSession.oturum = session;
  await ironSession.save();
  rateLimitSifirla(rateKey);
  await auditLog({ eylem: "yeniden-dogrulama", kullaniciId: session.kullaniciId, ip });
  return NextResponse.json({ reauthenticated: true, occurredAt: occurredAt.toISOString() });
}
