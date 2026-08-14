export const INVOICE_DIRECTIONS = ["INBOUND", "OUTBOUND"] as const;
export const INVOICE_TRADE_TYPES = ["PURCHASE", "SALES"] as const;
export const INVOICE_DOCUMENT_NATURES = ["STANDARD", "RETURN"] as const;
export const ELECTRONIC_CHANNELS = ["NONE", "EFATURA", "EARSIV"] as const;
export const ACCOUNTING_STATUSES = ["DRAFT", "APPROVAL_PENDING", "APPROVED", "POSTED", "REVERSED", "CANCELLED"] as const;
export const PAYMENT_STATUSES = ["UNPAID", "PARTIALLY_PAID", "PAID", "OVERPAID", "REFUNDED"] as const;
export const ELECTRONIC_STATUSES = ["NOT_APPLICABLE", "PREPARING", "QUEUED", "SENDING", "SENT", "DELIVERED", "ACCEPTED", "REJECTED", "FAILED", "CANCEL_REQUESTED", "CANCELLED", "OBJECTED"] as const;

export type InvoiceDirection = (typeof INVOICE_DIRECTIONS)[number];
export type InvoiceTradeType = (typeof INVOICE_TRADE_TYPES)[number];
export type InvoiceDocumentNature = (typeof INVOICE_DOCUMENT_NATURES)[number];
export type ElectronicChannel = (typeof ELECTRONIC_CHANNELS)[number];
export type AccountingStatus = (typeof ACCOUNTING_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type ElectronicStatus = (typeof ELECTRONIC_STATUSES)[number];

export interface InvoiceLineDraft {
  id: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  discountTotal?: string;
  taxes?: readonly { id: string; type: string; rate: string; exemptionCode?: string }[];
  animalId?: string;
  shareId?: string;
  saleId?: string;
  purchaseReference?: string;
  expenseDocumentId?: string;
}

export interface CalculatedInvoiceLine extends InvoiceLineDraft {
  lineSubtotal: string;
  discountTotal: string;
  taxTotal: string;
  lineTotal: string;
  taxComponents: readonly {
    id: string;
    type: string;
    rate: string;
    taxableAmount: string;
    amount: string;
    exemptionCode?: string;
  }[];
}

export interface InvoiceTotals {
  lines: readonly CalculatedInvoiceLine[];
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  grandTotal: string;
}

export class InvoiceDomainError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "InvoiceDomainError";
  }
}

const ACCOUNTING_TRANSITIONS: Readonly<Record<AccountingStatus, readonly AccountingStatus[]>> = {
  DRAFT: ["APPROVAL_PENDING", "CANCELLED"],
  APPROVAL_PENDING: ["DRAFT", "APPROVED", "CANCELLED"],
  APPROVED: ["POSTED", "CANCELLED"],
  POSTED: ["REVERSED"],
  REVERSED: [],
  CANCELLED: [],
};

export function assertAccountingTransition(from: AccountingStatus, to: AccountingStatus): void {
  if (!ACCOUNTING_TRANSITIONS[from].includes(to)) throw new InvoiceDomainError("INVOICE_ACCOUNTING_TRANSITION_INVALID");
}

export function assertInvoiceParties(input: {
  direction: InvoiceDirection;
  tradeType: InvoiceTradeType;
  supplierId?: string;
  customerId?: string;
  documentNature: InvoiceDocumentNature;
  originalInvoiceId?: string;
}): void {
  if (input.tradeType === "PURCHASE" && (!input.supplierId || input.customerId)) throw new InvoiceDomainError("INVOICE_SUPPLIER_PARTY_REQUIRED");
  if (input.tradeType === "SALES" && (!input.customerId || input.supplierId)) throw new InvoiceDomainError("INVOICE_CUSTOMER_PARTY_REQUIRED");
  if (input.documentNature === "RETURN" && !input.originalInvoiceId) throw new InvoiceDomainError("INVOICE_RETURN_ORIGINAL_REQUIRED");
  if (input.documentNature === "STANDARD" && input.originalInvoiceId) throw new InvoiceDomainError("INVOICE_STANDARD_ORIGINAL_NOT_ALLOWED");
}

export function assertSupportedInvoiceCurrency(currency: string): void {
  if (currency !== "TRY") throw new InvoiceDomainError("INVOICE_CURRENCY_NOT_SUPPORTED");
}

export function calculateInvoiceTotals(lines: readonly InvoiceLineDraft[]): InvoiceTotals {
  if (lines.length === 0) throw new InvoiceDomainError("INVOICE_LINE_REQUIRED");
  const ids = new Set<string>();
  const calculated = lines.map((line) => {
    if (!line.id || ids.has(line.id)) throw new InvoiceDomainError("INVOICE_LINE_ID_DUPLICATE");
    ids.add(line.id);
    if (!line.description.trim()) throw new InvoiceDomainError("INVOICE_LINE_DESCRIPTION_REQUIRED");
    const quantity = decimalUnits(line.quantity, 3, false);
    const unitPrice = decimalUnits(line.unitPrice, 4, false);
    if (quantity <= BigInt(0) || unitPrice < BigInt(0)) throw new InvoiceDomainError("INVOICE_LINE_AMOUNT_INVALID");
    const subtotal = roundDivide(quantity * unitPrice, BigInt(1_000));
    const discount = decimalUnits(line.discountTotal ?? "0", 4, false);
    if (discount < BigInt(0) || discount > subtotal) throw new InvoiceDomainError("INVOICE_LINE_DISCOUNT_INVALID");
    const taxable = subtotal - discount;
    let taxTotal = BigInt(0);
    const taxComponents = (line.taxes ?? []).map((tax) => {
      const rate = decimalUnits(tax.rate, 4, false);
      if (rate < BigInt(0) || rate > BigInt(1_000_000)) throw new InvoiceDomainError("INVOICE_TAX_RATE_INVALID");
      const amount = roundDivide(taxable * rate, BigInt(1_000_000));
      taxTotal += amount;
      return { id: tax.id, type: tax.type, rate: formatUnits(rate), taxableAmount: formatUnits(taxable), amount: formatUnits(amount), exemptionCode: tax.exemptionCode };
    });
    return {
      ...line,
      lineSubtotal: formatUnits(subtotal),
      discountTotal: formatUnits(discount),
      taxTotal: formatUnits(taxTotal),
      lineTotal: formatUnits(taxable + taxTotal),
      taxComponents,
    };
  });
  const subtotal = calculated.reduce((sum, line) => sum + decimalUnits(line.lineSubtotal, 4, true), BigInt(0));
  const discountTotal = calculated.reduce((sum, line) => sum + decimalUnits(line.discountTotal, 4, true), BigInt(0));
  const taxTotal = calculated.reduce((sum, line) => sum + decimalUnits(line.taxTotal, 4, true), BigInt(0));
  return { lines: calculated, subtotal: formatUnits(subtotal), discountTotal: formatUnits(discountTotal), taxTotal: formatUnits(taxTotal), grandTotal: formatUnits(subtotal - discountTotal + taxTotal) };
}

export function paymentStatus(grandTotal: string, paidTotal: string, reversed = false): PaymentStatus {
  if (reversed) return "REFUNDED";
  const total = decimalUnits(grandTotal, 4, true);
  const paid = decimalUnits(paidTotal, 4, true);
  if (paid === BigInt(0)) return "UNPAID";
  if (paid < total) return "PARTIALLY_PAID";
  if (paid === total) return "PAID";
  return "OVERPAID";
}

export function reverseSide(side: "debit" | "credit"): "debit" | "credit" {
  return side === "debit" ? "credit" : "debit";
}

function decimalUnits(value: string, scale: 3 | 4, allowNegative: boolean): bigint {
  if (!new RegExp(`^${allowNegative ? "-?" : ""}\\d+(?:\\.\\d{1,${scale}})?$`).test(value)) throw new InvoiceDomainError("DECIMAL_FORMAT_INVALID");
  const negative = value.startsWith("-");
  const normalized = negative ? value.slice(1) : value;
  const [whole, fraction = ""] = normalized.split(".");
  const units = BigInt(whole) * BigInt(10) ** BigInt(scale) + BigInt(fraction.padEnd(scale, "0"));
  return negative ? -units : units;
}

function formatUnits(value: bigint): string {
  const negative = value < BigInt(0);
  const absolute = negative ? -value : value;
  return `${negative ? "-" : ""}${absolute / BigInt(10_000)}.${(absolute % BigInt(10_000)).toString().padStart(4, "0")}`;
}

function roundDivide(value: bigint, denominator: bigint): bigint {
  const quotient = value / denominator;
  const remainder = value % denominator;
  return remainder * BigInt(2) >= denominator ? quotient + BigInt(1) : quotient;
}
