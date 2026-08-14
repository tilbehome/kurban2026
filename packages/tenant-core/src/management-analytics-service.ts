import { randomUUID } from "node:crypto";
import type { PermissionKey } from "./authorization-domain";
import { AuthorizationError, type AuthorizationSubject } from "./authorization-domain";
import type { TenantAuthorizationService } from "./authorization-service";
import { commandMeta, type CommandMeta, type TenantUseCaseContext } from "./master-data-domain";

export type ManagementPermission =
  | "management.dashboard.read.organization"
  | "management.dashboard.manage.organization"
  | "management.reporting.read.organization"
  | "management.reporting.export.organization"
  | "management.search.read.organization"
  | "management.exception.manage.organization"
  | "management.company.manage.organization";

export interface DashboardSummary {
  selected: { seasonId?: string; facilityId?: string; operationalPeriodId?: string };
  entities: { animals: number; customers: number; suppliers: number };
  sales: { salesCount: number; reservationsActive: number; occupancySold: number; occupancyTotal: number; listPriceTotal: string; discountTotal: string; netSalesTotal: string; receiptTotal: string };
  operations: { slaughterJobs: number; bottlenecks: Array<{ status: string; count: number }>; weighings: number; packages: number; deliveries: number; coldStored: number; openExceptions: number };
  finance: { journalEntries: number; unbalancedJournalEntries: number; difference: string; reconciled: boolean };
  approvals: { pending: number; overdue: number };
  exceptions: Array<{ id: string; source: string; priority: "low" | "normal" | "high" | "critical"; title: string; status: string; dueAt?: string }>;
  audit: { recentCount: number };
}

export interface ReportResult {
  reportKey: string;
  filters: Record<string, string | undefined>;
  rows: Array<Record<string, string | number | null>>;
  exportContracts: Array<{ format: "csv" | "xlsx" | "pdf"; permission: ManagementPermission; route: string }>;
}

export interface ReportBuilderResult {
  reportKey: string;
  dimensions: string[];
  measures: string[];
  rows: Array<Record<string, string | number | null>>;
  chart: { type: "bar" | "line" | "table"; x: string; series: Array<{ key: string; points: Array<{ label: string; value: number }> }> };
}

export interface SearchResult {
  provider: string;
  id: string;
  label: string;
  subLabel?: string;
  route?: string;
  permission: string;
}

export interface ManagementAnalyticsRepository {
  dashboard(input: { seasonId?: string; facilityId?: string; operationalPeriodId?: string }, meta: CommandMeta): Promise<DashboardSummary>;
  report(input: { reportKey: string; filters: Record<string, string | undefined> }, meta: CommandMeta): Promise<ReportResult>;
  search(input: { query: string; limit: number; visiblePermissions: readonly string[] }, meta: CommandMeta): Promise<SearchResult[]>;
  exceptionInbox(input: { status?: string; limit: number }, meta: CommandMeta): Promise<DashboardSummary["exceptions"]>;
  saveDashboardView(input: { id: string; membershipId?: string; name: string; scope: string; filters: Record<string, unknown>; layout: Record<string, unknown> }, meta: CommandMeta): Promise<{ id: string }>;
}

export class TenantManagementAnalyticsService {
  constructor(private readonly repository: ManagementAnalyticsRepository, private readonly authorization?: TenantAuthorizationService) {}

  async dashboard(context: TenantUseCaseContext, input: { seasonId?: string; facilityId?: string; operationalPeriodId?: string }) {
    await this.authorize(context, "management.dashboard.read.organization", {});
    return this.repository.dashboard(input, commandMeta(context));
  }

  async report(context: TenantUseCaseContext, input: { reportKey: string; filters: Record<string, string | undefined> }) {
    await this.authorize(context, "management.reporting.read.organization", { operationalPeriodId: input.filters.seasonId });
    return this.repository.report(input, commandMeta(context));
  }

  async exportReport(context: TenantUseCaseContext, input: { reportKey: string; filters: Record<string, string | undefined>; format: "csv" | "xlsx" | "pdf" }) {
    await this.authorize(context, "management.reporting.export.organization", { operationalPeriodId: input.filters.seasonId });
    return this.repository.report({ reportKey: input.reportKey, filters: input.filters }, commandMeta(context));
  }

  async reportBuilder(context: TenantUseCaseContext, input: { reportKey: string; filters: Record<string, string | undefined>; dimensions?: string[]; measures?: string[] }): Promise<ReportBuilderResult> {
    await this.authorize(context, "management.reporting.read.organization", { operationalPeriodId: input.filters.seasonId });
    const report = await this.repository.report({ reportKey: input.reportKey, filters: input.filters }, commandMeta(context));
    const first = report.rows[0] ?? {};
    const keys = Object.keys(first);
    const dimensions = (input.dimensions?.length ? input.dimensions : keys.filter((key) => typeof first[key] === "string")).slice(0, 4);
    const measures = (input.measures?.length ? input.measures : keys.filter((key) => isNumericLike(first[key]))).slice(0, 4);
    const x = dimensions[0] ?? keys[0] ?? "row";
    return {
      reportKey: input.reportKey,
      dimensions,
      measures,
      rows: report.rows,
      chart: {
        type: measures.length > 0 ? "bar" : "table",
        x,
        series: measures.map((measure) => ({
          key: measure,
          points: report.rows.slice(0, 100).map((row, index) => ({ label: String(row[x] ?? `#${index + 1}`), value: toNumber(row[measure]) })),
        })),
      },
    };
  }

  async search(context: TenantUseCaseContext, input: { query: string; limit?: number }) {
    await this.authorize(context, "management.search.read.organization", {});
    if (input.query.trim().length < 2) throw new TenantManagementAnalyticsError("SEARCH_QUERY_TOO_SHORT");
    return this.repository.search({ query: input.query.trim(), limit: Math.min(Math.max(input.limit ?? 12, 1), 25), visiblePermissions: context.permissions }, commandMeta(context));
  }

  async exceptionInbox(context: TenantUseCaseContext, input: { status?: string; limit?: number }) {
    await this.authorize(context, "management.exception.manage.organization", {});
    return this.repository.exceptionInbox({ status: input.status, limit: Math.min(Math.max(input.limit ?? 30, 1), 100) }, commandMeta(context));
  }

  async saveDashboardView(context: TenantUseCaseContext, input: { name: string; scope: string; filters: Record<string, unknown>; layout: Record<string, unknown> }) {
    await this.authorize(context, "management.dashboard.manage.organization", {});
    return this.repository.saveDashboardView({ id: `dashboard_view_${randomUUID()}`, membershipId: context.organizationMembershipId, ...input }, commandMeta(context));
  }

  private async authorize(context: TenantUseCaseContext, permission: ManagementPermission, facts: { operationalPeriodId?: string }) {
    if (this.authorization && context.organizationMembershipId) {
      return this.authorization.require({
        subject: {
          kind: context.identityKind ?? "ORGANIZATION_USER",
          id: context.actorIdentityId ?? context.actorUserId,
          organizationMembershipId: context.organizationMembershipId,
          sessionId: context.sessionId,
        } as AuthorizationSubject,
        context: {
          tenantInstanceId: context.tenantInstanceId,
          organizationId: context.organizationId,
          facilityId: context.facilityId,
          departmentId: context.departmentId,
          operationalPeriodId: facts.operationalPeriodId ?? context.operationalPeriodId,
          occurredAt: context.occurredAt,
          trustedDevice: context.trustedDevice ?? false,
          network: context.network,
          mfaLevel: context.mfaLevel ?? 0,
          approval: context.approval,
          requestId: context.requestId,
        },
        lastReauthenticatedAt: context.lastReauthenticatedAt,
      }, permission as PermissionKey);
    }
    if (context.authorizationMode === "database") throw new AuthorizationError("ORGANIZATION_MEMBERSHIP_REQUIRED");
    if (!context.permissions.includes("*") && !context.permissions.includes(permission)) throw new TenantManagementAnalyticsError("PERMISSION_DENIED");
  }
}

export class TenantManagementAnalyticsError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "TenantManagementAnalyticsError";
  }
}

function isNumericLike(value: unknown): boolean {
  return typeof value === "number" || (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)));
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}
