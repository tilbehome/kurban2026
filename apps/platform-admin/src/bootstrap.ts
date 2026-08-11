import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { createPlatformPrismaClient } from "@tilbecore/database-platform";
import { PLATFORM_ROLE_KEYS, PLATFORM_ROLE_PERMISSIONS } from "@tilbecore/platform";
import { encryptMfaSecret } from "./totp";

void main().catch((error) => {
  const code = error instanceof Error && /^[A-Z0-9_]+$/.test(error.message) ? error.message : "PLATFORM_BOOTSTRAP_FAILED";
  process.stderr.write(`${JSON.stringify({ ok: false, code })}\n`);
  process.exitCode = 1;
});

async function main(): Promise<void> {
  const production = process.env.NODE_ENV === "production" || process.env.TILBECORE_ENV === "production";
  if (process.env.PLATFORM_BOOTSTRAP_CONFIRM !== "CREATE_FIRST_SUPER_ADMIN") throw new Error("PLATFORM_BOOTSTRAP_CONFIRM_REQUIRED");
  if (production && process.env.PLATFORM_BOOTSTRAP_PRODUCTION_ENABLED !== "true") throw new Error("PLATFORM_BOOTSTRAP_PRODUCTION_DISABLED");
  const databaseUrl = required("PLATFORM_DATABASE_URL");
  const email = required("PLATFORM_BOOTSTRAP_EMAIL").trim().toLowerCase();
  const displayName = required("PLATFORM_BOOTSTRAP_DISPLAY_NAME").trim();
  const password = required("PLATFORM_BOOTSTRAP_PASSWORD");
  const mfaSecret = required("PLATFORM_BOOTSTRAP_MFA_SECRET");
  const encryptionKey = required("PLATFORM_MFA_ENCRYPTION_KEY");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 14 || displayName.length < 2) throw new Error("PLATFORM_BOOTSTRAP_INPUT_INVALID");

  const db = createPlatformPrismaClient(databaseUrl);
  try {
    if (await db.platformUser.count() !== 0) throw new Error("PLATFORM_BOOTSTRAP_ALREADY_COMPLETED");
    const passwordHash = await bcrypt.hash(password, 12);
    const secretCiphertext = encryptMfaSecret(mfaSecret, encryptionKey);
    const userId = `platform_user_${randomUUID()}`;
    await db.$transaction(async (tx) => {
      for (const key of PLATFORM_ROLE_KEYS) {
        await tx.platformRole.upsert({
          where: { key },
          create: { id: `platform_role_${key}`, key, displayName: roleName(key), status: "active", permissions: [...PLATFORM_ROLE_PERMISSIONS[key]] },
          update: { displayName: roleName(key), status: "active", permissions: [...PLATFORM_ROLE_PERMISSIONS[key]] },
        });
      }
      await tx.platformUser.create({
        data: { id: userId, email, displayName, status: "active", passwordHash, mfaRequired: true,
          roles: { create: { role: { connect: { key: "platform_super_admin" } } } } },
      });
      await tx.platformMfaEnrollment.create({
        data: { id: `platform_mfa_${randomUUID()}`, userId, method: "totp", status: "active", activatedAt: new Date(), secretCiphertext, secretKeyVersion: "v1" },
      });
      await tx.platformAuditLog.create({ data: {
        id: `platform_audit_${randomUUID()}`, actorUserId: userId, action: "platform.bootstrap.first_super_admin",
        targetType: "PlatformUser", targetId: userId, requestId: `bootstrap_${randomUUID()}`,
        result: "success", metadata: { mfaMethod: "totp", role: "platform_super_admin" },
      } });
    });
    process.stdout.write(`${JSON.stringify({ ok: true, code: "PLATFORM_BOOTSTRAP_COMPLETED", userId })}\n`);
  } finally { await db.$disconnect(); }
}

function required(name: string): string { const value = process.env[name]; if (!value) throw new Error("PLATFORM_BOOTSTRAP_ENV_REQUIRED"); return value; }
function roleName(key: string): string { return ({ platform_super_admin: "Platform Super Admin", platform_operations: "Platform Operations", platform_support: "Platform Support", platform_read_only: "Platform Read Only" } as Record<string, string>)[key] ?? key; }
