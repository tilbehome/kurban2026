import { randomUUID } from "node:crypto";
import {
  assertOperationTransition,
  assertQrUsable,
  TenantOperationsError,
  type AdvanceSlaughterInput,
  type CommandMeta,
  type CreatePackageInput,
  type CreateProxyDocumentInput,
  type CreateSlaughterJobInput,
  type DeliveryCommandInput,
  type IssueQrTokenInput,
  type OperationsRepository,
  type RecordWeighingInput,
  type SlaughterStatus,
} from "@tilbecore/tenant-core";
import type { Prisma, PrismaClient } from "../../generated/client";

type Tx = Prisma.TransactionClient;
type AnyTx = Tx & Record<string, any>;

export class PrismaTenantOperationsRepository implements OperationsRepository {
  constructor(private readonly db: PrismaClient) {}

  createProxyDocument(input: CreateProxyDocumentInput, meta: CommandMeta) {
    return command(this.db, "proxy.document.create", meta, async (tx) => {
      const shareCount = await tx.share.count({ where: { id: { in: input.shareIds }, shareCard: { seasonId: input.seasonId } } });
      if (shareCount !== input.shareIds.length) throw new TenantOperationsError("PROXY_SHARE_SCOPE_INVALID");
      await tx.proxyDocument.create({
        data: {
          id: input.id,
          customerId: input.grantorCustomerId,
          status: input.status ?? "signed",
          version: 1,
          storageKey: input.storageKey,
          signedAt: input.status === "draft" ? undefined : meta.occurredAt,
          shares: { create: input.shareIds.map((shareId) => ({ shareId })) },
        },
      });
      await evidence(tx, meta, "proxy.document.created", "ProxyDocument", input.id, { seasonId: input.seasonId, method: input.method, shareIds: input.shareIds });
      return { id: input.id, shareIds: input.shareIds };
    });
  }

  revokeProxyDocument(input: { id: string; seasonId: string; reason: string }, meta: CommandMeta) {
    return command(this.db, "proxy.document.revoke", meta, async (tx) => {
      await tx.proxyDocument.update({ where: { id: input.id }, data: { status: "revoked", revokedAt: meta.occurredAt, version: { increment: 1 } } });
      await evidence(tx, meta, "proxy.document.revoked", "ProxyDocument", input.id, { seasonId: input.seasonId, reason: input.reason });
      return { id: input.id };
    });
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
      if (shareCard.shares.some((share: any) => share.status !== "sold")) throw new TenantOperationsError("RELIGIOUS_ELIGIBILITY_OPEN_DECISION_REQUIRED");
      const missingProxy = shareCard.shares.some((share: any) => !share.proxyDocumentShares.some((link: any) => link.proxyDocument.status === "signed"));
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
      await evidence(tx, meta, "package.created", "PackageRecord", input.id, { seasonId: input.seasonId, shareId: input.shareId, labelNo: input.labelNo, reason: input.reason });
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
      await evidence(tx, meta, "delivery.recorded", "DeliveryRecord", input.id, { seasonId: input.seasonId, shareId: input.shareId, receiverName: input.receiverName });
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
    return rows.map((row: any) => ({
      qurbanNo: row.animal.qurbanAssignments[0]?.qurbanNo ?? undefined,
      queueNo: row.queueNo ?? undefined,
      status: row.status,
      updatedAt: row.updatedAt.toISOString(),
    }));
  }
}

async function command<TResult>(db: PrismaClient, scope: string, meta: CommandMeta, run: (tx: AnyTx) => Promise<TResult>): Promise<TResult> {
  return db.$transaction(async (tx) => {
    const existing = await tx.tenantIdempotencyRecord.findUnique({ where: { key: meta.idempotencyKey } });
    if (existing?.status === "completed" && existing.resultPayload) return existing.resultPayload as TResult;
    if (existing && existing.requestHash !== meta.requestHash) throw new TenantOperationsError("IDEMPOTENCY_CONFLICT");
    await tx.tenantIdempotencyRecord.upsert({
      where: { key: meta.idempotencyKey },
      create: { key: meta.idempotencyKey, scope, actorUserId: meta.actorUserId, requestId: meta.requestId, requestHash: meta.requestHash },
      update: { requestId: meta.requestId },
    });
    const result = await run(tx as AnyTx);
    await tx.tenantIdempotencyRecord.update({ where: { key: meta.idempotencyKey }, data: { status: "completed", completedAt: meta.occurredAt, resultPayload: json(result) } });
    return result;
  });
}

async function evidence(tx: AnyTx, meta: CommandMeta, action: string, targetType: string, targetId: string, metadata: Record<string, unknown>) {
  const payload = json({ targetType, targetId, requestId: meta.requestId, occurredAt: meta.occurredAt.toISOString(), ...metadata });
  await tx.tenantAuditLog.create({ data: { id: `audit_${randomUUID()}`, actorUserId: meta.actorUserId, action, targetType, targetId, requestId: meta.requestId, occurredAt: meta.occurredAt, metadata: json(metadata) } });
  await tx.tenantOutboxMessage.create({ data: { id: `outbox_${randomUUID()}`, topic: action, payload, status: "pending", idempotencyKey: meta.idempotencyKey } });
}

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
