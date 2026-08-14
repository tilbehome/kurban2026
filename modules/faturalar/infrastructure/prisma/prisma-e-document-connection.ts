import type { Prisma, PrismaClient } from "@/packages/database-tenant/generated/client";
import type { ElectronicDocumentConnectionInput, ElectronicDocumentConnectionPort } from "../../application/e-document-connection-service";
import type { ProviderCapabilities } from "../../domain/e-invoice-provider";

export class PrismaElectronicDocumentConnectionRepository implements ElectronicDocumentConnectionPort {
  constructor(private readonly db: PrismaClient) {}
  async upsert(input: ElectronicDocumentConnectionInput & { capabilities: ProviderCapabilities; connectionOutcome: string }) {
    const data = { providerKey: input.providerKey, unitMappingVersion: input.unitMappingVersion, connectionName: input.connectionName, environment: input.environment, apiEndpoint: input.apiEndpoint, credentialReference: input.credentialReference, companyTaxIdentity: input.companyTaxIdentity, senderUnit: input.senderUnit, mailbox: input.mailbox, invoiceSeries: json(input.invoiceSeries), defaults: json(input.defaults), emailOptions: json(input.emailOptions), webhookVerificationRef: input.webhookVerificationRef, capabilities: json(input.capabilities), active: input.environment === "TEST" && input.connectionOutcome === "CONNECTED", lastConnectionOutcome: input.connectionOutcome, lastConnectionTestedAt: new Date(), createdByUserId: input.actorUserId };
    const row = await this.db.electronicDocumentConnection.upsert({ where: { organizationId_providerKey_connectionName: { organizationId: input.organizationId, providerKey: input.providerKey, connectionName: input.connectionName } }, create: { id: input.id, organizationId: input.organizationId, ...data }, update: data, select: { id: true } });
    return row;
  }
  async list(organizationId: string) {
    const rows = await this.db.electronicDocumentConnection.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" } });
    return rows.map((row) => ({ id: row.id, providerKey: row.providerKey, unitMappingVersion: row.unitMappingVersion, connectionName: row.connectionName, environment: row.environment, active: row.active, capabilities: row.capabilities, lastConnectionOutcome: row.lastConnectionOutcome ?? undefined }));
  }
}

function json(value: unknown): Prisma.InputJsonValue { return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue; }
