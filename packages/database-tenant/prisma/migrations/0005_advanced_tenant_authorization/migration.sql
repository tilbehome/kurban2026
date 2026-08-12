-- Advanced tenant identity and authorization. Operational identities stay in the tenant database.
CREATE TABLE "OrganizationUser" (
  "id" TEXT NOT NULL, "email" TEXT, "displayName" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'active',
  "legacyUserId" TEXT, "externalRef" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "OrganizationUser_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "OrganizationUser_email_key" ON "OrganizationUser"("email");
CREATE UNIQUE INDEX "OrganizationUser_legacyUserId_key" ON "OrganizationUser"("legacyUserId");

CREATE TABLE "OrganizationMembership" (
  "id" TEXT NOT NULL, "organizationUserId" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'active',
  "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "validUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrganizationMembership_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OrganizationMembership_organizationUserId_status_idx" ON "OrganizationMembership"("organizationUserId", "status");
CREATE INDEX "OrganizationMembership_validUntil_idx" ON "OrganizationMembership"("validUntil");

CREATE TABLE "ModuleAuthorizationRegistration" (
  "id" TEXT NOT NULL, "moduleId" TEXT NOT NULL, "version" TEXT NOT NULL, "displayName" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true, "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "ModuleAuthorizationRegistration_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ModuleAuthorizationRegistration_moduleId_version_key" ON "ModuleAuthorizationRegistration"("moduleId", "version");
CREATE INDEX "ModuleAuthorizationRegistration_moduleId_active_idx" ON "ModuleAuthorizationRegistration"("moduleId", "active");

CREATE TABLE "Role" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT, "type" TEXT NOT NULL, "protectedCode" TEXT,
  "functionalArea" TEXT NOT NULL, "accessLevel" TEXT NOT NULL, "moduleRegistrationId" TEXT, "sourceRoleId" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Role_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Role_type_check" CHECK ("type" IN ('SYSTEM_PROTECTED','SYSTEM_TEMPLATE','CUSTOM')),
  CONSTRAINT "Role_accessLevel_check" CHECK ("accessLevel" IN ('MANAGER','SUPERVISOR','AUTHORIZED_OPERATOR','OPERATOR','VIEWER','TEMPORARY','GUEST')),
  CONSTRAINT "Role_protectedCode_check" CHECK (("type" = 'SYSTEM_PROTECTED' AND "protectedCode" IN ('ORGANIZATION_OWNER','EXECUTIVE_ADMIN','SECURITY_ADMIN','ACCESS_ADMIN','COMPLIANCE_AUDITOR','SUPPORT_APPROVER')) OR ("type" <> 'SYSTEM_PROTECTED' AND "protectedCode" IS NULL))
);
CREATE UNIQUE INDEX "Role_protectedCode_key" ON "Role"("protectedCode");
CREATE INDEX "Role_type_active_idx" ON "Role"("type", "active");
CREATE INDEX "Role_functionalArea_accessLevel_idx" ON "Role"("functionalArea", "accessLevel");
CREATE INDEX "Role_moduleRegistrationId_idx" ON "Role"("moduleRegistrationId");

CREATE TABLE "RoleVersion" (
  "id" TEXT NOT NULL, "roleId" TEXT NOT NULL, "version" INTEGER NOT NULL, "status" TEXT NOT NULL DEFAULT 'draft',
  "changeReason" TEXT NOT NULL, "createdByMembershipId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedAt" TIMESTAMP(3), "retiredAt" TIMESTAMP(3), CONSTRAINT "RoleVersion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RoleVersion_status_check" CHECK ("status" IN ('draft','published','retired'))
);
CREATE UNIQUE INDEX "RoleVersion_roleId_version_key" ON "RoleVersion"("roleId", "version");
CREATE INDEX "RoleVersion_roleId_status_idx" ON "RoleVersion"("roleId", "status");

CREATE TABLE "Permission" (
  "id" TEXT NOT NULL, "key" TEXT NOT NULL, "moduleId" TEXT NOT NULL, "resource" TEXT NOT NULL, "action" TEXT NOT NULL,
  "scope" TEXT NOT NULL, "description" TEXT, "riskLevel" TEXT NOT NULL DEFAULT 'normal', "moduleRegistrationId" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Permission_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Permission_riskLevel_check" CHECK ("riskLevel" IN ('normal','sensitive','critical')),
  CONSTRAINT "Permission_key_check" CHECK ("key" ~ '^[a-z][a-z0-9_-]{0,62}\.[a-z][a-z0-9_-]{0,62}\.[a-z][a-z0-9_-]{0,62}\.[a-z][a-z0-9_-]{0,62}$')
);
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");
CREATE UNIQUE INDEX "Permission_moduleId_resource_action_scope_key" ON "Permission"("moduleId", "resource", "action", "scope");
CREATE INDEX "Permission_moduleId_active_idx" ON "Permission"("moduleId", "active");

CREATE TABLE "RolePermission" (
  "roleVersionId" TEXT NOT NULL, "permissionId" TEXT NOT NULL, "effect" TEXT NOT NULL, "constraints" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleVersionId", "permissionId"),
  CONSTRAINT "RolePermission_effect_check" CHECK ("effect" IN ('ALLOW','DENY'))
);
CREATE INDEX "RolePermission_permissionId_effect_idx" ON "RolePermission"("permissionId", "effect");

CREATE TABLE "AccessScope" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "facilityId" TEXT, "departmentId" TEXT, "operationalPeriodId" TEXT,
  "assignedRecordType" TEXT, "assignedRecordId" TEXT, "additionalConstraints" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AccessScope_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MembershipRole" (
  "id" TEXT NOT NULL, "membershipId" TEXT NOT NULL, "roleVersionId" TEXT NOT NULL, "accessScopeId" TEXT,
  "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "validUntil" TIMESTAMP(3),
  "assignedByMembershipId" TEXT NOT NULL, "assignmentReason" TEXT NOT NULL, "revokedAt" TIMESTAMP(3),
  "revokedByMembershipId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MembershipRole_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MembershipRole_membershipId_revokedAt_validUntil_idx" ON "MembershipRole"("membershipId", "revokedAt", "validUntil");
CREATE INDEX "MembershipRole_roleVersionId_idx" ON "MembershipRole"("roleVersionId");

CREATE TABLE "ConditionalPolicy" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "roleVersionId" TEXT, "membershipRoleId" TEXT, "permissionId" TEXT,
  "effect" TEXT NOT NULL, "priority" INTEGER NOT NULL DEFAULT 0, "conditions" JSONB NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true, "validFrom" TIMESTAMP(3), "validUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ConditionalPolicy_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ConditionalPolicy_effect_check" CHECK ("effect" IN ('ALLOW','DENY')),
  CONSTRAINT "ConditionalPolicy_parent_check" CHECK (("roleVersionId" IS NOT NULL) <> ("membershipRoleId" IS NOT NULL))
);
CREATE INDEX "ConditionalPolicy_permissionId_active_idx" ON "ConditionalPolicy"("permissionId", "active");
CREATE INDEX "ConditionalPolicy_roleVersionId_active_idx" ON "ConditionalPolicy"("roleVersionId", "active");

CREATE TABLE "Delegation" (
  "id" TEXT NOT NULL, "fromMembershipId" TEXT NOT NULL, "toMembershipId" TEXT NOT NULL, "permissionId" TEXT NOT NULL,
  "accessScopeId" TEXT, "reason" TEXT NOT NULL, "validFrom" TIMESTAMP(3) NOT NULL, "validUntil" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active', "approvedByMembershipId" TEXT, "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Delegation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Delegation_window_check" CHECK ("validUntil" > "validFrom"),
  CONSTRAINT "Delegation_status_check" CHECK ("status" IN ('active','revoked','expired')),
  CONSTRAINT "Delegation_distinct_members_check" CHECK ("fromMembershipId" <> "toMembershipId")
);
CREATE INDEX "Delegation_toMembershipId_status_validUntil_idx" ON "Delegation"("toMembershipId", "status", "validUntil");
CREATE INDEX "Delegation_fromMembershipId_status_idx" ON "Delegation"("fromMembershipId", "status");

CREATE TABLE "ApprovalPolicy" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "permissionId" TEXT NOT NULL, "approverPermissionId" TEXT NOT NULL,
  "conditions" JSONB NOT NULL, "requiredApprovals" INTEGER NOT NULL DEFAULT 1, "requireDistinctUser" BOOLEAN NOT NULL DEFAULT true,
  "requireReauthentication" BOOLEAN NOT NULL DEFAULT true, "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApprovalPolicy_pkey" PRIMARY KEY ("id"), CONSTRAINT "ApprovalPolicy_requiredApprovals_check" CHECK ("requiredApprovals" > 0)
);
CREATE INDEX "ApprovalPolicy_permissionId_active_idx" ON "ApprovalPolicy"("permissionId", "active");

CREATE TABLE "ApprovalRequest" (
  "id" TEXT NOT NULL, "approvalPolicyId" TEXT NOT NULL, "requestedByMembershipId" TEXT NOT NULL,
  "operationType" TEXT NOT NULL, "operationRef" TEXT NOT NULL, "payloadHash" TEXT NOT NULL, "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending', "expiresAt" TIMESTAMP(3) NOT NULL, "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ApprovalRequest_status_check" CHECK ("status" IN ('pending','approved','denied','expired','cancelled'))
);
CREATE UNIQUE INDEX "ApprovalRequest_operationType_operationRef_payloadHash_key" ON "ApprovalRequest"("operationType", "operationRef", "payloadHash");
CREATE INDEX "ApprovalRequest_status_expiresAt_idx" ON "ApprovalRequest"("status", "expiresAt");

CREATE TABLE "ApprovalDecision" (
  "id" TEXT NOT NULL, "approvalRequestId" TEXT NOT NULL, "decidedByMembershipId" TEXT NOT NULL,
  "decision" TEXT NOT NULL, "reason" TEXT NOT NULL, "reauthenticatedAt" TIMESTAMP(3) NOT NULL,
  "decidedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "ApprovalDecision_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ApprovalDecision_decision_check" CHECK ("decision" IN ('approve','deny'))
);
CREATE UNIQUE INDEX "ApprovalDecision_approvalRequestId_decidedByMembershipId_key" ON "ApprovalDecision"("approvalRequestId", "decidedByMembershipId");

CREATE TABLE "TrustedDevice" (
  "id" TEXT NOT NULL, "organizationUserId" TEXT NOT NULL, "displayName" TEXT NOT NULL, "fingerprintHash" TEXT NOT NULL,
  "trustStatus" TEXT NOT NULL DEFAULT 'trusted', "trustedAt" TIMESTAMP(3) NOT NULL, "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TrustedDevice_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TrustedDevice_organizationUserId_fingerprintHash_key" ON "TrustedDevice"("organizationUserId", "fingerprintHash");
CREATE INDEX "TrustedDevice_trustStatus_expiresAt_idx" ON "TrustedDevice"("trustStatus", "expiresAt");

CREATE TABLE "UserSession" (
  "id" TEXT NOT NULL, "organizationMembershipId" TEXT NOT NULL, "tokenHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active', "mfaLevel" INTEGER NOT NULL DEFAULT 1, "authenticatedAt" TIMESTAMP(3) NOT NULL,
  "lastReauthenticatedAt" TIMESTAMP(3), "trustedDeviceId" TEXT, "networkFingerprint" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL, "revokedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id"), CONSTRAINT "UserSession_mfaLevel_check" CHECK ("mfaLevel" >= 0)
);
CREATE UNIQUE INDEX "UserSession_tokenHash_key" ON "UserSession"("tokenHash");
CREATE INDEX "UserSession_organizationMembershipId_status_idx" ON "UserSession"("organizationMembershipId", "status");
CREATE INDEX "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");

CREATE TABLE "ServiceAccount" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "clientId" TEXT NOT NULL, "credentialHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active', "createdByMembershipId" TEXT NOT NULL, "validUntil" TIMESTAMP(3),
  "lastUsedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ServiceAccount_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ServiceAccount_clientId_key" ON "ServiceAccount"("clientId");

CREATE TABLE "ServiceAccountPermission" (
  "serviceAccountId" TEXT NOT NULL, "permissionId" TEXT NOT NULL, "accessScopeId" TEXT, "effect" TEXT NOT NULL,
  "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "validUntil" TIMESTAMP(3),
  CONSTRAINT "ServiceAccountPermission_pkey" PRIMARY KEY ("serviceAccountId", "permissionId"),
  CONSTRAINT "ServiceAccountPermission_effect_check" CHECK ("effect" IN ('ALLOW','DENY'))
);

CREATE TABLE "DeviceIdentity" (
  "id" TEXT NOT NULL, "kind" TEXT NOT NULL, "displayName" TEXT NOT NULL, "credentialHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active', "facilityId" TEXT, "validUntil" TIMESTAMP(3), "lastSeenAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DeviceIdentity_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DeviceIdentity_credentialHash_key" ON "DeviceIdentity"("credentialHash");

CREATE TABLE "DevicePermission" (
  "deviceIdentityId" TEXT NOT NULL, "permissionId" TEXT NOT NULL, "accessScopeId" TEXT, "effect" TEXT NOT NULL,
  "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "validUntil" TIMESTAMP(3),
  CONSTRAINT "DevicePermission_pkey" PRIMARY KEY ("deviceIdentityId", "permissionId"),
  CONSTRAINT "DevicePermission_effect_check" CHECK ("effect" IN ('ALLOW','DENY'))
);

CREATE TABLE "ExternalUser" (
  "id" TEXT NOT NULL, "issuer" TEXT NOT NULL, "subject" TEXT NOT NULL, "email" TEXT, "displayName" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active', "validUntil" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "ExternalUser_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ExternalUser_issuer_subject_key" ON "ExternalUser"("issuer", "subject");

CREATE TABLE "ExternalUserPermission" (
  "externalUserId" TEXT NOT NULL, "permissionId" TEXT NOT NULL, "accessScopeId" TEXT, "effect" TEXT NOT NULL,
  "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "validUntil" TIMESTAMP(3),
  CONSTRAINT "ExternalUserPermission_pkey" PRIMARY KEY ("externalUserId", "permissionId"),
  CONSTRAINT "ExternalUserPermission_effect_check" CHECK ("effect" IN ('ALLOW','DENY'))
);

CREATE TABLE "AuthorizationAudit" (
  "id" TEXT NOT NULL, "identityKind" TEXT NOT NULL, "subjectId" TEXT, "organizationMembershipId" TEXT,
  "sessionId" TEXT, "permissionKey" TEXT NOT NULL, "resourceType" TEXT, "resourceId" TEXT, "decision" TEXT NOT NULL,
  "reasonCodes" JSONB NOT NULL, "evaluatedPolicies" JSONB, "contextSnapshot" JSONB, "requestId" TEXT NOT NULL,
  "traceId" TEXT, "occurredAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "AuthorizationAudit_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AuthorizationAudit_identityKind_check" CHECK ("identityKind" IN ('PLATFORM_USER','ORGANIZATION_USER','CUSTOMER','SERVICE_ACCOUNT','DEVICE_IDENTITY','EXTERNAL_USER')),
  CONSTRAINT "AuthorizationAudit_decision_check" CHECK ("decision" IN ('ALLOW','DENY','APPROVAL_REQUIRED'))
);
CREATE INDEX "AuthorizationAudit_organizationMembershipId_occurredAt_idx" ON "AuthorizationAudit"("organizationMembershipId", "occurredAt");
CREATE INDEX "AuthorizationAudit_permissionKey_decision_occurredAt_idx" ON "AuthorizationAudit"("permissionKey", "decision", "occurredAt");
CREATE INDEX "AuthorizationAudit_requestId_idx" ON "AuthorizationAudit"("requestId");

ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_organizationUserId_fkey" FOREIGN KEY ("organizationUserId") REFERENCES "OrganizationUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Role" ADD CONSTRAINT "Role_moduleRegistrationId_fkey" FOREIGN KEY ("moduleRegistrationId") REFERENCES "ModuleAuthorizationRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Role" ADD CONSTRAINT "Role_sourceRoleId_fkey" FOREIGN KEY ("sourceRoleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RoleVersion" ADD CONSTRAINT "RoleVersion_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RoleVersion" ADD CONSTRAINT "RoleVersion_createdByMembershipId_fkey" FOREIGN KEY ("createdByMembershipId") REFERENCES "OrganizationMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_moduleRegistrationId_fkey" FOREIGN KEY ("moduleRegistrationId") REFERENCES "ModuleAuthorizationRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleVersionId_fkey" FOREIGN KEY ("roleVersionId") REFERENCES "RoleVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MembershipRole" ADD CONSTRAINT "MembershipRole_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "OrganizationMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MembershipRole" ADD CONSTRAINT "MembershipRole_roleVersionId_fkey" FOREIGN KEY ("roleVersionId") REFERENCES "RoleVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MembershipRole" ADD CONSTRAINT "MembershipRole_accessScopeId_fkey" FOREIGN KEY ("accessScopeId") REFERENCES "AccessScope"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MembershipRole" ADD CONSTRAINT "MembershipRole_assignedByMembershipId_fkey" FOREIGN KEY ("assignedByMembershipId") REFERENCES "OrganizationMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConditionalPolicy" ADD CONSTRAINT "ConditionalPolicy_roleVersionId_fkey" FOREIGN KEY ("roleVersionId") REFERENCES "RoleVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConditionalPolicy" ADD CONSTRAINT "ConditionalPolicy_membershipRoleId_fkey" FOREIGN KEY ("membershipRoleId") REFERENCES "MembershipRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ConditionalPolicy" ADD CONSTRAINT "ConditionalPolicy_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Delegation" ADD CONSTRAINT "Delegation_fromMembershipId_fkey" FOREIGN KEY ("fromMembershipId") REFERENCES "OrganizationMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Delegation" ADD CONSTRAINT "Delegation_toMembershipId_fkey" FOREIGN KEY ("toMembershipId") REFERENCES "OrganizationMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Delegation" ADD CONSTRAINT "Delegation_approvedByMembershipId_fkey" FOREIGN KEY ("approvedByMembershipId") REFERENCES "OrganizationMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Delegation" ADD CONSTRAINT "Delegation_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Delegation" ADD CONSTRAINT "Delegation_accessScopeId_fkey" FOREIGN KEY ("accessScopeId") REFERENCES "AccessScope"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ApprovalPolicy" ADD CONSTRAINT "ApprovalPolicy_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ApprovalPolicy" ADD CONSTRAINT "ApprovalPolicy_approverPermissionId_fkey" FOREIGN KEY ("approverPermissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_approvalPolicyId_fkey" FOREIGN KEY ("approvalPolicyId") REFERENCES "ApprovalPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_requestedByMembershipId_fkey" FOREIGN KEY ("requestedByMembershipId") REFERENCES "OrganizationMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ApprovalDecision" ADD CONSTRAINT "ApprovalDecision_approvalRequestId_fkey" FOREIGN KEY ("approvalRequestId") REFERENCES "ApprovalRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ApprovalDecision" ADD CONSTRAINT "ApprovalDecision_decidedByMembershipId_fkey" FOREIGN KEY ("decidedByMembershipId") REFERENCES "OrganizationMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrustedDevice" ADD CONSTRAINT "TrustedDevice_organizationUserId_fkey" FOREIGN KEY ("organizationUserId") REFERENCES "OrganizationUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_organizationMembershipId_fkey" FOREIGN KEY ("organizationMembershipId") REFERENCES "OrganizationMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_trustedDeviceId_fkey" FOREIGN KEY ("trustedDeviceId") REFERENCES "TrustedDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceAccount" ADD CONSTRAINT "ServiceAccount_createdByMembershipId_fkey" FOREIGN KEY ("createdByMembershipId") REFERENCES "OrganizationMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceAccountPermission" ADD CONSTRAINT "ServiceAccountPermission_serviceAccountId_fkey" FOREIGN KEY ("serviceAccountId") REFERENCES "ServiceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceAccountPermission" ADD CONSTRAINT "ServiceAccountPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceAccountPermission" ADD CONSTRAINT "ServiceAccountPermission_accessScopeId_fkey" FOREIGN KEY ("accessScopeId") REFERENCES "AccessScope"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DevicePermission" ADD CONSTRAINT "DevicePermission_deviceIdentityId_fkey" FOREIGN KEY ("deviceIdentityId") REFERENCES "DeviceIdentity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DevicePermission" ADD CONSTRAINT "DevicePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DevicePermission" ADD CONSTRAINT "DevicePermission_accessScopeId_fkey" FOREIGN KEY ("accessScopeId") REFERENCES "AccessScope"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExternalUserPermission" ADD CONSTRAINT "ExternalUserPermission_externalUserId_fkey" FOREIGN KEY ("externalUserId") REFERENCES "ExternalUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExternalUserPermission" ADD CONSTRAINT "ExternalUserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExternalUserPermission" ADD CONSTRAINT "ExternalUserPermission_accessScopeId_fkey" FOREIGN KEY ("accessScopeId") REFERENCES "AccessScope"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Direct SQL must not bypass the application invariant that an established tenant keeps an active owner.
CREATE FUNCTION ensure_organization_owner_remains() RETURNS trigger AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM "MembershipRole" mr JOIN "RoleVersion" rv ON rv."id" = mr."roleVersionId" JOIN "Role" r ON r."id" = rv."roleId" WHERE r."protectedCode" = 'ORGANIZATION_OWNER')
     AND NOT EXISTS (
       SELECT 1 FROM "MembershipRole" mr
       JOIN "RoleVersion" rv ON rv."id" = mr."roleVersionId"
       JOIN "Role" r ON r."id" = rv."roleId"
       JOIN "OrganizationMembership" om ON om."id" = mr."membershipId"
       JOIN "OrganizationUser" ou ON ou."id" = om."organizationUserId"
       WHERE r."protectedCode" = 'ORGANIZATION_OWNER' AND r."active" = true AND rv."status" = 'published' AND mr."revokedAt" IS NULL
         AND mr."validFrom" <= CURRENT_TIMESTAMP AND mr."validUntil" IS NULL
         AND om."status" = 'active' AND om."validFrom" <= CURRENT_TIMESTAMP
         AND (om."validUntil" IS NULL OR om."validUntil" > CURRENT_TIMESTAMP) AND ou."status" = 'active'
     ) THEN RAISE EXCEPTION 'LAST_ORGANIZATION_OWNER_CANNOT_BE_REMOVED';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE CONSTRAINT TRIGGER "MembershipRole_owner_guard" AFTER UPDATE OR DELETE ON "MembershipRole" DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE FUNCTION ensure_organization_owner_remains();
CREATE CONSTRAINT TRIGGER "OrganizationMembership_owner_guard" AFTER UPDATE OR DELETE ON "OrganizationMembership" DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE FUNCTION ensure_organization_owner_remains();
CREATE CONSTRAINT TRIGGER "OrganizationUser_owner_guard" AFTER UPDATE OR DELETE ON "OrganizationUser" DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE FUNCTION ensure_organization_owner_remains();
CREATE CONSTRAINT TRIGGER "Role_owner_guard" AFTER UPDATE OR DELETE ON "Role" DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE FUNCTION ensure_organization_owner_remains();
CREATE CONSTRAINT TRIGGER "RoleVersion_owner_guard" AFTER UPDATE OR DELETE ON "RoleVersion" DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE FUNCTION ensure_organization_owner_remains();
