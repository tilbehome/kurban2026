import { expect, test } from "@playwright/test";
import { requireSyntheticAcceptance } from "./support/acceptance";

test.beforeEach(() => requireSyntheticAcceptance());

test("ağ kesilmesinde offline fallback görünür", async ({ page, context }) => {
  await page.goto("/offline");
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  if (!(await page.evaluate(() => navigator.serviceWorker.controller !== null))) {
    await page.reload();
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, { timeout: 10_000 });
  }
  await context.setOffline(true);
  await page.goto("/saha-satis");
  await expect(page.getByText(/İnternet Bağlantısı Yok/i)).toBeVisible();
  await context.setOffline(false);
});
