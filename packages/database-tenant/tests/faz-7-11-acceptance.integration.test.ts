import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, test } from "vitest";
import {
  calculateWeightShortfallAdjustment,
  TenantOperationsService,
  type CommandMeta,
  type TenantUseCaseContext,
} from "@tilbecore/tenant-core";
import { PrismaClient } from "../generated/client";
import { PrismaTenantManagementAnalyticsRepository } from "../src/repositories/prisma-tenant-management-analytics-repository";
import { PrismaTenantMasterDataRepository } from "../src/repositories/prisma-tenant-master-data-repository";
import { PrismaTenantOperationsRepository } from "../src/repositories/prisma-tenant-operations-repository";

const shouldRun = process.env.RUN_CORE_POSTGRES_TESTS === "1";
const databaseUrl = shouldRun ? process.env.TENANT_DATABASE_URL : undefined;
if (shouldRun && !databaseUrl) throw new Error("Faz 7-11 PostgreSQL test environment is incomplete.");
const describePostgres = databaseUrl ? describe : describe.skip;
const db = databaseUrl ? new PrismaClient({ datasources: { db: { url: databaseUrl } } }) : undefined;
const suffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

describePostgres("Faz 7-11 gerçek PostgreSQL kabul paketi", () => {
  test("çoklu vekâlet veren sahipliğini, korumalı belgeyi ve tek kullanımlık QR yaşam döngüsünü korur", async () => {
    if (!db) throw new Error("TEST_DATABASE_REQUIRED");
    const fixture = await operationalFixture("proxy");
    const repository = new PrismaTenantOperationsRepository(db);
    const service = new TenantOperationsService(repository);
    const outsiderId = `customer_outsider_${suffix}`;
    await db.customer.create({ data: { id: outsiderId, displayName: "Sentetik Yetkisiz Müşteri", normalizedName: "SENTETIK YETKISIZ MUSTERI" } });

    await expect(repository.createProxyDocument({
      id: `proxy_wrong_owner_${suffix}`,
      seasonId: fixture.seasonId,
      grantorCustomerId: outsiderId,
      shareIds: [fixture.shares[0]!.id],
      method: "phone",
      storageKey: `vekalet://wrong-${suffix}.pdf`,
      status: "signed",
    }, meta("proxy-wrong-owner"))).rejects.toThrowError("PROXY_GRANTOR_SHARE_MISMATCH");

    const proxyId = `proxy_multi_${suffix}`;
    await repository.createProxyDocument({
      id: proxyId,
      seasonId: fixture.seasonId,
      grantorCustomerId: fixture.customers[0]!,
      shareIds: fixture.shares.slice(0, 2).map((share) => share.id),
      grantors: fixture.shares.slice(0, 2).map((share, index) => ({ customerId: fixture.customers[index]!, shareIds: [share.id] })),
      method: "face_to_face_oral",
      policyVersion: "synthetic-v1",
      storageKey: `vekalet://protected/${proxyId}.pdf`,
      status: "draft",
    }, meta("proxy-multi"));
    await repository.changeProxyDocumentStatus({ id: proxyId, seasonId: fixture.seasonId, nextStatus: "received", reason: "Sentetik teslim" }, meta("proxy-received"));
    await repository.changeProxyDocumentStatus({ id: proxyId, seasonId: fixture.seasonId, nextStatus: "signed", reason: "Sentetik onay" }, meta("proxy-signed"));
    expect(await db.proxyGrantor.count({ where: { proxyDocumentId: proxyId } })).toBe(2);
    expect((await db.proxyDocumentHistory.findMany({ where: { proxyDocumentId: proxyId } })).map((row) => row.toStatus)).toEqual(["draft", "received", "signed"]);
    const safeDocument = await service.getProxyDocument(context("proxy-read"), { id: proxyId, seasonId: fixture.seasonId });
    expect(safeDocument).not.toHaveProperty("storageKey");
    expect((await service.resolveProxyDocumentDownload(context("proxy-download"), { id: proxyId, seasonId: fixture.seasonId })).storageKey).toContain("vekalet://protected/");

    const qr = await service.issueQrToken(context("qr-issue"), { id: `qr_${suffix}`, seasonId: fixture.seasonId, purpose: "proxyDocument", targetId: proxyId, expiresAt: new Date(Date.now() + 60_000).toISOString() });
    await service.consumeQrToken(context("qr-consume"), { opaqueToken: qr.opaqueToken, purpose: "proxyDocument" });
    await expect(service.consumeQrToken(context("qr-reuse"), { opaqueToken: qr.opaqueToken, purpose: "proxyDocument" })).rejects.toThrowError("QR_TOKEN_REVOKED");
    const expired = await service.issueQrToken(context("qr-expired-issue"), { id: `qr_expired_${suffix}`, seasonId: fixture.seasonId, purpose: "proxyDocument", targetId: proxyId, expiresAt: new Date(Date.now() - 1_000).toISOString() });
    await expect(service.consumeQrToken(context("qr-expired"), { opaqueToken: expired.opaqueToken, purpose: "proxyDocument" })).rejects.toThrowError("QR_TOKEN_EXPIRED");
    await expect(service.issueQrToken(context("qr-cross-season"), { id: `qr_cross_${suffix}`, seasonId: `wrong_${suffix}`, purpose: "proxyDocument", targetId: proxyId })).rejects.toThrowError("QR_TARGET_SCOPE_INVALID");
  });

  test("kesim durum makinesini, ekip/istasyon sezon sınırını, idempotency yarışını ve acil durdurmayı uygular", async () => {
    if (!db) throw new Error("TEST_DATABASE_REQUIRED");
    const fixture = await operationalFixture("slaughter", true);
    const repository = new PrismaTenantOperationsRepository(db);
    const teamId = `team_${suffix}`;
    const stationId = `station_${suffix}`;
    const otherSeasonId = `season_other_${suffix}`;
    await db.season.create({ data: { id: otherSeasonId, name: "Sentetik Diğer Sezon", status: "slaughter" } });
    await db.operationTeam.createMany({ data: [
      { id: teamId, seasonId: fixture.seasonId, code: "T1", name: "Sentetik Ekip" },
      { id: `team_other_${suffix}`, seasonId: otherSeasonId, code: "T2", name: "Başka Sezon Ekibi" },
    ] });
    await db.operationStation.create({ data: { id: stationId, seasonId: fixture.seasonId, code: "S1", name: "Sentetik İstasyon", stationType: "slaughter" } });
    const jobId = `job_${suffix}`;
    await repository.createSlaughterJob({ id: jobId, seasonId: fixture.seasonId, animalId: fixture.animalId, shareCardId: fixture.shareCardId, queueNo: 17 }, meta("job-create"));
    await expect(repository.advanceSlaughter({ id: jobId, seasonId: fixture.seasonId, nextStatus: "done", reason: "Geçersiz atlama" }, meta("job-invalid"))).rejects.toThrowError(/TRANSITION_NOT_ALLOWED/);
    await expect(repository.assignSlaughter({ id: jobId, seasonId: fixture.seasonId, teamId: `team_other_${suffix}`, reason: "Yanlış sezon" }, meta("job-cross-team"))).rejects.toThrowError("SLAUGHTER_ASSIGNMENT_SCOPE_INVALID");
    await repository.assignSlaughter({ id: jobId, seasonId: fixture.seasonId, teamId, stationId, queueNo: 18, reason: "Sentetik atama" }, meta("job-assign"));

    const concurrentMeta = meta("job-concurrent", "same-operation-hash");
    const results = await Promise.all([
      repository.advanceSlaughter({ id: jobId, seasonId: fixture.seasonId, nextStatus: "in_slaughter", reason: "Sentetik başlangıç" }, concurrentMeta),
      repository.advanceSlaughter({ id: jobId, seasonId: fixture.seasonId, nextStatus: "in_slaughter", reason: "Sentetik başlangıç" }, concurrentMeta),
    ]);
    expect(results).toEqual([{ id: jobId, status: "in_slaughter" }, { id: jobId, status: "in_slaughter" }]);
    expect(await db.tenantAuditLog.count({ where: { requestId: concurrentMeta.requestId, action: "slaughter.job.advanced" } })).toBe(1);
    await expect(repository.setOperationMode({ id: `mode_conflict_${suffix}`, seasonId: fixture.seasonId, mode: "normal", reason: "Farklı kapsam" }, concurrentMeta)).rejects.toThrowError("IDEMPOTENCY_CONFLICT");

    await repository.setOperationMode({ id: `mode_stop_${suffix}`, seasonId: fixture.seasonId, mode: "emergency_stop", reason: "Sentetik durdurma" }, meta("mode-stop"));
    await expect(repository.advanceSlaughter({ id: jobId, seasonId: fixture.seasonId, nextStatus: "slaughtered", reason: "Durdurma bypass" }, meta("job-stop-bypass"))).rejects.toThrowError("OPERATION_WRITES_DISABLED");
    await repository.setOperationMode({ id: `mode_normal_${suffix}`, seasonId: fixture.seasonId, mode: "normal", reason: "Sentetik devam" }, meta("mode-normal"));
    await repository.reportOperationException({ id: `exception_${suffix}`, seasonId: fixture.seasonId, slaughterJobId: jobId, category: "synthetic_block", severity: "high", description: "Sentetik istisna" }, meta("job-exception"));
    expect(await repository.listOperationCommandCenter(fixture.seasonId)).toEqual(expect.arrayContaining([expect.objectContaining({ id: jobId, status: "exception", stationId })]));
    expect(await repository.listTvProjection(fixture.seasonId)).toEqual(expect.arrayContaining([expect.objectContaining({ queueNo: 18, status: "exception" })]));
    expect(JSON.stringify(await repository.listTvProjection(fixture.seasonId))).not.toMatch(/customer|price|phone|payment/i);
  });

  test("tartım düzeltmesini, yedi hisse dağıtımını, paket izini ve teslim geri almayı atomik tutar", async () => {
    if (!db) throw new Error("TEST_DATABASE_REQUIRED");
    const fixture = await operationalFixture("fulfillment");
    const repository = new PrismaTenantOperationsRepository(db);
    const weighingId = `weighing_${suffix}`;
    await repository.recordWeighing({ id: weighingId, seasonId: fixture.seasonId, animalId: fixture.animalId, carcassWeightKg: "280.000", reason: "Sentetik tartım" }, meta("weighing"));
    const correctionId = `weighing_correction_${suffix}`;
    await repository.correctWeighing({ id: correctionId, supersedesId: weighingId, seasonId: fixture.seasonId, animalId: fixture.animalId, carcassWeightKg: "278.600", reason: "Kalibrasyon düzeltmesi" }, meta("weighing-correction"));
    expect(await db.weighingRecord.findUniqueOrThrow({ where: { id: weighingId } })).toMatchObject({ revokedByUserId: `actor_${suffix}` });
    await expect(repository.correctWeighing({ id: `weighing_second_${suffix}`, supersedesId: weighingId, seasonId: fixture.seasonId, animalId: fixture.animalId, carcassWeightKg: "278.500", reason: "İkinci düzeltme" }, meta("weighing-second"))).rejects.toThrowError("WEIGHING_CORRECTION_SOURCE_INVALID");
    await repository.allocateCarcassWeight({ id: `allocation_${suffix}`, seasonId: fixture.seasonId, animalId: fixture.animalId, sourceWeighingId: correctionId, totalWeightKg: "278.600" }, meta("allocation"));
    expect(await db.shareWeightAllocation.count({ where: { sourceWeighingId: correctionId } })).toBe(7);
    expect(calculateWeightShortfallAdjustment({ agreedPrice: "44000.0000", targetWeightKg: "40.000", actualWeightKg: "38.000" })).toBe("2200.0000");

    const packageId = `package_${suffix}`;
    const share = fixture.shares[0]!;
    await repository.createPackage({ id: packageId, seasonId: fixture.seasonId, shareId: share.id, grossWeightKg: "39.800", labelNo: `LBL-${suffix}`, components: [{ id: `component_${suffix}`, componentType: "bone_in", weightKg: "39.800" }] }, meta("package"));
    expect(await db.packageRecord.findUniqueOrThrow({ where: { id: packageId } })).toMatchObject({ seasonId: fixture.seasonId, animalId: fixture.animalId, customerId: fixture.customers[0], shareId: share.id });
    const deliveryId = `delivery_${suffix}`;
    await repository.recordDelivery({ id: deliveryId, seasonId: fixture.seasonId, shareId: share.id, customerId: fixture.customers[0]!, packageRecordIds: [packageId], deliveryType: "on_site", proof: { id: `proof_${suffix}`, proofType: "note", note: "Sentetik teslim" } }, meta("delivery"));
    await expect(repository.recordDelivery({ id: `delivery_duplicate_${suffix}`, seasonId: fixture.seasonId, shareId: share.id, customerId: fixture.customers[0]!, packageRecordIds: [packageId] }, meta("delivery-duplicate"))).rejects.toThrowError("SHARE_ALREADY_DELIVERED");
    await repository.reverseDelivery({ id: deliveryId, seasonId: fixture.seasonId, reason: "Sentetik geri alma" }, meta("delivery-reverse"));
    expect(await db.deliveryRecord.findUniqueOrThrow({ where: { id: deliveryId } })).toMatchObject({ status: "reversed", reversalReason: "Sentetik geri alma" });
    expect(await db.packageRecord.findUniqueOrThrow({ where: { id: packageId } })).toMatchObject({ status: "created" });
  });

  test("offline kayıt bağlarını, yönetim read-modelini, arama yetki filtresini ve arşiv salt-okunurluğunu doğrular", async () => {
    if (!db) throw new Error("TEST_DATABASE_REQUIRED");
    const fixture = await operationalFixture("management");
    const repository = new PrismaTenantOperationsRepository(db);
    const service = new TenantOperationsService(repository);
    const userId = `org_user_${suffix}`;
    const membershipId = `membership_${suffix}`;
    const sessionId = `session_${suffix}`;
    const deviceId = `device_${suffix}`;
    await db.organizationUser.create({ data: { id: userId, displayName: "Sentetik Saha Kullanıcısı" } });
    await db.organizationMembership.create({ data: { id: membershipId, organizationUserId: userId } });
    await db.userSession.create({ data: { id: sessionId, organizationMembershipId: membershipId, tokenHash: `hash_${suffix}`, authenticatedAt: new Date(), expiresAt: new Date(Date.now() + 60_000) } });
    await db.deviceIdentity.create({ data: { id: deviceId, kind: "tablet", displayName: "Sentetik Tablet", credentialHash: `device_hash_${suffix}` } });
    const offlineContext = context("offline", { sessionId });
    await service.enqueueOffline(offlineContext, { id: `offline_${suffix}`, seasonId: fixture.seasonId, deviceId, sessionVersion: 1, expectedVersion: 0, ttlSeconds: 60, operation: "scan.observation", payload: { scan: "SYNTHETIC-ONLY" } });
    const offline = await db.offlineQueueItem.findUniqueOrThrow({ where: { id: `offline_${suffix}` } });
    expect(offline).toMatchObject({ seasonId: fixture.seasonId, actorUserId: `actor_${suffix}`, deviceId, sessionId, status: "queued" });
    await expect(service.enqueueOffline(context("offline-secret", { sessionId }), { id: `offline_secret_${suffix}`, seasonId: fixture.seasonId, deviceId, sessionVersion: 1, expectedVersion: 0, ttlSeconds: 60, operation: "task.note", payload: { bearerToken: "synthetic-secret" } })).rejects.toThrowError("OFFLINE_QUEUE_SECRET_FORBIDDEN");

    const analytics = new PrismaTenantManagementAnalyticsRepository(db);
    const dashboard = await analytics.dashboard({ seasonId: fixture.seasonId }, meta("dashboard"));
    expect(dashboard.entities.animals).toBe(1);
    expect(dashboard.finance).toMatchObject({ unbalancedJournalEntries: 0, reconciled: true });
    expect(await analytics.search({ query: fixture.earTag, limit: 10, visiblePermissions: [] }, meta("search-denied"))).toEqual([]);
    expect(await analytics.search({ query: fixture.earTag, limit: 10, visiblePermissions: ["kurban.animal.read.organization"] }, meta("search-allowed"))).toEqual([expect.objectContaining({ provider: "animal", id: fixture.animalId })]);
    expect((await analytics.report({ reportKey: "fulfillment-progress", filters: { seasonId: fixture.seasonId } }, meta("report"))).exportContracts.map((item) => item.permission)).toEqual(["management.reporting.export.organization", "management.reporting.export.organization", "management.reporting.export.organization"]);

    const archiveSeasonId = `archive_season_${suffix}`;
    await db.season.create({ data: { id: archiveSeasonId, name: "Sentetik Arşiv Sezonu", status: "reconciliation" } });
    await new PrismaTenantMasterDataRepository(db).transitionSeason({ seasonId: archiveSeasonId, from: "reconciliation", to: "archived" }, meta("season-archive"));
    expect(await db.seasonClosureSnapshot.findUnique({ where: { seasonId: archiveSeasonId } })).toMatchObject({ unbalancedJournalCount: 0, openCriticalExceptionCount: 0, undeliveredShareCount: 0 });
    await expect(db.season.update({ where: { id: archiveSeasonId }, data: { name: "Sessiz değişiklik" } })).rejects.toThrow();
    await expect(db.animal.create({ data: { id: `archive_animal_${suffix}`, seasonId: archiveSeasonId, earTag: `ARCHIVE-${suffix}`, status: "draft" } })).rejects.toThrow();
  });
});

afterAll(async () => {
  await db?.$disconnect();
});

async function operationalFixture(scope: string, signedProxies = false) {
  if (!db) throw new Error("TEST_DATABASE_REQUIRED");
  const seasonId = `${scope}_season_${suffix}`;
  const animalId = `${scope}_animal_${suffix}`;
  const earTag = `${scope.toUpperCase()}-${suffix}`;
  const customers = Array.from({ length: 7 }, (_, index) => `${scope}_customer_${index + 1}_${suffix}`);
  await db.season.create({ data: { id: seasonId, name: `Sentetik ${scope} Sezonu`, status: "sales" } });
  await db.customer.createMany({ data: customers.map((id, index) => ({ id, displayName: `Sentetik Müşteri ${index + 1}`, normalizedName: `SENTETIK MUSTERI ${index + 1}` })) });
  await new PrismaTenantMasterDataRepository(db).createAnimal({ id: animalId, seasonId, earTag, liveWeightKg: "700.000" }, meta(`${scope}-animal`));
  await db.animal.update({ where: { id: animalId }, data: { qurbanEligibility: "eligible", status: "available" } });
  await db.season.update({ where: { id: seasonId }, data: { status: "slaughter" } });
  const shareCard = await db.shareCard.findFirstOrThrow({ where: { animalId, seasonId } });
  const shares = await db.share.findMany({ where: { shareCardId: shareCard.id }, orderBy: { sequenceNo: "asc" } });
  await Promise.all(shares.map((share, index) => db.share.update({ where: { id: share.id }, data: { status: "sold", customerId: customers[index] } })));
  if (signedProxies) {
    const repository = new PrismaTenantOperationsRepository(db);
    await repository.createProxyDocument({
      id: `${scope}_proxy_${suffix}`,
      seasonId,
      grantorCustomerId: customers[0]!,
      shareIds: shares.map((share) => share.id),
      grantors: shares.map((share, index) => ({ customerId: customers[index]!, shareIds: [share.id] })),
      method: "face_to_face_oral",
      storageKey: `vekalet://protected/${scope}-${suffix}.pdf`,
      status: "signed",
    }, meta(`${scope}-proxy`));
  }
  return { seasonId, animalId, earTag, shareCardId: shareCard.id, shares, customers };
}

function meta(scope: string, requestHash = randomUUID().replaceAll("-", "").padEnd(64, "0")): CommandMeta {
  return {
    organizationId: `org_${suffix}`,
    actorUserId: `actor_${suffix}`,
    requestId: `request_${scope}_${randomUUID()}`,
    idempotencyKey: `idem_${scope}_${randomUUID()}`,
    requestHash,
    occurredAt: new Date(),
  };
}

function context(scope: string, overrides: Partial<TenantUseCaseContext> = {}): TenantUseCaseContext {
  return {
    tenantInstanceId: `tenant_${suffix}` as TenantUseCaseContext["tenantInstanceId"],
    actorUserId: `actor_${suffix}` as TenantUseCaseContext["actorUserId"],
    permissions: ["*"],
    requestId: `request_${scope}_${randomUUID()}`,
    idempotencyKey: `idem_${scope}_${randomUUID()}`,
    requestHash: randomUUID().replaceAll("-", "").padEnd(64, "0"),
    occurredAt: new Date().toISOString(),
    authorizationMode: "legacy_bridge",
    ...overrides,
  };
}
