import { expect, test } from "@playwright/test";
import { requireSyntheticAcceptance } from "./support/acceptance";

const nonce = process.env.E2E_FIXTURE_NONCE;

test.describe.configure({ mode: "serial" });

test.beforeEach(() => {
  requireSyntheticAcceptance();
  test.skip(process.env.E2E_FULL_ACCEPTANCE !== "1", "Tam sentetik kabul mutasyonları açık değil");
  test.skip(!process.env.E2E_PLATFORM_STORAGE_STATE, "Yetkili sentetik Platform Admin storage state gerekli");
  test.skip(!nonce || !/^[a-z0-9]{6,24}$/.test(nonce), "Benzersiz E2E_FIXTURE_NONCE gerekli");
});

test("sentetik firma oluşturma ve provisioning işi", async ({ page }) => {
  const organizationId = `org_e2e_${nonce}`;
  const tenantId = `tenant_e2e_${nonce}`;
  await page.goto("/provisioning/new");
  await page.getByLabel("Firma adı").fill(`Sentetik E2E ${nonce}`);
  await page.getByLabel("Slug").fill(`e2e-${nonce}`);
  await page.getByLabel("Organization ID").fill(organizationId);
  await page.getByLabel("Tenant ID").fill(tenantId);
  await page.getByLabel("Plan ID").fill("plan_staging_acceptance");
  await page.getByLabel("Kullanıcı kotası").fill("10");
  await page.getByLabel("Hayvan kotası").fill("20");
  await page.getByLabel("Sezon kotası").fill("2");
  await page.getByLabel("Modül anahtarları").fill("sales,finance,slaughter");
  await page.getByLabel("Yönetilen DB bölgesi").fill("staging-local");
  await page.getByLabel("Ad soyad").fill("Sentetik Firma Admin");
  await page.getByLabel("E-posta").fill(`admin-${nonce}@example.test`);
  await page.getByLabel("Idempotency anahtarı").fill(`e2e-provision-${nonce}`);
  await page.getByLabel("Onay nedeni").fill("Sentetik staging kabul testi");
  await page.getByLabel(/Bilgileri ve etkiyi doğruladım/).check();
  await page.getByRole("button", { name: "Provisioning işini başlat" }).click();
  await expect(page).toHaveURL(/\/provisioning/);
  await expect(page.getByText(organizationId)).toBeVisible();
});

test("provision edilmiş sentetik firma için Firma Admin daveti", async ({ page }) => {
  const organizationId = `org_e2e_${nonce}`;
  await expect.poll(async () => (await page.request.get(`/organizations/${organizationId}`)).status(), {
    message: "Provisioning worker firma kaydını hazır etmedi",
    timeout: 120_000,
  }).toBe(200);
  await page.goto(`/organizations/${organizationId}#admins`);
  await page.getByLabel("Firma Admin e-postası").fill(`invite-${nonce}@example.test`);
  await page.getByLabel("Adı").fill("Sentetik Davetli Admin");
  await page.getByRole("button", { name: "Daveti oluştur / yeniden gönder" }).click();
  await expect(page.locator("output")).toContainText("Tek kullanımlık aktivasyon bağlantısı");
});
