import { createHash } from "node:crypto";
import type {
  Organization,
  PlatformUser,
  TenantDatabaseRefRecord,
  TenantInstance,
} from "@tilbecore/platform";

type Brand<TValue, TBrand extends string> = TValue & { readonly __brand: TBrand };

export type ProvisioningIdempotencyKey = Brand<string, "ProvisioningIdempotencyKey">;
export type ProvisioningJobId = Brand<string, "ProvisioningJobId">;

export const PROVISIONING_STEPS = [
  "tenant_database.create",
  "tenant_database.migrate",
  "tenant_database.verify_isolation",
  "platform.organization.register",
  "platform.tenant.register",
  "platform.admin_invite.prepare",
] as const;

export type ProvisioningStep = (typeof PROVISIONING_STEPS)[number];
export type ProvisioningJobStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed"
  | "rolled_back";
export type ProvisioningStepStatus = "pending" | "running" | "succeeded" | "failed";

export interface ProvisioningStepRecord {
  key: ProvisioningStep;
  status: ProvisioningStepStatus;
  attempts: number;
  startedAt?: string;
  finishedAt?: string;
  failureCode?: string;
}

export interface ProvisioningJobRecord {
  id: ProvisioningJobId;
  idempotencyKey: ProvisioningIdempotencyKey;
  commandFingerprint: string;
  organizationId: Organization["id"];
  tenantInstanceId: TenantInstance["id"];
  requestedByUserId: PlatformUser["id"];
  databaseRefId: TenantDatabaseRefRecord["id"];
  status: ProvisioningJobStatus;
  steps: readonly ProvisioningStepRecord[];
  currentStep?: ProvisioningStep;
  failureCode?: string;
  databaseCreatedByJob: boolean;
  platformRegistrationCompleted: boolean;
  rollbackStatus?: "not_required" | "succeeded" | "failed";
  createdAt: string;
  updatedAt: string;
}

export interface ProvisioningJobRepository {
  create(job: ProvisioningJobRecord): Promise<ProvisioningJobRecord>;
  update(job: ProvisioningJobRecord): Promise<ProvisioningJobRecord>;
  findById(id: ProvisioningJobId): Promise<ProvisioningJobRecord | null>;
  findByIdempotencyKey(key: ProvisioningIdempotencyKey): Promise<ProvisioningJobRecord | null>;
  findByTenantInstanceId(id: TenantInstance["id"]): Promise<ProvisioningJobRecord | null>;
}

export interface ProvisioningIdentityInput {
  idempotencyKey: ProvisioningIdempotencyKey;
  organization: Organization;
  tenant: TenantInstance;
  databaseRef: TenantDatabaseRefRecord;
  adminUser: PlatformUser;
}

export function provisioningCommandFingerprint(input: ProvisioningIdentityInput): string {
  const canonical = JSON.stringify({
    organizationId: input.organization.id,
    organizationSlug: input.organization.slug,
    tenantInstanceId: input.tenant.id,
    tenantSlug: input.tenant.slug,
    databaseRefId: input.databaseRef.id,
    adminUserId: input.adminUser.id,
    adminEmail: input.adminUser.email.trim().toLowerCase(),
  });
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

export function createProvisioningJob(
  input: ProvisioningIdentityInput & { requestedByUserId: PlatformUser["id"]; now: string },
): ProvisioningJobRecord {
  const digest = createHash("sha256").update(input.idempotencyKey, "utf8").digest("hex");
  return {
    id: `provisioning_${digest.slice(0, 24)}` as ProvisioningJobId,
    idempotencyKey: input.idempotencyKey,
    commandFingerprint: provisioningCommandFingerprint(input),
    organizationId: input.organization.id,
    tenantInstanceId: input.tenant.id,
    requestedByUserId: input.requestedByUserId,
    databaseRefId: input.databaseRef.id,
    status: "pending",
    steps: PROVISIONING_STEPS.map((key) => ({ key, status: "pending", attempts: 0 })),
    databaseCreatedByJob: false,
    platformRegistrationCompleted: false,
    createdAt: input.now,
    updatedAt: input.now,
  };
}

export function safeProvisioningErrorCode(error: unknown): string {
  if (error instanceof TenantProvisioningError) return error.code;
  if (error instanceof Error) {
    const candidate = error.message.split(":", 1)[0];
    if (candidate && /^[A-Z][A-Z0-9_]{2,80}$/.test(candidate)) return candidate;
  }
  return "PROVISIONING_STEP_FAILED";
}

export class TenantProvisioningError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "TenantProvisioningError";
  }
}
