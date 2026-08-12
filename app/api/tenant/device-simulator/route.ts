import { NextResponse } from "next/server";
import { z } from "zod";
import { apiHataYaniti, beklenmeyenHataYaniti, zodHataYaniti } from "@/shared/lib/api-hata";
import { aktifOturum } from "@/shared/lib/session";
import { tenantUseCaseContext } from "@/shared/lib/tenant-master-data-adapter";
import { createSimulatorDeviceAdapter, SimulatorLabelPrinterAdapter, SimulatorQrReaderAdapter, SimulatorScaleAdapter } from "@/packages/operations/src";

const Body = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("scale"), expectedKg: z.string().regex(/^\d+(\.\d{1,3})?$/).optional(), toleranceKg: z.string().regex(/^\d+(\.\d{1,3})?$/).optional() }),
  z.object({ kind: z.literal("label_printer"), labelNo: z.string().min(3).max(80), lines: z.array(z.string().max(120)).min(1).max(12), copies: z.number().int().positive().max(10).optional() }),
  z.object({ kind: z.literal("qr_reader"), opaqueToken: z.string().min(12).max(500), purpose: z.enum(["proxyDocument", "slaughterCheck", "package", "delivery", "customerTracking"]) }),
]);

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

  const context = tenantUseCaseContext(session, { request, payload: body, readOnly: false });
  if (!isAllowed(context.permissions, permissionFor(body.kind))) return apiHataYaniti("PERMISSION_DENIED");

  try {
    const adapter = createSimulatorDeviceAdapter(body.kind);
    if (adapter instanceof SimulatorScaleAdapter && body.kind === "scale") return NextResponse.json({ ok: true, result: await adapter.execute(body) });
    if (adapter instanceof SimulatorLabelPrinterAdapter && body.kind === "label_printer") return NextResponse.json({ ok: true, result: await adapter.execute(body) });
    if (adapter instanceof SimulatorQrReaderAdapter && body.kind === "qr_reader") return NextResponse.json({ ok: true, result: await adapter.execute(body) });
    return apiHataYaniti("VALIDATION_INVALID");
  } catch (error) {
    return beklenmeyenHataYaniti(error, "TENANT_OPERATIONS_FAILED", "Cihaz simülatörü çalıştırılamadı");
  }
}

function permissionFor(kind: z.infer<typeof Body>["kind"]): string {
  if (kind === "scale") return "operations.weighing.record.assigned_record";
  if (kind === "label_printer") return "operations.packaging.manage.assigned_record";
  return "qurban.qr.consume.operational_period";
}

function isAllowed(permissions: readonly string[], permission: string): boolean {
  return permissions.includes("*") || permissions.includes(permission);
}
