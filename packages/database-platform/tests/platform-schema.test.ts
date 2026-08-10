import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const schema = readFileSync(join(__dirname, "../prisma/schema.prisma"), "utf8");
const hardeningMigration = readFileSync(
  join(__dirname, "../prisma/migrations/0002_platform_baseline_hardening/migration.sql"),
  "utf8",
);

describe("platform Prisma şeması", () => {
  it("yalnız PostgreSQL provider ve PLATFORM_DATABASE_URL kullanır", () => {
    expect(schema).toContain('provider = "postgresql"');
    expect(schema).toContain('env("PLATFORM_DATABASE_URL")');
    expect(schema).not.toContain('provider = "sqlite"');
  });

  it("tenant operasyon modellerini içermez", () => {
    const forbiddenModels = [
      "Customer",
      "Musteri",
      "Animal",
      "Hayvan",
      "Share",
      "Hisse",
      "Sale",
      "Satis",
      "Payment",
      "Odeme",
      "Cash",
      "Kasa",
      "Ledger",
      "Proxy",
      "Vekalet",
      "Slaughter",
      "Kesim",
      "Package",
      "Paket",
      "Delivery",
      "Teslimat",
    ];

    for (const model of forbiddenModels) {
      expect(schema).not.toMatch(new RegExp(`model\\s+${model}\\b`));
    }
  });

  it("TenantDatabaseRef açık DB URL, parola veya secret alanı taşımaz", () => {
    const refModel = schema.match(/model TenantDatabaseRef \{[\s\S]*?\n\}/)?.[0] ?? "";

    expect(refModel).not.toMatch(/\b(connectionString|databaseUrl|url|password|secret|token|privateKey)\b/i);
  });
  it("modül entitlement geçerlilik tarihini korur ve operasyonel limitleri plan/lisans genelinde tutar", () => {
    const planModule = schema.match(/model PlatformPlanModule \{[\s\S]*?\n\}/)?.[0] ?? "";
    const licenseEntitlement = schema.match(/model PlatformLicenseEntitlement \{[\s\S]*?\n\}/)?.[0] ?? "";
    const plan = schema.match(/model PlatformPlan \{[\s\S]*?\n\}/)?.[0] ?? "";
    const license = schema.match(/model PlatformLicense \{[\s\S]*?\n\}/)?.[0] ?? "";

    expect(planModule).toContain("validUntil");
    expect(licenseEntitlement).toContain("validUntil");
    expect(planModule).not.toMatch(/\bmaxUsers\b|\bmaxDevices\b|\bmaxStorageMb\b/);
    expect(licenseEntitlement).not.toMatch(/\bmaxUsers\b|\bmaxDevices\b|\bmaxStorageMb\b/);
    expect(plan).toMatch(/\bmaxUsers\b/);
    expect(license).toMatch(/\bmaxUsers\b/);
  });

  it("PlatformUser tenant organization ilişkisi üzerinden operasyon yetkisi üretmez", () => {
    const userModel = schema.match(/model PlatformUser \{[\s\S]*?\n\}/)?.[0] ?? "";

    expect(userModel).not.toMatch(/\borganizationId\b/);
    expect(userModel).not.toMatch(/\borganization\b/);
  });

  it("status ve limit bütünlüğü PostgreSQL migration düzeyinde check constraint ile korunur", () => {
    expect(hardeningMigration).toContain('"Organization_status_check"');
    expect(hardeningMigration).toContain('"TenantInstance_provisioningStatus_check"');
    expect(hardeningMigration).toContain('"TenantInstance_runtimeStatus_check"');
    expect(hardeningMigration).toContain('"TenantInstance_releaseChannel_check"');
    expect(hardeningMigration).toContain('"TenantDatabaseRef_status_check"');
    expect(hardeningMigration).toContain('"PlatformPlan_status_check"');
    expect(hardeningMigration).toContain('"PlatformModule_status_check"');
    expect(hardeningMigration).toContain('"PlatformLicense_status_check"');
    expect(hardeningMigration).toContain('"PlatformPlan_limits_check"');
    expect(hardeningMigration).toContain('"PlatformLicense_limits_check"');
  });
});
