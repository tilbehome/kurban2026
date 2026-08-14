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
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("E2E_VIEWPORT_REQUIRED");
  await page.setViewportSize({ width: Math.max(320, Math.floor(viewport.width / 2)), height: viewport.height });
  const overflow = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const elements = Array.from(document.querySelectorAll<HTMLElement>("body *"))
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        className: typeof element.className === "string" ? element.className : "",
        left: element.getBoundingClientRect().left,
        right: element.getBoundingClientRect().right,
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
      }))
      .filter((element) => element.right > viewportWidth + 2 || element.left < -2 || element.scrollWidth > element.clientWidth + 2)
      .slice(0, 12);
    return {
      viewportWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      elements,
    };
  });
  expect(overflow.documentScrollWidth, `%200 zoom/reflow yatay taşma: ${JSON.stringify(overflow)}`).toBeLessThanOrEqual(
    overflow.viewportWidth + 2,
  );
}
