import { NextResponse } from "next/server";
import { z } from "zod";
import { apiHataYaniti, beklenmeyenHataYaniti, zodHataYaniti } from "@/shared/lib/api-hata";
import { aktifOturum } from "@/shared/lib/session";
import { DemoDataError, DemoDataService } from "@/packages/tenant-core/src";

const Body = z.object({
  scenario: z.enum(["minimal", "full-qurban-day", "finance-reconciliation"]).default("minimal"),
  dryRun: z.literal(true),
});

export async function POST(request: Request) {
  const session = await aktifOturum();
  if (!session) return apiHataYaniti("AUTH_REQUIRED");

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) return zodHataYaniti(error);
    return apiHataYaniti("VALIDATION_INVALID");
  }

  try {
    const bundle = new DemoDataService().createSyntheticBundle({
      scenario: body.scenario,
      environmentName: process.env.TILBE_ENVIRONMENT_NAME ?? process.env.NODE_ENV,
      allowProduction: false,
    });
    return NextResponse.json({ ok: true, result: bundle });
  } catch (error) {
    if (error instanceof DemoDataError) return apiHataYaniti("DEMO_DATA_PRODUCTION_FORBIDDEN");
    return beklenmeyenHataYaniti(error, "TENANT_MANAGEMENT_ANALYTICS_FAILED", "Sentetik demo paketi üretilemedi");
  }
}
