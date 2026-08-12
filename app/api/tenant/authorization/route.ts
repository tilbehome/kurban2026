import { NextResponse } from "next/server";
import { z } from "zod";
import { aktifOturum } from "@/shared/lib/session";
import { authorizationManifestBul } from "@/shared/lib/module-loader";
import { tenantAuthorizationActor, tenantAuthorizationMode, tenantAuthorizationService } from "@/shared/lib/tenant-master-data-adapter";
import { AuthorizationError } from "@tilbecore/tenant-core";

const AccessLevel = z.enum(["MANAGER", "SUPERVISOR", "AUTHORIZED_OPERATOR", "OPERATOR", "VIEWER", "TEMPORARY", "GUEST"]);
const IdentityGrant = z.object({ permissionKey: z.string().min(7).max(255), accessScopeId: z.string().min(8).optional(), effect: z.enum(["ALLOW", "DENY"]), validFrom: z.string().datetime().optional(), validUntil: z.string().datetime().optional() });
const Body = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("authorize"), permissionKey: z.string().min(7).max(255) }),
  z.object({ operation: z.literal("catalog") }),
  z.object({ operation: z.literal("create-membership"), email: z.string().email().optional(), displayName: z.string().min(2).max(160), validFrom: z.string().datetime().optional(), validUntil: z.string().datetime().optional(), reason: z.string().min(8).max(500) }),
  z.object({ operation: z.literal("create-service-account"), name: z.string().min(2).max(120), validUntil: z.string().datetime().optional(), grants: z.array(IdentityGrant).min(1).max(250) }),
  z.object({ operation: z.literal("create-device-identity"), kind: z.string().regex(/^[a-z][a-z0-9_-]{1,62}$/), displayName: z.string().min(2).max(120), facilityId: z.string().min(1).optional(), validUntil: z.string().datetime().optional(), grants: z.array(IdentityGrant).min(1).max(250) }),
  z.object({ operation: z.literal("create-external-user"), issuer: z.string().min(3).max(200), subject: z.string().min(2).max(200), email: z.string().email().optional(), displayName: z.string().min(2).max(160).optional(), validUntil: z.string().datetime().optional(), grants: z.array(IdentityGrant).min(1).max(250) }),
  z.object({ operation: z.literal("register-module"), moduleId: z.string().regex(/^[a-z][a-z0-9_-]{1,62}$/) }),
  z.object({ operation: z.literal("assign-role"), membershipId: z.string().min(8), roleVersionId: z.string().min(8), accessScopeId: z.string().min(8).optional(), validFrom: z.string().datetime().optional(), validUntil: z.string().datetime().optional(), reason: z.string().min(8).max(500) }),
  z.object({ operation: z.literal("revoke-role"), membershipRoleId: z.string().min(8), reason: z.string().min(8).max(500) }),
  z.object({ operation: z.literal("delegate"), toMembershipId: z.string().min(8), permissionKey: z.string().min(7).max(255), accessScopeId: z.string().min(8).optional(), validFrom: z.string().datetime(), validUntil: z.string().datetime(), reason: z.string().min(8).max(500) }),
  z.object({ operation: z.literal("copy-role-template"), sourceRoleId: z.string().min(8), name: z.string().min(2).max(120), functionalArea: z.string().regex(/^[a-z][a-z0-9_-]{1,80}$/), accessLevel: AccessLevel, reason: z.string().min(8).max(500) }),
  z.object({ operation: z.literal("publish-custom-role"), roleVersionId: z.string().min(8), permissions: z.array(z.object({ permissionKey: z.string().min(7).max(255), effect: z.enum(["ALLOW", "DENY"]), conditions: z.record(z.string(), z.unknown()).optional() })).min(1).max(250), reason: z.string().min(8).max(500) }),
  z.object({ operation: z.literal("create-access-scope"), name: z.string().min(2).max(120), facilityId: z.string().min(1).optional(), departmentId: z.string().min(1).optional(), operationalPeriodId: z.string().min(1).optional(), assignedRecordType: z.string().min(1).optional(), assignedRecordId: z.string().min(1).optional(), additionalConstraints: z.record(z.string(), z.unknown()).optional() }),
  z.object({ operation: z.literal("create-conditional-policy"), name: z.string().min(2).max(120), roleVersionId: z.string().min(8).optional(), membershipRoleId: z.string().min(8).optional(), permissionKey: z.string().min(7).max(255).optional(), effect: z.enum(["ALLOW", "DENY"]), priority: z.number().int().min(-1000).max(1000).optional(), conditions: z.record(z.string(), z.unknown()), validFrom: z.string().datetime().optional(), validUntil: z.string().datetime().optional() }),
  z.object({ operation: z.literal("create-approval-policy"), name: z.string().min(2).max(120), permissionKey: z.string().min(7).max(255), approverPermissionKey: z.string().min(7).max(255), conditions: z.record(z.string(), z.unknown()).optional(), requiredApprovals: z.number().int().min(1).max(10).optional(), requireDistinctUser: z.boolean().optional(), requireReauthentication: z.boolean().optional() }),
  z.object({ operation: z.literal("request-approval"), permissionKey: z.string().min(7).max(255), operationType: z.string().min(2).max(120), operationRef: z.string().min(2).max(180), payloadHash: z.string().regex(/^[a-fA-F0-9]{32,128}$/), reason: z.string().min(8).max(500), expiresAt: z.string().datetime() }),
  z.object({ operation: z.literal("decide-approval"), approvalRequestId: z.string().min(8), decision: z.enum(["approve", "deny"]), reason: z.string().min(8).max(500) }),
]);

export async function POST(request: Request) {
  const session = await aktifOturum();
  if (!session) return NextResponse.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 });
  if (tenantAuthorizationMode() !== "database") return NextResponse.json({ error: "DATABASE_AUTHORIZATION_NOT_ENABLED" }, { status: 409 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "AUTHORIZATION_COMMAND_INVALID" }, { status: 400 });
  try {
    const actor = tenantAuthorizationActor(session, request);
    const service = tenantAuthorizationService();
    const command = parsed.data;
    if (command.operation === "authorize") return NextResponse.json(await service.authorize(actor, command.permissionKey));
    if (command.operation === "catalog") return NextResponse.json(await service.authorizationCatalog(actor));
    if (command.operation === "create-membership") return NextResponse.json(await service.createOrganizationMembership(actor, command));
    if (command.operation === "create-service-account") return NextResponse.json(await service.createServiceAccount(actor, command), { headers: { "Cache-Control": "no-store" } });
    if (command.operation === "create-device-identity") return NextResponse.json(await service.createDeviceIdentity(actor, command), { headers: { "Cache-Control": "no-store" } });
    if (command.operation === "create-external-user") return NextResponse.json(await service.createExternalUser(actor, command));
    if (command.operation === "register-module") {
      const manifest = authorizationManifestBul(command.moduleId);
      if (!manifest) return NextResponse.json({ error: "MODULE_AUTHORIZATION_MANIFEST_NOT_FOUND" }, { status: 404 });
      await service.registerModule(actor, manifest);
      return NextResponse.json({ registered: true, moduleId: manifest.moduleId, version: manifest.version });
    }
    if (command.operation === "assign-role") return NextResponse.json(await service.assignRole(actor, command));
    if (command.operation === "revoke-role") { await service.revokeRole(actor, command); return NextResponse.json({ revoked: true }); }
    if (command.operation === "delegate") return NextResponse.json(await service.delegatePermission(actor, command));
    if (command.operation === "copy-role-template") return NextResponse.json(await service.copyRoleTemplate(actor, command));
    if (command.operation === "publish-custom-role") { await service.publishCustomRoleVersion(actor, command); return NextResponse.json({ published: true }); }
    if (command.operation === "create-access-scope") return NextResponse.json(await service.createAccessScope(actor, command));
    if (command.operation === "create-conditional-policy") return NextResponse.json(await service.createConditionalPolicy(actor, command));
    if (command.operation === "create-approval-policy") return NextResponse.json(await service.createApprovalPolicy(actor, command));
    if (command.operation === "request-approval") {
      const evaluation = await service.authorize(actor, command.permissionKey);
      return NextResponse.json(await service.requestApproval(actor, { ...command, evaluation }));
    }
    return NextResponse.json(await service.decideApproval(actor, command));
  } catch (error) {
    if (error instanceof AuthorizationError) return NextResponse.json({ error: error.code }, { status: error.code === "AUTHORIZATION_APPROVAL_REQUIRED" ? 409 : 403 });
    return NextResponse.json({ error: "AUTHORIZATION_COMMAND_FAILED" }, { status: 500 });
  }
}
