import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { OrganizationId, TenantInstanceId } from "@tilbecore/contracts";
import type { PlatformAdminRepository, PasswordVerifier } from "../contracts/platform-admin-repository";
import type { PasskeyCeremonyPort, PlatformControlPlaneRepository } from "../contracts/platform-control-plane-repository";
import { assertApprovalReason, assertPlatformPermission, type PlatformActor } from "../domain/platform-admin";
import {
  assertIncidentTransition, assertMaintenanceTransition, assertRecentReauthentication,
  assertSafeControlPlaneMetadata, operationNeedsSecondApproval, type OrganizationOperationType,
  type PlatformIncidentStatus, type PlatformMaintenanceStatus,
} from "../domain/platform-control-plane-completion";
import { createPlatformAuthenticatedSession } from "./platform-admin-services";

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const LOCK_AFTER_FAILURES = 5;
const LOCK_MS = 15 * 60 * 1000;

export async function beginPasskeyRegistration(repository: PlatformAdminRepository & PlatformControlPlaneRepository, ceremony: PasskeyCeremonyPort, actor: PlatformActor, now: string) {
  assertPlatformPermission(actor, "platform.security.manage");
  const user = await repository.findAuthUserById(actor.userId); if (!user) throw new Error("PLATFORM_USER_NOT_FOUND");
  const options = await ceremony.registrationOptions({ userId: user.id, email: user.email, displayName: user.displayName, existingCredentialIds: (await repository.listPasskeys(user.id)).filter(x=>x.status==="active").map(x=>x.credentialId) });
  const challenge = String(options.challenge ?? ""); if (!challenge) throw new Error("PASSKEY_CHALLENGE_INVALID");
  const id=randomUUID(); await repository.createChallenge({ id, userId:user.id, purpose:"passkey_registration", challenge, expiresAt:new Date(Date.parse(now)+CHALLENGE_TTL_MS).toISOString() });
  return { challengeId:id, options };
}

export async function finishPasskeyRegistration(repository: PlatformAdminRepository & PlatformControlPlaneRepository, ceremony: PasskeyCeremonyPort, actor: PlatformActor, input:{challengeId:string;label:string;response:unknown;requestId:string;occurredAt:string}) {
  assertPlatformPermission(actor,"platform.security.manage");
  if(input.label.trim().length<2||input.label.trim().length>80) throw new Error("PASSKEY_DEVICE_LABEL_INVALID");
  const challenge=await repository.consumeChallenge({id:input.challengeId,userId:actor.userId,purpose:"passkey_registration",occurredAt:input.occurredAt});
  if(!challenge||Date.parse(challenge.expiresAt)<=Date.parse(input.occurredAt)) throw new Error("PASSKEY_CHALLENGE_EXPIRED");
  const result=await ceremony.verifyRegistration({response:input.response,expectedChallenge:challenge.challenge});
  await repository.savePasskey({id:randomUUID(),userId:actor.userId,label:input.label.trim(),status:"active",...result});
  await repository.recordAudit({id:randomUUID(),actorUserId:actor.userId,action:"platform.security.passkey.register",targetType:"PlatformUser",targetId:actor.userId,requestId:input.requestId,result:"success",metadata:{credentialRef:hashPublicId(result.credentialId)},occurredAt:input.occurredAt});
}

export async function beginPasskeyAuthentication(repository: PlatformAdminRepository & PlatformControlPlaneRepository, ceremony:PasskeyCeremonyPort,input:{email:string;occurredAt:string}){
  const user=await repository.findAuthUserByEmail(input.email.trim().toLowerCase());
  if(!user||user.status!=="active"||(user.lockedUntil&&Date.parse(user.lockedUntil)>Date.parse(input.occurredAt))) throw new Error(user?.lockedUntil?"PLATFORM_ACCOUNT_LOCKED":"PLATFORM_AUTH_INVALID");
  const passkeys=(await repository.listPasskeys(user.id)).filter(x=>x.status==="active"); if(!passkeys.length) throw new Error("PLATFORM_PASSKEY_NOT_ENROLLED");
  const options=await ceremony.authenticationOptions({credentialIds:passkeys.map(x=>x.credentialId)}); const challenge=String(options.challenge??"");
  const id=randomUUID(); await repository.createChallenge({id,userId:user.id,purpose:"passkey_authentication",challenge,expiresAt:new Date(Date.parse(input.occurredAt)+CHALLENGE_TTL_MS).toISOString()});
  return {challengeId:id,options};
}

export async function finishPasskeyAuthentication(repository:PlatformAdminRepository&PlatformControlPlaneRepository,ceremony:PasskeyCeremonyPort,input:{challengeId:string;credentialId:string;response:unknown;requestId:string;occurredAt:string;userAgent?:string}){
  const credential=await repository.findPasskey(input.credentialId); if(!credential||credential.status!=="active") throw new Error("PLATFORM_AUTH_INVALID");
  const challenge=await repository.consumeChallenge({id:input.challengeId,userId:credential.userId,purpose:"passkey_authentication",occurredAt:input.occurredAt});
  if(!challenge||Date.parse(challenge.expiresAt)<=Date.parse(input.occurredAt)) throw new Error("PASSKEY_CHALLENGE_EXPIRED");
  const verified=await ceremony.verifyAuthentication({response:input.response,expectedChallenge:challenge.challenge,credential});
  if(!await repository.updatePasskeyCounter({credentialId:verified.credentialId,counter:verified.newCounter,occurredAt:input.occurredAt})) throw new Error("PASSKEY_COUNTER_UPDATE_FAILED");
  const user=await repository.findAuthUserById(credential.userId); if(!user||user.status!=="active"||(user.lockedUntil&&Date.parse(user.lockedUntil)>Date.parse(input.occurredAt))) throw new Error(user?.lockedUntil?"PLATFORM_ACCOUNT_LOCKED":"PLATFORM_AUTH_INVALID");
  const auth=await createPlatformAuthenticatedSession(repository,user,input.occurredAt,input.userAgent);
  await repository.markLoginSuccess(user.id,input.occurredAt);
  await repository.recordAudit({id:randomUUID(),actorUserId:user.id,action:"platform.auth.passkey",targetType:"PlatformUser",targetId:user.id,requestId:input.requestId,result:"success",metadata:{credentialRef:hashPublicId(credential.credentialId)},occurredAt:input.occurredAt});
  return auth;
}

export async function regenerateRecoveryCodes(repository:PlatformAdminRepository&PlatformControlPlaneRepository,actor:PlatformActor,input:{pepper:string;requestId:string;occurredAt:string}){
  assertPlatformPermission(actor,"platform.security.manage"); if(input.pepper.length<32) throw new Error("PLATFORM_RECOVERY_PEPPER_REQUIRED");
  const batchId=randomUUID(); const codes=Array.from({length:10},()=>`${randomBytes(4).toString("hex").toUpperCase()}-${randomBytes(4).toString("hex").toUpperCase()}`);
  await repository.replaceRecoveryCodes({userId:actor.userId,batchId,codes:codes.map(code=>({id:randomUUID(),hash:hashRecoveryCode(actor.userId,code,input.pepper)})),occurredAt:input.occurredAt});
  await repository.recordAudit({id:randomUUID(),actorUserId:actor.userId,action:"platform.security.recovery_codes.rotate",targetType:"PlatformUser",targetId:actor.userId,requestId:input.requestId,result:"success",metadata:{count:codes.length,batchRef:hashPublicId(batchId)},occurredAt:input.occurredAt});
  return codes;
}

export async function consumeRecoveryCode(repository:PlatformControlPlaneRepository,input:{userId:PlatformActor["userId"];code:string;pepper:string;occurredAt:string}){
  if(!await repository.consumeRecoveryCode({userId:input.userId,hash:hashRecoveryCode(input.userId,input.code,input.pepper),occurredAt:input.occurredAt})) throw new Error("PLATFORM_RECOVERY_CODE_INVALID");
}
export async function authenticatePlatformUserWithRecovery(repository:PlatformAdminRepository&PlatformControlPlaneRepository,passwordVerifier:PasswordVerifier,input:{email:string;password:string;recoveryCode:string;pepper:string;requestId:string;occurredAt:string;userAgent?:string}){
  const user=await repository.findAuthUserByEmail(input.email.trim().toLowerCase());const now=Date.parse(input.occurredAt);if(!user||user.status!=="active"||!user.passwordHash||(user.lockedUntil&&Date.parse(user.lockedUntil)>now)||!await passwordVerifier.verify(input.password,user.passwordHash)){if(user&&(!user.lockedUntil||Date.parse(user.lockedUntil)<=now)){const failedCount=user.failedLoginCount+1;await repository.markLoginFailure(user.id,failedCount,failedCount>=LOCK_AFTER_FAILURES?new Date(now+LOCK_MS).toISOString():undefined)}await repository.recordAudit({id:randomUUID(),actorUserId:user?.id,action:"platform.auth.recovery_code",targetType:"PlatformUser",targetId:user?.id,requestId:input.requestId,result:"denied",metadata:{code:user?.lockedUntil?"ACCOUNT_LOCKED":"INVALID_CREDENTIALS"},occurredAt:input.occurredAt});throw new Error(user?.lockedUntil?"PLATFORM_ACCOUNT_LOCKED":"PLATFORM_AUTH_INVALID")}
  await consumeRecoveryCode(repository,{userId:user.id,code:input.recoveryCode,pepper:input.pepper,occurredAt:input.occurredAt});const auth=await createPlatformAuthenticatedSession(repository,user,input.occurredAt,input.userAgent);await repository.markLoginSuccess(user.id,input.occurredAt);await repository.recordAudit({id:randomUUID(),actorUserId:user.id,action:"platform.auth.recovery_code",targetType:"PlatformUser",targetId:user.id,requestId:input.requestId,result:"success",metadata:{singleUse:true},occurredAt:input.occurredAt});return auth;
}

export async function reauthenticatePlatformSession(repository:PlatformAdminRepository&PlatformControlPlaneRepository,passwordVerifier:PasswordVerifier,actor:PlatformActor,input:{password:string;occurredAt:string}){
  const user=await repository.findAuthUserById(actor.userId); if(!user?.passwordHash||!await passwordVerifier.verify(input.password,user.passwordHash)) throw new Error("PLATFORM_REAUTHENTICATION_FAILED");
  if(!await repository.markSessionReauthenticated({sessionId:actor.sessionId,userId:actor.userId,occurredAt:input.occurredAt})) throw new Error("PLATFORM_SESSION_INVALID");
}
export async function revokePlatformPasskey(repository:PlatformAdminRepository&PlatformControlPlaneRepository,actor:PlatformActor,id:string,requestId:string,occurredAt:string){assertPlatformPermission(actor,"platform.security.manage");if(!await repository.revokePasskey({id,userId:actor.userId,occurredAt}))throw new Error("PLATFORM_PASSKEY_NOT_FOUND");await repository.recordAudit({id:randomUUID(),actorUserId:actor.userId,action:"platform.security.passkey.revoke",targetType:"PlatformWebAuthnCredential",targetId:id,requestId,result:"success",occurredAt});}
export async function revokePlatformDevice(repository:PlatformAdminRepository&PlatformControlPlaneRepository,actor:PlatformActor,deviceId:string,requestId:string,occurredAt:string){assertPlatformPermission(actor,"platform.security.manage");if(!await repository.revokeDeviceSessions({userId:actor.userId,deviceId,occurredAt}))throw new Error("PLATFORM_DEVICE_NOT_FOUND");await repository.recordAudit({id:randomUUID(),actorUserId:actor.userId,action:"platform.security.device.revoke",targetType:"PlatformDevice",targetId:deviceId,requestId,result:"success",occurredAt});}
export async function revokeAllPlatformSessions(repository:PlatformAdminRepository,actor:PlatformActor,requestId:string,occurredAt:string){assertPlatformPermission(actor,"platform.security.manage");await repository.revokeUserSessions(actor.userId,occurredAt);await repository.recordAudit({id:randomUUID(),actorUserId:actor.userId,action:"platform.security.sessions.revoke_all",targetType:"PlatformUser",targetId:actor.userId,requestId,result:"success",occurredAt});}

export async function createIncident(repository:PlatformControlPlaneRepository,actor:PlatformActor,input:{organizationId?:OrganizationId;severity:string;title:string;message:string;affectedTenantIds:readonly string[];requestId:string;occurredAt:string}){
  assertPlatformPermission(actor,"platform.incident.manage"); assertText(input.title,3,120,"PLATFORM_INCIDENT_TITLE_INVALID");assertText(input.message,8,1000,"PLATFORM_INCIDENT_MESSAGE_INVALID");
  await repository.createIncident({id:randomUUID(),...input,actor});
}
export async function transitionIncident(repository:PlatformControlPlaneRepository,actor:PlatformActor,input:{id:string;fromStatus:PlatformIncidentStatus;toStatus:PlatformIncidentStatus;message:string;requestId:string;occurredAt:string}){
  assertPlatformPermission(actor,"platform.incident.manage");assertIncidentTransition(input.fromStatus,input.toStatus);assertText(input.message,3,1000,"PLATFORM_INCIDENT_MESSAGE_INVALID");if(!await repository.transitionIncident({...input,actor}))throw new Error("PLATFORM_INCIDENT_CONFLICT");
}
export async function createMaintenance(repository:PlatformAdminRepository&PlatformControlPlaneRepository,actor:PlatformActor,input:{title:string;message:string;affectedTenantIds:readonly string[];plannedStartAt:string;plannedEndAt:string;mode:"read_only"|"full_stop";requestId:string;occurredAt:string}){
  assertPlatformPermission(actor,"platform.maintenance.manage");assertText(input.message,8,1000,"PLATFORM_MAINTENANCE_MESSAGE_INVALID");if(Date.parse(input.plannedEndAt)<=Date.parse(input.plannedStartAt))throw new Error("PLATFORM_MAINTENANCE_RANGE_INVALID");const id=randomUUID();await repository.createMaintenance({id,...input,actor});await repository.recordAudit({id:randomUUID(),actorUserId:actor.userId,action:"platform.maintenance.create",targetType:"MaintenanceWindow",targetId:id,requestId:input.requestId,result:"success",occurredAt:input.occurredAt});
}
export async function transitionMaintenance(repository:PlatformAdminRepository&PlatformControlPlaneRepository,actor:PlatformActor,input:{id:string;fromStatus:PlatformMaintenanceStatus;toStatus:PlatformMaintenanceStatus;requestId:string;occurredAt:string}){
  assertPlatformPermission(actor,"platform.maintenance.manage");assertMaintenanceTransition(input.fromStatus,input.toStatus);if(!await repository.transitionMaintenance(input))throw new Error("PLATFORM_MAINTENANCE_CONFLICT");await repository.recordAudit({id:randomUUID(),actorUserId:actor.userId,action:"platform.maintenance.transition",targetType:"MaintenanceWindow",targetId:input.id,requestId:input.requestId,result:"success",metadata:{from:input.fromStatus,to:input.toStatus},occurredAt:input.occurredAt});
}
export async function changeEmergencyStop(repository:PlatformAdminRepository&PlatformControlPlaneRepository,actor:PlatformActor,input:{organizationId:OrganizationId;tenantInstanceId?:TenantInstanceId;moduleId?:string;status:"active"|"inactive";mode:"full_stop"|"read_only"|"module_stop";blockedScopes:readonly string[];reason:string;requestId:string;occurredAt:string;expectedVersion?:number}){
  assertPlatformPermission(actor,"platform.emergency.manage");assertApprovalReason(input.reason);if(input.mode==="module_stop"&&!input.moduleId&&!input.blockedScopes.length)throw new Error("PLATFORM_EMERGENCY_SCOPE_REQUIRED");const id=randomUUID();await repository.setEmergencyStop({id,...input,actor});await repository.recordAudit({id:randomUUID(),actorUserId:actor.userId,organizationId:input.organizationId,tenantInstanceId:input.tenantInstanceId,action:"platform.emergency_stop.change",targetType:"EmergencyStop",targetId:id,requestId:input.requestId,result:"success",metadata:{status:input.status,mode:input.mode},occurredAt:input.occurredAt});
}

export async function requestOrganizationOperation(repository:PlatformAdminRepository&PlatformControlPlaneRepository,actor:PlatformActor,input:{organizationId:OrganizationId;tenantInstanceId?:TenantInstanceId;type:OrganizationOperationType;reason:string;idempotencyKey:string;payload:Readonly<Record<string,unknown>>;requestId:string;now:string}){
  assertPlatformPermission(actor,"platform.organization.workflow.manage");assertApprovalReason(input.reason);assertSafeControlPlaneMetadata(input.payload);const session=await repository.findSessionSecurity(actor.sessionId);assertRecentReauthentication(session?.lastReauthenticatedAt,input.now);const second=operationNeedsSecondApproval(input.type);
  const result=await repository.createOrganizationOperation({id:randomUUID(),...input,status:second?"awaiting_approval":"approved",requestedByUserId:actor.userId,requiresSecondApproval:second,reauthenticatedAt:input.now});await repository.recordAudit({id:randomUUID(),actorUserId:actor.userId,organizationId:input.organizationId,tenantInstanceId:input.tenantInstanceId,action:"platform.organization_operation.request",targetType:"OrganizationOperationJob",targetId:result.id,requestId:input.requestId,result:"success",metadata:{type:input.type,status:result.status,duplicate:result.duplicate},occurredAt:input.now});return result;
}
export async function approveOrganizationOperation(repository:PlatformAdminRepository&PlatformControlPlaneRepository,actor:PlatformActor,id:string,requestId:string,occurredAt:string){assertPlatformPermission(actor,"platform.organization.workflow.manage");if(!await repository.approveOrganizationOperation({id,approverUserId:actor.userId,occurredAt}))throw new Error("PLATFORM_OPERATION_APPROVAL_DENIED");await repository.recordAudit({id:randomUUID(),actorUserId:actor.userId,action:"platform.organization_operation.approve",targetType:"OrganizationOperationJob",targetId:id,requestId,result:"success",occurredAt});}
export async function cancelOrganizationOperation(repository:PlatformAdminRepository&PlatformControlPlaneRepository,actor:PlatformActor,id:string,requestId:string,occurredAt:string){assertPlatformPermission(actor,"platform.organization.workflow.manage");if(!await repository.cancelOrganizationOperation({id,actorUserId:actor.userId,occurredAt}))throw new Error("PLATFORM_OPERATION_CANCEL_DENIED");await repository.recordAudit({id:randomUUID(),actorUserId:actor.userId,action:"platform.organization_operation.cancel",targetType:"OrganizationOperationJob",targetId:id,requestId,result:"success",occurredAt});}

export async function issueTenantAdminInvitation(repository:PlatformAdminRepository&PlatformControlPlaneRepository,actor:PlatformActor,input:{organizationId:OrganizationId;tenantInstanceId:TenantInstanceId;email:string;displayName:string;requestId:string;occurredAt:string}){
  assertPlatformPermission(actor,"platform.invitation.manage");const token=randomBytes(32).toString("base64url");await repository.issueTenantAdminInvitation({id:randomUUID(),...input,email:input.email.trim().toLowerCase(),tokenHash:hashPublicId(token),expiresAt:new Date(Date.parse(input.occurredAt)+48*60*60*1000).toISOString(),invitedByUserId:actor.userId});await repository.recordAudit({id:randomUUID(),actorUserId:actor.userId,organizationId:input.organizationId,tenantInstanceId:input.tenantInstanceId,action:"platform.tenant_admin_invitation.issue",targetType:"TenantAdminInvitation",requestId:input.requestId,result:"success",metadata:{expiresInHours:48},occurredAt:input.occurredAt});return token;
}

export function hashRecoveryCode(userId:string,code:string,pepper:string){return createHash("sha256").update(`${userId}:${code.trim().toUpperCase()}:${pepper}`).digest("hex");}
function hashPublicId(value:string){return createHash("sha256").update(value).digest("hex");}
function assertText(value:string,min:number,max:number,code:string){const n=value.trim().length;if(n<min||n>max)throw new Error(code);}
