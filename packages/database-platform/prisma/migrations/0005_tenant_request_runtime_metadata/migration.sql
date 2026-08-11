ALTER TABLE "PlatformAuditLog"
  ADD COLUMN "tenantInstanceId" TEXT;

CREATE INDEX "PlatformAuditLog_tenantInstanceId_idx"
  ON "PlatformAuditLog"("tenantInstanceId");

ALTER TABLE "PlatformAuditLog"
  ADD CONSTRAINT "PlatformAuditLog_tenantInstanceId_fkey"
  FOREIGN KEY ("tenantInstanceId") REFERENCES "TenantInstance"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "TenantCustomDomain" (
  "id" TEXT NOT NULL,
  "tenantInstanceId" TEXT NOT NULL,
  "hostname" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "dnsVerified" BOOLEAN NOT NULL DEFAULT false,
  "tlsReady" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TenantCustomDomain_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TenantCustomDomain_status_check"
    CHECK ("status" IN ('PENDING', 'VERIFYING', 'VERIFIED', 'ACTIVE', 'FAILED', 'SUSPENDED', 'REMOVED')),
  CONSTRAINT "TenantCustomDomain_tenantInstanceId_fkey"
    FOREIGN KEY ("tenantInstanceId") REFERENCES "TenantInstance"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "TenantCustomDomain_hostname_key" ON "TenantCustomDomain"("hostname");
CREATE INDEX "TenantCustomDomain_tenantInstanceId_idx" ON "TenantCustomDomain"("tenantInstanceId");

CREATE TABLE "PlatformSupportSession" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "tenantInstanceId" TEXT NOT NULL,
  "platformUserId" TEXT NOT NULL,
  "approvedByUserId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "scopes" JSONB NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformSupportSession_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PlatformSupportSession_status_check"
    CHECK ("status" IN ('active', 'revoked', 'expired')),
  CONSTRAINT "PlatformSupportSession_time_check"
    CHECK ("expiresAt" > "startsAt"),
  CONSTRAINT "PlatformSupportSession_reason_check"
    CHECK (char_length(trim("reason")) >= 3),
  CONSTRAINT "PlatformSupportSession_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PlatformSupportSession_tenantInstanceId_fkey"
    FOREIGN KEY ("tenantInstanceId") REFERENCES "TenantInstance"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PlatformSupportSession_platformUserId_fkey"
    FOREIGN KEY ("platformUserId") REFERENCES "PlatformUser"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "PlatformSupportSession_organizationId_idx" ON "PlatformSupportSession"("organizationId");
CREATE INDEX "PlatformSupportSession_tenantInstanceId_idx" ON "PlatformSupportSession"("tenantInstanceId");
CREATE INDEX "PlatformSupportSession_platformUserId_idx" ON "PlatformSupportSession"("platformUserId");
CREATE INDEX "PlatformSupportSession_expiresAt_idx" ON "PlatformSupportSession"("expiresAt");
