export interface TraceContext {
  traceId: string;
  spanId: string;
  requestId: string;
}

export interface ObservabilityEvent {
  trace: TraceContext;
  name: string;
  severity: "debug" | "info" | "warn" | "error";
  attributes: Record<string, string | number | boolean>;
  occurredAt: string;
}

export interface AccessibilityAcceptanceTarget {
  standard: "WCAG_2_2_AA";
  automatedAxeRequired: boolean;
  keyboardNavigationRequired: boolean;
  screenReaderSmokeRequired: boolean;
}

export interface SecurityAcceptanceTarget {
  standard: "OWASP_ASVS_L2";
  secretScanRequired: boolean;
  dependencyReviewRequired: boolean;
  authzReviewRequired: boolean;
}

export function assertTraceContext(context: TraceContext): void {
  if (!context.traceId || !context.spanId || !context.requestId) {
    throw new Error("TRACE_CONTEXT_INCOMPLETE");
  }
}

export function redactObservabilityAttributes(
  attributes: Record<string, string | number | boolean>,
): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(attributes).filter(([key, value]) => {
      const text = `${key}:${String(value)}`;
      return !/password|secret|token|databaseUrl|connectionString|authorization/i.test(text);
    }),
  );
}
