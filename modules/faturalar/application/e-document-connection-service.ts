import type { ProviderRegistry, ProviderCapabilities } from "../domain/e-invoice-provider";

export interface ElectronicDocumentConnectionInput {
  id: string;
  organizationId: string;
  providerKey: string;
  unitMappingVersion: string;
  connectionName: string;
  environment: "TEST" | "PRODUCTION";
  apiEndpoint?: string;
  credentialReference?: string;
  companyTaxIdentity: string;
  senderUnit?: string;
  mailbox?: string;
  invoiceSeries: readonly string[];
  defaults: Readonly<Record<string, unknown>>;
  emailOptions: Readonly<Record<string, unknown>>;
  webhookVerificationRef?: string;
  actorUserId: string;
}

export interface ElectronicDocumentConnectionPort {
  upsert(input: ElectronicDocumentConnectionInput & { capabilities: ProviderCapabilities; connectionOutcome: string }): Promise<{ id: string }>;
  list(organizationId: string): Promise<readonly { id: string; providerKey: string; unitMappingVersion: string; connectionName: string; environment: string; active: boolean; capabilities: unknown; lastConnectionOutcome?: string }[]>;
}

export class ElectronicDocumentConnectionService {
  constructor(private readonly connections: ElectronicDocumentConnectionPort, private readonly providers: ProviderRegistry) {}

  list(organizationId: string) { return this.connections.list(organizationId); }

  async configure(input: ElectronicDocumentConnectionInput) {
    if (!/^\d{10,11}$/.test(input.companyTaxIdentity)) throw new Error("E_DOCUMENT_TAX_IDENTITY_INVALID");
    if (input.apiEndpoint && (!URL.canParse(input.apiEndpoint) || new URL(input.apiEndpoint).protocol !== "https:")) throw new Error("E_DOCUMENT_ENDPOINT_HTTPS_REQUIRED");
    if (input.credentialReference && !/^secret:\/\/[a-zA-Z0-9/_:.-]+$/.test(input.credentialReference)) throw new Error("E_DOCUMENT_CREDENTIAL_REFERENCE_INVALID");
    if (input.webhookVerificationRef && !/^secret:\/\/[a-zA-Z0-9/_:.-]+$/.test(input.webhookVerificationRef)) throw new Error("E_DOCUMENT_WEBHOOK_REFERENCE_INVALID");
    if (!/^[a-zA-Z0-9._:-]{1,80}$/.test(input.unitMappingVersion)) throw new Error("E_DOCUMENT_UNIT_MAPPING_VERSION_INVALID");
    assertSecretFreeConfiguration(input.defaults);
    assertSecretFreeConfiguration(input.emailOptions);
    const provider = this.providers.require(input.providerKey);
    const [capabilities, connection] = await Promise.all([provider.getCapabilities(), provider.testConnection()]);
    return this.connections.upsert({ ...input, capabilities, connectionOutcome: connection.outcome });
  }
}

function assertSecretFreeConfiguration(value: unknown): void {
  if (Array.isArray(value)) {
    for (const item of value) assertSecretFreeConfiguration(item);
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (/(?:password|secret|token|credential|authorization|connection.?string)/i.test(key)) throw new Error("E_DOCUMENT_INLINE_SECRET_FORBIDDEN");
      assertSecretFreeConfiguration(item);
    }
    return;
  }
  if (typeof value === "string" && (/(?:postgres(?:ql)?:\/\/|bearer\s+[a-z0-9._-]+)/i.test(value) || /(?:password|secret|token)=/i.test(value))) throw new Error("E_DOCUMENT_INLINE_SECRET_FORBIDDEN");
}
