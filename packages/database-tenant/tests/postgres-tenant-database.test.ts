import { describe, expect, it } from "vitest";
import type { TenantDatabaseRefId } from "@tilbecore/contracts";
import {
  TenantDatabaseLocator,
  quotePostgresIdentifier,
  tenantDatabaseNameForRef,
} from "../src";

describe("PostgreSQL tenant DB güvenlik sınırı", () => {
  it("yalnız güvenli ve uzunluğu sınırlı databaseRef identifier kabul eder", () => {
    expect(tenantDatabaseNameForRef("dbref_safe_01" as TenantDatabaseRefId)).toBe("tc_dbref_safe_01");
    expect(() => tenantDatabaseNameForRef("dbref;drop_database" as TenantDatabaseRefId))
      .toThrow("TENANT_DATABASE_IDENTIFIER_INVALID");
    expect(() => tenantDatabaseNameForRef("DBREF_UPPER" as TenantDatabaseRefId))
      .toThrow("TENANT_DATABASE_IDENTIFIER_INVALID");
    expect(() => tenantDatabaseNameForRef(`d${"x".repeat(60)}` as TenantDatabaseRefId))
      .toThrow("TENANT_DATABASE_IDENTIFIER_INVALID");
  });

  it("SQL identifier yalnız doğrulanmış isimden quote edilir", () => {
    expect(quotePostgresIdentifier("tc_dbref_safe_01")).toBe('"tc_dbref_safe_01"');
    expect(() => quotePostgresIdentifier('tc_safe"; DROP DATABASE x;--'))
      .toThrow("TENANT_DATABASE_IDENTIFIER_INVALID");
  });

  it("locator yalnız PostgreSQL admin URL kabul eder ve tenant hedefini deterministik seçer", () => {
    const locator = new TenantDatabaseLocator("postgresql://user:pass@example.test:5432/postgres");
    const tenantUrl = new URL(locator.tenantConnectionUrl("dbref_safe_01" as TenantDatabaseRefId));
    expect(tenantUrl.pathname).toBe("/tc_dbref_safe_01");
    expect(tenantUrl.searchParams.get("connect_timeout")).toBe("10");
    expect(() => new TenantDatabaseLocator("https://example.test/postgres"))
      .toThrow("TENANT_DATABASE_ADMIN_URL_INVALID");
  });
});
