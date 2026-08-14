import { notFound } from "next/navigation";
import { PrismaClient as TenantPrismaClient } from "@/packages/database-tenant/generated/client";

export const dynamic = "force-dynamic";

declare global {
  var trackingPageTenantClient: TenantPrismaClient | undefined;
}

function tenantClient(): TenantPrismaClient {
  const databaseUrl = process.env.TENANT_DATABASE_URL;
  if (!databaseUrl) throw new Error("TENANT_DATABASE_URL_REQUIRED");
  const client = globalThis.trackingPageTenantClient ?? new TenantPrismaClient({ datasources: { db: { url: databaseUrl } } });
  if (process.env.NODE_ENV !== "production") globalThis.trackingPageTenantClient = client;
  return client;
}

export default async function CustomerTrackingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (token.length < 20) notFound();
  const db = tenantClient();
  const qr = await db.qrToken.findUnique({ where: { opaqueToken: token } });
  const now = new Date();
  if (!qr || qr.purpose !== "customerTracking" || qr.revokedAt || (qr.expiresAt && qr.expiresAt <= now)) notFound();
  const share = await db.share.findUnique({
    where: { id: qr.targetId },
    include: {
      shareCard: { include: { animal: { include: { qurbanAssignments: { where: { active: true }, take: 1 } } }, slaughterJobs: { orderBy: { updatedAt: "desc" }, take: 1 } } },
      packages: { select: { id: true } },
      deliveries: { select: { status: true }, orderBy: { deliveredAt: "desc" }, take: 1 },
    },
  });
  if (!share) notFound();
  const status = share.shareCard.slaughterJobs[0]?.status ?? "waiting";
  return (
    <main className="mx-auto min-h-screen max-w-xl bg-neutral-950 px-5 py-12 text-neutral-100">
      <p className="text-sm text-neutral-400">TilbeCore güvenli müşteri takibi</p>
      <h1 className="mt-2 text-3xl font-semibold">Kurban #{share.shareCard.animal.qurbanAssignments[0]?.qurbanNo ?? "—"}</h1>
      <div className="mt-8 space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
        <p><span className="text-neutral-400">Hisse:</span> {share.sequenceNo}</p>
        <p><span className="text-neutral-400">Operasyon durumu:</span> {status}</p>
        <p><span className="text-neutral-400">Hazırlanan paket:</span> {share.packages.length}</p>
        <p><span className="text-neutral-400">Teslim:</span> {share.deliveries[0]?.status === "delivered" ? "Tamamlandı" : "Bekliyor"}</p>
      </div>
      <p className="mt-5 text-xs text-neutral-500">Bu sayfa ad, telefon, adres veya finans bilgisi göstermez. Bağlantı süreli ve iptal edilebilirdir.</p>
    </main>
  );
}
