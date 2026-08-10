CREATE TABLE "PlatformMfaEnrollment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "method" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "activatedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "PlatformMfaEnrollment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PlatformMfaEnrollment_method_check" CHECK ("method" IN ('totp', 'webauthn_passkey', 'recovery_code')),
  CONSTRAINT "PlatformMfaEnrollment_status_check" CHECK ("status" IN ('pending', 'active', 'revoked'))
);

CREATE TABLE "PlatformDevice" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "userAgent" TEXT,
  "trustStatus" TEXT NOT NULL,
  "firstSeenAt" TIMESTAMP(3) NOT NULL,
  "lastSeenAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformDevice_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PlatformDevice_trustStatus_check" CHECK ("trustStatus" IN ('unknown', 'trusted', 'blocked'))
);

CREATE TABLE "PlatformSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "deviceId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "PlatformSession_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PlatformSession_status_check" CHECK ("status" IN ('active', 'revoked', 'expired'))
);

CREATE TABLE "PlatformProvisioningJob" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "tenantInstanceId" TEXT NOT NULL,
  "requestedByUserId" TEXT NOT NULL,
  "databaseRefId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "steps" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformProvisioningJob_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PlatformProvisioningJob_status_check" CHECK ("status" IN ('pending', 'running', 'succeeded', 'failed', 'skipped'))
);

CREATE TABLE "TenantHealthSnapshot" (
  "id" TEXT NOT NULL,
  "tenantInstanceId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "version" TEXT,
  "migrationVersion" TEXT,
  "lastBackupAt" TIMESTAMP(3),
  "lastRestoreDrillAt" TIMESTAMP(3),
  "checkedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TenantHealthSnapshot_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TenantHealthSnapshot_status_check" CHECK ("status" IN ('unknown', 'healthy', 'degraded', 'offline'))
);

CREATE TABLE "EmergencyStop" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "tenantInstanceId" TEXT,
  "moduleId" TEXT,
  "status" TEXT NOT NULL,
  "reason" TEXT,
  "changedByUserId" TEXT NOT NULL,
  "changedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmergencyStop_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EmergencyStop_status_check" CHECK ("status" IN ('inactive', 'active'))
);

CREATE TABLE "PlatformIncident" (
  "id" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "affectedTenantIds" JSONB NOT NULL,
  "openedAt" TIMESTAMP(3) NOT NULL,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "PlatformIncident_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PlatformIncident_severity_check" CHECK ("severity" IN ('info', 'warning', 'critical')),
  CONSTRAINT "PlatformIncident_status_check" CHECK ("status" IN ('open', 'investigating', 'resolved', 'cancelled'))
);

CREATE TABLE "MaintenanceWindow" (
  "id" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "affectedTenantIds" JSONB NOT NULL,
  "plannedStartAt" TIMESTAMP(3) NOT NULL,
  "plannedEndAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MaintenanceWindow_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MaintenanceWindow_status_check" CHECK ("status" IN ('planned', 'active', 'completed', 'cancelled')),
  CONSTRAINT "MaintenanceWindow_range_check" CHECK ("plannedEndAt" > "plannedStartAt")
);

CREATE TABLE "PlatformSupportTicketLink" (
  "ticketId" TEXT NOT NULL,
  "supportSessionId" TEXT NOT NULL,
  "linkedByUserId" TEXT NOT NULL,
  "linkedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformSupportTicketLink_pkey" PRIMARY KEY ("ticketId")
);

CREATE INDEX "PlatformMfaEnrollment_userId_idx" ON "PlatformMfaEnrollment"("userId");
CREATE INDEX "PlatformDevice_userId_idx" ON "PlatformDevice"("userId");
CREATE INDEX "PlatformSession_userId_idx" ON "PlatformSession"("userId");
CREATE INDEX "PlatformSession_deviceId_idx" ON "PlatformSession"("deviceId");
CREATE INDEX "PlatformProvisioningJob_organizationId_idx" ON "PlatformProvisioningJob"("organizationId");
CREATE INDEX "PlatformProvisioningJob_tenantInstanceId_idx" ON "PlatformProvisioningJob"("tenantInstanceId");
CREATE INDEX "PlatformProvisioningJob_requestedByUserId_idx" ON "PlatformProvisioningJob"("requestedByUserId");
CREATE INDEX "TenantHealthSnapshot_tenantInstanceId_idx" ON "TenantHealthSnapshot"("tenantInstanceId");
CREATE INDEX "EmergencyStop_organizationId_idx" ON "EmergencyStop"("organizationId");
CREATE INDEX "EmergencyStop_tenantInstanceId_idx" ON "EmergencyStop"("tenantInstanceId");
CREATE INDEX "EmergencyStop_moduleId_idx" ON "EmergencyStop"("moduleId");
CREATE INDEX "PlatformSupportTicketLink_supportSessionId_idx" ON "PlatformSupportTicketLink"("supportSessionId");
CREATE INDEX "PlatformSupportTicketLink_linkedByUserId_idx" ON "PlatformSupportTicketLink"("linkedByUserId");

ALTER TABLE "PlatformMfaEnrollment" ADD CONSTRAINT "PlatformMfaEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PlatformUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlatformDevice" ADD CONSTRAINT "PlatformDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PlatformUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlatformSession" ADD CONSTRAINT "PlatformSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PlatformUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlatformSession" ADD CONSTRAINT "PlatformSession_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "PlatformDevice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlatformProvisioningJob" ADD CONSTRAINT "PlatformProvisioningJob_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlatformProvisioningJob" ADD CONSTRAINT "PlatformProvisioningJob_tenantInstanceId_fkey" FOREIGN KEY ("tenantInstanceId") REFERENCES "TenantInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlatformProvisioningJob" ADD CONSTRAINT "PlatformProvisioningJob_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "PlatformUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlatformProvisioningJob" ADD CONSTRAINT "PlatformProvisioningJob_databaseRefId_fkey" FOREIGN KEY ("databaseRefId") REFERENCES "TenantDatabaseRef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TenantHealthSnapshot" ADD CONSTRAINT "TenantHealthSnapshot_tenantInstanceId_fkey" FOREIGN KEY ("tenantInstanceId") REFERENCES "TenantInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EmergencyStop" ADD CONSTRAINT "EmergencyStop_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EmergencyStop" ADD CONSTRAINT "EmergencyStop_tenantInstanceId_fkey" FOREIGN KEY ("tenantInstanceId") REFERENCES "TenantInstance"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmergencyStop" ADD CONSTRAINT "EmergencyStop_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "PlatformModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmergencyStop" ADD CONSTRAINT "EmergencyStop_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "PlatformUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlatformSupportTicketLink" ADD CONSTRAINT "PlatformSupportTicketLink_linkedByUserId_fkey" FOREIGN KEY ("linkedByUserId") REFERENCES "PlatformUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
