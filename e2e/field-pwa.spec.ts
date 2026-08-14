import { expect, test } from "@playwright/test";
import { assertAxe, assertNoHorizontalReflow, requireSyntheticAcceptance } from "./support/acceptance";

test.beforeEach(() => requireSyntheticAcceptance());

test("@a11y saha PWA mobil görünümü sunucu onaysız kritik başarı göstermez", async ({ page }, testInfo) => {
  await page.goto("/saha-satis");
  await expect(page).toHaveURL(/\/giris|\/saha-satis/);
  await assertNoHorizontalReflow(page);
  await assertAxe(page, testInfo);
});
