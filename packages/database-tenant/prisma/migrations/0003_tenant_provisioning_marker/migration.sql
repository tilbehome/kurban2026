CREATE TABLE IF NOT EXISTS "TenantProvisioningMarker" (
  "id" TEXT NOT NULL,
  "provisioningJobId" TEXT NOT NULL,
  "tenantInstanceId" TEXT NOT NULL,
  "databaseRefId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TenantProvisioningMarker_pkey" PRIMARY KEY ("id")
);
