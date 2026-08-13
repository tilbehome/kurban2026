import { describe, expect, it } from "vitest";
import { opaqueTenantBucket, safeTelemetryAttributes } from "../src";

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
});
