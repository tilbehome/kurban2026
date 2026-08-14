import { randomUUID } from "node:crypto";
import type {
  AnimalHealthEventInput,
  AnimalInput,
  AnimalWeightInput,
  AnimalPaddockAssignmentInput,
  BusinessProfileInput,
  CommandMeta,
  CustomerHistoryItem,
  CustomerInput,
  CustomerPatchInput,
  CustomerListItem,
  CustomerSearchInput,
  DuplicateCustomerCandidate,
  ExpenseDocumentInput,
  LocationInput,
  PurchaseInvoiceInput,
  PaddockInput,
  QurbanAssignmentInput,
  SeasonInput,
  SupplierInput,
  SupplierPaymentInput,
  TenantMasterDataRepository,
} from "@tilbecore/tenant-core";
import { TenantMasterDataError, type SeasonStatus } from "@tilbecore/tenant-core";
import type { Prisma, PrismaClient } from "../../generated/client";

type Tx = Prisma.TransactionClient;
type CommandResult = { id: string; animalIds?: string[] };

export class PrismaTenantMasterDataRepository implements TenantMasterDataRepository {
  constructor(private readonly db: PrismaClient) {}

  async getSeason(id: string) {
    const season = await this.db.season.findUnique({ where: { id }, select: { id: true, status: true } });
    return season ? { id: season.id, status: season.status as SeasonStatus } : null;
  }

  async listSeasons() {
    const rows = await this.db.season.findMany({ include: { location: true }, orderBy: [{ year: "desc" }, { createdAt: "desc" }] });
    return rows.map((row) => ({ id: row.id, name: row.name, year: row.year ?? undefined, status: row.status as SeasonStatus, locationName: row.location?.name, startsAt: row.startsAt?.toISOString(), endsAt: row.endsAt?.toISOString() }));
  }

  async listSuppliers(seasonId?: string) {
    const rows = await this.db.supplier.findMany({
      where: { active: true },
      include: { accounts: seasonId ? { where: { seasonId }, take: 1 } : { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { normalizedName: "asc" },
    });
    return rows.map((row) => ({ id: row.id, displayName: row.displayName, phone: row.phone ?? undefined, taxNumber: row.taxNumber ?? undefined, balance: row.accounts[0]?.balance.toString() }));
  }

  async listAnimals(seasonId: string) {
    const rows = await this.db.animal.findMany({
      where: { seasonId },
      include: { supplier: true, qurbanAssignments: { where: { active: true }, take: 1 } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => ({ id: row.id, seasonId: row.seasonId ?? row.qurbanAssignments[0]?.seasonId ?? seasonId, earTag: row.earTag, status: row.status, supplierName: row.supplier?.displayName, purchaseAmount: row.purchaseAmount?.toString(), liveWeightKg: row.liveWeightKg?.toString(), qurbanNo: row.qurbanAssignments[0]?.qurbanNo ?? undefined, queueNo: row.qurbanAssignments[0]?.queueNo ?? undefined }));
  }

  async listPaddocks(seasonId: string) {
    const rows = await this.db.paddock.findMany({
      where: { seasonId },
      include: { _count: { select: { assignments: { where: { active: true } } } } },
      orderBy: [{ active: "desc" }, { code: "asc" }],
    });
    return rows.map((row) => ({ id: row.id, seasonId: row.seasonId, code: row.code, name: row.name, capacity: row.capacity ?? undefined, active: row.active, occupied: row._count.assignments }));
  }

  async getAnimal(id: string) {
    const row = await this.db.animal.findUnique({
      where: { id },
      include: {
        supplier: true,
        weights: { orderBy: { measuredAt: "desc" } },
        healthEvents: { orderBy: { occurredAt: "desc" } },
        qurbanAssignments: { orderBy: { assignedAt: "desc" } },
      },
    });
    if (!row) return null;
    const active = row.qurbanAssignments.find((item) => item.active);
    return {
      id: row.id, seasonId: row.seasonId ?? active?.seasonId ?? "", earTag: row.earTag, status: row.status,
      supplierName: row.supplier?.displayName, purchaseAmount: row.purchaseAmount?.toString(),
      liveWeightKg: row.liveWeightKg?.toString(), qurbanNo: active?.qurbanNo ?? undefined,
      queueNo: active?.queueNo ?? undefined, qurbanEligibility: row.qurbanEligibility, notes: row.notes ?? undefined,
      weights: row.weights.map((item) => ({ id: item.id, kind: item.kind, weightKg: item.weightKg.toString(), measuredAt: item.measuredAt.toISOString(), note: item.note ?? undefined })),
      healthEvents: row.healthEvents.map((item) => ({ id: item.id, eventType: item.eventType, status: item.status, occurredAt: item.occurredAt.toISOString(), notes: item.notes ?? undefined })),
      assignments: row.qurbanAssignments.map((item) => ({ id: item.id, qurbanNo: item.qurbanNo ?? undefined, queueNo: item.queueNo ?? undefined, active: item.active, assignedAt: item.assignedAt.toISOString(), endedAt: item.endedAt?.toISOString(), reason: item.reason ?? undefined })),
    };
  }

  upsertBusinessProfile(input: BusinessProfileInput, meta: CommandMeta) {
    return this.command("business.profile.upsert", meta, async (tx) => {
      const row = await tx.businessProfile.upsert({
        where: { id: "business" },
        create: { id: "business", ...input },
        update: input,
        select: { id: true },
      });
      await evidence(tx, meta, "business.profile.updated", "BusinessProfile", row.id, { ...input });
      return row;
    });
  }

  createLocation(input: LocationInput & { id: string }, meta: CommandMeta) {
    return this.command("business.location.create", meta, async (tx) => {
      const row = await tx.location.create({ data: input, select: { id: true } });
      await evidence(tx, meta, "location.created", "Location", row.id, { code: input.code });
      return row;
    });
  }

  upsertSetting(input: { id: string; scope: string; key: string; value: unknown }, meta: CommandMeta) {
    return this.command("business.setting.upsert", meta, async (tx) => {
      const row = await tx.setting.upsert({
        where: { scope_key: { scope: input.scope, key: input.key } },
        create: { ...input, value: input.value as Prisma.InputJsonValue, updatedById: meta.actorUserId },
        update: { value: input.value as Prisma.InputJsonValue, version: { increment: 1 }, updatedById: meta.actorUserId },
        select: { id: true, version: true },
      });
      await evidence(tx, meta, "setting.updated", "Setting", row.id, { scope: input.scope, key: input.key, version: row.version });
      return row;
    });
  }

  createSeason(input: SeasonInput, meta: CommandMeta) {
    return this.command("season.create", meta, async (tx) => {
      const row = await tx.season.create({
        data: {
          id: input.id,
          locationId: input.locationId,
          name: input.name.trim(),
          year: input.year,
          status: "preparation",
          startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
          endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
        },
        select: { id: true, status: true },
      });
      await evidence(tx, meta, "season.created", "Season", row.id, { status: row.status });
      return { id: row.id, status: row.status as SeasonStatus };
    });
  }

  transitionSeason(input: { seasonId: string; from: SeasonStatus; to: SeasonStatus }, meta: CommandMeta) {
    return this.command("season.transition", meta, async (tx) => {
      await lockSeason(tx, input.seasonId, [input.from]);
      if (input.to === "archived") await assertSeasonArchiveReady(tx, input.seasonId, meta);
      const changed = await tx.season.updateMany({
        where: { id: input.seasonId, status: input.from },
        data: { status: input.to, archivedAt: input.to === "archived" ? meta.occurredAt : null },
      });
      if (changed.count !== 1) throw new TenantMasterDataError("SEASON_CONCURRENT_TRANSITION");
      await evidence(tx, meta, "season.transitioned", "Season", input.seasonId, { from: input.from, to: input.to });
      return { id: input.seasonId, status: input.to };
    });
  }

  async findCustomerDuplicates(input: { normalizedName: string; normalizedPhone?: string; excludeId?: string }) {
    const rows = await this.db.customer.findMany({
      where: {
        active: true,
        id: input.excludeId ? { not: input.excludeId } : undefined,
        OR: [
          { normalizedName: input.normalizedName },
          ...(input.normalizedPhone ? [{ phones: { some: { normalizedPhone: input.normalizedPhone } } }] : []),
        ],
      },
      include: { phones: { where: { isPrimary: true }, take: 1 } },
      take: 20,
    });
    return rows.map((row): DuplicateCustomerCandidate => ({
      id: row.id,
      displayName: row.displayName,
      phone: row.phones[0]?.phone ?? row.phone ?? undefined,
      reason: input.normalizedPhone && (row.phones[0]?.normalizedPhone === input.normalizedPhone || row.normalizedPhone === input.normalizedPhone)
        ? "same_phone" : "same_name",
    }));
  }

  createCustomer(
    input: CustomerInput & { normalizedName: string; normalizedPhone?: string; seasonId: string },
    meta: CommandMeta,
  ) {
    return this.command("customer.create", meta, async (tx) => {
      await lockSeason(tx, input.seasonId, ["preparation", "sales", "slaughter", "delivery", "reconciliation"]);
      const row = await tx.customer.create({
        data: {
          id: input.id,
          displayName: input.displayName,
          normalizedName: input.normalizedName,
          phone: input.phone,
          normalizedPhone: input.normalizedPhone,
          identityNumber: input.identityNumber,
          notes: input.notes,
          kvkkConsentAt: input.kvkkConsentAt ? new Date(input.kvkkConsentAt) : undefined,
          communicationConsentAt: input.communicationConsentAt ? new Date(input.communicationConsentAt) : undefined,
          phones: input.phone && input.normalizedPhone ? { create: { id: `phone_${input.id}`, phone: input.phone, normalizedPhone: input.normalizedPhone, isPrimary: true } } : undefined,
          addresses: input.address ? { create: { id: `address_${input.id}`, ...input.address, isPrimary: true } } : undefined,
          seasonAccounts: { create: { id: `account_${input.id}_${input.seasonId}`, seasonId: input.seasonId } },
        },
        select: { id: true },
      });
      await evidence(tx, meta, "customer.created", "Customer", row.id, { seasonId: input.seasonId });
      return row;
    });
  }

  updateCustomer(input: CustomerPatchInput & { id: string; seasonId: string; normalizedName?: string; normalizedPhone?: string | null }, meta: CommandMeta) {
    return this.command("customer.update", meta, async (tx) => {
      await lockSeason(tx, input.seasonId, ["preparation", "sales", "slaughter", "delivery", "reconciliation"]);
      const exists = await tx.customer.findUnique({ where: { id: input.id }, select: { id: true } });
      if (!exists) throw new TenantMasterDataError("CUSTOMER_NOT_FOUND");
      await tx.customer.update({ where: { id: input.id }, data: {
        displayName: input.displayName?.trim(), normalizedName: input.normalizedName,
        phone: input.phone, normalizedPhone: input.normalizedPhone,
        identityNumber: input.identityNumber, notes: input.notes,
      } });
      if (input.phone !== undefined) {
        await tx.customerPhone.updateMany({ where: { customerId: input.id, isPrimary: true }, data: { isPrimary: false } });
        if (input.phone && input.normalizedPhone) await tx.customerPhone.create({ data: { id: `phone_${input.id}_${randomUUID()}`, customerId: input.id, phone: input.phone, normalizedPhone: input.normalizedPhone, isPrimary: true } });
      }
      if (input.address !== undefined) {
        await tx.customerAddress.updateMany({ where: { customerId: input.id, isPrimary: true }, data: { isPrimary: false } });
        if (input.address) await tx.customerAddress.create({ data: { id: `address_${input.id}_${randomUUID()}`, customerId: input.id, addressLine: input.address, label: "Ana adres", isPrimary: true } });
      }
      await evidence(tx, meta, "customer.updated", "Customer", input.id, { seasonId: input.seasonId });
      return { id: input.id };
    });
  }

  deactivateCustomer(input: { id: string; seasonId: string }, meta: CommandMeta) {
    return this.command("customer.deactivate", meta, async (tx) => {
      await lockSeason(tx, input.seasonId, ["preparation", "sales", "slaughter", "delivery", "reconciliation"]);
      const account = await tx.customerSeasonAccount.findUnique({ where: { customerId_seasonId: { customerId: input.id, seasonId: input.seasonId } } });
      if (account && toUnits(account.balance.toString()) !== BigInt(0)) throw new TenantMasterDataError("CUSTOMER_WITH_BALANCE_CANNOT_DEACTIVATE");
      const changed = await tx.customer.updateMany({ where: { id: input.id, active: true }, data: { active: false } });
      if (changed.count !== 1) throw new TenantMasterDataError("CUSTOMER_NOT_FOUND");
      await evidence(tx, meta, "customer.deactivated", "Customer", input.id, { seasonId: input.seasonId });
      return { id: input.id };
    });
  }

  async searchCustomers(input: CustomerSearchInput & { normalizedQuery?: string; normalizedPhone?: string }) {
    const where: Prisma.CustomerWhereInput = {
      active: true,
      OR: input.normalizedQuery ? [
        { normalizedName: { contains: input.normalizedQuery } },
        ...(input.normalizedPhone ? [{ phones: { some: { normalizedPhone: { contains: input.normalizedPhone } } } }] : []),
      ] : undefined,
      seasonAccounts: input.seasonId ? { some: { seasonId: input.seasonId } } : undefined,
    };
    const [rows, total] = await Promise.all([
      this.db.customer.findMany({
        where,
        orderBy: [{ normalizedName: "asc" }, { createdAt: "asc" }],
        take: input.limit ?? 50,
        skip: input.offset ?? 0,
        include: {
          phones: { where: { isPrimary: true }, take: 1 },
          seasonAccounts: input.seasonId ? { where: { seasonId: input.seasonId }, take: 1 } : { orderBy: { createdAt: "desc" }, take: 1 },
          _count: { select: { shares: input.seasonId ? { where: { shareCard: { seasonId: input.seasonId } } } : true } },
        },
      }),
      this.db.customer.count({ where }),
    ]);
    const items: CustomerListItem[] = rows.map((row) => ({
      id: row.id,
      displayName: row.displayName,
      phone: row.phones[0]?.phone ?? row.phone ?? undefined,
      active: row.active,
      createdAt: row.createdAt.toISOString(),
      shareCount: row._count.shares,
      seasonAccount: row.seasonAccounts[0] ? {
        seasonId: row.seasonAccounts[0].seasonId,
        debitTotal: row.seasonAccounts[0].debitTotal.toString(),
        creditTotal: row.seasonAccounts[0].creditTotal.toString(),
        balance: row.seasonAccounts[0].balance.toString(),
      } : undefined,
    }));
    return { items, total };
  }

  async getCustomerHistory(customerId: string): Promise<CustomerHistoryItem[]> {
    const rows = await this.db.customerSeasonAccount.findMany({
      where: { customerId }, include: { season: true }, orderBy: { season: { startsAt: "desc" } },
    });
    return rows.map((row) => ({
      seasonId: row.seasonId,
      seasonName: row.season.name,
      seasonStatus: row.season.status as SeasonStatus,
      debitTotal: row.debitTotal.toString(),
      creditTotal: row.creditTotal.toString(),
      balance: row.balance.toString(),
    }));
  }

  async getCustomer(customerId: string) {
    const row = await this.db.customer.findUnique({
      where: { id: customerId },
      include: { phones: { orderBy: { isPrimary: "desc" } }, addresses: { orderBy: { isPrimary: "desc" } }, seasonAccounts: { include: { season: true }, orderBy: { season: { startsAt: "desc" } } } },
    });
    if (!row) return null;
    return {
      id: row.id, displayName: row.displayName, identityNumber: row.identityNumber ?? undefined,
      notes: row.notes ?? undefined, active: row.active, createdAt: row.createdAt.toISOString(),
      phones: row.phones.map((item) => ({ id: item.id, label: item.label ?? undefined, phone: item.phone, isPrimary: item.isPrimary })),
      addresses: row.addresses.map((item) => ({ id: item.id, label: item.label ?? undefined, addressLine: item.addressLine, district: item.district ?? undefined, city: item.city ?? undefined, postalCode: item.postalCode ?? undefined, isPrimary: item.isPrimary })),
      history: row.seasonAccounts.map((item) => ({ seasonId: item.seasonId, seasonName: item.season.name, seasonStatus: item.season.status as SeasonStatus, debitTotal: item.debitTotal.toString(), creditTotal: item.creditTotal.toString(), balance: item.balance.toString() })),
    };
  }

  createSupplier(input: SupplierInput & { normalizedName: string; seasonId: string }, meta: CommandMeta) {
    return this.command("supplier.create", meta, async (tx) => {
      await lockSeason(tx, input.seasonId, ["preparation", "sales"]);
      const row = await tx.supplier.create({ data: { id: input.id, displayName: input.displayName, normalizedName: input.normalizedName, phone: input.phone, taxNumber: input.taxNumber }, select: { id: true } });
      await tx.supplierAccount.create({ data: { id: `supplier_account_${row.id}_${input.seasonId}`, supplierId: row.id, seasonId: input.seasonId } });
      await evidence(tx, meta, "supplier.created", "Supplier", row.id, { seasonId: input.seasonId });
      return row;
    });
  }

  postPurchaseInvoice(input: PurchaseInvoiceInput, meta: CommandMeta) {
    assertInvoiceTotals(input);
    return this.command("purchase.invoice.post", meta, async (tx) => {
      await lockSeason(tx, input.seasonId, ["preparation", "sales"]);
      const animalIds: string[] = [];
      const invoice = await tx.purchaseInvoice.create({
        data: {
          id: input.id, supplierId: input.supplierId, seasonId: input.seasonId,
          organizationId: meta.organizationId ?? "tenant-local",
          uuid: input.id,
          invoiceNo: input.invoiceNo.trim(), invoiceDate: new Date(input.invoiceDate),
          accountingStatus: "POSTED", paymentStatus: "UNPAID", electronicStatus: "NOT_APPLICABLE",
          partySnapshot: { supplierId: input.supplierId }, requestId: meta.requestId,
          createdByUserId: meta.actorUserId, postedByUserId: meta.actorUserId, postedAt: meta.occurredAt,
          subtotal: input.subtotal, taxTotal: input.taxTotal ?? "0", grandTotal: input.grandTotal,
          idempotencyKey: meta.idempotencyKey,
        },
        select: { id: true },
      });
      for (const [index, line] of input.lines.entries()) {
        let animalId: string | undefined;
        if (line.animal) {
          animalId = line.animal.id;
          animalIds.push(animalId);
          await createAnimalAggregate(tx, {
            ...line.animal,
            seasonId: input.seasonId,
            supplierId: input.supplierId,
            purchaseAmount: line.lineTotal,
          }, meta);
        }
        await tx.purchaseInvoiceLine.create({
          data: {
            id: line.id, purchaseInvoiceId: invoice.id, lineNo: index + 1,
            description: line.description, animalId, quantity: line.quantity,
            unitId: "uom_system_adet", unitCodeSnapshot: "ADET", unitNameSnapshot: "Adet", unitSymbolSnapshot: "ad",
            unitPrice: line.unitPrice, lineTotal: line.lineTotal,
          },
        });
      }
      await tx.supplierAccount.upsert({
        where: { supplierId_seasonId: { supplierId: input.supplierId, seasonId: input.seasonId } },
        create: { id: `supplier_account_${input.supplierId}_${input.seasonId}`, supplierId: input.supplierId, seasonId: input.seasonId, debitTotal: input.grandTotal, balance: input.grandTotal },
        update: { debitTotal: { increment: input.grandTotal }, balance: { increment: input.grandTotal } },
      });
      const inventory = await tx.financialAccount.upsert({ where: { code: "INVENTORY" }, create: { id: "financial_account_inventory", code: "INVENTORY", name: "Stok ve Hayvan Maliyeti", type: "asset", normalSide: "debit", currency: "TRY" }, update: {} });
      const inputTax = await tx.financialAccount.upsert({ where: { code: "INPUT_TAX" }, create: { id: "financial_account_input_tax", code: "INPUT_TAX", name: "İndirilecek Vergi", type: "asset", normalSide: "debit", currency: "TRY" }, update: {} });
      const payable = await tx.financialAccount.upsert({ where: { code: "ACCOUNTS_PAYABLE" }, create: { id: "financial_account_accounts_payable", code: "ACCOUNTS_PAYABLE", name: "Tedarikçi Borçları", type: "liability", normalSide: "credit", currency: "TRY" }, update: {} });
      const journalEntryId = `journal_invoice_${invoice.id}`;
      await tx.journalEntry.create({ data: {
        id: journalEntryId, seasonId: input.seasonId, sourceType: "invoice", sourceId: invoice.id,
        currency: "TRY", memo: "PURCHASE_INVOICE_POSTED", idempotencyKey: meta.idempotencyKey,
        occurredAt: new Date(input.invoiceDate), postedAt: meta.occurredAt,
        lines: { create: [
          { id: `${journalEntryId}_cost`, accountId: inventory.id, side: "debit", amount: input.subtotal, currency: "TRY", memo: "PURCHASE_COST" },
          ...(toUnits(input.taxTotal ?? "0") > BigInt(0) ? [{ id: `${journalEntryId}_tax`, accountId: inputTax.id, side: "debit", amount: input.taxTotal ?? "0", currency: "TRY", memo: "INVOICE_INPUT_TAX" }] : []),
          { id: `${journalEntryId}_credit`, accountId: payable.id, side: "credit", amount: input.grandTotal, currency: "TRY", memo: "SUPPLIER_PAYABLE" },
        ] },
      } });
      await tx.purchaseInvoice.update({ where: { id: invoice.id }, data: { journalEntryId } });
      await evidence(tx, meta, "purchase.invoice.posted", "PurchaseInvoice", invoice.id, { supplierId: input.supplierId, seasonId: input.seasonId, animalCount: animalIds.length });
      return { id: invoice.id, animalIds };
    });
  }

  recordSupplierPayment(input: SupplierPaymentInput, meta: CommandMeta) {
    return this.command("supplier.payment.record", meta, async (tx) => {
      await lockSeason(tx, input.seasonId, ["preparation", "sales", "slaughter", "delivery", "reconciliation"]);
      const row = await tx.supplierPayment.create({
        data: { ...input, occurredAt: new Date(input.occurredAt), idempotencyKey: meta.idempotencyKey }, select: { id: true },
      });
      const account = await tx.supplierAccount.findUnique({ where: { supplierId_seasonId: { supplierId: input.supplierId, seasonId: input.seasonId } } });
      if (!account) throw new TenantMasterDataError("SUPPLIER_ACCOUNT_NOT_FOUND");
      if (toUnits(account.balance.toString()) < toUnits(input.amount)) throw new TenantMasterDataError("SUPPLIER_PAYMENT_EXCEEDS_BALANCE");
      await tx.supplierAccount.update({ where: { id: account.id }, data: { creditTotal: { increment: input.amount }, balance: { decrement: input.amount } } });
      const payable = await financialAccount(tx, "ACCOUNTS_PAYABLE", "Tedarikçi Borçları", "liability", "credit");
      const settlement = await settlementAccount(tx, input.method);
      const journalEntryId = `journal_supplier_payment_${row.id}`;
      await tx.journalEntry.create({ data: {
        id: journalEntryId, seasonId: input.seasonId, sourceType: "supplier_payment", sourceId: row.id,
        currency: "TRY", memo: "SUPPLIER_PAYMENT_POSTED", idempotencyKey: `${meta.idempotencyKey}:journal`, occurredAt: new Date(input.occurredAt), postedAt: meta.occurredAt,
        lines: { create: [
          { id: `${journalEntryId}_payable`, accountId: payable.id, side: "debit", amount: input.amount, currency: "TRY", memo: "SUPPLIER_PAYABLE_SETTLEMENT" },
          { id: `${journalEntryId}_settlement`, accountId: settlement.id, side: "credit", amount: input.amount, currency: "TRY", memo: "SUPPLIER_PAYMENT_OUTFLOW" },
        ] },
      } });
      await tx.supplierPayment.update({ where: { id: row.id }, data: { journalEntryId } });
      await evidence(tx, meta, "supplier.payment.recorded", "SupplierPayment", row.id, { supplierId: input.supplierId, seasonId: input.seasonId });
      return row;
    });
  }

  recordExpense(input: ExpenseDocumentInput, meta: CommandMeta) {
    return this.command("expense.document.record", meta, async (tx) => {
      await lockSeason(tx, input.seasonId, ["preparation", "sales", "slaughter", "delivery", "reconciliation"]);
      const row = await tx.expenseDocument.create({
        data: { ...input, occurredAt: new Date(input.occurredAt), idempotencyKey: meta.idempotencyKey }, select: { id: true },
      });
      const expense = await financialAccount(tx, "OPERATING_EXPENSE", "Faaliyet Giderleri", "expense", "debit");
      const payable = await financialAccount(tx, "EXPENSE_PAYABLE", "Gider Borçları", "liability", "credit");
      const journalEntryId = `journal_expense_${row.id}`;
      await tx.journalEntry.create({ data: {
        id: journalEntryId, seasonId: input.seasonId, sourceType: "expense", sourceId: row.id,
        currency: "TRY", memo: "EXPENSE_DOCUMENT_POSTED", idempotencyKey: `${meta.idempotencyKey}:journal`, occurredAt: new Date(input.occurredAt), postedAt: meta.occurredAt,
        lines: { create: [
          { id: `${journalEntryId}_expense`, accountId: expense.id, side: "debit", amount: input.amount, currency: "TRY", memo: input.category },
          { id: `${journalEntryId}_payable`, accountId: payable.id, side: "credit", amount: input.amount, currency: "TRY", memo: "EXPENSE_PAYABLE" },
        ] },
      } });
      await tx.expenseDocument.update({ where: { id: row.id }, data: { journalEntryId } });
      await evidence(tx, meta, "expense.document.recorded", "ExpenseDocument", row.id, { seasonId: input.seasonId, sourceType: input.sourceType, sourceRef: input.sourceRef });
      return row;
    });
  }

  createAnimal(input: AnimalInput, meta: CommandMeta) {
    return this.command("animal.create", meta, async (tx) => {
      await lockSeason(tx, input.seasonId, ["preparation", "sales"]);
      await createAnimalAggregate(tx, input, meta);
      await evidence(tx, meta, "animal.created", "Animal", input.id, { seasonId: input.seasonId, earTag: input.earTag });
      return { id: input.id };
    });
  }

  recordAnimalWeight(input: AnimalWeightInput, meta: CommandMeta) {
    return this.command("animal.weight.record", meta, async (tx) => {
      await lockSeason(tx, input.seasonId, ["preparation", "sales", "slaughter"]);
      const animal = await tx.animal.findUnique({ where: { id: input.animalId }, select: { seasonId: true } });
      if (!animal || animal.seasonId !== input.seasonId) throw new TenantMasterDataError("ANIMAL_SEASON_MISMATCH");
      const row = await tx.animalWeight.create({ data: { id: input.id, animalId: input.animalId, kind: input.kind, weightKg: input.weightKg, measuredAt: new Date(input.measuredAt), recordedByUserId: meta.actorUserId, note: input.note }, select: { id: true } });
      await tx.animal.update({ where: { id: input.animalId }, data: input.kind === "carcass" ? { carcassWeightKg: input.weightKg } : { liveWeightKg: input.weightKg } });
      await evidence(tx, meta, "animal.weight.recorded", "AnimalWeight", row.id, { animalId: input.animalId, kind: input.kind });
      return row;
    });
  }

  recordAnimalHealthEvent(input: AnimalHealthEventInput, meta: CommandMeta) {
    return this.command("animal.health.record", meta, async (tx) => {
      await lockSeason(tx, input.seasonId, ["preparation", "sales", "slaughter"]);
      const animal = await tx.animal.findUnique({ where: { id: input.animalId }, select: { seasonId: true } });
      if (!animal || animal.seasonId !== input.seasonId) throw new TenantMasterDataError("ANIMAL_SEASON_MISMATCH");
      const row = await tx.animalHealthEvent.create({ data: { id: input.id, animalId: input.animalId, eventType: input.eventType, status: input.status, notes: input.notes, occurredAt: new Date(input.occurredAt), recordedByUserId: meta.actorUserId }, select: { id: true } });
      await evidence(tx, meta, "animal.health.recorded", "AnimalHealthEvent", row.id, { animalId: input.animalId, eventType: input.eventType, status: input.status });
      return row;
    });
  }

  assignQurban(input: QurbanAssignmentInput, meta: CommandMeta) {
    return this.command("animal.qurban.assign", meta, async (tx) => {
      await lockSeason(tx, input.seasonId, ["preparation", "sales", "slaughter"]);
      const animal = await tx.animal.findUnique({ where: { id: input.animalId }, select: { seasonId: true } });
      if (!animal || animal.seasonId !== input.seasonId) throw new TenantMasterDataError("ANIMAL_SEASON_MISMATCH");
      const previous = await tx.qurbanAssignment.findFirst({ where: { animalId: input.animalId, active: true } });
      if (previous) await tx.qurbanAssignment.update({ where: { id: previous.id }, data: { active: false, endedAt: meta.occurredAt } });
      const row = await tx.qurbanAssignment.create({ data: { ...input, assignedByUserId: meta.actorUserId, assignedAt: meta.occurredAt, previousId: previous?.id }, select: { id: true } });
      await evidence(tx, meta, "animal.qurban.assigned", "QurbanAssignment", row.id, { animalId: input.animalId, previousId: previous?.id ?? null, queueNo: input.queueNo ?? null });
      return row;
    });
  }

  createPaddock(input: PaddockInput, meta: CommandMeta) {
    return this.command("paddock.create", meta, async (tx) => {
      await lockSeason(tx, input.seasonId, ["preparation", "sales", "slaughter"]);
      const row = await tx.paddock.create({ data: input, select: { id: true } });
      await evidence(tx, meta, "paddock.created", "Paddock", row.id, { seasonId: input.seasonId, code: input.code });
      return row;
    });
  }

  assignAnimalToPaddock(input: AnimalPaddockAssignmentInput, meta: CommandMeta) {
    return this.command("paddock.animal.assign", meta, async (tx) => {
      await lockSeason(tx, input.seasonId, ["preparation", "sales", "slaughter"]);
      const animal = await tx.animal.findUnique({ where: { id: input.animalId }, select: { seasonId: true } });
      const paddock = await tx.paddock.findUnique({ where: { id: input.paddockId }, select: { seasonId: true, active: true, capacity: true } });
      if (!animal || animal.seasonId !== input.seasonId) throw new TenantMasterDataError("ANIMAL_SEASON_MISMATCH");
      if (!paddock || paddock.seasonId !== input.seasonId || !paddock.active) throw new TenantMasterDataError("PADDOCK_SCOPE_INVALID");
      await tx.$queryRawUnsafe('SELECT "id" FROM "Paddock" WHERE "id" = $1 FOR UPDATE', input.paddockId);
      if (paddock.capacity !== null) {
        const occupied = await tx.animalPaddockAssignment.count({ where: { paddockId: input.paddockId, active: true, animalId: { not: input.animalId } } });
        if (occupied >= paddock.capacity) throw new TenantMasterDataError("PADDOCK_CAPACITY_EXCEEDED");
      }
      await tx.animalPaddockAssignment.updateMany({ where: { animalId: input.animalId, active: true }, data: { active: false, endedAt: meta.occurredAt } });
      const row = await tx.animalPaddockAssignment.create({ data: { ...input, assignedAt: meta.occurredAt, assignedByUserId: meta.actorUserId }, select: { id: true } });
      await evidence(tx, meta, "paddock.animal.assigned", "AnimalPaddockAssignment", row.id, { seasonId: input.seasonId, animalId: input.animalId, paddockId: input.paddockId });
      return row;
    });
  }

  private async command<TResult extends CommandResult>(scope: string, meta: CommandMeta, handler: (tx: Tx) => Promise<TResult>): Promise<TResult> {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.tenantIdempotencyRecord.findUnique({ where: { key: meta.idempotencyKey } });
      if (existing) {
        if (existing.scope !== scope || existing.requestHash !== meta.requestHash) throw new TenantMasterDataError("IDEMPOTENCY_KEY_REUSED");
        if (existing.status !== "completed" || !existing.resultId) throw new TenantMasterDataError("IDEMPOTENCY_REQUEST_IN_PROGRESS");
        if (existing.resultPayload && typeof existing.resultPayload === "object" && !Array.isArray(existing.resultPayload)) return existing.resultPayload as unknown as TResult;
        return { id: existing.resultId, animalIds: scope === "purchase.invoice.post" ? await invoiceAnimalIds(tx, existing.resultId) : undefined } as TResult;
      }
      await tx.tenantIdempotencyRecord.create({ data: { key: meta.idempotencyKey, scope, actorUserId: meta.actorUserId, requestId: meta.requestId, requestHash: meta.requestHash } });
      const result = await handler(tx);
      await tx.tenantIdempotencyRecord.update({ where: { key: meta.idempotencyKey }, data: { status: "completed", resultType: scope, resultId: result.id, resultPayload: JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue, completedAt: meta.occurredAt } });
      return result;
    }, { isolationLevel: "Serializable" });
  }
}

async function lockSeason(tx: Tx, seasonId: string, allowed: readonly SeasonStatus[]): Promise<void> {
  const rows = await tx.$queryRawUnsafe<Array<{ status: string }>>('SELECT "status" FROM "Season" WHERE "id" = $1 FOR UPDATE', seasonId);
  if (!rows[0]) throw new TenantMasterDataError("SEASON_NOT_FOUND");
  if (!allowed.includes(rows[0].status as SeasonStatus)) throw new TenantMasterDataError(rows[0].status === "archived" ? "SEASON_ARCHIVED_READ_ONLY" : "SEASON_OPERATION_NOT_ALLOWED");
}

async function assertSeasonArchiveReady(tx: Tx, seasonId: string, meta: CommandMeta): Promise<void> {
  const [finance, openExceptions, undelivered, pendingAdjustments] = await Promise.all([
    tx.$queryRaw<Array<{ unbalanced: bigint; difference: string }>>`
      SELECT COUNT(*) FILTER (WHERE totals.debit <> totals.credit)::bigint AS "unbalanced",
        COALESCE(SUM(totals.debit - totals.credit), 0)::text AS "difference"
      FROM (
        SELECT entry."id", COALESCE(SUM(line."amount") FILTER (WHERE line."side" = 'debit'), 0) AS debit,
          COALESCE(SUM(line."amount") FILTER (WHERE line."side" = 'credit'), 0) AS credit
        FROM "JournalEntry" AS entry JOIN "JournalLine" AS line ON line."journalEntryId" = entry."id"
        WHERE entry."seasonId" = ${seasonId} GROUP BY entry."id"
      ) AS totals`,
    tx.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::bigint AS "count" FROM "OperationException" WHERE "seasonId" = ${seasonId} AND "status" IN ('open','assigned','reopened') AND "severity" IN ('high','critical')`,
    tx.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::bigint AS "count" FROM "Share" AS share JOIN "ShareCard" AS card ON card."id" = share."shareCardId" WHERE card."seasonId" = ${seasonId} AND share."status" = 'sold' AND NOT EXISTS (SELECT 1 FROM "DeliveryRecord" AS delivery WHERE delivery."shareId" = share."id" AND delivery."status" = 'delivered')`,
    tx.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::bigint AS "count" FROM "WeightShortfallAdjustment" WHERE "seasonId" = ${seasonId} AND "status" = 'pending_approval'`,
  ]);
  if (Number(finance[0]?.unbalanced ?? BigInt(0)) > 0 || Number(finance[0]?.difference ?? "0") !== 0) throw new TenantMasterDataError("SEASON_ARCHIVE_FINANCE_NOT_RECONCILED");
  if (Number(openExceptions[0]?.count ?? BigInt(0)) > 0) throw new TenantMasterDataError("SEASON_ARCHIVE_CRITICAL_EXCEPTION_OPEN");
  if (Number(undelivered[0]?.count ?? BigInt(0)) > 0) throw new TenantMasterDataError("SEASON_ARCHIVE_DELIVERY_INCOMPLETE");
  if (Number(pendingAdjustments[0]?.count ?? BigInt(0)) > 0) throw new TenantMasterDataError("SEASON_ARCHIVE_ADJUSTMENT_PENDING");
  await tx.$executeRaw`INSERT INTO "SeasonClosureSnapshot" ("id", "seasonId", "financeDifference", "unbalancedJournalCount", "openCriticalExceptionCount", "undeliveredShareCount", "pendingAdjustmentCount", "closedByUserId", "closedAt") VALUES (${`season_closure_${seasonId}`}, ${seasonId}, ${finance[0]?.difference ?? "0"}::decimal, ${Number(finance[0]?.unbalanced ?? BigInt(0))}, ${Number(openExceptions[0]?.count ?? BigInt(0))}, ${Number(undelivered[0]?.count ?? BigInt(0))}, ${Number(pendingAdjustments[0]?.count ?? BigInt(0))}, ${meta.actorUserId}, ${meta.occurredAt}) ON CONFLICT ("seasonId") DO NOTHING`;
}

async function evidence(tx: Tx, meta: CommandMeta, action: string, targetType: string, targetId: string, metadata: Record<string, unknown>): Promise<void> {
  const safeMetadata = JSON.parse(JSON.stringify(metadata)) as Prisma.InputJsonValue;
  const payload = JSON.parse(JSON.stringify({ targetType, targetId, requestId: meta.requestId, occurredAt: meta.occurredAt.toISOString(), ...metadata })) as Prisma.InputJsonValue;
  await tx.tenantAuditLog.create({ data: { id: `audit_${randomUUID()}`, actorUserId: meta.actorUserId, action, targetType, targetId, requestId: meta.requestId, occurredAt: meta.occurredAt, metadata: safeMetadata } });
  await tx.tenantOutboxMessage.create({ data: { id: `outbox_${randomUUID()}`, topic: action, payload, status: "pending", idempotencyKey: meta.idempotencyKey } });
}

async function createAnimalAggregate(tx: Tx, input: AnimalInput, meta: CommandMeta): Promise<void> {
  await tx.animal.create({ data: { id: input.id, seasonId: input.seasonId, supplierId: input.supplierId, earTag: input.earTag, status: "draft", purchaseAmount: input.purchaseAmount, liveWeightKg: input.liveWeightKg, notes: input.notes } });
  const cardId = `share_card_${input.id}`;
  await tx.shareCard.create({ data: { id: cardId, seasonId: input.seasonId, animalId: input.id, targetShareCount: 7, shares: { create: Array.from({ length: 7 }, (_, index) => ({ id: `share_${input.id}_${index + 1}`, sequenceNo: index + 1, status: "available" })) } } });
  if (input.liveWeightKg) await tx.animalWeight.create({ data: { id: `weight_${input.id}_initial`, animalId: input.id, kind: input.purchaseAmount ? "purchase" : "live", weightKg: input.liveWeightKg, measuredAt: meta.occurredAt, recordedByUserId: meta.actorUserId } });
}

function assertInvoiceTotals(input: PurchaseInvoiceInput): void {
  if (input.lines.length === 0) throw new TenantMasterDataError("PURCHASE_INVOICE_LINE_REQUIRED");
  const lines = input.lines.reduce((sum, line) => sum + toUnits(line.lineTotal), BigInt(0));
  if (lines !== toUnits(input.subtotal) || toUnits(input.subtotal) + toUnits(input.taxTotal ?? "0") !== toUnits(input.grandTotal)) throw new TenantMasterDataError("PURCHASE_INVOICE_TOTAL_MISMATCH");
}

function toUnits(value: string): bigint {
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * BigInt(10_000) + BigInt(fraction.padEnd(4, "0").slice(0, 4));
}

async function invoiceAnimalIds(tx: Tx, invoiceId: string): Promise<string[]> {
  const lines = await tx.purchaseInvoiceLine.findMany({ where: { purchaseInvoiceId: invoiceId, animalId: { not: null } }, select: { animalId: true } });
  return lines.flatMap((line) => line.animalId ? [line.animalId] : []);
}

async function financialAccount(tx: Tx, code: string, name: string, type: string, normalSide: string) {
  return tx.financialAccount.upsert({
    where: { code },
    create: { id: `financial_account_${code.toLocaleLowerCase("tr-TR").replace(/[^a-z0-9]+/g, "_")}`, code, name, type, normalSide, currency: "TRY" },
    update: { name, type, normalSide, active: true },
    select: { id: true },
  });
}

async function settlementAccount(tx: Tx, method: string) {
  const normalized = method.trim().toLocaleUpperCase("tr-TR");
  if (normalized === "CASH" || normalized === "NAKİT" || normalized === "NAKIT") return financialAccount(tx, "100.01", "Nakit Kasa", "asset", "debit");
  if (normalized === "BANK" || normalized === "HAVALE" || normalized === "EFT") return financialAccount(tx, "102.01", "Banka/Havale", "asset", "debit");
  if (normalized === "POS" || normalized === "CARD" || normalized === "KART") return financialAccount(tx, "108.01", "POS Alacakları", "asset", "debit");
  throw new TenantMasterDataError("SUPPLIER_PAYMENT_METHOD_UNSUPPORTED");
}
