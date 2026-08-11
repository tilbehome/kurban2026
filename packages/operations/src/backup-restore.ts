import type { TenantDatabaseRefId, TenantInstanceId } from "@tilbecore/contracts";

export type BackupStatus = "pending" | "completed" | "failed";
export type RestoreDrillStatus = "not_started" | "running" | "verified" | "failed";

export interface TenantBackupPlan {
  tenantInstanceId: TenantInstanceId;
  scheduleKey: string;
  retentionDays: number;
  walOrPitrEvaluated: boolean;
}

export interface TenantBackupRun {
  id: string;
  tenantInstanceId: TenantInstanceId;
  status: BackupStatus;
  startedAt: string;
  finishedAt?: string;
  artifactRef?: string;
}

export interface RestoreDrillEvidence {
  id: string;
  tenantInstanceId: TenantInstanceId;
  backupRunId: string;
  status: RestoreDrillStatus;
  verifiedAt?: string;
  evidenceRef?: string;
}

export type TenantBackupArtifactStatus = "pending" | "completed" | "failed" | "verified";

export interface TenantBackupMetadata {
  id: string;
  tenantInstanceId: TenantInstanceId;
  databaseRefId: TenantDatabaseRefId;
  createdAt: string;
  migrationVersion: string;
  checksumSha256?: string;
  sizeBytes?: number;
  status: TenantBackupArtifactStatus;
  verificationStatus: "not_started" | "running" | "verified" | "failed";
  artifactFileName: string;
  failureCode?: string;
  verifiedAt?: string;
}

export interface TenantRestorePlan {
  id: string;
  tenantInstanceId: TenantInstanceId;
  databaseRefId: TenantDatabaseRefId;
  backupId: string;
  createdAt: string;
  destructiveRestoreEnabled: false;
  explicitApprovalRequired: true;
  steps: readonly [
    "target_binding.verify",
    "backup_checksum.verify",
    "temporary_database.restore",
    "schema_and_tenant_marker.verify",
    "production_restore.manual_approval",
  ];
}

export interface TenantBackupAuditEvent {
  action:
    | "tenant.backup.create"
    | "tenant.backup.verify"
    | "tenant.restore.plan"
    | "tenant.restore.verify";
  tenantInstanceId: TenantInstanceId;
  backupId: string;
  requestId: string;
  result: "started" | "succeeded" | "failed" | "denied";
  occurredAt: string;
  failureCode?: string;
}

export interface TenantBackupAuditPort {
  record(event: TenantBackupAuditEvent): Promise<void>;
}

export function assertBackupMatchesTenant(
  metadata: TenantBackupMetadata,
  tenantInstanceId: TenantInstanceId,
  databaseRefId: TenantDatabaseRefId,
): void {
  if (metadata.tenantInstanceId !== tenantInstanceId) throw new Error("BACKUP_TENANT_MISMATCH");
  if (metadata.databaseRefId !== databaseRefId) throw new Error("BACKUP_DATABASE_REF_MISMATCH");
}

export function createTenantRestorePlan(
  metadata: TenantBackupMetadata,
  requestId: string,
  createdAt: string,
): TenantRestorePlan {
  if (metadata.status !== "completed" && metadata.status !== "verified") {
    throw new Error("BACKUP_NOT_RESTORABLE");
  }
  if (!/^[a-zA-Z0-9._:-]{8,128}$/.test(requestId)) throw new Error("RESTORE_REQUEST_ID_INVALID");
  return {
    id: `restore_plan_${metadata.id}`,
    tenantInstanceId: metadata.tenantInstanceId,
    databaseRefId: metadata.databaseRefId,
    backupId: metadata.id,
    createdAt,
    destructiveRestoreEnabled: false,
    explicitApprovalRequired: true,
    steps: [
      "target_binding.verify",
      "backup_checksum.verify",
      "temporary_database.restore",
      "schema_and_tenant_marker.verify",
      "production_restore.manual_approval",
    ],
  };
}

export function assertBackupPlanProductionReady(plan: TenantBackupPlan): void {
  if (plan.retentionDays <= 0) throw new Error("BACKUP_RETENTION_INVALID");
  if (!plan.walOrPitrEvaluated) throw new Error("WAL_OR_PITR_EVALUATION_REQUIRED");
}

export function assertRestoreVerified(evidence: RestoreDrillEvidence): void {
  if (evidence.status !== "verified" || !evidence.verifiedAt) {
    throw new Error("RESTORE_DRILL_NOT_VERIFIED");
  }
}
