import { metrics, SpanStatusCode, trace, type Span, type Tracer } from "@opentelemetry/api";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { opaqueTenantBucket, runObservedOperation, safeTelemetryAttributes } from "../src";

interface ExportedSpan {
  name: string;
  attributes: Readonly<Record<string, unknown>>;
  status: { code: number; message?: string };
  events: readonly { name: string; attributes?: Readonly<Record<string, unknown>> }[];
}

const exportedSpans: ExportedSpan[] = [];
const sdk = new NodeSDK({
  spanProcessors: [{
    onStart() {},
    onEnd(span) {
      exportedSpans.push({
        name: span.name,
        attributes: { ...span.attributes },
        status: { ...span.status },
        events: span.events.map((event) => ({ name: event.name, attributes: { ...event.attributes } })),
      });
    },
    forceFlush: async () => {},
    shutdown: async () => {},
  }],
});

beforeAll(() => sdk.start());
afterAll(() => sdk.shutdown());

describe("observability redaction ve cardinality", () => {
  it("PII, token, secret ve connection string alanlarını dışarı çıkarmaz", () => {
    expect(safeTelemetryAttributes({
      requestId: "req_001",
      tenant: "opaque-ref",
      email: "person@example.test",
      authorization: "Bearer abc",
      db: "postgresql://user:secret@db/tenant",
      operation: "sale.create",
    })).toEqual({ requestId: "req_001", tenant: "opaque-ref", operation: "sale.create" });
  });

  it("tenant etiketini 64 opaque bucket ile sınırlar", () => {
    const values = new Set(Array.from({ length: 1000 }, (_, index) => opaqueTenantBucket(`tenant_${index}`)));
    expect(values.size).toBeLessThanOrEqual(64);
    expect([...values].every((value) => /^tenant-bucket-\d+$/.test(value))).toBe(true);
  });

  it("ham Error mesajını ve stack bilgisini export edilen span eventine taşımaz", async () => {
    const sensitiveValues = [
      "postgresql://db-user:p%40ssword@db.internal:5432/tenant",
      "password=super-secret-password",
      "Bearer secret-access-token",
      "person@example.test",
      "+905551112233",
      "C:\\private\\tenant-a\\backup.sql",
    ];
    const original = new Error(sensitiveValues.join(" | "));
    original.stack = `Error: ${sensitiveValues.join(" | ")}\n    at ${sensitiveValues[5]}:10:5`;

    await expect(runObservedOperation(context("sensitive-error"), async () => {
      throw original;
    })).rejects.toBe(original);

    const span = exportedSpans.find((candidate) => candidate.name === "sensitive-error");
    expect(span).toBeDefined();
    expect(span?.status).toEqual({ code: SpanStatusCode.ERROR });
    expect(span?.events).toEqual([{
      name: "exception",
      attributes: {
        "exception.type": "OBSERVED_OPERATION_FAILED",
        "exception.message": "OBSERVED_OPERATION_FAILED",
      },
    }]);
    const serialized = JSON.stringify(span);
    for (const sensitive of sensitiveValues) expect(serialized).not.toContain(sensitive);
    expect(serialized).not.toContain("exception.stacktrace");
  });

  it("Error olmayan throw değerini telemetry'ye taşımadan aynen yeniden fırlatır", async () => {
    const original = { raw: "Bearer non-error-secret" };
    await expect(runObservedOperation(context("non-error-throw"), async () => {
      throw original;
    })).rejects.toBe(original);

    const span = exportedSpans.find((candidate) => candidate.name === "non-error-throw");
    expect(JSON.stringify(span)).not.toContain(original.raw);
    expect(span?.events[0]?.attributes).toEqual({
      "exception.type": "OBSERVED_OPERATION_FAILED",
      "exception.message": "OBSERVED_OPERATION_FAILED",
    });
  });

  it("başarılı operation sonucunu değiştirmez", async () => {
    await expect(runObservedOperation(context("successful-operation"), async () => ({ ok: true }))).resolves.toEqual({ ok: true });
    const span = exportedSpans.find((candidate) => candidate.name === "successful-operation");
    expect(span?.status.code).toBe(SpanStatusCode.UNSET);
    expect(span?.events).toEqual([]);
  });

  it("telemetry yazma hataları asıl operation hatasını maskelemez", async () => {
    const telemetryFailure = new Error("TELEMETRY_WRITE_FAILED");
    const original = new Error("ORIGINAL_OPERATION_FAILED");
    const span = {
      recordException: () => { throw telemetryFailure; },
      setStatus: () => { throw telemetryFailure; },
      end: () => { throw telemetryFailure; },
    } as unknown as Span;
    const tracer = {
      startActiveSpan: (_name: string, _options: unknown, callback: (activeSpan: Span) => unknown) => callback(span),
    } as unknown as Tracer;
    vi.spyOn(trace, "getTracer").mockReturnValueOnce(tracer);
    vi.spyOn(metrics, "getMeter").mockReturnValueOnce({
      createHistogram: () => ({ record: () => { throw telemetryFailure; } }),
      createCounter: () => ({ add: () => { throw telemetryFailure; } }),
    } as unknown as ReturnType<typeof metrics.getMeter>);

    await expect(runObservedOperation(context("telemetry-write-failure"), async () => {
      throw original;
    })).rejects.toBe(original);
  });
});

function context(operation: string) {
  return { requestId: `request_${operation}`, tenantRef: "tenant-sensitive", operation };
}
