import {
  type CustomDomainConfigEntry,
  type TilbeCoreDomainConfig,
  resolveHost,
} from "@tilbecore/config";
import type {
  PlatformTenantDescriptor,
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

export interface TenantSessionIdentity {
  tenantInstanceId: TenantInstanceId;
  databaseRefId: TenantDatabaseRefId;
  userId?: string;
  roleIds: readonly string[];
}

export interface ResolveTenantRequest {
  hostHeader: string;
  requestId: string;
  session?: TenantSessionIdentity;
}

export async function resolveTenantRuntimeContext(
  config: TilbeCoreDomainConfig,
  registry: TenantRegistry,
  request: ResolveTenantRequest,
): Promise<TenantRuntimeContext> {
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

  return {
    organizationId: descriptor.organizationId,
    tenantInstanceId: descriptor.tenantInstanceId,
    slug: descriptor.slug,
    databaseRefId: descriptor.databaseRef.id,
    deploymentMode: descriptor.deploymentMode,
    requestId: request.requestId,
    actor: request.session?.userId
      ? {
          userId: request.session.userId as UserId,
          roleIds: [...request.session.roleIds],
        }
      : undefined,
  };
}

export function assertTenantActive(descriptor: PlatformTenantDescriptor): void {
  if (descriptor.provisioningStatus !== "active" && descriptor.provisioningStatus !== "maintenance") {
    throw new Error(`TENANT_NOT_ACTIVE:${descriptor.provisioningStatus}`);
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
  if (session.tenantInstanceId !== descriptor.tenantInstanceId) {
    throw new Error("TENANT_SESSION_MISMATCH");
  }
  if (session.databaseRefId !== descriptor.databaseRef.id) {
    throw new Error("TENANT_SESSION_DATABASE_REF_MISMATCH");
  }
}
