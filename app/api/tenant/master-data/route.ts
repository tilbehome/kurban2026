import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { aktifOturum } from "@/shared/lib/session";
import { masterDataMode, tenantActiveSeasonId, tenantConfiguredActiveSeasonId, tenantMasterDataService, tenantUseCaseContext } from "@/shared/lib/tenant-master-data-adapter";
import { TenantMasterDataError } from "@/packages/tenant-core/src";

const CommandSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("business-profile"), legalName: z.string().min(2), displayName: z.string().min(2), taxOffice: z.string().optional(), taxNumber: z.string().optional(), phone: z.string().optional(), email: z.string().email().optional() }),
  z.object({ action: z.literal("location-create"), code: z.string().min(2).max(20), name: z.string().min(2), addressLine: z.string().optional(), district: z.string().optional(), city: z.string().optional(), phone: z.string().optional() }),
  z.object({ action: z.literal("setting-upsert"), scope: z.string().min(2), key: z.string().min(2), value: z.unknown() }),
  z.object({ action: z.literal("season-create"), name: z.string().min(2), year: z.number().int().min(2020).max(2100).optional(), locationId: z.string().optional(), startsAt: z.string().optional(), endsAt: z.string().optional() }),
  z.object({ action: z.literal("season-transition"), seasonId: z.string().min(3), to: z.enum(["preparation", "sales", "slaughter", "delivery", "reconciliation", "archived"]) }),
  z.object({ action: z.literal("supplier-create"), seasonId: z.string().optional(), displayName: z.string().min(2), phone: z.string().optional(), taxNumber: z.string().optional() }),
  z.object({ action: z.literal("purchase-invoice"), id: z.string().optional(), seasonId: z.string().optional(), supplierId: z.string().min(3), invoiceNo: z.string().min(1), invoiceDate: z.string(), subtotal: z.string(), taxTotal: z.string().optional(), grandTotal: z.string(), lines: z.array(z.object({ description: z.string().min(1), quantity: z.string(), unitPrice: z.string(), lineTotal: z.string(), earTag: z.string().optional(), liveWeightKg: z.string().optional() })).min(1) }),
  z.object({ action: z.literal("supplier-payment"), seasonId: z.string().optional(), supplierId: z.string().min(3), amount: z.string(), method: z.string().min(2), referenceNo: z.string().optional(), occurredAt: z.string().optional() }),
  z.object({ action: z.literal("expense-record"), seasonId: z.string().optional(), documentNo: z.string().optional(), category: z.string().min(2), description: z.string().min(2), amount: z.string(), sourceType: z.string().min(2), sourceRef: z.string().min(2), occurredAt: z.string().optional() }),
  z.object({ action: z.literal("animal-weight"), seasonId: z.string().optional(), animalId: z.string().min(3), kind: z.enum(["purchase", "live", "carcass", "control"]), weightKg: z.string(), measuredAt: z.string().optional(), note: z.string().optional() }),
  z.object({ action: z.literal("animal-health"), seasonId: z.string().optional(), animalId: z.string().min(3), eventType: z.string().min(2), status: z.string().min(2), notes: z.string().optional(), occurredAt: z.string().optional() }),
  z.object({ action: z.literal("qurban-assign"), seasonId: z.string().optional(), animalId: z.string().min(3), qurbanNo: z.string().optional(), queueNo: z.number().int().positive().optional(), reason: z.string().optional() }),
]);

export async function GET(req: Request) {
  const session = await aktifOturum();
  if (!session) return NextResponse.json({ code: "AUTH_REQUIRED" }, { status: 401 });
  if (masterDataMode() !== "postgres") return NextResponse.json({ mode: "legacy", data: null });
  const service = tenantMasterDataService();
  const context = tenantUseCaseContext(session, { request: req, readOnly: true });
  const url = new URL(req.url);
  const seasonId = url.searchParams.get("seasonId") ?? tenantConfiguredActiveSeasonId();
  const [seasons, suppliers, animals, customers] = await Promise.all([
    service.listSeasons(context),
    service.listSuppliers(context, seasonId),
    seasonId ? service.listAnimals(context, seasonId) : Promise.resolve([]),
    service.searchCustomers(context, { seasonId, limit: 200 }),
  ]);
  return NextResponse.json({ mode: "postgres", seasonId, data: { seasons, suppliers, animals, customers } });
}

export async function POST(req: Request) {
  const session = await aktifOturum();
  if (!session) return NextResponse.json({ code: "AUTH_REQUIRED" }, { status: 401 });
  if (masterDataMode() !== "postgres") return NextResponse.json({ code: "TENANT_POSTGRES_DISABLED" }, { status: 409 });
  try {
    const body = CommandSchema.parse(await req.json());
    const context = tenantUseCaseContext(session, { request: req, payload: body });
    const service = tenantMasterDataService();
    const selectedSeason = "seasonId" in body && body.seasonId ? body.seasonId : undefined;
    let result: unknown;
    switch (body.action) {
      case "business-profile": result = await service.upsertBusinessProfile(context, { legalName: body.legalName, displayName: body.displayName, taxOffice: body.taxOffice, taxNumber: body.taxNumber, phone: body.phone, email: body.email }); break;
      case "location-create": result = await service.createLocation(context, { id: `location_${randomUUID()}`, code: body.code, name: body.name, addressLine: body.addressLine, district: body.district, city: body.city, phone: body.phone }); break;
      case "setting-upsert": result = await service.upsertSetting(context, { id: `setting_${randomUUID()}`, scope: body.scope, key: body.key, value: body.value }); break;
      case "season-create": result = await service.createSeason(context, { id: `season_${randomUUID()}`, ...body }); break;
      case "season-transition": result = await service.transitionSeason(context, body); break;
      case "supplier-create": result = await service.createSupplier(context, selectedSeason ?? tenantActiveSeasonId(), { id: `supplier_${randomUUID()}`, displayName: body.displayName, phone: body.phone, taxNumber: body.taxNumber }); break;
      case "purchase-invoice": {
        const invoiceId = body.id ?? `invoice_${randomUUID()}`;
        result = await service.postPurchaseInvoice(context, {
          ...body, id: invoiceId, seasonId: selectedSeason ?? tenantActiveSeasonId(),
          lines: body.lines.map((line, index) => ({
            id: `invoice_line_${invoiceId}_${index + 1}`,
            description: line.description, quantity: line.quantity, unitPrice: line.unitPrice, lineTotal: line.lineTotal,
            animal: line.earTag ? { id: `animal_${randomUUID()}`, earTag: line.earTag, liveWeightKg: line.liveWeightKg } : undefined,
          })),
        });
        break;
      }
      case "supplier-payment": result = await service.recordSupplierPayment(context, { id: `supplier_payment_${randomUUID()}`, supplierId: body.supplierId, seasonId: selectedSeason ?? tenantActiveSeasonId(), amount: body.amount, method: body.method, referenceNo: body.referenceNo, occurredAt: body.occurredAt ?? new Date().toISOString() }); break;
      case "expense-record": result = await service.recordExpense(context, { id: `expense_${randomUUID()}`, seasonId: selectedSeason ?? tenantActiveSeasonId(), documentNo: body.documentNo, category: body.category, description: body.description, amount: body.amount, sourceType: body.sourceType, sourceRef: body.sourceRef, occurredAt: body.occurredAt ?? new Date().toISOString() }); break;
      case "animal-weight": result = await service.recordAnimalWeight(context, { id: `animal_weight_${randomUUID()}`, animalId: body.animalId, seasonId: selectedSeason ?? tenantActiveSeasonId(), kind: body.kind, weightKg: body.weightKg, measuredAt: body.measuredAt ?? new Date().toISOString(), note: body.note }); break;
      case "animal-health": result = await service.recordAnimalHealthEvent(context, { id: `health_${randomUUID()}`, animalId: body.animalId, seasonId: selectedSeason ?? tenantActiveSeasonId(), eventType: body.eventType, status: body.status, notes: body.notes, occurredAt: body.occurredAt ?? new Date().toISOString() }); break;
      case "qurban-assign": result = await service.assignQurban(context, { id: `assignment_${randomUUID()}`, animalId: body.animalId, seasonId: selectedSeason ?? tenantActiveSeasonId(), qurbanNo: body.qurbanNo, queueNo: body.queueNo, reason: body.reason }); break;
    }
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const code = error instanceof TenantMasterDataError ? error.code : error instanceof z.ZodError ? "VALIDATION_FAILED" : "MASTER_DATA_COMMAND_FAILED";
    const status = code === "VALIDATION_FAILED" ? 400 : code.includes("NOT_FOUND") ? 404 : code.includes("DENIED") ? 403 : 409;
    return NextResponse.json({ success: false, code }, { status });
  }
}
