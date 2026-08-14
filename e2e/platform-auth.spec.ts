import { expect, test } from "@playwright/test";
import { assertAxe, assertKeyboardFocus, requireSyntheticAcceptance } from "./support/acceptance";

test.beforeEach(() => requireSyntheticAcceptance());

test("@a11y Platform login TOTP, passkey ve recovery yüzeylerini sunar", async ({ page }, testInfo) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /Platform Admin girişi/i })).toBeVisible();
  await expect(page.getByLabel("6 haneli MFA kodu")).toBeVisible();
  await expect(page.getByText(/Tek kullanımlık kurtarma kodu/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /passkey/i })).toBeVisible();
  await assertKeyboardFocus(page);
  await assertAxe(page, testInfo);
});

test("yanlış origin mutasyonunu reddeder", async ({ request }) => {
  const response = await request.post("/api/auth/login", {
    headers: { origin: "https://wrong-origin.example.test", accept: "application/json" },
    form: { email: "synthetic@example.test", password: "not-a-real-password", mfaCode: "000000" },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(303);
  expect(response.headers().location).toContain("/login?error=");
});

test("@a11y form hatası ilgili giriş alanlarıyla ilişkilidir", async ({ page }) => {
  await page.goto("/login?error=SYNTHETIC_INVALID_CREDENTIALS");
  await expect(page.getByRole("alert")).toHaveAttribute("id", "platform-login-error");
  const loginForm = page.locator('form[action="/api/auth/login"]');
  for (const label of ["E-posta", "Parola", "6 haneli MFA kodu"]) {
    await expect(loginForm.getByLabel(label)).toHaveAttribute("aria-describedby", "platform-login-error");
  }
});

test("fiziksel passkey kabulü otomatik başarı sayılmaz", async () => {
  test.skip(true, "Windows Hello/gerçek authenticator ve kullanıcı etkileşimli EVD-006 kaydı gerekli");
});
