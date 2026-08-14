-- Faturalar 360 finansal bütünlük hardening paketi.
-- Çoklu para birimi bu fazda aktif değildir; fatura omurgası TRY için fail-closed çalışır.

ALTER TABLE "PurchaseInvoice"
  ADD CONSTRAINT "PurchaseInvoice_try_currency_check" CHECK ("currency" = 'TRY');

ALTER TABLE "InvoicePaymentAllocation"
  ADD CONSTRAINT "InvoicePaymentAllocation_try_currency_check" CHECK ("currency" = 'TRY');

CREATE INDEX "PurchaseInvoice_original_status_idx"
  ON "PurchaseInvoice"("originalInvoiceId", "accountingStatus");

CREATE INDEX "InvoiceTaxComponent_line_invoice_idx"
  ON "InvoiceTaxComponent"("lineId", "purchaseInvoiceId");

INSERT INTO "FinancialAccount" ("id", "code", "name", "type", "normalSide", "currency", "active", "createdAt", "updatedAt")
VALUES
  ('financial_account_inventory', 'INVENTORY', 'Stok ve Hayvan Maliyeti', 'asset', 'debit', 'TRY', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('financial_account_input_tax', 'INPUT_TAX', 'İndirilecek Vergi', 'asset', 'debit', 'TRY', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('financial_account_accounts_payable', 'ACCOUNTS_PAYABLE', 'Tedarikçi Borçları', 'liability', 'credit', 'TRY', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('financial_account_accounts_receivable', 'ACCOUNTS_RECEIVABLE', 'Müşteri Alacakları', 'asset', 'debit', 'TRY', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('financial_account_sales_revenue', 'SALES_REVENUE', 'Satış Gelirleri', 'revenue', 'credit', 'TRY', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('financial_account_output_tax', 'OUTPUT_TAX', 'Hesaplanan Vergi', 'liability', 'credit', 'TRY', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

CREATE OR REPLACE FUNCTION enforce_invoice_return_integrity() RETURNS trigger AS $$
DECLARE
  original_record "PurchaseInvoice"%ROWTYPE;
  returned_total NUMERIC(18,4);
  expected_direction TEXT;
BEGIN
  IF NEW."documentNature" <> 'RETURN' THEN
    RETURN NEW;
  END IF;

  SELECT * INTO original_record
  FROM "PurchaseInvoice"
  WHERE "id" = NEW."originalInvoiceId"
  FOR UPDATE;

  IF NOT FOUND
     OR original_record."documentNature" <> 'STANDARD'
     OR original_record."accountingStatus" <> 'POSTED' THEN
    RAISE EXCEPTION 'INVOICE_RETURN_ORIGINAL_INVALID';
  END IF;

  IF original_record."organizationId" <> NEW."organizationId"
     OR original_record."seasonId" <> NEW."seasonId"
     OR original_record."tradeType" <> NEW."tradeType"
     OR original_record."supplierId" IS DISTINCT FROM NEW."supplierId"
     OR original_record."customerId" IS DISTINCT FROM NEW."customerId"
     OR original_record."currency" <> NEW."currency" THEN
    RAISE EXCEPTION 'INVOICE_RETURN_SCOPE_MISMATCH';
  END IF;

  expected_direction := CASE original_record."direction"
    WHEN 'INBOUND' THEN 'OUTBOUND'
    ELSE 'INBOUND'
  END;
  IF NEW."direction" <> expected_direction THEN
    RAISE EXCEPTION 'INVOICE_RETURN_DIRECTION_INVALID';
  END IF;

  IF NEW."accountingStatus" = 'POSTED' THEN
    SELECT COALESCE(SUM("grandTotal"), 0) INTO returned_total
    FROM "PurchaseInvoice"
    WHERE "originalInvoiceId" = NEW."originalInvoiceId"
      AND "accountingStatus" = 'POSTED'
      AND "id" <> NEW."id";

    IF returned_total + NEW."grandTotal" > original_record."grandTotal" THEN
      RAISE EXCEPTION 'INVOICE_RETURN_AMOUNT_EXCEEDED';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "PurchaseInvoice_enforce_return_integrity"
BEFORE INSERT OR UPDATE ON "PurchaseInvoice"
FOR EACH ROW EXECUTE FUNCTION enforce_invoice_return_integrity();

CREATE OR REPLACE FUNCTION enforce_invoice_allocation_integrity() RETURNS trigger AS $$
DECLARE
  invoice_record "PurchaseInvoice"%ROWTYPE;
  receipt_record "Receipt"%ROWTYPE;
  supplier_payment_record "SupplierPayment"%ROWTYPE;
  source_amount NUMERIC(18,4);
  source_allocated NUMERIC(18,4);
  invoice_allocated NUMERIC(18,4);
BEGIN
  SELECT * INTO invoice_record
  FROM "PurchaseInvoice"
  WHERE "id" = NEW."purchaseInvoiceId"
  FOR UPDATE;

  IF NOT FOUND OR invoice_record."accountingStatus" <> 'POSTED' THEN
    RAISE EXCEPTION 'INVOICE_NOT_POSTED';
  END IF;

  IF NEW."currency" <> invoice_record."currency" OR NEW."currency" <> 'TRY' THEN
    RAISE EXCEPTION 'INVOICE_ALLOCATION_CURRENCY_MISMATCH';
  END IF;

  IF NEW."receiptId" IS NOT NULL THEN
    SELECT * INTO receipt_record
    FROM "Receipt"
    WHERE "id" = NEW."receiptId"
    FOR UPDATE;

    IF NOT FOUND
       OR receipt_record."seasonId" <> invoice_record."seasonId"
       OR receipt_record."customerId" IS DISTINCT FROM invoice_record."customerId"
       OR receipt_record."currency" <> invoice_record."currency" THEN
      RAISE EXCEPTION 'INVOICE_RECEIPT_SCOPE_MISMATCH';
    END IF;
    source_amount := receipt_record."totalAmount";
    SELECT COALESCE(SUM("amount"), 0) INTO source_allocated
    FROM "InvoicePaymentAllocation"
    WHERE "receiptId" = NEW."receiptId" AND "id" <> NEW."id";
  ELSE
    SELECT * INTO supplier_payment_record
    FROM "SupplierPayment"
    WHERE "id" = NEW."supplierPaymentId"
    FOR UPDATE;

    IF NOT FOUND
       OR supplier_payment_record."seasonId" <> invoice_record."seasonId"
       OR supplier_payment_record."supplierId" IS DISTINCT FROM invoice_record."supplierId" THEN
      RAISE EXCEPTION 'INVOICE_SUPPLIER_PAYMENT_SCOPE_MISMATCH';
    END IF;
    source_amount := supplier_payment_record."amount";
    SELECT COALESCE(SUM("amount"), 0) INTO source_allocated
    FROM "InvoicePaymentAllocation"
    WHERE "supplierPaymentId" = NEW."supplierPaymentId" AND "id" <> NEW."id";
  END IF;

  IF source_allocated + NEW."amount" > source_amount THEN
    RAISE EXCEPTION 'INVOICE_PAYMENT_SOURCE_EXCEEDED';
  END IF;

  SELECT COALESCE(SUM("amount"), 0) INTO invoice_allocated
  FROM "InvoicePaymentAllocation"
  WHERE "purchaseInvoiceId" = NEW."purchaseInvoiceId" AND "id" <> NEW."id";

  IF invoice_allocated + NEW."amount" > invoice_record."grandTotal" THEN
    RAISE EXCEPTION 'INVOICE_TOTAL_EXCEEDED';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "InvoicePaymentAllocation_enforce_integrity"
BEFORE INSERT OR UPDATE ON "InvoicePaymentAllocation"
FOR EACH ROW EXECUTE FUNCTION enforce_invoice_allocation_integrity();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "InvoiceTaxComponent" tax
    JOIN "PurchaseInvoiceLine" line ON line."id" = tax."lineId"
    WHERE tax."lineId" IS NOT NULL
      AND line."purchaseInvoiceId" <> tax."purchaseInvoiceId"
  ) THEN
    RAISE EXCEPTION 'INVOICE_TAX_LINE_SCOPE_MISMATCH';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION enforce_invoice_tax_line_scope() RETURNS trigger AS $$
BEGIN
  IF NEW."lineId" IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM "PurchaseInvoiceLine"
    WHERE "id" = NEW."lineId"
      AND "purchaseInvoiceId" = NEW."purchaseInvoiceId"
  ) THEN
    RAISE EXCEPTION 'INVOICE_TAX_LINE_SCOPE_MISMATCH';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "InvoiceTaxComponent_enforce_line_scope"
BEFORE INSERT OR UPDATE ON "InvoiceTaxComponent"
FOR EACH ROW EXECUTE FUNCTION enforce_invoice_tax_line_scope();
