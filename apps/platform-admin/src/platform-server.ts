import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { cookies, headers } from "next/headers";
import { createTilbeCoreDomainConfig } from "@tilbecore/config";
import { createPlatformPrismaClient, PrismaPlatformAdminRepository, type PlatformPrismaClient } from "@tilbecore/database-platform";
import { resolvePlatformActor, type PlatformPermissionKey, type PlatformActor } from "@tilbecore/platform";
import { decryptMfaSecret, verifyTotp } from "./totp";
import { isAllowedPlatformAdminHost, platformDeploymentEnvironment } from "./host-policy";

const globalPlatform = globalThis as unknown as { platformDb?: PlatformPrismaClient };

export function platformDb(): PlatformPrismaClient {
  const databaseUrl = process.env.PLATFORM_DATABASE_URL;
  if (!databaseUrl) throw new Error("PLATFORM_DATABASE_URL_REQUIRED");
  globalPlatform.platformDb ??= createPlatformPrismaClient(databaseUrl);
  return globalPlatform.platformDb;
}

export function platformRepository(): PrismaPlatformAdminRepository {
  return new PrismaPlatformAdminRepository(platformDb());
}

export async function requirePlatformActor(permission?: PlatformPermissionKey): Promise<PlatformActor> {
  const requestHeaders = await headers();
  if (!isAllowedPlatformAdminHost(requestHeaders.get("host"))) throw new Error("PLATFORM_HOST_DENIED");
  const store = await cookies();
  return resolvePlatformActor(platformRepository(), store.get(platformCookieName())?.value, permission);
}

export function platformCookieName(): string {
  return createTilbeCoreDomainConfig(platformDeploymentEnvironment()).cookiePolicy.platformCookieName;
}

export function platformCookieOptions(expiresAt: string) {
  return {
    httpOnly: true, secure: platformDeploymentEnvironment() !== "local", sameSite: "strict" as const,
    path: "/", expires: new Date(expiresAt),
  };
}

export const passwordVerifier = { verify: (password: string, hash: string) => bcrypt.compare(password, hash) };

export const mfaVerifier = {
  async verify(userId: string, code: string, occurredAt: string): Promise<boolean> {
    const enrollment = await platformDb().platformMfaEnrollment.findFirst({
      where: { userId, method: "totp", status: "active" }, orderBy: { activatedAt: "desc" },
    });
    const key = process.env.PLATFORM_MFA_ENCRYPTION_KEY;
    if (!enrollment?.secretCiphertext || !key) return false;
    try { return verifyTotp(decryptMfaSecret(enrollment.secretCiphertext, key), code, occurredAt); } catch { return false; }
  },
};

export async function assertTrustedMutationRequest(): Promise<{ requestId: string; traceId: string }> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  if (!isAllowedPlatformAdminHost(host)) throw new Error("PLATFORM_HOST_DENIED");
  const origin = requestHeaders.get("origin");
  if (origin && new URL(origin).hostname !== host?.replace(/:\d+$/, "")) throw new Error("PLATFORM_ORIGIN_DENIED");
  return { requestId: requestHeaders.get("x-request-id") ?? randomUUID(), traceId: requestHeaders.get("traceparent") ?? randomUUID() };
}

export function safePlatformError(error: unknown): { code: string; status: number } {
  const code = error instanceof Error && /^[A-Z0-9_:.-]+$/.test(error.message) ? error.message.split(":")[0]! : "PLATFORM_OPERATION_FAILED";
  if (code.includes("PERMISSION") || code.includes("SESSION") || code.includes("AUTH")) return { code, status: code.includes("PERMISSION") ? 403 : 401 };
  if (code.includes("NOT_FOUND")) return { code, status: 404 };
  if (code.includes("CONFLICT")) return { code, status: 409 };
  return { code, status: 400 };
}
