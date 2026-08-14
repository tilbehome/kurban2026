import type { ElectronicChannel, ElectronicStatus } from "./invoice";

export interface ProviderCapabilities {
  channels: readonly Exclude<ElectronicChannel, "NONE">[];
  receive: boolean;
  cancellation: boolean;
  objection: boolean;
  applicationResponse: boolean;
  pdfDownload: boolean;
  quotaQuery: boolean;
  webhook: boolean;
}

export interface ProviderInvoiceReference {
  providerReference: string;
  uuid: string;
  status: ElectronicStatus;
  normalizedCode: string;
}

export interface ProviderWebhookResult {
  providerEventId: string;
  occurredAt: string;
  providerReference?: string;
  status: ElectronicStatus;
  normalizedCode: string;
}

export interface EInvoiceProvider {
  readonly key: string;
  testConnection(): Promise<{ outcome: "CONNECTED" | "UNAVAILABLE"; normalizedCode: string }>;
  getCapabilities(): Promise<ProviderCapabilities>;
  queryRegisteredTaxpayer(input: { taxIdentity: string }): Promise<{ registered: boolean; aliases: readonly string[] }>;
  sendInvoice(input: { uuid: string; channel: Exclude<ElectronicChannel, "NONE">; xmlStorageKey: string; idempotencyKey: string }): Promise<ProviderInvoiceReference>;
  receiveInvoices(input: { cursor?: string; limit: number }): Promise<{ items: readonly ProviderInvoiceReference[]; cursor?: string }>;
  queryInvoiceStatus(input: { providerReference: string }): Promise<ProviderInvoiceReference>;
  respondToInvoice(input: { providerReference: string; response: "ACCEPT" | "REJECT"; idempotencyKey: string }): Promise<ProviderInvoiceReference>;
  requestCancellation(input: { providerReference: string; reasonCode: string; idempotencyKey: string }): Promise<ProviderInvoiceReference>;
  submitObjection(input: { providerReference: string; reasonCode: string; evidenceStorageKey?: string; idempotencyKey: string }): Promise<ProviderInvoiceReference>;
  downloadXml(input: { providerReference: string }): Promise<{ storageKey: string; checksum: string }>;
  downloadPdf(input: { providerReference: string }): Promise<{ storageKey: string; checksum: string }>;
  handleWebhook(input: { rawBody: Uint8Array; headers: Readonly<Record<string, string>> }): Promise<ProviderWebhookResult>;
}

export class ProviderRegistry {
  private readonly providers = new Map<string, EInvoiceProvider>();

  register(provider: EInvoiceProvider): void {
    if (this.providers.has(provider.key)) throw new Error("E_DOCUMENT_PROVIDER_ALREADY_REGISTERED");
    this.providers.set(provider.key, provider);
  }

  require(key: string): EInvoiceProvider {
    const provider = this.providers.get(key);
    if (!provider) throw new Error("E_DOCUMENT_PROVIDER_NOT_CONFIGURED");
    return provider;
  }
}
