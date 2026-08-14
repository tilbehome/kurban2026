import { expect, test } from "@playwright/test";
import { requireSyntheticAcceptance } from "./support/acceptance";

test.beforeEach(() => requireSyntheticAcceptance());

test("tenant A session/cookie tenant B hostunda kabul edilmez", async ({ playwright }) => {
  const tenantA = requiredUrl("E2E_TENANT_URL");
  const tenantB = requiredUrl("E2E_TENANT_B_URL");
  const tenantACookie = process.env.E2E_TENANT_A_SESSION_COOKIE;
  test.skip(!tenantACookie, "Sentetik tenant A oturum cookie'si gerekli; değer artefakta yazılmaz");
  const context = await playwright.request.newContext({
    baseURL: tenantB,
    extraHTTPHeaders: { cookie: tenantACookie! },
  });
  const response = await context.get("/api/tenant/operations");
  expect([401, 403, 404]).toContain(response.status());
  await context.dispose();
  expect(new URL(tenantA).hostname).not.toBe(new URL(tenantB).hostname);
});

test("unknown/reserved tenant host reddedilir", async ({ playwright }) => {
  const target = requiredUrl("E2E_UNKNOWN_HOST_URL");
  const context = await playwright.request.newContext({ baseURL: target });
  const response = await context.get("/api/tenant/operations");
  expect([400, 401, 403, 404, 421]).toContain(response.status());
  await context.dispose();
});

function requiredUrl(name: string): string {
  const value = process.env[name];
  test.skip(!value, `${name} sentetik staging fixture'ı gerekli`);
  return value!;
}
