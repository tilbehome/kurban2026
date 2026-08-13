import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type TestInfo } from "@playwright/test";

export const acceptanceEnabled = process.env.E2E_RUN === "1";

export function requireSyntheticAcceptance(): void {
  test.skip(!acceptanceEnabled, "E2E_RUN=1 ve erişilebilir sentetik local/staging ortamı gerekli");
}

export async function assertAxe(page: Page, testInfo: TestInfo): Promise<void> {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const safeFindings = result.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    targets: violation.nodes.map((node) => node.target),
  }));
  await testInfo.attach("axe-safe-findings", {
    body: Buffer.from(JSON.stringify(safeFindings, null, 2)),
    contentType: "application/json",
  });
  expect(safeFindings, "axe A/AA ihlalleri").toEqual([]);
}

export async function assertKeyboardFocus(page: Page): Promise<void> {
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
}

export async function assertNoHorizontalReflow(page: Page): Promise<void> {
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
  expect(overflow, "%200 zoom/reflow yatay taşma").toBe(false);
}
