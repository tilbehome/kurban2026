CREATE TABLE "Organization" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

CREATE TABLE "TenantDatabaseRef" (
  "id" TEXT NOT NULL,
  "engine" TEXT NOT NULL,
  "managed" BOOLEAN NOT NULL,
  "region" TEXT,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TenantDatabaseRef_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TenantInstance" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "provisioningStatus" TEXT NOT NULL,
  "runtimeStatus" TEXT NOT NULL DEFAULT 'unknown',
  "releaseChannel" TEXT NOT NULL,
  "databaseRefId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TenantInstance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TenantInstance_slug_key" ON "TenantInstance"("slug");
CREATE INDEX "TenantInstance_organizationId_idx" ON "TenantInstance"("organizationId");

CREATE TABLE "PlatformPlan" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformPlan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlatformPlan_code_key" ON "PlatformPlan"("code");

CREATE TABLE "PlatformModule" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformModule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlatformModule_key_key" ON "PlatformModule"("key");

CREATE TABLE "PlatformPlanModule" (
  "planId" TEXT NOT NULL,
  "moduleId" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL,
  "maxUsers" INTEGER,
  "maxDevices" INTEGER,
  "maxStorageMb" INTEGER,
  CONSTRAINT "PlatformPlanModule_pkey" PRIMARY KEY ("planId","moduleId")
);

CREATE TABLE "PlatformLicense" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformLicense_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlatformLicense_organizationId_idx" ON "PlatformLicense"("organizationId");
CREATE INDEX "PlatformLicense_planId_idx" ON "PlatformLicense"("planId");

CREATE TABLE "PlatformLicenseEntitlement" (
  "licenseId" TEXT NOT NULL,
  "moduleId" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL,
  "maxUsers" INTEGER,
  "maxDevices" INTEGER,
  "maxStorageMb" INTEGER,
  CONSTRAINT "PlatformLicenseEntitlement_pkey" PRIMARY KEY ("licenseId","moduleId")
);

CREATE TABLE "PlatformUser" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT,
  "email" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlatformUser_email_key" ON "PlatformUser"("email");

CREATE TABLE "PlatformRole" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformRole_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlatformRole_key_key" ON "PlatformRole"("key");

CREATE TABLE "PlatformUserRole" (
  "userId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  CONSTRAINT "PlatformUserRole_pkey" PRIMARY KEY ("userId","roleId")
);

CREATE TABLE "PlatformAuditLog" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT,
  "actorUserId" TEXT,
  "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT,
  "requestId" TEXT,
  "supportSessionId" TEXT,
  "result" TEXT NOT NULL,
  "metadata" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlatformAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlatformAuditLog_organizationId_idx" ON "PlatformAuditLog"("organizationId");
CREATE INDEX "PlatformAuditLog_actorUserId_idx" ON "PlatformAuditLog"("actorUserId");
CREATE INDEX "PlatformAuditLog_requestId_idx" ON "PlatformAuditLog"("requestId");

ALTER TABLE "TenantInstance" ADD CONSTRAINT "TenantInstance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TenantInstance" ADD CONSTRAINT "TenantInstance_databaseRefId_fkey" FOREIGN KEY ("databaseRefId") REFERENCES "TenantDatabaseRef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlatformPlanModule" ADD CONSTRAINT "PlatformPlanModule_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PlatformPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlatformPlanModule" ADD CONSTRAINT "PlatformPlanModule_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "PlatformModule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlatformLicense" ADD CONSTRAINT "PlatformLicense_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlatformLicense" ADD CONSTRAINT "PlatformLicense_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PlatformPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlatformLicenseEntitlement" ADD CONSTRAINT "PlatformLicenseEntitlement_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "PlatformLicense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlatformLicenseEntitlement" ADD CONSTRAINT "PlatformLicenseEntitlement_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "PlatformModule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlatformUser" ADD CONSTRAINT "PlatformUser_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PlatformUserRole" ADD CONSTRAINT "PlatformUserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PlatformUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlatformUserRole" ADD CONSTRAINT "PlatformUserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "PlatformRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlatformAuditLog" ADD CONSTRAINT "PlatformAuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PlatformAuditLog" ADD CONSTRAINT "PlatformAuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "PlatformUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
