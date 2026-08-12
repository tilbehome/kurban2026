import { NextResponse } from "next/server";
import { PrismaClient as TenantPrismaClient } from "@/packages/database-tenant/generated/client";

declare global {
  var publicCustomerTrackingClient: TenantPrismaClient | undefined;
}

function tenantClient(): TenantPrismaClient {
  const databaseUrl = process.env.TENANT_DATABASE_URL;
  if (!databaseUrl) throw new Error("TENANT_DATABASE_URL_REQUIRED");
  const client = globalThis.publicCustomerTrackingClient ?? new TenantPrismaClient({ datasources: { db: { url: databaseUrl } } });
  if (process.env.NODE_ENV !== "production") globalThis.publicCustomerTrackingClient = client;
  return client;
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token || token.length < 20) return NextResponse.json({ error: "TRACKING_TOKEN_REQUIRED" }, { status: 400 });

  const db = tenantClient();
  const qr = await db.qrToken.findUnique({ where: { opaqueToken: token } });
  const now = new Date();
  if (!qr || qr.purpose !== "customerTracking" || qr.revokedAt || (qr.expiresAt && qr.expiresAt <= now)) {
    return NextResponse.json({ error: "TRACKING_TOKEN_INVALID" }, { status: 404 });
  }

  const share = await db.share.findUnique({
    where: { id: qr.targetId },
    include: {
      shareCard: {
        include: {
          animal: { include: { qurbanAssignments: { where: { active: true }, take: 1 } } },
          slaughterJobs: { orderBy: { updatedAt: "desc" }, take: 1 },
        },
      },
      packages: { select: { id: true, labelNo: true, grossWeightKg: true, createdAt: true } },
      deliveries: { select: { id: true, status: true, deliveredAt: true }, orderBy: { deliveredAt: "desc" }, take: 1 },
    },
  });
  if (!share) return NextResponse.json({ error: "TRACKING_TARGET_NOT_FOUND" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    privacy: "MINIMAL_NO_PII_NO_FINANCE",
    qurbanNo: share.shareCard.animal.qurbanAssignments[0]?.qurbanNo ?? null,
    shareNo: share.sequenceNo,
    operationStatus: share.shareCard.slaughterJobs[0]?.status ?? "waiting",
    packageCount: share.packages.length,
    delivered: share.deliveries[0]?.status === "delivered",
    updatedAt: share.shareCard.slaughterJobs[0]?.updatedAt?.toISOString() ?? null,
  }, { headers: { "Cache-Control": "no-store" } });
}
