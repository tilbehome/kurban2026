import type { Prisma, PrismaClient } from "@/packages/database-tenant/generated/client";
import type { ElectronicDeliveryJob, ElectronicDeliveryJobPort } from "../../application/e-document-worker";
import type { WebhookInboxPort } from "../../application/webhook-service";

export class PrismaElectronicDeliveryJobRepository implements ElectronicDeliveryJobPort {
  constructor(private readonly db: PrismaClient) {}

  async claim(now: Date): Promise<ElectronicDeliveryJob | null> {
    return this.db.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "ElectronicDocumentDelivery"
        WHERE "status" = 'QUEUED' AND ("nextAttemptAt" IS NULL OR "nextAttemptAt" <= ${now})
        ORDER BY "createdAt" ASC
        FOR UPDATE SKIP LOCKED LIMIT 1`;
      if (!rows[0]) return null;
      const delivery = await tx.electronicDocumentDelivery.findUniqueOrThrow({ where: { id: rows[0].id }, include: { purchaseInvoice: { include: { attachments: true } } } });
      const xml = delivery.purchaseInvoice.attachments.find((item) => item.kind === "XML");
      if (!xml) {
        await tx.electronicDocumentDelivery.update({ where: { id: delivery.id }, data: { status: "FAILED", lastSafeErrorCode: "E_DOCUMENT_XML_REQUIRED", attempts: { increment: 1 } } });
        await tx.purchaseInvoice.update({ where: { id: delivery.purchaseInvoiceId }, data: { electronicStatus: "FAILED" } });
        return null;
      }
      await tx.electronicDocumentDelivery.update({ where: { id: delivery.id }, data: { status: "SENDING", attempts: { increment: 1 }, nextAttemptAt: null } });
      await tx.purchaseInvoice.update({ where: { id: delivery.purchaseInvoiceId }, data: { electronicStatus: "SENDING" } });
      return { id: delivery.id, invoiceId: delivery.purchaseInvoiceId, uuid: delivery.purchaseInvoice.uuid, channel: delivery.purchaseInvoice.electronicChannel as ElectronicDeliveryJob["channel"], providerKey: delivery.providerKey, xmlStorageKey: xml.storageKey, idempotencyKey: delivery.idempotencyKey, attempts: delivery.attempts };
    }, { isolationLevel: "ReadCommitted" });
  }

  async markSent(input: { id: string; providerReference: string; normalizedCode: string; status: string; completedAt: Date }): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const delivery = await tx.electronicDocumentDelivery.update({ where: { id: input.id }, data: { status: input.status, providerReference: input.providerReference, normalizedCode: input.normalizedCode, completedAt: input.completedAt, responseMetadata: { outcome: "SUCCESS" } } });
      await tx.purchaseInvoice.update({ where: { id: delivery.purchaseInvoiceId }, data: { electronicStatus: input.status, providerReference: input.providerReference } });
    });
  }

  async markFailed(input: { id: string; safeErrorCode: string; nextAttemptAt?: Date; deadLetter: boolean }): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const delivery = await tx.electronicDocumentDelivery.update({ where: { id: input.id }, data: { status: input.deadLetter ? "FAILED" : "QUEUED", lastSafeErrorCode: input.safeErrorCode, nextAttemptAt: input.nextAttemptAt, responseMetadata: { outcome: input.deadLetter ? "DEAD_LETTER" : "RETRY" } } });
      await tx.purchaseInvoice.update({ where: { id: delivery.purchaseInvoiceId }, data: { electronicStatus: input.deadLetter ? "FAILED" : "QUEUED" } });
    });
  }
}

export class PrismaElectronicWebhookInboxRepository implements WebhookInboxPort {
  constructor(private readonly db: PrismaClient) {}

  async storeIfNew(input: { organizationId: string; providerKey: string; providerEventId: string; occurredAt: Date; receivedAt: Date; payloadHash: string; signatureOutcome: "VERIFIED" }): Promise<"STORED" | "DUPLICATE"> {
    try {
      await this.db.electronicDocumentWebhookInbox.create({ data: { id: `webhook_${input.providerKey}_${input.providerEventId}`, ...input } });
      return "STORED";
    } catch (error) {
      if (isUniqueViolation(error)) return "DUPLICATE";
      throw error;
    }
  }
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as Prisma.PrismaClientKnownRequestError).code === "P2002";
}
