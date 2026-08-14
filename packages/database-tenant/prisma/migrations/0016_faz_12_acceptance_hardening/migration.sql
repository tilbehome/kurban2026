-- Faz 12: remove the legacy supplier-scoped invoice uniqueness left behind by 0008.

BEGIN;

DROP INDEX "PurchaseInvoice_supplierId_invoiceNo_key";

COMMIT;
