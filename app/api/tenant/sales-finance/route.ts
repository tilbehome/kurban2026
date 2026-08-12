import { NextResponse } from "next/server";
import { z } from "zod";
import { apiHataYaniti, beklenmeyenHataYaniti, zodHataYaniti } from "@/shared/lib/api-hata";
import { aktifOturum } from "@/shared/lib/session";
import { masterDataMode, tenantSalesFinanceService, tenantUseCaseContext } from "@/shared/lib/tenant-master-data-adapter";
import { TenantSalesFinanceError } from "@/packages/tenant-core/src";
import type { HataKodu } from "@/shared/lib/hata-katalogu";

const methodSplitSchema = z.object({
  id: z.string().min(3),
  method: z.enum(["cash", "bank_transfer", "pos"]),
  amount: z.string().regex(/^\d+(\.\d{1,4})?$/),
  referenceNo: z.string().trim().max(80).optional(),
  posInstallmentCount: z.number().int().positive().optional(),
  posFeeAmount: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
});

const allocationSchema = z.object({
  id: z.string().min(3),
  saleId: z.string().min(3).optional(),
  customerId: z.string().min(3),
  shareId: z.string().min(3).optional(),
  amount: z.string().regex(/^\d+(\.\d{1,4})?$/),
});

const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("list-shares"), seasonId: z.string().min(3) }),
  z.object({
    action: z.literal("publish-price-tariff"),
    id: z.string().min(3),
    seasonId: z.string().min(3),
    name: z.string().trim().min(2).max(120),
    versionId: z.string().min(3),
    version: z.number().int().positive(),
    validFrom: z.string().datetime().optional(),
    validUntil: z.string().datetime().optional(),
    changeReason: z.string().trim().min(3).max(500),
    items: z.array(z.object({
      id: z.string().min(3),
      shareGroup: z.string().trim().min(1).max(80),
      sequenceNo: z.number().int().min(1).max(7).optional(),
      listPrice: z.string().regex(/^\d+(\.\d{1,4})?$/),
      minDepositAmount: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
    })).min(1),
  }),
  z.object({
    action: z.literal("reserve-share"),
    id: z.string().min(3),
    seasonId: z.string().min(3),
    shareId: z.string().min(3),
    customerId: z.string().min(3),
    reservedUntil: z.string().datetime(),
    reason: z.string().trim().max(500).optional(),
  }),
  z.object({ action: z.literal("expire-reservations"), seasonId: z.string().min(3), now: z.string().datetime(), limit: z.number().int().positive().max(500).optional() }),
  z.object({
    action: z.literal("confirm-sale"),
    id: z.string().min(3),
    seasonId: z.string().min(3),
    customerId: z.string().min(3),
    payerCustomerId: z.string().min(3).optional(),
    shareIds: z.array(z.string().min(3)).min(1).max(7),
    listPricePerShare: z.string().regex(/^\d+(\.\d{1,4})?$/),
    discountPerShare: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
    downPayment: z.object({
      receiptId: z.string().min(3),
      receiptNo: z.string().trim().min(1).max(80),
      methodSplits: z.array(methodSplitSchema).min(1),
    }),
  }),
  z.object({
    action: z.literal("record-receipt"),
    id: z.string().min(3),
    seasonId: z.string().min(3),
    customerId: z.string().min(3),
    payerCustomerId: z.string().min(3).optional(),
    saleId: z.string().min(3).optional(),
    receiptNo: z.string().trim().min(1).max(80),
    methodSplits: z.array(methodSplitSchema).min(1),
    allocations: z.array(allocationSchema).min(1),
    occurredAt: z.string().datetime(),
  }),
  z.object({ action: z.literal("cancel-sale"), saleId: z.string().min(3), seasonId: z.string().min(3), reason: z.string().trim().min(3).max(500) }),
  z.object({ action: z.literal("transfer-share"), id: z.string().min(3), seasonId: z.string().min(3), sourceShareId: z.string().min(3), targetShareId: z.string().min(3), toCustomerId: z.string().min(3), reason: z.string().trim().min(3).max(500) }),
]);

export async function POST(request: Request) {
  const session = await aktifOturum();
  if (!session) return apiHataYaniti("AUTH_REQUIRED");
  if (masterDataMode() !== "postgres") return apiHataYaniti("TENANT_MASTER_DATA_POSTGRES_NOT_ENABLED");

  let body: z.infer<typeof requestSchema>;
  try {
    body = requestSchema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) return zodHataYaniti(error);
    return apiHataYaniti("VALIDATION_INVALID");
  }

  try {
    const service = tenantSalesFinanceService();
    const context = tenantUseCaseContext(session, { request, payload: body, readOnly: body.action === "list-shares" });
    switch (body.action) {
      case "list-shares":
        return NextResponse.json({ ok: true, items: await service.listShareAvailability(context, body.seasonId) });
      case "publish-price-tariff":
        return NextResponse.json({ ok: true, result: await service.publishPriceTariff(context, body) });
      case "reserve-share":
        return NextResponse.json({ ok: true, result: await service.reserveShare(context, body) });
      case "expire-reservations":
        return NextResponse.json({ ok: true, result: await service.expireReservations(context, body) });
      case "confirm-sale":
        return NextResponse.json({ ok: true, result: await service.confirmSale(context, body) });
      case "record-receipt":
        return NextResponse.json({ ok: true, result: await service.recordReceipt(context, body) });
      case "cancel-sale":
        return NextResponse.json({ ok: true, result: await service.cancelSale(context, body) });
      case "transfer-share":
        return NextResponse.json({ ok: true, result: await service.transferShare(context, body) });
    }
  } catch (error) {
    if (error instanceof TenantSalesFinanceError) return apiHataYaniti(error.code as HataKodu);
    return beklenmeyenHataYaniti(error, "TENANT_SALES_FINANCE_FAILED", "Satış ve finans işlemi tamamlanamadı");
  }
}
