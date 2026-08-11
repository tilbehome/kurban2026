import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decryptMfaSecret, encryptMfaSecret, verifyTotp } from "../src/totp";

describe("platform TOTP ve secret saklama", () => {
  it("RFC 6238 SHA-1 vektörünün altı haneli sonucunu doğrular", () => {
    expect(verifyTotp("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", "287082", "1970-01-01T00:00:59.000Z", 0)).toBe(true);
    expect(verifyTotp("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", "000000", "1970-01-01T00:00:59.000Z", 0)).toBe(false);
  });

  it("MFA secretını AES-GCM ile şifreler ve yalnız doğru anahtarla açar", () => {
    const key = randomBytes(32).toString("base64");
    const encrypted = encryptMfaSecret("JBSWY3DPEHPK3PXP", key);
    expect(encrypted).not.toContain("JBSWY3DPEHPK3PXP");
    expect(decryptMfaSecret(encrypted, key)).toBe("JBSWY3DPEHPK3PXP");
    expect(() => decryptMfaSecret(encrypted, randomBytes(32).toString("base64"))).toThrow();
  });
});
