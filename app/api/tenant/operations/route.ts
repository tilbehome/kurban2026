import { NextResponse } from "next/server";
import { z } from "zod";
import { apiHataYaniti, beklenmeyenHataYaniti, zodHataYaniti } from "@/shared/lib/api-hata";
import { aktifOturum } from "@/shared/lib/session";
import { masterDataMode, tenantOperationsService, tenantUseCaseContext } from "@/shared/lib/tenant-master-data-adapter";
import { TenantOperationsError } from "@/packages/tenant-core/src";
import type { HataKodu } from "@/shared/lib/hata-katalogu";

const approvalSchema = z.object({
  requestId: z.string().min(8),
  approved: z.boolean(),
  approvalCount: z.number().int().min(1),
  distinctApproverCount: z.number().int().min(1),
});

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("proxy-document"), id: z.string().min(3), seasonId: z.string().min(3), grantorCustomerId: z.string().min(3), shareIds: z.array(z.string().min(3)).min(1).max(7), method: z.enum(["face_to_face_oral", "phone", "voice_recording"]), storageKey: z.string().min(8).max(500), status: z.enum(["draft", "signed"]).optional(), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("revoke-proxy-document"), id: z.string().min(3), seasonId: z.string().min(3), reason: z.string().min(8).max(500), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("issue-qr"), id: z.string().min(3), purpose: z.enum(["proxyDocument", "slaughterCheck", "package", "delivery", "customerTracking"]), targetId: z.string().min(3), expiresAt: z.string().datetime().optional(), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("consume-qr"), opaqueToken: z.string().min(20), purpose: z.enum(["proxyDocument", "slaughterCheck", "package", "delivery", "customerTracking"]), now: z.string().datetime().optional(), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("create-slaughter-job"), id: z.string().min(3), seasonId: z.string().min(3), animalId: z.string().min(3), shareCardId: z.string().min(3), queueNo: z.number().int().positive().optional(), assignedUserId: z.string().min(3).optional(), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("advance-slaughter"), id: z.string().min(3), seasonId: z.string().min(3), nextStatus: z.enum(["waiting", "ready", "slaughtering", "skinning", "cutting", "weighing", "packing", "ready_for_delivery", "delivered", "exception"]), reason: z.string().min(8).max(500), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("record-weighing"), id: z.string().min(3), seasonId: z.string().min(3), animalId: z.string().min(3), carcassWeightKg: z.string().regex(/^\d+(\.\d{1,3})?$/), reason: z.string().max(500).optional(), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("create-package"), id: z.string().min(3), seasonId: z.string().min(3), shareId: z.string().min(3), grossWeightKg: z.string().regex(/^\d+(\.\d{1,3})?$/), labelNo: z.string().min(3).max(80), reason: z.string().max(500).optional(), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("record-delivery"), id: z.string().min(3), seasonId: z.string().min(3), shareId: z.string().min(3), customerId: z.string().min(3), receiverName: z.string().max(160).optional(), reason: z.string().max(500).optional(), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("reverse-delivery"), id: z.string().min(3), seasonId: z.string().min(3), reason: z.string().min(8).max(500), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("enqueue-offline"), id: z.string().min(3), operation: z.string().min(3).max(120), payload: z.record(z.string(), z.unknown()), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("tv-projection"), seasonId: z.string().min(3) }),
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
    const service = tenantOperationsService();
    const context = tenantUseCaseContext(session, { request, payload: body, readOnly: body.action === "tv-projection", approval: "approval" in body ? body.approval : undefined });
    switch (body.action) {
      case "proxy-document": return NextResponse.json({ ok: true, result: await service.createProxyDocument(context, body) });
      case "revoke-proxy-document": return NextResponse.json({ ok: true, result: await service.revokeProxyDocument(context, body) });
      case "issue-qr": return NextResponse.json({ ok: true, result: await service.issueQrToken(context, body) });
      case "consume-qr": return NextResponse.json({ ok: true, result: await service.consumeQrToken(context, body) });
      case "create-slaughter-job": return NextResponse.json({ ok: true, result: await service.createSlaughterJob(context, body) });
      case "advance-slaughter": return NextResponse.json({ ok: true, result: await service.advanceSlaughter(context, body) });
      case "record-weighing": return NextResponse.json({ ok: true, result: await service.recordWeighing(context, body) });
      case "create-package": return NextResponse.json({ ok: true, result: await service.createPackage(context, body) });
      case "record-delivery": return NextResponse.json({ ok: true, result: await service.recordDelivery(context, body) });
      case "reverse-delivery": return NextResponse.json({ ok: true, result: await service.reverseDelivery(context, body) });
      case "enqueue-offline": return NextResponse.json({ ok: true, result: await service.enqueueOffline(context, body) });
      case "tv-projection": return NextResponse.json({ ok: true, items: await service.listTvProjection(context, body.seasonId) });
    }
  } catch (error) {
    if (error instanceof TenantOperationsError) return apiHataYaniti(error.code as HataKodu);
    return beklenmeyenHataYaniti(error, "TENANT_OPERATIONS_FAILED", "Operasyon komutu tamamlanamadı");
  }
}
