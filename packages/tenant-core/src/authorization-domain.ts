import type { TenantInstanceId } from "@tilbecore/contracts";

export type IdentityKind =
  | "PLATFORM_USER"
  | "ORGANIZATION_USER"
  | "CUSTOMER"
  | "SERVICE_ACCOUNT"
  | "DEVICE_IDENTITY"
  | "EXTERNAL_USER";

export type ProtectedOrganizationRole =
  | "ORGANIZATION_OWNER"
  | "EXECUTIVE_ADMIN"
  | "SECURITY_ADMIN"
  | "ACCESS_ADMIN"
  | "COMPLIANCE_AUDITOR"
  | "SUPPORT_APPROVER";

export type RoleType = "SYSTEM_PROTECTED" | "SYSTEM_TEMPLATE" | "CUSTOM";
export type AccessLevel =
  | "MANAGER"
  | "SUPERVISOR"
  | "AUTHORIZED_OPERATOR"
  | "OPERATOR"
  | "VIEWER"
  | "TEMPORARY"
  | "GUEST";
export type AuthorizationEffect = "ALLOW" | "DENY";
export type AuthorizationDecision = "ALLOW" | "DENY" | "APPROVAL_REQUIRED";
export type PermissionKey = `${string}.${string}.${string}.${string}`;

export interface PermissionContract {
  module: string;
  resource: string;
  action: string;
  scope: string;
  key: PermissionKey;
}

export interface AuthorizationSubject {
  kind: IdentityKind;
  id: string;
  organizationMembershipId?: string;
  sessionId?: string;
}

export interface AssignedRecordContext {
  type: string;
  id: string;
  assignedToSubjectId?: string;
  assignedToMembershipId?: string;
}

export interface AuthorizationContext {
  tenantInstanceId: TenantInstanceId;
  organizationId?: string;
  facilityId?: string;
  departmentId?: string;
  operationalPeriodId?: string;
  assignedRecord?: AssignedRecordContext;
  amount?: string;
  currency?: string;
  occurredAt: string;
  localTime?: string;
  trustedDevice: boolean;
  network?: string;
  mfaLevel: number;
  approval?: { requestId: string; approved: boolean; approvalCount: number; distinctApproverCount: number };
  requestId: string;
  traceId?: string;
}

export interface AccessScopeRule {
  id?: string;
  facilityId?: string;
  departmentId?: string;
  operationalPeriodId?: string;
  assignedRecordType?: string;
  assignedRecordId?: string;
  additionalConstraints?: AuthorizationConditions;
}

export interface AuthorizationConditions {
  organization?: readonly string[];
  facility?: readonly string[];
  department?: readonly string[];
  operationalPeriod?: readonly string[];
  assignedRecord?: boolean | { types?: readonly string[]; ids?: readonly string[] };
  amountLimit?: { min?: string; max?: string; currency?: string };
  timeWindow?: { daysOfWeek?: readonly number[]; start?: string; end?: string };
  trustedDevice?: boolean;
  network?: readonly string[];
  mfaLevel?: number;
  approvalRequirement?: { policyId?: string; approvals?: number; distinctApprovers?: number };
  validFrom?: string;
  validUntil?: string;
}

export interface EffectivePermissionGrant {
  id: string;
  permissionKey: PermissionKey;
  effect: AuthorizationEffect;
  source: "ROLE" | "CONDITIONAL_POLICY" | "DELEGATION" | "SERVICE_ACCOUNT" | "DEVICE" | "EXTERNAL";
  sourceId: string;
  accessScope?: AccessScopeRule;
  conditions?: AuthorizationConditions;
  validFrom?: string;
  validUntil?: string;
}

export interface EffectiveApprovalPolicy {
  id: string;
  permissionKey: PermissionKey;
  conditions: AuthorizationConditions;
  requiredApprovals: number;
  requireDistinctUser: boolean;
  requireReauthentication: boolean;
}

export interface AuthorizationEvaluationInput {
  subject: AuthorizationSubject;
  permissionKey: PermissionKey;
  context: AuthorizationContext;
  grants: readonly EffectivePermissionGrant[];
  approvalPolicies?: readonly EffectiveApprovalPolicy[];
}

export interface AuthorizationEvaluation {
  decision: AuthorizationDecision;
  permissionKey: PermissionKey;
  reasonCodes: readonly string[];
  matchedGrantIds: readonly string[];
  evaluatedPolicyIds: readonly string[];
  requiredApprovalPolicyId?: string;
}

const SEGMENT = /^[a-z][a-z0-9_-]{0,62}$|^\*$/;
const ROLE_TYPES = new Set<RoleType>(["SYSTEM_PROTECTED", "SYSTEM_TEMPLATE", "CUSTOM"]);
const ACCESS_LEVELS = new Set<AccessLevel>(["MANAGER", "SUPERVISOR", "AUTHORIZED_OPERATOR", "OPERATOR", "VIEWER", "TEMPORARY", "GUEST"]);
const PROTECTED_ROLES = new Set<ProtectedOrganizationRole>(["ORGANIZATION_OWNER", "EXECUTIVE_ADMIN", "SECURITY_ADMIN", "ACCESS_ADMIN", "COMPLIANCE_AUDITOR", "SUPPORT_APPROVER"]);

export function permissionKey(value: string, allowWildcard = false): PermissionKey {
  const segments = value.split(".");
  if (segments.length !== 4 || segments.some((segment) => !SEGMENT.test(segment)) || (!allowWildcard && segments.includes("*"))) {
    throw new AuthorizationError("PERMISSION_KEY_INVALID");
  }
  return value as PermissionKey;
}

export function parsePermissionContract(value: string, allowWildcard = false): PermissionContract {
  const key = permissionKey(value, allowWildcard);
  const [module, resource, action, scope] = key.split(".") as [string, string, string, string];
  return { module, resource, action, scope, key };
}

export function assertRoleDefinition(input: { type: string; protectedCode?: string; functionalArea: string; accessLevel: string }): void {
  if (!ROLE_TYPES.has(input.type as RoleType)) throw new AuthorizationError("ROLE_TYPE_INVALID");
  if (!ACCESS_LEVELS.has(input.accessLevel as AccessLevel)) throw new AuthorizationError("ROLE_ACCESS_LEVEL_INVALID");
  if (!/^[a-z][a-z0-9_-]{1,80}$/.test(input.functionalArea)) throw new AuthorizationError("ROLE_FUNCTIONAL_AREA_INVALID");
  if (input.type === "SYSTEM_PROTECTED") {
    if (!input.protectedCode || !PROTECTED_ROLES.has(input.protectedCode as ProtectedOrganizationRole)) throw new AuthorizationError("PROTECTED_ROLE_CODE_INVALID");
  } else if (input.protectedCode) {
    throw new AuthorizationError("NON_PROTECTED_ROLE_CODE_FORBIDDEN");
  }
}

export function isCriticalRole(code: string | undefined): boolean {
  return code === "ORGANIZATION_OWNER" || code === "EXECUTIVE_ADMIN" || code === "SECURITY_ADMIN" || code === "ACCESS_ADMIN" || code === "SUPPORT_APPROVER";
}

export function evaluateAuthorization(input: AuthorizationEvaluationInput): AuthorizationEvaluation {
  permissionKey(input.permissionKey);
  assertContext(input.context);
  if (input.subject.kind === "CUSTOMER") return denied(input, ["CUSTOMER_NOT_ORGANIZATION_STAFF"]);
  if (input.subject.kind === "PLATFORM_USER") return denied(input, ["PLATFORM_USER_REQUIRES_SUPPORT_SESSION"]);

  const matching = input.grants.filter((grant) => permissionMatches(grant.permissionKey, input.permissionKey));
  const applicable = matching.filter((grant) => grantApplies(grant, input.subject, input.context));
  const denies = applicable.filter((grant) => grant.effect === "DENY");
  if (denies.length > 0) {
    return { decision: "DENY", permissionKey: input.permissionKey, reasonCodes: ["EXPLICIT_DENY"], matchedGrantIds: denies.map((grant) => grant.id), evaluatedPolicyIds: policyIds(applicable) };
  }

  const allows = applicable.filter((grant) => grant.effect === "ALLOW");
  if (allows.length === 0) return denied(input, matching.length > 0 ? ["CONDITIONS_NOT_SATISFIED"] : ["PERMISSION_NOT_GRANTED"]);

  const approvalPolicy = input.approvalPolicies?.find((policy) =>
    permissionMatches(policy.permissionKey, input.permissionKey) && conditionsMatch(policy.conditions, input.subject, input.context),
  );
  if (approvalPolicy && !approvalSatisfied(approvalPolicy, input.context)) {
    return {
      decision: "APPROVAL_REQUIRED",
      permissionKey: input.permissionKey,
      reasonCodes: ["SECOND_APPROVAL_REQUIRED"],
      matchedGrantIds: allows.map((grant) => grant.id),
      evaluatedPolicyIds: [...policyIds(applicable), approvalPolicy.id],
      requiredApprovalPolicyId: approvalPolicy.id,
    };
  }

  return { decision: "ALLOW", permissionKey: input.permissionKey, reasonCodes: ["GRANT_MATCHED"], matchedGrantIds: allows.map((grant) => grant.id), evaluatedPolicyIds: policyIds(applicable) };
}

export function assertAuthorizationAllowed(evaluation: AuthorizationEvaluation): void {
  if (evaluation.decision !== "ALLOW") throw new AuthorizationError(evaluation.decision === "APPROVAL_REQUIRED" ? "AUTHORIZATION_APPROVAL_REQUIRED" : "AUTHORIZATION_DENIED", evaluation);
}

export function assertRecentReauthentication(lastReauthenticatedAt: string | undefined, nowIso: string, maxAgeSeconds = 300): void {
  if (!lastReauthenticatedAt) throw new AuthorizationError("REAUTHENTICATION_REQUIRED");
  const age = Date.parse(nowIso) - Date.parse(lastReauthenticatedAt);
  if (!Number.isFinite(age) || age < 0 || age > maxAgeSeconds * 1000) throw new AuthorizationError("REAUTHENTICATION_REQUIRED");
}

export function assertDelegationWindow(validFrom: string, validUntil: string, reason: string, maxDays = 30): void {
  const start = Date.parse(validFrom); const end = Date.parse(validUntil);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end - start > maxDays * 86_400_000) throw new AuthorizationError("DELEGATION_WINDOW_INVALID");
  if (reason.trim().length < 8 || reason.trim().length > 500) throw new AuthorizationError("DELEGATION_REASON_REQUIRED");
}

export function functionalRoleKey(functionalArea: string, accessLevel: AccessLevel): string {
  if (!ACCESS_LEVELS.has(accessLevel) || !/^[a-z][a-z0-9_-]{1,80}$/.test(functionalArea)) throw new AuthorizationError("FUNCTIONAL_ROLE_INVALID");
  return `${functionalArea}:${accessLevel}`;
}

function denied(input: AuthorizationEvaluationInput, reasonCodes: string[]): AuthorizationEvaluation {
  return { decision: "DENY", permissionKey: input.permissionKey, reasonCodes, matchedGrantIds: [], evaluatedPolicyIds: [] };
}

function permissionMatches(granted: PermissionKey, requested: PermissionKey): boolean {
  const grant = parsePermissionContract(granted, true); const target = parsePermissionContract(requested);
  return (["module", "resource", "action", "scope"] as const).every((segment) => grant[segment] === "*" || grant[segment] === target[segment]);
}

function grantApplies(grant: EffectivePermissionGrant, subject: AuthorizationSubject, context: AuthorizationContext): boolean {
  if (!dateWindowMatches(grant.validFrom, grant.validUntil, context.occurredAt)) return false;
  if (grant.accessScope && !scopeMatches(grant.accessScope, subject, context)) return false;
  return !grant.conditions || conditionsMatch(grant.conditions, subject, context);
}

function scopeMatches(scope: AccessScopeRule, subject: AuthorizationSubject, context: AuthorizationContext): boolean {
  if (scope.facilityId && scope.facilityId !== context.facilityId) return false;
  if (scope.departmentId && scope.departmentId !== context.departmentId) return false;
  if (scope.operationalPeriodId && scope.operationalPeriodId !== context.operationalPeriodId) return false;
  if (scope.assignedRecordType && scope.assignedRecordType !== context.assignedRecord?.type) return false;
  if (scope.assignedRecordId && scope.assignedRecordId !== context.assignedRecord?.id) return false;
  return !scope.additionalConstraints || conditionsMatch(scope.additionalConstraints, subject, context);
}

function conditionsMatch(conditions: AuthorizationConditions, subject: AuthorizationSubject, context: AuthorizationContext): boolean {
  if (!dateWindowMatches(conditions.validFrom, conditions.validUntil, context.occurredAt)) return false;
  if (conditions.organization && (!context.organizationId || !conditions.organization.includes(context.organizationId))) return false;
  if (conditions.facility && (!context.facilityId || !conditions.facility.includes(context.facilityId))) return false;
  if (conditions.department && (!context.departmentId || !conditions.department.includes(context.departmentId))) return false;
  if (conditions.operationalPeriod && (!context.operationalPeriodId || !conditions.operationalPeriod.includes(context.operationalPeriodId))) return false;
  if (conditions.assignedRecord && !assignedRecordMatches(conditions.assignedRecord, subject, context.assignedRecord)) return false;
  if (conditions.amountLimit && !amountMatches(conditions.amountLimit, context)) return false;
  if (conditions.timeWindow && !timeMatches(conditions.timeWindow, context)) return false;
  if (conditions.trustedDevice !== undefined && conditions.trustedDevice !== context.trustedDevice) return false;
  if (conditions.network && (!context.network || !conditions.network.some((item) => networkMatches(item, context.network!)))) return false;
  if (conditions.mfaLevel !== undefined && context.mfaLevel < conditions.mfaLevel) return false;
  if (conditions.approvalRequirement && !conditionApprovalSatisfied(conditions.approvalRequirement, context)) return false;
  return true;
}

function assignedRecordMatches(condition: NonNullable<AuthorizationConditions["assignedRecord"]>, subject: AuthorizationSubject, record?: AssignedRecordContext): boolean {
  if (!record) return false;
  const assigned = record.assignedToSubjectId === subject.id || (!!subject.organizationMembershipId && record.assignedToMembershipId === subject.organizationMembershipId);
  if (condition === true) return assigned;
  if (!assigned) return false;
  if (condition.types && !condition.types.includes(record.type)) return false;
  return !condition.ids || condition.ids.includes(record.id);
}

function amountMatches(limit: NonNullable<AuthorizationConditions["amountLimit"]>, context: AuthorizationContext): boolean {
  if (context.amount === undefined) return false;
  if (limit.currency && context.currency !== limit.currency) return false;
  try {
    const amount = decimalUnits(context.amount);
    if (limit.min !== undefined && amount < decimalUnits(limit.min)) return false;
    if (limit.max !== undefined && amount > decimalUnits(limit.max)) return false;
    return limit.min !== undefined || limit.max !== undefined;
  } catch { return false; }
}

function decimalUnits(value: string): bigint {
  if (!/^-?\d+(?:\.\d{1,4})?$/.test(value)) throw new AuthorizationError("AUTHORIZATION_AMOUNT_INVALID");
  const negative = value.startsWith("-"); const unsigned = negative ? value.slice(1) : value;
  const [whole, fraction = ""] = unsigned.split(".");
  const units = BigInt(whole) * BigInt(10_000) + BigInt(fraction.padEnd(4, "0"));
  return negative ? -units : units;
}

function timeMatches(window: NonNullable<AuthorizationConditions["timeWindow"]>, context: AuthorizationContext): boolean {
  const occurred = new Date(context.occurredAt);
  if (window.daysOfWeek && !window.daysOfWeek.includes(occurred.getUTCDay())) return false;
  if (!window.start && !window.end) return true;
  const local = context.localTime;
  if (!local || !/^([01]\d|2[0-3]):[0-5]\d$/.test(local)) return false;
  if (window.start && local < window.start) return false;
  return !window.end || local <= window.end;
}

function networkMatches(rule: string, actual: string): boolean {
  if (rule.endsWith("*")) return actual.startsWith(rule.slice(0, -1));
  return rule === actual;
}

function dateWindowMatches(validFrom: string | undefined, validUntil: string | undefined, occurredAt: string): boolean {
  const now = Date.parse(occurredAt);
  if (!Number.isFinite(now)) return false;
  const from = validFrom ? Date.parse(validFrom) : undefined;
  const until = validUntil ? Date.parse(validUntil) : undefined;
  if ((from !== undefined && !Number.isFinite(from)) || (until !== undefined && !Number.isFinite(until))) return false;
  return (from === undefined || from <= now) && (until === undefined || until > now);
}

function approvalSatisfied(policy: EffectiveApprovalPolicy, context: AuthorizationContext): boolean {
  const approval = context.approval;
  if (!approval?.approved || approval.approvalCount < policy.requiredApprovals) return false;
  return !policy.requireDistinctUser || approval.distinctApproverCount >= policy.requiredApprovals;
}

function conditionApprovalSatisfied(requirement: NonNullable<AuthorizationConditions["approvalRequirement"]>, context: AuthorizationContext): boolean {
  const approval = context.approval;
  if (!approval?.approved) return false;
  return approval.approvalCount >= (requirement.approvals ?? 1) && approval.distinctApproverCount >= (requirement.distinctApprovers ?? 1);
}

function policyIds(grants: readonly EffectivePermissionGrant[]): string[] {
  return grants.filter((grant) => grant.source === "CONDITIONAL_POLICY").map((grant) => grant.sourceId);
}

function assertContext(context: AuthorizationContext): void {
  if (!context.requestId || !Number.isFinite(Date.parse(context.occurredAt)) || context.mfaLevel < 0) throw new AuthorizationError("AUTHORIZATION_CONTEXT_INVALID");
}

export class AuthorizationError extends Error {
  constructor(public readonly code: string, public readonly evaluation?: AuthorizationEvaluation) { super(code); this.name = "AuthorizationError"; }
}
