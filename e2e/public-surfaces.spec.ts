import { expect, test } from "@playwright/test";
import { assertAxe, assertKeyboardFocus, assertNoHorizontalReflow, requireSyntheticAcceptance } from "./support/acceptance";

test.beforeEach(() => requireSyntheticAcceptance());

test("@a11y TV/public görünümü PII içermeden erişilebilir açılır", async ({ page }, testInfo) => {
  const response = await page.goto("/tv", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBeLessThan(400);
  const body = await page.locator("body").innerText();
  expect(body).not.toMatch(/\b\d{11}\b|\b05\d{9}\b|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/);
  await assertAxe(page, testInfo);
  await assertKeyboardFocus(page);
  await assertNoHorizontalReflow(page);
});

test("@a11y offline fallback bağlantısız durumu başarı gibi göstermez", async ({ page }, testInfo) => {
  await page.goto("/offline", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /İnternet Bağlantısı Yok/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Tekrar Dene/i })).toBeVisible();
  await assertAxe(page, testInfo);
});
