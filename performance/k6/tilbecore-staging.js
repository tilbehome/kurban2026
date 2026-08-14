/* global __ENV, __ITER, __VU */
import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

const profile = __ENV.K6_PROFILE || "baseline";
const baseUrl = acceptanceUrl(__ENV.K6_BASE_URL, "K6_BASE_URL");
const tenantBUrl = __ENV.K6_TENANT_B_URL ? acceptanceUrl(__ENV.K6_TENANT_B_URL, "K6_TENANT_B_URL") : undefined;
const readPath = __ENV.K6_READ_PATH || "/api/public/operations-tv";
const technicalErrors = new Rate("tilbecore_technical_error_rate");
const businessRejections = new Rate("tilbecore_business_rejection_rate");
const queueAge = new Trend("tilbecore_queue_age_ms", true);
const eventLoopLag = new Trend("tilbecore_event_loop_lag_ms", true);
const syncDuration = new Trend("tilbecore_offline_sync_duration_ms", true);
const duplicateWins = new Counter("tilbecore_duplicate_winner_count");

export const options = {
  scenarios: scenarioFor(profile),
  summaryTrendStats: ["avg", "med", "p(90)", "p(95)", "p(99)", "max"],
  systemTags: ["status", "method", "name", "scenario", "expected_response"],
  noConnectionReuse: false,
  userAgent: "TilbeCore-Staging-Acceptance/1",
};

export function setup() {
  if (["concurrency", "idempotency", "read-only", "failure-injection", "offline-sync"].includes(profile)) {
    required("K6_MUTATION_PATH");
    required("K6_FIXTURE_ID");
    required("K6_SYNTHETIC_AUTH");
  }
  if (profile === "tenant-isolation" && !tenantBUrl) throw new Error("K6_TENANT_B_URL_REQUIRED");
  return { startedAt: new Date().toISOString(), profile };
}

export default function runProfile() {
  if (profile === "tenant-isolation") return tenantIsolation();
  if (["concurrency", "idempotency", "read-only", "failure-injection", "offline-sync"].includes(profile)) return mutationScenario();
  const response = http.get(`${baseUrl}${readPath}`, { tags: { name: `public-read:${profile}` }, timeout: "10s" });
  recordResponse(response);
  sleep(Number(__ENV.K6_THINK_TIME_SECONDS || "0.25"));
}

function tenantIsolation() {
  const left = http.get(`${baseUrl}${readPath}`, { tags: { name: "tenant-a-read" } });
  const right = http.get(`${tenantBUrl}${readPath}`, { tags: { name: "tenant-b-read" } });
  recordResponse(left);
  recordResponse(right);
  const markerA = left.headers["X-Tilbecore-Tenant-Bucket"];
  const markerB = right.headers["X-Tilbecore-Tenant-Bucket"];
  check({ markerA, markerB }, { "tenant opaque markers differ": (value) => Boolean(value.markerA && value.markerB && value.markerA !== value.markerB) });
}

function mutationScenario() {
  const operationId = profile === "idempotency" ? `idem-${__VU}` : `op-${__VU}-${__ITER}`;
  const headers = {
    authorization: `Bearer ${required("K6_SYNTHETIC_AUTH")}`,
    "content-type": "application/json",
    "idempotency-key": operationId,
    "x-client-operation-id": operationId,
  };
  const body = JSON.stringify({
    fixtureId: required("K6_FIXTURE_ID"),
    mode: profile,
    synthetic: true,
  });
  const started = Date.now();
  const response = http.post(`${baseUrl}${required("K6_MUTATION_PATH")}`, body, { headers, tags: { name: `synthetic-mutation:${profile}` }, timeout: "15s" });
  recordResponse(response);
  if (profile === "idempotency") {
    const retry = http.post(`${baseUrl}${required("K6_MUTATION_PATH")}`, body, { headers, tags: { name: "synthetic-mutation:idempotency-retry" }, timeout: "15s" });
    recordResponse(retry);
    const firstId = safeJson(response, "resultId");
    const retryId = safeJson(retry, "resultId");
    if (firstId && retryId && firstId !== retryId) duplicateWins.add(1);
  }
  if (profile === "offline-sync") syncDuration.add(Date.now() - started);
}

function recordResponse(response) {
  const technical = response.status >= 500 || response.status === 0;
  const rejected = response.status >= 400 && response.status < 500;
  technicalErrors.add(technical);
  businessRejections.add(rejected);
  const queueHeader = Number(response.headers["X-Tilbecore-Queue-Age-Ms"]);
  if (Number.isFinite(queueHeader)) queueAge.add(queueHeader);
  const eventLoopHeader = Number(response.headers["X-Tilbecore-Event-Loop-Lag-Ms"]);
  if (Number.isFinite(eventLoopHeader)) eventLoopLag.add(eventLoopHeader);
  check(response, { "response is not technical failure": (value) => value.status > 0 && value.status < 500 });
}

function scenarioFor(selected) {
  switch (selected) {
    case "baseline":
      return { baseline: { executor: "shared-iterations", vus: 1, iterations: 1, maxDuration: "1m" } };
    case "load":
    case "db-pool":
    case "worker-backlog":
    case "report":
      return { [selected]: { executor: "constant-vus", vus: positiveInt("TILBE_K6_VUS"), duration: required("TILBE_K6_DURATION") } };
    case "spike":
      return { spike: { executor: "ramping-vus", startVUs: 0, stages: [
        { duration: required("TILBE_K6_RAMP_DURATION"), target: positiveInt("TILBE_K6_SPIKE_VUS") },
        { duration: required("TILBE_K6_HOLD_DURATION"), target: positiveInt("TILBE_K6_SPIKE_VUS") },
        { duration: required("TILBE_K6_RAMP_DOWN_DURATION"), target: 0 },
      ] } };
    case "soak":
      return { soak: { executor: "constant-vus", vus: positiveInt("TILBE_K6_VUS"), duration: required("TILBE_K6_DURATION"), gracefulStop: "30s" } };
    case "concurrency":
    case "idempotency":
    case "tenant-isolation":
    case "read-only":
    case "failure-injection":
    case "offline-sync":
      return { [selected]: { executor: "per-vu-iterations", vus: positiveInt("TILBE_K6_VUS"), iterations: positiveInt("TILBE_K6_ITERATIONS"), maxDuration: required("TILBE_K6_MAX_DURATION") } };
    default:
      throw new Error(`K6_PROFILE_INVALID:${selected}`);
  }
}

function acceptanceUrl(value, name) {
  if (!value) throw new Error(`${name}_REQUIRED`);
  const match = /^https:\/\/([a-z0-9.-]+)(?::([0-9]{1,5}))?(?:\/)?$/i.exec(value.trim());
  if (!match) throw new Error(`${name}_MUST_BE_HTTPS_STAGING_OR_LOCAL`);
  const hostname = match[1].toLowerCase();
  const port = match[2];
  if (port && Number(port) > 65535) throw new Error(`${name}_PORT_INVALID`);
  const staging = hostname === "staging.tilbecore.com" || hostname.endsWith(".staging.tilbecore.com");
  const local = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "tilbecore.test" || hostname.endsWith(".tilbecore.test");
  if (!staging && !local) throw new Error(`${name}_MUST_BE_HTTPS_STAGING_OR_LOCAL`);
  if (hostname === "tilbecore.com" || (hostname.endsWith(".tilbecore.com") && !staging)) throw new Error(`${name}_PRODUCTION_FORBIDDEN`);
  return `https://${hostname}${port ? `:${port}` : ""}`;
}

function positiveInt(name) {
  const value = Number(required(name));
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${name}_POSITIVE_INTEGER_REQUIRED`);
  return value;
}

function required(name) {
  const value = __ENV[name];
  if (!value) throw new Error(`${name}_REQUIRED`);
  return value;
}

function safeJson(response, key) {
  try { return response.json(key); } catch { return undefined; }
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify({ profile, result: "MEASURED_NOT_ACCEPTED", metrics: data.metrics }, null, 2),
    [`artifacts/k6/${profile}-summary.json`]: JSON.stringify({ profile, synthetic: true, productionWrite: false, metrics: data.metrics }, null, 2),
  };
}
