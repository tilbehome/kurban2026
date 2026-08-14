import type { EInvoiceProvider, ProviderCapabilities, ProviderInvoiceReference, ProviderWebhookResult } from "../../domain/e-invoice-provider";

const CAPABILITIES: ProviderCapabilities = {
  channels: ["EFATURA", "EARSIV"],
  receive: true,
  cancellation: true,
  objection: true,
  applicationResponse: true,
  pdfDownload: true,
  quotaQuery: false,
  webhook: true,
};

export class MockEInvoiceProvider implements EInvoiceProvider {
  readonly key = "mock-sandbox";
  private readonly records = new Map<string, ProviderInvoiceReference>();

  async testConnection() { return { outcome: "CONNECTED" as const, normalizedCode: "MOCK_SANDBOX_CONNECTED" }; }
  async getCapabilities() { return CAPABILITIES; }
  async queryRegisteredTaxpayer(input: { taxIdentity: string }) { return { registered: input.taxIdentity.endsWith("0"), aliases: input.taxIdentity.endsWith("0") ? ["urn:mail:mock-sandbox"] : [] }; }
  async sendInvoice(input: { uuid: string; idempotencyKey: string }) {
    const current = this.records.get(input.idempotencyKey);
    if (current) return current;
    const record = { providerReference: `mock-${input.uuid}`, uuid: input.uuid, status: "SENT" as const, normalizedCode: "MOCK_SENT" };
    this.records.set(input.idempotencyKey, record);
    return record;
  }
  async receiveInvoices() { return { items: [...this.records.values()] }; }
  async queryInvoiceStatus(input: { providerReference: string }) { return this.find(input.providerReference); }
  async respondToInvoice(input: { providerReference: string; response: "ACCEPT" | "REJECT" }) { return this.update(input.providerReference, input.response === "ACCEPT" ? "ACCEPTED" : "REJECTED", `MOCK_${input.response}`); }
  async requestCancellation(input: { providerReference: string }) { return this.update(input.providerReference, "CANCEL_REQUESTED", "MOCK_CANCEL_REQUESTED"); }
  async submitObjection(input: { providerReference: string }) { return this.update(input.providerReference, "OBJECTED", "MOCK_OBJECTED"); }
  async downloadXml(input: { providerReference: string }) { this.find(input.providerReference); return { storageKey: `protected/mock/${input.providerReference}.xml`, checksum: "mock-checksum-xml" }; }
  async downloadPdf(input: { providerReference: string }) { this.find(input.providerReference); return { storageKey: `protected/mock/${input.providerReference}.pdf`, checksum: "mock-checksum-pdf" }; }
  async handleWebhook(input: { rawBody: Uint8Array; headers: Readonly<Record<string, string>> }): Promise<ProviderWebhookResult> {
    if (input.headers["x-mock-signature"] !== "valid") throw new Error("WEBHOOK_SIGNATURE_INVALID");
    const payload = JSON.parse(new TextDecoder().decode(input.rawBody)) as { eventId?: string; providerReference?: string; status?: string; occurredAt?: string };
    if (!payload.eventId || !payload.occurredAt || !payload.status) throw new Error("MOCK_WEBHOOK_INVALID");
    if (!(["DELIVERED", "ACCEPTED", "REJECTED", "CANCELLED"] as const).includes(payload.status as "DELIVERED")) throw new Error("MOCK_WEBHOOK_STATUS_INVALID");
    return { providerEventId: payload.eventId, occurredAt: payload.occurredAt, providerReference: payload.providerReference, status: payload.status as ProviderWebhookResult["status"], normalizedCode: `MOCK_${payload.status}` };
  }

  private find(reference: string): ProviderInvoiceReference {
    const record = [...this.records.values()].find((item) => item.providerReference === reference);
    if (!record) throw new Error("MOCK_INVOICE_NOT_FOUND");
    return record;
  }

  private update(reference: string, status: ProviderInvoiceReference["status"], normalizedCode: string): ProviderInvoiceReference {
    const current = this.find(reference);
    const next = { ...current, status, normalizedCode };
    for (const [key, item] of this.records) if (item.providerReference === reference) this.records.set(key, next);
    return next;
  }
}
