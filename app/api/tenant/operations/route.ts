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
  z.object({ action: z.literal("proxy-document"), id: z.string().min(3), seasonId: z.string().min(3), grantorCustomerId: z.string().min(3), shareIds: z.array(z.string().min(3)).min(1).max(7), grantors: z.array(z.object({ customerId: z.string().min(3), shareIds: z.array(z.string().min(3)).min(1).max(7), relationshipToShareholder: z.string().max(120).optional() })).min(1).max(7).optional(), method: z.enum(["face_to_face", "phone", "oral", "written", "other", "voice_recording", "face_to_face_oral"]), policyVersion: z.string().min(1).max(80), receivedAt: z.string().datetime().optional(), receivedPlace: z.string().max(160).optional(), receivedByUserId: z.string().min(3).optional(), description: z.string().max(500).optional(), storageKey: z.string().min(8).max(500), mimeType: z.string().min(3).max(100).optional(), sizeBytes: z.number().int().positive().max(25_000_000).optional(), status: z.enum(["draft", "received", "signed"]).optional(), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("revoke-proxy-document"), id: z.string().min(3), seasonId: z.string().min(3), reason: z.string().min(8).max(500), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("change-proxy-status"), id: z.string().min(3), seasonId: z.string().min(3), nextStatus: z.enum(["draft", "received", "signed", "revoked", "invalid", "lost"]), reason: z.string().min(8).max(500), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("issue-qr"), id: z.string().min(3), seasonId: z.string().min(3).optional(), purpose: z.enum(["proxyDocument", "slaughterCheck", "package", "delivery", "customerTracking"]), targetId: z.string().min(3), expiresAt: z.string().datetime().optional(), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("consume-qr"), opaqueToken: z.string().min(20), purpose: z.enum(["proxyDocument", "slaughterCheck", "package", "delivery", "customerTracking"]), now: z.string().datetime().optional(), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("create-slaughter-job"), id: z.string().min(3), seasonId: z.string().min(3), animalId: z.string().min(3), shareCardId: z.string().min(3), queueNo: z.number().int().positive().optional(), assignedUserId: z.string().min(3).optional(), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("advance-slaughter"), id: z.string().min(3), seasonId: z.string().min(3), nextStatus: z.enum(["preparation", "waiting", "ready", "in_slaughter", "slaughtering", "slaughtered", "skinning", "cutting", "weighing", "packaging", "packing", "ready_for_delivery", "delivered", "done", "exception"]), reason: z.string().min(8).max(500), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("assign-slaughter"), id: z.string().min(3), seasonId: z.string().min(3), facilityId: z.string().min(3).optional(), teamId: z.string().min(3).optional(), stationId: z.string().min(3).optional(), assignedUserId: z.string().min(3).optional(), assignedDeviceId: z.string().min(3).optional(), queueNo: z.number().int().positive().optional(), reason: z.string().min(8).max(500), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("report-operation-exception"), id: z.string().min(3), seasonId: z.string().min(3), slaughterJobId: z.string().min(3), category: z.string().min(3).max(80), severity: z.enum(["low", "medium", "high", "critical"]), description: z.string().min(8).max(500), assignedUserId: z.string().min(3).optional(), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("set-operation-mode"), id: z.string().min(3), seasonId: z.string().min(3), mode: z.enum(["normal", "restricted", "read_only", "emergency_stop"]), reason: z.string().min(8).max(500), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("operation-command-center"), seasonId: z.string().min(3) }),
  z.object({ action: z.literal("record-weighing"), id: z.string().min(3), seasonId: z.string().min(3), animalId: z.string().min(3), carcassWeightKg: z.string().regex(/^\d+(\.\d{1,3})?$/), measurementType: z.enum(["purchase", "live", "control", "carcass", "share", "package"]).optional(), deviceAdapterId: z.string().min(3).optional(), stationId: z.string().min(3).optional(), reason: z.string().max(500).optional(), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("correct-weighing"), id: z.string().min(3), supersedesId: z.string().min(3), seasonId: z.string().min(3), animalId: z.string().min(3), carcassWeightKg: z.string().regex(/^\d+(\.\d{1,3})?$/), measurementType: z.enum(["purchase", "live", "control", "carcass", "share", "package"]).optional(), deviceAdapterId: z.string().min(3).optional(), stationId: z.string().min(3).optional(), reason: z.string().min(8).max(500), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("allocate-carcass-weight"), id: z.string().min(3), seasonId: z.string().min(3), animalId: z.string().min(3), sourceWeighingId: z.string().min(3), totalWeightKg: z.string().regex(/^\d+(\.\d{1,3})?$/), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("record-weight-shortfall"), id: z.string().min(3), seasonId: z.string().min(3), shareId: z.string().min(3), customerId: z.string().min(3), saleId: z.string().min(3), agreedPrice: z.string().regex(/^\d+(\.\d{1,4})?$/), targetWeightKg: z.string().regex(/^\d+(\.\d{1,3})?$/), actualWeightKg: z.string().regex(/^\d+(\.\d{1,3})?$/), reason: z.string().min(8).max(500), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("create-package"), id: z.string().min(3), seasonId: z.string().min(3), shareId: z.string().min(3), grossWeightKg: z.string().regex(/^\d+(\.\d{1,3})?$/), labelNo: z.string().min(3).max(80), reason: z.string().max(500).optional(), components: z.array(z.object({ id: z.string().min(3), componentType: z.enum(["bone_in", "boneless", "offal", "other"]), weightKg: z.string().regex(/^\d+(\.\d{1,3})?$/), estimatedValue: z.string().regex(/^\d+(\.\d{1,4})?$/).optional() })).max(20).optional(), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("report-package-exception"), id: z.string().min(3), seasonId: z.string().min(3), packageRecordId: z.string().min(3), status: z.enum(["missing", "wrong", "damaged"]), reason: z.string().min(8).max(500), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("transform-packages"), id: z.string().min(3), seasonId: z.string().min(3), sourcePackageIds: z.array(z.string().min(3)).min(1).max(20), targetPackageIds: z.array(z.string().min(3)).min(1).max(20), transformation: z.enum(["split", "merge"]), reason: z.string().min(8).max(500), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("move-package"), id: z.string().min(3), seasonId: z.string().min(3), packageRecordId: z.string().min(3), roomId: z.string().min(3), sectionId: z.string().min(3).optional(), rackId: z.string().min(3).optional(), reason: z.string().min(8).max(500), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("create-loading-list"), id: z.string().min(3), seasonId: z.string().min(3), vehicleId: z.string().min(3).optional(), routeName: z.string().max(160).optional(), packageRecordIds: z.array(z.string().min(3)).min(1).max(500), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("record-delivery"), id: z.string().min(3), seasonId: z.string().min(3), shareId: z.string().min(3), customerId: z.string().min(3), packageRecordIds: z.array(z.string().min(3)).min(1).max(100), deliveryType: z.enum(["on_site", "address"]).optional(), serviceFee: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(), receiverName: z.string().max(160).optional(), receiverRelationship: z.string().max(120).optional(), staffUserId: z.string().min(3).optional(), deviceId: z.string().min(3).optional(), latitude: z.string().regex(/^-?\d+(\.\d{1,7})?$/).optional(), longitude: z.string().regex(/^-?\d+(\.\d{1,7})?$/).optional(), allowPartial: z.boolean().optional(), partialExceptionReason: z.string().min(8).max(500).optional(), reason: z.string().max(500).optional(), loadingListId: z.string().min(3).optional(), proof: z.object({ id: z.string().min(3), proofType: z.enum(["signature", "photo", "voice", "note"]), storageKey: z.string().max(500).optional(), note: z.string().max(500).optional(), mimeType: z.string().max(100).optional(), sizeBytes: z.number().int().positive().max(25_000_000).optional(), checksumSha256: z.string().regex(/^[a-f0-9]{64}$/i).optional() }).optional(), debtOverride: z.object({ approvalRequestId: z.string().min(8), reason: z.string().min(8).max(500), storageKey: z.string().max(500).optional() }).optional(), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("reverse-delivery"), id: z.string().min(3), seasonId: z.string().min(3), reason: z.string().min(8).max(500), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("close-animal"), seasonId: z.string().min(3), animalId: z.string().min(3), reason: z.string().min(8).max(500), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("enqueue-offline"), id: z.string().min(8), seasonId: z.string().min(3), deviceId: z.string().min(3), sessionVersion: z.number().int().positive(), expectedVersion: z.number().int().nonnegative(), ttlSeconds: z.number().int().min(60).max(86_400), operation: z.enum(["scan.observation", "task.note", "device.diagnostic"]), payload: z.record(z.string(), z.unknown()), approval: approvalSchema.optional() }),
  z.object({ action: z.literal("list-offline-queue"), seasonId: z.string().min(3), deviceId: z.string().min(3) }),
  z.object({ action: z.literal("tv-projection"), seasonId: z.string().min(3) }),
]);

export async function GET(request: Request) {
  const session = await aktifOturum();
  if (!session) return apiHataYaniti("AUTH_REQUIRED");
  if (masterDataMode() !== "postgres") return apiHataYaniti("TENANT_MASTER_DATA_POSTGRES_NOT_ENABLED");
  const url = new URL(request.url);
  const id = url.searchParams.get("proxyDocumentId");
  const seasonId = url.searchParams.get("seasonId");
  if (!id || !seasonId) return apiHataYaniti("VALIDATION_INVALID");
  try {
    const context = tenantUseCaseContext(session, { request, readOnly: true });
    const result = await tenantOperationsService().getProxyDocument(context, { id, seasonId });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    if (error instanceof TenantOperationsError) return apiHataYaniti(error.code as HataKodu);
    return beklenmeyenHataYaniti(error, "TENANT_OPERATIONS_FAILED", "Vekâlet belgesi okunamadı");
  }
}

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
    const context = tenantUseCaseContext(session, { request, payload: body, readOnly: body.action === "tv-projection" || body.action === "operation-command-center" || body.action === "list-offline-queue", approval: "approval" in body ? body.approval : undefined });
    switch (body.action) {
      case "proxy-document": return NextResponse.json({ ok: true, result: await service.createProxyDocument(context, body) });
      case "revoke-proxy-document": return NextResponse.json({ ok: true, result: await service.revokeProxyDocument(context, body) });
      case "change-proxy-status": return NextResponse.json({ ok: true, result: await service.changeProxyDocumentStatus(context, body) });
      case "issue-qr": return NextResponse.json({ ok: true, result: await service.issueQrToken(context, body) });
      case "consume-qr": return NextResponse.json({ ok: true, result: await service.consumeQrToken(context, body) });
      case "create-slaughter-job": return NextResponse.json({ ok: true, result: await service.createSlaughterJob(context, body) });
      case "advance-slaughter": return NextResponse.json({ ok: true, result: await service.advanceSlaughter(context, body) });
      case "assign-slaughter": return NextResponse.json({ ok: true, result: await service.assignSlaughter(context, body) });
      case "report-operation-exception": return NextResponse.json({ ok: true, result: await service.reportOperationException(context, body) });
      case "set-operation-mode": return NextResponse.json({ ok: true, result: await service.setOperationMode(context, body) });
      case "operation-command-center": return NextResponse.json({ ok: true, items: await service.listOperationCommandCenter(context, body.seasonId) });
      case "record-weighing": return NextResponse.json({ ok: true, result: await service.recordWeighing(context, body) });
      case "correct-weighing": return NextResponse.json({ ok: true, result: await service.correctWeighing(context, body) });
      case "allocate-carcass-weight": return NextResponse.json({ ok: true, result: await service.allocateCarcassWeight(context, body) });
      case "record-weight-shortfall": return NextResponse.json({ ok: true, result: await service.recordWeightShortfall(context, body) });
      case "create-package": return NextResponse.json({ ok: true, result: await service.createPackage(context, body) });
      case "report-package-exception": return NextResponse.json({ ok: true, result: await service.reportPackageException(context, body) });
      case "transform-packages": return NextResponse.json({ ok: true, result: await service.recordPackageTransformation(context, body) });
      case "move-package": return NextResponse.json({ ok: true, result: await service.movePackage(context, body) });
      case "create-loading-list": return NextResponse.json({ ok: true, result: await service.createLoadingList(context, body) });
      case "record-delivery": return NextResponse.json({ ok: true, result: await service.recordDelivery(context, body) });
      case "reverse-delivery": return NextResponse.json({ ok: true, result: await service.reverseDelivery(context, body) });
      case "close-animal": return NextResponse.json({ ok: true, result: await service.closeAnimalIfDelivered(context, body) });
      case "enqueue-offline": return NextResponse.json({ ok: true, result: await service.enqueueOffline(context, body) });
      case "list-offline-queue": return NextResponse.json({ ok: true, items: await service.listOfflineQueue(context, body) });
      case "tv-projection": return NextResponse.json({ ok: true, items: await service.listTvProjection(context, body.seasonId) });
    }
  } catch (error) {
    if (error instanceof TenantOperationsError) return apiHataYaniti(error.code as HataKodu);
    return beklenmeyenHataYaniti(error, "TENANT_OPERATIONS_FAILED", "Operasyon komutu tamamlanamadı");
  }
}
