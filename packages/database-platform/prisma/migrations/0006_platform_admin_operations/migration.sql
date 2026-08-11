ALTER TABLE "Organization"
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Organization" DROP CONSTRAINT "Organization_status_check";
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_status_check"
  CHECK ("status" IN ('draft', 'provisioning', 'active', 'suspended', 'restricted', 'archived', 'provisioning_failed', 'closed'));

ALTER TABLE "PlatformPlan"
  ADD COLUMN "maxAnimals" INTEGER,
  ADD COLUMN "maxSeasons" INTEGER;

ALTER TABLE "PlatformPlan" DROP CONSTRAINT "PlatformPlan_limits_check";
ALTER TABLE "PlatformPlan" ADD CONSTRAINT "PlatformPlan_limits_check"
  CHECK (
    ("maxUsers" IS NULL OR "maxUsers" >= 0)
    AND ("maxDevices" IS NULL OR "maxDevices" >= 0)
    AND ("maxStorageMb" IS NULL OR "maxStorageMb" >= 0)
    AND ("maxAnimals" IS NULL OR "maxAnimals" >= 0)
    AND ("maxSeasons" IS NULL OR "maxSeasons" >= 0)
  );

ALTER TABLE "PlatformLicense"
  ADD COLUMN "maxAnimals" INTEGER,
  ADD COLUMN "maxSeasons" INTEGER,
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "PlatformLicense" DROP CONSTRAINT "PlatformLicense_limits_check";
ALTER TABLE "PlatformLicense" ADD CONSTRAINT "PlatformLicense_limits_check"
  CHECK (
    ("maxUsers" IS NULL OR "maxUsers" >= 0)
    AND ("maxDevices" IS NULL OR "maxDevices" >= 0)
    AND ("maxStorageMb" IS NULL OR "maxStorageMb" >= 0)
    AND ("maxAnimals" IS NULL OR "maxAnimals" >= 0)
    AND ("maxSeasons" IS NULL OR "maxSeasons" >= 0)
  );

ALTER TABLE "PlatformUser"
  ADD COLUMN "passwordHash" TEXT,
  ADD COLUMN "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lockedUntil" TIMESTAMP(3),
  ADD COLUMN "lastLoginAt" TIMESTAMP(3),
  ADD COLUMN "mfaRequired" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "authVersion" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "PlatformUser" ADD CONSTRAINT "PlatformUser_status_check"
  CHECK ("status" IN ('active', 'suspended', 'closed'));
ALTER TABLE "PlatformUser" ADD CONSTRAINT "PlatformUser_failedLoginCount_check"
  CHECK ("failedLoginCount" >= 0);

ALTER TABLE "PlatformRole"
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN "permissions" JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "PlatformRole" ADD CONSTRAINT "PlatformRole_status_check"
  CHECK ("status" IN ('active', 'suspended'));

ALTER TABLE "PlatformMfaEnrollment"
  ADD COLUMN "secretCiphertext" TEXT,
  ADD COLUMN "secretKeyVersion" TEXT;

ALTER TABLE "PlatformSession"
  ADD COLUMN "tokenHash" TEXT,
  ADD COLUMN "authVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "rotatedAt" TIMESTAMP(3),
  ADD COLUMN "ipHash" TEXT;
CREATE UNIQUE INDEX "PlatformSession_tokenHash_key" ON "PlatformSession"("tokenHash");

ALTER TABLE "TenantCustomDomain"
  ADD COLUMN "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "verifiedAt" TIMESTAMP(3),
  ADD COLUMN "failureCode" TEXT;

ALTER TABLE "PlatformSupportSession"
  ADD COLUMN "endedAt" TIMESTAMP(3),
  ADD COLUMN "revokedByUserId" TEXT,
  ADD COLUMN "revocationReason" TEXT;
CREATE INDEX "PlatformSupportSession_revokedByUserId_idx" ON "PlatformSupportSession"("revokedByUserId");
ALTER TABLE "PlatformSupportSession" ADD CONSTRAINT "PlatformSupportSession_revokedByUserId_fkey"
  FOREIGN KEY ("revokedByUserId") REFERENCES "PlatformUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "PlatformAdminCommand" (
  "id" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "organizationId" TEXT,
  "tenantInstanceId" TEXT,
  "requestedByUserId" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "traceId" TEXT NOT NULL,
  "approvalReason" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "version" INTEGER NOT NULL DEFAULT 0,
  "errorCode" TEXT,
  "resultRef" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformAdminCommand_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PlatformAdminCommand_type_check" CHECK ("type" IN (
    'tenant.provision', 'tenant.provision.resume', 'tenant.provision.rollback',
    'tenant.backup.create', 'tenant.backup.verify', 'tenant.restore.verify'
  )),
  CONSTRAINT "PlatformAdminCommand_status_check" CHECK ("status" IN ('pending', 'running', 'succeeded', 'failed', 'cancelled')),
  CONSTRAINT "PlatformAdminCommand_attempts_check" CHECK ("attempts" >= 0),
  CONSTRAINT "PlatformAdminCommand_reason_check" CHECK (char_length(trim("approvalReason")) >= 3)
);
CREATE UNIQUE INDEX "PlatformAdminCommand_idempotencyKey_key" ON "PlatformAdminCommand"("idempotencyKey");
CREATE INDEX "PlatformAdminCommand_status_createdAt_idx" ON "PlatformAdminCommand"("status", "createdAt");
CREATE INDEX "PlatformAdminCommand_organizationId_idx" ON "PlatformAdminCommand"("organizationId");
CREATE INDEX "PlatformAdminCommand_tenantInstanceId_idx" ON "PlatformAdminCommand"("tenantInstanceId");
CREATE INDEX "PlatformAdminCommand_requestedByUserId_idx" ON "PlatformAdminCommand"("requestedByUserId");
ALTER TABLE "PlatformAdminCommand" ADD CONSTRAINT "PlatformAdminCommand_requestedByUserId_fkey"
  FOREIGN KEY ("requestedByUserId") REFERENCES "PlatformUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "OrganizationLifecycleEvent" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "fromStatus" TEXT NOT NULL,
  "toStatus" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "impactSummary" TEXT NOT NULL,
  "approvedByUserId" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrganizationLifecycleEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OrganizationLifecycleEvent_reason_check" CHECK (char_length(trim("reason")) >= 3)
);
CREATE INDEX "OrganizationLifecycleEvent_organizationId_occurredAt_idx" ON "OrganizationLifecycleEvent"("organizationId", "occurredAt");
ALTER TABLE "OrganizationLifecycleEvent" ADD CONSTRAINT "OrganizationLifecycleEvent_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrganizationLifecycleEvent" ADD CONSTRAINT "OrganizationLifecycleEvent_approvedByUserId_fkey"
  FOREIGN KEY ("approvedByUserId") REFERENCES "PlatformUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "TenantAdminInvitation" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "tenantInstanceId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "roleKey" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "tokenHash" TEXT,
  "expiresAt" TIMESTAMP(3),
  "invitedByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acceptedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "TenantAdminInvitation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TenantAdminInvitation_status_check" CHECK ("status" IN ('prepared', 'sent', 'accepted', 'expired', 'revoked')),
  CONSTRAINT "TenantAdminInvitation_role_check" CHECK ("roleKey" = 'firm_admin')
);
CREATE UNIQUE INDEX "TenantAdminInvitation_tenantInstanceId_email_key" ON "TenantAdminInvitation"("tenantInstanceId", "email");
CREATE INDEX "TenantAdminInvitation_organizationId_idx" ON "TenantAdminInvitation"("organizationId");
CREATE INDEX "TenantAdminInvitation_invitedByUserId_idx" ON "TenantAdminInvitation"("invitedByUserId");
ALTER TABLE "TenantAdminInvitation" ADD CONSTRAINT "TenantAdminInvitation_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TenantAdminInvitation" ADD CONSTRAINT "TenantAdminInvitation_tenantInstanceId_fkey"
  FOREIGN KEY ("tenantInstanceId") REFERENCES "TenantInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TenantAdminInvitation" ADD CONSTRAINT "TenantAdminInvitation_invitedByUserId_fkey"
  FOREIGN KEY ("invitedByUserId") REFERENCES "PlatformUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "PlatformTenantBackup" (
  "id" TEXT NOT NULL,
  "tenantInstanceId" TEXT NOT NULL,
  "databaseRefId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "migrationVersion" TEXT NOT NULL,
  "checksumSha256" TEXT,
  "sizeBytes" BIGINT,
  "status" TEXT NOT NULL,
  "verificationStatus" TEXT NOT NULL,
  "verifiedAt" TIMESTAMP(3),
  "failureCode" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformTenantBackup_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PlatformTenantBackup_status_check" CHECK ("status" IN ('pending', 'completed', 'failed', 'verified')),
  CONSTRAINT "PlatformTenantBackup_verification_check" CHECK ("verificationStatus" IN ('not_started', 'running', 'verified', 'failed')),
  CONSTRAINT "PlatformTenantBackup_size_check" CHECK ("sizeBytes" IS NULL OR "sizeBytes" >= 0)
);
CREATE INDEX "PlatformTenantBackup_tenantInstanceId_createdAt_idx" ON "PlatformTenantBackup"("tenantInstanceId", "createdAt");
CREATE INDEX "PlatformTenantBackup_status_idx" ON "PlatformTenantBackup"("status");
ALTER TABLE "PlatformTenantBackup" ADD CONSTRAINT "PlatformTenantBackup_tenantInstanceId_fkey"
  FOREIGN KEY ("tenantInstanceId") REFERENCES "TenantInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "PlatformLicenseChange" (
  "id" TEXT NOT NULL,
  "licenseId" TEXT NOT NULL,
  "targetPlanId" TEXT NOT NULL,
  "effectiveAt" TIMESTAMP(3) NOT NULL,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "requestedByUserId" TEXT NOT NULL,
  "expectedVersion" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "appliedAt" TIMESTAMP(3),
  CONSTRAINT "PlatformLicenseChange_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PlatformLicenseChange_status_check" CHECK ("status" IN ('scheduled', 'applied', 'cancelled', 'failed')),
  CONSTRAINT "PlatformLicenseChange_reason_check" CHECK (char_length(trim("reason")) >= 3),
  CONSTRAINT "PlatformLicenseChange_version_check" CHECK ("expectedVersion" >= 0)
);
CREATE INDEX "PlatformLicenseChange_licenseId_effectiveAt_idx" ON "PlatformLicenseChange"("licenseId", "effectiveAt");
CREATE INDEX "PlatformLicenseChange_status_idx" ON "PlatformLicenseChange"("status");
ALTER TABLE "PlatformLicenseChange" ADD CONSTRAINT "PlatformLicenseChange_licenseId_fkey"
  FOREIGN KEY ("licenseId") REFERENCES "PlatformLicense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlatformLicenseChange" ADD CONSTRAINT "PlatformLicenseChange_targetPlanId_fkey"
  FOREIGN KEY ("targetPlanId") REFERENCES "PlatformPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlatformLicenseChange" ADD CONSTRAINT "PlatformLicenseChange_requestedByUserId_fkey"
  FOREIGN KEY ("requestedByUserId") REFERENCES "PlatformUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
