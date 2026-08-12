import { createHash } from "node:crypto";
import type {
  AccessScopeRule,
  AuthorizationConditions,
  AuthorizationContext,
  AuthorizationEvaluation,
  AuthorizationSubject,
  EffectiveApprovalPolicy,
  EffectivePermissionGrant,
  ModuleAuthorizationManifest,
  PermissionKey,
  ProtectedOrganizationRole,
  TenantAuthorizationRepository,
} from "@tilbecore/tenant-core";
import { AuthorizationError, parsePermissionContract } from "@tilbecore/tenant-core";
import type { Prisma, PrismaClient } from "../../generated/client";

type Tx = Prisma.TransactionClient;

export class PrismaTenantAuthorizationRepository implements TenantAuthorizationRepository {
  constructor(private readonly db: PrismaClient) {}

  async loadEffectiveAuthorization(subject: AuthorizationSubject, occurredAt: string) {
    if (subject.kind === "ORGANIZATION_USER") return this.loadOrganizationAuthorization(subject, occurredAt);
    if (subject.kind === "SERVICE_ACCOUNT") return this.loadServiceAccountAuthorization(subject, occurredAt);
    if (subject.kind === "DEVICE_IDENTITY") return this.loadDeviceAuthorization(subject, occurredAt);
    if (subject.kind === "EXTERNAL_USER") return this.loadExternalAuthorization(subject, occurredAt);
    return { subjectStatus: "active" as const, grants: [], approvalPolicies: [] };
  }

  async recordAuthorizationAudit(input: { id: string; subject: AuthorizationSubject; permissionKey: PermissionKey; context: AuthorizationContext; evaluation: AuthorizationEvaluation }) {
    await this.db.authorizationAudit.create({ data: {
      id: input.id,
      identityKind: input.subject.kind,
      subjectId: input.subject.id,
      organizationMembershipId: input.subject.organizationMembershipId,
      sessionId: input.subject.sessionId,
      permissionKey: input.permissionKey,
      resourceType: input.context.assignedRecord?.type,
      resourceId: input.context.assignedRecord?.id,
      decision: input.evaluation.decision,
      reasonCodes: [...input.evaluation.reasonCodes],
      evaluatedPolicies: [...input.evaluation.evaluatedPolicyIds],
      contextSnapshot: input.context as unknown as Prisma.InputJsonValue,
      requestId: input.context.requestId,
      traceId: input.context.traceId,
      occurredAt: new Date(input.context.occurredAt),
    } });
  }

  async findRoleVersion(id: string) {
    const row = await this.db.roleVersion.findUnique({
      where: { id },
      include: { role: true, permissions: { include: { permission: true } } },
    });
    if (!row || !row.role.active) return null;
    return {
      id: row.id,
      roleId: row.roleId,
      roleType: row.role.type as "SYSTEM_PROTECTED" | "SYSTEM_TEMPLATE" | "CUSTOM",
      protectedCode: row.role.protectedCode as ProtectedOrganizationRole | undefined,
      status: row.status,
      permissions: row.permissions.filter((item) => item.effect === "ALLOW").map((item) => ({ key: item.permission.key as PermissionKey, riskLevel: item.permission.riskLevel })),
    };
  }

  async findPermissions(keys: readonly PermissionKey[]) {
    const rows = await this.db.permission.findMany({ where: { key: { in: [...keys] }, active: true } });
    return rows.map((row) => ({ id: row.id, key: row.key as PermissionKey, riskLevel: row.riskLevel }));
  }

  async findMembershipRole(id: string) {
    const row = await this.db.membershipRole.findFirst({
      where: { id, revokedAt: null },
      include: { roleVersion: { include: { role: true } } },
    });
    return row ? { protectedCode: row.roleVersion.role.protectedCode as ProtectedOrganizationRole | undefined, targetMembershipId: row.membershipId } : null;
  }

  async assignRole(input: { id: string; membershipId: string; roleVersionId: string; accessScopeId?: string; validFrom: string; validUntil?: string; assignedByMembershipId: string; reason: string }) {
    const membership = await this.db.organizationMembership.findFirst({ where: { id: input.membershipId, status: "active" }, select: { id: true } });
    if (!membership) throw new AuthorizationError("TARGET_MEMBERSHIP_NOT_ACTIVE");
    await this.db.membershipRole.create({ data: {
      id: input.id,
      membershipId: input.membershipId,
      roleVersionId: input.roleVersionId,
      accessScopeId: input.accessScopeId,
      validFrom: new Date(input.validFrom),
      validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
      assignedByMembershipId: input.assignedByMembershipId,
      assignmentReason: input.reason,
    } });
  }

  async revokeRole(input: { membershipRoleId: string; revokedByMembershipId: string; revokedAt: string; reason: string }): Promise<boolean> {
    return this.db.$transaction(async (tx) => {
      const target = await tx.membershipRole.findFirst({
        where: { id: input.membershipRoleId, revokedAt: null },
        include: { roleVersion: { include: { role: true } } },
      });
      if (!target) return false;
      if (target.roleVersion.role.protectedCode === "ORGANIZATION_OWNER") {
        const activeOwners = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT mr."id"
          FROM "MembershipRole" mr
          JOIN "RoleVersion" rv ON rv."id" = mr."roleVersionId"
          JOIN "Role" r ON r."id" = rv."roleId"
          JOIN "OrganizationMembership" om ON om."id" = mr."membershipId"
          WHERE r."protectedCode" = 'ORGANIZATION_OWNER'
            AND mr."revokedAt" IS NULL
            AND mr."validFrom" <= ${new Date(input.revokedAt)}
            AND (mr."validUntil" IS NULL OR mr."validUntil" > ${new Date(input.revokedAt)})
            AND om."status" = 'active'
          FOR UPDATE OF mr
        `;
        if (activeOwners.length <= 1) throw new AuthorizationError("LAST_ORGANIZATION_OWNER_CANNOT_BE_REMOVED");
      }
      const result = await tx.membershipRole.updateMany({
        where: { id: input.membershipRoleId, revokedAt: null },
        data: { revokedAt: new Date(input.revokedAt), revokedByMembershipId: input.revokedByMembershipId, assignmentReason: `${target.assignmentReason}\nREVOKE: ${input.reason}` },
      });
      return result.count === 1;
    }, { isolationLevel: "Serializable" });
  }

  async createDelegation(input: { id: string; fromMembershipId: string; toMembershipId: string; permissionKey: PermissionKey; accessScopeId?: string; reason: string; validFrom: string; validUntil: string; approvedByMembershipId?: string }) {
    const [permission, target] = await Promise.all([
      this.db.permission.findUnique({ where: { key: input.permissionKey }, select: { id: true, active: true } }),
      this.db.organizationMembership.findFirst({ where: { id: input.toMembershipId, status: "active" }, select: { id: true } }),
    ]);
    if (!permission?.active) throw new AuthorizationError("PERMISSION_NOT_REGISTERED");
    if (!target || input.fromMembershipId === input.toMembershipId) throw new AuthorizationError("DELEGATION_TARGET_INVALID");
    await this.db.delegation.create({ data: {
      id: input.id, fromMembershipId: input.fromMembershipId, toMembershipId: input.toMembershipId,
      permissionId: permission.id, accessScopeId: input.accessScopeId, reason: input.reason,
      validFrom: new Date(input.validFrom), validUntil: new Date(input.validUntil), approvedByMembershipId: input.approvedByMembershipId,
    } });
  }

  async copyRoleTemplate(input: { id: string; sourceRoleId: string; name: string; functionalArea: string; accessLevel: string; createdByMembershipId: string; reason: string }) {
    return this.db.$transaction(async (tx) => {
      const source = await tx.role.findFirst({
        where: { id: input.sourceRoleId, type: "SYSTEM_TEMPLATE", active: true },
        include: { versions: { where: { status: "published" }, orderBy: { version: "desc" }, take: 1, include: { permissions: true, conditionalPolicies: true } } },
      });
      const version = source?.versions[0];
      if (!source || !version) throw new AuthorizationError("ROLE_TEMPLATE_NOT_FOUND");
      const roleVersionId = `${input.id}_v1`;
      await tx.role.create({ data: {
        id: input.id, name: input.name, description: source.description, type: "CUSTOM", functionalArea: input.functionalArea,
        accessLevel: input.accessLevel, sourceRoleId: source.id,
        versions: { create: {
          id: roleVersionId, version: 1, status: "draft", changeReason: input.reason, createdByMembershipId: input.createdByMembershipId,
          permissions: { create: version.permissions.map((grant) => ({ permissionId: grant.permissionId, effect: grant.effect, constraints: grant.constraints ?? undefined })) },
          conditionalPolicies: { create: version.conditionalPolicies.map((policy) => ({ id: stableId("conditional_policy_copy", `${input.id}:${policy.id}`), name: policy.name, permissionId: policy.permissionId, effect: policy.effect, priority: policy.priority, conditions: policy.conditions, active: policy.active, validFrom: policy.validFrom, validUntil: policy.validUntil })) },
        } },
      } });
      return { roleId: input.id, roleVersionId };
    });
  }

  async publishCustomRoleVersion(input: { roleVersionId: string; permissions: readonly { permissionKey: PermissionKey; effect: "ALLOW" | "DENY"; conditions?: Record<string, unknown> }[]; publishedByMembershipId: string; reason: string; publishedAt: string }) {
    await this.db.$transaction(async (tx) => {
      const version = await tx.roleVersion.findUnique({ where: { id: input.roleVersionId }, include: { role: true } });
      if (!version || version.role.type !== "CUSTOM" || version.status !== "draft") throw new AuthorizationError("CUSTOM_ROLE_DRAFT_NOT_FOUND");
      const permissions = await tx.permission.findMany({ where: { key: { in: input.permissions.map((item) => item.permissionKey) }, active: true } });
      const byKey = new Map(permissions.map((item) => [item.key, item.id]));
      if (byKey.size !== new Set(input.permissions.map((item) => item.permissionKey)).size) throw new AuthorizationError("PERMISSION_NOT_REGISTERED");
      await tx.rolePermission.deleteMany({ where: { roleVersionId: version.id } });
      await tx.rolePermission.createMany({ data: input.permissions.map((item) => ({ roleVersionId: version.id, permissionId: byKey.get(item.permissionKey)!, effect: item.effect, constraints: item.conditions as Prisma.InputJsonValue | undefined })) });
      await tx.roleVersion.update({ where: { id: version.id }, data: { status: "published", changeReason: input.reason, publishedAt: new Date(input.publishedAt) } });
    }, { isolationLevel: "Serializable" });
  }

  async createAccessScope(input: { id: string; name: string; facilityId?: string; departmentId?: string; operationalPeriodId?: string; assignedRecordType?: string; assignedRecordId?: string; additionalConstraints?: Record<string, unknown> }) {
    await this.db.accessScope.create({ data: { ...input, additionalConstraints: input.additionalConstraints as Prisma.InputJsonValue | undefined } });
  }

  async createConditionalPolicy(input: { id: string; name: string; roleVersionId?: string; membershipRoleId?: string; permissionKey?: PermissionKey; effect: "ALLOW" | "DENY"; priority: number; conditions: Record<string, unknown>; validFrom?: string; validUntil?: string }) {
    const permission = input.permissionKey ? await this.db.permission.findUnique({ where: { key: input.permissionKey }, select: { id: true, active: true } }) : undefined;
    if (input.permissionKey && !permission?.active) throw new AuthorizationError("PERMISSION_NOT_REGISTERED");
    await this.db.conditionalPolicy.create({ data: { id: input.id, name: input.name, roleVersionId: input.roleVersionId, membershipRoleId: input.membershipRoleId, permissionId: permission?.id, effect: input.effect, priority: input.priority, conditions: input.conditions as Prisma.InputJsonValue, validFrom: input.validFrom ? new Date(input.validFrom) : undefined, validUntil: input.validUntil ? new Date(input.validUntil) : undefined } });
  }

  async createApprovalPolicy(input: { id: string; name: string; permissionKey: PermissionKey; approverPermissionKey: PermissionKey; conditions: Record<string, unknown>; requiredApprovals: number; requireDistinctUser: boolean; requireReauthentication: boolean }) {
    const permissions = await this.db.permission.findMany({ where: { key: { in: [input.permissionKey, input.approverPermissionKey] }, active: true } });
    const byKey = new Map(permissions.map((item) => [item.key, item.id]));
    const permissionId = byKey.get(input.permissionKey); const approverPermissionId = byKey.get(input.approverPermissionKey);
    if (!permissionId || !approverPermissionId) throw new AuthorizationError("PERMISSION_NOT_REGISTERED");
    await this.db.approvalPolicy.create({ data: { id: input.id, name: input.name, permissionId, approverPermissionId, conditions: input.conditions as Prisma.InputJsonValue, requiredApprovals: input.requiredApprovals, requireDistinctUser: input.requireDistinctUser, requireReauthentication: input.requireReauthentication } });
  }

  async createOrganizationMembership(input: { organizationUserId: string; membershipId: string; email?: string; displayName: string; validFrom: string; validUntil?: string }) {
    await this.db.$transaction(async (tx) => {
      const existing = input.email ? await tx.organizationUser.findUnique({ where: { email: input.email }, include: { memberships: { where: { status: "active" }, take: 1 } } }) : null;
      if (existing?.memberships[0]) throw new AuthorizationError("ORGANIZATION_MEMBERSHIP_ALREADY_ACTIVE");
      const user = existing ?? await tx.organizationUser.create({ data: { id: input.organizationUserId, email: input.email, displayName: input.displayName } });
      if (existing && existing.status !== "active") await tx.organizationUser.update({ where: { id: existing.id }, data: { status: "active", displayName: input.displayName } });
      await tx.organizationMembership.create({ data: { id: input.membershipId, organizationUserId: user.id, validFrom: new Date(input.validFrom), validUntil: input.validUntil ? new Date(input.validUntil) : undefined } });
    }, { isolationLevel: "Serializable" });
  }

  async authorizationCatalog() {
    const [memberships, roles, permissions, accessScopes] = await Promise.all([
      this.db.organizationMembership.findMany({ where: { status: "active" }, include: { organizationUser: { select: { id: true, displayName: true, email: true, status: true } }, roleAssignments: { where: { revokedAt: null }, include: { roleVersion: { include: { role: true } }, accessScope: true } } }, orderBy: { createdAt: "asc" } }),
      this.db.role.findMany({ where: { active: true }, include: { versions: { orderBy: { version: "desc" }, take: 1, include: { permissions: { include: { permission: true } }, conditionalPolicies: true } } }, orderBy: [{ type: "asc" }, { name: "asc" }] }),
      this.db.permission.findMany({ where: { active: true }, orderBy: { key: "asc" } }),
      this.db.accessScope.findMany({ orderBy: { name: "asc" } }),
    ]);
    return {
      memberships: memberships.map((item) => ({ id: item.id, status: item.status, validFrom: item.validFrom.toISOString(), validUntil: item.validUntil?.toISOString(), user: item.organizationUser, roles: item.roleAssignments.map((assignment) => ({ id: assignment.id, roleVersionId: assignment.roleVersionId, roleId: assignment.roleVersion.role.id, roleName: assignment.roleVersion.role.name, protectedCode: assignment.roleVersion.role.protectedCode, accessScopeId: assignment.accessScopeId, validUntil: assignment.validUntil?.toISOString() })) })),
      roles: roles.map((item) => ({ id: item.id, name: item.name, description: item.description, type: item.type, protectedCode: item.protectedCode, functionalArea: item.functionalArea, accessLevel: item.accessLevel, sourceRoleId: item.sourceRoleId, latestVersion: item.versions[0] ? { id: item.versions[0].id, version: item.versions[0].version, status: item.versions[0].status, permissions: item.versions[0].permissions.map((grant) => ({ key: grant.permission.key, effect: grant.effect, conditions: grant.constraints })), conditionalPolicies: item.versions[0].conditionalPolicies.map((policy) => ({ id: policy.id, name: policy.name, permissionId: policy.permissionId, effect: policy.effect, priority: policy.priority, conditions: policy.conditions })) } : null })),
      permissions: permissions.map((item) => ({ id: item.id, key: item.key, description: item.description, riskLevel: item.riskLevel })),
      accessScopes: accessScopes.map((item) => ({ id: item.id, name: item.name, facilityId: item.facilityId, departmentId: item.departmentId, operationalPeriodId: item.operationalPeriodId, assignedRecordType: item.assignedRecordType, assignedRecordId: item.assignedRecordId })),
    };
  }

  async createServiceAccount(input: { id: string; name: string; clientId: string; credentialHash: string; createdByMembershipId: string; validUntil?: string; grants: readonly { permissionKey: PermissionKey; permissionId: string; accessScopeId?: string; effect: "ALLOW" | "DENY"; validFrom: string; validUntil?: string }[] }) {
    await this.db.serviceAccount.create({ data: { id: input.id, name: input.name, clientId: input.clientId, credentialHash: input.credentialHash, createdByMembershipId: input.createdByMembershipId, validUntil: input.validUntil ? new Date(input.validUntil) : undefined, permissions: { create: input.grants.map((grant) => ({ permissionId: grant.permissionId, accessScopeId: grant.accessScopeId, effect: grant.effect, validFrom: new Date(grant.validFrom), validUntil: grant.validUntil ? new Date(grant.validUntil) : undefined })) } } });
  }

  async createDeviceIdentity(input: { id: string; kind: string; displayName: string; credentialHash: string; facilityId?: string; validUntil?: string; grants: readonly { permissionId: string; accessScopeId?: string; effect: "ALLOW" | "DENY"; validFrom: string; validUntil?: string }[] }) {
    await this.db.deviceIdentity.create({ data: { id: input.id, kind: input.kind, displayName: input.displayName, credentialHash: input.credentialHash, facilityId: input.facilityId, validUntil: input.validUntil ? new Date(input.validUntil) : undefined, permissions: { create: input.grants.map((grant) => ({ permissionId: grant.permissionId, accessScopeId: grant.accessScopeId, effect: grant.effect, validFrom: new Date(grant.validFrom), validUntil: grant.validUntil ? new Date(grant.validUntil) : undefined })) } } });
  }

  async createExternalUser(input: { id: string; issuer: string; subject: string; email?: string; displayName?: string; validUntil?: string; grants: readonly { permissionId: string; accessScopeId?: string; effect: "ALLOW" | "DENY"; validFrom: string; validUntil?: string }[] }) {
    await this.db.externalUser.create({ data: { id: input.id, issuer: input.issuer, subject: input.subject, email: input.email, displayName: input.displayName, validUntil: input.validUntil ? new Date(input.validUntil) : undefined, permissions: { create: input.grants.map((grant) => ({ permissionId: grant.permissionId, accessScopeId: grant.accessScopeId, effect: grant.effect, validFrom: new Date(grant.validFrom), validUntil: grant.validUntil ? new Date(grant.validUntil) : undefined })) } } });
  }

  async registerModule(manifest: ModuleAuthorizationManifest, actorMembershipId: string): Promise<void> {
    await this.db.$transaction(async (tx) => {
      await this.registerModuleTx(tx, manifest, actorMembershipId);
    }, { isolationLevel: "Serializable" });
  }

  async bootstrapFirstOrganizationOwner(input: { organizationUserId: string; membershipId: string; membershipRoleId: string; legacyUserId?: string; email?: string; displayName: string }, identityManifest: ModuleAuthorizationManifest): Promise<boolean> {
    return this.db.$transaction(async (tx) => {
      if (await tx.organizationMembership.count() > 0) return false;
      await tx.organizationUser.create({ data: { id: input.organizationUserId, legacyUserId: input.legacyUserId, email: input.email, displayName: input.displayName, memberships: { create: { id: input.membershipId } } } });
      await this.registerModuleTx(tx, identityManifest, input.membershipId);
      const owner = await tx.role.findUnique({ where: { protectedCode: "ORGANIZATION_OWNER" }, include: { versions: { where: { status: "published" }, orderBy: { version: "desc" }, take: 1 } } });
      if (!owner?.versions[0]) throw new AuthorizationError("ORGANIZATION_OWNER_ROLE_NOT_REGISTERED");
      await tx.membershipRole.create({ data: { id: input.membershipRoleId, membershipId: input.membershipId, roleVersionId: owner.versions[0].id, validFrom: new Date(), assignedByMembershipId: input.membershipId, assignmentReason: "Controlled first organization owner bootstrap" } });
      return true;
    }, { isolationLevel: "Serializable" });
  }

  private async registerModuleTx(tx: Tx, manifest: ModuleAuthorizationManifest, actorMembershipId: string) {
      const registrationId = stableId("module_auth", `${manifest.moduleId}:${manifest.version}`);
      await tx.moduleAuthorizationRegistration.upsert({
        where: { moduleId_version: { moduleId: manifest.moduleId, version: manifest.version } },
        create: { id: registrationId, moduleId: manifest.moduleId, version: manifest.version, displayName: manifest.displayName },
        update: { displayName: manifest.displayName, active: true },
      });
      const permissionIds = new Map<string, string>();
      for (const definition of manifest.permissions) {
        const contract = parsePermissionContract(definition.key);
        const id = stableId("permission", definition.key);
        const permission = await tx.permission.upsert({
          where: { key: definition.key },
          create: { id, key: definition.key, moduleId: contract.module, resource: contract.resource, action: contract.action, scope: contract.scope, description: definition.description, riskLevel: definition.riskLevel ?? "normal", moduleRegistrationId: registrationId },
          update: { description: definition.description, riskLevel: definition.riskLevel ?? "normal", moduleRegistrationId: registrationId, active: true },
        });
        permissionIds.set(definition.key, permission.id);
      }
      for (const template of manifest.defaultRoleTemplates) {
        await this.upsertRoleTemplate(tx, manifest, registrationId, actorMembershipId, template, permissionIds);
      }
      for (const role of manifest.protectedRoles ?? []) {
        await this.upsertProtectedRole(tx, manifest, registrationId, actorMembershipId, role, permissionIds);
      }
      if (manifest.moduleId !== "identity") await this.extendOrganizationOwnerPermissions(tx, manifest, actorMembershipId, [...permissionIds.values()]);
  }

  async createApprovalRequest(input: { id: string; policyId: string; requestedByMembershipId: string; operationType: string; operationRef: string; payloadHash: string; reason: string; expiresAt: string }) {
    await this.db.approvalRequest.create({ data: { id: input.id, approvalPolicyId: input.policyId, requestedByMembershipId: input.requestedByMembershipId, operationType: input.operationType, operationRef: input.operationRef, payloadHash: input.payloadHash, reason: input.reason, expiresAt: new Date(input.expiresAt) } });
  }

  async findApprovalRequest(id: string) {
    const row = await this.db.approvalRequest.findUnique({ where: { id }, include: { approvalPolicy: { include: { approverPermission: true } } } });
    return row ? { id: row.id, policyId: row.approvalPolicyId, requestedByMembershipId: row.requestedByMembershipId, approverPermissionKey: row.approvalPolicy.approverPermission.key as PermissionKey, status: row.status, expiresAt: row.expiresAt.toISOString(), requiredApprovals: row.approvalPolicy.requiredApprovals, requireDistinctUser: row.approvalPolicy.requireDistinctUser, requireReauthentication: row.approvalPolicy.requireReauthentication } : null;
  }

  async recordApprovalDecision(input: { id: string; approvalRequestId: string; decidedByMembershipId: string; decision: "approve" | "deny"; reason: string; reauthenticatedAt: string; decidedAt: string }) {
    return this.db.$transaction(async (tx) => {
      await tx.approvalDecision.create({ data: { id: input.id, approvalRequestId: input.approvalRequestId, decidedByMembershipId: input.decidedByMembershipId, decision: input.decision, reason: input.reason, reauthenticatedAt: new Date(input.reauthenticatedAt), decidedAt: new Date(input.decidedAt) } });
      const request = await tx.approvalRequest.findUniqueOrThrow({ where: { id: input.approvalRequestId }, include: { approvalPolicy: true, decisions: true } });
      const approvalCount = request.decisions.filter((item) => item.decision === "approve").length;
      const status = input.decision === "deny" ? "denied" : approvalCount >= request.approvalPolicy.requiredApprovals ? "approved" : "pending";
      if (status !== "pending") await tx.approvalRequest.update({ where: { id: request.id }, data: { status, completedAt: new Date(input.decidedAt) } });
      return { status, approvalCount };
    }, { isolationLevel: "Serializable" });
  }

  private async loadOrganizationAuthorization(subject: AuthorizationSubject, occurredAt: string) {
    if (!subject.organizationMembershipId) return inactive();
    const membership = await this.db.organizationMembership.findUnique({
      where: { id: subject.organizationMembershipId },
      include: {
        organizationUser: true,
        roleAssignments: { where: { revokedAt: null, validFrom: { lte: new Date(occurredAt) }, OR: [{ validUntil: null }, { validUntil: { gt: new Date(occurredAt) } }] }, include: {
          accessScope: true,
          conditionalPolicies: { where: { active: true } },
          roleVersion: { include: { role: true, permissions: { include: { permission: true } }, conditionalPolicies: { where: { active: true } } } },
        } },
        delegationsTo: { where: { status: "active", revokedAt: null, validFrom: { lte: new Date(occurredAt) }, validUntil: { gt: new Date(occurredAt) } }, include: { permission: true, accessScope: true } },
      },
    });
    if (!membership || membership.organizationUserId !== subject.id || membership.status !== "active" || membership.organizationUser.status !== "active" || !inWindow(membership.validFrom, membership.validUntil, occurredAt)) return inactive();
    if (subject.sessionId) {
      const session = await this.db.userSession.findFirst({ where: { id: subject.sessionId, organizationMembershipId: membership.id, status: "active", revokedAt: null, expiresAt: { gt: new Date(occurredAt) } } });
      if (!session) return inactive();
    }
    const grants: EffectivePermissionGrant[] = [];
    for (const assignment of membership.roleAssignments) {
      if (!assignment.roleVersion.role.active || assignment.roleVersion.status !== "published") continue;
      const scope = mapScope(assignment.accessScope);
      for (const item of assignment.roleVersion.permissions) {
        if (!item.permission.active) continue;
        grants.push({ id: `${assignment.id}:${item.permissionId}`, permissionKey: item.permission.key as PermissionKey, effect: effect(item.effect), source: "ROLE", sourceId: assignment.id, accessScope: scope, conditions: jsonConditions(item.constraints), validFrom: assignment.validFrom.toISOString(), validUntil: assignment.validUntil?.toISOString() });
      }
      const policies = [...assignment.roleVersion.conditionalPolicies, ...assignment.conditionalPolicies];
      for (const policy of policies) {
        const targets = policy.permissionId ? assignment.roleVersion.permissions.filter((item) => item.permissionId === policy.permissionId) : assignment.roleVersion.permissions;
        for (const target of targets) grants.push({ id: `${assignment.id}:${policy.id}:${target.permissionId}`, permissionKey: target.permission.key as PermissionKey, effect: effect(policy.effect), source: "CONDITIONAL_POLICY", sourceId: policy.id, accessScope: scope, conditions: jsonConditions(policy.conditions), validFrom: policy.validFrom?.toISOString(), validUntil: policy.validUntil?.toISOString() });
      }
    }
    for (const delegation of membership.delegationsTo) if (delegation.permission.active) grants.push({ id: delegation.id, permissionKey: delegation.permission.key as PermissionKey, effect: "ALLOW", source: "DELEGATION", sourceId: delegation.id, accessScope: mapScope(delegation.accessScope), validFrom: delegation.validFrom.toISOString(), validUntil: delegation.validUntil.toISOString() });
    return { subjectStatus: "active" as const, grants, approvalPolicies: await this.loadApprovalPolicies() };
  }

  private async loadServiceAccountAuthorization(subject: AuthorizationSubject, occurredAt: string) {
    const row = await this.db.serviceAccount.findUnique({ where: { id: subject.id }, include: { permissions: { include: { permission: true, accessScope: true } } } });
    if (!row || row.status !== "active" || !inWindow(undefined, row.validUntil, occurredAt)) return inactive();
    return { subjectStatus: "active" as const, grants: row.permissions.map((item) => directGrant("SERVICE_ACCOUNT", row.id, item, occurredAt)).filter(isGrant), approvalPolicies: await this.loadApprovalPolicies() };
  }

  private async loadDeviceAuthorization(subject: AuthorizationSubject, occurredAt: string) {
    const row = await this.db.deviceIdentity.findUnique({ where: { id: subject.id }, include: { permissions: { include: { permission: true, accessScope: true } } } });
    if (!row || row.status !== "active" || !inWindow(undefined, row.validUntil, occurredAt)) return inactive();
    return { subjectStatus: "active" as const, grants: row.permissions.map((item) => directGrant("DEVICE", row.id, item, occurredAt)).filter(isGrant), approvalPolicies: await this.loadApprovalPolicies() };
  }

  private async loadExternalAuthorization(subject: AuthorizationSubject, occurredAt: string) {
    const row = await this.db.externalUser.findUnique({ where: { id: subject.id }, include: { permissions: { include: { permission: true, accessScope: true } } } });
    if (!row || row.status !== "active" || !inWindow(undefined, row.validUntil, occurredAt)) return inactive();
    return { subjectStatus: "active" as const, grants: row.permissions.map((item) => directGrant("EXTERNAL", row.id, item, occurredAt)).filter(isGrant), approvalPolicies: await this.loadApprovalPolicies() };
  }

  private async loadApprovalPolicies(): Promise<EffectiveApprovalPolicy[]> {
    const rows = await this.db.approvalPolicy.findMany({ where: { active: true }, include: { permission: true } });
    return rows.map((row) => ({ id: row.id, permissionKey: row.permission.key as PermissionKey, conditions: jsonConditions(row.conditions) ?? {}, requiredApprovals: row.requiredApprovals, requireDistinctUser: row.requireDistinctUser, requireReauthentication: row.requireReauthentication }));
  }

  private async upsertRoleTemplate(tx: Tx, manifest: ModuleAuthorizationManifest, registrationId: string, actorMembershipId: string, template: ModuleAuthorizationManifest["defaultRoleTemplates"][number], permissionIds: Map<string, string>) {
    const roleId = stableId("role_template", `${manifest.moduleId}:${template.templateKey}`);
    const roleVersionId = stableId("role_version", `${roleId}:${manifest.version}`);
    await tx.role.upsert({
      where: { id: roleId },
      create: { id: roleId, name: template.name, description: template.description, type: "SYSTEM_TEMPLATE", functionalArea: template.functionalArea, accessLevel: template.accessLevel, moduleRegistrationId: registrationId },
      update: { name: template.name, description: template.description, functionalArea: template.functionalArea, accessLevel: template.accessLevel, moduleRegistrationId: registrationId, active: true },
    });
    const existing = await tx.roleVersion.findUnique({ where: { id: roleVersionId }, select: { id: true } });
    if (!existing) await tx.roleVersion.create({ data: {
      id: roleVersionId, roleId, version: numericVersion(manifest.version), status: "published", changeReason: `Module manifest ${manifest.moduleId}@${manifest.version}`, createdByMembershipId: actorMembershipId, publishedAt: new Date(),
      permissions: { create: template.permissions.map((grant) => ({ permissionId: requiredPermissionId(permissionIds, grant.key), effect: grant.effect, constraints: grant.conditions as Prisma.InputJsonValue | undefined })) },
    } });
  }

  private async upsertProtectedRole(tx: Tx, manifest: ModuleAuthorizationManifest, registrationId: string, actorMembershipId: string, definition: NonNullable<ModuleAuthorizationManifest["protectedRoles"]>[number], permissionIds: Map<string, string>) {
    const roleId = stableId("protected_role", definition.code);
    const roleVersionId = stableId("role_version", `${roleId}:${manifest.version}`);
    await tx.role.upsert({
      where: { protectedCode: definition.code },
      create: { id: roleId, name: definition.name, description: definition.description, type: "SYSTEM_PROTECTED", protectedCode: definition.code, functionalArea: definition.functionalArea, accessLevel: definition.accessLevel, moduleRegistrationId: registrationId },
      update: { name: definition.name, description: definition.description, functionalArea: definition.functionalArea, accessLevel: definition.accessLevel, moduleRegistrationId: registrationId, active: true },
    });
    const existing = await tx.roleVersion.findUnique({ where: { id: roleVersionId }, select: { id: true } });
    if (!existing) {
      const latest = await tx.roleVersion.findFirst({ where: { roleId, status: "published" }, orderBy: { version: "desc" }, include: { permissions: true } });
      const declared = definition.permissions.map((grant) => ({ permissionId: requiredPermissionId(permissionIds, grant.key), effect: grant.effect, constraints: grant.conditions as Prisma.InputJsonValue | undefined }));
      const declaredIds = new Set(declared.map((grant) => grant.permissionId));
      const preserved = definition.code === "ORGANIZATION_OWNER" ? (latest?.permissions ?? []).filter((grant) => !declaredIds.has(grant.permissionId)).map((grant) => ({ permissionId: grant.permissionId, effect: grant.effect, constraints: grant.constraints ?? undefined })) : [];
      await tx.roleVersion.create({ data: {
      id: roleVersionId, roleId, version: (latest?.version ?? 0) + 1, status: "published", changeReason: `Protected role contract ${manifest.moduleId}@${manifest.version}`, createdByMembershipId: actorMembershipId, publishedAt: new Date(),
      permissions: { create: [...preserved, ...declared] },
      } });
      if (latest) {
        await tx.membershipRole.updateMany({ where: { roleVersionId: latest.id, revokedAt: null }, data: { roleVersionId } });
        await tx.roleVersion.update({ where: { id: latest.id }, data: { status: "retired", retiredAt: new Date() } });
      }
    }
  }

  private async extendOrganizationOwnerPermissions(tx: Tx, manifest: ModuleAuthorizationManifest, actorMembershipId: string, permissionIds: string[]) {
    const owner = await tx.role.findUnique({
      where: { protectedCode: "ORGANIZATION_OWNER" },
      include: { versions: { where: { status: "published" }, orderBy: { version: "desc" }, take: 1, include: { permissions: true } } },
    });
    const current = owner?.versions[0];
    if (!owner || !current) throw new AuthorizationError("ORGANIZATION_OWNER_ROLE_NOT_REGISTERED");
    const existing = new Set(current.permissions.map((item) => item.permissionId));
    const additions = permissionIds.filter((id) => !existing.has(id));
    if (additions.length === 0) return;
    const id = stableId("role_version", `${owner.id}:module:${manifest.moduleId}:${manifest.version}`);
    const next = await tx.roleVersion.create({ data: {
      id, roleId: owner.id, version: current.version + 1, status: "published", changeReason: `Owner permissions extended by ${manifest.moduleId}@${manifest.version}`,
      createdByMembershipId: actorMembershipId, publishedAt: new Date(),
      permissions: { create: [...current.permissions.map((item) => ({ permissionId: item.permissionId, effect: item.effect, constraints: item.constraints ?? undefined })), ...additions.map((permissionId) => ({ permissionId, effect: "ALLOW" }))] },
    } });
    await tx.membershipRole.updateMany({ where: { roleVersionId: current.id, revokedAt: null }, data: { roleVersionId: next.id } });
    await tx.roleVersion.update({ where: { id: current.id }, data: { status: "retired", retiredAt: new Date() } });
  }
}

type DirectGrantRow = { permission: { key: string; active: boolean }; accessScope: unknown; effect: string; validFrom: Date; validUntil: Date | null };

function directGrant(source: "SERVICE_ACCOUNT" | "DEVICE" | "EXTERNAL", sourceId: string, row: DirectGrantRow, occurredAt: string): EffectivePermissionGrant | null {
  if (!row.permission.active || !inWindow(row.validFrom, row.validUntil, occurredAt)) return null;
  return { id: `${sourceId}:${row.permission.key}`, permissionKey: row.permission.key as PermissionKey, effect: effect(row.effect), source, sourceId, accessScope: mapScope(row.accessScope as Parameters<typeof mapScope>[0]), validFrom: row.validFrom.toISOString(), validUntil: row.validUntil?.toISOString() };
}

function isGrant(value: EffectivePermissionGrant | null): value is EffectivePermissionGrant { return value !== null; }
function inactive() { return { subjectStatus: "inactive" as const, grants: [] as EffectivePermissionGrant[], approvalPolicies: [] as EffectiveApprovalPolicy[] }; }
function effect(value: string): "ALLOW" | "DENY" { if (value !== "ALLOW" && value !== "DENY") throw new AuthorizationError("AUTHORIZATION_EFFECT_INVALID"); return value; }
function inWindow(from: Date | undefined, until: Date | null | undefined, occurredAt: string) { const now = Date.parse(occurredAt); return Number.isFinite(now) && (!from || from.getTime() <= now) && (!until || until.getTime() > now); }
function jsonConditions(value: Prisma.JsonValue | null | undefined): AuthorizationConditions | undefined { return value && typeof value === "object" && !Array.isArray(value) ? value as unknown as AuthorizationConditions : undefined; }
function mapScope(value: { id: string; facilityId: string | null; departmentId: string | null; operationalPeriodId: string | null; assignedRecordType: string | null; assignedRecordId: string | null; additionalConstraints: Prisma.JsonValue | null } | null | undefined): AccessScopeRule | undefined { return value ? { id: value.id, facilityId: value.facilityId ?? undefined, departmentId: value.departmentId ?? undefined, operationalPeriodId: value.operationalPeriodId ?? undefined, assignedRecordType: value.assignedRecordType ?? undefined, assignedRecordId: value.assignedRecordId ?? undefined, additionalConstraints: jsonConditions(value.additionalConstraints) } : undefined; }
function stableId(prefix: string, value: string) { return `${prefix}_${createHash("sha256").update(value).digest("hex").slice(0, 24)}`; }
function numericVersion(version: string) { const [major, minor, patch] = version.split(".").map(Number); return major * 1_000_000 + minor * 1_000 + patch; }
function requiredPermissionId(ids: Map<string, string>, key: string) { const id = ids.get(key); if (!id) throw new AuthorizationError("ROLE_TEMPLATE_PERMISSION_NOT_REGISTERED"); return id; }
