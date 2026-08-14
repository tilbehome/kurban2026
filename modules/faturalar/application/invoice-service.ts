import {
  assertAccountingTransition,
  assertInvoiceParties,
  assertSupportedInvoiceCurrency,
  calculateInvoiceTotals,
  type AccountingStatus,
  type ElectronicChannel,
  type InvoiceDirection,
  type InvoiceDocumentNature,
  type InvoiceLineDraft,
  type InvoiceTradeType,
} from "../domain/invoice";

export interface InvoiceActorContext {
  organizationId: string;
  actorUserId: string;
  requestId: string;
  idempotencyKey: string;
  permissions: readonly string[];
  reauthenticatedAt?: string;
}

export interface InvoiceDraftInput {
  id: string;
  seasonId: string;
  locationId?: string;
  uuid: string;
  invoiceNo: string;
  series?: string;
  invoiceDate: string;
  dueDate?: string;
  direction: InvoiceDirection;
  tradeType: InvoiceTradeType;
  documentNature: InvoiceDocumentNature;
  electronicChannel: ElectronicChannel;
  currency: string;
  supplierId?: string;
  customerId?: string;
  partyTaxIdentity?: string;
  partySnapshot: Readonly<Record<string, unknown>>;
  originalInvoiceId?: string;
  lines: readonly InvoiceLineDraft[];
}

export interface InvoiceListFilter {
  seasonId?: string;
  locationId?: string;
  direction?: InvoiceDirection;
  tradeType?: InvoiceTradeType;
  documentNature?: InvoiceDocumentNature;
  electronicChannel?: ElectronicChannel;
  accountingStatus?: AccountingStatus;
  paymentStatus?: string;
  electronicStatus?: string;
  partyId?: string;
  query?: string;
  overdueOnly?: boolean;
  minTotal?: string;
  maxTotal?: string;
  from?: string;
  to?: string;
  limit: number;
  offset: number;
}

export type CalculatedInvoiceDraftInput = Omit<InvoiceDraftInput, "lines"> & ReturnType<typeof calculateInvoiceTotals>;

export interface InvoiceRepository {
  createDraft(input: CalculatedInvoiceDraftInput, context: InvoiceActorContext): Promise<{ id: string }>;
  getById(organizationId: string, id: string): Promise<InvoiceRecord | null>;
  list(organizationId: string, filter: InvoiceListFilter): Promise<{ items: readonly InvoiceRecord[]; total: number }>;
  transition(input: { organizationId: string; id: string; from: AccountingStatus; to: AccountingStatus; actorUserId: string; requestId: string }): Promise<void>;
  post(input: { organizationId: string; id: string; actorUserId: string; requestId: string; idempotencyKey: string }): Promise<{ journalEntryId: string }>;
  allocatePayment(input: { organizationId: string; id: string; receiptId?: string; supplierPaymentId?: string; amount: string; allocationId: string; actorUserId: string; requestId: string; idempotencyKey: string }): Promise<{ paymentStatus: string; paidTotal: string }>;
  enqueueElectronicDocument(input: { organizationId: string; id: string; deliveryId: string; providerKey: string; correlationId: string; actorUserId: string; requestId: string; idempotencyKey: string }): Promise<void>;
}

export interface InvoiceRecord {
  id: string;
  organizationId: string;
  accountingStatus: AccountingStatus;
  paymentStatus: string;
  electronicStatus: string;
  electronicChannel: ElectronicChannel;
  grandTotal: string;
  paidTotal: string;
  tradeType: InvoiceTradeType;
  documentNature: InvoiceDocumentNature;
  originalInvoiceId?: string;
  supplierId?: string;
  customerId?: string;
  journalEntryId?: string;
  invoiceNo?: string;
  uuid?: string;
  invoiceDate?: string;
  dueDate?: string;
  currency?: string;
  direction?: InvoiceDirection;
}

const PERMISSIONS = {
  read: "invoice.invoice.read.organization",
  create: "invoice.invoice.create.organization",
  submit: "invoice.invoice.submit.organization",
  approve: "invoice.invoice.approve.organization",
  post: "invoice.invoice.post.organization",
  pay: "invoice.invoice.pay.organization",
  send: "invoice.einvoice.send.organization",
} as const;

export class InvoiceService {
  constructor(private readonly repository: InvoiceRepository) {}

  async createDraft(context: InvoiceActorContext, input: InvoiceDraftInput) {
    requirePermission(context, PERMISSIONS.create);
    assertInvoiceParties(input);
    assertSupportedInvoiceCurrency(input.currency);
    const totals = calculateInvoiceTotals(input.lines);
    return this.repository.createDraft({ ...input, ...totals }, context);
  }

  async get(context: InvoiceActorContext, id: string) {
    requirePermission(context, PERMISSIONS.read);
    const invoice = await this.repository.getById(context.organizationId, id);
    if (!invoice) throw new Error("INVOICE_NOT_FOUND");
    return invoice;
  }

  list(context: InvoiceActorContext, filter: InvoiceListFilter) {
    requirePermission(context, PERMISSIONS.read);
    return this.repository.list(context.organizationId, { ...filter, limit: Math.min(Math.max(filter.limit, 1), 200), offset: Math.max(filter.offset, 0) });
  }

  async submit(context: InvoiceActorContext, id: string) {
    requirePermission(context, PERMISSIONS.submit);
    return this.move(context, id, "DRAFT", "APPROVAL_PENDING");
  }

  async approve(context: InvoiceActorContext, id: string) {
    requirePermission(context, PERMISSIONS.approve);
    requireRecentReauthentication(context);
    return this.move(context, id, "APPROVAL_PENDING", "APPROVED");
  }

  async post(context: InvoiceActorContext, id: string) {
    requirePermission(context, PERMISSIONS.post);
    requireRecentReauthentication(context);
    const invoice = await this.getForMutation(context, id);
    assertAccountingTransition(invoice.accountingStatus, "POSTED");
    return this.repository.post({ organizationId: context.organizationId, id, actorUserId: context.actorUserId, requestId: context.requestId, idempotencyKey: context.idempotencyKey });
  }

  async allocatePayment(context: InvoiceActorContext, input: { id: string; receiptId?: string; supplierPaymentId?: string; amount: string; allocationId: string }) {
    requirePermission(context, PERMISSIONS.pay);
    if (Boolean(input.receiptId) === Boolean(input.supplierPaymentId)) throw new Error("INVOICE_PAYMENT_SOURCE_REQUIRED");
    const invoice = await this.getForMutation(context, input.id);
    if (invoice.accountingStatus !== "POSTED") throw new Error("INVOICE_NOT_POSTED");
    return this.repository.allocatePayment({ ...input, organizationId: context.organizationId, actorUserId: context.actorUserId, requestId: context.requestId, idempotencyKey: context.idempotencyKey });
  }

  async enqueueElectronicDocument(context: InvoiceActorContext, input: { id: string; deliveryId: string; providerKey: string; correlationId: string }) {
    requirePermission(context, PERMISSIONS.send);
    requireRecentReauthentication(context);
    const invoice = await this.getForMutation(context, input.id);
    if (invoice.accountingStatus !== "POSTED") throw new Error("INVOICE_NOT_POSTED");
    if (invoice.electronicChannel === "NONE") throw new Error("INVOICE_E_DOCUMENT_NOT_APPLICABLE");
    return this.repository.enqueueElectronicDocument({ ...input, organizationId: context.organizationId, actorUserId: context.actorUserId, requestId: context.requestId, idempotencyKey: context.idempotencyKey });
  }

  private async move(context: InvoiceActorContext, id: string, from: AccountingStatus, to: AccountingStatus) {
    const invoice = await this.getForMutation(context, id);
    if (invoice.accountingStatus !== from) throw new Error("INVOICE_STATE_CHANGED");
    assertAccountingTransition(from, to);
    await this.repository.transition({ organizationId: context.organizationId, id, from, to, actorUserId: context.actorUserId, requestId: context.requestId });
    return { id, accountingStatus: to };
  }

  private async getForMutation(context: InvoiceActorContext, id: string) {
    const invoice = await this.repository.getById(context.organizationId, id);
    if (!invoice) throw new Error("INVOICE_NOT_FOUND");
    return invoice;
  }
}

function requirePermission(context: InvoiceActorContext, permission: string): void {
  if (!context.permissions.includes(permission)) throw new Error("INVOICE_PERMISSION_DENIED");
}

function requireRecentReauthentication(context: InvoiceActorContext): void {
  const at = context.reauthenticatedAt ? new Date(context.reauthenticatedAt).getTime() : Number.NaN;
  if (!Number.isFinite(at) || Date.now() - at > 15 * 60 * 1000) throw new Error("REAUTHENTICATION_REQUIRED");
}
