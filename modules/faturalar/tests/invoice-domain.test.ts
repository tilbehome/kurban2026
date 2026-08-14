import { describe, expect, test } from "vitest";
import { assertAccountingTransition, assertInvoiceParties, calculateInvoiceTotals, paymentStatus } from "../domain/invoice";

describe("Faturalar 360 domain", () => {
  test("Decimal miktar, iskonto ve vergi bileşenlerini dört hanede mutabık hesaplar", () => {
    const result = calculateInvoiceTotals([{ id: "line-1", description: "Sentetik hayvan alımı", quantity: "2.500", unit: "ADET", unitPrice: "100.0000", discountTotal: "10.0000", taxes: [{ id: "tax-1", type: "KDV", rate: "20.0000" }] }]);
    expect(result).toMatchObject({ subtotal: "250.0000", discountTotal: "10.0000", taxTotal: "48.0000", grandTotal: "288.0000" });
    expect(result.lines[0]?.lineTotal).toBe("288.0000");
  });

  test("alış/satış tarafı korunur; yön ve belge niteliği bağımsız eksenlerdir", () => {
    expect(() => assertInvoiceParties({ direction: "INBOUND", tradeType: "PURCHASE", supplierId: "supplier-1", documentNature: "STANDARD" })).not.toThrow();
    expect(() => assertInvoiceParties({ direction: "OUTBOUND", tradeType: "PURCHASE", supplierId: "supplier-1", documentNature: "RETURN", originalInvoiceId: "invoice-original" })).not.toThrow();
    expect(() => assertInvoiceParties({ direction: "INBOUND", tradeType: "SALES", customerId: "customer-1", documentNature: "RETURN", originalInvoiceId: "invoice-original" })).not.toThrow();
    expect(() => assertInvoiceParties({ direction: "OUTBOUND", tradeType: "SALES", customerId: "customer-1", documentNature: "RETURN" })).toThrowError("INVOICE_RETURN_ORIGINAL_REQUIRED");
  });

  test("posted fatura doğrudan düzenleme durumuna dönemez", () => {
    expect(() => assertAccountingTransition("POSTED", "DRAFT")).toThrowError("INVOICE_ACCOUNTING_TRANSITION_INVALID");
    expect(() => assertAccountingTransition("POSTED", "REVERSED")).not.toThrow();
  });

  test.each([["100.0000", "0.0000", "UNPAID"], ["100.0000", "40.0000", "PARTIALLY_PAID"], ["100.0000", "100.0000", "PAID"], ["100.0000", "110.0000", "OVERPAID"]])("ödeme statüsü %s/%s için %s", (total, paid, expected) => expect(paymentStatus(total, paid)).toBe(expected));
});
