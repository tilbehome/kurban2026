import { NextResponse } from "next/server";
import { z } from "zod";
import { aktifOturum } from "@/shared/lib/session";
import { apiHataYaniti, beklenmeyenHataYaniti, zodHataYaniti } from "@/shared/lib/api-hata";
import { masterDataMode, tenantSalesFinanceService, tenantUseCaseContext } from "@/shared/lib/tenant-master-data-adapter";
import { TenantSalesFinanceError } from "@/packages/tenant-core/src";
import type { HataKodu } from "@/shared/lib/hata-katalogu";

const Body = z.object({
  seasonId: z.string().min(3),
  now: z.string().datetime().optional(),
  limit: z.number().int().positive().max(500).optional(),
  workerRunId: z.string().trim().min(8).max(128).optional(),
});

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
    const command = {
      seasonId: body.seasonId,
      now: body.now ?? new Date().toISOString(),
      limit: body.limit,
    };
    const context = tenantUseCaseContext(session, {
      request,
      payload: { worker: "reservation-expiry", ...command },
      idempotencyKey: body.workerRunId ? `reservation-expiry:${body.workerRunId}` : undefined,
    });
    const result = await tenantSalesFinanceService().expireReservations(context, command);
    return NextResponse.json({
      ok: true,
      worker: "reservation-expiry",
      seasonId: body.seasonId,
      expiredCount: Array.isArray(result) ? result.length : result,
      result,
    });
  } catch (error) {
    if (error instanceof TenantSalesFinanceError) return apiHataYaniti(error.code as HataKodu);
    return beklenmeyenHataYaniti(error, "TENANT_RESERVATION_EXPIRY_FAILED", "Rezervasyon süre-sonu worker işlemi tamamlanamadı");
  }
}
