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
>;

export type PlatformTransactionClient = Pick<
  Prisma.TransactionClient,
  | "organization"
  | "tenantDatabaseRef"
  | "tenantInstance"
  | "platformPlan"
  | "platformLicense"
  | "platformLicenseEntitlement"
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
