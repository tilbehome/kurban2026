import type { TenantDatabaseRef, TenantDatabaseRefId, TenantInstanceId } from "@tilbecore/contracts";

export interface TenantConnectionRequest {
  tenantInstanceId: TenantInstanceId;
  expectedDatabaseRefId: TenantDatabaseRefId;
  resolvedDatabaseRef: TenantDatabaseRef;
}

export interface TenantConnectionPoolKey {
  tenantInstanceId: TenantInstanceId;
  databaseRefId: TenantDatabaseRefId;
}

export function createTenantConnectionPoolKey(
  request: TenantConnectionRequest,
): TenantConnectionPoolKey {
  if (request.resolvedDatabaseRef.id !== request.expectedDatabaseRefId) {
    throw new Error("TENANT_DATABASE_REF_FAIL_CLOSED");
  }
  if (request.resolvedDatabaseRef.engine !== "postgresql") {
    throw new Error("TENANT_DATABASE_ENGINE_UNSUPPORTED");
  }
  return {
    tenantInstanceId: request.tenantInstanceId,
    databaseRefId: request.resolvedDatabaseRef.id,
  };
}

export function assertNoConnectionSecretLeavesBoundary(value: unknown): void {
  const serialized = JSON.stringify(value);
  if (/postgresql:\/\/|password|secret|token|connectionString|databaseUrl/i.test(serialized)) {
    throw new Error("TENANT_CONNECTION_SECRET_LEAK");
  }
}
