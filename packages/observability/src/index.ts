import { metrics, trace, type Attributes } from "@opentelemetry/api";

const forbiddenKey = /password|secret|token|authorization|cookie|connection.?string|database.?url|email|phone|address|customer|person/i;
const forbiddenValue = /postgres(?:ql)?:\/\/|bearer\s+|-----BEGIN|(?:password|secret|token)=/i;

export interface ObservedContext {
  requestId: string;
  traceId?: string;
  tenantRef?: string;
  operation: string;
  attributes?: Readonly<Record<string, string | number | boolean>>;
}

export function safeTelemetryAttributes(
  attributes: Readonly<Record<string, string | number | boolean | null | undefined>>,
): Attributes {
  const safe: Attributes = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (value === null || value === undefined || forbiddenKey.test(key) || forbiddenValue.test(String(value))) continue;
    safe[key] = value;
  }
  return safe;
}

export function opaqueTenantBucket(tenantRef: string): string {
  let hash = 2166136261;
  for (let index = 0; index < tenantRef.length; index += 1) {
    hash ^= tenantRef.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `tenant-bucket-${(hash >>> 0) % 64}`;
}

export async function runObservedOperation<T>(context: ObservedContext, operation: () => Promise<T>): Promise<T> {
  const tracer = trace.getTracer("@tilbecore/observability");
  const meter = metrics.getMeter("@tilbecore/observability");
  const duration = meter.createHistogram("tilbecore.operation.duration", { unit: "ms" });
  const outcomes = meter.createCounter("tilbecore.operation.outcome");
  const attributes = safeTelemetryAttributes({
    "tilbecore.operation": context.operation,
    "tilbecore.request_id": context.requestId,
    "tilbecore.tenant_bucket": context.tenantRef ? opaqueTenantBucket(context.tenantRef) : undefined,
    ...context.attributes,
  });
  const started = performance.now();
  return tracer.startActiveSpan(context.operation, { attributes }, async (span) => {
    try {
      const result = await operation();
      outcomes.add(1, { ...attributes, "tilbecore.outcome": "success" });
      return result;
    } catch (error) {
      span.recordException(error instanceof Error ? error : new Error("OBSERVED_OPERATION_FAILED"));
      outcomes.add(1, { ...attributes, "tilbecore.outcome": "error" });
      throw error;
    } finally {
      duration.record(performance.now() - started, attributes);
      span.end();
    }
  });
}
