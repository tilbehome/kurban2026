import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const schema = readFileSync(join(__dirname, "../prisma/schema.prisma"), "utf8");

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
});
