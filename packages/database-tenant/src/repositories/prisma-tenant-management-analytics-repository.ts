import {
  type CommandMeta,
  type DashboardSummary,
  type ManagementAnalyticsRepository,
  type ReportResult,
  type SearchResult,
} from "@tilbecore/tenant-core";
import type { Prisma, PrismaClient } from "../../generated/client";

type MoneyRow = { value: Prisma.Decimal | string | number | null };
type CountRow = { value: bigint | number | string | null };

export class PrismaTenantManagementAnalyticsRepository implements ManagementAnalyticsRepository {
  constructor(private readonly db: PrismaClient) {}

  async dashboard(input: { seasonId?: string; facilityId?: string; operationalPeriodId?: string }, _meta: CommandMeta): Promise<DashboardSummary> {
    const seasonFilter = input.seasonId ? Prisma.sql`WHERE "seasonId" = ${input.seasonId}` : Prisma.empty;
    const shareFilter = input.seasonId ? Prisma.sql`WHERE sc."seasonId" = ${input.seasonId}` : Prisma.empty;
    const [salesCount, reservationsActive, occupancy, listPrice, discount, netSales, receiptTotal, packages, deliveries, coldStored, approvals, overdueApprovals, auditRecent, bottlenecks, exceptions] = await Promise.all([
      count(this.db.$queryRaw<CountRow[]>`SELECT COUNT(*) AS value FROM "Sale" ${seasonFilter}`),
      count(this.db.$queryRaw<CountRow[]>`SELECT COUNT(*) AS value FROM "ShareReservation" WHERE "status" = 'active' ${input.seasonId ? Prisma.sql`AND "seasonId" = ${input.seasonId}` : Prisma.empty}`),
      this.db.$queryRaw<Array<{ sold: bigint; total: bigint }>>`SELECT COUNT(*) FILTER (WHERE s."status" = 'sold') AS sold, COUNT(*) AS total FROM "Share" s JOIN "ShareCard" sc ON sc."id" = s."shareCardId" ${shareFilter}`.then((rows) => rows[0] ?? { sold: 0n, total: 0n }),
      money(this.db.$queryRaw<MoneyRow[]>`SELECT COALESCE(SUM("listPriceSnapshot"), 0) AS value FROM "Sale" ${seasonFilter}`),
      money(this.db.$queryRaw<MoneyRow[]>`SELECT COALESCE(SUM("discountAmount"), 0) AS value FROM "Sale" ${seasonFilter}`),
      money(this.db.$queryRaw<MoneyRow[]>`SELECT COALESCE(SUM("priceSnapshot"), 0) AS value FROM "Sale" ${seasonFilter}`),
      money(this.db.$queryRaw<MoneyRow[]>`SELECT COALESCE(SUM("totalAmount"), 0) AS value FROM "Receipt" ${seasonFilter}`),
      count(this.db.$queryRaw<CountRow[]>`SELECT COUNT(*) AS value FROM "PackageRecord" p JOIN "Share" s ON s."id" = p."shareId" JOIN "ShareCard" sc ON sc."id" = s."shareCardId" ${shareFilter}`),
      count(this.db.$queryRaw<CountRow[]>`SELECT COUNT(*) AS value FROM "DeliveryRecord" d JOIN "Share" s ON s."id" = d."shareId" JOIN "ShareCard" sc ON sc."id" = s."shareCardId" ${shareFilter} ${input.seasonId ? Prisma.sql`AND d."status" = 'delivered'` : Prisma.sql`WHERE d."status" = 'delivered'`}`),
      count(this.db.$queryRaw<CountRow[]>`SELECT COUNT(*) AS value FROM "PackageRecord" p JOIN "Share" s ON s."id" = p."shareId" JOIN "ShareCard" sc ON sc."id" = s."shareCardId" ${shareFilter} ${input.seasonId ? Prisma.sql`AND p."locationStatus" = 'stored'` : Prisma.sql`WHERE p."locationStatus" = 'stored'`}`),
      count(this.db.$queryRaw<CountRow[]>`SELECT COUNT(*) AS value FROM "ApprovalRequest" WHERE "status" = 'pending'`),
      count(this.db.$queryRaw<CountRow[]>`SELECT COUNT(*) AS value FROM "ApprovalRequest" WHERE "status" = 'pending' AND "expiresAt" < now()`),
      count(this.db.$queryRaw<CountRow[]>`SELECT COUNT(*) AS value FROM "TenantAuditLog" WHERE "occurredAt" > now() - interval '24 hours'`),
      this.db.$queryRaw<Array<{ status: string; count: bigint }>>`SELECT "status", COUNT(*) AS count FROM "SlaughterJob" ${seasonFilter} GROUP BY "status" ORDER BY COUNT(*) DESC`,
      this.exceptionRows(input.seasonId, 12),
    ]);

    return {
      selected: { seasonId: input.seasonId, facilityId: input.facilityId, operationalPeriodId: input.operationalPeriodId },
      sales: {
        salesCount,
        reservationsActive,
        occupancySold: Number(occupancy.sold ?? 0),
        occupancyTotal: Number(occupancy.total ?? 0),
        listPriceTotal: listPrice,
        discountTotal: discount,
        netSalesTotal: netSales,
        receiptTotal,
      },
      operations: {
        slaughterJobs: bottlenecks.reduce((sum, row) => sum + Number(row.count), 0),
        bottlenecks: bottlenecks.map((row) => ({ status: row.status, count: Number(row.count) })),
        packages,
        deliveries,
        coldStored,
      },
      approvals: { pending: approvals, overdue: overdueApprovals },
      exceptions,
      audit: { recentCount: auditRecent },
    };
  }

  async report(input: { reportKey: string; filters: Record<string, string | undefined> }, _meta: CommandMeta): Promise<ReportResult> {
    const seasonId = input.filters.seasonId;
    const rows = await this.reportRows(input.reportKey, seasonId);
    return {
      reportKey: input.reportKey,
      filters: input.filters,
      rows,
      exportContracts: [
        { format: "csv", permission: "management.reporting.export.organization", route: `/api/tenant/management-analytics/export?reportKey=${encodeURIComponent(input.reportKey)}&format=csv` },
        { format: "xlsx", permission: "management.reporting.export.organization", route: `/api/tenant/management-analytics/export?reportKey=${encodeURIComponent(input.reportKey)}&format=xlsx` },
        { format: "pdf", permission: "management.reporting.export.organization", route: `/api/tenant/management-analytics/export?reportKey=${encodeURIComponent(input.reportKey)}&format=pdf` },
      ],
    };
  }

  async search(input: { query: string; limit: number; visiblePermissions: readonly string[] }, _meta: CommandMeta): Promise<SearchResult[]> {
    const q = `%${input.query}%`;
    const permissions = new Set(input.visiblePermissions);
    const all = permissions.has("*");
    const tasks: Array<Promise<SearchResult[]>> = [];
    if (all || permissions.has("kurban.customer.read.organization")) {
      tasks.push(this.db.$queryRaw<Array<{ id: string; displayName: string; phone: string | null }>>`
        SELECT c."id", c."displayName", MIN(cp."phone") AS phone
        FROM "Customer" c LEFT JOIN "CustomerPhone" cp ON cp."customerId" = c."id"
        WHERE c."displayName" ILIKE ${q} OR cp."phone" ILIKE ${q} OR cp."normalizedPhone" ILIKE ${q}
        GROUP BY c."id", c."displayName" LIMIT ${input.limit}
      `.then((rows) => rows.map((row) => ({ provider: "customer", id: row.id, label: row.displayName, subLabel: row.phone ?? undefined, route: `/musteriler/${row.id}`, permission: "kurban.customer.read.organization" }))));
    }
    if (all || permissions.has("kurban.animal.read.organization")) {
      tasks.push(this.db.$queryRaw<Array<{ id: string; earTag: string }>>`SELECT "id", "earTag" FROM "Animal" WHERE "earTag" ILIKE ${q} LIMIT ${input.limit}`
        .then((rows) => rows.map((row) => ({ provider: "animal", id: row.id, label: row.earTag, route: `/hayvanlar/${row.id}`, permission: "kurban.animal.read.organization" }))));
    }
    if (all || permissions.has("management.search.read.organization")) {
      tasks.push(this.db.$queryRaw<Array<{ id: string; labelNo: string; weight: string }>>`SELECT "id", "labelNo", "grossWeightKg"::text AS weight FROM "PackageRecord" WHERE "labelNo" ILIKE ${q} LIMIT ${input.limit}`
        .then((rows) => rows.map((row) => ({ provider: "package", id: row.id, label: row.labelNo, subLabel: `${row.weight} kg`, route: "/operasyon", permission: "management.search.read.organization" }))));
    }
    return (await Promise.all(tasks)).flat().slice(0, input.limit);
  }

  async exceptionInbox(input: { status?: string; limit: number }, _meta: CommandMeta): Promise<DashboardSummary["exceptions"]> {
    return this.exceptionRows(undefined, input.limit);
  }

  async saveDashboardView(input: { id: string; membershipId?: string; name: string; scope: string; filters: Record<string, unknown>; layout: Record<string, unknown> }, _meta: CommandMeta) {
    await this.db.$executeRaw`INSERT INTO "SavedDashboardView" ("id", "organizationMembershipId", "name", "scope", "filters", "layout", "createdAt", "updatedAt") VALUES (${input.id}, ${input.membershipId ?? null}, ${input.name}, ${input.scope}, ${json(input.filters)}::jsonb, ${json(input.layout)}::jsonb, now(), now())`;
    return { id: input.id };
  }

  private async exceptionRows(seasonId: string | undefined, limit: number): Promise<DashboardSummary["exceptions"]> {
    const approvalRows = await this.db.$queryRaw<Array<{ id: string; operationType: string; status: string; expiresAt: Date }>>`
      SELECT "id", "operationType", "status", "expiresAt" FROM "ApprovalRequest" WHERE "status" = 'pending' ORDER BY "expiresAt" ASC LIMIT ${limit}
    `;
    const operationRows = await this.db.$queryRaw<Array<{ id: string; status: string; updatedAt: Date }>>`
      SELECT "id", "status", "updatedAt" FROM "SlaughterJob" WHERE "status" = 'exception' ${seasonId ? Prisma.sql`AND "seasonId" = ${seasonId}` : Prisma.empty} ORDER BY "updatedAt" DESC LIMIT ${limit}
    `;
    return [
      ...approvalRows.map((row) => ({ id: row.id, source: "approval", priority: row.expiresAt < new Date() ? "critical" as const : "high" as const, title: row.operationType, status: row.status, dueAt: row.expiresAt.toISOString() })),
      ...operationRows.map((row) => ({ id: row.id, source: "slaughter", priority: "high" as const, title: "Kesim istisnası", status: row.status, dueAt: row.updatedAt.toISOString() })),
    ].slice(0, limit);
  }

  private async reportRows(reportKey: string, seasonId?: string): Promise<Array<Record<string, string | number | null>>> {
    if (reportKey === "sales-occupancy") {
      return this.db.$queryRaw<Array<Record<string, string | number | null>>>`
        SELECT sc."id" AS "shareCardId", COUNT(s."id")::int AS "shareTotal", COUNT(*) FILTER (WHERE s."status" = 'sold')::int AS "sold",
          COALESCE(SUM(s."listPriceSnapshot"), 0)::text AS "listPrice", COALESCE(SUM(s."discountAmountSnapshot"), 0)::text AS "discount", COALESCE(SUM(s."agreedPrice"), 0)::text AS "net"
        FROM "ShareCard" sc JOIN "Share" s ON s."shareCardId" = sc."id"
        ${seasonId ? Prisma.sql`WHERE sc."seasonId" = ${seasonId}` : Prisma.empty}
        GROUP BY sc."id" ORDER BY sc."id" LIMIT 500
      `;
    }
    if (reportKey === "operations-bottleneck") {
      return this.db.$queryRaw<Array<Record<string, string | number | null>>>`
        SELECT "status", COUNT(*)::int AS "count", MIN("updatedAt")::text AS "oldest"
        FROM "SlaughterJob" ${seasonId ? Prisma.sql`WHERE "seasonId" = ${seasonId}` : Prisma.empty}
        GROUP BY "status" ORDER BY COUNT(*) DESC
      `;
    }
    if (reportKey === "delivery-cold-storage") {
      return this.db.$queryRaw<Array<Record<string, string | number | null>>>`
        SELECT p."id", p."labelNo", p."locationStatus", d."status" AS "deliveryStatus"
        FROM "PackageRecord" p
        JOIN "Share" s ON s."id" = p."shareId"
        JOIN "ShareCard" sc ON sc."id" = s."shareCardId"
        LEFT JOIN "DeliveryRecord" d ON d."shareId" = s."id" AND d."status" = 'delivered'
        ${seasonId ? Prisma.sql`WHERE sc."seasonId" = ${seasonId}` : Prisma.empty}
        LIMIT 500
      `;
    }
    return this.db.$queryRaw<Array<Record<string, string | number | null>>>`
      SELECT "action", "targetType", COUNT(*)::int AS "count", MAX("occurredAt")::text AS "lastAt"
      FROM "TenantAuditLog" GROUP BY "action", "targetType" ORDER BY MAX("occurredAt") DESC LIMIT 500
    `;
  }
}

async function count(rowsPromise: Promise<CountRow[]>): Promise<number> {
  const row = (await rowsPromise)[0];
  return Number(row?.value ?? 0);
}

async function money(rowsPromise: Promise<MoneyRow[]>): Promise<string> {
  const row = (await rowsPromise)[0];
  return String(row?.value ?? "0");
}

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
