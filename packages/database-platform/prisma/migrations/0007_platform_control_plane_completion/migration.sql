ALTER TABLE "PlatformSession" ADD COLUMN "lastReauthenticatedAt" TIMESTAMP(3);
ALTER TABLE "Organization" ADD COLUMN "ownerContactRef" TEXT;

ALTER TABLE "EmergencyStop"
  ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'full_stop',
  ADD COLUMN "blockedScopes" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "EmergencyStop" ADD CONSTRAINT "EmergencyStop_mode_check"
  CHECK ("mode" IN ('full_stop', 'read_only', 'module_stop'));

ALTER TABLE "PlatformIncident"
  ADD COLUMN "organizationId" TEXT,
  ADD COLUMN "message" TEXT NOT NULL DEFAULT 'Platform olayı',
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "createdByUserId" TEXT;
CREATE INDEX "PlatformIncident_status_openedAt_idx" ON "PlatformIncident"("status", "openedAt");
ALTER TABLE "PlatformIncident" ADD CONSTRAINT "PlatformIncident_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "PlatformUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PlatformIncident"
  ALTER COLUMN "message" DROP DEFAULT,
  ALTER COLUMN "updatedAt" DROP DEFAULT;

ALTER TABLE "MaintenanceWindow"
  ADD COLUMN "message" TEXT NOT NULL DEFAULT 'Planlı bakım',
  ADD COLUMN "startedAt" TIMESTAMP(3),
  ADD COLUMN "endedAt" TIMESTAMP(3),
  ADD COLUMN "cancelledAt" TIMESTAMP(3),
  ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'read_only',
  ADD COLUMN "createdByUserId" TEXT;
CREATE INDEX "MaintenanceWindow_status_plannedStartAt_idx" ON "MaintenanceWindow"("status", "plannedStartAt");
ALTER TABLE "MaintenanceWindow" ADD CONSTRAINT "MaintenanceWindow_mode_check"
  CHECK ("mode" IN ('read_only', 'full_stop'));
ALTER TABLE "MaintenanceWindow" ADD CONSTRAINT "MaintenanceWindow_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "PlatformUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MaintenanceWindow" ALTER COLUMN "message" DROP DEFAULT;

ALTER TABLE "TenantAdminInvitation"
  ADD COLUMN "sentAt" TIMESTAMP(3),
  ADD COLUMN "resendCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "PlatformWebAuthnCredential" (
  "id" TEXT NOT NULL,
  "credentialId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "publicKeyBase64url" TEXT NOT NULL,
  "counter" BIGINT NOT NULL DEFAULT 0,
  "transports" JSONB NOT NULL,
  "deviceType" TEXT NOT NULL,
  "backedUp" BOOLEAN NOT NULL DEFAULT false,
  "label" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "PlatformWebAuthnCredential_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PlatformWebAuthnCredential_status_check" CHECK ("status" IN ('active', 'revoked')),
  CONSTRAINT "PlatformWebAuthnCredential_label_check" CHECK (char_length(trim("label")) BETWEEN 2 AND 80)
);
CREATE UNIQUE INDEX "PlatformWebAuthnCredential_credentialId_key" ON "PlatformWebAuthnCredential"("credentialId");
CREATE INDEX "PlatformWebAuthnCredential_userId_status_idx" ON "PlatformWebAuthnCredential"("userId", "status");
ALTER TABLE "PlatformWebAuthnCredential" ADD CONSTRAINT "PlatformWebAuthnCredential_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "PlatformUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "PlatformAuthChallenge" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "challenge" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlatformAuthChallenge_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PlatformAuthChallenge_purpose_check" CHECK ("purpose" IN ('passkey_registration', 'passkey_authentication'))
);
CREATE INDEX "PlatformAuthChallenge_userId_purpose_expiresAt_idx" ON "PlatformAuthChallenge"("userId", "purpose", "expiresAt");
ALTER TABLE "PlatformAuthChallenge" ADD CONSTRAINT "PlatformAuthChallenge_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "PlatformUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "PlatformRecoveryCode" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "usedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "PlatformRecoveryCode_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PlatformRecoveryCode_codeHash_key" ON "PlatformRecoveryCode"("codeHash");
CREATE INDEX "PlatformRecoveryCode_userId_batchId_idx" ON "PlatformRecoveryCode"("userId", "batchId");
ALTER TABLE "PlatformRecoveryCode" ADD CONSTRAINT "PlatformRecoveryCode_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "PlatformUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "PlatformIncidentTimelineEntry" (
  "id" TEXT NOT NULL,
  "incidentId" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlatformIncidentTimelineEntry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PlatformIncidentTimelineEntry_incidentId_occurredAt_idx" ON "PlatformIncidentTimelineEntry"("incidentId", "occurredAt");
ALTER TABLE "PlatformIncidentTimelineEntry" ADD CONSTRAINT "PlatformIncidentTimelineEntry_incidentId_fkey"
  FOREIGN KEY ("incidentId") REFERENCES "PlatformIncident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlatformIncidentTimelineEntry" ADD CONSTRAINT "PlatformIncidentTimelineEntry_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "PlatformUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "OrganizationOperationJob" (
  "id" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "tenantInstanceId" TEXT,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "requestedByUserId" TEXT NOT NULL,
  "approvedByUserId" TEXT,
  "requiresSecondApproval" BOOLEAN NOT NULL DEFAULT false,
  "reauthenticatedAt" TIMESTAMP(3) NOT NULL,
  "payload" JSONB NOT NULL,
  "resultMetadata" JSONB,
  "errorCode" TEXT,
  "version" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  CONSTRAINT "OrganizationOperationJob_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OrganizationOperationJob_type_check" CHECK ("type" IN ('freeze', 'reactivate', 'closure_request', 'closure_precheck', 'data_export', 'ownership_transfer')),
  CONSTRAINT "OrganizationOperationJob_status_check" CHECK ("status" IN ('pending', 'awaiting_approval', 'approved', 'running', 'completed', 'failed', 'cancelled')),
  CONSTRAINT "OrganizationOperationJob_reason_check" CHECK (char_length(trim("reason")) BETWEEN 8 AND 500)
);
CREATE UNIQUE INDEX "OrganizationOperationJob_idempotencyKey_key" ON "OrganizationOperationJob"("idempotencyKey");
CREATE INDEX "OrganizationOperationJob_organizationId_createdAt_idx" ON "OrganizationOperationJob"("organizationId", "createdAt");
CREATE INDEX "OrganizationOperationJob_status_createdAt_idx" ON "OrganizationOperationJob"("status", "createdAt");
ALTER TABLE "OrganizationOperationJob" ADD CONSTRAINT "OrganizationOperationJob_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrganizationOperationJob" ADD CONSTRAINT "OrganizationOperationJob_tenantInstanceId_fkey"
  FOREIGN KEY ("tenantInstanceId") REFERENCES "TenantInstance"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrganizationOperationJob" ADD CONSTRAINT "OrganizationOperationJob_requestedByUserId_fkey"
  FOREIGN KEY ("requestedByUserId") REFERENCES "PlatformUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrganizationOperationJob" ADD CONSTRAINT "OrganizationOperationJob_approvedByUserId_fkey"
  FOREIGN KEY ("approvedByUserId") REFERENCES "PlatformUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
