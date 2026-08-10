import { describe, expect, it } from "vitest";
import {
  createTenantUrl,
  createTilbeCoreDomainConfig,
  customDomainCanBeActive,
  privateServiceUrl,
  resolveHost,
  type CustomDomainConfigEntry,
} from "@tilbecore/config";

describe("TilbeCore SaaS domain ve origin sözleşmesi", () => {
  it("production platform ve tenant URL'lerini portsuz üretir", () => {
    const config = createTilbeCoreDomainConfig("production");

    expect(config.baseDomain).toBe("tilbecore.com");
    expect(config.systemOrigins.marketing).toBe("https://tilbecore.com");
    expect(config.systemOrigins.platform).toBe("https://console.tilbecore.com");
    expect(createTenantUrl(config, "ada-bereket", "origin")).toBe("https://ada-bereket.tilbecore.com");
    expect(createTenantUrl(config, "ada-bereket", "panel")).toBe("https://ada-bereket.tilbecore.com/panel");
    expect(createTenantUrl(config, "ada-bereket", "fieldPwa")).toBe("https://ada-bereket.tilbecore.com/saha");
    expect(createTenantUrl(config, "ada-bereket", "tv")).toBe("https://ada-bereket.tilbecore.com/tv");
    expect(createTenantUrl(config, "ada-bereket", "api")).toBe("https://ada-bereket.tilbecore.com/api/v1");

    for (const url of [
      config.systemOrigins.platform,
      createTenantUrl(config, "ada-bereket", "panel"),
      createTenantUrl(config, "ada-bereket", "fieldPwa"),
      createTenantUrl(config, "ada-bereket", "tv"),
      createTenantUrl(config, "ada-bereket", "api"),
    ]) {
      expect(new URL(url).port).toBe("");
    }
  });

  it("staging ve local .test URL'lerini üretir", () => {
    const staging = createTilbeCoreDomainConfig("staging");
    const local = createTilbeCoreDomainConfig("local");

    expect(staging.systemOrigins.platform).toBe("https://console.staging.tilbecore.com");
    expect(createTenantUrl(staging, "firma", "origin")).toBe("https://firma.staging.tilbecore.com");
    expect(local.systemOrigins.platform).toBe("https://console.tilbecore.test");
    expect(createTenantUrl(local, "firma", "origin")).toBe("https://firma.tilbecore.test");
  });

  it("tokenlı takip, QR ve davet URL'lerini opaque token ile üretir", () => {
    const config = createTilbeCoreDomainConfig("production");

    expect(createTenantUrl(config, "firma", "customerTracking", "tok_123")).toBe(
      "https://firma.tilbecore.com/takip/tok_123",
    );
    expect(createTenantUrl(config, "firma", "qr", "qr_123")).toBe(
      "https://firma.tilbecore.com/q/qr_123",
    );
    expect(createTenantUrl(config, "firma", "invite", "invite_123")).toBe(
      "https://firma.tilbecore.com/davet/invite_123",
    );
  });

  it("reserved veya geçersiz tenant slug değerlerini reddeder", () => {
    const config = createTilbeCoreDomainConfig("production");

    expect(() => createTenantUrl(config, "console", "panel")).toThrow("INVALID_TENANT_SLUG");
    expect(() => createTenantUrl(config, "bad_slug", "panel")).toThrow("INVALID_TENANT_SLUG");
    expect(() => createTenantUrl(config, "-firma", "panel")).toThrow("INVALID_TENANT_SLUG");
  });

  it("host çözümlemede platform ve tenant origin ayrımını yapar", () => {
    const config = createTilbeCoreDomainConfig("production");

    expect(resolveHost(config, "console.tilbecore.com").kind).toBe("platform");
    expect(resolveHost(config, "ada-bereket.tilbecore.com").kind).toBe("tenant");
    expect(resolveHost(config, "ada-bereket.tilbecore.com:443").tenantSlug).toBe("ada-bereket");
    expect(() => resolveHost(config, "unknown.example.com")).toThrow("UNKNOWN_HOST");
    expect(() => resolveHost(config, "bad host.tilbecore.com")).toThrow("INVALID_HOST_HEADER");
  });

  it("custom domain DNS ve TLS doğrulanmadan aktif sayılmaz", () => {
    const pending: CustomDomainConfigEntry = {
      hostname: "kurban.firmaadi.com",
      tenantSlug: "firma" as CustomDomainConfigEntry["tenantSlug"],
      status: "VERIFIED",
      dnsVerified: true,
      tlsReady: false,
    };
    const active: CustomDomainConfigEntry = { ...pending, status: "ACTIVE", tlsReady: true };
    const config = createTilbeCoreDomainConfig("production");

    expect(customDomainCanBeActive(pending)).toBe(false);
    expect(customDomainCanBeActive(active)).toBe(true);
    expect(resolveHost(config, "kurban.firmaadi.com", [active]).kind).toBe("customTenant");
  });

  it("private servisler için public URL üretmez", () => {
    const config = createTilbeCoreDomainConfig("production");

    expect(() => privateServiceUrl(config, "postgresql")).toThrow(
      "PRIVATE_SERVICE_HAS_NO_PUBLIC_URL:postgresql",
    );
    expect(() => privateServiceUrl(config, "secretStore")).toThrow(
      "PRIVATE_SERVICE_HAS_NO_PUBLIC_URL:secretStore",
    );
  });
});
