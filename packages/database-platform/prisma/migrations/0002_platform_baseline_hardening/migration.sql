ALTER TABLE "PlatformUser" DROP CONSTRAINT IF EXISTS "PlatformUser_organizationId_fkey";
ALTER TABLE "PlatformUser" DROP COLUMN IF EXISTS "organizationId";

ALTER TABLE "PlatformPlan" ADD COLUMN "maxUsers" INTEGER;
ALTER TABLE "PlatformPlan" ADD COLUMN "maxDevices" INTEGER;
ALTER TABLE "PlatformPlan" ADD COLUMN "maxStorageMb" INTEGER;

ALTER TABLE "PlatformPlanModule" ADD COLUMN "validUntil" TIMESTAMP(3);
ALTER TABLE "PlatformPlanModule" DROP COLUMN IF EXISTS "maxUsers";
ALTER TABLE "PlatformPlanModule" DROP COLUMN IF EXISTS "maxDevices";
ALTER TABLE "PlatformPlanModule" DROP COLUMN IF EXISTS "maxStorageMb";

ALTER TABLE "PlatformLicense" ADD COLUMN "maxUsers" INTEGER;
ALTER TABLE "PlatformLicense" ADD COLUMN "maxDevices" INTEGER;
ALTER TABLE "PlatformLicense" ADD COLUMN "maxStorageMb" INTEGER;

ALTER TABLE "PlatformLicenseEntitlement" ADD COLUMN "validUntil" TIMESTAMP(3);
ALTER TABLE "PlatformLicenseEntitlement" DROP COLUMN IF EXISTS "maxUsers";
ALTER TABLE "PlatformLicenseEntitlement" DROP COLUMN IF EXISTS "maxDevices";
ALTER TABLE "PlatformLicenseEntitlement" DROP COLUMN IF EXISTS "maxStorageMb";

ALTER TABLE "Organization" ADD CONSTRAINT "Organization_status_check"
  CHECK ("status" IN ('draft', 'active', 'suspended', 'closed'));

ALTER TABLE "TenantInstance" ADD CONSTRAINT "TenantInstance_provisioningStatus_check"
  CHECK ("provisioningStatus" IN ('draft', 'provisioning', 'active', 'maintenance', 'suspended', 'failed', 'closed'));

ALTER TABLE "TenantInstance" ADD CONSTRAINT "TenantInstance_runtimeStatus_check"
  CHECK ("runtimeStatus" IN ('unknown', 'healthy', 'degraded', 'offline'));

ALTER TABLE "TenantInstance" ADD CONSTRAINT "TenantInstance_releaseChannel_check"
  CHECK ("releaseChannel" IN ('stable', 'preview', 'pilot'));

ALTER TABLE "TenantDatabaseRef" ADD CONSTRAINT "TenantDatabaseRef_engine_check"
  CHECK ("engine" = 'postgresql');

ALTER TABLE "TenantDatabaseRef" ADD CONSTRAINT "TenantDatabaseRef_status_check"
  CHECK ("status" IN ('active', 'suspended', 'removed'));

ALTER TABLE "PlatformPlan" ADD CONSTRAINT "PlatformPlan_status_check"
  CHECK ("status" IN ('draft', 'active', 'retired'));

ALTER TABLE "PlatformModule" ADD CONSTRAINT "PlatformModule_status_check"
  CHECK ("status" IN ('active', 'retired'));

ALTER TABLE "PlatformLicense" ADD CONSTRAINT "PlatformLicense_status_check"
  CHECK ("status" IN ('draft', 'active', 'suspended', 'expired', 'cancelled'));

ALTER TABLE "PlatformPlan" ADD CONSTRAINT "PlatformPlan_limits_check"
  CHECK (
    ("maxUsers" IS NULL OR "maxUsers" >= 0)
    AND ("maxDevices" IS NULL OR "maxDevices" >= 0)
    AND ("maxStorageMb" IS NULL OR "maxStorageMb" >= 0)
  );

ALTER TABLE "PlatformLicense" ADD CONSTRAINT "PlatformLicense_limits_check"
  CHECK (
    ("maxUsers" IS NULL OR "maxUsers" >= 0)
    AND ("maxDevices" IS NULL OR "maxDevices" >= 0)
    AND ("maxStorageMb" IS NULL OR "maxStorageMb" >= 0)
  );
