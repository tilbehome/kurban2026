import { createHash, randomUUID } from "node:crypto";
import {
  calculateWeightShortfallAdjustment,
  normalizeConfirmSale,
  normalizeReceipt,
  type CommandMeta,
} from "@tilbecore/tenant-core";
import { PrismaClient } from "../packages/database-tenant/generated/client";
import { PrismaTenantManagementAnalyticsRepository } from "../packages/database-tenant/src/repositories/prisma-tenant-management-analytics-repository";
import { PrismaTenantMasterDataRepository } from "../packages/database-tenant/src/repositories/prisma-tenant-master-data-repository";
import { PrismaTenantOperationsRepository } from "../packages/database-tenant/src/repositories/prisma-tenant-operations-repository";
import { PrismaTenantSalesFinanceRepository } from "../packages/database-tenant/src/repositories/prisma-tenant-sales-finance-repository";

const tenantAUrl = required("REHEARSAL_TENANT_A_DATABASE_URL");
const tenantBUrl = required("REHEARSAL_TENANT_B_DATABASE_URL");
assertDisposableDatabaseUrl(tenantAUrl);
assertDisposableDatabaseUrl(tenantBUrl);
if (tenantAUrl === tenantBUrl) throw new Error("REHEARSAL_DATABASES_MUST_DIFFER");

const shared = {
  seasonId: "faz12-rehearsal-season",
  customerId: "faz12-rehearsal-customer",
  actorUserId: "faz12-rehearsal-actor",
  tenantInstanceId: "faz12-rehearsal-tenant",
};

const startedAt = performance.now();
const [tenantA, tenantB] = await Promise.all([
  rehearse("tenant-a", tenantAUrl),
  rehearse("tenant-b", tenantBUrl),
]);

if (tenantA.idsHash !== tenantB.idsHash) throw new Error("REHEARSAL_SHARED_IDS_MISMATCH");
if (tenantA.customerDisplayName === tenantB.customerDisplayName) throw new Error("REHEARSAL_TENANT_MARKERS_MUST_DIFFER");

console.log(JSON.stringify({
  kind: "synthetic-software-rehearsal",
  productionWrite: false,
  realPersonalData: false,
  elapsedMs: Math.round(performance.now() - startedAt),
  sharedIdsAcrossIsolatedDatabases: true,
  tenants: [tenantA, tenantB],
}, null, 2));

async function rehearse(label: string, databaseUrl: string) {
  const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  try {
    const preexisting = await db.season.count();
    if (preexisting !== 0) throw new Error(`REHEARSAL_DATABASE_NOT_EMPTY:${label}`);
    await seedScale(db, label);

    const sales = new PrismaTenantSalesFinanceRepository(db);
    const operations = new PrismaTenantOperationsRepository(db);
    const firstShares = shareIds(1);
    const secondShares = shareIds(2);
    const race = await Promise.allSettled([
      sales.confirmSale(normalizeConfirmSale({
        id: "faz12-race-sale-a", seasonId: shared.seasonId, customerId: shared.customerId,
        shareIds: [firstShares[0]!], listPricePerShare: "1000.0000",
        downPayment: { receiptId: "faz12-race-deposit-a", receiptNo: "RACE-A", methodSplits: [{ id: "faz12-race-cash-a", method: "cash", amount: "50.0000" }] },
      }), meta(label, "race-a")),
      sales.confirmSale(normalizeConfirmSale({
        id: "faz12-race-sale-b", seasonId: shared.seasonId, customerId: shared.customerId,
        shareIds: [firstShares[0]!], listPricePerShare: "1000.0000",
        downPayment: { receiptId: "faz12-race-deposit-b", receiptNo: "RACE-B", methodSplits: [{ id: "faz12-race-cash-b", method: "cash", amount: "50.0000" }] },
      }), meta(label, "race-b")),
    ]);
    const raceWinners = race.filter((result) => result.status === "fulfilled").length;
    const raceRejected = race.filter((result) => result.status === "rejected").length;
    if (raceWinners !== 1 || raceRejected !== 1) throw new Error(`REHEARSAL_CONCURRENT_SALE_INVARIANT:${label}`);

    const remainingSaleId = "faz12-main-sale";
    await sales.confirmSale(normalizeConfirmSale({
      id: remainingSaleId, seasonId: shared.seasonId, customerId: shared.customerId,
      shareIds: firstShares.slice(1), listPricePerShare: "1000.0000",
      downPayment: {
        receiptId: "faz12-main-deposit", receiptNo: "MAIN-DEPOSIT",
        methodSplits: [
          { id: "faz12-main-cash", method: "cash", amount: "60.0000" },
          { id: "faz12-main-bank", method: "bank_transfer", amount: "120.0000" },
          { id: "faz12-main-pos", method: "pos", amount: "120.0000" },
        ],
      },
    }), meta(label, "main-sale"));
    await sales.recordReceipt(normalizeReceipt({
      id: "faz12-main-receipt", seasonId: shared.seasonId, customerId: shared.customerId,
      saleId: remainingSaleId, receiptNo: "MAIN-RECEIPT", occurredAt: new Date().toISOString(),
      methodSplits: [
        { id: "faz12-receipt-cash", method: "cash", amount: "20.0000" },
        { id: "faz12-receipt-bank", method: "bank_transfer", amount: "20.0000" },
        { id: "faz12-receipt-pos", method: "pos", amount: "20.0000" },
      ],
      allocations: firstShares.slice(1).map((shareId, index) => ({
        id: `faz12-receipt-allocation-${index + 1}`, saleId: remainingSaleId,
        customerId: shared.customerId, shareId, amount: "10.0000",
      })),
    }), meta(label, "main-receipt"));

    const cancelledSaleId = "faz12-cancelled-sale";
    await sales.confirmSale(normalizeConfirmSale({
      id: cancelledSaleId, seasonId: shared.seasonId, customerId: shared.customerId,
      shareIds: [secondShares[0]!], listPricePerShare: "1000.0000",
      downPayment: { receiptId: "faz12-cancelled-deposit", receiptNo: "CANCEL-DEPOSIT", methodSplits: [{ id: "faz12-cancelled-cash", method: "cash", amount: "25.0000" }] },
    }), meta(label, "cancel-sale"));
    await sales.cancelSale({ saleId: cancelledSaleId, seasonId: shared.seasonId, reason: "Sentetik prova iptal ve reversal" }, meta(label, "cancel-sale-reversal"));

    await operations.createProxyDocument({
      id: "faz12-proxy", seasonId: shared.seasonId, grantorCustomerId: shared.customerId,
      shareIds: firstShares, method: "face_to_face_oral", policyVersion: "faz12-synthetic-v1",
      storageKey: "vekalet://protected/faz12-synthetic.pdf", status: "signed",
    }, meta(label, "proxy"));
    await db.season.update({ where: { id: shared.seasonId }, data: { status: "slaughter" } });

    await operations.createSlaughterJob({
      id: "faz12-slaughter-job", seasonId: shared.seasonId, animalId: animalId(1),
      shareCardId: shareCardId(1), queueNo: 1,
    }, meta(label, "slaughter-create"));
    for (const [index, nextStatus] of ["in_slaughter", "slaughtered", "skinning", "cutting", "weighing", "packaging", "ready_for_delivery", "delivered", "done"].entries()) {
      await operations.advanceSlaughter({
        id: "faz12-slaughter-job", seasonId: shared.seasonId,
        nextStatus: nextStatus as never, reason: `Sentetik prova adımı ${index + 1}`,
      }, meta(label, `slaughter-${index + 1}`));
    }

    await operations.recordWeighing({
      id: "faz12-weighing", seasonId: shared.seasonId, animalId: animalId(1),
      carcassWeightKg: "280.000", reason: "Sentetik prova tartımı",
    }, meta(label, "weighing"));
    await operations.allocateCarcassWeight({
      id: "faz12-weight-allocation", seasonId: shared.seasonId, animalId: animalId(1),
      sourceWeighingId: "faz12-weighing", totalWeightKg: "280.000",
    }, meta(label, "weight-allocation"));

    for (const [index, shareId] of firstShares.entries()) {
      const packageId = `faz12-package-${index + 1}`;
      await operations.createPackage({
        id: packageId, seasonId: shared.seasonId, shareId,
        grossWeightKg: "40.000", labelNo: `FAZ12-${index + 1}`,
      }, meta(label, `package-${index + 1}`));
      await operations.recordDelivery({
        id: `faz12-delivery-${index + 1}`, seasonId: shared.seasonId, shareId,
        customerId: shared.customerId, packageRecordIds: [packageId], deliveryType: index === 0 ? "address" : "on_site",
        proof: { id: `faz12-proof-${index + 1}`, proofType: "note", note: "Sentetik teslim kanıtı" },
      }, meta(label, `delivery-${index + 1}`));
    }

    await seedOfflineIdentity(db);
    await operations.enqueueOffline({
      id: "faz12-offline-item", seasonId: shared.seasonId, deviceId: "faz12-device",
      sessionId: "faz12-session", sessionVersion: 1, expectedVersion: 0, ttlSeconds: 300,
      operation: "scan.observation", payload: { synthetic: true, command: "delivery-check" },
      tenantInstanceId: shared.tenantInstanceId, actorUserId: shared.actorUserId,
    }, meta(label, "offline"));

    const dashboard = await new PrismaTenantManagementAnalyticsRepository(db).dashboard({ seasonId: shared.seasonId }, meta(label, "dashboard"));
    if (dashboard.entities.animals !== 50 || dashboard.sales.occupancyTotal !== 350 || !dashboard.finance.reconciled) {
      throw new Error(`REHEARSAL_DASHBOARD_RECONCILIATION:${label}`);
    }

    await db.season.update({ where: { id: shared.seasonId }, data: { status: "reconciliation" } });
    await new PrismaTenantMasterDataRepository(db).transitionSeason({ seasonId: shared.seasonId, from: "reconciliation", to: "archived" }, meta(label, "season-archive"));
    const archivedWriteRejected = await db.animal.create({
      data: { id: "faz12-archived-write", seasonId: shared.seasonId, earTag: "FAZ12-ARCHIVED-WRITE", status: "draft" },
    }).then(() => false, () => true);
    if (!archivedWriteRejected) throw new Error(`REHEARSAL_ARCHIVE_WRITE_ALLOWED:${label}`);

    const [animals, shares, deliveries, offline, journalDifference, audit, outbox, ids] = await Promise.all([
      db.animal.count({ where: { seasonId: shared.seasonId } }),
      db.share.count({ where: { shareCard: { seasonId: shared.seasonId } } }),
      db.deliveryRecord.count({ where: { seasonId: shared.seasonId, status: "delivered" } }),
      db.offlineQueueItem.count({ where: { seasonId: shared.seasonId, status: "queued" } }),
      db.$queryRaw<Array<{ difference: string }>>`SELECT COALESCE(SUM(t.debit - t.credit), 0)::text AS difference FROM (SELECT COALESCE(SUM("amount") FILTER (WHERE "side"='debit'),0) debit, COALESCE(SUM("amount") FILTER (WHERE "side"='credit'),0) credit FROM "JournalLine" GROUP BY "journalEntryId") t`,
      db.tenantAuditLog.count(),
      db.tenantOutboxMessage.count(),
      db.animal.findMany({ where: { seasonId: shared.seasonId }, select: { id: true }, orderBy: { id: "asc" } }),
    ]);
    return {
      label,
      customerDisplayName: `${label}-sentetik-musteri`,
      animals,
      shares,
      deliveries,
      offlineQueued: offline,
      concurrentSaleWinners: raceWinners,
      concurrentSaleRejected: raceRejected,
      cancellationReversal: await db.journalEntry.count({ where: { reversalOfId: { not: null } } }),
      weightDifferenceExample: calculateWeightShortfallAdjustment({ agreedPrice: "44000.0000", targetWeightKg: "40.000", actualWeightKg: "38.000" }),
      financeDifference: journalDifference[0]?.difference ?? "unknown",
      audit,
      outbox,
      seasonStatus: (await db.season.findUniqueOrThrow({ where: { id: shared.seasonId } })).status,
      archivedWriteRejected,
      idsHash: createHash("sha256").update(ids.map((item) => item.id).join("|")).digest("hex"),
    };
  } finally {
    await db.$disconnect();
  }
}

async function seedScale(db: PrismaClient, label: string) {
  await db.season.create({ data: { id: shared.seasonId, name: `${label} Sentetik Kurban Sezonu`, year: 2026, status: "sales" } });
  await db.customer.create({ data: { id: shared.customerId, displayName: `${label}-sentetik-musteri`, normalizedName: `${label.toUpperCase()} SENTETIK MUSTERI` } });
  await db.animal.createMany({ data: Array.from({ length: 50 }, (_, index) => ({
    id: animalId(index + 1), seasonId: shared.seasonId, earTag: `FAZ12-${String(index + 1).padStart(3, "0")}`,
    status: "available", liveWeightKg: "700.000", qurbanEligibility: "eligible",
  })) });
  await db.shareCard.createMany({ data: Array.from({ length: 50 }, (_, index) => ({
    id: shareCardId(index + 1), seasonId: shared.seasonId, animalId: animalId(index + 1),
    displayNo: `FAZ12-${index + 1}`, targetShareCount: 7,
  })) });
  await db.share.createMany({ data: Array.from({ length: 50 }, (_, animalIndex) =>
    Array.from({ length: 7 }, (_, shareIndex) => ({
      id: shareId(animalIndex + 1, shareIndex + 1), shareCardId: shareCardId(animalIndex + 1),
      sequenceNo: shareIndex + 1, status: "available",
    }))).flat() });
}

async function seedOfflineIdentity(db: PrismaClient) {
  await db.organizationUser.create({ data: { id: "faz12-user", displayName: "Sentetik Saha Kullanıcısı" } });
  await db.organizationMembership.create({ data: { id: "faz12-membership", organizationUserId: "faz12-user" } });
  await db.userSession.create({ data: {
    id: "faz12-session", organizationMembershipId: "faz12-membership", tokenHash: "synthetic-non-secret-hash",
    authenticatedAt: new Date(), expiresAt: new Date(Date.now() + 3_600_000),
  } });
  await db.deviceIdentity.create({ data: { id: "faz12-device", kind: "tablet", displayName: "Sentetik Tablet", credentialHash: "synthetic-non-secret-device-hash" } });
}

function meta(label: string, scope: string): CommandMeta {
  return {
    organizationId: `faz12-${label}-organization`, actorUserId: shared.actorUserId,
    requestId: `faz12-${label}-${scope}-${randomUUID()}`,
    idempotencyKey: `faz12-${label}-${scope}-${randomUUID()}`,
    requestHash: randomUUID().replaceAll("-", "").padEnd(64, "0"),
    occurredAt: new Date(),
  };
}

function animalId(index: number) { return `faz12-animal-${String(index).padStart(3, "0")}`; }
function shareCardId(index: number) { return `faz12-share-card-${String(index).padStart(3, "0")}`; }
function shareId(animalIndex: number, shareIndex: number) { return `faz12-share-${String(animalIndex).padStart(3, "0")}-${shareIndex}`; }
function shareIds(animalIndex: number) { return Array.from({ length: 7 }, (_, index) => shareId(animalIndex, index + 1)); }

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name}_REQUIRED`);
  return value;
}

function assertDisposableDatabaseUrl(value: string) {
  const url = new URL(value);
  if (!url.protocol.startsWith("postgres") || !["127.0.0.1", "localhost"].includes(url.hostname)) {
    throw new Error("REHEARSAL_LOCAL_POSTGRES_REQUIRED");
  }
  if (!url.pathname.slice(1).startsWith("tilbecore_rehearsal_")) throw new Error("REHEARSAL_DATABASE_NAME_FORBIDDEN");
}
