import { createHash, randomBytes, randomUUID } from "node:crypto";
import type {
  MfaVerifier,
  PasswordVerifier,
  PlatformAdminRepository,
  PlatformAuthResult,
  PlatformListQuery,
  PlatformOrganizationDetail,
} from "../contracts/platform-admin-repository";
import {
  assertApprovalReason,
  assertOrganizationLifecycleTransition,
  assertPlatformPayloadSafe,
  assertPlatformPermission,
  resolveRolePermissions,
  type PlatformActor,
  type PlatformCommandDraft,
  type PlatformPermissionKey,
} from "../domain/platform-admin";
import type { OrganizationId } from "@tilbecore/contracts";
import type { TenantInstanceId } from "@tilbecore/contracts";
import type { OrganizationStatus } from "../domain/platform-domain";

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const LOCK_AFTER_FAILURES = 5;
const LOCK_MS = 15 * 60 * 1000;

export async function authenticatePlatformUser(
  repository: PlatformAdminRepository,
  passwordVerifier: PasswordVerifier,
  mfaVerifier: MfaVerifier,
  input: { email: string; password: string; mfaCode: string; requestId: string; userAgent?: string; occurredAt: string },
): Promise<PlatformAuthResult> {
  const email = input.email.trim().toLowerCase();
  const user = await repository.findAuthUserByEmail(email);
  const now = Date.parse(input.occurredAt);
  if (!user || user.status !== "active" || !user.passwordHash || (user.lockedUntil && Date.parse(user.lockedUntil) > now)) {
    await auditLogin(repository, user?.id, input, "denied", user?.lockedUntil ? "ACCOUNT_LOCKED" : "INVALID_CREDENTIALS");
    throw new Error(user?.lockedUntil ? "PLATFORM_ACCOUNT_LOCKED" : "PLATFORM_AUTH_INVALID");
  }

  const passwordValid = await passwordVerifier.verify(input.password, user.passwordHash);
  const mfaValid = passwordValid && (!user.mfaRequired || await mfaVerifier.verify(user.id, input.mfaCode, input.occurredAt));
  if (!passwordValid || !mfaValid) {
    const failedCount = user.failedLoginCount + 1;
    const lockedUntil = failedCount >= LOCK_AFTER_FAILURES ? new Date(now + LOCK_MS).toISOString() : undefined;
    await repository.markLoginFailure(user.id, failedCount, lockedUntil);
    await auditLogin(repository, user.id, input, "failure", passwordValid ? "MFA_INVALID" : "INVALID_CREDENTIALS");
    throw new Error("PLATFORM_AUTH_INVALID");
  }

  const permissions = resolveRolePermissions(user.roles);
  if (permissions.length === 0) throw new Error("PLATFORM_ROLE_INACTIVE");
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashPlatformSessionToken(token);
  const session = {
    id: randomUUID(),
    userId: user.id,
    tokenHash,
    status: "active",
    authVersion: user.authVersion,
    expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
  };
  await repository.createSession({ ...session, deviceId: randomUUID(), occurredAt: input.occurredAt, userAgent: input.userAgent });
  await repository.markLoginSuccess(user.id, input.occurredAt);
  await auditLogin(repository, user.id, input, "success", "LOGIN_SUCCEEDED");
  return { actor: { userId: user.id, permissions, sessionId: session.id }, token, session };
}

export async function resolvePlatformActor(
  repository: PlatformAdminRepository,
  token: string | undefined,
  permission?: PlatformPermissionKey,
  occurredAt = new Date().toISOString(),
): Promise<PlatformActor> {
  if (!token) throw new Error("PLATFORM_SESSION_REQUIRED");
  const session = await repository.findSessionByTokenHash(hashPlatformSessionToken(token));
  const user = session ? await repository.findAuthUserById(session.userId) : null;
  if (!session || !user || session.status !== "active" || Date.parse(session.expiresAt) <= Date.parse(occurredAt) || user.status !== "active" || user.authVersion !== session.authVersion || user.roles.some((role) => role.status !== "active")) {
    if (session) await repository.revokeSession(session.id, occurredAt);
    throw new Error("PLATFORM_SESSION_INVALID");
  }
  const actor = { userId: user.id, permissions: resolveRolePermissions(user.roles), sessionId: session.id };
  if (permission) assertPlatformPermission(actor, permission);
  return actor;
}

export async function rotatePlatformSession(
  repository: PlatformAdminRepository,
  token: string,
  occurredAt: string,
): Promise<{ token: string; expiresAt: string }> {
  const actor = await resolvePlatformActor(repository, token, undefined, occurredAt);
  const newToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.parse(occurredAt) + SESSION_TTL_MS).toISOString();
  const rotated = await repository.rotateSession(actor.sessionId, hashPlatformSessionToken(token), hashPlatformSessionToken(newToken), expiresAt, occurredAt);
  if (!rotated) throw new Error("PLATFORM_SESSION_ROTATION_CONFLICT");
  return { token: newToken, expiresAt };
}

export async function logoutPlatformUser(repository: PlatformAdminRepository, token: string | undefined, occurredAt: string): Promise<void> {
  if (!token) return;
  const session = await repository.findSessionByTokenHash(hashPlatformSessionToken(token));
  if (session) await repository.revokeSession(session.id, occurredAt);
}

export async function getPlatformDashboard(repository: PlatformAdminRepository, actor: PlatformActor, now: string) {
  assertPlatformPermission(actor, "platform.dashboard.read");
  return repository.dashboard(now);
}

export async function searchPlatformOrganizations(repository: PlatformAdminRepository, actor: PlatformActor, query: PlatformListQuery) {
  assertPlatformPermission(actor, "platform.organization.read");
  return repository.listOrganizations(query);
}

export async function getPlatformOrganization360(repository: PlatformAdminRepository, actor: PlatformActor, id: OrganizationId): Promise<PlatformOrganizationDetail> {
  assertPlatformPermission(actor, "platform.organization.read");
  const organization = await repository.organizationDetail(id);
  if (!organization) throw new Error("PLATFORM_ORGANIZATION_NOT_FOUND");
  return organization;
}

export async function queuePlatformCommand(repository: PlatformAdminRepository, actor: PlatformActor, command: Omit<PlatformCommandDraft, "requestedByUserId">) {
  const permission = command.type.startsWith("tenant.provision") ? "platform.provisioning.manage" : "platform.backup.manage";
  assertPlatformPermission(actor, permission);
  assertApprovalReason(command.approvalReason);
  assertPlatformPayloadSafe(command.payload);
  return repository.enqueueCommand({ ...command, requestedByUserId: actor.userId });
}

export async function queueTenantProvisioning(
  repository: PlatformAdminRepository,
  actor: PlatformActor,
  command: Omit<PlatformCommandDraft, "requestedByUserId" | "type"> & { payload: Readonly<Record<string, unknown>>; slug: string; domain: string; reservedSubdomains: readonly string[] },
) {
  assertPlatformPermission(actor, "platform.provisioning.manage");
  const slug = command.slug.trim().toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/.test(slug) || command.reservedSubdomains.includes(slug)) throw new Error("PROVISIONING_SLUG_INVALID");
  if (!command.organizationId || !command.tenantInstanceId) throw new Error("PROVISIONING_IDENTIFIERS_REQUIRED");
  if (!await repository.provisioningIdentifiersAvailable({ organizationId: command.organizationId, tenantInstanceId: command.tenantInstanceId, slug, domain: command.domain })) throw new Error("PROVISIONING_IDENTIFIER_CONFLICT");
  return queuePlatformCommand(repository, actor, {
    id: command.id,
    idempotencyKey: command.idempotencyKey,
    type: "tenant.provision",
    organizationId: command.organizationId,
    tenantInstanceId: command.tenantInstanceId,
    requestId: command.requestId,
    traceId: command.traceId,
    approvalReason: command.approvalReason,
    payload: command.payload,
    expectedVersion: command.expectedVersion,
  });
}

export async function changeOrganizationLifecycle(
  repository: PlatformAdminRepository,
  actor: PlatformActor,
  input: { organizationId: OrganizationId; fromStatus: OrganizationStatus; toStatus: OrganizationStatus; expectedVersion: number; reason: string; impactSummary: string; requestId: string },
): Promise<void> {
  assertPlatformPermission(actor, "platform.organization.lifecycle.manage");
  assertOrganizationLifecycleTransition(input.fromStatus, input.toStatus);
  assertApprovalReason(input.reason);
  if (input.impactSummary.trim().length < 8) throw new Error("PLATFORM_IMPACT_SUMMARY_INVALID");
  const updated = await repository.transitionOrganization({ ...input, approvedByUserId: actor.userId, eventId: randomUUID() });
  if (!updated) throw new Error("PLATFORM_OPTIMISTIC_CONCURRENCY_CONFLICT");
}

export async function openPlatformSupportSession(
  repository: PlatformAdminRepository,
  actor: PlatformActor,
  input: { id: string; organizationId: OrganizationId; tenantInstanceId: TenantInstanceId; approvedByUserId: string; reason: string; scopes: readonly string[]; startsAt: string; expiresAt: string },
): Promise<void> {
  assertPlatformPermission(actor, "platform.support.manage");
  assertApprovalReason(input.reason);
  if (input.scopes.length === 0 || input.scopes.some((scope) => !/^[a-z][a-z0-9_.:-]{2,80}$/.test(scope))) throw new Error("SUPPORT_SESSION_SCOPE_INVALID");
  const starts = Date.parse(input.startsAt); const expires = Date.parse(input.expiresAt);
  if (!Number.isFinite(starts) || !Number.isFinite(expires) || expires <= starts || expires - starts > 8 * 60 * 60 * 1000) throw new Error("SUPPORT_SESSION_TIME_RANGE_INVALID");
  await repository.createSupportSession({ ...input, platformUserId: actor.userId });
}

export async function endPlatformSupportSession(repository: PlatformAdminRepository, actor: PlatformActor, id: string, reason: string, occurredAt: string): Promise<void> {
  assertPlatformPermission(actor, "platform.support.manage"); assertApprovalReason(reason);
  if (!await repository.revokeSupportSession({ id, revokedByUserId: actor.userId, reason, occurredAt })) throw new Error("SUPPORT_SESSION_NOT_ACTIVE");
}

export async function registerPlatformCustomDomain(repository: PlatformAdminRepository, actor: PlatformActor, input: { id: string; tenantInstanceId: TenantInstanceId; hostname: string; isPrimary: boolean; reservedSubdomains: readonly string[] }): Promise<void> {
  assertPlatformPermission(actor, "platform.domain.manage");
  const hostname = input.hostname.trim().toLowerCase();
  if (!/^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(hostname)) throw new Error("PLATFORM_DOMAIN_INVALID");
  if (input.reservedSubdomains.includes(hostname.split(".")[0]!)) throw new Error("PLATFORM_DOMAIN_RESERVED");
  await repository.createCustomDomain({ id: input.id, tenantInstanceId: input.tenantInstanceId, hostname, isPrimary: input.isPrimary });
}

export async function schedulePlatformLicenseChange(repository: PlatformAdminRepository, actor: PlatformActor, input: { id: string; licenseId: string; targetPlanId: string; effectiveAt: string; reason: string; expectedVersion: number; now: string }): Promise<void> {
  assertPlatformPermission(actor, "platform.license.manage"); assertApprovalReason(input.reason);
  if (Date.parse(input.effectiveAt) <= Date.parse(input.now)) throw new Error("PLATFORM_LICENSE_CHANGE_FUTURE_REQUIRED");
  await repository.scheduleLicenseChange({ ...input, requestedByUserId: actor.userId });
}

export async function setPlatformUserStatus(repository: PlatformAdminRepository, actor: PlatformActor, userId: PlatformActor["userId"], status: "active" | "suspended", occurredAt: string): Promise<void> {
  assertPlatformPermission(actor, "platform.user.manage");
  if (actor.userId === userId && status === "suspended") throw new Error("PLATFORM_SELF_SUSPEND_FORBIDDEN");
  if (!await repository.updatePlatformUserStatus({ userId, status, occurredAt })) throw new Error("PLATFORM_USER_NOT_FOUND");
}

export async function setPlatformUserRoles(repository: PlatformAdminRepository, actor: PlatformActor, userId: PlatformActor["userId"], roleIds: readonly string[], occurredAt: string): Promise<void> {
  assertPlatformPermission(actor, "platform.user.manage");
  if (roleIds.length === 0 || new Set(roleIds).size !== roleIds.length) throw new Error("PLATFORM_ROLE_SELECTION_INVALID");
  if (!await repository.replacePlatformUserRoles({ userId, roleIds, occurredAt })) throw new Error("PLATFORM_USER_OR_ROLE_NOT_FOUND");
}

export function hashPlatformSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function auditLogin(
  repository: PlatformAdminRepository,
  actorUserId: PlatformAuthResult["actor"]["userId"] | undefined,
  input: { requestId: string; occurredAt: string },
  result: "success" | "failure" | "denied",
  code: string,
): Promise<void> {
  await repository.recordAudit({
    id: randomUUID(), actorUserId, action: "platform.auth.login", targetType: "PlatformUser",
    targetId: actorUserId, requestId: input.requestId, result, metadata: { code }, occurredAt: input.occurredAt,
  });
}
