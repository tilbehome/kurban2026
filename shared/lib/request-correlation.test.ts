import { describe, expect, it } from "vitest";
import { createRequestCorrelation } from "./request-correlation";

describe("request correlation", () => {
  it("geçerli requestId ve traceparent değerini korur", () => {
    const headers = new Headers({ "x-request-id": "request_123", traceparent: "00-0123456789abcdef0123456789abcdef-0123456789abcdef-01" });
    expect(createRequestCorrelation(headers, () => "unused-uuid")).toEqual({
      requestId: "request_123",
      traceparent: "00-0123456789abcdef0123456789abcdef-0123456789abcdef-01",
    });
  });

  it("kontrolsüz header değerini güvenli opaque kimlikle değiştirir", () => {
    const headers = new Headers({ "x-request-id": "bad request value", traceparent: "secret" });
    const values = ["12345678-1234-1234-1234-123456789abc", "abcdefab-cdef-abcd-efab-cdefabcdefab", "fedcbafe-dcba-fedc-bafe-dcbafedcbafe"];
    const result = createRequestCorrelation(headers, () => values.shift()!);
    expect(result.requestId).toBe("12345678-1234-1234-1234-123456789abc");
    expect(result.traceparent).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
    expect(JSON.stringify(result)).not.toContain("secret");
  });
});
