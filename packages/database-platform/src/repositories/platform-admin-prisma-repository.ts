import type {
  PlatformAdminRepository,
  PlatformAuthUserRecord,
  PlatformCommandDraft,
  PlatformDashboardSnapshot,
  PlatformListQuery,
  PlatformOrganizationDetail,
  PlatformOrganizationListItem,
  PlatformSessionRecord,
} from "@tilbecore/platform";
import type { OrganizationId, TenantInstanceId } from "@tilbecore/contracts";
import type { PlatformUserId } from "@tilbecore/platform";
import type { Prisma } from "../../generated/client";
import type { PlatformPrismaClient } from "../prisma-client";

const USER_AUTH_INCLUDE = { roles: { include: { role: true } } } as const;

export class PrismaPlatformAdminRepository implements PlatformAdminRepository {
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
