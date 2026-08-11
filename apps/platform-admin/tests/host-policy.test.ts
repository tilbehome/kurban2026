import { describe, expect, it } from "vitest";
import { isAllowedPlatformAdminHost, platformAdminHostname } from "../src/host-policy";

describe("platform admin host sınırı", () => {
  it.each([
    ["production", "console.tilbecore.com"],
    ["staging", "console.staging.tilbecore.com"],
    ["local", "console.tilbecore.test"],
  ] as const)("%s ortamında yalnız merkezi console hostunu kabul eder", (environment, host) => {
    expect(platformAdminHostname(environment)).toBe(host);
    expect(isAllowedPlatformAdminHost(`${host}:3100`, environment)).toBe(true);
    expect(isAllowedPlatformAdminHost(`firma.${host.replace("console.", "")}`, environment)).toBe(false);
    expect(isAllowedPlatformAdminHost("console.attacker.test", environment)).toBe(false);
  });
});
