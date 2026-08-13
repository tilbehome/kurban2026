import { defineConfig, devices, type PlaywrightTestConfig } from "@playwright/test";

const enabled = process.env.E2E_RUN === "1";
const tenantBaseUrl = acceptanceUrl("E2E_TENANT_URL", "https://demo.staging.tilbecore.com");
const platformBaseUrl = acceptanceUrl("E2E_PLATFORM_URL", "https://console.staging.tilbecore.com");
const publicBaseUrl = acceptanceUrl("E2E_PUBLIC_URL", tenantBaseUrl);
const artifactOptIn = process.env.E2E_ALLOW_SANITIZED_ARTIFACTS === "1";
const platformStorageState = process.env.E2E_PLATFORM_STORAGE_STATE;

const sharedUse: PlaywrightTestConfig["use"] = {
  baseURL: tenantBaseUrl,
  ignoreHTTPSErrors: false,
  trace: artifactOptIn ? "retain-on-failure" : "off",
  screenshot: artifactOptIn ? "only-on-failure" : "off",
  video: "off",
  serviceWorkers: "allow",
};

export default defineConfig({
  testDir: "./e2e",
  outputDir: "artifacts/playwright",
  fullyParallel: true,
  forbidOnly: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: sharedUse,
  metadata: { acceptanceEnabled: enabled, syntheticDataOnly: true, productionWrite: false },
  projects: [
    { name: "chromium-desktop", testMatch: /public-surfaces\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
    { name: "firefox-desktop", testMatch: /public-surfaces\.spec\.ts/, use: { ...devices["Desktop Firefox"] } },
    { name: "webkit-desktop", testMatch: /public-surfaces\.spec\.ts/, use: { ...devices["Desktop Safari"] } },
    { name: "android-phone", testMatch: /(?:public-surfaces|field-pwa)\.spec\.ts/, use: { ...devices["Pixel 7"] } },
    { name: "tablet-portrait", testMatch: /(?:public-surfaces|field-pwa)\.spec\.ts/, use: { ...devices["iPad (gen 7)"], viewport: { width: 810, height: 1080 } } },
    { name: "tablet-landscape", testMatch: /(?:public-surfaces|field-pwa)\.spec\.ts/, use: { ...devices["iPad (gen 7) landscape"], viewport: { width: 1080, height: 810 } } },
    { name: "platform-admin", testMatch: /platform-(?:auth|acceptance)\.spec\.ts/, use: { ...devices["Desktop Chrome"], baseURL: platformBaseUrl, ...(platformStorageState ? { storageState: platformStorageState } : {}) } },
    { name: "tenant-panel", testMatch: /(?:tenant-isolation|critical-flow)\.spec\.ts/, use: { ...devices["Desktop Chrome"], baseURL: tenantBaseUrl } },
    { name: "field-pwa", testMatch: /field-pwa\.spec\.ts/, use: { ...devices["Pixel 7"], baseURL: tenantBaseUrl } },
    { name: "tv-public", testMatch: /public-surfaces\.spec\.ts/, use: { viewport: { width: 1920, height: 1080 }, baseURL: publicBaseUrl } },
    { name: "locale-tr", testMatch: /locale-rtl\.spec\.ts/, use: { ...devices["Desktop Chrome"], locale: "tr-TR", baseURL: tenantBaseUrl } },
    { name: "locale-en", testMatch: /locale-rtl\.spec\.ts/, use: { ...devices["Desktop Chrome"], locale: "en-US", baseURL: tenantBaseUrl } },
    { name: "locale-ar-rtl", testMatch: /locale-rtl\.spec\.ts/, use: { ...devices["Desktop Chrome"], locale: "ar-SA", baseURL: tenantBaseUrl } },
  ],
});

function acceptanceUrl(name: string, fallback: string): string {
  const value = process.env[name] ?? fallback;
  const url = new URL(value);
  if (enabled) {
    if (url.protocol !== "https:") throw new Error(`E2E_HTTPS_REQUIRED:${name}`);
    const staging = url.hostname === "staging.tilbecore.com" || url.hostname.endsWith(".staging.tilbecore.com");
    const local = url.hostname === "tilbecore.test" || url.hostname.endsWith(".tilbecore.test");
    if (!staging && !local) throw new Error(`E2E_TARGET_NOT_STAGING_OR_LOCAL:${name}`);
    if (url.hostname === "tilbecore.com" || (url.hostname.endsWith(".tilbecore.com") && !staging)) {
      throw new Error(`E2E_PRODUCTION_TARGET_FORBIDDEN:${name}`);
    }
  }
  return url.toString().replace(/\/$/, "");
}
