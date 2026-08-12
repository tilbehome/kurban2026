import type { OrganizationId, TenantInstanceId } from "@tilbecore/contracts";
import type { PlatformActor } from "../domain/platform-admin";
import type { OrganizationOperationStatus, OrganizationOperationType, PlatformIncidentStatus, PlatformMaintenanceStatus } from "../domain/platform-control-plane-completion";
import type { PlatformUserId } from "../domain/platform-domain";

export interface PasskeyRecord {
  id: string; credentialId: string; userId: PlatformUserId; publicKeyBase64url: string; counter: bigint;
  transports: readonly string[]; deviceType: string; backedUp: boolean; label: string; status: string;
}
export interface AuthChallengeRecord { id: string; userId: PlatformUserId; purpose: string; challenge: string; expiresAt: string; consumedAt?: string }
export interface PasskeyRegistrationResult { credentialId: string; publicKeyBase64url: string; counter: bigint; transports: readonly string[]; deviceType: string; backedUp: boolean }
export interface PasskeyAuthenticationResult { credentialId: string; newCounter: bigint }

export interface PasskeyCeremonyPort {
  registrationOptions(input: { userId: string; email: string; displayName: string; existingCredentialIds: readonly string[] }): Promise<Readonly<Record<string, unknown>>>;
  verifyRegistration(input: { response: unknown; expectedChallenge: string }): Promise<PasskeyRegistrationResult>;
  authenticationOptions(input: { credentialIds: readonly string[] }): Promise<Readonly<Record<string, unknown>>>;
  verifyAuthentication(input: { response: unknown; expectedChallenge: string; credential: PasskeyRecord }): Promise<PasskeyAuthenticationResult>;
}

export interface OrganizationOperationDraft {
  id: string; idempotencyKey: string; organizationId: OrganizationId; tenantInstanceId?: TenantInstanceId;
  type: OrganizationOperationType; status: OrganizationOperationStatus; reason: string; requestedByUserId: PlatformUserId;
  requestId: string;
  requiresSecondApproval: boolean; reauthenticatedAt: string; payload: Readonly<Record<string, unknown>>;
}

export interface PlatformControlPlaneRepository {
  createChallenge(input: AuthChallengeRecord): Promise<void>;
  consumeChallenge(input: { id: string; userId: PlatformUserId; purpose: string; occurredAt: string }): Promise<AuthChallengeRecord | null>;
  listPasskeys(userId: PlatformUserId): Promise<readonly PasskeyRecord[]>;
  findPasskey(credentialId: string): Promise<PasskeyRecord | null>;
  savePasskey(input: PasskeyRecord): Promise<void>;
  updatePasskeyCounter(input: { credentialId: string; counter: bigint; occurredAt: string }): Promise<boolean>;
  revokePasskey(input: { id: string; userId: PlatformUserId; occurredAt: string }): Promise<boolean>;
  replaceRecoveryCodes(input: { userId: PlatformUserId; batchId: string; codes: readonly { id: string; hash: string }[]; occurredAt: string }): Promise<void>;
  consumeRecoveryCode(input: { userId: PlatformUserId; hash: string; occurredAt: string }): Promise<boolean>;
  listSecurityOverview(userId?: PlatformUserId): Promise<readonly Readonly<Record<string, unknown>>[]>;
  revokeDeviceSessions(input: { userId: PlatformUserId; deviceId: string; occurredAt: string }): Promise<boolean>;
  markSessionReauthenticated(input: { sessionId: string; userId: PlatformUserId; occurredAt: string }): Promise<boolean>;
  findSessionSecurity(id: string): Promise<{ userId: PlatformUserId; lastReauthenticatedAt?: string } | null>;

  listIncidents(): Promise<readonly Readonly<Record<string, unknown>>[]>;
  createIncident(input: { id: string; organizationId?: OrganizationId; severity: string; title: string; message: string; affectedTenantIds: readonly string[]; actor: PlatformActor; requestId: string; occurredAt: string }): Promise<void>;
  transitionIncident(input: { id: string; fromStatus: PlatformIncidentStatus; toStatus: PlatformIncidentStatus; message: string; actor: PlatformActor; requestId: string; occurredAt: string }): Promise<boolean>;
  listMaintenanceWindows(): Promise<readonly Readonly<Record<string, unknown>>[]>;
  createMaintenance(input: { id: string; title: string; message: string; affectedTenantIds: readonly string[]; plannedStartAt: string; plannedEndAt: string; mode: "read_only" | "full_stop"; actor: PlatformActor }): Promise<void>;
  transitionMaintenance(input: { id: string; fromStatus: PlatformMaintenanceStatus; toStatus: PlatformMaintenanceStatus; occurredAt: string }): Promise<boolean>;
  setEmergencyStop(input: { id: string; organizationId: OrganizationId; tenantInstanceId?: TenantInstanceId; moduleId?: string; status: "active" | "inactive"; mode: "full_stop" | "read_only" | "module_stop"; blockedScopes: readonly string[]; reason: string; actor: PlatformActor; occurredAt: string; expectedVersion?: number }): Promise<void>;
  listEmergencyStops(): Promise<readonly Readonly<Record<string, unknown>>[]>;

  organizationConfiguration(id: OrganizationId): Promise<Readonly<Record<string, unknown>> | null>;
  createOrganizationOperation(input: OrganizationOperationDraft): Promise<{ id: string; status: string; duplicate: boolean }>;
  approveOrganizationOperation(input: { id: string; approverUserId: PlatformUserId; occurredAt: string }): Promise<boolean>;
  cancelOrganizationOperation(input: { id: string; actorUserId: PlatformUserId; occurredAt: string }): Promise<boolean>;
  listOrganizationOperations(organizationId?: OrganizationId): Promise<readonly Readonly<Record<string, unknown>>[]>;

  issueTenantAdminInvitation(input: { id: string; organizationId: OrganizationId; tenantInstanceId: TenantInstanceId; email: string; displayName: string; tokenHash: string; expiresAt: string; invitedByUserId: PlatformUserId; occurredAt: string }): Promise<void>;
  consumeTenantAdminInvitation(input: { tokenHash: string; occurredAt: string }): Promise<{ id: string; tenantInstanceId: TenantInstanceId; email: string } | null>;
  revokeTenantAdminInvitation(input: { id: string; occurredAt: string }): Promise<boolean>;
}
