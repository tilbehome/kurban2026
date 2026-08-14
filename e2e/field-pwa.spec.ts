import { expect, test } from "@playwright/test";
import { assertAxe, assertNoHorizontalReflow, requireSyntheticAcceptance } from "./support/acceptance";

test.beforeEach(() => requireSyntheticAcceptance());

test("@a11y saha PWA mobil görünümü sunucu onaysız kritik başarı göstermez", async ({ page }, testInfo) => {
  await page.goto("/saha-satis");
  await expect(page).toHaveURL(/\/giris|\/saha-satis/);
  await assertNoHorizontalReflow(page);
  await assertAxe(page, testInfo);
});

test("ağ kesilmesinde offline fallback görünür", async ({ page, context }) => {
  await page.goto("/offline");
  await context.setOffline(true);
  await page.reload().catch(() => undefined);
  await expect(page.getByText(/İnternet Bağlantısı Yok/i)).toBeVisible();
  await context.setOffline(false);
});
