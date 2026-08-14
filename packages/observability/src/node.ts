import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { PgInstrumentation } from "@opentelemetry/instrumentation-pg";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ATTR_DEPLOYMENT_ENVIRONMENT_NAME, ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
import { PrismaInstrumentation } from "@prisma/instrumentation";

let sdk: NodeSDK | undefined;
let started = false;

export async function registerNodeObservability(): Promise<"started" | "disabled" | "already_started"> {
  if (started) return "already_started";
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
  if (process.env.OTEL_SDK_DISABLED === "true" || !endpoint) return "disabled";
  const serviceName = process.env.OTEL_SERVICE_NAME;
  const environment = process.env.TILBECORE_ENV;
  if (!serviceName || !environment || !["local", "staging", "production"].includes(environment)) {
    throw new Error("OTEL_RUNTIME_IDENTITY_REQUIRED");
  }
  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: process.env.TILBECORE_RELEASE ?? "development",
      [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: environment,
    }),
    instrumentations: [
      new HttpInstrumentation({
        headersToSpanAttributes: { client: { requestHeaders: [], responseHeaders: [] }, server: { requestHeaders: [], responseHeaders: [] } },
      }),
      new PgInstrumentation({ enhancedDatabaseReporting: false }),
      new PrismaInstrumentation(),
    ],
  });
  sdk.start();
  started = true;
  return "started";
}

export async function shutdownNodeObservability(): Promise<void> {
  if (!sdk) return;
  await sdk.shutdown();
  sdk = undefined;
  started = false;
}
