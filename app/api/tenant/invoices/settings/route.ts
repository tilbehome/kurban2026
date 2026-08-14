import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { aktifOturum } from "@/shared/lib/session";
import { masterDataMode, tenantEDocumentConnectionService, tenantUseCaseContext } from "@/shared/lib/tenant-master-data-adapter";

const schema = z.object({ providerKey: z.literal("mock-sandbox"), unitMappingVersion: z.string().regex(/^[a-zA-Z0-9._:-]{1,80}$/), connectionName: z.string().trim().min(2).max(80), environment: z.literal("TEST"), apiEndpoint: z.string().url().optional(), credentialReference: z.string().trim().max(250).optional(), companyTaxIdentity: z.string().regex(/^\d{10,11}$/), senderUnit: z.string().trim().max(120).optional(), mailbox: z.string().trim().max(120).optional(), invoiceSeries: z.array(z.string().trim().min(1).max(30)).max(20), defaults: z.record(z.string(), z.unknown()), emailOptions: z.record(z.string(), z.unknown()), webhookVerificationRef: z.string().trim().max(250).optional() });

export async function GET(request: Request) {
  const context = await authorized(request, "invoice.einvoice.audit_read.organization");
  if (context instanceof NextResponse) return context;
  return NextResponse.json({ ok: true, items: await tenantEDocumentConnectionService().list(context.organizationId) });
}

export async function POST(request: Request) {
  const context = await authorized(request, "invoice.einvoice.settings_manage.organization");
  if (context instanceof NextResponse) return context;
  try {
    const body = schema.parse(await request.json());
    const result = await tenantEDocumentConnectionService().configure({ id: `edoc_connection_${randomUUID()}`, organizationId: context.organizationId, actorUserId: context.actorUserId, ...body });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const code = error instanceof z.ZodError ? "VALIDATION_FAILED" : error instanceof Error && /^[A-Z0-9_]+$/.test(error.message) ? error.message : "E_DOCUMENT_SETTINGS_FAILED";
    return NextResponse.json({ ok: false, code }, { status: 409 });
  }
}

async function authorized(request: Request, permission: string): Promise<{ organizationId: string; actorUserId: string } | NextResponse> {
  const session = await aktifOturum();
  if (!session) return NextResponse.json({ ok: false, code: "AUTH_REQUIRED" }, { status: 401 });
  if (masterDataMode() !== "postgres") return NextResponse.json({ ok: false, code: "TENANT_E_DOCUMENT_POSTGRES_NOT_ENABLED" }, { status: 409 });
  const base = tenantUseCaseContext(session, { request, readOnly: request.method === "GET" });
  if (!base.organizationId) return NextResponse.json({ ok: false, code: "TENANT_ORGANIZATION_ID_REQUIRED" }, { status: 409 });
  if (!base.permissions.includes(permission)) return NextResponse.json({ ok: false, code: "E_DOCUMENT_PERMISSION_DENIED" }, { status: 403 });
  if (request.method !== "GET") {
    const reauthenticatedAt = base.lastReauthenticatedAt ? new Date(base.lastReauthenticatedAt).getTime() : Number.NaN;
    if (!Number.isFinite(reauthenticatedAt) || Date.now() - reauthenticatedAt > 15 * 60 * 1000) {
      return NextResponse.json({ ok: false, code: "REAUTHENTICATION_REQUIRED" }, { status: 403 });
    }
  }
  return { organizationId: base.organizationId, actorUserId: base.actorUserId };
}
