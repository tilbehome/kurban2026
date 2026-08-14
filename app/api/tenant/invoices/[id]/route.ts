import { NextResponse } from "next/server";
import { aktifOturum } from "@/shared/lib/session";
import { masterDataMode, tenantInvoiceService, tenantUseCaseContext } from "@/shared/lib/tenant-master-data-adapter";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await aktifOturum();
  if (!session) return NextResponse.json({ ok: false, code: "AUTH_REQUIRED" }, { status: 401 });
  if (masterDataMode() !== "postgres") return NextResponse.json({ ok: false, code: "TENANT_INVOICE_POSTGRES_NOT_ENABLED" }, { status: 409 });
  try {
    const base = tenantUseCaseContext(session, { request, readOnly: true });
    if (!base.organizationId) throw new Error("TENANT_ORGANIZATION_ID_REQUIRED");
    const context = { organizationId: base.organizationId, actorUserId: base.actorUserId, requestId: base.requestId, idempotencyKey: base.idempotencyKey, permissions: base.permissions, reauthenticatedAt: base.lastReauthenticatedAt };
    return NextResponse.json({ ok: true, item: await tenantInvoiceService().get(context, (await params).id) });
  } catch (error) {
    const code = error instanceof Error && /^[A-Z0-9_]+$/.test(error.message) ? error.message : "INVOICE_OPERATION_FAILED";
    return NextResponse.json({ ok: false, code }, { status: code === "INVOICE_NOT_FOUND" ? 404 : 409 });
  }
}
