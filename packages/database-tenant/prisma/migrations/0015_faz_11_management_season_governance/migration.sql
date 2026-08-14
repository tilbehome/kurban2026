-- Faz 11: season closure evidence and database-level archived-season write guards.

BEGIN;

CREATE TABLE "SeasonClosureSnapshot" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "seasonId" TEXT NOT NULL,
  "financeDifference" NUMERIC(18,4) NOT NULL,
  "unbalancedJournalCount" INTEGER NOT NULL,
  "openCriticalExceptionCount" INTEGER NOT NULL,
  "undeliveredShareCount" INTEGER NOT NULL,
  "pendingAdjustmentCount" INTEGER NOT NULL,
  "closedByUserId" TEXT NOT NULL,
  "closedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SeasonClosureSnapshot_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SeasonClosureSnapshot_zero_reconciliation_check" CHECK ("financeDifference" = 0 AND "unbalancedJournalCount" = 0 AND "openCriticalExceptionCount" = 0 AND "undeliveredShareCount" = 0 AND "pendingAdjustmentCount" = 0)
);
CREATE UNIQUE INDEX "SeasonClosureSnapshot_seasonId_key" ON "SeasonClosureSnapshot"("seasonId");

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "PackageRecord" WHERE "seasonId" IS NULL) THEN RAISE EXCEPTION 'PACKAGE_SEASON_BACKFILL_REQUIRED'; END IF;
  IF EXISTS (SELECT 1 FROM "DeliveryRecord" WHERE "seasonId" IS NULL) THEN RAISE EXCEPTION 'DELIVERY_SEASON_BACKFILL_REQUIRED'; END IF;
END $$;
ALTER TABLE "PackageRecord" ALTER COLUMN "seasonId" SET NOT NULL;
ALTER TABLE "DeliveryRecord" ALTER COLUMN "seasonId" SET NOT NULL;

CREATE OR REPLACE FUNCTION guard_archived_season_write()
RETURNS trigger AS $$
DECLARE old_season_key TEXT; new_season_key TEXT;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN old_season_key := to_jsonb(OLD) ->> TG_ARGV[0]; END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') THEN new_season_key := to_jsonb(NEW) ->> TG_ARGV[0]; END IF;
  IF EXISTS (
    SELECT 1 FROM "Season"
    WHERE "status" = 'archived' AND "id" IN (old_season_key, new_season_key)
  ) THEN
    RAISE EXCEPTION 'SEASON_ARCHIVED_READ_ONLY';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Animal_archived_season_guard" BEFORE INSERT OR UPDATE OR DELETE ON "Animal" FOR EACH ROW EXECUTE FUNCTION guard_archived_season_write('seasonId');
CREATE TRIGGER "ShareCard_archived_season_guard" BEFORE INSERT OR UPDATE OR DELETE ON "ShareCard" FOR EACH ROW EXECUTE FUNCTION guard_archived_season_write('seasonId');
CREATE TRIGGER "Sale_archived_season_guard" BEFORE INSERT OR UPDATE OR DELETE ON "Sale" FOR EACH ROW EXECUTE FUNCTION guard_archived_season_write('seasonId');
CREATE TRIGGER "Receipt_archived_season_guard" BEFORE INSERT OR UPDATE OR DELETE ON "Receipt" FOR EACH ROW EXECUTE FUNCTION guard_archived_season_write('seasonId');
CREATE TRIGGER "JournalEntry_archived_season_guard" BEFORE INSERT OR UPDATE OR DELETE ON "JournalEntry" FOR EACH ROW EXECUTE FUNCTION guard_archived_season_write('seasonId');
CREATE TRIGGER "PurchaseInvoice_archived_season_guard" BEFORE INSERT OR UPDATE OR DELETE ON "PurchaseInvoice" FOR EACH ROW EXECUTE FUNCTION guard_archived_season_write('seasonId');
CREATE TRIGGER "SupplierPayment_archived_season_guard" BEFORE INSERT OR UPDATE OR DELETE ON "SupplierPayment" FOR EACH ROW EXECUTE FUNCTION guard_archived_season_write('seasonId');
CREATE TRIGGER "ExpenseDocument_archived_season_guard" BEFORE INSERT OR UPDATE OR DELETE ON "ExpenseDocument" FOR EACH ROW EXECUTE FUNCTION guard_archived_season_write('seasonId');
CREATE TRIGGER "ProxyDocument_archived_season_guard" BEFORE INSERT OR UPDATE OR DELETE ON "ProxyDocument" FOR EACH ROW EXECUTE FUNCTION guard_archived_season_write('seasonId');
CREATE TRIGGER "SlaughterJob_archived_season_guard" BEFORE INSERT OR UPDATE OR DELETE ON "SlaughterJob" FOR EACH ROW EXECUTE FUNCTION guard_archived_season_write('seasonId');
CREATE TRIGGER "WeighingRecord_archived_season_guard" BEFORE INSERT OR UPDATE OR DELETE ON "WeighingRecord" FOR EACH ROW EXECUTE FUNCTION guard_archived_season_write('seasonId');
CREATE TRIGGER "PackageRecord_archived_season_guard" BEFORE INSERT OR UPDATE OR DELETE ON "PackageRecord" FOR EACH ROW EXECUTE FUNCTION guard_archived_season_write('seasonId');
CREATE TRIGGER "DeliveryRecord_archived_season_guard" BEFORE INSERT OR UPDATE OR DELETE ON "DeliveryRecord" FOR EACH ROW EXECUTE FUNCTION guard_archived_season_write('seasonId');
CREATE TRIGGER "OperationException_archived_season_guard" BEFORE INSERT OR UPDATE OR DELETE ON "OperationException" FOR EACH ROW EXECUTE FUNCTION guard_archived_season_write('seasonId');
CREATE TRIGGER "WeightShortfallAdjustment_archived_season_guard" BEFORE INSERT OR UPDATE OR DELETE ON "WeightShortfallAdjustment" FOR EACH ROW EXECUTE FUNCTION guard_archived_season_write('seasonId');

CREATE OR REPLACE FUNCTION guard_archived_season_share_write()
RETURNS trigger AS $$
DECLARE old_card_id TEXT; new_card_id TEXT; old_season_key TEXT; new_season_key TEXT;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN old_card_id := OLD."shareCardId"; END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') THEN new_card_id := NEW."shareCardId"; END IF;
  SELECT "seasonId" INTO old_season_key FROM "ShareCard" WHERE "id" = old_card_id;
  SELECT "seasonId" INTO new_season_key FROM "ShareCard" WHERE "id" = new_card_id;
  IF EXISTS (SELECT 1 FROM "Season" WHERE "status" = 'archived' AND "id" IN (old_season_key, new_season_key)) THEN RAISE EXCEPTION 'SEASON_ARCHIVED_READ_ONLY'; END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "Share_archived_season_guard" BEFORE INSERT OR UPDATE OR DELETE ON "Share" FOR EACH ROW EXECUTE FUNCTION guard_archived_season_share_write();

CREATE OR REPLACE FUNCTION guard_archived_season_journal_line_write()
RETURNS trigger AS $$
DECLARE old_entry_id TEXT; new_entry_id TEXT; old_season_key TEXT; new_season_key TEXT;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN old_entry_id := OLD."journalEntryId"; END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') THEN new_entry_id := NEW."journalEntryId"; END IF;
  SELECT "seasonId" INTO old_season_key FROM "JournalEntry" WHERE "id" = old_entry_id;
  SELECT "seasonId" INTO new_season_key FROM "JournalEntry" WHERE "id" = new_entry_id;
  IF EXISTS (SELECT 1 FROM "Season" WHERE "status" = 'archived' AND "id" IN (old_season_key, new_season_key)) THEN RAISE EXCEPTION 'SEASON_ARCHIVED_READ_ONLY'; END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "JournalLine_archived_season_guard" BEFORE INSERT OR UPDATE OR DELETE ON "JournalLine" FOR EACH ROW EXECUTE FUNCTION guard_archived_season_journal_line_write();

CREATE OR REPLACE FUNCTION guard_archived_season_state_write()
RETURNS trigger AS $$
BEGIN
  IF OLD."status" = 'archived' THEN RAISE EXCEPTION 'SEASON_ARCHIVED_READ_ONLY'; END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "Season_archived_state_guard" BEFORE UPDATE OR DELETE ON "Season" FOR EACH ROW EXECUTE FUNCTION guard_archived_season_state_write();

COMMIT;
