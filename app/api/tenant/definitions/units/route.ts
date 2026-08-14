import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { aktifOturum } from "@/shared/lib/session";
import { masterDataMode, tenantUnitOfMeasureService, tenantUseCaseContext } from "@/shared/lib/tenant-master-data-adapter";

const unitFields = z.object({ code: z.string().trim().min(1).max(24), name: z.string().trim().min(1).max(80), symbol: z.string().trim().min(1).max(20), category: z.enum(["COUNT", "WEIGHT", "LENGTH", "AREA", "VOLUME", "TIME", "PACKAGE", "SERVICE", "CUSTOM"]), decimalPrecision: z.number().int().min(0).max(6), allowsFraction: z.boolean(), sortOrder: z.number().int().min(0).max(10000).optional() });
const commandSchema = z.discriminatedUnion("action", [
  unitFields.extend({ action: z.literal("create"), id: z.string().min(3).optional() }),
  unitFields.extend({ action: z.literal("update"), id: z.string().min(3) }),
  z.object({ action: z.literal("set-active"), id: z.string().min(3), active: z.boolean() }),
]);

export async function GET(request: Request) {
  const session = await aktifOturum();
  if (!session) return reply("AUTH_REQUIRED", 401);
  if (masterDataMode() !== "postgres") return reply("TENANT_UNIT_POSTGRES_NOT_ENABLED", 409);
  try {
    const base = tenantUseCaseContext(session, { request, readOnly: true });
    if (!base.organizationId) throw new Error("TENANT_ORGANIZATION_ID_REQUIRED");
    const items = await tenantUnitOfMeasureService().list({ tenantId: base.organizationId, actorUserId: base.actorUserId, permissions: base.permissions }, new URL(request.url).searchParams.get("includeInactive") === "true");
    return NextResponse.json({ ok: true, items });
  } catch (error) { return safeError(error); }
}

export async function POST(request: Request) {
  const session = await aktifOturum();
  if (!session) return reply("AUTH_REQUIRED", 401);
  if (masterDataMode() !== "postgres") return reply("TENANT_UNIT_POSTGRES_NOT_ENABLED", 409);
  try {
    const body = commandSchema.parse(await request.json());
    const base = tenantUseCaseContext(session, { request, payload: body });
    if (!base.organizationId) throw new Error("TENANT_ORGANIZATION_ID_REQUIRED");
    const context = { tenantId: base.organizationId, actorUserId: base.actorUserId, permissions: base.permissions };
    if (body.action === "create") return NextResponse.json({ ok: true, result: await tenantUnitOfMeasureService().create(context, { ...body, id: body.id ?? `unit_${randomUUID()}` }) });
    if (body.action === "update") return NextResponse.json({ ok: true, result: await tenantUnitOfMeasureService().update(context, body.id, body) });
    return NextResponse.json({ ok: true, result: await tenantUnitOfMeasureService().setActive(context, body.id, body.active) });
  } catch (error) { return safeError(error); }
}

function safeError(error: unknown) { const code = error instanceof z.ZodError ? "VALIDATION_FAILED" : error instanceof Error && /^[A-Z0-9_]+$/.test(error.message) ? error.message : "UNIT_OPERATION_FAILED"; return reply(code, code.includes("PERMISSION") ? 403 : code.includes("NOT_FOUND") ? 404 : 409); }
function reply(code: string, status: number) { return NextResponse.json({ ok: false, code }, { status }); }
