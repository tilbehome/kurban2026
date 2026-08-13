import { expect, test } from "@playwright/test";
import { requireSyntheticAcceptance } from "./support/acceptance";

test.beforeEach(() => {
  requireSyntheticAcceptance();
  test.skip(process.env.E2E_FULL_ACCEPTANCE !== "1", "Provision edilmiş sentetik fixture ve rol oturumları gerekli");
});

for (const [name, path, heading] of [
  ["müşteri", "/musteriler", /Müşteri/i],
  ["rezervasyon ve pozitif kaporalı satış", "/saha-satis", /Saha Satış/i],
  ["tahsilat/kasa", "/tahsilat", /Tahsilat/i],
  ["vekâlet", "/hayvanlar/vekalet", /Vekâlet/i],
  ["kesim", "/kesim", /Kesim/i],
  ["tartım", "/kesim/tartim", /Tart/i],
  ["paketleme", "/operasyon/paketleme", /Paket/i],
  ["teslimat", "/lojistik/teslimat", /Teslim/i],
] as const) {
  test(`${name} sentetik kabul yüzeyi`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible();
  });
}

test("read-only/emergency stop yazmayı başarı gibi göstermez", async ({ request }) => {
  const response = await request.post("/api/tenant/operations", {
    headers: { "idempotency-key": "e2e-readonly-reject-001", accept: "application/json" },
    data: { action: "delivery.complete", targetId: "synthetic_share_001" },
  });
  expect([401, 403, 409, 423, 503]).toContain(response.status());
});
