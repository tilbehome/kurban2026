import type { OrganizationId, TenantInstanceId } from "@tilbecore/contracts";
import type { PlatformActor, PlatformCommandDraft, PlatformPermissionKey } from "../domain/platform-admin";
import type { OrganizationStatus, PlatformUserId } from "../domain/platform-domain";

export interface PlatformAuthUserRecord {
  id: PlatformUserId;
  email: string;
  displayName: string;
  status: string;
  passwordHash?: string;
  failedLoginCount: number;
  lockedUntil?: string;
  mfaRequired: boolean;
  authVersion: number;
  roles: readonly { key: string; status: string; permissions: readonly string[] }[];
}

export interface PlatformSessionRecord {
  id: string;
  userId: PlatformUserId;
  tokenHash: string;
  status: string;
  authVersion: number;
  expiresAt: string;
}

export interface PlatformDashboardSnapshot {
  activeOrganizations: number;
  provisioningOrganizations: number;
  failedProvisioningJobs: number;
  activeLicenses: number;
  suspendedLicenses: number;
  expiredLicenses: number;
  unhealthyTenants: number;
  unverifiedBackups: number;
  pendingDomains: number;
  openSupportSessions: number;
  criticalIncidents: number;
  migrationPendingTenants: number;
  quotaAlerts: number;
}

export interface PlatformOrganizationListItem {
  id: OrganizationId;
  tenantInstanceId?: TenantInstanceId;
  displayName: string;
  slug: string;
  status: OrganizationStatus;
  planName?: string;
  licenseStatus?: string;
  domain?: string;
  databaseStatus?: string;
  backupStatus?: string;
  provisioningStatus?: string;
  criticalAlert?: string;
  createdAt: string;
}

export interface PlatformOrganizationDetail extends PlatformOrganizationListItem {
  version: number;
  tenant?: Readonly<Record<string, unknown>>;
  license?: Readonly<Record<string, unknown>>;
  domains: readonly Readonly<Record<string, unknown>>[];
  provisioningJobs: readonly Readonly<Record<string, unknown>>[];
  adminInvitations: readonly Readonly<Record<string, unknown>>[];
  backups: readonly Readonly<Record<string, unknown>>[];
  supportSessions: readonly Readonly<Record<string, unknown>>[];
  lifecycleEvents: readonly Readonly<Record<string, unknown>>[];
  auditEvents: readonly Readonly<Record<string, unknown>>[];
}

export interface PlatformListQuery {
  search?: string;
  status?: string;
  plan?: string;
  licenseStatus?: string;
  provisioningStatus?: string;
}

export interface PlatformAdminRepository {
  findAuthUserByEmail(email: string): Promise<PlatformAuthUserRecord | null>;
  findAuthUserById(id: PlatformUserId): Promise<PlatformAuthUserRecord | null>;
  markLoginFailure(userId: PlatformUserId, failedCount: number, lockedUntil?: string): Promise<void>;
  markLoginSuccess(userId: PlatformUserId, occurredAt: string): Promise<void>;
  createSession(input: PlatformSessionRecord & { deviceId: string; occurredAt: string; userAgent?: string }): Promise<void>;
  findSessionByTokenHash(tokenHash: string): Promise<PlatformSessionRecord | null>;
  rotateSession(id: string, oldTokenHash: string, newTokenHash: string, expiresAt: string, occurredAt: string): Promise<boolean>;
  revokeSession(id: string, occurredAt: string): Promise<void>;
  revokeUserSessions(userId: PlatformUserId, occurredAt: string): Promise<void>;
  recordAudit(input: {
    id: string;
    actorUserId?: PlatformUserId;
    organizationId?: OrganizationId;
    tenantInstanceId?: TenantInstanceId;
    action: string;
    targetType: string;
    targetId?: string;
    requestId: string;
    result: "success" | "failure" | "denied";
    metadata?: Readonly<Record<string, string | number | boolean | null>>;
    occurredAt: string;
  }): Promise<void>;
  dashboard(now: string): Promise<PlatformDashboardSnapshot>;
  listOrganizations(query: PlatformListQuery): Promise<readonly PlatformOrganizationListItem[]>;
  organizationDetail(id: OrganizationId): Promise<PlatformOrganizationDetail | null>;
  enqueueCommand(command: PlatformCommandDraft): Promise<{ id: string; status: string; duplicate: boolean }>;
  transitionOrganization(input: {
    organizationId: OrganizationId;
    fromStatus: OrganizationStatus;
    toStatus: OrganizationStatus;
    expectedVersion: number;
    reason: string;
    impactSummary: string;
    approvedByUserId: PlatformUserId;
    requestId: string;
    eventId: string;
  }): Promise<boolean>;
  listProvisioningJobs(): Promise<readonly Readonly<Record<string, unknown>>[]>;
  listPlansAndLicenses(): Promise<readonly Readonly<Record<string, unknown>>[]>;
  listPlatformUsers(): Promise<readonly Readonly<Record<string, unknown>>[]>;
  listAuditEvents(): Promise<readonly Readonly<Record<string, unknown>>[]>;
  listSupportSessions(): Promise<readonly Readonly<Record<string, unknown>>[]>;
  listDomains(): Promise<readonly Readonly<Record<string, unknown>>[]>;
  listBackups(): Promise<readonly Readonly<Record<string, unknown>>[]>;
  provisioningIdentifiersAvailable(input: { organizationId: OrganizationId; tenantInstanceId: TenantInstanceId; slug: string; domain: string }): Promise<boolean>;
  createSupportSession(input: {
    id: string;
    organizationId: OrganizationId;
    tenantInstanceId: TenantInstanceId;
    platformUserId: PlatformUserId;
    approvedByUserId: string;
    reason: string;
    scopes: readonly string[];
    startsAt: string;
    expiresAt: string;
  }): Promise<void>;
  revokeSupportSession(input: { id: string; revokedByUserId: PlatformUserId; reason: string; occurredAt: string }): Promise<boolean>;
  createCustomDomain(input: { id: string; tenantInstanceId: TenantInstanceId; hostname: string; isPrimary: boolean }): Promise<void>;
  scheduleLicenseChange(input: { id: string; licenseId: string; targetPlanId: string; effectiveAt: string; reason: string; requestedByUserId: PlatformUserId; expectedVersion: number }): Promise<void>;
  updatePlatformUserStatus(input: { userId: PlatformUserId; status: "active" | "suspended"; occurredAt: string }): Promise<boolean>;
  replacePlatformUserRoles(input: { userId: PlatformUserId; roleIds: readonly string[]; occurredAt: string }): Promise<boolean>;
}

export interface PasswordVerifier { verify(password: string, hash: string): Promise<boolean> }
export interface MfaVerifier { verify(userId: PlatformUserId, code: string, occurredAt: string): Promise<boolean> }

export interface PlatformAuthResult {
  actor: PlatformActor;
  token: string;
  session: PlatformSessionRecord;
}

export type { PlatformActor, PlatformPermissionKey };
