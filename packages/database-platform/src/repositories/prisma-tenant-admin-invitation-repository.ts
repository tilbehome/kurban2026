import type { TenantAdminInvitationRepository } from "@tilbecore/provisioning";
import type { PlatformPrismaClientLike } from "../client";

export class PrismaTenantAdminInvitationRepository implements TenantAdminInvitationRepository {
  constructor(private readonly db: PlatformPrismaClientLike) {}

  async ensureInvitation(input: Parameters<TenantAdminInvitationRepository["ensureInvitation"]>[0]): Promise<void> {
    const email = input.email.trim().toLowerCase();
    const existing = await this.db.tenantAdminInvitation.findUnique({
      where: { tenantInstanceId_email: { tenantInstanceId: input.tenantId, email } },
    });
    if (existing) {
      if (existing.organizationId !== input.organizationId || existing.roleKey !== input.roleKey) {
        throw new Error("PROVISIONING_ADMIN_INVITATION_CONFLICT");
      }
      return;
    }
    try {
      await this.db.tenantAdminInvitation.create({ data: {
        id: input.id, organizationId: input.organizationId, tenantInstanceId: input.tenantId,
        email, displayName: input.displayName, roleKey: input.roleKey,
        status: "prepared", invitedByUserId: input.invitedByUserId,
      } });
    } catch {
      const raced = await this.db.tenantAdminInvitation.findUnique({
        where: { tenantInstanceId_email: { tenantInstanceId: input.tenantId, email } },
      });
      if (raced && raced.organizationId === input.organizationId && raced.roleKey === input.roleKey) return;
      throw new Error("PROVISIONING_ADMIN_INVITATION_CREATE_FAILED");
    }
  }
}
