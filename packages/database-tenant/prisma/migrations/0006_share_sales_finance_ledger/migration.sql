-- Faz 5-6 tenant sales, reservation, pricing and double-entry ledger foundation.
ALTER TABLE "Animal" ADD COLUMN "locationId" TEXT;
ALTER TABLE "Animal" ALTER COLUMN "seasonId" DROP NOT NULL;
DROP INDEX IF EXISTS "Animal_seasonId_earTag_key";
CREATE UNIQUE INDEX "Animal_earTag_key" ON "Animal"("earTag");
CREATE INDEX "Animal_locationId_idx" ON "Animal"("locationId");
CREATE INDEX "Animal_seasonId_idx" ON "Animal"("seasonId");
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ShareCard" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "ShareCard" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "ShareCard" ADD COLUMN "priceTariffVersionId" TEXT;
CREATE UNIQUE INDEX "ShareCard_seasonId_animalId_version_key" ON "ShareCard"("seasonId", "animalId", "version");
CREATE INDEX "ShareCard_priceTariffVersionId_idx" ON "ShareCard"("priceTariffVersionId");

ALTER TABLE "Share" ADD COLUMN "reservedByCustomerId" TEXT;
ALTER TABLE "Share" ADD COLUMN "listPriceSnapshot" DECIMAL(18,4);
ALTER TABLE "Share" ADD COLUMN "discountAmountSnapshot" DECIMAL(18,4);
ALTER TABLE "Share" ADD COLUMN "reservationId" TEXT;
ALTER TABLE "Share" ADD COLUMN "soldAt" TIMESTAMP(3);
ALTER TABLE "Share" ADD COLUMN "cancelledAt" TIMESTAMP(3);
ALTER TABLE "Share" ADD COLUMN "cancellationReason" TEXT;
CREATE INDEX "Share_reservedByCustomerId_idx" ON "Share"("reservedByCustomerId");
CREATE INDEX "Share_reservationId_idx" ON "Share"("reservationId");
CREATE INDEX "Share_status_reservedUntil_idx" ON "Share"("status", "reservedUntil");
ALTER TABLE "Share" ADD CONSTRAINT "Share_sequence_range_check" CHECK ("sequenceNo" BETWEEN 1 AND 7);
ALTER TABLE "Share" ADD CONSTRAINT "Share_status_check" CHECK ("status" IN ('available','reserved','sold','cancelled','delivered'));
ALTER TABLE "Share" ADD CONSTRAINT "Share_reservedByCustomerId_fkey" FOREIGN KEY ("reservedByCustomerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Sale" ADD COLUMN "payerCustomerId" TEXT;
ALTER TABLE "Sale" ADD COLUMN "listPriceSnapshot" DECIMAL(18,4) NOT NULL DEFAULT 0;
ALTER TABLE "Sale" ALTER COLUMN "discountAmount" SET DEFAULT 0;
UPDATE "Sale" SET "discountAmount" = 0 WHERE "discountAmount" IS NULL;
ALTER TABLE "Sale" ALTER COLUMN "discountAmount" SET NOT NULL;
ALTER TABLE "Sale" ADD COLUMN "downPaymentAmount" DECIMAL(18,4) NOT NULL DEFAULT 0;
ALTER TABLE "Sale" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'TRY';
ALTER TABLE "Sale" ADD COLUMN "confirmedAt" TIMESTAMP(3);
ALTER TABLE "Sale" ADD COLUMN "cancelledAt" TIMESTAMP(3);
ALTER TABLE "Sale" ADD COLUMN "transferredAt" TIMESTAMP(3);
ALTER TABLE "Sale" ADD COLUMN "cancellationReason" TEXT;
CREATE INDEX "Sale_payerCustomerId_idx" ON "Sale"("payerCustomerId");
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_status_check" CHECK ("status" IN ('draft','confirmed','cancelled','reversed','transferred'));
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_positive_confirmed_deposit_check" CHECK ("status" <> 'confirmed' OR "downPaymentAmount" > 0);
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_payerCustomerId_fkey" FOREIGN KEY ("payerCustomerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SaleShare" ADD COLUMN "listPriceSnapshot" DECIMAL(18,4) NOT NULL DEFAULT 0;
ALTER TABLE "SaleShare" ADD COLUMN "discountAmountSnapshot" DECIMAL(18,4) NOT NULL DEFAULT 0;
ALTER TABLE "SaleShare" ADD COLUMN "agreedPriceSnapshot" DECIMAL(18,4) NOT NULL DEFAULT 0;

CREATE TABLE "PriceTariff" (
  "id" TEXT NOT NULL, "seasonId" TEXT NOT NULL, "name" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'draft',
  "currency" TEXT NOT NULL DEFAULT 'TRY', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "PriceTariff_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PriceTariff_status_check" CHECK ("status" IN ('draft','active','retired'))
);
CREATE INDEX "PriceTariff_seasonId_status_idx" ON "PriceTariff"("seasonId", "status");

CREATE TABLE "PriceTariffVersion" (
  "id" TEXT NOT NULL, "priceTariffId" TEXT NOT NULL, "version" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft', "validFrom" TIMESTAMP(3), "validUntil" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3), "createdByUserId" TEXT NOT NULL, "changeReason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "PriceTariffVersion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PriceTariffVersion_status_check" CHECK ("status" IN ('draft','published','retired')),
  CONSTRAINT "PriceTariffVersion_window_check" CHECK ("validUntil" IS NULL OR "validFrom" IS NULL OR "validUntil" > "validFrom")
);
CREATE UNIQUE INDEX "PriceTariffVersion_priceTariffId_version_key" ON "PriceTariffVersion"("priceTariffId", "version");
CREATE INDEX "PriceTariffVersion_status_validFrom_validUntil_idx" ON "PriceTariffVersion"("status", "validFrom", "validUntil");

CREATE TABLE "PriceTariffItem" (
  "id" TEXT NOT NULL, "priceTariffVersionId" TEXT NOT NULL, "shareGroup" TEXT NOT NULL, "sequenceNo" INTEGER,
  "listPrice" DECIMAL(18,4) NOT NULL, "minDepositAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'TRY', CONSTRAINT "PriceTariffItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PriceTariffItem_sequence_check" CHECK ("sequenceNo" IS NULL OR "sequenceNo" BETWEEN 1 AND 7),
  CONSTRAINT "PriceTariffItem_amount_check" CHECK ("listPrice" > 0 AND "minDepositAmount" >= 0)
);
CREATE UNIQUE INDEX "PriceTariffItem_priceTariffVersionId_shareGroup_sequenceNo_key" ON "PriceTariffItem"("priceTariffVersionId", "shareGroup", "sequenceNo");

CREATE TABLE "ShareReservation" (
  "id" TEXT NOT NULL, "seasonId" TEXT NOT NULL, "shareId" TEXT NOT NULL, "customerId" TEXT NOT NULL,
  "saleId" TEXT, "status" TEXT NOT NULL DEFAULT 'active', "reservedUntil" TIMESTAMP(3) NOT NULL,
  "expiredAt" TIMESTAMP(3), "confirmedAt" TIMESTAMP(3), "cancelledAt" TIMESTAMP(3), "reason" TEXT,
  "idempotencyKey" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "ShareReservation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ShareReservation_status_check" CHECK ("status" IN ('active','expired','confirmed','cancelled')),
  CONSTRAINT "ShareReservation_window_check" CHECK ("reservedUntil" > "createdAt")
);
CREATE UNIQUE INDEX "ShareReservation_idempotencyKey_key" ON "ShareReservation"("idempotencyKey");
CREATE INDEX "ShareReservation_seasonId_status_reservedUntil_idx" ON "ShareReservation"("seasonId", "status", "reservedUntil");
CREATE INDEX "ShareReservation_shareId_status_idx" ON "ShareReservation"("shareId", "status");

CREATE TABLE "SaleEvent" (
  "id" TEXT NOT NULL, "saleId" TEXT, "shareId" TEXT, "type" TEXT NOT NULL, "reason" TEXT, "payload" JSONB,
  "actorUserId" TEXT NOT NULL, "occurredAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SaleEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SaleEvent_saleId_occurredAt_idx" ON "SaleEvent"("saleId", "occurredAt");
CREATE INDEX "SaleEvent_shareId_occurredAt_idx" ON "SaleEvent"("shareId", "occurredAt");

CREATE TABLE "ShareTransfer" (
  "id" TEXT NOT NULL, "seasonId" TEXT NOT NULL, "sourceShareId" TEXT NOT NULL, "targetShareId" TEXT NOT NULL,
  "fromCustomerId" TEXT, "toCustomerId" TEXT, "saleId" TEXT, "reason" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'posted',
  "occurredAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShareTransfer_pkey" PRIMARY KEY ("id"), CONSTRAINT "ShareTransfer_distinct_share_check" CHECK ("sourceShareId" <> "targetShareId")
);
CREATE INDEX "ShareTransfer_seasonId_occurredAt_idx" ON "ShareTransfer"("seasonId", "occurredAt");
CREATE INDEX "ShareTransfer_sourceShareId_idx" ON "ShareTransfer"("sourceShareId");
CREATE INDEX "ShareTransfer_targetShareId_idx" ON "ShareTransfer"("targetShareId");

CREATE TABLE "FinancialAccount" (
  "id" TEXT NOT NULL, "code" TEXT NOT NULL, "name" TEXT NOT NULL, "type" TEXT NOT NULL,
  "normalSide" TEXT NOT NULL, "currency" TEXT NOT NULL DEFAULT 'TRY', "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FinancialAccount_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FinancialAccount_side_check" CHECK ("normalSide" IN ('debit','credit'))
);
CREATE UNIQUE INDEX "FinancialAccount_code_key" ON "FinancialAccount"("code");
CREATE INDEX "FinancialAccount_type_active_idx" ON "FinancialAccount"("type", "active");

CREATE TABLE "JournalEntry" (
  "id" TEXT NOT NULL, "seasonId" TEXT NOT NULL, "sourceType" TEXT NOT NULL, "sourceId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'posted', "currency" TEXT NOT NULL DEFAULT 'TRY', "memo" TEXT,
  "idempotencyKey" TEXT NOT NULL, "reversalOfId" TEXT, "occurredAt" TIMESTAMP(3) NOT NULL,
  "postedAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "JournalEntry_status_check" CHECK ("status" IN ('posted','reversed','voided'))
);
CREATE UNIQUE INDEX "JournalEntry_idempotencyKey_key" ON "JournalEntry"("idempotencyKey");
CREATE UNIQUE INDEX "JournalEntry_sourceType_sourceId_key" ON "JournalEntry"("sourceType", "sourceId");
CREATE INDEX "JournalEntry_seasonId_occurredAt_idx" ON "JournalEntry"("seasonId", "occurredAt");
CREATE INDEX "JournalEntry_reversalOfId_idx" ON "JournalEntry"("reversalOfId");

CREATE TABLE "JournalLine" (
  "id" TEXT NOT NULL, "journalEntryId" TEXT NOT NULL, "accountId" TEXT NOT NULL,
  "side" TEXT NOT NULL, "amount" DECIMAL(18,4) NOT NULL, "currency" TEXT NOT NULL DEFAULT 'TRY',
  "customerId" TEXT, "saleId" TEXT, "shareId" TEXT, "memo" TEXT, CONSTRAINT "JournalLine_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "JournalLine_side_check" CHECK ("side" IN ('debit','credit')),
  CONSTRAINT "JournalLine_amount_check" CHECK ("amount" > 0)
);
CREATE INDEX "JournalLine_journalEntryId_idx" ON "JournalLine"("journalEntryId");
CREATE INDEX "JournalLine_accountId_idx" ON "JournalLine"("accountId");
CREATE INDEX "JournalLine_customerId_idx" ON "JournalLine"("customerId");
CREATE INDEX "JournalLine_saleId_idx" ON "JournalLine"("saleId");
CREATE INDEX "JournalLine_shareId_idx" ON "JournalLine"("shareId");

CREATE TABLE "Receipt" (
  "id" TEXT NOT NULL, "seasonId" TEXT NOT NULL, "customerId" TEXT NOT NULL, "payerCustomerId" TEXT,
  "saleId" TEXT, "journalEntryId" TEXT NOT NULL, "receiptNo" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'posted',
  "totalAmount" DECIMAL(18,4) NOT NULL, "currency" TEXT NOT NULL DEFAULT 'TRY', "occurredAt" TIMESTAMP(3) NOT NULL,
  "idempotencyKey" TEXT NOT NULL, "reversalOfId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id"), CONSTRAINT "Receipt_amount_check" CHECK ("totalAmount" > 0),
  CONSTRAINT "Receipt_status_check" CHECK ("status" IN ('posted','reversed','voided'))
);
CREATE UNIQUE INDEX "Receipt_idempotencyKey_key" ON "Receipt"("idempotencyKey");
CREATE UNIQUE INDEX "Receipt_seasonId_receiptNo_key" ON "Receipt"("seasonId", "receiptNo");
CREATE INDEX "Receipt_customerId_seasonId_idx" ON "Receipt"("customerId", "seasonId");
CREATE INDEX "Receipt_saleId_idx" ON "Receipt"("saleId");

CREATE TABLE "ReceiptMethodSplit" (
  "id" TEXT NOT NULL, "receiptId" TEXT NOT NULL, "method" TEXT NOT NULL, "amount" DECIMAL(18,4) NOT NULL,
  "referenceNo" TEXT, "posInstallmentCount" INTEGER, "posFeeAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
  CONSTRAINT "ReceiptMethodSplit_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ReceiptMethodSplit_method_check" CHECK ("method" IN ('cash','bank_transfer','pos')),
  CONSTRAINT "ReceiptMethodSplit_amount_check" CHECK ("amount" > 0 AND "posFeeAmount" >= 0)
);
CREATE INDEX "ReceiptMethodSplit_receiptId_idx" ON "ReceiptMethodSplit"("receiptId");

CREATE TABLE "PaymentAllocation" (
  "id" TEXT NOT NULL, "receiptId" TEXT NOT NULL, "saleId" TEXT, "customerId" TEXT NOT NULL,
  "shareId" TEXT, "amount" DECIMAL(18,4) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id"), CONSTRAINT "PaymentAllocation_amount_check" CHECK ("amount" > 0)
);
CREATE INDEX "PaymentAllocation_receiptId_idx" ON "PaymentAllocation"("receiptId");
CREATE INDEX "PaymentAllocation_saleId_idx" ON "PaymentAllocation"("saleId");
CREATE INDEX "PaymentAllocation_customerId_idx" ON "PaymentAllocation"("customerId");
CREATE INDEX "PaymentAllocation_shareId_idx" ON "PaymentAllocation"("shareId");

ALTER TABLE "ShareCard" ADD CONSTRAINT "ShareCard_priceTariffVersionId_fkey" FOREIGN KEY ("priceTariffVersionId") REFERENCES "PriceTariffVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PriceTariff" ADD CONSTRAINT "PriceTariff_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PriceTariffVersion" ADD CONSTRAINT "PriceTariffVersion_priceTariffId_fkey" FOREIGN KEY ("priceTariffId") REFERENCES "PriceTariff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PriceTariffItem" ADD CONSTRAINT "PriceTariffItem_priceTariffVersionId_fkey" FOREIGN KEY ("priceTariffVersionId") REFERENCES "PriceTariffVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShareReservation" ADD CONSTRAINT "ShareReservation_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShareReservation" ADD CONSTRAINT "ShareReservation_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "Share"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShareReservation" ADD CONSTRAINT "ShareReservation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShareReservation" ADD CONSTRAINT "ShareReservation_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Share" ADD CONSTRAINT "Share_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "ShareReservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SaleEvent" ADD CONSTRAINT "SaleEvent_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SaleEvent" ADD CONSTRAINT "SaleEvent_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "Share"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ShareTransfer" ADD CONSTRAINT "ShareTransfer_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShareTransfer" ADD CONSTRAINT "ShareTransfer_sourceShareId_fkey" FOREIGN KEY ("sourceShareId") REFERENCES "Share"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShareTransfer" ADD CONSTRAINT "ShareTransfer_targetShareId_fkey" FOREIGN KEY ("targetShareId") REFERENCES "Share"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShareTransfer" ADD CONSTRAINT "ShareTransfer_fromCustomerId_fkey" FOREIGN KEY ("fromCustomerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ShareTransfer" ADD CONSTRAINT "ShareTransfer_toCustomerId_fkey" FOREIGN KEY ("toCustomerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ShareTransfer" ADD CONSTRAINT "ShareTransfer_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "FinancialAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "Share"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_payerCustomerId_fkey" FOREIGN KEY ("payerCustomerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "Receipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReceiptMethodSplit" ADD CONSTRAINT "ReceiptMethodSplit_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "Share"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE FUNCTION ensure_share_card_has_seven_shares() RETURNS trigger AS $$
DECLARE
  card_id TEXT;
  share_count INTEGER;
BEGIN
  card_id := COALESCE(NEW."shareCardId", OLD."shareCardId");
  SELECT COUNT(*) INTO share_count FROM "Share" WHERE "shareCardId" = card_id;
  IF share_count <> 7 THEN
    RAISE EXCEPTION 'SHARE_CARD_REQUIRES_EXACTLY_SEVEN_SHARES';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE CONSTRAINT TRIGGER "ShareCard_seven_share_guard" AFTER INSERT OR UPDATE OR DELETE ON "Share" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ensure_share_card_has_seven_shares();

CREATE FUNCTION ensure_journal_entry_balanced() RETURNS trigger AS $$
DECLARE
  entry_id TEXT;
  debit_total DECIMAL(18,4);
  credit_total DECIMAL(18,4);
BEGIN
  entry_id := COALESCE(NEW."journalEntryId", OLD."journalEntryId");
  SELECT COALESCE(SUM(CASE WHEN "side" = 'debit' THEN "amount" ELSE 0 END), 0),
         COALESCE(SUM(CASE WHEN "side" = 'credit' THEN "amount" ELSE 0 END), 0)
    INTO debit_total, credit_total FROM "JournalLine" WHERE "journalEntryId" = entry_id;
  IF debit_total <> credit_total THEN
    RAISE EXCEPTION 'JOURNAL_ENTRY_NOT_BALANCED';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE CONSTRAINT TRIGGER "JournalLine_balance_guard" AFTER INSERT OR UPDATE OR DELETE ON "JournalLine" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ensure_journal_entry_balanced();

CREATE FUNCTION ensure_receipt_splits_and_allocations_match() RETURNS trigger AS $$
DECLARE
  receipt_id TEXT;
  receipt_total DECIMAL(18,4);
  split_total DECIMAL(18,4);
  allocation_total DECIMAL(18,4);
BEGIN
  receipt_id := COALESCE(NEW."receiptId", OLD."receiptId");
  SELECT "totalAmount" INTO receipt_total FROM "Receipt" WHERE "id" = receipt_id;
  IF receipt_total IS NULL THEN RETURN NULL; END IF;
  SELECT COALESCE(SUM("amount"), 0) INTO split_total FROM "ReceiptMethodSplit" WHERE "receiptId" = receipt_id;
  SELECT COALESCE(SUM("amount"), 0) INTO allocation_total FROM "PaymentAllocation" WHERE "receiptId" = receipt_id;
  IF split_total <> receipt_total OR allocation_total <> receipt_total THEN
    RAISE EXCEPTION 'RECEIPT_TOTAL_MISMATCH';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE CONSTRAINT TRIGGER "ReceiptMethodSplit_total_guard" AFTER INSERT OR UPDATE OR DELETE ON "ReceiptMethodSplit" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ensure_receipt_splits_and_allocations_match();
CREATE CONSTRAINT TRIGGER "PaymentAllocation_total_guard" AFTER INSERT OR UPDATE OR DELETE ON "PaymentAllocation" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ensure_receipt_splits_and_allocations_match();
