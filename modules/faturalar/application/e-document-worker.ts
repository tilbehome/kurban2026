import type { ProviderRegistry } from "../domain/e-invoice-provider";
import type { ElectronicChannel } from "../domain/invoice";

export interface ElectronicDeliveryJob {
  id: string;
  invoiceId: string;
  uuid: string;
  channel: Exclude<ElectronicChannel, "NONE">;
  providerKey: string;
  xmlStorageKey: string;
  idempotencyKey: string;
  attempts: number;
}

export interface ElectronicDeliveryJobPort {
  claim(now: Date): Promise<ElectronicDeliveryJob | null>;
  markSent(input: { id: string; providerReference: string; normalizedCode: string; status: string; completedAt: Date }): Promise<void>;
  markFailed(input: { id: string; safeErrorCode: string; nextAttemptAt?: Date; deadLetter: boolean }): Promise<void>;
}

export class ElectronicDocumentWorker {
  constructor(private readonly jobs: ElectronicDeliveryJobPort, private readonly providers: ProviderRegistry, private readonly maxAttempts = 5) {}

  async runOnce(now = new Date()): Promise<"IDLE" | "SENT" | "RETRY" | "DEAD_LETTER"> {
    const job = await this.jobs.claim(now);
    if (!job) return "IDLE";
    try {
      const result = await this.providers.require(job.providerKey).sendInvoice({ uuid: job.uuid, channel: job.channel, xmlStorageKey: job.xmlStorageKey, idempotencyKey: job.idempotencyKey });
      await this.jobs.markSent({ id: job.id, providerReference: result.providerReference, normalizedCode: result.normalizedCode, status: result.status, completedAt: now });
      return "SENT";
    } catch {
      const nextAttempt = job.attempts + 1;
      const deadLetter = nextAttempt >= this.maxAttempts;
      await this.jobs.markFailed({ id: job.id, safeErrorCode: "E_DOCUMENT_PROVIDER_OPERATION_FAILED", nextAttemptAt: deadLetter ? undefined : new Date(now.getTime() + backoffMilliseconds(nextAttempt)), deadLetter });
      return deadLetter ? "DEAD_LETTER" : "RETRY";
    }
  }
}

export function backoffMilliseconds(attempt: number): number {
  return Math.min(60 * 60 * 1000, 1000 * 2 ** Math.max(0, attempt - 1));
}
