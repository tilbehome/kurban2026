export const TENANT_DATABASE_URL_ENV = "TENANT_DATABASE_URL";

export interface TenantDatabaseMigrationTarget {
  tenantInstanceId: string;
  databaseRefId: string;
  schemaName?: string;
}

export function assertTenantDatabaseTarget(target: TenantDatabaseMigrationTarget): void {
  if (!target.tenantInstanceId) throw new Error("TENANT_DATABASE_TARGET_TENANT_REQUIRED");
  if (!target.databaseRefId) throw new Error("TENANT_DATABASE_TARGET_REF_REQUIRED");
  if (target.schemaName && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(target.schemaName)) {
    throw new Error("TENANT_DATABASE_SCHEMA_INVALID");
  }
}

export * from "./postgres-tenant-database";
export * from "./repositories/prisma-tenant-master-data-repository";
export * from "./repositories/prisma-tenant-authorization-repository";
export * from "./repositories/prisma-tenant-sales-finance-repository";
export * from "./repositories/prisma-unit-of-measure-repository";
export * from "./postgres-tenant-backup";
