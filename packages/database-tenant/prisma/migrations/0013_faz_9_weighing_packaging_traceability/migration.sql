-- Faz 9: immutable weighing corrections, seven-share allocation and package traceability.

BEGIN;

ALTER TABLE "WeighingRecord"
  ADD COLUMN "seasonId" TEXT,
  ADD COLUMN "measurementType" TEXT NOT NULL DEFAULT 'carcass',
  ADD COLUMN "deviceAdapterId" TEXT,
  ADD COLUMN "stationId" TEXT,
  ADD COLUMN "note" TEXT,
  ADD COLUMN "supersedesId" TEXT,
  ADD COLUMN "revokedAt" TIMESTAMP(3),
  ADD COLUMN "revokedByUserId" TEXT,
  ADD COLUMN "revocationReason" TEXT;
UPDATE "WeighingRecord" AS weighing SET "seasonId" = animal."seasonId" FROM "Animal" AS animal WHERE animal."id" = weighing."animalId";
ALTER TABLE "WeighingRecord" ALTER COLUMN "seasonId" SET NOT NULL;
ALTER TABLE "WeighingRecord" ADD CONSTRAINT "WeighingRecord_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WeighingRecord" ADD CONSTRAINT "WeighingRecord_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "WeighingRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WeighingRecord" ADD CONSTRAINT "WeighingRecord_measurementType_check" CHECK ("measurementType" IN ('purchase','live','control','carcass','share','package'));
CREATE UNIQUE INDEX "WeighingRecord_supersedesId_key" ON "WeighingRecord"("supersedesId") WHERE "supersedesId" IS NOT NULL;
CREATE INDEX "WeighingRecord_seasonId_measurementType_recordedAt_idx" ON "WeighingRecord"("seasonId", "measurementType", "recordedAt");

CREATE TABLE "ShareWeightAllocation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "seasonId" TEXT NOT NULL,
  "animalId" TEXT NOT NULL,
  "shareId" TEXT NOT NULL,
  "sourceWeighingId" TEXT NOT NULL,
  "allocatedWeightKg" NUMERIC(12,3) NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShareWeightAllocation_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ShareWeightAllocation_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ShareWeightAllocation_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "Share"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ShareWeightAllocation_sourceWeighingId_fkey" FOREIGN KEY ("sourceWeighingId") REFERENCES "WeighingRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ShareWeightAllocation_positive_check" CHECK ("allocatedWeightKg" > 0)
);
CREATE UNIQUE INDEX "ShareWeightAllocation_sourceWeighingId_shareId_key" ON "ShareWeightAllocation"("sourceWeighingId", "shareId");
CREATE INDEX "ShareWeightAllocation_seasonId_animalId_idx" ON "ShareWeightAllocation"("seasonId", "animalId");

CREATE TABLE "WeightShortfallAdjustment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "seasonId" TEXT NOT NULL,
  "shareId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "saleId" TEXT NOT NULL,
  "agreedPrice" NUMERIC(18,4) NOT NULL,
  "targetWeightKg" NUMERIC(12,3) NOT NULL,
  "actualWeightKg" NUMERIC(12,3) NOT NULL,
  "adjustmentAmount" NUMERIC(18,4) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'TRY',
  "status" TEXT NOT NULL DEFAULT 'pending_approval',
  "journalEntryId" TEXT,
  "reason" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WeightShortfallAdjustment_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "WeightShortfallAdjustment_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "Share"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "WeightShortfallAdjustment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "WeightShortfallAdjustment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "WeightShortfallAdjustment_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "WeightShortfallAdjustment_values_check" CHECK ("agreedPrice" >= 0 AND "targetWeightKg" > 0 AND "actualWeightKg" >= 0 AND "adjustmentAmount" >= 0),
  CONSTRAINT "WeightShortfallAdjustment_currency_check" CHECK ("currency" = 'TRY')
);
CREATE INDEX "WeightShortfallAdjustment_seasonId_status_idx" ON "WeightShortfallAdjustment"("seasonId", "status");
CREATE INDEX "WeightShortfallAdjustment_shareId_idx" ON "WeightShortfallAdjustment"("shareId");

ALTER TABLE "PackageRecord"
  ADD COLUMN "seasonId" TEXT,
  ADD COLUMN "animalId" TEXT,
  ADD COLUMN "customerId" TEXT,
  ADD COLUMN "packageNo" TEXT,
  ADD COLUMN "barcodeValue" TEXT,
  ADD COLUMN "qrTargetId" TEXT,
  ADD COLUMN "netWeightKg" NUMERIC(12,3),
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'created',
  ADD COLUMN "parentPackageId" TEXT;
UPDATE "PackageRecord" AS package SET
  "seasonId" = card."seasonId", "animalId" = card."animalId", "customerId" = share."customerId",
  "packageNo" = package."labelNo", "netWeightKg" = package."grossWeightKg"
FROM "Share" AS share JOIN "ShareCard" AS card ON card."id" = share."shareCardId"
WHERE share."id" = package."shareId";
ALTER TABLE "PackageRecord" ADD CONSTRAINT "PackageRecord_status_check" CHECK ("status" IN ('created','stored','picked','loaded','delivered','missing','wrong','damaged','void'));
ALTER TABLE "PackageRecord" ADD CONSTRAINT "PackageRecord_parentPackageId_fkey" FOREIGN KEY ("parentPackageId") REFERENCES "PackageRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PackageRecord" ADD CONSTRAINT "PackageRecord_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PackageRecord" ADD CONSTRAINT "PackageRecord_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PackageRecord" ADD CONSTRAINT "PackageRecord_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "PackageRecord_packageNo_key" ON "PackageRecord"("packageNo") WHERE "packageNo" IS NOT NULL;
CREATE UNIQUE INDEX "PackageRecord_barcodeValue_key" ON "PackageRecord"("barcodeValue") WHERE "barcodeValue" IS NOT NULL;
CREATE INDEX "PackageRecord_seasonId_animalId_customerId_status_idx" ON "PackageRecord"("seasonId", "animalId", "customerId", "status");

CREATE TABLE "PackageTransformation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "seasonId" TEXT NOT NULL,
  "sourcePackageId" TEXT NOT NULL,
  "targetPackageId" TEXT NOT NULL,
  "transformation" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PackageTransformation_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PackageTransformation_sourcePackageId_fkey" FOREIGN KEY ("sourcePackageId") REFERENCES "PackageRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PackageTransformation_targetPackageId_fkey" FOREIGN KEY ("targetPackageId") REFERENCES "PackageRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PackageTransformation_kind_check" CHECK ("transformation" IN ('split','merge'))
);
CREATE INDEX "PackageTransformation_sourcePackageId_occurredAt_idx" ON "PackageTransformation"("sourcePackageId", "occurredAt");
CREATE INDEX "PackageTransformation_targetPackageId_idx" ON "PackageTransformation"("targetPackageId");

CREATE TABLE "PackageExceptionHistory" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "seasonId" TEXT NOT NULL,
  "packageRecordId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PackageExceptionHistory_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PackageExceptionHistory_packageRecordId_fkey" FOREIGN KEY ("packageRecordId") REFERENCES "PackageRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PackageExceptionHistory_status_check" CHECK ("status" IN ('missing','wrong','damaged'))
);
CREATE INDEX "PackageExceptionHistory_packageRecordId_occurredAt_idx" ON "PackageExceptionHistory"("packageRecordId", "occurredAt");
CREATE INDEX "PackageExceptionHistory_seasonId_status_idx" ON "PackageExceptionHistory"("seasonId", "status");

COMMIT;
