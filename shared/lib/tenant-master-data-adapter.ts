import { createHash, randomUUID } from "node:crypto";
import { PrismaClient as TenantPrismaClient } from "@/packages/database-tenant/generated/client";
import { PrismaTenantMasterDataRepository } from "@/packages/database-tenant/src/repositories/prisma-tenant-master-data-repository";
import { PrismaTenantAuthorizationRepository } from "@/packages/database-tenant/src/repositories/prisma-tenant-authorization-repository";
import { PrismaTenantSalesFinanceRepository } from "@/packages/database-tenant/src/repositories/prisma-tenant-sales-finance-repository";
import { PrismaTenantOperationsRepository } from "@/packages/database-tenant/src/repositories/prisma-tenant-operations-repository";
import { IDENTITY_AUTHORIZATION_MANIFEST, TenantAuthorizationService, TenantMasterDataService, TenantOperationsService, TenantSalesFinanceService, type AuthorizationActor, type TenantUseCaseContext } from "@/packages/tenant-core/src";
import type { AuthOturum } from "@/shared/types/module.types";
import type { TenantInstanceId, UserId } from "@tilbecore/contracts";

type MasterDataMode = "legacy" | "postgres";

declare global {
  var tenantMasterDataClient: TenantPrismaClient | undefined;
}

let service: TenantMasterDataService | undefined;
let salesFinanceService: TenantSalesFinanceService | undefined;
let operationsService: TenantOperationsService | undefined;
let authorizationService: TenantAuthorizationService | undefined;

function tenantClient(): TenantPrismaClient {
  const databaseUrl = process.env.TENANT_DATABASE_URL;
  if (!databaseUrl) throw new Error("TENANT_DATABASE_URL_REQUIRED");
  const client = globalThis.tenantMasterDataClient ?? new TenantPrismaClient({ datasources: { db: { url: databaseUrl } } });
  if (process.env.NODE_ENV !== "production") globalThis.tenantMasterDataClient = client;
  return client;
}

export function tenantAuthorizationMode(): "database" | "legacy_bridge" {
  const mode = process.env.TENANT_AUTHORIZATION_MODE?.trim().toLowerCase() || "legacy_bridge";
  if (mode !== "database" && mode !== "legacy_bridge") throw new Error("TENANT_AUTHORIZATION_MODE_INVALID");
  return mode;
}

export function masterDataMode(): MasterDataMode {
  const mode = process.env.TENANT_MASTER_DATA_MODE?.trim().toLowerCase() || "legacy";
  if (mode !== "legacy" && mode !== "postgres") throw new Error("TENANT_MASTER_DATA_MODE_INVALID");
  return mode;
}

export function tenantMasterDataService(): TenantMasterDataService {
  if (masterDataMode() !== "postgres") throw new Error("TENANT_MASTER_DATA_POSTGRES_NOT_ENABLED");
  if (!service) {
    const client = tenantClient();
    service = new TenantMasterDataService(new PrismaTenantMasterDataRepository(client), tenantAuthorizationService());
  }
  return service;
}

export function tenantSalesFinanceService(): TenantSalesFinanceService {
  if (masterDataMode() !== "postgres") throw new Error("TENANT_SALES_FINANCE_POSTGRES_NOT_ENABLED");
  if (!salesFinanceService) {
    const client = tenantClient();
    salesFinanceService = new TenantSalesFinanceService(new PrismaTenantSalesFinanceRepository(client), tenantAuthorizationService());
  }
  return salesFinanceService;
}

export function tenantOperationsService(): TenantOperationsService {
  if (masterDataMode() !== "postgres") throw new Error("TENANT_OPERATIONS_POSTGRES_NOT_ENABLED");
  if (!operationsService) {
    const client = tenantClient();
    operationsService = new TenantOperationsService(new PrismaTenantOperationsRepository(client), tenantAuthorizationService());
  }
  return operationsService;
}

export function tenantAuthorizationService(): TenantAuthorizationService {
  if (masterDataMode() !== "postgres") throw new Error("TENANT_AUTHORIZATION_POSTGRES_NOT_ENABLED");
  if (!authorizationService) authorizationService = new TenantAuthorizationService(new PrismaTenantAuthorizationRepository(tenantClient()));
  return authorizationService;
}

export function tenantAuthorizationActor(session: AuthOturum, request: Request): AuthorizationActor {
  const context = tenantUseCaseContext(session, { request, readOnly: true });
  if (!context.organizationMembershipId || !context.actorIdentityId) throw new Error("ORGANIZATION_MEMBERSHIP_REQUIRED");
  return {
    subject: { kind: context.identityKind ?? "ORGANIZATION_USER", id: context.actorIdentityId, organizationMembershipId: context.organizationMembershipId, sessionId: context.sessionId },
    context: {
      tenantInstanceId: context.tenantInstanceId,
      organizationId: context.organizationId,
      facilityId: context.facilityId,
      departmentId: context.departmentId,
      operationalPeriodId: context.operationalPeriodId,
      occurredAt: context.occurredAt,
      trustedDevice: context.trustedDevice ?? false,
      network: context.network,
      mfaLevel: context.mfaLevel ?? 0,
      requestId: context.requestId,
    },
    lastReauthenticatedAt: context.lastReauthenticatedAt,
  };
}

export async function bindLegacyOrganizationSession(input: { legacyUserId: string; displayName: string; legacyRole: AuthOturum["rol"] }): Promise<Partial<AuthOturum> | undefined> {
  if (masterDataMode() !== "postgres") return undefined;
  const client = tenantClient();
  const mode = tenantAuthorizationMode();
  const now = new Date();
  const loadUser = () => client.organizationUser.findUnique({
    where: { legacyUserId: input.legacyUserId },
    include: { memberships: { where: { status: "active", validFrom: { lte: now }, OR: [{ validUntil: null }, { validUntil: { gt: now } }] }, orderBy: { createdAt: "asc" as const }, take: 1 } },
  });
  let user: Awaited<ReturnType<typeof loadUser>>;
  try {
    user = await loadUser();
  } catch (error) {
    if (mode === "legacy_bridge") return undefined;
    throw error;
  }
  let membership = user?.status === "active" ? user.memberships[0] : undefined;
  if ((!user || !membership) && mode === "database" && process.env.TENANT_AUTHORIZATION_BOOTSTRAP_LEGACY_OWNER === "true" && input.legacyRole === "admin") {
    const repository = new PrismaTenantAuthorizationRepository(client);
    await repository.bootstrapFirstOrganizationOwner({
      organizationUserId: `organization_user_${randomUUID()}`,
      membershipId: `organization_membership_${randomUUID()}`,
      membershipRoleId: `membership_role_${randomUUID()}`,
      legacyUserId: input.legacyUserId,
      displayName: input.displayName,
    }, IDENTITY_AUTHORIZATION_MANIFEST);
    user = await client.organizationUser.findUnique({ where: { legacyUserId: input.legacyUserId }, include: { memberships: { where: { status: "active" }, orderBy: { createdAt: "asc" }, take: 1 } } });
    membership = user?.memberships[0];
  }
  if (!user || !membership) {
    if (mode === "database") throw new Error("ORGANIZATION_MEMBERSHIP_REQUIRED");
    return undefined;
  }
  const id = `user_session_${randomUUID()}`;
  const rawBinding = randomUUID();
  try {
    await client.userSession.create({ data: {
      id,
      organizationMembershipId: membership.id,
      tokenHash: createHash("sha256").update(rawBinding).digest("hex"),
      status: "active",
      mfaLevel: 1,
      authenticatedAt: now,
      lastReauthenticatedAt: now,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    } });
  } catch (error) {
    if (mode === "legacy_bridge") return undefined;
    throw error;
  }
  return {
    identityKind: "ORGANIZATION_USER",
    organizationUserId: user.id,
    organizationMembershipId: membership.id,
    tenantSessionId: id,
    trustedDevice: false,
    mfaLevel: 1,
    lastReauthenticatedAt: now.toISOString(),
  };
}

export async function revokeTenantUserSession(id: string | undefined): Promise<void> {
  if (!id || masterDataMode() !== "postgres") return;
  await tenantClient().userSession.updateMany({ where: { id, revokedAt: null }, data: { status: "revoked", revokedAt: new Date() } });
}

export async function markTenantSessionReauthenticated(id: string | undefined, occurredAt: Date): Promise<void> {
  if (!id || masterDataMode() !== "postgres") return;
  const changed = await tenantClient().userSession.updateMany({ where: { id, status: "active", revokedAt: null, expiresAt: { gt: occurredAt } }, data: { lastReauthenticatedAt: occurredAt } });
  if (tenantAuthorizationMode() === "database" && changed.count !== 1) throw new Error("TENANT_SESSION_NOT_ACTIVE");
}

export function tenantActiveSeasonId(): string {
  const id = tenantConfiguredActiveSeasonId();
  if (!id) throw new Error("TENANT_ACTIVE_SEASON_ID_REQUIRED");
  return id;
}

export function tenantConfiguredActiveSeasonId(): string | undefined {
  return process.env.TENANT_ACTIVE_SEASON_ID?.trim() || undefined;
}

export function tenantUseCaseContext(
  session: AuthOturum,
  options: { request?: Request; payload?: unknown; idempotencyKey?: string; readOnly?: boolean; approval?: TenantUseCaseContext["approval"] } = {},
): TenantUseCaseContext {
  const tenantInstanceId = process.env.TENANT_INSTANCE_ID?.trim();
  if (!tenantInstanceId) throw new Error("TENANT_INSTANCE_ID_REQUIRED");
  const requestId = safeRequestId(options.request?.headers.get("x-request-id")) ?? `req_${randomUUID()}`;
  const headerKey = options.request?.headers.get("idempotency-key") ?? undefined;
  const idempotencyKey = options.idempotencyKey ?? headerKey ?? `${options.readOnly ? "read" : "cmd"}_${requestId}`;
  return {
    tenantInstanceId: tenantInstanceId as TenantInstanceId,
    actorUserId: session.kullaniciId as UserId,
    identityKind: session.identityKind,
    actorIdentityId: session.organizationUserId,
    organizationMembershipId: session.organizationMembershipId,
    sessionId: session.tenantSessionId,
    organizationId: session.organizationId ?? (process.env.TENANT_ORGANIZATION_ID?.trim() || undefined),
    facilityId: session.facilityId,
    departmentId: session.departmentId,
    trustedDevice: session.trustedDevice,
    network: session.networkFingerprint,
    mfaLevel: session.mfaLevel,
    lastReauthenticatedAt: session.lastReauthenticatedAt,
    authorizationMode: tenantAuthorizationMode(),
    approval: options.approval,
    permissions: permissionsForRole(session.rol),
    requestId,
    idempotencyKey,
    requestHash: createHash("sha256").update(stableSerialize(options.payload ?? null)).digest("hex"),
    occurredAt: new Date().toISOString(),
  };
}

function permissionsForRole(role: AuthOturum["rol"]): readonly string[] {
  if (role === "admin") return ["*"];
  if (role === "kasiyer") return [
    "kurban.season.read.organization", "kurban.customer.read.organization", "kurban.customer.manage.organization",
    "kurban.supplier.read.organization", "kurban.supplier.manage.organization", "kurban.purchase.manage.organization",
    "kurban.expense.manage.organization", "kurban.animal.read.organization", "kurban.animal.manage.organization",
    "kurban.animal-health.manage.assigned_record", "kurban.qurban-queue.manage.operational_period",
    "kurban.pricing.manage.organization", "kurban.share.read.operational_period", "kurban.share.reserve.operational_period",
    "kurban.sale.confirm.operational_period", "kurban.sale.cancel.operational_period", "kurban.sale.transfer.operational_period",
    "kurban.finance.receipt.create.organization", "kurban.finance.ledger.read.organization",
    "qurban.proxy.manage.operational_period", "qurban.proxy.read.operational_period", "qurban.document.manage.operational_period",
    "qurban.qr.issue.operational_period", "qurban.qr.consume.operational_period", "qurban.slaughter.manage.operational_period",
    "operations.weighing.record.assigned_record", "operations.packaging.manage.assigned_record", "inventory.cold_storage.manage.facility",
    "logistics.delivery.manage.operational_period", "field.pwa.sync.assigned_record", "public.tv.read.organization",
    "public.tracking.read.assigned_record", "devices.adapters.manage.organization",
  ];
  if (role === "izleyici") return ["kurban.season.read.organization", "kurban.customer.read.organization", "kurban.supplier.read.organization", "kurban.animal.read.organization", "kurban.share.read.operational_period", "kurban.finance.ledger.read.organization", "public.tv.read.organization", "public.tracking.read.assigned_record"];
  return [];
}

function safeRequestId(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  return /^[a-zA-Z0-9._:-]{8,128}$/.test(value) ? value : undefined;
}

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stableSerialize(item)}`).join(",")}}`;
}
