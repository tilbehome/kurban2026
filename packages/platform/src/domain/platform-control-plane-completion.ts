import type { OrganizationId, TenantInstanceId } from "@tilbecore/contracts";

export type TenantAccessMode = "normal" | "read_only" | "full_stop";
export type PlatformIncidentStatus = "open" | "investigating" | "resolved" | "cancelled";
export type PlatformMaintenanceStatus = "planned" | "active" | "completed" | "cancelled";
export type OrganizationOperationType = "freeze" | "reactivate" | "closure_request" | "closure_precheck" | "data_export" | "ownership_transfer";
export type OrganizationOperationStatus = "pending" | "awaiting_approval" | "approved" | "running" | "completed" | "failed" | "cancelled";

export interface TenantAccessPolicy {
  organizationId: OrganizationId;
  tenantInstanceId: TenantInstanceId;
  organizationStatus: string;
  mode: TenantAccessMode;
  blockedScopes: readonly string[];
  maintenanceMessage?: string;
  sourceIds: readonly string[];
}

const READ_SCOPE = /(?:^|\.)(?:read|list|search|view|status)$/;
const CRITICAL_WRITE = /(?:^|\.)(?:finance|payment|sale|slaughter|delivery|cash|ledger)(?:\.|$)/;

export function assertTenantOperationAllowed(policy: TenantAccessPolicy, requestedScope: string): void {
  if (policy.organizationStatus !== "active") throw new Error("TENANT_ORGANIZATION_NOT_ACTIVE");
  if (policy.blockedScopes.some((scope) => requestedScope === scope || requestedScope.startsWith(`${scope}.`))) {
    throw new Error("TENANT_MODULE_EMERGENCY_STOPPED");
  }
  if (policy.mode === "full_stop") throw new Error("TENANT_EMERGENCY_STOP_ACTIVE");
  if (policy.mode === "read_only" && !READ_SCOPE.test(requestedScope)) {
    throw new Error(CRITICAL_WRITE.test(requestedScope) ? "TENANT_CRITICAL_WRITE_BLOCKED" : "TENANT_READ_ONLY_MODE");
  }
}

export function assertIncidentTransition(current: PlatformIncidentStatus, next: PlatformIncidentStatus): void {
  const transitions: Record<PlatformIncidentStatus, readonly PlatformIncidentStatus[]> = {
    open: ["investigating", "resolved", "cancelled"],
    investigating: ["resolved", "cancelled"],
    resolved: [],
    cancelled: [],
  };
  if (!transitions[current].includes(next)) throw new Error("PLATFORM_INCIDENT_TRANSITION_DENIED");
}

export function assertMaintenanceTransition(current: PlatformMaintenanceStatus, next: PlatformMaintenanceStatus): void {
  const transitions: Record<PlatformMaintenanceStatus, readonly PlatformMaintenanceStatus[]> = {
    planned: ["active", "cancelled"], active: ["completed"], completed: [], cancelled: [],
  };
  if (!transitions[current].includes(next)) throw new Error("PLATFORM_MAINTENANCE_TRANSITION_DENIED");
}

export function operationNeedsSecondApproval(type: OrganizationOperationType): boolean {
  return type === "closure_request" || type === "data_export" || type === "ownership_transfer";
}

export function assertRecentReauthentication(reauthenticatedAt: string | undefined, now: string): void {
  const age = reauthenticatedAt ? Date.parse(now) - Date.parse(reauthenticatedAt) : Number.POSITIVE_INFINITY;
  if (!Number.isFinite(age) || age < 0 || age > 10 * 60 * 1000) throw new Error("PLATFORM_REAUTHENTICATION_REQUIRED");
}

export function assertSafeControlPlaneMetadata(value: unknown): void {
  const serialized = JSON.stringify(value);
  if (/postgres(?:ql)?:\/\/|password|secret|token|connectionString|databaseUrl|privateKey|customer|payment|animal|share/i.test(serialized)) {
    throw new Error("PLATFORM_CONTROL_PLANE_METADATA_UNSAFE");
  }
}
