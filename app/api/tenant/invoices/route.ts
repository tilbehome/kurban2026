import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { aktifOturum } from "@/shared/lib/session";
import { masterDataMode, tenantInvoiceService, tenantUseCaseContext } from "@/shared/lib/tenant-master-data-adapter";
import type { InvoiceActorContext, InvoiceListFilter } from "@/modules/faturalar/application/invoice-service";

const money = z.string().regex(/^\d+(?:\.\d{1,4})?$/);
const lineSchema = z.object({
  id: z.string().min(3).optional(),
  description: z.string().trim().min(1).max(500),
  quantity: z.string().regex(/^\d+(?:\.\d{1,3})?$/),
  unit: z.string().trim().min(1).max(20),
  unitPrice: money,
  discountTotal: money.optional(),
  taxes: z.array(z.object({ id: z.string().min(3).optional(), type: z.string().trim().min(1).max(40), rate: money, exemptionCode: z.string().trim().max(40).optional() })).max(20).optional(),
  animalId: z.string().min(3).optional(),
  shareId: z.string().min(3).optional(),
  saleId: z.string().min(3).optional(),
  purchaseReference: z.string().trim().max(120).optional(),
  expenseDocumentId: z.string().min(3).optional(),
});

const commandSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create-draft"), id: z.string().min(3).optional(), seasonId: z.string().min(3), locationId: z.string().min(3).optional(), uuid: z.string().uuid(), invoiceNo: z.string().trim().min(1).max(80), series: z.string().trim().max(30).optional(), invoiceDate: z.string().datetime(), dueDate: z.string().datetime().optional(),
    direction: z.enum(["INBOUND", "OUTBOUND"]), tradeType: z.enum(["PURCHASE", "SALES"]), documentNature: z.enum(["STANDARD", "RETURN"]), electronicChannel: z.enum(["NONE", "EFATURA", "EARSIV"]), currency: z.string().length(3).default("TRY"),
    supplierId: z.string().min(3).optional(), customerId: z.string().min(3).optional(), partyTaxIdentity: z.string().trim().max(20).optional(), partySnapshot: z.record(z.string(), z.unknown()), originalInvoiceId: z.string().min(3).optional(), lines: z.array(lineSchema).min(1).max(500),
  }),
  z.object({ action: z.literal("submit"), id: z.string().min(3) }),
  z.object({ action: z.literal("approve"), id: z.string().min(3) }),
  z.object({ action: z.literal("post"), id: z.string().min(3) }),
  z.object({ action: z.literal("allocate-payment"), id: z.string().min(3), allocationId: z.string().min(3).optional(), receiptId: z.string().min(3).optional(), supplierPaymentId: z.string().min(3).optional(), amount: money }),
  z.object({ action: z.literal("enqueue-e-document"), id: z.string().min(3), deliveryId: z.string().min(3).optional(), providerKey: z.string().trim().min(2).max(80), correlationId: z.string().min(8).max(128).optional() }),
]);

export async function GET(request: Request) {
  const session = await aktifOturum();
  if (!session) return response("AUTH_REQUIRED", 401);
  if (masterDataMode() !== "postgres") return response("TENANT_INVOICE_POSTGRES_NOT_ENABLED", 409);
  try {
    const url = new URL(request.url);
    const filter: InvoiceListFilter = {
      seasonId: value(url, "seasonId"), locationId: value(url, "locationId"),
      direction: enumValue(url, "direction", ["INBOUND", "OUTBOUND"]), tradeType: enumValue(url, "tradeType", ["PURCHASE", "SALES"]), documentNature: enumValue(url, "documentNature", ["STANDARD", "RETURN"]), electronicChannel: enumValue(url, "electronicChannel", ["NONE", "EFATURA", "EARSIV"]),
      accountingStatus: enumValue(url, "accountingStatus", ["DRAFT", "APPROVAL_PENDING", "APPROVED", "POSTED", "REVERSED", "CANCELLED"]), paymentStatus: value(url, "paymentStatus"), electronicStatus: value(url, "electronicStatus"), partyId: value(url, "partyId"), query: value(url, "query"), overdueOnly: url.searchParams.get("overdueOnly") === "true", minTotal: value(url, "minTotal"), maxTotal: value(url, "maxTotal"), from: value(url, "from"), to: value(url, "to"), limit: numberValue(url, "limit", 50), offset: numberValue(url, "offset", 0),
    };
    const context = actorContext(session, request, undefined, true);
    return NextResponse.json({ ok: true, ...(await tenantInvoiceService().list(context, filter)) });
  } catch (error) {
    return safeError(error);
  }
}

export async function POST(request: Request) {
  const session = await aktifOturum();
  if (!session) return response("AUTH_REQUIRED", 401);
  if (masterDataMode() !== "postgres") return response("TENANT_INVOICE_POSTGRES_NOT_ENABLED", 409);
  try {
    const body = commandSchema.parse(await request.json());
    const context = actorContext(session, request, body, false);
    const service = tenantInvoiceService();
    switch (body.action) {
      case "create-draft": {
        const invoiceId = body.id ?? `invoice_${randomUUID()}`;
        return NextResponse.json({ ok: true, result: await service.createDraft(context, { ...body, id: invoiceId, lines: body.lines.map((line) => ({ ...line, id: line.id ?? `invoice_line_${randomUUID()}`, taxes: line.taxes?.map((tax) => ({ ...tax, id: tax.id ?? `invoice_tax_${randomUUID()}` })) })) }) });
      }
      case "submit": return NextResponse.json({ ok: true, result: await service.submit(context, body.id) });
      case "approve": return NextResponse.json({ ok: true, result: await service.approve(context, body.id) });
      case "post": return NextResponse.json({ ok: true, result: await service.post(context, body.id) });
      case "allocate-payment": return NextResponse.json({ ok: true, result: await service.allocatePayment(context, { ...body, allocationId: body.allocationId ?? `invoice_allocation_${randomUUID()}` }) });
      case "enqueue-e-document": return NextResponse.json({ ok: true, result: await service.enqueueElectronicDocument(context, { ...body, deliveryId: body.deliveryId ?? `edoc_delivery_${randomUUID()}`, correlationId: body.correlationId ?? context.requestId }) });
    }
  } catch (error) {
    return safeError(error);
  }
}

function actorContext(session: Awaited<ReturnType<typeof aktifOturum>> & {}, request: Request, payload: unknown, readOnly: boolean): InvoiceActorContext {
  const context = tenantUseCaseContext(session, { request, payload, readOnly });
  if (!context.organizationId) throw new Error("TENANT_ORGANIZATION_ID_REQUIRED");
  return { organizationId: context.organizationId, actorUserId: context.actorUserId, requestId: context.requestId, idempotencyKey: context.idempotencyKey, permissions: context.permissions, reauthenticatedAt: context.lastReauthenticatedAt };
}

function safeError(error: unknown) {
  const code = error instanceof z.ZodError ? "VALIDATION_FAILED" : error instanceof Error && /^[A-Z0-9_]+$/.test(error.message) ? error.message : "INVOICE_OPERATION_FAILED";
  const status = code === "VALIDATION_FAILED" ? 400 : code.includes("NOT_FOUND") ? 404 : code.includes("PERMISSION") || code.includes("AUTHENTICATION") ? 403 : 409;
  return response(code, status);
}

function response(code: string, status: number) { return NextResponse.json({ ok: false, code }, { status }); }
function value(url: URL, key: string) { return url.searchParams.get(key)?.trim() || undefined; }
function numberValue(url: URL, key: string, fallback: number) { const parsed = Number(url.searchParams.get(key)); return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : fallback; }
function enumValue<const T extends string>(url: URL, key: string, values: readonly T[]): T | undefined { const current = value(url, key); return current && values.includes(current as T) ? current as T : undefined; }
