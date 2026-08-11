import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export function verifyTotp(secretBase32: string, code: string, occurredAt: string, window = 1): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const counter = Math.floor(Date.parse(occurredAt) / 30_000);
  for (let offset = -window; offset <= window; offset += 1) {
    const expected = totp(secretBase32, counter + offset);
    if (timingSafeEqual(Buffer.from(expected), Buffer.from(code))) return true;
  }
  return false;
}

export function encryptMfaSecret(secret: string, keyBase64: string): string {
  const key = encryptionKey(keyBase64);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map((item) => item.toString("base64url")).join(".");
}

export function decryptMfaSecret(payload: string, keyBase64: string): string {
  const [ivPart, tagPart, ciphertextPart] = payload.split(".");
  if (!ivPart || !tagPart || !ciphertextPart) throw new Error("PLATFORM_MFA_CIPHERTEXT_INVALID");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(keyBase64), Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextPart, "base64url")), decipher.final()]).toString("utf8");
}

function totp(secretBase32: string, counter: number): string {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", decodeBase32(secretBase32)).update(buffer).digest();
  const offset = digest[digest.length - 1]! & 0x0f;
  const binary = ((digest[offset]! & 0x7f) << 24) | ((digest[offset + 1]! & 0xff) << 16) | ((digest[offset + 2]! & 0xff) << 8) | (digest[offset + 3]! & 0xff);
  return String(binary % 1_000_000).padStart(6, "0");
}

function decodeBase32(value: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const normalized = value.toUpperCase().replace(/=+$/g, "").replace(/\s/g, "");
  if (!normalized || [...normalized].some((char) => !alphabet.includes(char))) throw new Error("PLATFORM_MFA_SECRET_INVALID");
  let bits = "";
  for (const char of normalized) bits += alphabet.indexOf(char).toString(2).padStart(5, "0");
  const bytes: number[] = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  return Buffer.from(bytes);
}

function encryptionKey(value: string): Buffer {
  const key = Buffer.from(value, "base64");
  if (key.length !== 32) throw new Error("PLATFORM_MFA_ENCRYPTION_KEY_INVALID");
  return key;
}
