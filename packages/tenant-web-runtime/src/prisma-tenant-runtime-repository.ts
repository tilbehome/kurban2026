import { randomUUID } from "node:crypto";
import type {
  CustomDomainStatus,
  OrganizationId,
  PlatformTenantDescriptor,
  SupportSessionContract,
  SupportSessionId,
  TenantDatabaseRefId,
  TenantInstanceId,
  TenantSlug,
  UserId,
} from "@tilbecore/contracts";
import type {
  SupportSessionRegistry,
  TenantRegistry,
  TenantRequestAuditEvent,
  TenantRequestAuditPort,
} from "@tilbecore/tenant-runtime";
import type {
  PlatformSupportSessionRow,
  PlatformTenantRuntimePrismaClientLike,
  TenantCustomDomainRow,
  TenantRuntimeDescriptorRow,
} from "@tilbecore/database-platform";

const TENANT_RUNTIME_INCLUDE = {
  databaseRef: true,
  organization: true,
  healthSnapshots: { orderBy: { checkedAt: "desc" as const }, take: 1 },
} as const;

export class PrismaTenantRuntimeRegistry implements TenantRegistry, SupportSessionRegistry {
  constructor(private readonly db: PlatformTenantRuntimePrismaClientLike) {}

  async findBySlug(slug: TenantSlug): Promise<PlatformTenantDescriptor | null> {
    const row = await this.db.tenantInstance.findUnique({
      where: { slug },
      include: TENANT_RUNTIME_INCLUDE,
    });
    return row ? mapDescriptor(row as TenantRuntimeDescriptorRow) : null;
  }

  async findCustomDomains() {
    const rows = await this.db.tenantCustomDomain.findMany({ include: { tenantInstance: true } });
    return rows.map((row) => mapCustomDomain(row as TenantCustomDomainRow));
  }

  async findAccessPolicy(organizationId: OrganizationId, tenantInstanceId: TenantInstanceId) {
    const now = new Date();
    const [organization, stops, maintenance] = await Promise.all([
      this.db.tenantInstance.findUnique({ where: { id: tenantInstanceId }, include: { organization: true } }),
      this.db.emergencyStop.findMany({ where: { organizationId, status: "active", OR: [{ tenantInstanceId: null }, { tenantInstanceId }] } }),
      this.db.maintenanceWindow.findMany({ where: { status: "active", plannedStartAt: { lte: now }, plannedEndAt: { gt: now } } }),
    ]);
    if (!organization || organization.organizationId !== organizationId) throw new Error("TENANT_POLICY_TARGET_MISMATCH");
    const applicableMaintenance = maintenance.filter(item => Array.isArray(item.affectedTenantIds) && (item.affectedTenantIds.length === 0 || item.affectedTenantIds.includes(tenantInstanceId)));
    const blockedScopes = stops.flatMap(stop => Array.isArray(stop.blockedScopes) ? stop.blockedScopes.filter((scope): scope is string => typeof scope === "string") : []);
    const fullStop = stops.some(stop => stop.mode === "full_stop") || applicableMaintenance.some(item => item.mode === "full_stop");
    const readOnly = stops.some(stop => stop.mode === "read_only") || applicableMaintenance.some(item => item.mode === "read_only");
    return {
      organizationStatus: organization.organization.status,
      mode: fullStop ? "full_stop" as const : readOnly ? "read_only" as const : "normal" as const,
      blockedScopes,
      maintenanceMessage: applicableMaintenance[0]?.message,
    };
  }

  async findById(id: SupportSessionId): Promise<SupportSessionContract | null> {
    const row = await this.db.platformSupportSession.findUnique({
      where: { id },
      include: { tenantInstance: true },
    });
    if (!row || row.status !== "active") return null;
    return mapSupportSession(row as PlatformSupportSessionRow);
  }
}

export class PrismaTenantRequestAuditPort implements TenantRequestAuditPort {
  constructor(private readonly db: PlatformTenantRuntimePrismaClientLike) {}

  async record(event: TenantRequestAuditEvent): Promise<void> {
    if (event.actorKind !== "platform") return;
    await this.db.platformAuditLog.create({
      data: {
        id: auditId(event),
        organizationId: event.organizationId,
        tenantInstanceId: event.tenantInstanceId,
        actorUserId: event.actorUserId,
        action: "tenant.support.access",
        targetType: "TenantInstance",
        targetId: event.tenantInstanceId,
        requestId: event.requestId,
        supportSessionId: event.supportSessionId,
        result: event.result,
        metadata: {
          traceId: event.traceId,
          requestedScope: event.requestedScope,
          supportReason: event.supportReason ?? null,
          failureCode: event.failureCode ?? null,
        },
        occurredAt: new Date(event.occurredAt),
      },
    });
  }
}

function mapDescriptor(row: TenantRuntimeDescriptorRow): PlatformTenantDescriptor {
  const health = row.healthSnapshots[0];
  return {
    organizationId: row.organizationId as OrganizationId,
    organizationStatus: row.organization.status as PlatformTenantDescriptor["organizationStatus"],
    tenantInstanceId: row.id as TenantInstanceId,
    slug: row.slug as TenantSlug,
    displayName: row.displayName,
    deploymentMode: "managed",
    provisioningStatus: row.provisioningStatus as PlatformTenantDescriptor["provisioningStatus"],
    runtimeStatus: row.runtimeStatus as PlatformTenantDescriptor["runtimeStatus"],
    releaseChannel: row.releaseChannel as PlatformTenantDescriptor["releaseChannel"],
    currentVersion: health?.version ?? undefined,
    databaseRef: {
      id: row.databaseRef.id as TenantDatabaseRefId,
      engine: row.databaseRef.engine as "postgresql",
      managed: row.databaseRef.managed,
      region: row.databaseRef.region ?? undefined,
    },
    databaseRefStatus: row.databaseRef.status as PlatformTenantDescriptor["databaseRefStatus"],
    moduleEntitlements: [],
    limits: {},
    backupSummary: health ? {
      lastBackupAt: health.lastBackupAt?.toISOString(),
      lastVerifiedRestoreAt: health.lastRestoreDrillAt?.toISOString(),
      status: health.lastBackupAt ? "ok" : "unknown",
    } : undefined,
    lastHealthAt: health?.checkedAt.toISOString(),
  };
}

function mapCustomDomain(row: TenantCustomDomainRow) {
  const hostname = row.hostname.trim().toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9.-]{0,251}[a-z0-9])?$/.test(hostname) || hostname.includes("..")) {
    throw new Error("TENANT_CUSTOM_DOMAIN_INVALID");
  }
  return {
    hostname,
    tenantSlug: row.tenantInstance.slug as TenantSlug,
    status: row.status as CustomDomainStatus,
    dnsVerified: row.dnsVerified,
    tlsReady: row.tlsReady,
  };
}

function mapSupportSession(row: PlatformSupportSessionRow): SupportSessionContract {
  if (row.tenantInstance.organizationId !== row.organizationId) {
    throw new Error("SUPPORT_SESSION_ORGANIZATION_MISMATCH");
  }
  const scopes = Array.isArray(row.scopes) && row.scopes.every((scope) => typeof scope === "string")
    ? row.scopes
    : undefined;
  if (!scopes) throw new Error("SUPPORT_SESSION_SCOPES_INVALID");
  return {
    id: row.id as SupportSessionId,
    organizationId: row.organizationId as OrganizationId,
    tenantInstanceId: row.tenantInstanceId as TenantInstanceId,
    reason: row.reason,
    approvedByUserId: row.approvedByUserId as UserId,
    startsAt: row.startsAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    scopes,
  };
}

function auditId(event: TenantRequestAuditEvent): string {
  const safeRequestId = event.requestId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
  const suffix = randomUUID().replace(/-/g, "").slice(0, 12);
  return `audit_${safeRequestId}_${suffix}`;
}
