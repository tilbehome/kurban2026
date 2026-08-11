import type { OrganizationId, TenantInstanceId } from "@tilbecore/contracts";
import type { OrganizationStatus, PlatformUserId } from "./platform-domain";

export const PLATFORM_ROLE_KEYS = [
  "platform_super_admin",
  "platform_operations",
  "platform_support",
  "platform_read_only",
] as const;

export type PlatformRoleKey = (typeof PLATFORM_ROLE_KEYS)[number];

export const PLATFORM_PERMISSIONS = [
  "platform.dashboard.read",
  "platform.organization.read",
  "platform.organization.lifecycle.manage",
  "platform.provisioning.read",
  "platform.provisioning.manage",
  "platform.license.read",
  "platform.license.manage",
  "platform.domain.read",
  "platform.domain.manage",
  "platform.backup.read",
  "platform.backup.manage",
  "platform.support.read",
  "platform.support.manage",
  "platform.user.read",
  "platform.user.manage",
  "platform.audit.read",
] as const;

export type PlatformPermissionKey = (typeof PLATFORM_PERMISSIONS)[number];

export const PLATFORM_ROLE_PERMISSIONS: Readonly<Record<PlatformRoleKey, readonly PlatformPermissionKey[]>> = {
  platform_super_admin: PLATFORM_PERMISSIONS,
  platform_operations: [
    "platform.dashboard.read",
    "platform.organization.read",
    "platform.organization.lifecycle.manage",
    "platform.provisioning.read",
    "platform.provisioning.manage",
    "platform.license.read",
    "platform.license.manage",
    "platform.domain.read",
    "platform.domain.manage",
    "platform.backup.read",
    "platform.backup.manage",
    "platform.support.read",
    "platform.audit.read",
  ],
  platform_support: [
    "platform.dashboard.read",
    "platform.organization.read",
    "platform.provisioning.read",
    "platform.domain.read",
    "platform.backup.read",
    "platform.support.read",
    "platform.support.manage",
    "platform.audit.read",
  ],
  platform_read_only: [
    "platform.dashboard.read",
    "platform.organization.read",
    "platform.provisioning.read",
    "platform.license.read",
    "platform.domain.read",
    "platform.backup.read",
    "platform.support.read",
    "platform.user.read",
    "platform.audit.read",
  ],
};

export type PlatformCommandType =
  | "tenant.provision"
  | "tenant.provision.resume"
  | "tenant.provision.rollback"
  | "tenant.backup.create"
  | "tenant.backup.verify"
  | "tenant.restore.verify";

export interface PlatformActor {
  userId: PlatformUserId;
  permissions: readonly PlatformPermissionKey[];
  sessionId: string;
}

export interface PlatformCommandDraft {
  id: string;
  idempotencyKey: string;
  type: PlatformCommandType;
  organizationId?: OrganizationId;
  tenantInstanceId?: TenantInstanceId;
  requestedByUserId: PlatformUserId;
  requestId: string;
  traceId: string;
  approvalReason: string;
  payload: Readonly<Record<string, unknown>>;
  expectedVersion?: number;
}

const LIFECYCLE_TRANSITIONS: Readonly<Record<OrganizationStatus, readonly OrganizationStatus[]>> = {
  draft: ["provisioning", "archived"],
  provisioning: ["active", "provisioning_failed", "restricted"],
  active: ["suspended", "restricted", "archived"],
  suspended: ["active", "restricted", "archived"],
  restricted: ["active", "suspended", "archived"],
  archived: [],
  provisioning_failed: ["provisioning", "archived"],
  closed: [],
};

export function assertPlatformPermission(actor: PlatformActor, permission: PlatformPermissionKey): void {
  if (!actor.permissions.includes(permission)) throw new Error("PLATFORM_PERMISSION_DENIED");
}

export function assertOrganizationLifecycleTransition(
  current: OrganizationStatus,
  next: OrganizationStatus,
): void {
  if (current === next || !LIFECYCLE_TRANSITIONS[current].includes(next)) {
    throw new Error(`ORGANIZATION_LIFECYCLE_TRANSITION_DENIED:${current}:${next}`);
  }
}

export function assertApprovalReason(reason: string): void {
  const length = reason.trim().length;
  if (length < 8 || length > 500) throw new Error("PLATFORM_APPROVAL_REASON_INVALID");
}

export function assertPlatformPayloadSafe(value: unknown): void {
  const serialized = JSON.stringify(value);
  if (/postgres(?:ql)?:\/\/|connection(?:_|\s*)string|database(?:_|\s*)url|password|secret|token/i.test(serialized)) {
    throw new Error("PLATFORM_COMMAND_SECRET_FORBIDDEN");
  }
}

export function resolveRolePermissions(
  roles: readonly { key: string; status: string; permissions: readonly string[] }[],
): PlatformPermissionKey[] {
  const allowed = new Set<string>(PLATFORM_PERMISSIONS);
  const result = new Set<PlatformPermissionKey>();
  for (const role of roles) {
    if (role.status !== "active") continue;
    const defaults = PLATFORM_ROLE_KEYS.includes(role.key as PlatformRoleKey)
      ? PLATFORM_ROLE_PERMISSIONS[role.key as PlatformRoleKey]
      : [];
    for (const permission of [...defaults, ...role.permissions]) {
      if (allowed.has(permission)) result.add(permission as PlatformPermissionKey);
    }
  }
  return [...result];
}
