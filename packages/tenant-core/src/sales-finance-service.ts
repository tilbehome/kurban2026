import { AuthorizationError } from "./authorization-domain";
import type { MasterDataAuthorizationPort } from "./authorization-service";
import { commandMeta, type TenantUseCaseContext } from "./master-data-domain";
import {
  assertSeasonAllowsSales,
  normalizeConfirmSale,
  normalizePriceTariff,
  normalizeReceipt,
  normalizeReserveShare,
  TenantSalesFinanceError,
  type CancelSaleInput,
  type ConfirmSaleInput,
  type ExpireReservationsInput,
  type PublishPriceTariffInput,
  type RecordReceiptInput,
  type ReserveShareInput,
  type TenantSalesFinancePermission,
  type TenantSalesFinanceRepository,
  type TransferShareInput,
} from "./sales-finance-domain";

export class TenantSalesFinanceService {
  constructor(private readonly repository: TenantSalesFinanceRepository, private readonly authorization?: MasterDataAuthorizationPort) {}

  async listShareAvailability(context: TenantUseCaseContext, seasonId: string) {
    await this.authorize(context, "kurban.share.read.operational_period", { operationalPeriodId: seasonId });
    return this.repository.listShareAvailability(seasonId);
  }

  async publishPriceTariff(context: TenantUseCaseContext, input: PublishPriceTariffInput) {
    await this.authorize(context, "kurban.pricing.manage.organization", { operationalPeriodId: input.seasonId });
    await this.assertSalesSetupSeason(input.seasonId);
    return this.repository.publishPriceTariff(normalizePriceTariff(input), commandMeta(context));
  }

  async reserveShare(context: TenantUseCaseContext, input: ReserveShareInput) {
    await this.authorize(context, "kurban.share.reserve.operational_period", { operationalPeriodId: input.seasonId, assignedRecord: { type: "share", id: input.shareId } });
    await this.assertSalesSeason(input.seasonId);
    return this.repository.reserveShare(normalizeReserveShare(input), commandMeta(context));
  }

  async expireReservations(context: TenantUseCaseContext, input: ExpireReservationsInput) {
    await this.authorize(context, "kurban.share.reserve.operational_period", { operationalPeriodId: input.seasonId });
    return this.repository.expireReservations({ ...input, limit: Math.min(Math.max(input.limit ?? 100, 1), 500) }, commandMeta(context));
  }

  async confirmSale(context: TenantUseCaseContext, input: ConfirmSaleInput) {
    const normalized = normalizeConfirmSale(input);
    await this.authorize(context, "kurban.sale.confirm.operational_period", { operationalPeriodId: input.seasonId, amount: normalized.agreedPriceTotal, currency: "TRY" });
    await this.authorize(context, "kurban.finance.receipt.create.organization", { operationalPeriodId: input.seasonId, amount: normalized.downPayment.totalAmount, currency: "TRY" });
    await this.assertSalesSeason(input.seasonId);
    return this.repository.confirmSale(normalized, commandMeta(context));
  }

  async recordReceipt(context: TenantUseCaseContext, input: RecordReceiptInput) {
    const normalized = normalizeReceipt(input);
    await this.authorize(context, "kurban.finance.receipt.create.organization", { operationalPeriodId: input.seasonId, amount: normalized.totalAmount, currency: "TRY" });
    await this.assertOpenFinancialSeason(input.seasonId);
    return this.repository.recordReceipt(normalized, commandMeta(context));
  }

  async cancelSale(context: TenantUseCaseContext, input: CancelSaleInput) {
    await this.authorize(context, "kurban.sale.cancel.operational_period", { operationalPeriodId: input.seasonId, assignedRecord: { type: "sale", id: input.saleId } });
    await this.assertOpenFinancialSeason(input.seasonId);
    return this.repository.cancelSale(input, commandMeta(context));
  }

  async transferShare(context: TenantUseCaseContext, input: TransferShareInput) {
    await this.authorize(context, "kurban.sale.transfer.operational_period", { operationalPeriodId: input.seasonId, assignedRecord: { type: "share", id: input.sourceShareId } });
    await this.assertOpenFinancialSeason(input.seasonId);
    return this.repository.transferShare(input, commandMeta(context));
  }

  private async assertSalesSetupSeason(seasonId: string) {
    const season = await this.requiredSeason(seasonId);
    if (season.status !== "preparation" && season.status !== "sales") {
      throw new TenantSalesFinanceError(season.status === "archived" ? "SEASON_ARCHIVED_READ_ONLY" : "SEASON_OPERATION_NOT_ALLOWED");
    }
  }

  private async assertSalesSeason(seasonId: string) {
    const season = await this.requiredSeason(seasonId);
    assertSeasonAllowsSales(season.status);
  }

  private async assertOpenFinancialSeason(seasonId: string) {
    const season = await this.requiredSeason(seasonId);
    if (!["sales", "slaughter", "delivery", "reconciliation"].includes(season.status)) {
      throw new TenantSalesFinanceError(season.status === "archived" ? "SEASON_ARCHIVED_READ_ONLY" : "SEASON_OPERATION_NOT_ALLOWED");
    }
  }

  private async requiredSeason(seasonId: string) {
    const season = await this.repository.getSeason(seasonId);
    if (!season) throw new TenantSalesFinanceError("SEASON_NOT_FOUND");
    return season;
  }

  private async authorize(context: TenantUseCaseContext, permission: TenantSalesFinancePermission, facts: { operationalPeriodId?: string; amount?: string; currency?: string; assignedRecord?: { type: string; id: string; assignedToMembershipId?: string } } = {}) {
    if (this.authorization && context.organizationMembershipId) {
      return this.authorization.require({
        subject: { kind: context.identityKind ?? "ORGANIZATION_USER", id: context.actorIdentityId ?? context.actorUserId, organizationMembershipId: context.organizationMembershipId, sessionId: context.sessionId },
        context: {
          tenantInstanceId: context.tenantInstanceId,
          organizationId: context.organizationId,
          facilityId: context.facilityId,
          departmentId: context.departmentId,
          operationalPeriodId: facts.operationalPeriodId ?? context.operationalPeriodId,
          assignedRecord: facts.assignedRecord,
          amount: facts.amount,
          currency: facts.currency,
          occurredAt: context.occurredAt,
          trustedDevice: context.trustedDevice ?? false,
          network: context.network,
          mfaLevel: context.mfaLevel ?? 0,
          requestId: context.requestId,
        },
        lastReauthenticatedAt: context.lastReauthenticatedAt,
      }, permission);
    }
    if (context.authorizationMode === "database") throw new AuthorizationError("ORGANIZATION_MEMBERSHIP_REQUIRED");
    if (!context.permissions.includes("*") && !context.permissions.includes(permission)) throw new TenantSalesFinanceError("PERMISSION_DENIED");
  }
}
