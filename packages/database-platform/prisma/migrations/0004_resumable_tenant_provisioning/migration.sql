ALTER TABLE "PlatformProvisioningJob"
  DROP CONSTRAINT "PlatformProvisioningJob_organizationId_fkey",
  DROP CONSTRAINT "PlatformProvisioningJob_tenantInstanceId_fkey",
  DROP CONSTRAINT "PlatformProvisioningJob_databaseRefId_fkey";

ALTER TABLE "PlatformProvisioningJob"
  ADD COLUMN "idempotencyKey" TEXT,
  ADD COLUMN "commandFingerprint" TEXT,
  ADD COLUMN "currentStep" TEXT,
  ADD COLUMN "failureCode" TEXT,
  ADD COLUMN "databaseCreatedByJob" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "platformRegistrationCompleted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "rollbackStatus" TEXT;

UPDATE "PlatformProvisioningJob"
SET
  "idempotencyKey" = "id",
  "commandFingerprint" = "id"
WHERE "idempotencyKey" IS NULL OR "commandFingerprint" IS NULL;

ALTER TABLE "PlatformProvisioningJob"
  ALTER COLUMN "idempotencyKey" SET NOT NULL,
  ALTER COLUMN "commandFingerprint" SET NOT NULL;

ALTER TABLE "PlatformProvisioningJob"
  DROP CONSTRAINT "PlatformProvisioningJob_status_check";

ALTER TABLE "PlatformProvisioningJob"
  ADD CONSTRAINT "PlatformProvisioningJob_status_check"
  CHECK ("status" IN ('pending', 'running', 'succeeded', 'failed', 'rolled_back')),
  ADD CONSTRAINT "PlatformProvisioningJob_rollbackStatus_check"
  CHECK ("rollbackStatus" IS NULL OR "rollbackStatus" IN ('not_required', 'succeeded', 'failed'));

DROP INDEX "PlatformProvisioningJob_tenantInstanceId_idx";

CREATE UNIQUE INDEX "PlatformProvisioningJob_idempotencyKey_key"
  ON "PlatformProvisioningJob"("idempotencyKey");

CREATE UNIQUE INDEX "PlatformProvisioningJob_tenantInstanceId_key"
  ON "PlatformProvisioningJob"("tenantInstanceId");
