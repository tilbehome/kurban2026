import type { SeasonStatus } from "./tenant-domain";
import { AuthorizationError } from "./authorization-domain";
import type { MasterDataAuthorizationPort } from "./authorization-service";
import {
  assertPermission,
  assertWritableSeason,
  commandMeta,
  money,
  normalizeEarTag,
  normalizePersonName,
  normalizePhoneNumber,
  normalizeSearchText,
  positiveMoney,
  validateSeasonTransition,
  weight,
  type AnimalHealthEventInput,
  type AnimalInput,
  type AnimalWeightInput,
  type AnimalPaddockAssignmentInput,
  type BusinessProfileInput,
  type CustomerInput,
  type CustomerPatchInput,
  type CustomerSearchInput,
  type ExpenseDocumentInput,
  type LocationInput,
  type PurchaseInvoiceInput,
  type PaddockInput,
  type QurbanAssignmentInput,
  type SeasonInput,
  type SupplierInput,
  type SupplierPaymentInput,
  type TenantMasterDataRepository,
  type TenantMasterDataPermission,
  TenantMasterDataError,
  type TenantUseCaseContext,
} from "./master-data-domain";

export class TenantMasterDataService {
  constructor(private readonly repository: TenantMasterDataRepository, private readonly authorization?: MasterDataAuthorizationPort) {}

  async listSeasons(context: TenantUseCaseContext) {
    await this.authorize(context, "kurban.season.read.organization");
    return this.repository.listSeasons();
  }

  async listSuppliers(context: TenantUseCaseContext, seasonId?: string) {
    await this.authorize(context, "kurban.supplier.read.organization", { operationalPeriodId: seasonId });
    return this.repository.listSuppliers(seasonId);
  }

  async listAnimals(context: TenantUseCaseContext, seasonId: string) {
    await this.authorize(context, "kurban.animal.read.organization", { operationalPeriodId: seasonId });
    return this.repository.listAnimals(seasonId);
  }

  async getAnimal(context: TenantUseCaseContext, id: string) {
    await this.authorize(context, "kurban.animal.read.organization", { assignedRecord: { type: "animal", id } });
    return this.repository.getAnimal(id);
  }

  async listPaddocks(context: TenantUseCaseContext, seasonId: string) {
    await this.authorize(context, "kurban.animal.read.organization", { operationalPeriodId: seasonId });
    return this.repository.listPaddocks(seasonId);
  }

  async upsertBusinessProfile(context: TenantUseCaseContext, input: BusinessProfileInput) {
    await this.authorize(context, "kurban.business.manage.organization");
    return this.repository.upsertBusinessProfile(input, commandMeta(context));
  }

  async createLocation(context: TenantUseCaseContext, input: LocationInput & { id: string }) {
    await this.authorize(context, "kurban.business.manage.organization");
    return this.repository.createLocation({ ...input, code: input.code.trim().toLocaleUpperCase("tr-TR") }, commandMeta(context));
  }

  async upsertSetting(context: TenantUseCaseContext, input: { id: string; scope: string; key: string; value: unknown }) {
    await this.authorize(context, "kurban.business.manage.organization");
    return this.repository.upsertSetting(input, commandMeta(context));
  }

  async createSeason(context: TenantUseCaseContext, input: SeasonInput) {
    await this.authorize(context, "kurban.season.manage.organization");
    return this.repository.createSeason(input, commandMeta(context));
  }

  async transitionSeason(context: TenantUseCaseContext, input: { seasonId: string; to: SeasonStatus }) {
    await this.authorize(context, "kurban.season.manage.organization", { operationalPeriodId: input.seasonId });
    const season = await this.requiredSeason(input.seasonId);
    validateSeasonTransition(season.status, input.to);
    return this.repository.transitionSeason({ seasonId: input.seasonId, from: season.status, to: input.to }, commandMeta(context));
  }

  async previewCustomerDuplicates(input: Pick<CustomerInput, "displayName" | "phone">) {
    const normalizedName = normalizePersonName(input.displayName);
    const normalizedPhone = input.phone ? normalizePhoneNumber(input.phone) : undefined;
    return this.repository.findCustomerDuplicates({ normalizedName, normalizedPhone });
  }

  async createCustomer(context: TenantUseCaseContext, seasonId: string, input: CustomerInput) {
    await this.authorize(context, "kurban.customer.manage.organization", { operationalPeriodId: seasonId });
    await this.assertSeason(seasonId, "customer");
    const normalizedName = normalizePersonName(input.displayName);
    const normalizedPhone = input.phone ? normalizePhoneNumber(input.phone) : undefined;
    const duplicates = await this.repository.findCustomerDuplicates({ normalizedName, normalizedPhone });
    const entity = await this.repository.createCustomer(
      { ...input, displayName: input.displayName.trim(), normalizedName, normalizedPhone, seasonId },
      commandMeta(context),
    );
    return { ...entity, duplicateWarning: duplicates };
  }

  async updateCustomer(context: TenantUseCaseContext, seasonId: string, id: string, input: CustomerPatchInput) {
    await this.authorize(context, "kurban.customer.manage.organization", { operationalPeriodId: seasonId, assignedRecord: { type: "customer", id } });
    await this.assertSeason(seasonId, "customer");
    const normalizedName = input.displayName ? normalizePersonName(input.displayName) : undefined;
    const normalizedPhone = input.phone ? normalizePhoneNumber(input.phone) : input.phone;
    const duplicates = normalizedName || normalizedPhone ? await this.repository.findCustomerDuplicates({ normalizedName: normalizedName ?? "__NO_NAME_MATCH__", normalizedPhone: normalizedPhone ?? undefined, excludeId: id }) : [];
    const entity = await this.repository.updateCustomer({ ...input, id, seasonId, normalizedName, normalizedPhone }, commandMeta(context));
    return { ...entity, duplicateWarning: duplicates };
  }

  async deactivateCustomer(context: TenantUseCaseContext, seasonId: string, id: string) {
    await this.authorize(context, "kurban.customer.manage.organization", { operationalPeriodId: seasonId, assignedRecord: { type: "customer", id } });
    await this.assertSeason(seasonId, "customer");
    return this.repository.deactivateCustomer({ id, seasonId }, commandMeta(context));
  }

  async searchCustomers(context: TenantUseCaseContext, input: CustomerSearchInput) {
    await this.authorize(context, "kurban.customer.read.organization", { operationalPeriodId: input.seasonId });
    const query = input.query?.trim();
    return this.repository.searchCustomers({
      ...input,
      normalizedQuery: query ? normalizeSearchText(query) : undefined,
      normalizedPhone: query && /\d/.test(query) ? safePhone(query) : undefined,
      limit: Math.min(Math.max(input.limit ?? 50, 1), 200),
      offset: Math.max(input.offset ?? 0, 0),
    });
  }

  async getCustomerHistory(context: TenantUseCaseContext, customerId: string) {
    await this.authorize(context, "kurban.customer.read.organization", { assignedRecord: { type: "customer", id: customerId } });
    return this.repository.getCustomerHistory(customerId);
  }

  async getCustomer(context: TenantUseCaseContext, customerId: string) {
    await this.authorize(context, "kurban.customer.read.organization", { assignedRecord: { type: "customer", id: customerId } });
    return this.repository.getCustomer(customerId);
  }

  async createSupplier(context: TenantUseCaseContext, seasonId: string, input: SupplierInput) {
    await this.authorize(context, "kurban.supplier.manage.organization", { operationalPeriodId: seasonId });
    await this.assertSeason(seasonId, "supplier");
    return this.repository.createSupplier({ ...input, seasonId, normalizedName: normalizeSearchText(input.displayName) }, commandMeta(context));
  }

  async postPurchaseInvoice(context: TenantUseCaseContext, input: PurchaseInvoiceInput) {
    await this.authorize(context, "kurban.purchase.manage.organization", { operationalPeriodId: input.seasonId, amount: input.grandTotal, currency: "TRY" });
    await this.assertSeason(input.seasonId, "purchase");
    const lines = input.lines.map((line) => ({
      ...line,
      quantity: weight(line.quantity),
      unitPrice: positiveMoney(line.unitPrice),
      lineTotal: positiveMoney(line.lineTotal),
      animal: line.animal ? {
        ...line.animal,
        earTag: normalizeEarTag(line.animal.earTag),
        liveWeightKg: line.animal.liveWeightKg ? weight(line.animal.liveWeightKg) : undefined,
      } : undefined,
    }));
    return this.repository.postPurchaseInvoice({
      ...input,
      subtotal: positiveMoney(input.subtotal),
      taxTotal: money(input.taxTotal ?? "0"),
      grandTotal: positiveMoney(input.grandTotal),
      lines,
    }, commandMeta(context));
  }

  async recordSupplierPayment(context: TenantUseCaseContext, input: SupplierPaymentInput) {
    await this.authorize(context, "kurban.purchase.manage.organization", { operationalPeriodId: input.seasonId, amount: input.amount, currency: "TRY" });
    await this.assertSeason(input.seasonId, "expense");
    return this.repository.recordSupplierPayment({ ...input, amount: positiveMoney(input.amount) }, commandMeta(context));
  }

  async recordExpense(context: TenantUseCaseContext, input: ExpenseDocumentInput) {
    await this.authorize(context, "kurban.expense.manage.organization", { operationalPeriodId: input.seasonId, amount: input.amount, currency: "TRY" });
    await this.assertSeason(input.seasonId, "expense");
    return this.repository.recordExpense({ ...input, amount: positiveMoney(input.amount) }, commandMeta(context));
  }

  async createAnimal(context: TenantUseCaseContext, input: AnimalInput) {
    await this.authorize(context, "kurban.animal.manage.organization", { operationalPeriodId: input.seasonId, assignedRecord: { type: "animal", id: input.id } });
    await this.assertSeason(input.seasonId, "animal");
    return this.repository.createAnimal({
      ...input,
      earTag: normalizeEarTag(input.earTag),
      purchaseAmount: input.purchaseAmount ? positiveMoney(input.purchaseAmount) : undefined,
      liveWeightKg: input.liveWeightKg ? weight(input.liveWeightKg) : undefined,
    }, commandMeta(context));
  }

  async recordAnimalWeight(context: TenantUseCaseContext, input: AnimalWeightInput) {
    await this.authorize(context, "kurban.animal.manage.organization", { operationalPeriodId: input.seasonId, assignedRecord: { type: "animal", id: input.animalId } });
    await this.assertSeason(input.seasonId, "animal_health");
    return this.repository.recordAnimalWeight({ ...input, weightKg: weight(input.weightKg) }, commandMeta(context));
  }

  async recordAnimalHealthEvent(context: TenantUseCaseContext, input: AnimalHealthEventInput) {
    await this.authorize(context, "kurban.animal-health.manage.assigned_record", { operationalPeriodId: input.seasonId, assignedRecord: { type: "animal", id: input.animalId } });
    await this.assertSeason(input.seasonId, "animal_health");
    return this.repository.recordAnimalHealthEvent(input, commandMeta(context));
  }

  async assignQurban(context: TenantUseCaseContext, input: QurbanAssignmentInput) {
    await this.authorize(context, "kurban.qurban-queue.manage.operational_period", { operationalPeriodId: input.seasonId, assignedRecord: { type: "animal", id: input.animalId } });
    await this.assertSeason(input.seasonId, "qurban_queue");
    if (input.queueNo !== undefined && (!Number.isInteger(input.queueNo) || input.queueNo < 1)) throw new Error("QURBAN_QUEUE_INVALID");
    return this.repository.assignQurban(input, commandMeta(context));
  }

  async createPaddock(context: TenantUseCaseContext, input: PaddockInput) {
    await this.authorize(context, "kurban.paddock.manage.organization", { operationalPeriodId: input.seasonId });
    await this.assertSeason(input.seasonId, "paddock");
    const code = input.code.trim().toLocaleUpperCase("tr-TR");
    if (!/^[A-Z0-9_-]{1,24}$/.test(code)) throw new TenantMasterDataError("PADDOCK_CODE_INVALID");
    if (input.name.trim().length < 2) throw new TenantMasterDataError("PADDOCK_NAME_INVALID");
    if (input.capacity !== undefined && (!Number.isInteger(input.capacity) || input.capacity < 1)) throw new TenantMasterDataError("PADDOCK_CAPACITY_INVALID");
    return this.repository.createPaddock({ ...input, code, name: input.name.trim() }, commandMeta(context));
  }

  async assignAnimalToPaddock(context: TenantUseCaseContext, input: AnimalPaddockAssignmentInput) {
    await this.authorize(context, "kurban.paddock.manage.organization", { operationalPeriodId: input.seasonId, assignedRecord: { type: "animal", id: input.animalId } });
    await this.assertSeason(input.seasonId, "paddock");
    return this.repository.assignAnimalToPaddock(input, commandMeta(context));
  }

  private async requiredSeason(seasonId: string) {
    const season = await this.repository.getSeason(seasonId);
    if (!season) throw new Error("SEASON_NOT_FOUND");
    return season;
  }

  private async assertSeason(seasonId: string, operation: Parameters<typeof assertWritableSeason>[1]) {
    const season = await this.requiredSeason(seasonId);
    assertWritableSeason(season.status, operation);
  }

  private async authorize(context: TenantUseCaseContext, permission: TenantMasterDataPermission, facts: { operationalPeriodId?: string; amount?: string; currency?: string; assignedRecord?: { type: string; id: string; assignedToMembershipId?: string } } = {}) {
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
    assertPermission(context, permission);
  }
}

function safePhone(query: string): string | undefined {
  try { return normalizePhoneNumber(query); } catch { return undefined; }
}
