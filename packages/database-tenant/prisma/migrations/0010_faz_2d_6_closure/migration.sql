-- Faz 2D-6 closure: immutable sale-share history, ledger links,
-- paddock assignment history, proxy document scope and allocation ownership.

ALTER TABLE "SaleShare"
  ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "endedAt" TIMESTAMP(3);

CREATE INDEX "SaleShare_shareId_active_idx" ON "SaleShare"("shareId", "active");
CREATE UNIQUE INDEX "SaleShare_one_active_per_share"
  ON "SaleShare"("shareId") WHERE "active" = true;

ALTER TABLE "SupplierPayment" ADD COLUMN "journalEntryId" TEXT;
ALTER TABLE "ExpenseDocument" ADD COLUMN "journalEntryId" TEXT;
CREATE UNIQUE INDEX "SupplierPayment_journalEntryId_key" ON "SupplierPayment"("journalEntryId");
CREATE UNIQUE INDEX "ExpenseDocument_journalEntryId_key" ON "ExpenseDocument"("journalEntryId");
ALTER TABLE "SupplierPayment" ADD CONSTRAINT "SupplierPayment_journalEntryId_fkey"
  FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExpenseDocument" ADD CONSTRAINT "ExpenseDocument_journalEntryId_fkey"
  FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "Paddock" (
  "id" TEXT NOT NULL,
  "seasonId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "capacity" INTEGER,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Paddock_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Paddock_capacity_check" CHECK ("capacity" IS NULL OR "capacity" > 0),
  CONSTRAINT "Paddock_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Paddock_seasonId_code_key" ON "Paddock"("seasonId", "code");
CREATE INDEX "Paddock_seasonId_active_idx" ON "Paddock"("seasonId", "active");

CREATE TABLE "AnimalPaddockAssignment" (
  "id" TEXT NOT NULL,
  "seasonId" TEXT NOT NULL,
  "animalId" TEXT NOT NULL,
  "paddockId" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "assignedAt" TIMESTAMP(3) NOT NULL,
  "endedAt" TIMESTAMP(3),
  "reason" TEXT,
  "assignedByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnimalPaddockAssignment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AnimalPaddockAssignment_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AnimalPaddockAssignment_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AnimalPaddockAssignment_paddockId_fkey" FOREIGN KEY ("paddockId") REFERENCES "Paddock"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AnimalPaddockAssignment_period_check" CHECK (("active" AND "endedAt" IS NULL) OR (NOT "active" AND "endedAt" IS NOT NULL))
);
CREATE INDEX "AnimalPaddockAssignment_seasonId_active_idx" ON "AnimalPaddockAssignment"("seasonId", "active");
CREATE INDEX "AnimalPaddockAssignment_animalId_active_idx" ON "AnimalPaddockAssignment"("animalId", "active");
CREATE INDEX "AnimalPaddockAssignment_paddockId_active_idx" ON "AnimalPaddockAssignment"("paddockId", "active");
CREATE UNIQUE INDEX "AnimalPaddockAssignment_one_active_per_animal"
  ON "AnimalPaddockAssignment"("animalId") WHERE "active" = true;

ALTER TABLE "ProxyDocument"
  ADD COLUMN "seasonId" TEXT,
  ADD COLUMN "method" TEXT NOT NULL DEFAULT 'legacy_migrated',
  ADD COLUMN "mimeType" TEXT,
  ADD COLUMN "sizeBytes" INTEGER,
  ADD COLUMN "createdByUserId" TEXT NOT NULL DEFAULT 'legacy_migration',
  ADD COLUMN "revocationReason" TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT share_link."proxyDocumentId"
    FROM "ProxyDocumentShare" AS share_link
    JOIN "Share" AS share ON share."id" = share_link."shareId"
    JOIN "ShareCard" AS card ON card."id" = share."shareCardId"
    GROUP BY share_link."proxyDocumentId"
    HAVING COUNT(DISTINCT card."seasonId") > 1
  ) THEN
    RAISE EXCEPTION 'PROXY_DOCUMENT_SEASON_AMBIGUOUS';
  END IF;
END $$;

UPDATE "ProxyDocument" AS document
SET "seasonId" = source."seasonId"
FROM (
  SELECT DISTINCT ON (share_link."proxyDocumentId")
    share_link."proxyDocumentId", card."seasonId"
  FROM "ProxyDocumentShare" AS share_link
  JOIN "Share" AS share ON share."id" = share_link."shareId"
  JOIN "ShareCard" AS card ON card."id" = share."shareCardId"
  ORDER BY share_link."proxyDocumentId", card."seasonId"
) AS source
WHERE document."id" = source."proxyDocumentId";

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "ProxyDocument" WHERE "seasonId" IS NULL) THEN
    RAISE EXCEPTION 'PROXY_DOCUMENT_SEASON_BACKFILL_REQUIRED';
  END IF;
END $$;

ALTER TABLE "ProxyDocument" ALTER COLUMN "seasonId" SET NOT NULL;
ALTER TABLE "ProxyDocument" ALTER COLUMN "method" DROP DEFAULT;
ALTER TABLE "ProxyDocument" ALTER COLUMN "createdByUserId" DROP DEFAULT;
ALTER TABLE "ProxyDocument" ADD CONSTRAINT "ProxyDocument_seasonId_fkey"
  FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProxyDocument" ADD CONSTRAINT "ProxyDocument_sizeBytes_check"
  CHECK ("sizeBytes" IS NULL OR "sizeBytes" > 0);
CREATE INDEX "ProxyDocument_seasonId_customerId_idx" ON "ProxyDocument"("seasonId", "customerId");
DROP INDEX IF EXISTS "ProxyDocument_customerId_idx";

CREATE OR REPLACE FUNCTION validate_payment_allocation_scope()
RETURNS trigger AS $$
DECLARE
  receipt_row "Receipt"%ROWTYPE;
  sale_row "Sale"%ROWTYPE;
  allocated NUMERIC(18,4);
  owns_share BOOLEAN;
  reverses_allocation BOOLEAN;
BEGIN
  IF NEW."amount" <= 0 THEN
    RAISE EXCEPTION 'PAYMENT_ALLOCATION_AMOUNT_INVALID';
  END IF;

  SELECT * INTO receipt_row FROM "Receipt" WHERE "id" = NEW."receiptId" FOR UPDATE;
  IF NOT FOUND OR receipt_row."customerId" <> NEW."customerId" THEN
    RAISE EXCEPTION 'PAYMENT_ALLOCATION_CUSTOMER_MISMATCH';
  END IF;

  IF receipt_row."status" = 'reversed' AND receipt_row."reversalOfId" IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM "PaymentAllocation" AS original
      WHERE original."receiptId" = receipt_row."reversalOfId"
        AND original."saleId" IS NOT DISTINCT FROM NEW."saleId"
        AND original."shareId" IS NOT DISTINCT FROM NEW."shareId"
        AND original."customerId" = NEW."customerId"
        AND original."amount" = NEW."amount"
    ) INTO reverses_allocation;
    IF NOT reverses_allocation THEN
      RAISE EXCEPTION 'PAYMENT_ALLOCATION_REVERSAL_MISMATCH';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW."shareId" IS NOT NULL AND NEW."saleId" IS NULL THEN
    RAISE EXCEPTION 'PAYMENT_ALLOCATION_SALE_REQUIRED_FOR_SHARE';
  END IF;

  IF NEW."saleId" IS NOT NULL THEN
    SELECT * INTO sale_row FROM "Sale" WHERE "id" = NEW."saleId" FOR UPDATE;
    IF NOT FOUND OR sale_row."seasonId" <> receipt_row."seasonId" OR sale_row."customerId" <> NEW."customerId" OR sale_row."status" <> 'confirmed' THEN
      RAISE EXCEPTION 'PAYMENT_ALLOCATION_SALE_SCOPE_MISMATCH';
    END IF;

    IF NEW."shareId" IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1 FROM "SaleShare"
        WHERE "saleId" = NEW."saleId" AND "shareId" = NEW."shareId" AND "active" = true
      ) INTO owns_share;
      IF NOT owns_share THEN
        RAISE EXCEPTION 'PAYMENT_ALLOCATION_SHARE_SCOPE_MISMATCH';
      END IF;
    END IF;

    SELECT COALESCE(SUM("amount"), 0) INTO allocated
    FROM "PaymentAllocation" AS allocation
    JOIN "Receipt" AS source_receipt ON source_receipt."id" = allocation."receiptId"
    WHERE allocation."saleId" = NEW."saleId" AND allocation."id" <> NEW."id" AND source_receipt."status" = 'posted';
    IF allocated + NEW."amount" > sale_row."priceSnapshot" THEN
      RAISE EXCEPTION 'PAYMENT_ALLOCATION_EXCEEDS_SALE';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "PaymentAllocation_scope_guard"
BEFORE INSERT OR UPDATE ON "PaymentAllocation"
FOR EACH ROW EXECUTE FUNCTION validate_payment_allocation_scope();
