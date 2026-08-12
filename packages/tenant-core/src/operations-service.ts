import { randomUUID } from "node:crypto";
import type { PermissionKey } from "./authorization-domain";
import { AuthorizationError, type AuthorizationSubject } from "./authorization-domain";
import type { TenantAuthorizationService } from "./authorization-service";
import { commandMeta, type CommandMeta, type TenantUseCaseContext } from "./master-data-domain";
import {
  assertProxyDocumentAccessible,
  assertQrTokenUsable,
  assertSlaughterTransition,
  type DeliveryStatus,
  type QrPurpose,
  type SlaughterStatus,
} from "./operation-flow";

export type OperationsPermission =
  | "qurban.proxy.manage.operational_period"
  | "qurban.proxy.read.operational_period"
  | "qurban.document.manage.operational_period"
  | "qurban.qr.issue.operational_period"
  | "qurban.qr.consume.operational_period"
  | "qurban.slaughter.manage.operational_period"
  | "operations.weighing.record.assigned_record"
  | "operations.packaging.manage.assigned_record"
  | "inventory.cold_storage.manage.facility"
  | "logistics.delivery.manage.operational_period"
  | "field.pwa.sync.assigned_record"
  | "public.tv.read.organization"
  | "public.tracking.read.assigned_record"
  | "devices.adapters.manage.organization";

export interface CreateProxyDocumentInput {
  id: string;
  seasonId: string;
  grantorCustomerId: string;
  shareIds: string[];
  method: "face_to_face_oral" | "phone" | "voice_recording";
  storageKey: string;
  status?: "draft" | "signed";
}

export interface IssueQrTokenInput {
  id: string;
  purpose: QrPurpose;
  targetId: string;
  expiresAt?: string;
}

export interface CreateSlaughterJobInput {
  id: string;
  seasonId: string;
  animalId: string;
  shareCardId: string;
  queueNo?: number;
  assignedUserId?: string;
}

export interface AdvanceSlaughterInput {
  id: string;
  seasonId: string;
  nextStatus: SlaughterStatus;
  reason: string;
}

export interface RecordWeighingInput {
  id: string;
  seasonId: string;
  animalId: string;
  carcassWeightKg: string;
  reason?: string;
}

export interface CreatePackageInput {
  id: string;
  seasonId: string;
  shareId: string;
  grossWeightKg: string;
  labelNo: string;
  reason?: string;
  components?: Array<{ id: string; componentType: "bone_in" | "boneless" | "offal" | "other"; weightKg: string; estimatedValue?: string }>;
}

export interface DeliveryCommandInput {
  id: string;
  seasonId: string;
  shareId: string;
  customerId: string;
  receiverName?: string;
  reason?: string;
  proof?: { id: string; proofType: "signature" | "photo" | "voice" | "note"; storageKey?: string; note?: string };
  loadingListId?: string;
  debtOverride?: { approvalRequestId: string; reason: string; storageKey?: string };
}

export interface MovePackageInput {
  id: string;
  seasonId: string;
  packageRecordId: string;
  roomId: string;
  sectionId?: string;
  rackId?: string;
  reason: string;
}

export interface CreateLoadingListInput {
  id: string;
  seasonId: string;
  vehicleId?: string;
  routeName?: string;
  packageRecordIds: string[];
}

export interface OperationsRepository {
  createProxyDocument(input: CreateProxyDocumentInput, meta: CommandMeta): Promise<{ id: string; shareIds: string[] }>;
  revokeProxyDocument(input: { id: string; seasonId: string; reason: string }, meta: CommandMeta): Promise<{ id: string }>;
  issueQrToken(input: IssueQrTokenInput & { opaqueToken: string }, meta: CommandMeta): Promise<{ id: string; opaqueToken: string }>;
  consumeQrToken(input: { opaqueToken: string; purpose: QrPurpose; now: string }, meta: CommandMeta): Promise<{ id: string; targetId: string }>;
  createSlaughterJob(input: CreateSlaughterJobInput, meta: CommandMeta): Promise<{ id: string }>;
  advanceSlaughter(input: AdvanceSlaughterInput, meta: CommandMeta): Promise<{ id: string; status: SlaughterStatus }>;
  recordWeighing(input: RecordWeighingInput, meta: CommandMeta): Promise<{ id: string }>;
  createPackage(input: CreatePackageInput, meta: CommandMeta): Promise<{ id: string }>;
  recordDelivery(input: DeliveryCommandInput, meta: CommandMeta): Promise<{ id: string; status: DeliveryStatus }>;
  reverseDelivery(input: { id: string; seasonId: string; reason: string }, meta: CommandMeta): Promise<{ id: string; status: DeliveryStatus }>;
  movePackage(input: MovePackageInput, meta: CommandMeta): Promise<{ id: string }>;
  createLoadingList(input: CreateLoadingListInput, meta: CommandMeta): Promise<{ id: string; itemCount: number }>;
  closeAnimalIfDelivered(input: { seasonId: string; animalId: string; reason: string }, meta: CommandMeta): Promise<{ animalId: string; closed: true }>;
  enqueueOffline(input: { id: string; operation: string; payload: Record<string, unknown> }, meta: CommandMeta): Promise<{ id: string }>;
  listTvProjection(seasonId: string): Promise<Array<{ qurbanNo?: string; queueNo?: number; status: string; updatedAt: string }>>;
}

export class TenantOperationsService {
  constructor(private readonly repository: OperationsRepository, private readonly authorization?: TenantAuthorizationService) {}

  async createProxyDocument(context: TenantUseCaseContext, input: CreateProxyDocumentInput) {
    await this.authorize(context, "qurban.proxy.manage.operational_period", { operationalPeriodId: input.seasonId });
    assertProtectedStorage(input.storageKey);
    if (input.shareIds.length < 1 || input.shareIds.length > 7) throw new TenantOperationsError("PROXY_SHARE_COUNT_INVALID");
    return this.repository.createProxyDocument(input, commandMeta(context));
  }

  async revokeProxyDocument(context: TenantUseCaseContext, input: { id: string; seasonId: string; reason: string }) {
    await this.authorize(context, "qurban.document.manage.operational_period", { operationalPeriodId: input.seasonId });
    return this.repository.revokeProxyDocument(input, commandMeta(context));
  }

  async issueQrToken(context: TenantUseCaseContext, input: IssueQrTokenInput) {
    await this.authorize(context, "qurban.qr.issue.operational_period", { operationalPeriodId: context.operationalPeriodId });
    const opaqueToken = `qr_${randomUUID()}_${randomUUID()}`;
    return this.repository.issueQrToken({ ...input, opaqueToken }, commandMeta(context));
  }

  async consumeQrToken(context: TenantUseCaseContext, input: { opaqueToken: string; purpose: QrPurpose; now?: string }) {
    await this.authorize(context, "qurban.qr.consume.operational_period", {});
    return this.repository.consumeQrToken({ ...input, now: input.now ?? new Date().toISOString() }, commandMeta(context));
  }

  async createSlaughterJob(context: TenantUseCaseContext, input: CreateSlaughterJobInput) {
    await this.authorize(context, "qurban.slaughter.manage.operational_period", { operationalPeriodId: input.seasonId, assignedRecord: { type: "animal", id: input.animalId } });
    return this.repository.createSlaughterJob(input, commandMeta(context));
  }

  async advanceSlaughter(context: TenantUseCaseContext, input: AdvanceSlaughterInput) {
    await this.authorize(context, "qurban.slaughter.manage.operational_period", { operationalPeriodId: input.seasonId, assignedRecord: { type: "slaughter_job", id: input.id } });
    return this.repository.advanceSlaughter(input, commandMeta(context));
  }

  async recordWeighing(context: TenantUseCaseContext, input: RecordWeighingInput) {
    await this.authorize(context, "operations.weighing.record.assigned_record", { operationalPeriodId: input.seasonId, assignedRecord: { type: "animal", id: input.animalId } });
    if (!/^\d+(\.\d{1,3})?$/.test(input.carcassWeightKg)) throw new TenantOperationsError("WEIGHT_PRECISION_INVALID");
    return this.repository.recordWeighing(input, commandMeta(context));
  }

  async createPackage(context: TenantUseCaseContext, input: CreatePackageInput) {
    await this.authorize(context, "operations.packaging.manage.assigned_record", { operationalPeriodId: input.seasonId, assignedRecord: { type: "share", id: input.shareId } });
    if (!/^\d+(\.\d{1,3})?$/.test(input.grossWeightKg)) throw new TenantOperationsError("PACKAGE_WEIGHT_PRECISION_INVALID");
    for (const component of input.components ?? []) {
      if (!/^\d+(\.\d{1,3})?$/.test(component.weightKg)) throw new TenantOperationsError("PACKAGE_WEIGHT_PRECISION_INVALID");
    }
    return this.repository.createPackage(input, commandMeta(context));
  }

  async recordDelivery(context: TenantUseCaseContext, input: DeliveryCommandInput) {
    await this.authorize(context, "logistics.delivery.manage.operational_period", { operationalPeriodId: input.seasonId, assignedRecord: { type: "share", id: input.shareId } });
    if (input.debtOverride && !context.approval?.approved) throw new TenantOperationsError("DELIVERY_DEBT_OVERRIDE_APPROVAL_REQUIRED");
    if (input.proof?.storageKey?.startsWith("public/")) throw new TenantOperationsError("PROTECTED_DOCUMENT_STORAGE_REQUIRED");
    return this.repository.recordDelivery(input, commandMeta(context));
  }

  async reverseDelivery(context: TenantUseCaseContext, input: { id: string; seasonId: string; reason: string }) {
    await this.authorize(context, "logistics.delivery.manage.operational_period", { operationalPeriodId: input.seasonId, assignedRecord: { type: "delivery", id: input.id } });
    return this.repository.reverseDelivery(input, commandMeta(context));
  }

  async movePackage(context: TenantUseCaseContext, input: MovePackageInput) {
    await this.authorize(context, "inventory.cold_storage.manage.facility", { operationalPeriodId: input.seasonId, assignedRecord: { type: "package", id: input.packageRecordId } });
    return this.repository.movePackage(input, commandMeta(context));
  }

  async createLoadingList(context: TenantUseCaseContext, input: CreateLoadingListInput) {
    await this.authorize(context, "logistics.delivery.manage.operational_period", { operationalPeriodId: input.seasonId });
    if (input.packageRecordIds.length < 1) throw new TenantOperationsError("LOADING_LIST_EMPTY");
    return this.repository.createLoadingList(input, commandMeta(context));
  }

  async closeAnimalIfDelivered(context: TenantUseCaseContext, input: { seasonId: string; animalId: string; reason: string }) {
    await this.authorize(context, "logistics.delivery.manage.operational_period", { operationalPeriodId: input.seasonId, assignedRecord: { type: "animal", id: input.animalId } });
    return this.repository.closeAnimalIfDelivered(input, commandMeta(context));
  }

  async enqueueOffline(context: TenantUseCaseContext, input: { id: string; operation: string; payload: Record<string, unknown> }) {
    await this.authorize(context, "field.pwa.sync.assigned_record", {});
    const serialized = JSON.stringify(input.payload);
    if (/password|secret|token|databaseUrl|connectionString/i.test(serialized)) throw new TenantOperationsError("OFFLINE_QUEUE_SECRET_FORBIDDEN");
    if (/sale|finance|receipt|slaughter.confirm|delivery.confirm/i.test(input.operation)) throw new TenantOperationsError("CRITICAL_OPERATION_OFFLINE_FORBIDDEN");
    return this.repository.enqueueOffline(input, commandMeta(context));
  }

  async listTvProjection(context: TenantUseCaseContext, seasonId: string) {
    await this.authorize(context, "public.tv.read.organization", { operationalPeriodId: seasonId });
    return this.repository.listTvProjection(seasonId);
  }

  private async authorize(context: TenantUseCaseContext, permission: OperationsPermission, facts: { operationalPeriodId?: string; assignedRecord?: { type: string; id: string } }) {
    if (this.authorization && context.organizationMembershipId) {
      return this.authorization.require({
        subject: {
          kind: context.identityKind ?? "ORGANIZATION_USER",
          id: context.actorIdentityId ?? context.actorUserId,
          organizationMembershipId: context.organizationMembershipId,
          sessionId: context.sessionId,
        } as AuthorizationSubject,
        context: {
          tenantInstanceId: context.tenantInstanceId,
          organizationId: context.organizationId,
          facilityId: context.facilityId,
          departmentId: context.departmentId,
          operationalPeriodId: facts.operationalPeriodId ?? context.operationalPeriodId,
          assignedRecord: facts.assignedRecord,
          occurredAt: context.occurredAt,
          trustedDevice: context.trustedDevice ?? false,
          network: context.network,
          mfaLevel: context.mfaLevel ?? 0,
          approval: context.approval,
          requestId: context.requestId,
        },
        lastReauthenticatedAt: context.lastReauthenticatedAt,
      }, permission as PermissionKey);
    }
    if (context.authorizationMode === "database") throw new AuthorizationError("ORGANIZATION_MEMBERSHIP_REQUIRED");
    if (!context.permissions.includes("*") && !context.permissions.includes(permission)) throw new TenantOperationsError("PERMISSION_DENIED");
  }
}

function assertProtectedStorage(storageKey: string) {
  const probe = { status: "signed", storageKey } as Parameters<typeof assertProxyDocumentAccessible>[0];
  try {
    assertProxyDocumentAccessible(probe);
  } catch {
    throw new TenantOperationsError("PROTECTED_DOCUMENT_STORAGE_REQUIRED");
  }
}

export function assertOperationTransition(current: SlaughterStatus, next: SlaughterStatus) {
  try {
    assertSlaughterTransition(current, next);
  } catch {
    throw new TenantOperationsError("SLAUGHTER_TRANSITION_NOT_ALLOWED");
  }
}

export function assertQrUsable(token: Parameters<typeof assertQrTokenUsable>[0], nowIso: string) {
  try {
    assertQrTokenUsable(token, nowIso);
  } catch (error) {
    const message = error instanceof Error ? error.message : "QR_TOKEN_INVALID";
    throw new TenantOperationsError(message.split(":")[0] ?? "QR_TOKEN_INVALID");
  }
}

export class TenantOperationsError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "TenantOperationsError";
  }
}
