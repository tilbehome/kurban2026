import { expect, test } from "@playwright/test";
import { requireSyntheticAcceptance } from "./support/acceptance";

test.beforeEach(() => requireSyntheticAcceptance());

test("tr/en/ar locale ve gerçek RTL kabulü", async ({ page }, testInfo) => {
  await page.goto("/giris");
  const locale = testInfo.project.use.locale;
  if (locale === "ar-SA") {
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", /^ar/);
  } else {
    await expect(page.locator("html")).toHaveAttribute("lang", locale === "en-US" ? /^en/ : /^tr/);
  }
});
