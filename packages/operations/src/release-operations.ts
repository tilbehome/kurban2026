import type { TenantInstanceId } from "@tilbecore/contracts";

export type ReleaseChannel = "stable" | "preview" | "pilot";
export type ReleaseGateStatus = "pending" | "passed" | "failed" | "waived";
export type MaintenanceModeStatus = "off" | "read_only" | "maintenance";

export interface ReleaseGate {
  key: string;
  status: ReleaseGateStatus;
  evidence?: string;
}

export interface ReleaseCandidate {
  version: string;
  channel: ReleaseChannel;
  gates: readonly ReleaseGate[];
  canaryTenantIds: readonly TenantInstanceId[];
}

export interface RollbackPlan {
  fromVersion: string;
  toVersion: string;
  requiredBackupId?: string;
  steps: readonly string[];
}

export function assertReleaseCandidateReady(candidate: ReleaseCandidate): void {
  const failed = candidate.gates.find((gate) => gate.status !== "passed");
  if (failed) throw new Error(`RELEASE_GATE_NOT_PASSED:${failed.key}`);
}

export function assertRollbackPlanActionable(plan: RollbackPlan): void {
  if (plan.steps.length === 0) throw new Error("ROLLBACK_STEPS_REQUIRED");
  if (plan.fromVersion === plan.toVersion) throw new Error("ROLLBACK_VERSION_MISMATCH");
}
