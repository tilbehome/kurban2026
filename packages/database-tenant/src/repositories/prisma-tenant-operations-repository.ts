import { randomUUID } from "node:crypto";
import {
  assertOperationTransition,
  assertQrUsable,
  TenantOperationsError,
  type AdvanceSlaughterInput,
  type CommandMeta,
  type CreatePackageInput,
  type CreateProxyDocumentInput,
  type ChangeProxyDocumentStatusInput,
  type CreateSlaughterJobInput,
  type DeliveryCommandInput,
  type IssueQrTokenInput,
  type CreateLoadingListInput,
  type MovePackageInput,
  type OperationsRepository,
  type RecordWeighingInput,
  type SlaughterStatus,
} from "@tilbecore/tenant-core";
import type { Prisma, PrismaClient } from "../../generated/client";

type Tx = Prisma.TransactionClient;
type ShareCardForSlaughter = Prisma.ShareCardGetPayload<{ include: { animal: true; shares: { include: { proxyDocumentShares: { include: { proxyDocument: true } } } } } }>;
type ShareCardForDeliveryClose = Prisma.ShareCardGetPayload<{ include: { shares: { include: { deliveries: true } } } }>;
type TvProjectionRow = Prisma.SlaughterJobGetPayload<{ include: { animal: { include: { qurbanAssignments: true } } } }>;

export class PrismaTenantOperationsRepository implements OperationsRepository {
  constructor(private readonly db: PrismaClient) {}

  createProxyDocument(input: CreateProxyDocumentInput, meta: CommandMeta) {
    return command(this.db, "proxy.document.create", meta, async (tx) => {
      const shareCount = await tx.share.count({ where: { id: { in: input.shareIds }, shareCard: { seasonId: input.seasonId } } });
      if (shareCount !== input.shareIds.length) throw new TenantOperationsError("PROXY_SHARE_SCOPE_INVALID");
      const grantors = input.grantors ?? [{ customerId: input.grantorCustomerId, shareIds: input.shareIds }];
      const grantorCustomerIds = [...new Set(grantors.map((grantor) => grantor.customerId))];
      const grantorCount = await tx.customer.count({ where: { id: { in: grantorCustomerIds } } });
      if (grantorCount !== grantorCustomerIds.length) throw new TenantOperationsError("PROXY_GRANTOR_SHARE_MISMATCH");
      await tx.proxyDocument.create({
        data: {
          id: input.id,
          seasonId: input.seasonId,
          customerId: input.grantorCustomerId,
          status: input.status ?? "signed",
          version: 1,
          method: input.method,
          storageKey: input.storageKey,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          createdByUserId: meta.actorUserId,
          signedAt: input.status === "draft" ? undefined : meta.occurredAt,
          shares: { create: input.shareIds.map((shareId) => ({ shareId })) },
        },
      });
      const policyVersion = input.policyVersion?.trim() || "legacy-api-v1";
      await tx.$executeRaw`UPDATE "ProxyDocument" SET "policyVersion" = ${policyVersion}, "receivedAt" = ${input.receivedAt ? new Date(input.receivedAt) : meta.occurredAt}, "receivedPlace" = ${input.receivedPlace ?? null}, "receivedByUserId" = ${input.receivedByUserId ?? meta.actorUserId}, "description" = ${input.description ?? null} WHERE "id" = ${input.id}`;
      for (const grantor of grantors) {
        for (const shareId of grantor.shareIds) {
          await tx.$executeRaw`INSERT INTO "ProxyGrantor" ("proxyDocumentId", "customerId", "shareId", "relationshipToShareholder", "createdAt") VALUES (${input.id}, ${grantor.customerId}, ${shareId}, ${grantor.relationshipToShareholder ?? null}, ${meta.occurredAt})`;
        }
      }
      await tx.$executeRaw`INSERT INTO "ProxyDocumentHistory" ("id", "proxyDocumentId", "fromStatus", "toStatus", "reason", "actorUserId", "occurredAt") VALUES (${`proxy_history_${randomUUID()}`}, ${input.id}, ${null}, ${input.status ?? "signed"}, ${"Vekâlet kaydı oluşturuldu"}, ${meta.actorUserId}, ${meta.occurredAt})`;
      await evidence(tx, meta, "proxy.document.created", "ProxyDocument", input.id, { seasonId: input.seasonId, method: input.method, policyVersion, shareIds: input.shareIds, grantorCount: grantors.length });
      return { id: input.id, shareIds: input.shareIds };
    });
  }

  revokeProxyDocument(input: { id: string; seasonId: string; reason: string }, meta: CommandMeta) {
    return command(this.db, "proxy.document.revoke", meta, async (tx) => {
      const changed = await tx.proxyDocument.updateMany({ where: { id: input.id, seasonId: input.seasonId, status: { not: "revoked" } }, data: { status: "revoked", revokedAt: meta.occurredAt, revocationReason: input.reason, version: { increment: 1 } } });
      if (changed.count !== 1) throw new TenantOperationsError("PROXY_DOCUMENT_NOT_FOUND_OR_REVOKED");
      await tx.$executeRaw`INSERT INTO "ProxyDocumentHistory" ("id", "proxyDocumentId", "fromStatus", "toStatus", "reason", "actorUserId", "occurredAt") VALUES (${`proxy_history_${randomUUID()}`}, ${input.id}, ${"signed"}, ${"revoked"}, ${input.reason}, ${meta.actorUserId}, ${meta.occurredAt})`;
      await evidence(tx, meta, "proxy.document.revoked", "ProxyDocument", input.id, { seasonId: input.seasonId, reason: input.reason });
      return { id: input.id };
    });
  }

  changeProxyDocumentStatus(input: ChangeProxyDocumentStatusInput, meta: CommandMeta) {
    return command(this.db, "proxy.document.status.change", meta, async (tx) => {
      const rows = await tx.$queryRaw<Array<{ status: string }>>`SELECT "status" FROM "ProxyDocument" WHERE "id" = ${input.id} AND "seasonId" = ${input.seasonId} FOR UPDATE`;
      const current = rows[0]?.status;
      if (!current) throw new TenantOperationsError("PROXY_DOCUMENT_NOT_FOUND");
      const allowed: Record<string, readonly string[]> = {
        draft: ["received", "signed", "invalid"],
        received: ["signed", "invalid"],
        signed: ["revoked", "invalid", "lost"],
        revoked: [], invalid: [], lost: [],
      };
      if (!(allowed[current] ?? []).includes(input.nextStatus)) throw new TenantOperationsError("PROXY_STATUS_TRANSITION_NOT_ALLOWED");
      await tx.$executeRaw`UPDATE "ProxyDocument" SET "status" = ${input.nextStatus}, "version" = "version" + 1, "signedAt" = CASE WHEN ${input.nextStatus} = 'signed' THEN ${meta.occurredAt} ELSE "signedAt" END, "revokedAt" = CASE WHEN ${input.nextStatus} IN ('revoked','invalid','lost') THEN ${meta.occurredAt} ELSE "revokedAt" END, "revocationReason" = CASE WHEN ${input.nextStatus} IN ('revoked','invalid','lost') THEN ${input.reason} ELSE "revocationReason" END WHERE "id" = ${input.id}`;
      await tx.$executeRaw`INSERT INTO "ProxyDocumentHistory" ("id", "proxyDocumentId", "fromStatus", "toStatus", "reason", "actorUserId", "occurredAt") VALUES (${`proxy_history_${randomUUID()}`}, ${input.id}, ${current}, ${input.nextStatus}, ${input.reason}, ${meta.actorUserId}, ${meta.occurredAt})`;
      if (["revoked", "invalid", "lost"].includes(input.nextStatus)) {
        await tx.$executeRaw`UPDATE "QrToken" SET "revokedAt" = ${meta.occurredAt} WHERE "purpose" = 'proxyDocument' AND "targetId" = ${input.id} AND "revokedAt" IS NULL`;
      }
      await evidence(tx, meta, "proxy.document.status.changed", "ProxyDocument", input.id, { seasonId: input.seasonId, from: current, to: input.nextStatus, reason: input.reason });
      return { id: input.id, status: input.nextStatus };
    });
  }

  async getProxyDocument(input: { id: string; seasonId: string }) {
    const row = await this.db.proxyDocument.findFirst({ where: { id: input.id, seasonId: input.seasonId }, select: { id: true, seasonId: true, customerId: true, status: true, storageKey: true, mimeType: true, sizeBytes: true } });
    return row ? { ...row, mimeType: row.mimeType ?? undefined, sizeBytes: row.sizeBytes ?? undefined } : null;
  }

  issueQrToken(input: IssueQrTokenInput & { opaqueToken: string }, meta: CommandMeta) {
    return command(this.db, "qr.token.issue", meta, async (tx) => {
      await tx.qrToken.create({
        data: {
          id: input.id,
          purpose: input.purpose,
          targetId: input.targetId,
          opaqueToken: input.opaqueToken,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        },
      });
      await evidence(tx, meta, "qr.token.issued", "QrToken", input.id, { purpose: input.purpose, targetId: input.targetId });
      return { id: input.id, opaqueToken: input.opaqueToken };
    });
  }

  consumeQrToken(input: { opaqueToken: string; purpose: string; now: string }, meta: CommandMeta) {
    return command(this.db, "qr.token.consume", meta, async (tx) => {
      const token = await tx.qrToken.findUnique({ where: { opaqueToken: input.opaqueToken } });
      if (!token || token.purpose !== input.purpose) throw new TenantOperationsError("QR_TOKEN_NOT_FOUND");
      assertQrUsable({
        tenantInstanceId: "tenant" as never,
        id: token.id as never,
        purpose: token.purpose as never,
        targetId: token.targetId,
        opaqueToken: token.opaqueToken,
        expiresAt: token.expiresAt?.toISOString(),
        revokedAt: token.revokedAt?.toISOString(),
      }, input.now);
      await tx.qrToken.update({ where: { id: token.id }, data: { revokedAt: meta.occurredAt } });
      await evidence(tx, meta, "qr.token.consumed", "QrToken", token.id, { purpose: token.purpose, targetId: token.targetId });
      return { id: token.id, targetId: token.targetId };
    });
  }

  createSlaughterJob(input: CreateSlaughterJobInput, meta: CommandMeta) {
    return command(this.db, "slaughter.job.create", meta, async (tx) => {
      const shareCard = await tx.shareCard.findUnique({
        where: { id: input.shareCardId },
        include: { animal: true, shares: { include: { proxyDocumentShares: { include: { proxyDocument: true } } } } },
      });
      if (!shareCard || shareCard.seasonId !== input.seasonId || shareCard.animalId !== input.animalId) throw new TenantOperationsError("SLAUGHTER_SHARE_CARD_INVALID");
      if (shareCard.shares.length !== 7) throw new TenantOperationsError("SLAUGHTER_REQUIRES_SEVEN_SHARES");
      const slaughterShareCard = shareCard as ShareCardForSlaughter;
      if (slaughterShareCard.shares.some((share) => share.status !== "sold")) throw new TenantOperationsError("RELIGIOUS_ELIGIBILITY_OPEN_DECISION_REQUIRED");
      const missingProxy = slaughterShareCard.shares.some((share) => !share.proxyDocumentShares.some((link) => link.proxyDocument.status === "signed"));
      if (missingProxy) throw new TenantOperationsError("SLAUGHTER_REQUIRES_SEVEN_VALID_PROXY_DOCUMENTS");
      if (shareCard.animal.qurbanEligibility !== "eligible") throw new TenantOperationsError("ANIMAL_QURBAN_ELIGIBILITY_BLOCKED");
      await tx.slaughterJob.create({ data: { id: input.id, seasonId: input.seasonId, animalId: input.animalId, shareCardId: input.shareCardId, status: "ready", queueNo: input.queueNo, assignedUserId: input.assignedUserId } });
      await evidence(tx, meta, "slaughter.job.created", "SlaughterJob", input.id, { seasonId: input.seasonId, queueNo: input.queueNo });
      return { id: input.id };
    });
  }

  advanceSlaughter(input: AdvanceSlaughterInput, meta: CommandMeta) {
    return command(this.db, "slaughter.job.advance", meta, async (tx) => {
      const row = await tx.slaughterJob.findUnique({ where: { id: input.id } });
      if (!row || row.seasonId !== input.seasonId) throw new TenantOperationsError("SLAUGHTER_JOB_NOT_FOUND");
      assertOperationTransition(row.status as SlaughterStatus, input.nextStatus);
      await tx.slaughterJob.update({ where: { id: input.id }, data: { status: input.nextStatus } });
      await evidence(tx, meta, "slaughter.job.advanced", "SlaughterJob", input.id, { seasonId: input.seasonId, from: row.status, to: input.nextStatus, reason: input.reason });
      return { id: input.id, status: input.nextStatus };
    });
  }

  recordWeighing(input: RecordWeighingInput, meta: CommandMeta) {
    return command(this.db, "weighing.record", meta, async (tx) => {
      const animal = await tx.animal.findUnique({ where: { id: input.animalId }, select: { seasonId: true } });
      if (!animal || animal.seasonId !== input.seasonId) throw new TenantOperationsError("WEIGHING_ANIMAL_SCOPE_INVALID");
      await tx.weighingRecord.create({ data: { id: input.id, animalId: input.animalId, carcassWeightKg: input.carcassWeightKg, recordedByUserId: meta.actorUserId, recordedAt: meta.occurredAt } });
      await tx.animal.update({ where: { id: input.animalId }, data: { carcassWeightKg: input.carcassWeightKg } });
      await evidence(tx, meta, "weighing.recorded", "WeighingRecord", input.id, { seasonId: input.seasonId, animalId: input.animalId, reason: input.reason });
      return { id: input.id };
    });
  }

  createPackage(input: CreatePackageInput, meta: CommandMeta) {
    return command(this.db, "package.create", meta, async (tx) => {
      const share = await tx.share.findUnique({ where: { id: input.shareId }, include: { shareCard: true } });
      if (!share || share.shareCard.seasonId !== input.seasonId) throw new TenantOperationsError("PACKAGE_SHARE_SCOPE_INVALID");
      await tx.packageRecord.create({ data: { id: input.id, shareId: input.shareId, grossWeightKg: input.grossWeightKg, labelNo: input.labelNo } });
      for (const component of input.components ?? []) {
        await tx.$executeRaw`INSERT INTO "PackageComponent" ("id", "packageRecordId", "componentType", "weightKg", "estimatedValue", "createdAt") VALUES (${component.id}, ${input.id}, ${component.componentType}, ${component.weightKg}::decimal, ${component.estimatedValue ?? null}::decimal, ${meta.occurredAt})`;
      }
      await evidence(tx, meta, "package.created", "PackageRecord", input.id, { seasonId: input.seasonId, shareId: input.shareId, labelNo: input.labelNo, reason: input.reason, components: input.components ?? [] });
      return { id: input.id };
    });
  }

  recordDelivery(input: DeliveryCommandInput, meta: CommandMeta) {
    return command(this.db, "delivery.record", meta, async (tx) => {
      const share = await tx.share.findUnique({ where: { id: input.shareId }, include: { shareCard: true, packages: true } });
      if (!share || share.shareCard.seasonId !== input.seasonId) throw new TenantOperationsError("DELIVERY_SHARE_SCOPE_INVALID");
      if (share.customerId !== input.customerId) throw new TenantOperationsError("DELIVERY_CUSTOMER_MISMATCH");
      if (share.status !== "sold") throw new TenantOperationsError("DELIVERY_REQUIRES_SOLD_SHARE");
      if (share.packages.length === 0) throw new TenantOperationsError("DELIVERY_REQUIRES_READY_PACKAGE");
      const existing = await tx.deliveryRecord.findFirst({ where: { shareId: input.shareId, status: "delivered" } });
      if (existing) throw new TenantOperationsError("SHARE_ALREADY_DELIVERED");
      await tx.deliveryRecord.create({ data: { id: input.id, shareId: input.shareId, customerId: input.customerId, status: "delivered", deliveredAt: meta.occurredAt } });
      if (input.receiverName || input.loadingListId || input.debtOverride) {
        await tx.$executeRaw`UPDATE "DeliveryRecord" SET "receiverName" = ${input.receiverName ?? null}, "loadingListId" = ${input.loadingListId ?? null}, "debtOverrideReason" = ${input.debtOverride?.reason ?? null}, "approvalRequestId" = ${input.debtOverride?.approvalRequestId ?? null} WHERE "id" = ${input.id}`;
      }
      if (input.proof) {
        await tx.$executeRaw`INSERT INTO "DeliveryProof" ("id", "deliveryRecordId", "proofType", "storageKey", "note", "capturedAt") VALUES (${input.proof.id}, ${input.id}, ${input.proof.proofType}, ${input.proof.storageKey ?? input.debtOverride?.storageKey ?? null}, ${input.proof.note ?? input.reason ?? null}, ${meta.occurredAt})`;
      }
      await evidence(tx, meta, "delivery.recorded", "DeliveryRecord", input.id, { seasonId: input.seasonId, shareId: input.shareId, receiverName: input.receiverName, loadingListId: input.loadingListId, debtOverride: Boolean(input.debtOverride) });
      return { id: input.id, status: "delivered" as const };
    });
  }

  reverseDelivery(input: { id: string; seasonId: string; reason: string }, meta: CommandMeta) {
    return command(this.db, "delivery.reverse", meta, async (tx) => {
      const row = await tx.deliveryRecord.findUnique({ where: { id: input.id }, include: { share: { include: { shareCard: true } } } });
      if (!row || row.share.shareCard.seasonId !== input.seasonId) throw new TenantOperationsError("DELIVERY_NOT_FOUND");
      if (row.status !== "delivered") throw new TenantOperationsError("DELIVERY_NOT_REVERSIBLE");
      await tx.deliveryRecord.update({ where: { id: input.id }, data: { status: "reversed", reversedAt: meta.occurredAt, reversalReason: input.reason } });
      await evidence(tx, meta, "delivery.reversed", "DeliveryRecord", input.id, { seasonId: input.seasonId, reason: input.reason });
      return { id: input.id, status: "reversed" as const };
    });
  }

  movePackage(input: MovePackageInput, meta: CommandMeta) {
    return command(this.db, "package.location.move", meta, async (tx) => {
      const share = await tx.share.findFirst({ where: { packages: { some: { id: input.packageRecordId } }, shareCard: { seasonId: input.seasonId } }, select: { id: true } });
      if (!share) throw new TenantOperationsError("PACKAGE_SHARE_SCOPE_INVALID");
      await tx.$executeRaw`UPDATE "PackageLocation" SET "status" = 'removed', "removedAt" = ${meta.occurredAt} WHERE "packageRecordId" = ${input.packageRecordId} AND "status" = 'active'`;
      await tx.$executeRaw`INSERT INTO "PackageLocation" ("id", "packageRecordId", "roomId", "sectionId", "rackId", "status", "placedAt", "reason") VALUES (${input.id}, ${input.packageRecordId}, ${input.roomId}, ${input.sectionId ?? null}, ${input.rackId ?? null}, 'active', ${meta.occurredAt}, ${input.reason})`;
      await tx.$executeRaw`UPDATE "PackageRecord" SET "coldRoomId" = ${input.roomId}, "coldSectionId" = ${input.sectionId ?? null}, "coldRackId" = ${input.rackId ?? null}, "locationStatus" = 'stored' WHERE "id" = ${input.packageRecordId}`;
      await evidence(tx, meta, "package.location.moved", "PackageRecord", input.packageRecordId, { seasonId: input.seasonId, roomId: input.roomId, sectionId: input.sectionId, rackId: input.rackId, reason: input.reason });
      return { id: input.id };
    });
  }

  createLoadingList(input: CreateLoadingListInput, meta: CommandMeta) {
    return command(this.db, "loading.list.create", meta, async (tx) => {
      await tx.$executeRaw`INSERT INTO "LoadingList" ("id", "seasonId", "vehicleId", "status", "routeName", "createdAt") VALUES (${input.id}, ${input.seasonId}, ${input.vehicleId ?? null}, 'draft', ${input.routeName ?? null}, ${meta.occurredAt})`;
      for (const packageRecordId of input.packageRecordIds) {
        await tx.$executeRaw`INSERT INTO "LoadingListItem" ("loadingListId", "packageRecordId", "status") VALUES (${input.id}, ${packageRecordId}, 'planned')`;
      }
      await evidence(tx, meta, "loading.list.created", "LoadingList", input.id, { seasonId: input.seasonId, vehicleId: input.vehicleId, packageCount: input.packageRecordIds.length });
      return { id: input.id, itemCount: input.packageRecordIds.length };
    });
  }

  closeAnimalIfDelivered(input: { seasonId: string; animalId: string; reason: string }, meta: CommandMeta) {
    return command(this.db, "animal.delivery.close", meta, async (tx) => {
      const shareCard = await tx.shareCard.findFirst({
        where: { seasonId: input.seasonId, animalId: input.animalId, status: "active" },
        include: { shares: { include: { deliveries: true } } },
      });
      if (!shareCard) throw new TenantOperationsError("SLAUGHTER_SHARE_CARD_INVALID");
      if (shareCard.shares.length !== 7) throw new TenantOperationsError("SLAUGHTER_REQUIRES_SEVEN_SHARES");
      const deliveryShareCard = shareCard as ShareCardForDeliveryClose;
      const allDelivered = deliveryShareCard.shares.every((share) => share.deliveries.some((delivery) => delivery.status === "delivered"));
      if (!allDelivered) throw new TenantOperationsError("ANIMAL_CLOSE_REQUIRES_SEVEN_DELIVERIES");
      await tx.animal.update({ where: { id: input.animalId }, data: { status: "delivered" } });
      await evidence(tx, meta, "animal.delivery.closed", "Animal", input.animalId, { seasonId: input.seasonId, reason: input.reason });
      return { animalId: input.animalId, closed: true as const };
    });
  }

  enqueueOffline(input: { id: string; operation: string; payload: Record<string, unknown> }, meta: CommandMeta) {
    return command(this.db, "offline.queue.enqueue", meta, async (tx) => {
      await tx.offlineQueueItem.create({ data: { id: input.id, idempotencyKey: meta.idempotencyKey, operation: input.operation, payload: json(input.payload), status: "queued" } });
      await evidence(tx, meta, "offline.queue.enqueued", "OfflineQueueItem", input.id, { operation: input.operation });
      return { id: input.id };
    });
  }

  async listTvProjection(seasonId: string) {
    const rows = await this.db.slaughterJob.findMany({
      where: { seasonId },
      include: { animal: { include: { qurbanAssignments: { where: { seasonId, active: true }, take: 1 } } } },
      orderBy: [{ queueNo: "asc" }, { updatedAt: "asc" }],
      take: 80,
    });
    return (rows as TvProjectionRow[]).map((row) => ({
      qurbanNo: row.animal.qurbanAssignments[0]?.qurbanNo ?? undefined,
      queueNo: row.queueNo ?? undefined,
      status: row.status,
      updatedAt: row.updatedAt.toISOString(),
    }));
  }
}

async function command<TResult>(db: PrismaClient, scope: string, meta: CommandMeta, run: (tx: Tx) => Promise<TResult>): Promise<TResult> {
  return db.$transaction(async (tx) => {
    const existing = await tx.tenantIdempotencyRecord.findUnique({ where: { key: meta.idempotencyKey } });
    if (existing?.status === "completed" && existing.resultPayload) return existing.resultPayload as TResult;
    if (existing && existing.requestHash !== meta.requestHash) throw new TenantOperationsError("IDEMPOTENCY_CONFLICT");
    await tx.tenantIdempotencyRecord.upsert({
      where: { key: meta.idempotencyKey },
      create: { key: meta.idempotencyKey, scope, actorUserId: meta.actorUserId, requestId: meta.requestId, requestHash: meta.requestHash },
      update: { requestId: meta.requestId },
    });
    const result = await run(tx);
    await tx.tenantIdempotencyRecord.update({ where: { key: meta.idempotencyKey }, data: { status: "completed", completedAt: meta.occurredAt, resultPayload: json(result) } });
    return result;
  });
}

async function evidence(tx: Tx, meta: CommandMeta, action: string, targetType: string, targetId: string, metadata: Record<string, unknown>) {
  const payload = json({ targetType, targetId, requestId: meta.requestId, occurredAt: meta.occurredAt.toISOString(), ...metadata });
  await tx.tenantAuditLog.create({ data: { id: `audit_${randomUUID()}`, actorUserId: meta.actorUserId, action, targetType, targetId, requestId: meta.requestId, occurredAt: meta.occurredAt, metadata: json(metadata) } });
  await tx.tenantOutboxMessage.create({ data: { id: `outbox_${randomUUID()}`, topic: action, payload, status: "pending", idempotencyKey: meta.idempotencyKey } });
}

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
