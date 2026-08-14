import type { ProviderRegistry, ProviderWebhookResult } from "../domain/e-invoice-provider";

export interface WebhookInboxPort {
  storeIfNew(input: { organizationId: string; providerKey: string; providerEventId: string; occurredAt: Date; receivedAt: Date; payloadHash: string; signatureOutcome: "VERIFIED" }): Promise<"STORED" | "DUPLICATE">;
}

export interface PayloadHashPort { sha256(value: Uint8Array): string; }

export class ElectronicDocumentWebhookService {
  constructor(private readonly providers: ProviderRegistry, private readonly inbox: WebhookInboxPort, private readonly hash: PayloadHashPort, private readonly allowedClockSkewMs = 5 * 60 * 1000) {}

  async receive(input: { organizationId: string; providerKey: string; rawBody: Uint8Array; headers: Readonly<Record<string, string>>; receivedAt?: Date }): Promise<{ outcome: "STORED" | "DUPLICATE"; event: ProviderWebhookResult }> {
    const receivedAt = input.receivedAt ?? new Date();
    const event = await this.providers.require(input.providerKey).handleWebhook({ rawBody: input.rawBody, headers: input.headers });
    const occurredAt = new Date(event.occurredAt);
    if (!Number.isFinite(occurredAt.getTime()) || Math.abs(receivedAt.getTime() - occurredAt.getTime()) > this.allowedClockSkewMs) throw new Error("WEBHOOK_REPLAY_WINDOW_REJECTED");
    const outcome = await this.inbox.storeIfNew({ organizationId: input.organizationId, providerKey: input.providerKey, providerEventId: event.providerEventId, occurredAt, receivedAt, payloadHash: this.hash.sha256(input.rawBody), signatureOutcome: "VERIFIED" });
    return { outcome, event };
  }
}
