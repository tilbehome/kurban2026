import {
  type CustomDomainConfigEntry,
  type TilbeCoreDomainConfig,
  resolveHost,
} from "@tilbecore/config";
import type {
  PlatformTenantDescriptor,
  SupportSessionId,
  TenantDatabaseRefId,
  TenantInstanceId,
  TenantRuntimeContext,
  TenantSlug,
  UserId,
} from "@tilbecore/contracts";
import { assertPlatformTenantDescriptorSafe } from "@tilbecore/contracts";

export interface TenantRegistry {
  findBySlug(slug: TenantSlug): Promise<PlatformTenantDescriptor | null>;
  findCustomDomains(): Promise<readonly CustomDomainConfigEntry[]>;
}

export interface TenantUserSessionIdentity {
  kind: "tenant";
  organizationId: PlatformTenantDescriptor["organizationId"];
  tenantInstanceId: TenantInstanceId;
  databaseRefId: TenantDatabaseRefId;
  sessionId: string;
  userId: string;
  roleIds: readonly string[];
  permissions: readonly string[];
}

export interface PlatformUserSessionIdentity {
  kind: "platform";
  sessionId: string;
  userId: string;
  roleIds: readonly string[];
  permissions: readonly string[];
  supportSessionId?: string;
}

export interface PublicTrackingSessionIdentity {
  kind: "public_tracking";
  tenantInstanceId: TenantInstanceId;
  purpose: "customerTracking";
  tokenId: string;
}

export type TenantSessionIdentity =
  | TenantUserSessionIdentity
  | PlatformUserSessionIdentity
  | PublicTrackingSessionIdentity;

export interface ResolveTenantRequest {
  hostHeader: string;
  requestId: string;
  traceId?: string;
  session?: TenantSessionIdentity;
}

export interface ResolvedTenantRuntime {
  descriptor: PlatformTenantDescriptor;
  context: TenantRuntimeContext;
  normalizedHost: string;
}

export async function resolveTenantRuntimeContext(
  config: TilbeCoreDomainConfig,
  registry: TenantRegistry,
  request: ResolveTenantRequest,
): Promise<TenantRuntimeContext> {
  return (await resolveTenantRuntime(config, registry, request)).context;
}

export async function resolveTenantRuntime(
  config: TilbeCoreDomainConfig,
  registry: TenantRegistry,
  request: ResolveTenantRequest,
): Promise<ResolvedTenantRuntime> {
  const customDomains = await registry.findCustomDomains();
  const host = resolveHost(config, request.hostHeader, customDomains);
  if (!host.tenantSlug || (host.kind !== "tenant" && host.kind !== "customTenant")) {
    throw new Error(`TENANT_HOST_REQUIRED:${host.kind}`);
  }

  const descriptor = await registry.findBySlug(host.tenantSlug);
  if (!descriptor) throw new Error("TENANT_NOT_FOUND");
  assertPlatformTenantDescriptorSafe(descriptor);
  assertTenantActive(descriptor);
  assertSessionMatchesTenant(descriptor, request.session);

  const context: TenantRuntimeContext = {
    organizationId: descriptor.organizationId,
    tenantInstanceId: descriptor.tenantInstanceId,
    slug: descriptor.slug,
    databaseRefId: descriptor.databaseRef.id,
    deploymentMode: descriptor.deploymentMode,
    normalizedHost: host.normalizedHost,
    requestId: request.requestId,
    traceId: request.traceId ?? request.requestId,
    actor: request.session && request.session.kind !== "public_tracking"
      ? {
          userId: request.session.userId as UserId,
          roleIds: [...request.session.roleIds],
          supportSessionId: request.session.kind === "platform" && request.session.supportSessionId
            ? request.session.supportSessionId as SupportSessionId
            : undefined,
        }
      : undefined,
  };
  return { descriptor, context, normalizedHost: host.normalizedHost };
}

export function assertTenantActive(descriptor: PlatformTenantDescriptor): void {
  if (descriptor.organizationStatus !== "active") {
    throw new Error(`TENANT_ORGANIZATION_NOT_ACTIVE:${descriptor.organizationStatus}`);
  }
  if (descriptor.provisioningStatus !== "active") {
    throw new Error(`TENANT_NOT_ACTIVE:${descriptor.provisioningStatus}`);
  }
  if (descriptor.databaseRefStatus !== "active") {
    throw new Error(`TENANT_DATABASE_REF_NOT_ACTIVE:${descriptor.databaseRefStatus}`);
  }
  if (descriptor.databaseRef.engine !== "postgresql") {
    throw new Error("TENANT_DATABASE_ENGINE_UNSUPPORTED");
  }
}

export function assertSessionMatchesTenant(
  descriptor: PlatformTenantDescriptor,
  session: TenantSessionIdentity | undefined,
): void {
  if (!session) return;
  if (session.kind === "public_tracking") {
    throw new Error("PUBLIC_TRACKING_SESSION_NOT_TENANT_SESSION");
  }
  if (session.kind === "platform") return;
  if (session.organizationId !== descriptor.organizationId) {
    throw new Error("TENANT_SESSION_ORGANIZATION_MISMATCH");
  }
  if (session.tenantInstanceId !== descriptor.tenantInstanceId) {
    throw new Error("TENANT_SESSION_MISMATCH");
  }
  if (session.databaseRefId !== descriptor.databaseRef.id) {
    throw new Error("TENANT_SESSION_DATABASE_REF_MISMATCH");
  }
}
