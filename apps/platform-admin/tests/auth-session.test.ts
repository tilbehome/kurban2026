import { describe, expect, it, vi } from "vitest";
import {
  authenticatePlatformUser,
  hashPlatformSessionToken,
  resolvePlatformActor,
  type PlatformAdminRepository,
  type PlatformAuthUserRecord,
  type PlatformSessionRecord,
  type PlatformUserId,
} from "@tilbecore/platform";

const user: PlatformAuthUserRecord = {
  id: "platform_user_test" as PlatformUserId, email: "admin@example.test", displayName: "Admin",
  status: "active", passwordHash: "hash", failedLoginCount: 0, mfaRequired: true, authVersion: 3,
  roles: [{ key: "platform_super_admin", status: "active", permissions: [] }],
};

describe("platform auth ve session", () => {
  it("parola ve MFA sonrası yalnız hashlenmiş session tokenını kaydeder", async () => {
    let session: PlatformSessionRecord | undefined;
    const repository = authRepository({ createSession: async (input) => { session = input; } });
    const result = await authenticatePlatformUser(repository, { verify: async () => true }, { verify: async () => true }, {
      email: user.email, password: "correct", mfaCode: "123456", requestId: "req_login", occurredAt: "2026-08-11T10:00:00.000Z",
    });
    expect(result.token).not.toBe(session?.tokenHash);
    expect(session?.tokenHash).toBe(hashPlatformSessionToken(result.token));
    expect(result.actor.permissions).toContain("platform.user.manage");
  });

  it("beşinci hatalı girişte kontrollü kilit kaydeder", async () => {
    const markLoginFailure = vi.fn();
    const repository = authRepository({
      findAuthUserByEmail: async () => ({ ...user, failedLoginCount: 4 }), markLoginFailure,
    });
    await expect(authenticatePlatformUser(repository, { verify: async () => false }, { verify: async () => false }, {
      email: user.email, password: "wrong", mfaCode: "000000", requestId: "req_fail", occurredAt: "2026-08-11T10:00:00.000Z",
    })).rejects.toThrow("PLATFORM_AUTH_INVALID");
    expect(markLoginFailure).toHaveBeenCalledWith(user.id, 5, "2026-08-11T10:15:00.000Z");
  });

  it("authVersion değişmiş oturumu fail-closed iptal eder", async () => {
    const revokeSession = vi.fn();
    const repository = authRepository({
      findSessionByTokenHash: async (tokenHash) => ({ id: "session_a", userId: user.id, tokenHash, status: "active", authVersion: 2, expiresAt: "2026-08-11T20:00:00.000Z" }),
      revokeSession,
    });
    await expect(resolvePlatformActor(repository, "opaque", undefined, "2026-08-11T10:00:00.000Z")).rejects.toThrow("PLATFORM_SESSION_INVALID");
    expect(revokeSession).toHaveBeenCalledWith("session_a", "2026-08-11T10:00:00.000Z");
  });

  it("atanmış rol pasifleştirildiğinde mevcut oturumu fail-closed iptal eder", async () => {
    const revokeSession = vi.fn();
    const repository = authRepository({
      findAuthUserById: async () => ({ ...user, roles: [{ ...user.roles[0]!, status: "suspended" }] }),
      findSessionByTokenHash: async (tokenHash) => ({ id: "session_role", userId: user.id, tokenHash, status: "active", authVersion: user.authVersion, expiresAt: "2026-08-11T20:00:00.000Z" }),
      revokeSession,
    });
    await expect(resolvePlatformActor(repository, "opaque", undefined, "2026-08-11T10:00:00.000Z")).rejects.toThrow("PLATFORM_SESSION_INVALID");
    expect(revokeSession).toHaveBeenCalled();
  });
});

function authRepository(overrides: Partial<PlatformAdminRepository>): PlatformAdminRepository {
  return {
    findAuthUserByEmail: async () => user, findAuthUserById: async () => user,
    markLoginFailure: async () => undefined, markLoginSuccess: async () => undefined,
    createSession: async () => undefined, findSessionByTokenHash: async () => null,
    rotateSession: async () => false, revokeSession: async () => undefined, revokeUserSessions: async () => undefined,
    recordAudit: async () => undefined,
    ...overrides,
  } as unknown as PlatformAdminRepository;
}
