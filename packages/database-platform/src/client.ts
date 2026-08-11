import type { Prisma, PrismaClient } from "../generated/client";

export const PLATFORM_DATABASE_URL_ENV = "PLATFORM_DATABASE_URL";
export const PLATFORM_TEST_DATABASE_URL_ENV = "PLATFORM_TEST_DATABASE_URL";

export type PlatformPrismaClientLike = Pick<
  PrismaClient,
  | "$transaction"
  | "organization"
  | "tenantDatabaseRef"
  | "tenantInstance"
  | "platformPlan"
  | "platformLicense"
  | "platformLicenseEntitlement"
  | "platformUser"
  | "platformRole"
  | "platformUserRole"
  | "platformProvisioningJob"
  | "tenantCustomDomain"
  | "platformSupportSession"
  | "platformAuditLog"
>;

export type PlatformTenantRuntimePrismaClientLike = Pick<
  PrismaClient,
  "tenantInstance" | "tenantCustomDomain" | "platformSupportSession" | "platformAuditLog"
>;

export type PlatformProvisioningPrismaClientLike = Pick<
  PrismaClient,
  "platformProvisioningJob"
>;

export type PlatformTransactionClient = Pick<
  Prisma.TransactionClient,
  | "organization"
  | "tenantDatabaseRef"
  | "tenantInstance"
  | "platformPlan"
  | "platformLicense"
  | "platformLicenseEntitlement"
  | "platformUser"
  | "platformRole"
  | "platformUserRole"
>;

export type OrganizationRow = Prisma.OrganizationGetPayload<object>;
export type TenantDatabaseRefRow = Prisma.TenantDatabaseRefGetPayload<object>;
export type TenantInstanceWithDatabaseRefRow = Prisma.TenantInstanceGetPayload<{
  include: { databaseRef: true };
}>;
export type PlatformPlanWithModulesRow = Prisma.PlatformPlanGetPayload<{
  include: { modules: true };
}>;
export type PlatformLicenseWithEntitlementsRow = Prisma.PlatformLicenseGetPayload<{
  include: { entitlements: true };
}>;
export type PlatformRoleRow = Prisma.PlatformRoleGetPayload<object>;
export type PlatformUserWithRolesRow = Prisma.PlatformUserGetPayload<{
  include: { roles: { include: { role: true } } };
}>;
export type PlatformProvisioningJobRow = Prisma.PlatformProvisioningJobGetPayload<object>;
export type TenantRuntimeDescriptorRow = Prisma.TenantInstanceGetPayload<{
  include: { databaseRef: true; organization: true; healthSnapshots: true };
}>;
export type TenantCustomDomainRow = Prisma.TenantCustomDomainGetPayload<{
  include: { tenantInstance: true };
}>;
export type PlatformSupportSessionRow = Prisma.PlatformSupportSessionGetPayload<{
  include: { tenantInstance: true };
}>;
