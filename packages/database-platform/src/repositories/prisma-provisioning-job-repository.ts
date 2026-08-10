import type {
  ProvisioningIdempotencyKey,
  ProvisioningJobId,
  ProvisioningJobRecord,
  ProvisioningJobRepository,
  ProvisioningStepRecord,
} from "@tilbecore/provisioning";
import type { TenantInstanceId } from "@tilbecore/contracts";
import type {
  PlatformProvisioningJobRow,
  PlatformProvisioningPrismaClientLike,
} from "../client";
import type { Prisma } from "../../generated/client";

export class PrismaProvisioningJobRepository implements ProvisioningJobRepository {
  constructor(private readonly db: PlatformProvisioningPrismaClientLike) {}

  async create(job: ProvisioningJobRecord): Promise<ProvisioningJobRecord> {
    return mapRow(await this.db.platformProvisioningJob.create({ data: toWrite(job) }));
  }

  async update(job: ProvisioningJobRecord): Promise<ProvisioningJobRecord> {
    return mapRow(await this.db.platformProvisioningJob.update({
      where: { id: job.id },
      data: toWrite(job),
    }));
  }

  async findById(id: ProvisioningJobId): Promise<ProvisioningJobRecord | null> {
    const row = await this.db.platformProvisioningJob.findUnique({ where: { id } });
    return row ? mapRow(row) : null;
  }

  async findByIdempotencyKey(
    idempotencyKey: ProvisioningIdempotencyKey,
  ): Promise<ProvisioningJobRecord | null> {
    const row = await this.db.platformProvisioningJob.findUnique({ where: { idempotencyKey } });
    return row ? mapRow(row) : null;
  }

  async findByTenantInstanceId(
    tenantInstanceId: TenantInstanceId,
  ): Promise<ProvisioningJobRecord | null> {
    const row = await this.db.platformProvisioningJob.findUnique({ where: { tenantInstanceId } });
    return row ? mapRow(row) : null;
  }
}

function toWrite(job: ProvisioningJobRecord) {
  return {
    id: job.id,
    idempotencyKey: job.idempotencyKey,
    commandFingerprint: job.commandFingerprint,
    organizationId: job.organizationId,
    tenantInstanceId: job.tenantInstanceId,
    requestedByUserId: job.requestedByUserId,
    databaseRefId: job.databaseRefId,
    status: job.status,
    steps: JSON.parse(JSON.stringify(job.steps)) as Prisma.InputJsonValue,
    currentStep: job.currentStep,
    failureCode: job.failureCode,
    databaseCreatedByJob: job.databaseCreatedByJob,
    platformRegistrationCompleted: job.platformRegistrationCompleted,
    rollbackStatus: job.rollbackStatus,
    createdAt: new Date(job.createdAt),
    updatedAt: new Date(job.updatedAt),
  };
}

function mapRow(row: PlatformProvisioningJobRow): ProvisioningJobRecord {
  return {
    id: row.id as ProvisioningJobId,
    idempotencyKey: row.idempotencyKey as ProvisioningIdempotencyKey,
    commandFingerprint: row.commandFingerprint,
    organizationId: row.organizationId as ProvisioningJobRecord["organizationId"],
    tenantInstanceId: row.tenantInstanceId as ProvisioningJobRecord["tenantInstanceId"],
    requestedByUserId: row.requestedByUserId as ProvisioningJobRecord["requestedByUserId"],
    databaseRefId: row.databaseRefId as ProvisioningJobRecord["databaseRefId"],
    status: row.status as ProvisioningJobRecord["status"],
    steps: parseSteps(row.steps),
    currentStep: row.currentStep as ProvisioningJobRecord["currentStep"],
    failureCode: row.failureCode ?? undefined,
    databaseCreatedByJob: row.databaseCreatedByJob,
    platformRegistrationCompleted: row.platformRegistrationCompleted,
    rollbackStatus: row.rollbackStatus as ProvisioningJobRecord["rollbackStatus"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function parseSteps(value: unknown): readonly ProvisioningStepRecord[] {
  if (!Array.isArray(value)) throw new Error("PROVISIONING_STEPS_INVALID");
  return value.map((item) => {
    if (!item || typeof item !== "object") throw new Error("PROVISIONING_STEP_INVALID");
    const step = item as Partial<ProvisioningStepRecord>;
    if (typeof step.key !== "string" || typeof step.status !== "string" || typeof step.attempts !== "number") {
      throw new Error("PROVISIONING_STEP_INVALID");
    }
    return step as ProvisioningStepRecord;
  });
}
