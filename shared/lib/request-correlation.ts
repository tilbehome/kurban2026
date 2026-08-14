export interface RequestCorrelation {
  requestId: string;
  traceparent: string;
}

export function createRequestCorrelation(headers: Headers, randomUuid = () => crypto.randomUUID()): RequestCorrelation {
  const incomingRequestId = headers.get("x-request-id");
  const incomingTraceparent = headers.get("traceparent");
  return {
    requestId: incomingRequestId && /^[a-zA-Z0-9_-]{8,160}$/.test(incomingRequestId) ? incomingRequestId : randomUuid(),
    traceparent: incomingTraceparent && /^00-[0-9a-f]{32}-[0-9a-f]{16}-0[01]$/.test(incomingTraceparent)
      ? incomingTraceparent
      : `00-${hex(randomUuid(), 32)}-${hex(randomUuid(), 16)}-01`,
  };
}

function hex(value: string, length: number): string {
  const normalized = value.toLowerCase().replace(/[^0-9a-f]/g, "");
  return `${normalized}${"0".repeat(length)}`.slice(0, length);
}
