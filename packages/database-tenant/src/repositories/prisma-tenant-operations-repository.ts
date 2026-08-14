import { randomUUID } from "node:crypto";
import {
  assertOperationTransition,
  assertQrUsable,
  TenantOperationsError,
  type AdvanceSlaughterInput,
  type AssignSlaughterInput,
  type CommandMeta,
  type CreatePackageInput,
  type CreateProxyDocumentInput,
  type ChangeProxyDocumentStatusInput,
  type CreateSlaughterJobInput,
  type CorrectWeighingInput,
  type DeliveryCommandInput,
  type DeliveryStatus,
  type IssueQrTokenInput,
  type CreateLoadingListInput,
  type MovePackageInput,
  type OperationMode,
  type OperationsRepository,
  type ReportOperationExceptionInput,
  type RecordWeighingInput,
  type RecordWeightShortfallInput,
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
      for (const grantor of grantors) {
        const ownedShareCount = await tx.share.count({
          where: {
            id: { in: [...new Set(grantor.shareIds)] },
            customerId: grantor.customerId,
            status: "sold",
            shareCard: { seasonId: input.seasonId },
          },
        });
        if (ownedShareCount !== grantor.shareIds.length) throw new TenantOperationsError("PROXY_GRANTOR_SHARE_MISMATCH");
      }
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
      if (!input.seasonId || !(await qrTargetBelongsToSeason(tx, input.purpose, input.targetId, input.seasonId))) {
        throw new TenantOperationsError("QR_TARGET_SCOPE_INVALID");
      }
      await tx.qrToken.create({
        data: {
          id: input.id,
          purpose: input.purpose,
          targetId: input.targetId,
          opaqueToken: input.opaqueToken,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        },
      });
      await tx.$executeRaw`UPDATE "QrToken" SET "seasonId" = ${input.seasonId ?? null}, "createdByUserId" = ${meta.actorUserId} WHERE "id" = ${input.id}`;
      await evidence(tx, meta, "qr.token.issued", "QrToken", input.id, { purpose: input.purpose, targetId: input.targetId });
      return { id: input.id, opaqueToken: input.opaqueToken };
    });
  }

  consumeQrToken(input: { opaqueToken: string; purpose: string; now: string }, meta: CommandMeta) {
    return command(this.db, "qr.token.consume", meta, async (tx) => {
      const tokens = await tx.$queryRaw<Array<{ id: string; purpose: string; targetId: string; opaqueToken: string; expiresAt: Date | null; revokedAt: Date | null }>>`
        SELECT "id", "purpose", "targetId", "opaqueToken", "expiresAt", "revokedAt"
        FROM "QrToken" WHERE "opaqueToken" = ${input.opaqueToken} FOR UPDATE
      `;
      const token = tokens[0];
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
      await tx.$executeRaw`UPDATE "QrToken" SET "consumedAt" = ${meta.occurredAt} WHERE "id" = ${token.id}`;
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
      await tx.$executeRaw`INSERT INTO "SlaughterJobHistory" ("id", "slaughterJobId", "fromStatus", "toStatus", "reason", "actorUserId", "occurredAt") VALUES (${`slaughter_history_${randomUUID()}`}, ${input.id}, ${null}, ${"ready"}, ${"Kesim işi önkoşulları tamamlandı"}, ${meta.actorUserId}, ${meta.occurredAt})`;
      await evidence(tx, meta, "slaughter.job.created", "SlaughterJob", input.id, { seasonId: input.seasonId, queueNo: input.queueNo });
      return { id: input.id };
    });
  }

  advanceSlaughter(input: AdvanceSlaughterInput, meta: CommandMeta) {
    return command(this.db, "slaughter.job.advance", meta, async (tx) => {
      const modeRows = await tx.$queryRaw<Array<{ mode: string }>>`SELECT "mode" FROM "OperationModeState" WHERE "seasonId" = ${input.seasonId} ORDER BY "updatedAt" DESC LIMIT 1 FOR UPDATE`;
      if (["read_only", "emergency_stop"].includes(modeRows[0]?.mode ?? "normal")) throw new TenantOperationsError("OPERATION_WRITES_DISABLED");
      const rows = await tx.$queryRaw<Array<{ status: string }>>`SELECT "status" FROM "SlaughterJob" WHERE "id" = ${input.id} AND "seasonId" = ${input.seasonId} FOR UPDATE`;
      const current = rows[0]?.status;
      if (!current) throw new TenantOperationsError("SLAUGHTER_JOB_NOT_FOUND");
      assertOperationTransition(current as SlaughterStatus, input.nextStatus);
      await tx.$executeRaw`UPDATE "SlaughterJob" SET "status" = ${input.nextStatus}, "version" = "version" + 1, "startedAt" = CASE WHEN ${input.nextStatus} IN ('in_slaughter','slaughtering') THEN COALESCE("startedAt", ${meta.occurredAt}) ELSE "startedAt" END, "completedAt" = CASE WHEN ${input.nextStatus} IN ('done','delivered') THEN ${meta.occurredAt} ELSE "completedAt" END, "updatedAt" = ${meta.occurredAt} WHERE "id" = ${input.id}`;
      await tx.$executeRaw`INSERT INTO "SlaughterJobHistory" ("id", "slaughterJobId", "fromStatus", "toStatus", "reason", "actorUserId", "occurredAt") VALUES (${`slaughter_history_${randomUUID()}`}, ${input.id}, ${current}, ${input.nextStatus}, ${input.reason}, ${meta.actorUserId}, ${meta.occurredAt})`;
      await evidence(tx, meta, "slaughter.job.advanced", "SlaughterJob", input.id, { seasonId: input.seasonId, from: current, to: input.nextStatus, reason: input.reason });
      return { id: input.id, status: input.nextStatus };
    });
  }

  assignSlaughter(input: AssignSlaughterInput, meta: CommandMeta) {
    return command(this.db, "slaughter.job.assign", meta, async (tx) => {
      const rows = await tx.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "SlaughterJob" WHERE "id" = ${input.id} AND "seasonId" = ${input.seasonId} FOR UPDATE`;
      if (!rows[0]) throw new TenantOperationsError("SLAUGHTER_JOB_NOT_FOUND");
      if (input.teamId) {
        const team = await tx.operationTeam.findFirst({ where: { id: input.teamId, seasonId: input.seasonId, active: true }, select: { id: true } });
        if (!team) throw new TenantOperationsError("SLAUGHTER_ASSIGNMENT_SCOPE_INVALID");
      }
      if (input.stationId) {
        const station = await tx.operationStation.findFirst({ where: { id: input.stationId, seasonId: input.seasonId, active: true }, select: { id: true } });
        if (!station) throw new TenantOperationsError("SLAUGHTER_ASSIGNMENT_SCOPE_INVALID");
      }
      await tx.$executeRaw`UPDATE "SlaughterJob" SET "facilityId" = ${input.facilityId ?? null}, "teamId" = ${input.teamId ?? null}, "stationId" = ${input.stationId ?? null}, "assignedUserId" = ${input.assignedUserId ?? null}, "assignedDeviceId" = ${input.assignedDeviceId ?? null}, "queueNo" = COALESCE(${input.queueNo ?? null}, "queueNo"), "version" = "version" + 1, "updatedAt" = ${meta.occurredAt} WHERE "id" = ${input.id}`;
      await tx.$executeRaw`INSERT INTO "SlaughterJobAssignment" ("id", "slaughterJobId", "facilityId", "teamId", "stationId", "assignedUserId", "assignedDeviceId", "queueNo", "reason", "actorUserId", "occurredAt") VALUES (${`slaughter_assignment_${randomUUID()}`}, ${input.id}, ${input.facilityId ?? null}, ${input.teamId ?? null}, ${input.stationId ?? null}, ${input.assignedUserId ?? null}, ${input.assignedDeviceId ?? null}, ${input.queueNo ?? null}, ${input.reason}, ${meta.actorUserId}, ${meta.occurredAt})`;
      await evidence(tx, meta, "slaughter.job.assigned", "SlaughterJob", input.id, { seasonId: input.seasonId, stationId: input.stationId, teamId: input.teamId, queueNo: input.queueNo, reason: input.reason });
      return { id: input.id };
    });
  }

  reportOperationException(input: ReportOperationExceptionInput, meta: CommandMeta) {
    return command(this.db, "operation.exception.report", meta, async (tx) => {
      const rows = await tx.$queryRaw<Array<{ id: string; status: string }>>`SELECT "id", "status" FROM "SlaughterJob" WHERE "id" = ${input.slaughterJobId} AND "seasonId" = ${input.seasonId} FOR UPDATE`;
      const job = rows[0];
      if (!job) throw new TenantOperationsError("SLAUGHTER_JOB_NOT_FOUND");
      await tx.$executeRaw`INSERT INTO "OperationException" ("id", "seasonId", "slaughterJobId", "category", "severity", "description", "status", "assignedUserId", "reportedByUserId", "reportedAt") VALUES (${input.id}, ${input.seasonId}, ${input.slaughterJobId}, ${input.category}, ${input.severity}, ${input.description}, 'open', ${input.assignedUserId ?? null}, ${meta.actorUserId}, ${meta.occurredAt})`;
      await tx.$executeRaw`UPDATE "SlaughterJob" SET "status" = 'exception', "blockedReason" = ${input.category}, "version" = "version" + 1, "updatedAt" = ${meta.occurredAt} WHERE "id" = ${input.slaughterJobId}`;
      await tx.$executeRaw`INSERT INTO "SlaughterJobHistory" ("id", "slaughterJobId", "fromStatus", "toStatus", "reason", "actorUserId", "occurredAt") VALUES (${`slaughter_history_${randomUUID()}`}, ${input.slaughterJobId}, ${job.status}, 'exception', ${input.description}, ${meta.actorUserId}, ${meta.occurredAt})`;
      await evidence(tx, meta, "operation.exception.reported", "OperationException", input.id, { seasonId: input.seasonId, slaughterJobId: input.slaughterJobId, category: input.category, severity: input.severity });
      return { id: input.id };
    });
  }

  setOperationMode(input: { id: string; seasonId: string; mode: OperationMode; reason: string }, meta: CommandMeta) {
    return command(this.db, "operation.mode.set", meta, async (tx) => {
      await tx.$executeRaw`INSERT INTO "OperationModeState" ("id", "seasonId", "mode", "reason", "actorUserId", "updatedAt") VALUES (${input.id}, ${input.seasonId}, ${input.mode}, ${input.reason}, ${meta.actorUserId}, ${meta.occurredAt})`;
      await evidence(tx, meta, "operation.mode.changed", "OperationModeState", input.id, { seasonId: input.seasonId, mode: input.mode, reason: input.reason });
      return { id: input.id, mode: input.mode };
    });
  }

  async listOperationCommandCenter(seasonId: string) {
    const rows = await this.db.$queryRaw<Array<{ id: string; queueNo: number | null; status: string; stationId: string | null; assignedUserId: string | null; blockedReason: string | null; updatedAt: Date }>>`SELECT "id", "queueNo", "status", "stationId", "assignedUserId", "blockedReason", "updatedAt" FROM "SlaughterJob" WHERE "seasonId" = ${seasonId} ORDER BY "queueNo" ASC NULLS LAST, "updatedAt" ASC LIMIT 250`;
    return rows.map((row) => ({ id: row.id, queueNo: row.queueNo ?? undefined, status: row.status, stationId: row.stationId ?? undefined, assignedUserId: row.assignedUserId ?? undefined, blockedReason: row.blockedReason ?? undefined, updatedAt: row.updatedAt.toISOString() }));
  }

  recordWeighing(input: RecordWeighingInput, meta: CommandMeta) {
    return command(this.db, "weighing.record", meta, async (tx) => {
      const animal = await tx.animal.findUnique({ where: { id: input.animalId }, select: { seasonId: true } });
      if (!animal || animal.seasonId !== input.seasonId) throw new TenantOperationsError("WEIGHING_ANIMAL_SCOPE_INVALID");
      await tx.weighingRecord.create({
        data: {
          id: input.id,
          seasonId: input.seasonId,
          animalId: input.animalId,
          carcassWeightKg: input.carcassWeightKg,
          measurementType: input.measurementType ?? "carcass",
          deviceAdapterId: input.deviceAdapterId,
          stationId: input.stationId,
          note: input.reason,
          recordedByUserId: meta.actorUserId,
          recordedAt: meta.occurredAt,
        },
      });
      await tx.animal.update({ where: { id: input.animalId }, data: { carcassWeightKg: input.carcassWeightKg } });
      await evidence(tx, meta, "weighing.recorded", "WeighingRecord", input.id, { seasonId: input.seasonId, animalId: input.animalId, reason: input.reason });
      return { id: input.id };
    });
  }

  correctWeighing(input: CorrectWeighingInput, meta: CommandMeta) {
    return command(this.db, "weighing.correct", meta, async (tx) => {
      const rows = await tx.$queryRaw<Array<{ animalId: string; revokedAt: Date | null }>>`SELECT "animalId", "revokedAt" FROM "WeighingRecord" WHERE "id" = ${input.supersedesId} FOR UPDATE`;
      const original = rows[0];
      if (!original || original.animalId !== input.animalId || original.revokedAt) throw new TenantOperationsError("WEIGHING_CORRECTION_SOURCE_INVALID");
      await tx.$executeRaw`UPDATE "WeighingRecord" SET "revokedAt" = ${meta.occurredAt}, "revokedByUserId" = ${meta.actorUserId}, "revocationReason" = ${input.reason ?? null} WHERE "id" = ${input.supersedesId}`;
      await tx.$executeRaw`INSERT INTO "WeighingRecord" ("id", "seasonId", "animalId", "carcassWeightKg", "measurementType", "deviceAdapterId", "stationId", "recordedByUserId", "recordedAt", "note", "supersedesId") VALUES (${input.id}, ${input.seasonId}, ${input.animalId}, ${input.carcassWeightKg}::decimal, ${input.measurementType ?? "carcass"}, ${input.deviceAdapterId ?? null}, ${input.stationId ?? null}, ${meta.actorUserId}, ${meta.occurredAt}, ${input.reason ?? null}, ${input.supersedesId})`;
      if ((input.measurementType ?? "carcass") === "carcass") await tx.animal.update({ where: { id: input.animalId }, data: { carcassWeightKg: input.carcassWeightKg } });
      await evidence(tx, meta, "weighing.corrected", "WeighingRecord", input.id, { seasonId: input.seasonId, supersedesId: input.supersedesId, reason: input.reason });
      return { id: input.id };
    });
  }

  allocateCarcassWeight(input: { id: string; seasonId: string; animalId: string; sourceWeighingId: string; totalWeightKg: string }, meta: CommandMeta) {
    return command(this.db, "weighing.allocate", meta, async (tx) => {
      const shares = await tx.share.findMany({ where: { shareCard: { seasonId: input.seasonId, animalId: input.animalId, status: "active" } }, select: { id: true }, orderBy: { sequenceNo: "asc" } });
      if (shares.length !== 7) throw new TenantOperationsError("WEIGHT_ALLOCATION_REQUIRES_SEVEN_SHARES");
      const source = await tx.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "WeighingRecord" WHERE "id" = ${input.sourceWeighingId} AND "animalId" = ${input.animalId} AND "revokedAt" IS NULL FOR UPDATE`;
      if (!source[0]) throw new TenantOperationsError("WEIGHT_ALLOCATION_SOURCE_INVALID");
      for (const share of shares) {
        await tx.$executeRaw`INSERT INTO "ShareWeightAllocation" ("id", "seasonId", "animalId", "shareId", "sourceWeighingId", "allocatedWeightKg", "createdByUserId", "createdAt") VALUES (${`${input.id}_${share.id}`}, ${input.seasonId}, ${input.animalId}, ${share.id}, ${input.sourceWeighingId}, ROUND(${input.totalWeightKg}::numeric / 7, 3), ${meta.actorUserId}, ${meta.occurredAt})`;
      }
      await evidence(tx, meta, "weighing.allocated", "Animal", input.animalId, { seasonId: input.seasonId, sourceWeighingId: input.sourceWeighingId, shareCount: shares.length, totalWeightKg: input.totalWeightKg });
      return { id: input.id, shareCount: shares.length };
    });
  }

  recordWeightShortfall(input: RecordWeightShortfallInput & { adjustmentAmount: string }, meta: CommandMeta) {
    return command(this.db, "weight.shortfall.record", meta, async (tx) => {
      const share = await tx.share.findUnique({ where: { id: input.shareId }, include: { shareCard: true } });
      if (!share || share.shareCard.seasonId !== input.seasonId || share.customerId !== input.customerId) throw new TenantOperationsError("WEIGHT_SHORTFALL_SCOPE_INVALID");
      const sales = await tx.$queryRaw<Array<{ id: string }>>`SELECT sale."id" FROM "Sale" AS sale JOIN "SaleShare" AS link ON link."saleId" = sale."id" AND link."shareId" = ${input.shareId} AND link."active" = true WHERE sale."id" = ${input.saleId} AND sale."seasonId" = ${input.seasonId} AND sale."customerId" = ${input.customerId} AND sale."status" = 'confirmed' AND sale."currency" = 'TRY' FOR UPDATE OF sale`;
      if (!sales[0]) throw new TenantOperationsError("WEIGHT_SHORTFALL_SALE_SCOPE_INVALID");
      const limits = await tx.$queryRaw<Array<{ allowed: boolean }>>`SELECT COALESCE(SUM("adjustmentAmount"), 0) + ${input.adjustmentAmount}::numeric <= ${input.agreedPrice}::numeric AS "allowed" FROM "WeightShortfallAdjustment" WHERE "saleId" = ${input.saleId} AND "status" <> 'rejected'`;
      if (!limits[0]?.allowed) throw new TenantOperationsError("WEIGHT_SHORTFALL_EXCEEDS_AGREED_PRICE");
      await tx.$executeRaw`INSERT INTO "WeightShortfallAdjustment" ("id", "seasonId", "shareId", "customerId", "saleId", "agreedPrice", "targetWeightKg", "actualWeightKg", "adjustmentAmount", "currency", "status", "reason", "createdByUserId", "createdAt") VALUES (${input.id}, ${input.seasonId}, ${input.shareId}, ${input.customerId}, ${input.saleId}, ${input.agreedPrice}::decimal, ${input.targetWeightKg}::decimal, ${input.actualWeightKg}::decimal, ${input.adjustmentAmount}::decimal, 'TRY', 'pending_approval', ${input.reason}, ${meta.actorUserId}, ${meta.occurredAt})`;
      await evidence(tx, meta, "weight.shortfall.recorded", "WeightShortfallAdjustment", input.id, { seasonId: input.seasonId, shareId: input.shareId, adjustmentAmount: input.adjustmentAmount, status: "pending_approval" });
      return { id: input.id, adjustmentAmount: input.adjustmentAmount, status: "pending_approval" as const };
    });
  }

  createPackage(input: CreatePackageInput, meta: CommandMeta) {
    return command(this.db, "package.create", meta, async (tx) => {
      const share = await tx.share.findUnique({ where: { id: input.shareId }, include: { shareCard: true } });
      if (!share || share.shareCard.seasonId !== input.seasonId) throw new TenantOperationsError("PACKAGE_SHARE_SCOPE_INVALID");
      await tx.packageRecord.create({
        data: {
          id: input.id,
          seasonId: input.seasonId,
          animalId: share.shareCard.animalId,
          customerId: share.customerId,
          shareId: input.shareId,
          grossWeightKg: input.grossWeightKg,
          netWeightKg: input.grossWeightKg,
          labelNo: input.labelNo,
          packageNo: input.labelNo,
          status: "created",
        },
      });
      for (const component of input.components ?? []) {
        await tx.$executeRaw`INSERT INTO "PackageComponent" ("id", "packageRecordId", "componentType", "weightKg", "estimatedValue", "createdAt") VALUES (${component.id}, ${input.id}, ${component.componentType}, ${component.weightKg}::decimal, ${component.estimatedValue ?? null}::decimal, ${meta.occurredAt})`;
      }
      await evidence(tx, meta, "package.created", "PackageRecord", input.id, { seasonId: input.seasonId, shareId: input.shareId, labelNo: input.labelNo, reason: input.reason, components: input.components ?? [] });
      return { id: input.id };
    });
  }

  reportPackageException(input: { id: string; seasonId: string; packageRecordId: string; status: "missing" | "wrong" | "damaged"; reason: string }, meta: CommandMeta) {
    return command(this.db, "package.exception.report", meta, async (tx) => {
      const rows = await tx.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "PackageRecord" WHERE "id" = ${input.packageRecordId} AND "seasonId" = ${input.seasonId} FOR UPDATE`;
      if (!rows[0]) throw new TenantOperationsError("PACKAGE_SHARE_SCOPE_INVALID");
      await tx.$executeRaw`UPDATE "PackageRecord" SET "status" = ${input.status} WHERE "id" = ${input.packageRecordId}`;
      await tx.$executeRaw`INSERT INTO "PackageExceptionHistory" ("id", "seasonId", "packageRecordId", "status", "reason", "actorUserId", "occurredAt") VALUES (${input.id}, ${input.seasonId}, ${input.packageRecordId}, ${input.status}, ${input.reason}, ${meta.actorUserId}, ${meta.occurredAt})`;
      await evidence(tx, meta, "package.exception.reported", "PackageRecord", input.packageRecordId, { seasonId: input.seasonId, status: input.status, reason: input.reason });
      return { id: input.id, status: input.status };
    });
  }

  recordPackageTransformation(input: { id: string; seasonId: string; sourcePackageIds: string[]; targetPackageIds: string[]; transformation: "split" | "merge"; reason: string }, meta: CommandMeta) {
    return command(this.db, "package.transform", meta, async (tx) => {
      const allIds = [...new Set([...input.sourcePackageIds, ...input.targetPackageIds])];
      const rows = await tx.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "PackageRecord" WHERE "id" = ANY(${allIds}) AND "seasonId" = ${input.seasonId} FOR UPDATE`;
      if (rows.length !== allIds.length) throw new TenantOperationsError("PACKAGE_TRANSFORMATION_SCOPE_INVALID");
      for (const sourcePackageId of input.sourcePackageIds) for (const targetPackageId of input.targetPackageIds) {
        await tx.$executeRaw`INSERT INTO "PackageTransformation" ("id", "seasonId", "sourcePackageId", "targetPackageId", "transformation", "reason", "actorUserId", "occurredAt") VALUES (${`${input.id}_${sourcePackageId}_${targetPackageId}`}, ${input.seasonId}, ${sourcePackageId}, ${targetPackageId}, ${input.transformation}, ${input.reason}, ${meta.actorUserId}, ${meta.occurredAt})`;
      }
      await tx.$executeRaw`UPDATE "PackageRecord" SET "status" = 'void' WHERE "id" = ANY(${input.sourcePackageIds})`;
      await evidence(tx, meta, "package.transformed", "PackageTransformation", input.id, { seasonId: input.seasonId, transformation: input.transformation, sourcePackageIds: input.sourcePackageIds, targetPackageIds: input.targetPackageIds, reason: input.reason });
      return { id: input.id };
    });
  }

  recordDelivery(input: DeliveryCommandInput, meta: CommandMeta) {
    return command(this.db, "delivery.record", meta, async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Share" WHERE "id" = ${input.shareId} FOR UPDATE`;
      const share = await tx.share.findUnique({ where: { id: input.shareId }, include: { shareCard: true, packages: true } });
      if (!share || share.shareCard.seasonId !== input.seasonId) throw new TenantOperationsError("DELIVERY_SHARE_SCOPE_INVALID");
      if (share.customerId !== input.customerId) throw new TenantOperationsError("DELIVERY_CUSTOMER_MISMATCH");
      if (share.status !== "sold") throw new TenantOperationsError("DELIVERY_REQUIRES_SOLD_SHARE");
      if (share.packages.length === 0) throw new TenantOperationsError("DELIVERY_REQUIRES_READY_PACKAGE");
      const existing = await tx.deliveryRecord.findFirst({ where: { shareId: input.shareId, status: "delivered" } });
      if (existing) throw new TenantOperationsError("SHARE_ALREADY_DELIVERED");
      const requiredPackageIds = share.packages.filter((item) => !["void", "missing", "wrong", "damaged"].includes((item as { status?: string }).status ?? "created")).map((item) => item.id).sort();
      const scannedPackageIds = [...new Set(input.packageRecordIds ?? [])].sort();
      if (scannedPackageIds.some((id) => !share.packages.some((item) => item.id === id))) throw new TenantOperationsError("DELIVERY_PACKAGE_SCOPE_INVALID");
      const complete = requiredPackageIds.length === scannedPackageIds.length && requiredPackageIds.every((id, index) => id === scannedPackageIds[index]);
      if (!complete && !input.allowPartial) throw new TenantOperationsError("DELIVERY_PACKAGE_CHECKLIST_INCOMPLETE");
      if (input.loadingListId) {
        const loadingRows = await tx.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::bigint AS "count" FROM "LoadingListItem" AS item JOIN "LoadingList" AS list ON list."id" = item."loadingListId" WHERE list."id" = ${input.loadingListId} AND list."seasonId" = ${input.seasonId} AND item."packageRecordId" = ANY(${scannedPackageIds})`;
        if (Number(loadingRows[0]?.count ?? BigInt(0)) !== scannedPackageIds.length) throw new TenantOperationsError("DELIVERY_LOADING_LIST_SCOPE_INVALID");
      }
      const alreadyDelivered = await tx.$queryRaw<Array<{ id: string }>>`SELECT link."packageRecordId" AS "id" FROM "DeliveryPackageLink" AS link JOIN "DeliveryRecord" AS delivery ON delivery."id" = link."deliveryRecordId" WHERE link."packageRecordId" = ANY(${scannedPackageIds}) AND delivery."status" IN ('partial','delivered') FOR UPDATE OF delivery`;
      if (alreadyDelivered.length > 0) throw new TenantOperationsError("PACKAGE_ALREADY_DELIVERED");
      const deliveryStatus: DeliveryStatus = complete ? "delivered" : "partial";
      await tx.deliveryRecord.create({
        data: {
          id: input.id,
          seasonId: input.seasonId,
          shareId: input.shareId,
          customerId: input.customerId,
          status: deliveryStatus,
          deliveredAt: complete ? meta.occurredAt : undefined,
          receiverName: input.receiverName,
          receiverRelationship: input.receiverRelationship,
          deliveryType: input.deliveryType ?? "on_site",
          serviceFee: input.serviceFee ?? "0",
          staffUserId: input.staffUserId ?? meta.actorUserId,
          deviceId: input.deviceId,
          latitude: input.latitude,
          longitude: input.longitude,
          partialExceptionReason: input.partialExceptionReason,
          debtOverrideReason: input.debtOverride?.reason,
          approvalRequestId: input.debtOverride?.approvalRequestId,
          loadingListId: input.loadingListId,
        },
      });
      for (const packageRecordId of scannedPackageIds) await tx.$executeRaw`INSERT INTO "DeliveryPackageLink" ("deliveryRecordId", "packageRecordId", "scannedAt", "scannedByUserId", "deviceId") VALUES (${input.id}, ${packageRecordId}, ${meta.occurredAt}, ${meta.actorUserId}, ${input.deviceId ?? null})`;
      await tx.$executeRaw`UPDATE "PackageRecord" SET "status" = 'delivered' WHERE "id" = ANY(${scannedPackageIds})`;
      if (input.proof) {
        await tx.$executeRaw`INSERT INTO "DeliveryProof" ("id", "deliveryRecordId", "proofType", "storageKey", "note", "capturedAt") VALUES (${input.proof.id}, ${input.id}, ${input.proof.proofType}, ${input.proof.storageKey ?? input.debtOverride?.storageKey ?? null}, ${input.proof.note ?? input.reason ?? null}, ${meta.occurredAt})`;
        await tx.$executeRaw`UPDATE "DeliveryProof" SET "mimeType" = ${input.proof.mimeType ?? null}, "sizeBytes" = ${input.proof.sizeBytes ?? null}, "checksumSha256" = ${input.proof.checksumSha256 ?? null}, "capturedByUserId" = ${input.staffUserId ?? meta.actorUserId}, "deviceId" = ${input.deviceId ?? null} WHERE "id" = ${input.proof.id}`;
      }
      await evidence(tx, meta, "delivery.recorded", "DeliveryRecord", input.id, { seasonId: input.seasonId, shareId: input.shareId, packageCount: scannedPackageIds.length, complete, receiverRelationship: input.receiverRelationship, deliveryType: input.deliveryType ?? "on_site", loadingListId: input.loadingListId, debtOverride: Boolean(input.debtOverride) });
      return { id: input.id, status: deliveryStatus };
    });
  }

  reverseDelivery(input: { id: string; seasonId: string; reason: string }, meta: CommandMeta) {
    return command(this.db, "delivery.reverse", meta, async (tx) => {
      const row = await tx.deliveryRecord.findUnique({ where: { id: input.id }, include: { share: { include: { shareCard: true } } } });
      if (!row || row.share.shareCard.seasonId !== input.seasonId) throw new TenantOperationsError("DELIVERY_NOT_FOUND");
      if (row.status !== "delivered" && row.status !== "partial") throw new TenantOperationsError("DELIVERY_NOT_REVERSIBLE");
      await tx.deliveryRecord.update({ where: { id: input.id }, data: { status: "reversed", reversedAt: meta.occurredAt, reversalReason: input.reason } });
      await tx.$executeRaw`UPDATE "PackageRecord" SET "status" = CASE WHEN "coldRoomId" IS NULL THEN 'created' ELSE 'stored' END WHERE "id" IN (SELECT "packageRecordId" FROM "DeliveryPackageLink" WHERE "deliveryRecordId" = ${input.id})`;
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

  enqueueOffline(input: { id: string; seasonId: string; deviceId: string; sessionVersion: number; expectedVersion: number; ttlSeconds: number; operation: string; payload: Record<string, unknown>; tenantInstanceId: string; actorUserId: string; sessionId?: string }, meta: CommandMeta) {
    return command(this.db, "offline.queue.enqueue", meta, async (tx) => {
      const now = meta.occurredAt;
      const session = input.sessionId ? await tx.userSession.findFirst({ where: { id: input.sessionId, status: "active", revokedAt: null, expiresAt: { gt: now } }, select: { id: true } }) : null;
      if (!session) throw new TenantOperationsError("OFFLINE_SESSION_NOT_ACTIVE");
      const device = await tx.deviceIdentity.findFirst({ where: { id: input.deviceId, status: "active", OR: [{ validUntil: null }, { validUntil: { gt: now } }] }, select: { id: true } });
      if (!device) throw new TenantOperationsError("OFFLINE_DEVICE_NOT_ENROLLED");
      await tx.offlineQueueItem.create({ data: { id: input.id, idempotencyKey: meta.idempotencyKey, operation: input.operation, payload: json(input.payload), status: "queued" } });
      await tx.$executeRaw`UPDATE "OfflineQueueItem" SET "tenantInstanceId" = ${input.tenantInstanceId}, "seasonId" = ${input.seasonId}, "actorUserId" = ${input.actorUserId}, "deviceId" = ${input.deviceId}, "sessionId" = ${input.sessionId ?? null}, "sessionVersion" = ${input.sessionVersion}, "expectedVersion" = ${input.expectedVersion}, "expiresAt" = ${new Date(meta.occurredAt.getTime() + input.ttlSeconds * 1000)}, "nextAttemptAt" = ${meta.occurredAt} WHERE "id" = ${input.id}`;
      await evidence(tx, meta, "offline.queue.enqueued", "OfflineQueueItem", input.id, { operation: input.operation });
      return { id: input.id };
    });
  }

  async listOfflineQueue(input: { seasonId: string; deviceId: string; actorUserId: string }) {
    const rows = await this.db.$queryRaw<Array<{ id: string; operation: string; status: string; attempts: number; nextAttemptAt: Date | null; lastErrorCode: string | null }>>`SELECT "id", "operation", "status", "attempts", "nextAttemptAt", "lastErrorCode" FROM "OfflineQueueItem" WHERE "seasonId" = ${input.seasonId} AND "deviceId" = ${input.deviceId} AND "actorUserId" = ${input.actorUserId} ORDER BY "createdAt" ASC LIMIT 200`;
    return rows.map((row) => ({ id: row.id, operation: row.operation, status: row.status, attempts: row.attempts, nextAttemptAt: row.nextAttemptAt?.toISOString(), lastErrorCode: row.lastErrorCode ?? undefined }));
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
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${meta.idempotencyKey}, 0))`;
    const existing = await tx.tenantIdempotencyRecord.findUnique({ where: { key: meta.idempotencyKey } });
    if (existing && (existing.scope !== scope || existing.requestHash !== meta.requestHash)) throw new TenantOperationsError("IDEMPOTENCY_CONFLICT");
    if (existing?.status === "completed" && existing.resultPayload) return existing.resultPayload as TResult;
    if (existing) throw new TenantOperationsError("IDEMPOTENCY_IN_PROGRESS");
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

async function qrTargetBelongsToSeason(tx: Tx, purpose: string, targetId: string, seasonId: string): Promise<boolean> {
  switch (purpose) {
    case "proxyDocument":
      return Boolean(await tx.proxyDocument.findFirst({ where: { id: targetId, seasonId }, select: { id: true } }));
    case "slaughterCheck":
      return Boolean(await tx.slaughterJob.findFirst({ where: { id: targetId, seasonId }, select: { id: true } }));
    case "package":
      return Boolean(await tx.packageRecord.findFirst({ where: { id: targetId, seasonId }, select: { id: true } }));
    case "delivery":
      return Boolean(await tx.deliveryRecord.findFirst({ where: { id: targetId, seasonId }, select: { id: true } }));
    case "customerTracking":
      return Boolean(await tx.share.findFirst({ where: { id: targetId, shareCard: { seasonId } }, select: { id: true } }));
    default:
      return false;
  }
}

async function evidence(tx: Tx, meta: CommandMeta, action: string, targetType: string, targetId: string, metadata: Record<string, unknown>) {
  const payload = json({ targetType, targetId, requestId: meta.requestId, occurredAt: meta.occurredAt.toISOString(), ...metadata });
  await tx.tenantAuditLog.create({ data: { id: `audit_${randomUUID()}`, actorUserId: meta.actorUserId, action, targetType, targetId, requestId: meta.requestId, occurredAt: meta.occurredAt, metadata: json(metadata) } });
  await tx.tenantOutboxMessage.create({ data: { id: `outbox_${randomUUID()}`, topic: action, payload, status: "pending", idempotencyKey: meta.idempotencyKey } });
}

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
