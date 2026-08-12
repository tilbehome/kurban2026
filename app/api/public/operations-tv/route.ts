import { NextResponse } from "next/server";
import { PrismaClient as TenantPrismaClient } from "@/packages/database-tenant/generated/client";

declare global {
  var publicOperationsTvClient: TenantPrismaClient | undefined;
}

function tenantClient(): TenantPrismaClient {
  const databaseUrl = process.env.TENANT_DATABASE_URL;
  if (!databaseUrl) throw new Error("TENANT_DATABASE_URL_REQUIRED");
  const client = globalThis.publicOperationsTvClient ?? new TenantPrismaClient({ datasources: { db: { url: databaseUrl } } });
  if (process.env.NODE_ENV !== "production") globalThis.publicOperationsTvClient = client;
  return client;
}

export async function GET(request: Request) {
  const seasonId = new URL(request.url).searchParams.get("seasonId") ?? process.env.TENANT_ACTIVE_SEASON_ID?.trim();
  if (!seasonId) return NextResponse.json({ error: "SEASON_REQUIRED" }, { status: 400 });

  const rows = await tenantClient().slaughterJob.findMany({
    where: { seasonId },
    include: { animal: { include: { qurbanAssignments: { where: { seasonId, active: true }, take: 1 } } } },
    orderBy: [{ queueNo: "asc" }, { updatedAt: "asc" }],
    take: 80,
  });

  return NextResponse.json({
    ok: true,
    privacy: "NO_PII_NO_FINANCE_NO_PROXY",
    generatedAt: new Date().toISOString(),
    items: rows.map((row) => ({
      qurbanNo: row.animal.qurbanAssignments[0]?.qurbanNo ?? null,
      queueNo: row.queueNo,
      status: row.status,
      updatedAt: row.updatedAt.toISOString(),
    })),
  }, { headers: { "Cache-Control": "no-store" } });
}
