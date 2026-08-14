import {
  type CommandMeta,
  type DashboardSummary,
  type ManagementAnalyticsRepository,
  type ReportResult,
  type SearchResult,
} from "@tilbecore/tenant-core";
import { Prisma, type PrismaClient } from "../../generated/client";

type MoneyRow = { value: Prisma.Decimal | string | number | null };
type CountRow = { value: bigint | number | string | null };

export class PrismaTenantManagementAnalyticsRepository implements ManagementAnalyticsRepository {
  constructor(private readonly db: PrismaClient) {}

  async dashboard(input: { seasonId?: string; facilityId?: string; operationalPeriodId?: string }, _meta: CommandMeta): Promise<DashboardSummary> {
    const seasonFilter = input.seasonId ? Prisma.sql`WHERE "seasonId" = ${input.seasonId}` : Prisma.empty;
    const shareFilter = input.seasonId ? Prisma.sql`WHERE sc."seasonId" = ${input.seasonId}` : Prisma.empty;
    const [animals, customers, suppliers, salesCount, reservationsActive, occupancy, listPrice, discount, netSales, receiptTotal, weighings, packages, deliveries, coldStored, openOperationExceptions, journalReconciliation, approvals, overdueApprovals, auditRecent, bottlenecks, exceptions] = await Promise.all([
      count(this.db.$queryRaw<CountRow[]>`SELECT COUNT(*) AS value FROM "Animal" ${seasonFilter}`),
      count(this.db.$queryRaw<CountRow[]>`SELECT COUNT(DISTINCT "customerId") AS value FROM "CustomerSeasonAccount" ${seasonFilter}`),
      count(this.db.$queryRaw<CountRow[]>`SELECT COUNT(DISTINCT "supplierId") AS value FROM "SupplierAccount" ${seasonFilter}`),
      count(this.db.$queryRaw<CountRow[]>`SELECT COUNT(*) AS value FROM "Sale" WHERE "status" = 'confirmed' ${input.seasonId ? Prisma.sql`AND "seasonId" = ${input.seasonId}` : Prisma.empty}`),
      count(this.db.$queryRaw<CountRow[]>`SELECT COUNT(*) AS value FROM "ShareReservation" WHERE "status" = 'active' ${input.seasonId ? Prisma.sql`AND "seasonId" = ${input.seasonId}` : Prisma.empty}`),
      this.db.$queryRaw<Array<{ sold: bigint | number; total: bigint | number }>>`SELECT COUNT(*) FILTER (WHERE s."status" = 'sold') AS sold, COUNT(*) AS total FROM "Share" s JOIN "ShareCard" sc ON sc."id" = s."shareCardId" ${shareFilter}`.then((rows) => rows[0] ?? { sold: 0, total: 0 }),
      money(this.db.$queryRaw<MoneyRow[]>`SELECT COALESCE(SUM("listPriceSnapshot"), 0) AS value FROM "Sale" WHERE "status" = 'confirmed' ${input.seasonId ? Prisma.sql`AND "seasonId" = ${input.seasonId}` : Prisma.empty}`),
      money(this.db.$queryRaw<MoneyRow[]>`SELECT COALESCE(SUM("discountAmount"), 0) AS value FROM "Sale" WHERE "status" = 'confirmed' ${input.seasonId ? Prisma.sql`AND "seasonId" = ${input.seasonId}` : Prisma.empty}`),
      money(this.db.$queryRaw<MoneyRow[]>`SELECT COALESCE(SUM("priceSnapshot"), 0) AS value FROM "Sale" WHERE "status" = 'confirmed' ${input.seasonId ? Prisma.sql`AND "seasonId" = ${input.seasonId}` : Prisma.empty}`),
      money(this.db.$queryRaw<MoneyRow[]>`SELECT COALESCE(SUM(CASE WHEN "reversalOfId" IS NULL AND "status" IN ('posted', 'reversed') THEN "totalAmount" WHEN "reversalOfId" IS NOT NULL AND "status" = 'reversed' THEN -"totalAmount" ELSE 0 END), 0) AS value FROM "Receipt" ${seasonFilter}`),
      count(this.db.$queryRaw<CountRow[]>`SELECT COUNT(*) AS value FROM "WeighingRecord" ${seasonFilter}`),
      count(this.db.$queryRaw<CountRow[]>`SELECT COUNT(*) AS value FROM "PackageRecord" p JOIN "Share" s ON s."id" = p."shareId" JOIN "ShareCard" sc ON sc."id" = s."shareCardId" ${shareFilter}`),
      count(this.db.$queryRaw<CountRow[]>`SELECT COUNT(*) AS value FROM "DeliveryRecord" d JOIN "Share" s ON s."id" = d."shareId" JOIN "ShareCard" sc ON sc."id" = s."shareCardId" ${shareFilter} ${input.seasonId ? Prisma.sql`AND d."status" = 'delivered'` : Prisma.sql`WHERE d."status" = 'delivered'`}`),
      count(this.db.$queryRaw<CountRow[]>`SELECT COUNT(*) AS value FROM "PackageRecord" p JOIN "Share" s ON s."id" = p."shareId" JOIN "ShareCard" sc ON sc."id" = s."shareCardId" ${shareFilter} ${input.seasonId ? Prisma.sql`AND p."locationStatus" = 'stored'` : Prisma.sql`WHERE p."locationStatus" = 'stored'`}`),
      count(this.db.$queryRaw<CountRow[]>`SELECT COUNT(*) AS value FROM "OperationException" WHERE "status" IN ('open','assigned','reopened') ${input.seasonId ? Prisma.sql`AND "seasonId" = ${input.seasonId}` : Prisma.empty}`),
      this.db.$queryRaw<Array<{ entries: bigint; unbalanced: bigint; difference: string }>>`
        SELECT COUNT(*)::bigint AS entries, COUNT(*) FILTER (WHERE totals.debit <> totals.credit)::bigint AS unbalanced,
          COALESCE(SUM(totals.debit - totals.credit), 0)::text AS difference
        FROM (SELECT entry."id", COALESCE(SUM(line."amount") FILTER (WHERE line."side" = 'debit'), 0) debit,
          COALESCE(SUM(line."amount") FILTER (WHERE line."side" = 'credit'), 0) credit
          FROM "JournalEntry" entry JOIN "JournalLine" line ON line."journalEntryId" = entry."id"
          ${input.seasonId ? Prisma.sql`WHERE entry."seasonId" = ${input.seasonId}` : Prisma.empty} GROUP BY entry."id") totals`.then((rows) => rows[0] ?? { entries: 0n, unbalanced: 0n, difference: "0" }),
      count(this.db.$queryRaw<CountRow[]>`SELECT COUNT(*) AS value FROM "ApprovalRequest" WHERE "status" = 'pending'`),
      count(this.db.$queryRaw<CountRow[]>`SELECT COUNT(*) AS value FROM "ApprovalRequest" WHERE "status" = 'pending' AND "expiresAt" < now()`),
      count(this.db.$queryRaw<CountRow[]>`SELECT COUNT(*) AS value FROM "TenantAuditLog" WHERE "occurredAt" > now() - interval '24 hours'`),
      this.db.$queryRaw<Array<{ status: string; count: bigint }>>`SELECT "status", COUNT(*) AS count FROM "SlaughterJob" ${seasonFilter} GROUP BY "status" ORDER BY COUNT(*) DESC`,
      this.exceptionRows(input.seasonId, 12),
    ]);

    return {
      selected: { seasonId: input.seasonId, facilityId: input.facilityId, operationalPeriodId: input.operationalPeriodId },
      entities: { animals, customers, suppliers },
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
        weighings,
        packages,
        deliveries,
        coldStored,
        openExceptions: openOperationExceptions,
      },
      finance: { journalEntries: Number(journalReconciliation.entries), unbalancedJournalEntries: Number(journalReconciliation.unbalanced), difference: journalReconciliation.difference, reconciled: Number(journalReconciliation.unbalanced) === 0 && Number(journalReconciliation.difference) === 0 },
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
    if (all || permissions.has("kurban.supplier.read.organization")) {
      tasks.push(this.db.$queryRaw<Array<{ id: string; displayName: string }>>`SELECT "id", "displayName" FROM "Supplier" WHERE "displayName" ILIKE ${q} LIMIT ${input.limit}`
        .then((rows) => rows.map((row) => ({ provider: "supplier", id: row.id, label: row.displayName, route: `/tedarikciler/${row.id}`, permission: "kurban.supplier.read.organization" }))));
    }
    if (all || permissions.has("kurban.share.read.operational_period")) {
      tasks.push(this.db.$queryRaw<Array<{ id: string; sequenceNo: number; earTag: string }>>`
        SELECT share."id", share."sequenceNo", animal."earTag" FROM "Share" share JOIN "ShareCard" card ON card."id" = share."shareCardId" JOIN "Animal" animal ON animal."id" = card."animalId"
        WHERE share."id" ILIKE ${q} OR animal."earTag" ILIKE ${q} LIMIT ${input.limit}`
        .then((rows) => rows.map((row) => ({ provider: "share", id: row.id, label: `${row.earTag} / Hisse ${row.sequenceNo}`, route: `/hisseler/${row.id}`, permission: "kurban.share.read.operational_period" }))));
    }
    if (all || permissions.has("invoice.invoice.read.organization")) {
      tasks.push(this.db.$queryRaw<Array<{ id: string; invoiceNo: string; partyName: string }>>`SELECT invoice."id", invoice."invoiceNo", supplier."displayName" AS "partyName" FROM "PurchaseInvoice" invoice JOIN "Supplier" supplier ON supplier."id" = invoice."supplierId" WHERE invoice."invoiceNo" ILIKE ${q} OR supplier."displayName" ILIKE ${q} LIMIT ${input.limit}`
        .then((rows) => rows.map((row) => ({ provider: "invoice", id: row.id, label: row.invoiceNo, subLabel: row.partyName, route: `/faturalar/${row.id}`, permission: "invoice.invoice.read.organization" }))));
    }
    if (all || permissions.has("kurban.season.read.organization")) {
      tasks.push(this.db.$queryRaw<Array<{ id: string; name: string; status: string }>>`SELECT "id", "name", "status" FROM "Season" WHERE "name" ILIKE ${q} OR "year"::text ILIKE ${q} LIMIT ${input.limit}`
        .then((rows) => rows.map((row) => ({ provider: "season", id: row.id, label: row.name, subLabel: row.status, route: "/ayarlar/sezonlar", permission: "kurban.season.read.organization" }))));
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
    const exceptionRows = await this.db.$queryRaw<Array<{ id: string; category: string; severity: string; status: string; reportedAt: Date }>>`
      SELECT "id", "category", "severity", "status", "reportedAt" FROM "OperationException"
      WHERE "status" IN ('open','assigned','reopened') ${seasonId ? Prisma.sql`AND "seasonId" = ${seasonId}` : Prisma.empty}
      ORDER BY CASE "severity" WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, "reportedAt" ASC LIMIT ${limit}
    `;
    const packageRows = await this.db.$queryRaw<Array<{ id: string; packageRecordId: string; status: string; occurredAt: Date }>>`
      SELECT "id", "packageRecordId", "status", "occurredAt" FROM "PackageExceptionHistory"
      WHERE true ${seasonId ? Prisma.sql`AND "seasonId" = ${seasonId}` : Prisma.empty} ORDER BY "occurredAt" DESC LIMIT ${limit}
    `;
    return [
      ...approvalRows.map((row) => ({ id: row.id, source: "approval", priority: row.expiresAt < new Date() ? "critical" as const : "high" as const, title: row.operationType, status: row.status, dueAt: row.expiresAt.toISOString() })),
      ...exceptionRows.map((row) => ({ id: row.id, source: "operation", priority: (row.severity === "critical" ? "critical" : row.severity === "high" ? "high" : "normal") as "critical" | "high" | "normal", title: row.category, status: row.status, dueAt: row.reportedAt.toISOString() })),
      ...operationRows.map((row) => ({ id: row.id, source: "slaughter", priority: "high" as const, title: "Kesim istisnası", status: row.status, dueAt: row.updatedAt.toISOString() })),
      ...packageRows.map((row) => ({ id: row.id, source: "package", priority: "high" as const, title: `Paket ${row.status}: ${row.packageRecordId}`, status: row.status, dueAt: row.occurredAt.toISOString() })),
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
    if (reportKey === "finance-reconciliation") {
      return this.db.$queryRaw<Array<Record<string, string | number | null>>>`
        SELECT je."id", je."sourceType", je."sourceId", je."status", je."occurredAt"::text AS "occurredAt",
          COALESCE(SUM(jl."amount") FILTER (WHERE jl."side" = 'debit'), 0)::text AS "debit",
          COALESCE(SUM(jl."amount") FILTER (WHERE jl."side" = 'credit'), 0)::text AS "credit",
          (COALESCE(SUM(jl."amount") FILTER (WHERE jl."side" = 'debit'), 0) - COALESCE(SUM(jl."amount") FILTER (WHERE jl."side" = 'credit'), 0))::text AS "difference"
        FROM "JournalEntry" je JOIN "JournalLine" jl ON jl."journalEntryId" = je."id"
        ${seasonId ? Prisma.sql`WHERE je."seasonId" = ${seasonId}` : Prisma.empty}
        GROUP BY je."id" ORDER BY je."occurredAt" DESC LIMIT 500
      `;
    }
    if (reportKey === "customer-season-balances") {
      return this.db.$queryRaw<Array<Record<string, string | number | null>>>`
        SELECT c."id" AS "customerId", c."displayName", a."debitTotal"::text AS "debit", a."creditTotal"::text AS "credit", a."balance"::text AS "balance"
        FROM "CustomerSeasonAccount" a JOIN "Customer" c ON c."id" = a."customerId"
        ${seasonId ? Prisma.sql`WHERE a."seasonId" = ${seasonId}` : Prisma.empty}
        ORDER BY ABS(a."balance") DESC, c."displayName" LIMIT 500
      `;
    }
    if (reportKey === "supplier-purchases") {
      return this.db.$queryRaw<Array<Record<string, string | number | null>>>`
        SELECT s."id" AS "supplierId", s."displayName", COUNT(i."id")::int AS "invoiceCount",
          COALESCE(SUM(i."subtotal"), 0)::text AS "subtotal", COALESCE(SUM(i."taxTotal"), 0)::text AS "tax",
          COALESCE(SUM(i."grandTotal"), 0)::text AS "grandTotal", COALESCE(a."balance", 0)::text AS "balance"
        FROM "Supplier" s LEFT JOIN "PurchaseInvoice" i ON i."supplierId" = s."id" AND i."accountingStatus" = 'POSTED'
          ${seasonId ? Prisma.sql`AND i."seasonId" = ${seasonId}` : Prisma.empty}
        LEFT JOIN "SupplierAccount" a ON a."supplierId" = s."id" ${seasonId ? Prisma.sql`AND a."seasonId" = ${seasonId}` : Prisma.empty}
        GROUP BY s."id", s."displayName", a."balance" ORDER BY SUM(i."grandTotal") DESC NULLS LAST LIMIT 500
      `;
    }
    if (reportKey === "animal-cost-health") {
      return this.db.$queryRaw<Array<Record<string, string | number | null>>>`
        SELECT a."id" AS "animalId", a."earTag", a."status", a."purchaseAmount"::text AS "purchaseAmount",
          a."liveWeightKg"::text AS "liveWeightKg", COUNT(DISTINCT h."id")::int AS "healthEventCount",
          p."code" AS "paddockCode", p."name" AS "paddockName"
        FROM "Animal" a LEFT JOIN "AnimalHealthEvent" h ON h."animalId" = a."id"
        LEFT JOIN "AnimalPaddockAssignment" apa ON apa."animalId" = a."id" AND apa."active" = true
        LEFT JOIN "Paddock" p ON p."id" = apa."paddockId"
        ${seasonId ? Prisma.sql`WHERE a."seasonId" = ${seasonId}` : Prisma.empty}
        GROUP BY a."id", p."code", p."name" ORDER BY a."earTag" LIMIT 500
      `;
    }
    if (reportKey === "cash-bank-pos") {
      return this.db.$queryRaw<Array<Record<string, string | number | null>>>`
        SELECT split."method", COUNT(DISTINCT receipt."id")::int AS "receiptCount",
          COALESCE(SUM(CASE WHEN receipt."reversalOfId" IS NULL THEN split."amount" ELSE -split."amount" END), 0)::text AS "netAmount",
          COALESCE(SUM(split."posFeeAmount"), 0)::text AS "posFee"
        FROM "ReceiptMethodSplit" split JOIN "Receipt" receipt ON receipt."id" = split."receiptId"
        WHERE receipt."status" IN ('posted','reversed') ${seasonId ? Prisma.sql`AND receipt."seasonId" = ${seasonId}` : Prisma.empty}
        GROUP BY split."method" ORDER BY split."method"
      `;
    }
    if (reportKey === "fulfillment-progress") {
      return this.db.$queryRaw<Array<Record<string, string | number | null>>>`
        SELECT animal."id" AS "animalId", animal."earTag", job."status" AS "operationStatus",
          COUNT(DISTINCT weighing."id")::int AS "weighingCount", COUNT(DISTINCT package."id")::int AS "packageCount",
          COUNT(DISTINCT delivery."id") FILTER (WHERE delivery."status" = 'delivered')::int AS "deliveredShareCount"
        FROM "Animal" animal
        LEFT JOIN "SlaughterJob" job ON job."animalId" = animal."id"
        LEFT JOIN "WeighingRecord" weighing ON weighing."animalId" = animal."id" AND weighing."revokedAt" IS NULL
        LEFT JOIN "ShareCard" card ON card."animalId" = animal."id" AND card."status" = 'active'
        LEFT JOIN "Share" share ON share."shareCardId" = card."id"
        LEFT JOIN "PackageRecord" package ON package."shareId" = share."id" AND package."status" <> 'void'
        LEFT JOIN "DeliveryRecord" delivery ON delivery."shareId" = share."id"
        ${seasonId ? Prisma.sql`WHERE animal."seasonId" = ${seasonId}` : Prisma.empty}
        GROUP BY animal."id", job."status" ORDER BY animal."earTag" LIMIT 500
      `;
    }
    if (reportKey === "reversals-refunds") {
      return this.db.$queryRaw<Array<Record<string, string | number | null>>>`
        SELECT source, status, COUNT(*)::int AS "count", COALESCE(SUM(amount), 0)::text AS "amount" FROM (
          SELECT 'receipt'::text AS source, receipt."status", receipt."totalAmount" AS amount FROM "Receipt" receipt WHERE receipt."reversalOfId" IS NOT NULL ${seasonId ? Prisma.sql`AND receipt."seasonId" = ${seasonId}` : Prisma.empty}
          UNION ALL
          SELECT 'weight_shortfall', adjustment."status", adjustment."adjustmentAmount" FROM "WeightShortfallAdjustment" adjustment WHERE true ${seasonId ? Prisma.sql`AND adjustment."seasonId" = ${seasonId}` : Prisma.empty}
          UNION ALL
          SELECT 'delivery', delivery."status", 0::numeric FROM "DeliveryRecord" delivery WHERE delivery."status" = 'reversed' ${seasonId ? Prisma.sql`AND delivery."seasonId" = ${seasonId}` : Prisma.empty}
        ) events GROUP BY source, status ORDER BY source, status
      `;
    }
    if (reportKey === "season-comparison") {
      return this.db.$queryRaw<Array<Record<string, string | number | null>>>`
        SELECT season."id" AS "seasonId", season."name", season."year", season."status",
          (SELECT COUNT(*)::int FROM "Animal" animal WHERE animal."seasonId" = season."id") AS "animals",
          (SELECT COUNT(*)::int FROM "Share" share JOIN "ShareCard" card ON card."id" = share."shareCardId" WHERE card."seasonId" = season."id" AND share."status" = 'sold') AS "soldShares",
          (SELECT COALESCE(SUM(sale."priceSnapshot"), 0)::text FROM "Sale" sale WHERE sale."seasonId" = season."id" AND sale."status" = 'confirmed') AS "netSales",
          (SELECT COUNT(*)::int FROM "DeliveryRecord" delivery WHERE delivery."seasonId" = season."id" AND delivery."status" = 'delivered') AS "deliveries"
        FROM "Season" season ORDER BY season."year" DESC NULLS LAST, season."name"
      `;
    }
    if (reportKey === "exception-center") {
      return this.db.$queryRaw<Array<Record<string, string | number | null>>>`
        SELECT exception."id", exception."category", exception."severity", exception."status", exception."description",
          exception."assignedUserId", exception."reportedAt"::text AS "reportedAt", exception."resolvedAt"::text AS "resolvedAt"
        FROM "OperationException" exception WHERE true ${seasonId ? Prisma.sql`AND exception."seasonId" = ${seasonId}` : Prisma.empty}
        ORDER BY CASE exception."severity" WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, exception."reportedAt" DESC LIMIT 500
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
