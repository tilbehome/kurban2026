import { NextResponse } from "next/server";
import { z } from "zod";
import { apiHataYaniti, beklenmeyenHataYaniti, zodHataYaniti } from "@/shared/lib/api-hata";
import { aktifOturum } from "@/shared/lib/session";
import { masterDataMode, tenantManagementAnalyticsService, tenantUseCaseContext } from "@/shared/lib/tenant-master-data-adapter";
import { TenantManagementAnalyticsError } from "@/packages/tenant-core/src";
import type { HataKodu } from "@/shared/lib/hata-katalogu";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("dashboard"), seasonId: z.string().min(3).optional(), facilityId: z.string().min(1).optional(), operationalPeriodId: z.string().min(1).optional() }),
  z.object({ action: z.literal("report"), reportKey: z.enum(["sales-occupancy", "operations-bottleneck", "delivery-cold-storage", "audit-exceptions", "finance-reconciliation", "customer-season-balances", "supplier-purchases", "animal-cost-health"]), filters: z.record(z.string(), z.string().optional()).optional() }),
  z.object({ action: z.literal("report-builder"), reportKey: z.enum(["sales-occupancy", "operations-bottleneck", "delivery-cold-storage", "audit-exceptions", "finance-reconciliation", "customer-season-balances", "supplier-purchases", "animal-cost-health"]), filters: z.record(z.string(), z.string().optional()).optional(), dimensions: z.array(z.string().min(1)).max(6).optional(), measures: z.array(z.string().min(1)).max(6).optional() }),
  z.object({ action: z.literal("search"), query: z.string().min(2).max(120), limit: z.number().int().positive().max(25).optional() }),
  z.object({ action: z.literal("exception-inbox"), status: z.string().max(40).optional(), limit: z.number().int().positive().max(100).optional() }),
  z.object({ action: z.literal("save-dashboard-view"), name: z.string().min(2).max(120), scope: z.string().min(2).max(80), filters: z.record(z.string(), z.unknown()), layout: z.record(z.string(), z.unknown()) }),
]);

export async function POST(request: Request) {
  const session = await aktifOturum();
  if (!session) return apiHataYaniti("AUTH_REQUIRED");
  if (masterDataMode() !== "postgres") return apiHataYaniti("TENANT_MASTER_DATA_POSTGRES_NOT_ENABLED");

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) return zodHataYaniti(error);
    return apiHataYaniti("VALIDATION_INVALID");
  }

  try {
    const service = tenantManagementAnalyticsService();
    const context = tenantUseCaseContext(session, { request, payload: body, readOnly: body.action !== "save-dashboard-view" });
    switch (body.action) {
      case "dashboard":
        return NextResponse.json({ ok: true, result: await service.dashboard(context, body) });
      case "report":
        return NextResponse.json({ ok: true, result: await service.report(context, { reportKey: body.reportKey, filters: body.filters ?? {} }) });
      case "report-builder":
        return NextResponse.json({ ok: true, result: await service.reportBuilder(context, { reportKey: body.reportKey, filters: body.filters ?? {}, dimensions: body.dimensions, measures: body.measures }) });
      case "search":
        return NextResponse.json({ ok: true, items: await service.search(context, body) });
      case "exception-inbox":
        return NextResponse.json({ ok: true, items: await service.exceptionInbox(context, body) });
      case "save-dashboard-view":
        return NextResponse.json({ ok: true, result: await service.saveDashboardView(context, body) });
    }
  } catch (error) {
    if (error instanceof TenantManagementAnalyticsError) return apiHataYaniti(error.code as HataKodu);
    return beklenmeyenHataYaniti(error, "TENANT_MANAGEMENT_ANALYTICS_FAILED", "Yönetim ve analitik işlemi tamamlanamadı");
  }
}
