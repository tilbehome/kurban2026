import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  AuthorizationError,
  assertAuthorizationAllowed,
  assertDelegationWindow,
  assertRecentReauthentication,
  assertRoleDefinition,
  evaluateAuthorization,
  isCriticalRole,
  parsePermissionContract,
  type AccessLevel,
  type AccessScopeRule,
  type AuthorizationContext,
  type AuthorizationEvaluation,
  type AuthorizationSubject,
  type EffectiveApprovalPolicy,
  type EffectivePermissionGrant,
  type IdentityKind,
  type PermissionKey,
  type ProtectedOrganizationRole,
  type RoleType,
} from "./authorization-domain";

export interface AuthorizationActor {
  subject: AuthorizationSubject;
  context: AuthorizationContext;
  lastReauthenticatedAt?: string;
}

export interface EffectiveAuthorizationData {
  subjectStatus: "active" | "inactive" | "suspended" | "expired" | "revoked";
  grants: readonly EffectivePermissionGrant[];
  approvalPolicies: readonly EffectiveApprovalPolicy[];
}

export interface AssignableRoleVersion {
  id: string;
  roleId: string;
  roleType: RoleType;
  protectedCode?: ProtectedOrganizationRole;
  status: string;
  permissions: readonly { key: PermissionKey; riskLevel: string }[];
}

export interface TenantAuthorizationRepository {
  loadEffectiveAuthorization(subject: AuthorizationSubject, occurredAt: string): Promise<EffectiveAuthorizationData>;
  recordAuthorizationAudit(input: {
    id: string;
    subject: AuthorizationSubject;
    permissionKey: PermissionKey;
    context: AuthorizationContext;
    evaluation: AuthorizationEvaluation;
  }): Promise<void>;
  findRoleVersion(id: string): Promise<AssignableRoleVersion | null>;
  findPermissions(keys: readonly PermissionKey[]): Promise<readonly { id: string; key: PermissionKey; riskLevel: string }[]>;
  findMembershipRole(id: string): Promise<{ protectedCode?: ProtectedOrganizationRole; targetMembershipId: string } | null>;
  assignRole(input: { id: string; membershipId: string; roleVersionId: string; accessScopeId?: string; validFrom: string; validUntil?: string; assignedByMembershipId: string; reason: string }): Promise<void>;
  revokeRole(input: { membershipRoleId: string; revokedByMembershipId: string; revokedAt: string; reason: string }): Promise<boolean>;
  createDelegation(input: { id: string; fromMembershipId: string; toMembershipId: string; permissionKey: PermissionKey; accessScopeId?: string; reason: string; validFrom: string; validUntil: string; approvedByMembershipId?: string }): Promise<void>;
  copyRoleTemplate(input: { id: string; sourceRoleId: string; name: string; functionalArea: string; accessLevel: AccessLevel; createdByMembershipId: string; reason: string }): Promise<{ roleId: string; roleVersionId: string }>;
  publishCustomRoleVersion(input: { roleVersionId: string; permissions: readonly { permissionKey: PermissionKey; effect: "ALLOW" | "DENY"; conditions?: Record<string, unknown> }[]; publishedByMembershipId: string; reason: string; publishedAt: string }): Promise<void>;
  createAccessScope(input: { id: string; name: string; facilityId?: string; departmentId?: string; operationalPeriodId?: string; assignedRecordType?: string; assignedRecordId?: string; additionalConstraints?: Record<string, unknown> }): Promise<void>;
  createConditionalPolicy(input: { id: string; name: string; roleVersionId?: string; membershipRoleId?: string; permissionKey?: PermissionKey; effect: "ALLOW" | "DENY"; priority: number; conditions: Record<string, unknown>; validFrom?: string; validUntil?: string }): Promise<void>;
  createApprovalPolicy(input: { id: string; name: string; permissionKey: PermissionKey; approverPermissionKey: PermissionKey; conditions: Record<string, unknown>; requiredApprovals: number; requireDistinctUser: boolean; requireReauthentication: boolean }): Promise<void>;
  createOrganizationMembership(input: { organizationUserId: string; membershipId: string; email?: string; displayName: string; validFrom: string; validUntil?: string }): Promise<void>;
  authorizationCatalog(): Promise<{ memberships: readonly Readonly<Record<string, unknown>>[]; roles: readonly Readonly<Record<string, unknown>>[]; permissions: readonly Readonly<Record<string, unknown>>[]; accessScopes: readonly Readonly<Record<string, unknown>>[] }>;
  createServiceAccount(input: { id: string; name: string; clientId: string; credentialHash: string; createdByMembershipId: string; validUntil?: string; grants: readonly { permissionKey: PermissionKey; permissionId: string; accessScopeId?: string; effect: "ALLOW" | "DENY"; validFrom: string; validUntil?: string }[] }): Promise<void>;
  createDeviceIdentity(input: { id: string; kind: string; displayName: string; credentialHash: string; facilityId?: string; validUntil?: string; grants: readonly { permissionId: string; accessScopeId?: string; effect: "ALLOW" | "DENY"; validFrom: string; validUntil?: string }[] }): Promise<void>;
  createExternalUser(input: { id: string; issuer: string; subject: string; email?: string; displayName?: string; validUntil?: string; grants: readonly { permissionId: string; accessScopeId?: string; effect: "ALLOW" | "DENY"; validFrom: string; validUntil?: string }[] }): Promise<void>;
  registerModule(input: ModuleAuthorizationManifest, actorMembershipId: string): Promise<void>;
  createApprovalRequest(input: { id: string; policyId: string; requestedByMembershipId: string; operationType: string; operationRef: string; payloadHash: string; reason: string; expiresAt: string }): Promise<void>;
  findApprovalRequest(id: string): Promise<{ id: string; policyId: string; requestedByMembershipId: string; approverPermissionKey: PermissionKey; status: string; expiresAt: string; requiredApprovals: number; requireDistinctUser: boolean; requireReauthentication: boolean } | null>;
  recordApprovalDecision(input: { id: string; approvalRequestId: string; decidedByMembershipId: string; decision: "approve" | "deny"; reason: string; reauthenticatedAt: string; decidedAt: string }): Promise<{ status: string; approvalCount: number }>;
}

export interface ModulePermissionDefinition {
  key: PermissionKey;
  description: string;
  riskLevel?: "normal" | "sensitive" | "critical";
}

export interface ModuleRoleTemplate {
  templateKey: string;
  name: string;
  description?: string;
  functionalArea: string;
  accessLevel: AccessLevel;
  permissions: readonly { key: PermissionKey; effect: "ALLOW" | "DENY"; conditions?: Record<string, unknown> }[];
}

export interface ModuleProtectedRoleDefinition {
  code: ProtectedOrganizationRole;
  name: string;
  description?: string;
  functionalArea: string;
  accessLevel: AccessLevel;
  permissions: readonly { key: PermissionKey; effect: "ALLOW" | "DENY"; conditions?: Record<string, unknown> }[];
}

export interface ModuleAuthorizationManifest {
  moduleId: string;
  version: string;
  displayName: string;
  permissions: readonly ModulePermissionDefinition[];
  defaultRoleTemplates: readonly ModuleRoleTemplate[];
  protectedRoles?: readonly ModuleProtectedRoleDefinition[];
}

export class TenantAuthorizationService {
  constructor(private readonly repository: TenantAuthorizationRepository) {}

  async authorize(actor: AuthorizationActor, requestedPermission: string): Promise<AuthorizationEvaluation> {
    const key = parsePermissionContract(requestedPermission).key;
    const data = await this.repository.loadEffectiveAuthorization(actor.subject, actor.context.occurredAt);
    const evaluation = data.subjectStatus === "active"
      ? evaluateAuthorization({ subject: actor.subject, permissionKey: key, context: actor.context, grants: data.grants, approvalPolicies: data.approvalPolicies })
      : { decision: "DENY" as const, permissionKey: key, reasonCodes: ["SUBJECT_NOT_ACTIVE"], matchedGrantIds: [], evaluatedPolicyIds: [] };
    await this.repository.recordAuthorizationAudit({ id: `authorization_audit_${randomUUID()}`, subject: actor.subject, permissionKey: key, context: actor.context, evaluation });
    return evaluation;
  }

  async require(actor: AuthorizationActor, requestedPermission: string): Promise<AuthorizationEvaluation> {
    const evaluation = await this.authorize(actor, requestedPermission);
    assertAuthorizationAllowed(evaluation);
    return evaluation;
  }

  async assignRole(actor: AuthorizationActor, input: { membershipId: string; roleVersionId: string; accessScopeId?: string; validFrom?: string; validUntil?: string; reason: string }): Promise<{ id: string }> {
    await this.require(forResource(actor, "organization_membership", input.membershipId), "identity.role.assign.organization");
    const actorMembershipId = requiredMembership(actor.subject);
    const role = await this.repository.findRoleVersion(input.roleVersionId);
    if (!role || role.status !== "published") throw new AuthorizationError("ROLE_VERSION_NOT_ASSIGNABLE");
    if (input.reason.trim().length < 8) throw new AuthorizationError("ROLE_ASSIGNMENT_REASON_REQUIRED");
    const validFrom = input.validFrom ?? actor.context.occurredAt;
    if (!Number.isFinite(Date.parse(validFrom)) || (input.validUntil && (!Number.isFinite(Date.parse(input.validUntil)) || Date.parse(input.validUntil) <= Date.parse(validFrom)))) throw new AuthorizationError("ROLE_ASSIGNMENT_WINDOW_INVALID");
    if (actorMembershipId === input.membershipId && isCriticalRole(role.protectedCode)) throw new AuthorizationError("SELF_CRITICAL_ROLE_ELEVATION_FORBIDDEN");
    if (role.protectedCode === "ORGANIZATION_OWNER" && input.validUntil) throw new AuthorizationError("ORGANIZATION_OWNER_CANNOT_EXPIRE");
    if (isCriticalRole(role.protectedCode) || role.permissions.some((permission) => permission.riskLevel === "critical")) {
      assertRecentReauthentication(actor.lastReauthenticatedAt, actor.context.occurredAt);
    }
    for (const permission of role.permissions) await this.require(actor, permission.key);
    const id = `membership_role_${randomUUID()}`;
    await this.repository.assignRole({ id, membershipId: input.membershipId, roleVersionId: input.roleVersionId, accessScopeId: input.accessScopeId, validFrom, validUntil: input.validUntil, assignedByMembershipId: actorMembershipId, reason: input.reason.trim() });
    return { id };
  }

  async revokeRole(actor: AuthorizationActor, input: { membershipRoleId: string; reason: string }): Promise<void> {
    if (input.reason.trim().length < 8) throw new AuthorizationError("ROLE_REVOCATION_REASON_REQUIRED");
    const actorMembershipId = requiredMembership(actor.subject);
    const preview = await this.repository.findMembershipRole(input.membershipRoleId);
    if (!preview) throw new AuthorizationError("MEMBERSHIP_ROLE_NOT_FOUND");
    await this.require(forResource(actor, "membership_role", input.membershipRoleId), "identity.role.revoke.organization");
    if (preview.protectedCode) {
      assertRecentReauthentication(actor.lastReauthenticatedAt, actor.context.occurredAt);
    }
    const revoked = await this.repository.revokeRole({ membershipRoleId: input.membershipRoleId, revokedByMembershipId: actorMembershipId, revokedAt: actor.context.occurredAt, reason: input.reason.trim() });
    if (!revoked) throw new AuthorizationError("MEMBERSHIP_ROLE_NOT_FOUND");
  }

  async delegatePermission(actor: AuthorizationActor, input: { toMembershipId: string; permissionKey: string; accessScopeId?: string; validFrom: string; validUntil: string; reason: string }): Promise<{ id: string }> {
    await this.require(forResource(actor, "organization_membership", input.toMembershipId), "identity.delegation.create.organization");
    const key = parsePermissionContract(input.permissionKey).key;
    await this.require(actor, key);
    assertDelegationWindow(input.validFrom, input.validUntil, input.reason);
    const id = `delegation_${randomUUID()}`;
    await this.repository.createDelegation({ id, fromMembershipId: requiredMembership(actor.subject), toMembershipId: input.toMembershipId, permissionKey: key, accessScopeId: input.accessScopeId, reason: input.reason.trim(), validFrom: input.validFrom, validUntil: input.validUntil });
    return { id };
  }

  async copyRoleTemplate(actor: AuthorizationActor, input: { sourceRoleId: string; name: string; functionalArea: string; accessLevel: AccessLevel; reason: string }) {
    await this.require(forResource(actor, "role_template", input.sourceRoleId), "identity.role.create.organization");
    assertRoleDefinition({ type: "CUSTOM", functionalArea: input.functionalArea, accessLevel: input.accessLevel });
    if (input.reason.trim().length < 8) throw new AuthorizationError("ROLE_CHANGE_REASON_REQUIRED");
    return this.repository.copyRoleTemplate({ id: `role_${randomUUID()}`, sourceRoleId: input.sourceRoleId, name: input.name.trim(), functionalArea: input.functionalArea, accessLevel: input.accessLevel, createdByMembershipId: requiredMembership(actor.subject), reason: input.reason.trim() });
  }

  async publishCustomRoleVersion(actor: AuthorizationActor, input: { roleVersionId: string; permissions: readonly { permissionKey: string; effect: "ALLOW" | "DENY"; conditions?: Record<string, unknown> }[]; reason: string }): Promise<void> {
    await this.require(forResource(actor, "role_version", input.roleVersionId), "identity.role.create.organization");
    if (input.reason.trim().length < 8 || input.permissions.length === 0) throw new AuthorizationError("ROLE_VERSION_CHANGE_INVALID");
    const grants = input.permissions.map((item) => ({ ...item, permissionKey: parsePermissionContract(item.permissionKey).key }));
    const registered = await this.repository.findPermissions(grants.map((item) => item.permissionKey));
    if (registered.length !== new Set(grants.map((item) => item.permissionKey)).size) throw new AuthorizationError("PERMISSION_NOT_REGISTERED");
    for (const permission of registered) await this.require(actor, permission.key);
    if (registered.some((permission) => permission.riskLevel === "critical")) assertRecentReauthentication(actor.lastReauthenticatedAt, actor.context.occurredAt);
    await this.repository.publishCustomRoleVersion({ roleVersionId: input.roleVersionId, permissions: grants, publishedByMembershipId: requiredMembership(actor.subject), reason: input.reason.trim(), publishedAt: actor.context.occurredAt });
  }

  async createAccessScope(actor: AuthorizationActor, input: { name: string; facilityId?: string; departmentId?: string; operationalPeriodId?: string; assignedRecordType?: string; assignedRecordId?: string; additionalConstraints?: Record<string, unknown> }) {
    await this.require(actor, "identity.role.create.organization");
    if (input.name.trim().length < 2 || (!input.facilityId && !input.departmentId && !input.operationalPeriodId && !input.assignedRecordType && !input.assignedRecordId && !input.additionalConstraints)) throw new AuthorizationError("ACCESS_SCOPE_INVALID");
    const id = `access_scope_${randomUUID()}`;
    await this.repository.createAccessScope({ id, ...input, name: input.name.trim() });
    return { id };
  }

  async createConditionalPolicy(actor: AuthorizationActor, input: { name: string; roleVersionId?: string; membershipRoleId?: string; permissionKey?: string; effect: "ALLOW" | "DENY"; priority?: number; conditions: Record<string, unknown>; validFrom?: string; validUntil?: string }) {
    await this.require(actor, "identity.role.create.organization");
    if (!!input.roleVersionId === !!input.membershipRoleId || input.name.trim().length < 2 || Object.keys(input.conditions).length === 0) throw new AuthorizationError("CONDITIONAL_POLICY_INVALID");
    const permissionKey = input.permissionKey ? parsePermissionContract(input.permissionKey).key : undefined;
    if (permissionKey) await this.require(actor, permissionKey);
    if (input.effect === "DENY" || permissionKey) assertRecentReauthentication(actor.lastReauthenticatedAt, actor.context.occurredAt);
    if (input.validFrom && input.validUntil && Date.parse(input.validUntil) <= Date.parse(input.validFrom)) throw new AuthorizationError("CONDITIONAL_POLICY_WINDOW_INVALID");
    const id = `conditional_policy_${randomUUID()}`;
    await this.repository.createConditionalPolicy({ id, name: input.name.trim(), roleVersionId: input.roleVersionId, membershipRoleId: input.membershipRoleId, permissionKey, effect: input.effect, priority: input.priority ?? 0, conditions: input.conditions, validFrom: input.validFrom, validUntil: input.validUntil });
    return { id };
  }

  async createApprovalPolicy(actor: AuthorizationActor, input: { name: string; permissionKey: string; approverPermissionKey: string; conditions?: Record<string, unknown>; requiredApprovals?: number; requireDistinctUser?: boolean; requireReauthentication?: boolean }) {
    await this.require(actor, "identity.role.create.organization");
    const permissionKey = parsePermissionContract(input.permissionKey).key;
    const approverPermissionKey = parsePermissionContract(input.approverPermissionKey).key;
    await this.require(actor, permissionKey);
    await this.require(actor, approverPermissionKey);
    assertRecentReauthentication(actor.lastReauthenticatedAt, actor.context.occurredAt);
    const requiredApprovals = input.requiredApprovals ?? 1;
    if (input.name.trim().length < 2 || !Number.isInteger(requiredApprovals) || requiredApprovals < 1 || requiredApprovals > 10) throw new AuthorizationError("APPROVAL_POLICY_INVALID");
    const id = `approval_policy_${randomUUID()}`;
    await this.repository.createApprovalPolicy({ id, name: input.name.trim(), permissionKey, approverPermissionKey, conditions: input.conditions ?? {}, requiredApprovals, requireDistinctUser: input.requireDistinctUser ?? true, requireReauthentication: input.requireReauthentication ?? true });
    return { id };
  }

  async createOrganizationMembership(actor: AuthorizationActor, input: { email?: string; displayName: string; validFrom?: string; validUntil?: string; reason: string }) {
    await this.require(actor, "identity.role.assign.organization");
    const validFrom = input.validFrom ?? actor.context.occurredAt;
    if (input.displayName.trim().length < 2 || input.reason.trim().length < 8 || !Number.isFinite(Date.parse(validFrom)) || (input.validUntil && Date.parse(input.validUntil) <= Date.parse(validFrom))) throw new AuthorizationError("ORGANIZATION_MEMBERSHIP_INVALID");
    const organizationUserId = `organization_user_${randomUUID()}`; const membershipId = `organization_membership_${randomUUID()}`;
    await this.repository.createOrganizationMembership({ organizationUserId, membershipId, email: input.email?.trim().toLowerCase(), displayName: input.displayName.trim(), validFrom, validUntil: input.validUntil });
    return { organizationUserId, membershipId };
  }

  async authorizationCatalog(actor: AuthorizationActor) {
    await this.require(actor, "identity.role.create.organization");
    return this.repository.authorizationCatalog();
  }

  async createServiceAccount(actor: AuthorizationActor, input: { name: string; validUntil?: string; grants: readonly IdentityGrantInput[] }) {
    await this.require(actor, "identity.service-account.manage.organization");
    assertRecentReauthentication(actor.lastReauthenticatedAt, actor.context.occurredAt);
    if (input.name.trim().length < 2) throw new AuthorizationError("SERVICE_ACCOUNT_INVALID");
    assertFutureValidity(input.validUntil, actor.context.occurredAt);
    const grants = await this.validatedIdentityGrants(actor, input.grants);
    const id = `service_account_${randomUUID()}`; const clientId = `svc_${randomUUID()}`; const credential = randomBytes(32).toString("base64url");
    await this.repository.createServiceAccount({ id, name: input.name.trim(), clientId, credentialHash: secretHash(credential), createdByMembershipId: requiredMembership(actor.subject), validUntil: input.validUntil, grants });
    return { id, clientId, credential };
  }

  async createDeviceIdentity(actor: AuthorizationActor, input: { kind: string; displayName: string; facilityId?: string; validUntil?: string; grants: readonly IdentityGrantInput[] }) {
    await this.require(actor, "identity.device.manage.organization");
    assertRecentReauthentication(actor.lastReauthenticatedAt, actor.context.occurredAt);
    if (!/^[a-z][a-z0-9_-]{1,62}$/.test(input.kind) || input.displayName.trim().length < 2) throw new AuthorizationError("DEVICE_IDENTITY_INVALID");
    assertFutureValidity(input.validUntil, actor.context.occurredAt);
    const grants = await this.validatedIdentityGrants(actor, input.grants);
    const id = `device_identity_${randomUUID()}`; const credential = randomBytes(32).toString("base64url");
    await this.repository.createDeviceIdentity({ id, kind: input.kind, displayName: input.displayName.trim(), credentialHash: secretHash(credential), facilityId: input.facilityId, validUntil: input.validUntil, grants });
    return { id, credential };
  }

  async createExternalUser(actor: AuthorizationActor, input: { issuer: string; subject: string; email?: string; displayName?: string; validUntil?: string; grants: readonly IdentityGrantInput[] }) {
    await this.require(actor, "identity.external-user.manage.organization");
    assertRecentReauthentication(actor.lastReauthenticatedAt, actor.context.occurredAt);
    if (input.issuer.trim().length < 3 || input.subject.trim().length < 2) throw new AuthorizationError("EXTERNAL_USER_INVALID");
    assertFutureValidity(input.validUntil, actor.context.occurredAt);
    const grants = await this.validatedIdentityGrants(actor, input.grants);
    const id = `external_user_${randomUUID()}`;
    await this.repository.createExternalUser({ id, issuer: input.issuer.trim(), subject: input.subject.trim(), email: input.email?.trim().toLowerCase(), displayName: input.displayName?.trim(), validUntil: input.validUntil, grants });
    return { id };
  }

  private async validatedIdentityGrants(actor: AuthorizationActor, inputs: readonly IdentityGrantInput[]) {
    if (inputs.length === 0 || inputs.length > 250) throw new AuthorizationError("IDENTITY_GRANTS_INVALID");
    const normalized = inputs.map((item) => ({ ...item, permissionKey: parsePermissionContract(item.permissionKey).key, validFrom: item.validFrom ?? actor.context.occurredAt }));
    const registered = await this.repository.findPermissions(normalized.map((item) => item.permissionKey));
    const byKey = new Map(registered.map((item) => [item.key, item]));
    if (byKey.size !== new Set(normalized.map((item) => item.permissionKey)).size) throw new AuthorizationError("PERMISSION_NOT_REGISTERED");
    for (const item of normalized) {
      await this.require(actor, item.permissionKey);
      if (!Number.isFinite(Date.parse(item.validFrom)) || (item.validUntil && Date.parse(item.validUntil) <= Date.parse(item.validFrom))) throw new AuthorizationError("IDENTITY_GRANT_WINDOW_INVALID");
    }
    return normalized.map((item) => ({ ...item, permissionId: byKey.get(item.permissionKey)!.id }));
  }

  async registerModule(actor: AuthorizationActor, manifest: ModuleAuthorizationManifest): Promise<void> {
    await this.require(actor, "identity.module.register.organization");
    validateManifest(manifest);
    assertRecentReauthentication(actor.lastReauthenticatedAt, actor.context.occurredAt);
    await this.repository.registerModule(manifest, requiredMembership(actor.subject));
  }

  async requestApproval(actor: AuthorizationActor, input: { evaluation: AuthorizationEvaluation; operationType: string; operationRef: string; payloadHash: string; reason: string; expiresAt: string }): Promise<{ id: string }> {
    if (input.evaluation.decision !== "APPROVAL_REQUIRED" || !input.evaluation.requiredApprovalPolicyId) throw new AuthorizationError("APPROVAL_POLICY_NOT_REQUIRED");
    if (input.reason.trim().length < 8 || Date.parse(input.expiresAt) <= Date.parse(actor.context.occurredAt)) throw new AuthorizationError("APPROVAL_REQUEST_INVALID");
    const id = `approval_request_${randomUUID()}`;
    await this.repository.createApprovalRequest({ id, policyId: input.evaluation.requiredApprovalPolicyId, requestedByMembershipId: requiredMembership(actor.subject), operationType: input.operationType, operationRef: input.operationRef, payloadHash: input.payloadHash, reason: input.reason.trim(), expiresAt: input.expiresAt });
    return { id };
  }

  async decideApproval(actor: AuthorizationActor, input: { approvalRequestId: string; decision: "approve" | "deny"; reason: string }): Promise<{ status: string; approvalCount: number }> {
    const request = await this.repository.findApprovalRequest(input.approvalRequestId);
    if (!request || request.status !== "pending" || Date.parse(request.expiresAt) <= Date.parse(actor.context.occurredAt)) throw new AuthorizationError("APPROVAL_REQUEST_NOT_ACTIVE");
    await this.require(actor, request.approverPermissionKey);
    const actorMembershipId = requiredMembership(actor.subject);
    if (request.requireDistinctUser && actorMembershipId === request.requestedByMembershipId) throw new AuthorizationError("SELF_APPROVAL_FORBIDDEN");
    if (request.requireReauthentication) assertRecentReauthentication(actor.lastReauthenticatedAt, actor.context.occurredAt);
    if (input.reason.trim().length < 8) throw new AuthorizationError("APPROVAL_DECISION_REASON_REQUIRED");
    return this.repository.recordApprovalDecision({ id: `approval_decision_${randomUUID()}`, approvalRequestId: request.id, decidedByMembershipId: actorMembershipId, decision: input.decision, reason: input.reason.trim(), reauthenticatedAt: actor.lastReauthenticatedAt ?? actor.context.occurredAt, decidedAt: actor.context.occurredAt });
  }
}

export interface MasterDataAuthorizationPort {
  require(input: { subject: AuthorizationSubject; context: AuthorizationContext; lastReauthenticatedAt?: string }, permissionKey: PermissionKey): Promise<AuthorizationEvaluation>;
}

interface IdentityGrantInput { permissionKey: string; accessScopeId?: string; effect: "ALLOW" | "DENY"; validFrom?: string; validUntil?: string }

function secretHash(value: string): string { return createHash("sha256").update(value).digest("hex"); }
function assertFutureValidity(validUntil: string | undefined, now: string): void { if (validUntil && (!Number.isFinite(Date.parse(validUntil)) || Date.parse(validUntil) <= Date.parse(now))) throw new AuthorizationError("IDENTITY_VALIDITY_INVALID"); }

function requiredMembership(subject: AuthorizationSubject): string {
  if (subject.kind !== "ORGANIZATION_USER" || !subject.organizationMembershipId) throw new AuthorizationError("ORGANIZATION_MEMBERSHIP_REQUIRED");
  return subject.organizationMembershipId;
}

function forResource(actor: AuthorizationActor, type: string, id: string): AuthorizationActor {
  return { ...actor, context: { ...actor.context, assignedRecord: { type, id } } };
}

function validateManifest(manifest: ModuleAuthorizationManifest): void {
  if (!/^[a-z][a-z0-9_-]{1,62}$/.test(manifest.moduleId) || !/^\d+\.\d+\.\d+$/.test(manifest.version)) throw new AuthorizationError("MODULE_AUTHORIZATION_MANIFEST_INVALID");
  const keys = new Set<string>();
  for (const definition of manifest.permissions) {
    const contract = parsePermissionContract(definition.key);
    if (contract.module !== manifest.moduleId || keys.has(definition.key)) throw new AuthorizationError("MODULE_PERMISSION_INVALID");
    keys.add(definition.key);
  }
  for (const template of manifest.defaultRoleTemplates) {
    assertRoleDefinition({ type: "SYSTEM_TEMPLATE", functionalArea: template.functionalArea, accessLevel: template.accessLevel });
    if (template.permissions.some((permission) => !keys.has(permission.key))) throw new AuthorizationError("ROLE_TEMPLATE_PERMISSION_NOT_REGISTERED");
  }
  for (const role of manifest.protectedRoles ?? []) {
    assertRoleDefinition({ type: "SYSTEM_PROTECTED", protectedCode: role.code, functionalArea: role.functionalArea, accessLevel: role.accessLevel });
    if (role.permissions.some((permission) => !keys.has(permission.key))) throw new AuthorizationError("PROTECTED_ROLE_PERMISSION_NOT_REGISTERED");
  }
}
