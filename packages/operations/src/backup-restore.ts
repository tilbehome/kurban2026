import type { TenantInstanceId } from "@tilbecore/contracts";

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

export function assertBackupPlanProductionReady(plan: TenantBackupPlan): void {
  if (plan.retentionDays <= 0) throw new Error("BACKUP_RETENTION_INVALID");
  if (!plan.walOrPitrEvaluated) throw new Error("WAL_OR_PITR_EVALUATION_REQUIRED");
}

export function assertRestoreVerified(evidence: RestoreDrillEvidence): void {
  if (evidence.status !== "verified" || !evidence.verifiedAt) {
    throw new Error("RESTORE_DRILL_NOT_VERIFIED");
  }
}
