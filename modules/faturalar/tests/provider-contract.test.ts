import { describe, expect, test } from "vitest";
import { ProviderRegistry } from "../domain/e-invoice-provider";
import { ElectronicDocumentWorker, type ElectronicDeliveryJobPort } from "../application/e-document-worker";
import { ElectronicDocumentWebhookService, type WebhookInboxPort } from "../application/webhook-service";
import { MockEInvoiceProvider } from "../infrastructure/external/mock-e-invoice-provider";
import { NodePayloadHash } from "../infrastructure/external/node-payload-hash";
import { ElectronicDocumentConnectionService } from "../application/e-document-connection-service";

describe("provider bağımsız e-Belge sözleşmesi", () => {
  test("mock/sandbox adapter aynı idempotency key ile aynı belgeyi döndürür", async () => {
    const provider = new MockEInvoiceProvider();
    const input = { uuid: "00000000-0000-4000-8000-000000000001", channel: "EFATURA" as const, xmlStorageKey: "protected/invoices/test.xml", idempotencyKey: "send-0001" };
    const first = await provider.sendInvoice(input);
    expect(await provider.sendInvoice(input)).toEqual(first);
    expect((await provider.getCapabilities()).channels).toEqual(["EFATURA", "EARSIV"]);
  });

  test("provider ham hatası dışarı taşınmaz; güvenli kod ve exponential backoff kaydedilir", async () => {
    const registry = new ProviderRegistry();
    const sensitiveFixture = ["postgresql://user:", "password@host/db", " Bearer secret person@example.test"].join("");
    registry.register({ ...new MockEInvoiceProvider(), key: "failing", sendInvoice: async () => { throw new Error(sensitiveFixture); } } as unknown as MockEInvoiceProvider);
    const failures: Array<{ safeErrorCode: string; nextAttemptAt?: Date; deadLetter: boolean }> = [];
    const jobs: ElectronicDeliveryJobPort = { claim: async () => ({ id: "delivery-1", invoiceId: "invoice-1", uuid: "uuid-1", channel: "EFATURA", providerKey: "failing", xmlStorageKey: "protected/test.xml", idempotencyKey: "idem-1", attempts: 0 }), markSent: async () => undefined, markFailed: async (value) => { failures.push(value); } };
    expect(await new ElectronicDocumentWorker(jobs, registry).runOnce(new Date("2026-08-14T10:00:00Z"))).toBe("RETRY");
    expect(failures[0]?.safeErrorCode).toBe("E_DOCUMENT_PROVIDER_OPERATION_FAILED");
    expect(JSON.stringify(failures)).not.toContain("password");
  });

  test("webhook imzası, zaman penceresi ve tekrar eden provider event id korunur", async () => {
    const registry = new ProviderRegistry(); registry.register(new MockEInvoiceProvider());
    const seen = new Set<string>();
    const inbox: WebhookInboxPort = { storeIfNew: async (input) => seen.has(input.providerEventId) ? "DUPLICATE" : (seen.add(input.providerEventId), "STORED") };
    const service = new ElectronicDocumentWebhookService(registry, inbox, new NodePayloadHash());
    const now = new Date("2026-08-14T10:00:00Z");
    const rawBody = new TextEncoder().encode(JSON.stringify({ eventId: "event-1", occurredAt: now.toISOString(), status: "DELIVERED" }));
    const base = { organizationId: "org-1", providerKey: "mock-sandbox", rawBody, headers: { "x-mock-signature": "valid" }, receivedAt: now };
    expect((await service.receive(base)).outcome).toBe("STORED");
    expect((await service.receive(base)).outcome).toBe("DUPLICATE");
    await expect(service.receive({ ...base, headers: { "x-mock-signature": "invalid" } })).rejects.toThrowError("WEBHOOK_SIGNATURE_INVALID");
  });

  test("bağlantı ayarı yalnız secret referansı ve güvenli yapılandırma kabul eder", async () => {
    const registry = new ProviderRegistry(); registry.register(new MockEInvoiceProvider());
    const service = new ElectronicDocumentConnectionService({ upsert: async () => ({ id: "connection-1" }), list: async () => [] }, registry);
    const base = { id: "connection-1", organizationId: "org-1", providerKey: "mock-sandbox", unitMappingVersion: "mock-guide-v1", connectionName: "Sentetik", environment: "TEST" as const, companyTaxIdentity: "1111111110", invoiceSeries: [], defaults: {}, emailOptions: {}, actorUserId: "actor-1" };
    await expect(service.configure({ ...base, credentialReference: "plain-value" })).rejects.toThrowError("E_DOCUMENT_CREDENTIAL_REFERENCE_INVALID");
    await expect(service.configure({ ...base, defaults: { password: "inline-value" } })).rejects.toThrowError("E_DOCUMENT_INLINE_SECRET_FORBIDDEN");
    await expect(service.configure({ ...base, credentialReference: "secret://tenant/mock" })).resolves.toEqual({ id: "connection-1" });
  });
});
