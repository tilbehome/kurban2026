import type {
  OrganizationId,
  SupportSessionContract,
  SupportSessionId,
  TenantInstanceId,
  UserId,
} from "@tilbecore/contracts";
import type {
  PlatformModuleId,
  PlatformRoleId,
  PlatformUserId,
  TenantDatabaseRefRecord,
} from "./platform-domain";

type Brand<TValue, TBrand extends string> = TValue & { readonly __brand: TBrand };

export type PlatformSessionId = Brand<string, "PlatformSessionId">;
export type PlatformDeviceId = Brand<string, "PlatformDeviceId">;
export type PlatformProvisioningJobId = Brand<string, "PlatformProvisioningJobId">;
export type PlatformIncidentId = Brand<string, "PlatformIncidentId">;
export type PlatformMaintenanceWindowId = Brand<string, "PlatformMaintenanceWindowId">;
export type PlatformAuditEventId = Brand<string, "PlatformAuditEventId">;
export type PlatformSupportTicketId = Brand<string, "PlatformSupportTicketId">;

export type MfaMethod = "totp" | "webauthn_passkey" | "recovery_code";
export type MfaEnrollmentStatus = "pending" | "active" | "revoked";
export type PlatformSessionStatus = "active" | "revoked" | "expired";
export type PlatformDeviceTrustStatus = "unknown" | "trusted" | "blocked";
export type ProvisioningStepStatus = "pending" | "running" | "succeeded" | "failed" | "skipped";
export type IncidentSeverity = "info" | "warning" | "critical";
export type IncidentStatus = "open" | "investigating" | "resolved" | "cancelled";
export type MaintenanceStatus = "planned" | "active" | "completed" | "cancelled";
export type EmergencyStopStatus = "inactive" | "active";
export type PlatformAuditResult = "success" | "failure" | "denied";

export interface PlatformPermission {
  key: string;
  description: string;
  scope: "platform" | "organization" | "tenantSupport";
}

export interface PlatformRoleDefinition {
  id: PlatformRoleId;
  key: string;
  displayName: string;
  permissions: readonly PlatformPermission[];
}

export interface PlatformMfaEnrollment {
  id: string;
  userId: PlatformUserId;
  method: MfaMethod;
  status: MfaEnrollmentStatus;
  createdAt: string;
  activatedAt?: string;
  revokedAt?: string;
}

export interface PlatformSession {
  id: PlatformSessionId;
  userId: PlatformUserId;
  deviceId: PlatformDeviceId;
  status: PlatformSessionStatus;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  revokedAt?: string;
}

export interface PlatformDevice {
  id: PlatformDeviceId;
  userId: PlatformUserId;
  label: string;
  userAgent?: string;
  trustStatus: PlatformDeviceTrustStatus;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface ProvisioningStep {
  key: string;
  status: ProvisioningStepStatus;
  startedAt?: string;
  finishedAt?: string;
  errorCode?: string;
}

export interface PlatformProvisioningJob {
  id: PlatformProvisioningJobId;
  organizationId: OrganizationId;
  tenantInstanceId: TenantInstanceId;
  requestedByUserId: PlatformUserId;
  databaseRef: TenantDatabaseRefRecord;
  status: ProvisioningStepStatus;
  steps: readonly ProvisioningStep[];
  createdAt: string;
  updatedAt: string;
}

export interface TenantHealthSnapshot {
  tenantInstanceId: TenantInstanceId;
  status: "unknown" | "healthy" | "degraded" | "offline";
  version?: string;
  migrationVersion?: string;
  lastBackupAt?: string;
  lastRestoreDrillAt?: string;
  checkedAt: string;
}

export interface EmergencyStop {
  organizationId: OrganizationId;
  tenantInstanceId?: TenantInstanceId;
  moduleId?: PlatformModuleId;
  status: EmergencyStopStatus;
  reason?: string;
  changedByUserId: PlatformUserId;
  changedAt: string;
}

export interface PlatformIncident {
  id: PlatformIncidentId;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  affectedTenantIds: readonly TenantInstanceId[];
  openedAt: string;
  resolvedAt?: string;
}

export interface MaintenanceWindow {
  id: PlatformMaintenanceWindowId;
  status: MaintenanceStatus;
  title: string;
  affectedTenantIds: readonly TenantInstanceId[];
  plannedStartAt: string;
  plannedEndAt: string;
}

export interface PlatformAuditEvent {
  id: PlatformAuditEventId;
  actorUserId?: PlatformUserId;
  organizationId?: OrganizationId;
  tenantInstanceId?: TenantInstanceId;
  supportSessionId?: SupportSessionId;
  action: string;
  targetType: string;
  targetId?: string;
  result: PlatformAuditResult;
  requestId: string;
  occurredAt: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface PlatformSupportTicketLink {
  ticketId: PlatformSupportTicketId;
  supportSessionId: SupportSessionId;
  linkedByUserId: PlatformUserId;
  linkedAt: string;
}

export function assertPlatformSessionActive(session: PlatformSession, nowIso: string): void {
  if (session.status !== "active") throw new Error(`PLATFORM_SESSION_NOT_ACTIVE:${session.status}`);
  if (Date.parse(session.expiresAt) <= Date.parse(nowIso)) {
    throw new Error("PLATFORM_SESSION_EXPIRED");
  }
}

export function assertMfaSatisfiedForSensitiveAction(
  enrollments: readonly PlatformMfaEnrollment[],
): void {
  if (!enrollments.some((enrollment) => enrollment.status === "active")) {
    throw new Error("PLATFORM_MFA_REQUIRED");
  }
}

export function assertSupportSessionUsable(
  supportSession: SupportSessionContract | undefined,
  tenantInstanceId: TenantInstanceId,
  requestedScope: string,
  nowIso: string,
): void {
  if (!supportSession) throw new Error("SUPPORT_SESSION_REQUIRED");
  if (supportSession.tenantInstanceId !== tenantInstanceId) {
    throw new Error("SUPPORT_SESSION_TENANT_MISMATCH");
  }
  if (!supportSession.scopes.includes(requestedScope)) {
    throw new Error("SUPPORT_SESSION_SCOPE_DENIED");
  }
  if (Date.parse(supportSession.startsAt) > Date.parse(nowIso) || Date.parse(supportSession.expiresAt) <= Date.parse(nowIso)) {
    throw new Error("SUPPORT_SESSION_NOT_ACTIVE");
  }
}

export function assertNoTenantOperationDataInPlatformAudit(event: PlatformAuditEvent): void {
  const forbiddenKeys = ["customer", "finance", "ledger", "share", "proxyDocument", "delivery", "slaughter"];
  const metadataKeys = Object.keys(event.metadata ?? {});
  const forbidden = metadataKeys.find((key) => forbiddenKeys.some((forbiddenKey) => key.includes(forbiddenKey)));
  if (forbidden) throw new Error(`PLATFORM_AUDIT_TENANT_OPERATION_DATA_FORBIDDEN:${forbidden}`);
}

export function nextProvisioningStep(job: PlatformProvisioningJob): ProvisioningStep | null {
  return job.steps.find((step) => step.status === "pending") ?? null;
}

export function emergencyStopAllowsModule(stop: EmergencyStop | undefined): boolean {
  return !stop || stop.status === "inactive";
}
