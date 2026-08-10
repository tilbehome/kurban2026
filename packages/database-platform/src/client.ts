export const PLATFORM_DATABASE_URL_ENV = "PLATFORM_DATABASE_URL";
export const PLATFORM_TEST_DATABASE_URL_ENV = "PLATFORM_TEST_DATABASE_URL";

export interface PlatformPrismaDelegate<TEntity, TCreateInput, TWhereUnique> {
  create(args: { data: TCreateInput }): Promise<TEntity>;
  findUnique(args: { where: TWhereUnique }): Promise<TEntity | null>;
}

export interface PlatformPrismaLicenseDelegate<TEntity, TCreateInput, TWhereUnique>
  extends PlatformPrismaDelegate<TEntity, TCreateInput, TWhereUnique> {
  update(args: { where: TWhereUnique; data: Record<string, unknown> }): Promise<TEntity>;
}

export interface PlatformPrismaClientLike {
  organization: PlatformPrismaDelegate<unknown, Record<string, unknown>, { id?: string; slug?: string }>;
  tenantInstance: PlatformPrismaDelegate<unknown, Record<string, unknown>, { id?: string; slug?: string }>;
  platformPlan: PlatformPrismaDelegate<unknown, Record<string, unknown>, { id: string }>;
  platformLicense: PlatformPrismaLicenseDelegate<unknown, Record<string, unknown>, { id: string }>;
}
