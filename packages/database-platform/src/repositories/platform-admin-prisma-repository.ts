import type {
  PlatformAdminRepository,
  PlatformAuthUserRecord,
  PlatformCommandDraft,
  PlatformDashboardSnapshot,
  PlatformListQuery,
  PlatformOrganizationDetail,
  PlatformOrganizationListItem,
  PlatformSessionRecord,
  PlatformControlPlaneRepository,
  PasskeyRecord,
} from "@tilbecore/platform";
import { randomUUID } from "node:crypto";
import type { OrganizationId, TenantInstanceId } from "@tilbecore/contracts";
import type { PlatformUserId } from "@tilbecore/platform";
import type { Prisma } from "../../generated/client";
import type { PlatformPrismaClient } from "../prisma-client";

const USER_AUTH_INCLUDE = { roles: { include: { role: true } } } as const;

export class PrismaPlatformAdminRepository implements PlatformAdminRepository, PlatformControlPlaneRepository {
  constructor(private readonly db: PlatformPrismaClient) {}

  async findAuthUserByEmail(email: string): Promise<PlatformAuthUserRecord | null> {
    const row = await this.db.platformUser.findUnique({ where: { email }, include: USER_AUTH_INCLUDE });
    return row ? mapAuthUser(row) : null;
  }

  async findAuthUserById(id: PlatformUserId): Promise<PlatformAuthUserRecord | null> {
    const row = await this.db.platformUser.findUnique({ where: { id }, include: USER_AUTH_INCLUDE });
    return row ? mapAuthUser(row) : null;
  }

  async markLoginFailure(userId: PlatformUserId, failedCount: number, lockedUntil?: string): Promise<void> {
    await this.db.platformUser.update({
      where: { id: userId },
      data: { failedLoginCount: failedCount, lockedUntil: lockedUntil ? new Date(lockedUntil) : null },
    });
  }

  async markLoginSuccess(userId: PlatformUserId, occurredAt: string): Promise<void> {
    await this.db.platformUser.update({
      where: { id: userId },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date(occurredAt) },
    });
  }

  async createSession(input: PlatformSessionRecord & { deviceId: string; occurredAt: string; userAgent?: string }): Promise<void> {
    await this.db.$transaction(async (tx) => {
      await tx.platformDevice.create({
        data: {
          id: input.deviceId, userId: input.userId, label: "Platform Admin Web", userAgent: input.userAgent,
          trustStatus: "unknown", firstSeenAt: new Date(input.occurredAt), lastSeenAt: new Date(input.occurredAt),
        },
      });
      await tx.platformSession.create({
        data: {
          id: input.id, userId: input.userId, deviceId: input.deviceId, status: "active",
          tokenHash: input.tokenHash, authVersion: input.authVersion,
          lastSeenAt: new Date(input.occurredAt), expiresAt: new Date(input.expiresAt),
        },
      });
    });
  }

  async findSessionByTokenHash(tokenHash: string): Promise<PlatformSessionRecord | null> {
    const row = await this.db.platformSession.findUnique({ where: { tokenHash } });
    return row?.tokenHash ? {
      id: row.id, userId: row.userId as PlatformUserId, tokenHash: row.tokenHash,
      status: row.status, authVersion: row.authVersion, expiresAt: row.expiresAt.toISOString(),
    } : null;
  }

  async rotateSession(id: string, oldTokenHash: string, newTokenHash: string, expiresAt: string, occurredAt: string): Promise<boolean> {
    const result = await this.db.platformSession.updateMany({
      where: { id, tokenHash: oldTokenHash, status: "active" },
      data: { tokenHash: newTokenHash, rotatedAt: new Date(occurredAt), lastSeenAt: new Date(occurredAt), expiresAt: new Date(expiresAt) },
    });
    return result.count === 1;
  }

  async revokeSession(id: string, occurredAt: string): Promise<void> {
    await this.db.platformSession.updateMany({
      where: { id, status: "active" }, data: { status: "revoked", revokedAt: new Date(occurredAt) },
    });
  }

  async revokeUserSessions(userId: PlatformUserId, occurredAt: string): Promise<void> {
    await this.db.platformSession.updateMany({
      where: { userId, status: "active" }, data: { status: "revoked", revokedAt: new Date(occurredAt) },
    });
  }

  async recordAudit(input: Parameters<PlatformAdminRepository["recordAudit"]>[0]): Promise<void> {
    await this.db.platformAuditLog.create({
      data: {
        id: input.id, actorUserId: input.actorUserId, organizationId: input.organizationId,
        tenantInstanceId: input.tenantInstanceId, action: input.action, targetType: input.targetType,
        targetId: input.targetId, requestId: input.requestId, result: input.result,
        metadata: input.metadata as Prisma.InputJsonValue | undefined, occurredAt: new Date(input.occurredAt),
      },
    });
  }

  async dashboard(now: string): Promise<PlatformDashboardSnapshot> {
    const point = new Date(now);
    const [
      activeOrganizations, provisioningOrganizations, failedProvisioningJobs,
      activeLicenses, suspendedLicenses, expiredLicenses, unhealthyTenants,
      unverifiedBackups, pendingDomains, openSupportSessions, criticalIncidents, snapshots,
    ] = await Promise.all([
      this.db.organization.count({ where: { status: "active" } }),
      this.db.organization.count({ where: { status: "provisioning" } }),
      this.db.platformProvisioningJob.count({ where: { status: "failed" } }),
      this.db.platformLicense.count({ where: { status: "active", OR: [{ expiresAt: null }, { expiresAt: { gt: point } }] } }),
      this.db.platformLicense.count({ where: { status: "suspended" } }),
      this.db.platformLicense.count({ where: { OR: [{ status: "expired" }, { expiresAt: { lte: point } }] } }),
      this.db.tenantInstance.count({ where: { runtimeStatus: { in: ["degraded", "offline"] } } }),
      this.db.platformTenantBackup.count({ where: { verificationStatus: { not: "verified" } } }),
      this.db.tenantCustomDomain.count({ where: { OR: [{ dnsVerified: false }, { tlsReady: false }] } }),
      this.db.platformSupportSession.count({ where: { status: "active", startsAt: { lte: point }, expiresAt: { gt: point } } }),
      this.db.platformIncident.count({ where: { severity: "critical", status: { notIn: ["resolved", "cancelled"] } } }),
      this.db.tenantHealthSnapshot.findMany({ orderBy: { checkedAt: "desc" }, distinct: ["tenantInstanceId"] }),
    ]);
    return {
      activeOrganizations, provisioningOrganizations, failedProvisioningJobs, activeLicenses,
      suspendedLicenses, expiredLicenses, unhealthyTenants, unverifiedBackups, pendingDomains,
      openSupportSessions, criticalIncidents,
      migrationPendingTenants: snapshots.filter((item) => item.version && item.migrationVersion && item.version !== item.migrationVersion).length,
      quotaAlerts: 0,
    };
  }

  async listOrganizations(query: PlatformListQuery): Promise<readonly PlatformOrganizationListItem[]> {
    const search = query.search?.trim();
    const rows = await this.db.organization.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(search ? { OR: [
          { displayName: { contains: search, mode: "insensitive" } }, { slug: { contains: search, mode: "insensitive" } },
          { id: { contains: search, mode: "insensitive" } },
          { tenants: { some: { OR: [
            { id: { contains: search, mode: "insensitive" } },
            { customDomains: { some: { hostname: { contains: search, mode: "insensitive" } } } },
          ] } } },
        ] } : {}),
        ...(query.plan ? { licenses: { some: { plan: { code: query.plan } } } } : {}),
        ...(query.licenseStatus ? { licenses: { some: { status: query.licenseStatus } } } : {}),
        ...(query.provisioningStatus ? { tenants: { some: { provisioningStatus: query.provisioningStatus } } } : {}),
      },
      include: {
        tenants: { take: 1, include: {
          customDomains: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }], take: 1 },
          healthSnapshots: { orderBy: { checkedAt: "desc" }, take: 1 },
          backupRecords: { orderBy: { createdAt: "desc" }, take: 1 },
        } },
        licenses: { orderBy: { createdAt: "desc" }, take: 1, include: { plan: true } },
      },
      orderBy: { createdAt: "desc" }, take: 250,
    });
    const tenantIds = rows.flatMap((row) => row.tenants.map((tenant) => tenant.id));
    const jobs = tenantIds.length ? await this.db.platformProvisioningJob.findMany({ where: { tenantInstanceId: { in: tenantIds } } }) : [];
    return rows.map((row) => {
      const tenant = row.tenants[0];
      const license = row.licenses[0];
      const job = tenant ? jobs.find((item) => item.tenantInstanceId === tenant.id) : undefined;
      return {
        id: row.id as OrganizationId, tenantInstanceId: tenant?.id as TenantInstanceId | undefined,
        displayName: row.displayName, slug: row.slug, status: row.status as PlatformOrganizationListItem["status"],
        planName: license?.plan.displayName, licenseStatus: license?.status,
        domain: tenant?.customDomains[0]?.hostname ?? `${row.slug}.tilbecore.com`, databaseStatus: tenant?.runtimeStatus,
        backupStatus: tenant?.backupRecords[0]?.verificationStatus, provisioningStatus: job?.status ?? tenant?.provisioningStatus,
        criticalAlert: job?.status === "failed" ? job.failureCode ?? "PROVISIONING_FAILED" : undefined,
        createdAt: row.createdAt.toISOString(),
      };
    });
  }

  async organizationDetail(id: OrganizationId): Promise<PlatformOrganizationDetail | null> {
    const row = await this.db.organization.findUnique({
      where: { id }, include: {
        tenants: { include: { databaseRef: true, customDomains: true, healthSnapshots: { orderBy: { checkedAt: "desc" }, take: 5 }, backupRecords: { orderBy: { createdAt: "desc" }, take: 20 }, adminInvitations: true } },
        licenses: { orderBy: { createdAt: "desc" }, take: 1, include: { plan: true, entitlements: { include: { module: true } }, changes: true } },
        lifecycleEvents: { orderBy: { occurredAt: "desc" }, take: 50 },
        supportSessions: { orderBy: { createdAt: "desc" }, take: 50 },
        auditLogs: { orderBy: { occurredAt: "desc" }, take: 100 },
      },
    });
    if (!row) return null;
    const tenant = row.tenants[0];
    const jobs = await this.db.platformProvisioningJob.findMany({ where: { organizationId: row.id }, orderBy: { createdAt: "desc" } });
    const base = (await this.listOrganizations({ search: row.id })).find((item) => item.id === row.id);
    if (!base) return null;
    return {
      ...base, version: row.version,
      tenant: tenant ? safeRecord({
        id: tenant.id, slug: tenant.slug, provisioningStatus: tenant.provisioningStatus,
        runtimeStatus: tenant.runtimeStatus, releaseChannel: tenant.releaseChannel,
        databaseRefId: tenant.databaseRefId, databaseRefStatus: tenant.databaseRef.status,
        health: tenant.healthSnapshots,
      }) : undefined,
      license: row.licenses[0] ? safeRecord(row.licenses[0]) : undefined,
      domains: tenant?.customDomains.map(safeRecord) ?? [], provisioningJobs: jobs.map(safeRecord),
      adminInvitations: tenant?.adminInvitations.map(safeRecord) ?? [], backups: tenant?.backupRecords.map(safeRecord) ?? [],
      supportSessions: row.supportSessions.map(safeRecord), lifecycleEvents: row.lifecycleEvents.map(safeRecord),
      auditEvents: row.auditLogs.map(safeRecord),
    };
  }

  async enqueueCommand(command: PlatformCommandDraft): Promise<{ id: string; status: string; duplicate: boolean }> {
    const existing = await this.db.platformAdminCommand.findUnique({ where: { idempotencyKey: command.idempotencyKey } });
    if (existing) {
      if (existing.type !== command.type || existing.organizationId !== command.organizationId || existing.tenantInstanceId !== command.tenantInstanceId) {
        throw new Error("PLATFORM_COMMAND_IDEMPOTENCY_CONFLICT");
      }
      return { id: existing.id, status: existing.status, duplicate: true };
    }
    try {
      const row = await this.db.platformAdminCommand.create({ data: {
        id: command.id, idempotencyKey: command.idempotencyKey, type: command.type, status: "pending",
        organizationId: command.organizationId, tenantInstanceId: command.tenantInstanceId,
        requestedByUserId: command.requestedByUserId, requestId: command.requestId, traceId: command.traceId,
        approvalReason: command.approvalReason, payload: command.payload as Prisma.InputJsonValue,
        version: command.expectedVersion ?? 0,
      } });
      return { id: row.id, status: row.status, duplicate: false };
    } catch {
      const raced = await this.db.platformAdminCommand.findUnique({ where: { idempotencyKey: command.idempotencyKey } });
      if (raced && raced.type === command.type) return { id: raced.id, status: raced.status, duplicate: true };
      throw new Error("PLATFORM_COMMAND_CREATE_FAILED");
    }
  }

  async transitionOrganization(input: Parameters<PlatformAdminRepository["transitionOrganization"]>[0]): Promise<boolean> {
    return this.db.$transaction(async (tx) => {
      const updated = await tx.organization.updateMany({
        where: { id: input.organizationId, status: input.fromStatus, version: input.expectedVersion },
        data: { status: input.toStatus, version: { increment: 1 } },
      });
      if (updated.count !== 1) return false;
      await tx.organizationLifecycleEvent.create({ data: {
        id: input.eventId, organizationId: input.organizationId, fromStatus: input.fromStatus,
        toStatus: input.toStatus, reason: input.reason, impactSummary: input.impactSummary,
        approvedByUserId: input.approvedByUserId, requestId: input.requestId,
      } });
      return true;
    });
  }

  async listProvisioningJobs(): Promise<readonly Readonly<Record<string, unknown>>[]> {
    const [jobs, commands] = await Promise.all([
      this.db.platformProvisioningJob.findMany({ orderBy: { createdAt: "desc" }, take: 250 }),
      this.db.platformAdminCommand.findMany({ where: { type: { startsWith: "tenant.provision" } }, orderBy: { createdAt: "desc" }, take: 250 }),
    ]);
    return [...jobs.map((item) => safeRecord({ source: "provisioning_job", ...item })), ...commands.map((item) => safeRecord({ source: "admin_command", ...item }))]
      .sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  async listPlansAndLicenses(): Promise<readonly Readonly<Record<string, unknown>>[]> {
    return (await this.db.platformPlan.findMany({ include: { modules: { include: { module: true } }, licenses: { include: { organization: true, entitlements: true, changes: true } } }, orderBy: { code: "asc" } })).map(safeRecord);
  }

  async listPlatformUsers(): Promise<readonly Readonly<Record<string, unknown>>[]> {
    return (await this.db.platformUser.findMany({ include: { roles: { include: { role: true } }, sessions: { orderBy: { createdAt: "desc" }, take: 10 }, mfaEnrollments: true }, orderBy: { createdAt: "desc" } })).map((row) => safeRecord({
      ...row,
      passwordHash: undefined,
      sessions: row.sessions.map((session) => ({ ...session, tokenHash: undefined })),
      mfaEnrollments: row.mfaEnrollments.map((enrollment) => ({ ...enrollment, secretCiphertext: undefined })),
    }));
  }

  async listAuditEvents(): Promise<readonly Readonly<Record<string, unknown>>[]> {
    return (await this.db.platformAuditLog.findMany({ orderBy: { occurredAt: "desc" }, take: 500 })).map(safeRecord);
  }

  async listSupportSessions(): Promise<readonly Readonly<Record<string, unknown>>[]> {
    return (await this.db.platformSupportSession.findMany({ include: { organization: true, tenantInstance: true, platformUser: true }, orderBy: { createdAt: "desc" }, take: 250 })).map(safeRecord);
  }

  async listDomains(): Promise<readonly Readonly<Record<string, unknown>>[]> {
    return (await this.db.tenantCustomDomain.findMany({ include: { tenantInstance: { include: { organization: true } } }, orderBy: { createdAt: "desc" }, take: 250 })).map(safeRecord);
  }

  async listBackups(): Promise<readonly Readonly<Record<string, unknown>>[]> {
    return (await this.db.platformTenantBackup.findMany({ include: { tenantInstance: { include: { organization: true } } }, orderBy: { createdAt: "desc" }, take: 250 })).map(safeRecord);
  }

  async provisioningIdentifiersAvailable(input: Parameters<PlatformAdminRepository["provisioningIdentifiersAvailable"]>[0]): Promise<boolean> {
    const [organization, tenant, slugOrganization, slugTenant, domain] = await Promise.all([
      this.db.organization.findUnique({ where: { id: input.organizationId } }),
      this.db.tenantInstance.findUnique({ where: { id: input.tenantInstanceId } }),
      this.db.organization.findUnique({ where: { slug: input.slug } }),
      this.db.tenantInstance.findUnique({ where: { slug: input.slug } }),
      this.db.tenantCustomDomain.findUnique({ where: { hostname: input.domain } }),
    ]);
    return !organization && !tenant && !slugOrganization && !slugTenant && !domain;
  }

  async createSupportSession(input: Parameters<PlatformAdminRepository["createSupportSession"]>[0]): Promise<void> {
    await this.db.platformSupportSession.create({ data: {
      id: input.id, organizationId: input.organizationId, tenantInstanceId: input.tenantInstanceId,
      platformUserId: input.platformUserId, approvedByUserId: input.approvedByUserId,
      reason: input.reason, status: "active", scopes: [...input.scopes],
      startsAt: new Date(input.startsAt), expiresAt: new Date(input.expiresAt),
    } });
  }

  async revokeSupportSession(input: Parameters<PlatformAdminRepository["revokeSupportSession"]>[0]): Promise<boolean> {
    const result = await this.db.platformSupportSession.updateMany({
      where: { id: input.id, status: "active" }, data: {
        status: "revoked", endedAt: new Date(input.occurredAt), revokedByUserId: input.revokedByUserId,
        revocationReason: input.reason,
      },
    });
    return result.count === 1;
  }

  async createCustomDomain(input: Parameters<PlatformAdminRepository["createCustomDomain"]>[0]): Promise<void> {
    await this.db.$transaction(async (tx) => {
      if (input.isPrimary && await tx.tenantCustomDomain.findFirst({ where: { tenantInstanceId: input.tenantInstanceId, isPrimary: true } })) {
        throw new Error("PLATFORM_PRIMARY_DOMAIN_ALREADY_EXISTS");
      }
      await tx.tenantCustomDomain.create({ data: {
        id: input.id, tenantInstanceId: input.tenantInstanceId, hostname: input.hostname,
        status: "pending_verification", dnsVerified: false, tlsReady: false, isPrimary: input.isPrimary,
      } });
    }, { isolationLevel: "Serializable" });
  }

  async scheduleLicenseChange(input: Parameters<PlatformAdminRepository["scheduleLicenseChange"]>[0]): Promise<void> {
    const license = await this.db.platformLicense.findUnique({ where: { id: input.licenseId } });
    if (!license || license.version !== input.expectedVersion) throw new Error("PLATFORM_OPTIMISTIC_CONCURRENCY_CONFLICT");
    await this.db.platformLicenseChange.create({ data: {
      id: input.id, licenseId: input.licenseId, targetPlanId: input.targetPlanId,
      effectiveAt: new Date(input.effectiveAt), reason: input.reason, status: "scheduled",
      requestedByUserId: input.requestedByUserId, expectedVersion: input.expectedVersion,
    } });
  }

  async updatePlatformUserStatus(input: Parameters<PlatformAdminRepository["updatePlatformUserStatus"]>[0]): Promise<boolean> {
    return this.db.$transaction(async (tx) => {
      const updated = await tx.platformUser.updateMany({ where: { id: input.userId }, data: { status: input.status, authVersion: { increment: 1 } } });
      if (updated.count !== 1) return false;
      await tx.platformSession.updateMany({ where: { userId: input.userId, status: "active" }, data: { status: "revoked", revokedAt: new Date(input.occurredAt) } });
      return true;
    });
  }

  async replacePlatformUserRoles(input: Parameters<PlatformAdminRepository["replacePlatformUserRoles"]>[0]): Promise<boolean> {
    return this.db.$transaction(async (tx) => {
      const [user, roles] = await Promise.all([
        tx.platformUser.findUnique({ where: { id: input.userId } }),
        tx.platformRole.findMany({ where: { id: { in: [...input.roleIds] }, status: "active" } }),
      ]);
      if (!user || roles.length !== input.roleIds.length) return false;
      await tx.platformUserRole.deleteMany({ where: { userId: input.userId } });
      await tx.platformUserRole.createMany({ data: input.roleIds.map((roleId) => ({ userId: input.userId, roleId })) });
      await tx.platformUser.update({ where: { id: input.userId }, data: { authVersion: { increment: 1 } } });
      await tx.platformSession.updateMany({ where: { userId: input.userId, status: "active" }, data: { status: "revoked", revokedAt: new Date(input.occurredAt) } });
      return true;
    });
  }

  async createChallenge(input: Parameters<PlatformControlPlaneRepository["createChallenge"]>[0]): Promise<void> {
    await this.db.platformAuthChallenge.create({ data: { ...input, expiresAt: new Date(input.expiresAt) } });
  }

  async consumeChallenge(input: Parameters<PlatformControlPlaneRepository["consumeChallenge"]>[0]) {
    return this.db.$transaction(async (tx) => {
      const row = await tx.platformAuthChallenge.findUnique({ where: { id: input.id } });
      if (!row || row.userId !== input.userId || row.purpose !== input.purpose || row.consumedAt || row.expiresAt <= new Date(input.occurredAt)) return null;
      const consumed = await tx.platformAuthChallenge.updateMany({ where: { id: input.id, consumedAt: null }, data: { consumedAt: new Date(input.occurredAt) } });
      return consumed.count === 1 ? { id: row.id, userId: row.userId as PlatformUserId, purpose: row.purpose, challenge: row.challenge, expiresAt: row.expiresAt.toISOString(), consumedAt: input.occurredAt } : null;
    });
  }

  async listPasskeys(userId: PlatformUserId): Promise<readonly PasskeyRecord[]> {
    return (await this.db.platformWebAuthnCredential.findMany({ where: { userId }, orderBy: { createdAt: "desc" } })).map(mapPasskey);
  }

  async findPasskey(credentialId: string): Promise<PasskeyRecord | null> {
    const row = await this.db.platformWebAuthnCredential.findUnique({ where: { credentialId } }); return row ? mapPasskey(row) : null;
  }

  async savePasskey(input: PasskeyRecord): Promise<void> {
    await this.db.platformWebAuthnCredential.create({ data: { ...input, transports: [...input.transports] } });
  }

  async updatePasskeyCounter(input: Parameters<PlatformControlPlaneRepository["updatePasskeyCounter"]>[0]): Promise<boolean> {
    const row = await this.db.platformWebAuthnCredential.findUnique({ where: { credentialId: input.credentialId } });
    if (!row || row.status !== "active" || input.counter < row.counter) return false;
    return (await this.db.platformWebAuthnCredential.updateMany({ where: { credentialId: input.credentialId, counter: row.counter, status: "active" }, data: { counter: input.counter, lastUsedAt: new Date(input.occurredAt) } })).count === 1;
  }

  async revokePasskey(input: Parameters<PlatformControlPlaneRepository["revokePasskey"]>[0]): Promise<boolean> {
    return (await this.db.platformWebAuthnCredential.updateMany({ where: { id: input.id, userId: input.userId, status: "active" }, data: { status: "revoked", revokedAt: new Date(input.occurredAt) } })).count === 1;
  }

  async replaceRecoveryCodes(input: Parameters<PlatformControlPlaneRepository["replaceRecoveryCodes"]>[0]): Promise<void> {
    await this.db.$transaction(async (tx) => {
      await tx.platformRecoveryCode.updateMany({ where: { userId: input.userId, usedAt: null, revokedAt: null }, data: { revokedAt: new Date(input.occurredAt) } });
      await tx.platformRecoveryCode.createMany({ data: input.codes.map(code => ({ id: code.id, userId: input.userId, batchId: input.batchId, codeHash: code.hash })) });
    });
  }

  async consumeRecoveryCode(input: Parameters<PlatformControlPlaneRepository["consumeRecoveryCode"]>[0]): Promise<boolean> {
    return (await this.db.platformRecoveryCode.updateMany({ where: { userId: input.userId, codeHash: input.hash, usedAt: null, revokedAt: null }, data: { usedAt: new Date(input.occurredAt) } })).count === 1;
  }

  async listSecurityOverview(userId?: PlatformUserId) {
    return (await this.db.platformUser.findMany({ where: userId ? { id: userId } : undefined, include: { devices: { include: { sessions: { orderBy: { lastSeenAt: "desc" } } } }, webAuthnCredentials: true, recoveryCodes: true }, orderBy: { email: "asc" } })).map(row => safeRecord({
      id: row.id, email: row.email, displayName: row.displayName, status: row.status, lastLoginAt: row.lastLoginAt,
      devices: row.devices.map(device => ({ ...device, sessions: device.sessions.map(session => ({ ...session, tokenHash: undefined })) })),
      passkeys: row.webAuthnCredentials.map(item => ({ id:item.id,label:item.label,status:item.status,deviceType:item.deviceType,backedUp:item.backedUp,createdAt:item.createdAt,lastUsedAt:item.lastUsedAt })),
      recovery: { available: row.recoveryCodes.filter(code => !code.usedAt && !code.revokedAt).length, used: row.recoveryCodes.filter(code => code.usedAt).length },
    }));
  }

  async revokeDeviceSessions(input: Parameters<PlatformControlPlaneRepository["revokeDeviceSessions"]>[0]): Promise<boolean> {
    const device = await this.db.platformDevice.findFirst({ where: { id: input.deviceId, userId: input.userId } }); if (!device) return false;
    await this.db.$transaction([
      this.db.platformSession.updateMany({ where: { deviceId: input.deviceId, status: "active" }, data: { status: "revoked", revokedAt: new Date(input.occurredAt) } }),
      this.db.platformDevice.update({ where: { id: input.deviceId }, data: { trustStatus: "blocked", lastSeenAt: new Date(input.occurredAt) } }),
    ]); return true;
  }

  async markSessionReauthenticated(input: Parameters<PlatformControlPlaneRepository["markSessionReauthenticated"]>[0]): Promise<boolean> {
    return (await this.db.platformSession.updateMany({ where: { id: input.sessionId, userId: input.userId, status: "active" }, data: { lastReauthenticatedAt: new Date(input.occurredAt) } })).count === 1;
  }

  async findSessionSecurity(id: string) {
    const row=await this.db.platformSession.findUnique({where:{id}}); return row?{userId:row.userId as PlatformUserId,lastReauthenticatedAt:row.lastReauthenticatedAt?.toISOString()}:null;
  }

  async listIncidents(){return (await this.db.platformIncident.findMany({include:{timeline:{orderBy:{occurredAt:"desc"}}},orderBy:{openedAt:"desc"},take:250})).map(safeRecord)}
  async createIncident(input:Parameters<PlatformControlPlaneRepository["createIncident"]>[0]):Promise<void>{await this.db.$transaction(async tx=>{await tx.platformIncident.create({data:{id:input.id,organizationId:input.organizationId,severity:input.severity,status:"open",title:input.title,message:input.message,affectedTenantIds:[...input.affectedTenantIds],openedAt:new Date(input.occurredAt),createdByUserId:input.actor.userId}});await tx.platformIncidentTimelineEntry.create({data:{id:`${input.id}_open`,incidentId:input.id,actorUserId:input.actor.userId,action:"opened",message:input.message,requestId:input.requestId,occurredAt:new Date(input.occurredAt)}})})}
  async transitionIncident(input:Parameters<PlatformControlPlaneRepository["transitionIncident"]>[0]):Promise<boolean>{return this.db.$transaction(async tx=>{const updated=await tx.platformIncident.updateMany({where:{id:input.id,status:input.fromStatus},data:{status:input.toStatus,message:input.message,resolvedAt:input.toStatus==="resolved"?new Date(input.occurredAt):null}});if(updated.count!==1)return false;await tx.platformIncidentTimelineEntry.create({data:{id:cryptoId(),incidentId:input.id,actorUserId:input.actor.userId,action:input.toStatus,message:input.message,requestId:input.requestId,occurredAt:new Date(input.occurredAt)}});return true})}
  async listMaintenanceWindows(){return (await this.db.maintenanceWindow.findMany({orderBy:{plannedStartAt:"desc"},take:250})).map(safeRecord)}
  async createMaintenance(input:Parameters<PlatformControlPlaneRepository["createMaintenance"]>[0]):Promise<void>{await this.db.maintenanceWindow.create({data:{id:input.id,status:"planned",title:input.title,message:input.message,affectedTenantIds:[...input.affectedTenantIds],plannedStartAt:new Date(input.plannedStartAt),plannedEndAt:new Date(input.plannedEndAt),mode:input.mode,createdByUserId:input.actor.userId}})}
  async transitionMaintenance(input:Parameters<PlatformControlPlaneRepository["transitionMaintenance"]>[0]):Promise<boolean>{const at=new Date(input.occurredAt);return(await this.db.maintenanceWindow.updateMany({where:{id:input.id,status:input.fromStatus},data:{status:input.toStatus,...(input.toStatus==="active"?{startedAt:at}:input.toStatus==="completed"?{endedAt:at}:{cancelledAt:at})}})).count===1}
  async setEmergencyStop(input:Parameters<PlatformControlPlaneRepository["setEmergencyStop"]>[0]):Promise<void>{const existing=await this.db.emergencyStop.findFirst({where:{organizationId:input.organizationId,tenantInstanceId:input.tenantInstanceId??null,moduleId:input.moduleId??null}});if(existing){const updated=await this.db.emergencyStop.updateMany({where:{id:existing.id,version:input.expectedVersion??existing.version},data:{status:input.status,mode:input.mode,blockedScopes:[...input.blockedScopes],reason:input.reason,changedByUserId:input.actor.userId,changedAt:new Date(input.occurredAt),version:{increment:1}}});if(updated.count!==1)throw new Error("PLATFORM_OPTIMISTIC_CONCURRENCY_CONFLICT");return}await this.db.emergencyStop.create({data:{id:input.id,organizationId:input.organizationId,tenantInstanceId:input.tenantInstanceId,moduleId:input.moduleId,status:input.status,mode:input.mode,blockedScopes:[...input.blockedScopes],reason:input.reason,changedByUserId:input.actor.userId,changedAt:new Date(input.occurredAt)}})}
  async listEmergencyStops(){return(await this.db.emergencyStop.findMany({include:{organization:true,tenantInstance:true,module:true},orderBy:{changedAt:"desc"},take:250})).map(safeRecord)}

  async organizationConfiguration(id:OrganizationId){const row=await this.db.organization.findUnique({where:{id},include:{tenants:{include:{customDomains:true,healthSnapshots:{orderBy:{checkedAt:"desc"},take:1},backupRecords:{orderBy:{createdAt:"desc"},take:1}}},licenses:{orderBy:{createdAt:"desc"},take:1,include:{plan:{include:{modules:{include:{module:true}}}},entitlements:{include:{module:true}}}}}});if(!row)return null;const tenant=row.tenants[0],license=row.licenses[0],health=tenant?.healthSnapshots[0];const expectedModules=license?.plan.modules.filter(x=>x.enabled).map(x=>x.module.key)??[];const actualModules=license?.entitlements.filter(x=>x.enabled).map(x=>x.module.key)??[];return safeRecord({organization:{id:row.id,status:row.status,version:row.version},plan:license?{code:license.plan.code,status:license.status,limits:{maxUsers:license.maxUsers,maxDevices:license.maxDevices,maxStorageMb:license.maxStorageMb,maxAnimals:license.maxAnimals,maxSeasons:license.maxSeasons}}:null,tenant:tenant?{id:tenant.id,releaseChannel:tenant.releaseChannel,runtimeStatus:tenant.runtimeStatus,provisioningStatus:tenant.provisioningStatus}:null,versions:{application:health?.version??null,migration:health?.migrationVersion??null},domains:tenant?.customDomains.map(x=>({hostname:x.hostname,status:x.status,dnsVerified:x.dnsVerified,tlsReady:x.tlsReady,isPrimary:x.isPrimary}))??[],backup:tenant?.backupRecords[0]?{status:tenant.backupRecords[0].status,verificationStatus:tenant.backupRecords[0].verificationStatus,createdAt:tenant.backupRecords[0].createdAt}:null,expected:{modules:expectedModules},actual:{modules:actualModules},differences:{missingModules:expectedModules.filter(x=>!actualModules.includes(x)),unexpectedModules:actualModules.filter(x=>!expectedModules.includes(x))}})}
  async createOrganizationOperation(input:Parameters<PlatformControlPlaneRepository["createOrganizationOperation"]>[0]){
    const existing=await this.db.organizationOperationJob.findUnique({where:{idempotencyKey:input.idempotencyKey}});
    if(existing){if(existing.organizationId!==input.organizationId||existing.type!==input.type)throw new Error("PLATFORM_OPERATION_IDEMPOTENCY_CONFLICT");return{id:existing.id,status:existing.status,duplicate:true}}
    const row=await this.db.organizationOperationJob.create({data:{...input,payload:input.payload as Prisma.InputJsonValue,reauthenticatedAt:new Date(input.reauthenticatedAt)}});
    if(row.status==="approved")await applyOrganizationOperation(this.db,row.id);
    const current=await this.db.organizationOperationJob.findUniqueOrThrow({where:{id:row.id}});return{id:current.id,status:current.status,duplicate:false};
  }
  async approveOrganizationOperation(input:Parameters<PlatformControlPlaneRepository["approveOrganizationOperation"]>[0]):Promise<boolean>{
    const row=await this.db.organizationOperationJob.findUnique({where:{id:input.id}});if(!row||row.status!=="awaiting_approval"||row.requestedByUserId===input.approverUserId)return false;
    const updated=await this.db.organizationOperationJob.updateMany({where:{id:input.id,status:"awaiting_approval",approvedByUserId:null},data:{status:"approved",approvedByUserId:input.approverUserId,version:{increment:1}}});if(updated.count!==1)return false;await applyOrganizationOperation(this.db,input.id);return true;
  }
  async cancelOrganizationOperation(input:Parameters<PlatformControlPlaneRepository["cancelOrganizationOperation"]>[0]):Promise<boolean>{return(await this.db.organizationOperationJob.updateMany({where:{id:input.id,status:{in:["pending","awaiting_approval","approved"]}},data:{status:"cancelled",cancelledAt:new Date(input.occurredAt),version:{increment:1}}})).count===1}
  async listOrganizationOperations(organizationId?:OrganizationId){return(await this.db.organizationOperationJob.findMany({where:organizationId?{organizationId}:undefined,orderBy:{createdAt:"desc"},take:250})).map(safeRecord)}
  async issueTenantAdminInvitation(input:Parameters<PlatformControlPlaneRepository["issueTenantAdminInvitation"]>[0]):Promise<void>{await this.db.$transaction(async tx=>{const[tenant,backup]=await Promise.all([tx.tenantInstance.findUnique({where:{id:input.tenantInstanceId}}),tx.platformTenantBackup.findFirst({where:{tenantInstanceId:input.tenantInstanceId,status:{in:["completed","verified"]}},orderBy:{createdAt:"desc"}})]);if(!tenant||tenant.organizationId!==input.organizationId||tenant.provisioningStatus!=="active"||!backup)throw new Error("TENANT_INVITATION_NOT_READY");const existing=await tx.tenantAdminInvitation.findUnique({where:{tenantInstanceId_email:{tenantInstanceId:input.tenantInstanceId,email:input.email}}});if(existing)await tx.tenantAdminInvitation.update({where:{id:existing.id},data:{status:"pending",tokenHash:input.tokenHash,expiresAt:new Date(input.expiresAt),revokedAt:null,sentAt:new Date(input.occurredAt),resendCount:{increment:1}}});else await tx.tenantAdminInvitation.create({data:{id:input.id,organizationId:input.organizationId,tenantInstanceId:input.tenantInstanceId,email:input.email,displayName:input.displayName,roleKey:"tenant_admin",status:"pending",tokenHash:input.tokenHash,expiresAt:new Date(input.expiresAt),invitedByUserId:input.invitedByUserId,sentAt:new Date(input.occurredAt)}})})}
  async consumeTenantAdminInvitation(input:Parameters<PlatformControlPlaneRepository["consumeTenantAdminInvitation"]>[0]){return this.db.$transaction(async tx=>{const row=await tx.tenantAdminInvitation.findFirst({where:{tokenHash:input.tokenHash,status:"pending",revokedAt:null,acceptedAt:null,expiresAt:{gt:new Date(input.occurredAt)}}});if(!row)return null;const updated=await tx.tenantAdminInvitation.updateMany({where:{id:row.id,status:"pending",acceptedAt:null},data:{status:"accepted",acceptedAt:new Date(input.occurredAt),tokenHash:null}});return updated.count===1?{id:row.id,tenantInstanceId:row.tenantInstanceId as TenantInstanceId,email:row.email}:null})}
  async revokeTenantAdminInvitation(input:Parameters<PlatformControlPlaneRepository["revokeTenantAdminInvitation"]>[0]):Promise<boolean>{return(await this.db.tenantAdminInvitation.updateMany({where:{id:input.id,status:"pending"},data:{status:"revoked",revokedAt:new Date(input.occurredAt),tokenHash:null}})).count===1}
}

type AuthUserRow = Prisma.PlatformUserGetPayload<{ include: typeof USER_AUTH_INCLUDE }>;

function mapAuthUser(row: AuthUserRow): PlatformAuthUserRecord {
  return {
    id: row.id as PlatformUserId, email: row.email, displayName: row.displayName, status: row.status,
    passwordHash: row.passwordHash ?? undefined, failedLoginCount: row.failedLoginCount,
    lockedUntil: row.lockedUntil?.toISOString(), mfaRequired: row.mfaRequired, authVersion: row.authVersion,
    roles: row.roles.map(({ role }) => ({
      key: role.key, status: role.status,
      permissions: Array.isArray(role.permissions) ? role.permissions.filter((value): value is string => typeof value === "string") : [],
    })),
  };
}

function safeRecord(value: object): Readonly<Record<string, unknown>> {
  const serialized = JSON.stringify(value, (key, item: unknown) => {
    if (/^(passwordHash|tokenHash|secretCiphertext|databaseUrl|connectionString|privateKey)$/i.test(key)) return undefined;
    return typeof item === "bigint" ? item.toString() : item;
  });
  return JSON.parse(serialized) as Readonly<Record<string, unknown>>;
}

function mapPasskey(row: Prisma.PlatformWebAuthnCredentialGetPayload<object>): PasskeyRecord {
  return { id:row.id,credentialId:row.credentialId,userId:row.userId as PlatformUserId,publicKeyBase64url:row.publicKeyBase64url,counter:row.counter,transports:Array.isArray(row.transports)?row.transports.filter((x):x is string=>typeof x==="string"):[],deviceType:row.deviceType,backedUp:row.backedUp,label:row.label,status:row.status };
}

function cryptoId():string{return randomUUID()}

async function applyOrganizationOperation(db:PlatformPrismaClient,id:string):Promise<void>{
  await db.$transaction(async tx=>{
    const job=await tx.organizationOperationJob.findUnique({where:{id}});if(!job||job.status!=="approved")return;
    if(job.type==="freeze"||job.type==="reactivate"||job.type==="closure_request"){
      const target=job.type==="freeze"?"suspended":job.type==="reactivate"?"active":"closed";
      await tx.organization.update({where:{id:job.organizationId},data:{status:target,version:{increment:1}}});
      await tx.organizationOperationJob.update({where:{id},data:{status:"completed",completedAt:new Date(),resultMetadata:{organizationStatus:target}}});return;
    }
    if(job.type==="closure_precheck"){
      const[backup,support]=await Promise.all([tx.platformTenantBackup.findFirst({where:{tenantInstance:{organizationId:job.organizationId},status:{in:["completed","verified"]}},orderBy:{createdAt:"desc"}}),tx.platformSupportSession.count({where:{organizationId:job.organizationId,status:"active",expiresAt:{gt:new Date()}}})]);
      await tx.organizationOperationJob.update({where:{id},data:{status:"completed",completedAt:new Date(),resultMetadata:{backupAvailable:Boolean(backup),activeSupportSessions:support,ready:Boolean(backup)&&support===0}}});return;
    }
    if(job.type==="ownership_transfer"){
      const payload=job.payload&&typeof job.payload==="object"&&!Array.isArray(job.payload)?job.payload as Record<string,unknown>:{};const target=typeof payload.targetOwnerRef==="string"?payload.targetOwnerRef.trim():"";if(!target)throw new Error("PLATFORM_TRANSFER_TARGET_REQUIRED");await tx.organization.update({where:{id:job.organizationId},data:{ownerContactRef:target,version:{increment:1}}});await tx.organizationOperationJob.update({where:{id},data:{status:"completed",completedAt:new Date(),resultMetadata:{ownerUpdated:true}}});return;
    }
    if(job.type==="data_export"){
      await tx.organizationOperationJob.update({where:{id},data:{status:"running",resultMetadata:{contentVisibleToPlatform:false,tenantExportRequired:true}}});
    }
  });
}
