type Brand<TValue, TBrand extends string> = TValue & { readonly __brand: TBrand };

export type OrganizationId = Brand<string, "OrganizationId">;
export type TenantInstanceId = Brand<string, "TenantInstanceId">;
export type TenantSlug = Brand<string, "TenantSlug">;
export type TenantDatabaseRefId = Brand<string, "TenantDatabaseRefId">;
export type SupportSessionId = Brand<string, "SupportSessionId">;
export type UserId = Brand<string, "UserId">;

export type TenantDeploymentMode = "managed" | "local_hybrid";
export type TenantProvisioningStatus =
  | "draft"
  | "provisioning"
  | "active"
  | "maintenance"
  | "suspended"
  | "failed"
  | "closed";
export type TenantRuntimeStatus = "unknown" | "healthy" | "degraded" | "offline";
export type TenantDatabaseEngine = "postgresql";
export type ReleaseChannel = "stable" | "preview" | "pilot";
export type TenantAccessTokenPurpose =
  | "customerTracking"
  | "qrSlaughterCheck"
  | "qrDelivery"
  | "userInvite"
  | "tvDevicePairing"
  | "supportAccess";
export type CustomDomainStatus =
  | "PENDING"
  | "VERIFYING"
  | "VERIFIED"
  | "ACTIVE"
  | "FAILED"
  | "SUSPENDED"
  | "REMOVED";

export interface TenantDatabaseRef {
  id: TenantDatabaseRefId;
  engine: TenantDatabaseEngine;
  managed: boolean;
  region?: string;
}

export interface TenantModuleEntitlement {
  moduleId: string;
  enabled: boolean;
  validUntil?: string;
}

export interface TenantOperationalLimits {
  maxUsers?: number;
  maxDevices?: number;
  maxStorageMb?: number;
}

export interface TenantBackupSummary {
  lastBackupAt?: string;
  lastVerifiedRestoreAt?: string;
  status: "unknown" | "ok" | "warning" | "failed";
}

export interface PlatformTenantDescriptor {
  organizationId: OrganizationId;
  organizationStatus: "draft" | "active" | "suspended" | "closed";
  tenantInstanceId: TenantInstanceId;
  slug: TenantSlug;
  displayName: string;
  deploymentMode: TenantDeploymentMode;
  provisioningStatus: TenantProvisioningStatus;
  runtimeStatus: TenantRuntimeStatus;
  releaseChannel: ReleaseChannel;
  currentVersion?: string;
  databaseRef: TenantDatabaseRef;
  databaseRefStatus: "active" | "suspended" | "removed";
  moduleEntitlements: TenantModuleEntitlement[];
  limits: TenantOperationalLimits;
  backupSummary?: TenantBackupSummary;
  lastHealthAt?: string;
}

export interface TenantRuntimeActor {
  userId: UserId;
  roleIds: string[];
  supportSessionId?: SupportSessionId;
}

export interface TenantRuntimeContext {
  organizationId: OrganizationId;
  tenantInstanceId: TenantInstanceId;
  slug: TenantSlug;
  databaseRefId: TenantDatabaseRefId;
  deploymentMode: TenantDeploymentMode;
  normalizedHost: string;
  requestId: string;
  traceId: string;
  actor?: TenantRuntimeActor;
}

export interface TenantRequestSupportContext {
  id: SupportSessionId;
  reason: string;
  scopes: string[];
  startsAt: string;
  expiresAt: string;
}

export interface TenantRequestContext {
  organizationId: OrganizationId;
  tenantId: TenantInstanceId;
  normalizedHost: string;
  tenantDatabaseRefId: TenantDatabaseRefId;
  userId: UserId;
  sessionId: string;
  actorKind: "tenant" | "platform";
  roleIds: string[];
  permissions: string[];
  supportSession?: TenantRequestSupportContext;
  requestId: string;
  traceId: string;
}

export type TenantOperationDataClass =
  | "platformMetadata"
  | "tenantHealth"
  | "customer"
  | "finance"
  | "proxyDocument"
  | "share"
  | "slaughter"
  | "delivery";

export interface SupportSessionContract {
  id: SupportSessionId;
  organizationId: OrganizationId;
  tenantInstanceId: TenantInstanceId;
  reason: string;
  approvedByUserId?: UserId;
  startsAt: string;
  expiresAt: string;
  scopes: string[];
}

export interface TenantAccessTokenContract {
  purpose: TenantAccessTokenPurpose;
  opaqueToken: string;
  tenantInstanceId: TenantInstanceId;
  expiresAt?: string;
  singleUse: boolean;
  revokedAt?: string;
}

export interface TenantCustomDomainContract {
  hostname: string;
  tenantInstanceId: TenantInstanceId;
  status: CustomDomainStatus;
  dnsVerifiedAt?: string;
  tlsReadyAt?: string;
  activatedAt?: string;
  removedAt?: string;
}

export function customDomainCanBeActivated(
  domain: TenantCustomDomainContract,
): boolean {
  return domain.status === "VERIFIED" && Boolean(domain.dnsVerifiedAt && domain.tlsReadyAt);
}

export type PlatformTenantEvent =
  | {
      type: "tenant.provisioning.statusChanged";
      tenantInstanceId: TenantInstanceId;
      status: TenantProvisioningStatus;
      occurredAt: string;
    }
  | {
      type: "tenant.runtime.healthChanged";
      tenantInstanceId: TenantInstanceId;
      status: TenantRuntimeStatus;
      occurredAt: string;
    }
  | {
      type: "tenant.supportSession.opened";
      tenantInstanceId: TenantInstanceId;
      supportSessionId: SupportSessionId;
      occurredAt: string;
    };

const FORBIDDEN_DESCRIPTOR_KEYS = [
  "connectionString",
  "databaseUrl",
  "DATABASE_URL",
  "password",
  "secret",
  "token",
  "privateKey",
] as const;

export function assertPlatformTenantDescriptorSafe(
  descriptor: PlatformTenantDescriptor,
): PlatformTenantDescriptor {
  const forbiddenPath = findForbiddenKey(descriptor);
  if (forbiddenPath) {
    throw new Error(`PLATFORM_TENANT_DESCRIPTOR_UNSAFE:${forbiddenPath}`);
  }
  return descriptor;
}

export function platformCanReadTenantOperationData(
  dataClass: TenantOperationDataClass,
  supportSession?: SupportSessionContract,
): boolean {
  if (dataClass === "platformMetadata" || dataClass === "tenantHealth") {
    return true;
  }
  return Boolean(supportSession);
}

function findForbiddenKey(value: unknown, path = "$"): string | null {
  if (!value || typeof value !== "object") return null;

  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_DESCRIPTOR_KEYS.some((forbidden) => key.includes(forbidden))) {
      return `${path}.${key}`;
    }
    const nested = findForbiddenKey(child, `${path}.${key}`);
    if (nested) return nested;
  }

  return null;
}
