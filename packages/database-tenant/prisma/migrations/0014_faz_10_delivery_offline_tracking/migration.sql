-- Faz 10: delivery package checklist, evidence metadata and bound offline queue state.

ALTER TABLE "DeliveryRecord"
  ADD COLUMN "seasonId" TEXT,
  ADD COLUMN "receiverRelationship" TEXT,
  ADD COLUMN "deliveryType" TEXT NOT NULL DEFAULT 'on_site',
  ADD COLUMN "serviceFee" NUMERIC(18,4) NOT NULL DEFAULT 0,
  ADD COLUMN "staffUserId" TEXT,
  ADD COLUMN "deviceId" TEXT,
  ADD COLUMN "latitude" NUMERIC(10,7),
  ADD COLUMN "longitude" NUMERIC(10,7),
  ADD COLUMN "partialExceptionReason" TEXT;
UPDATE "DeliveryRecord" AS delivery SET "seasonId" = card."seasonId"
FROM "Share" AS share JOIN "ShareCard" AS card ON card."id" = share."shareCardId"
WHERE share."id" = delivery."shareId";
ALTER TABLE "DeliveryRecord" DROP CONSTRAINT "DeliveryRecord_status_check";
ALTER TABLE "DeliveryRecord" ADD CONSTRAINT "DeliveryRecord_status_check" CHECK ("status" IN ('pending','partial','delivered','reversed'));
ALTER TABLE "DeliveryRecord" ADD CONSTRAINT "DeliveryRecord_deliveryType_check" CHECK ("deliveryType" IN ('on_site','address'));
ALTER TABLE "DeliveryRecord" ADD CONSTRAINT "DeliveryRecord_serviceFee_check" CHECK ("serviceFee" >= 0);
ALTER TABLE "DeliveryRecord" ADD CONSTRAINT "DeliveryRecord_location_check" CHECK (("latitude" IS NULL AND "longitude" IS NULL) OR ("latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180));
CREATE UNIQUE INDEX "DeliveryRecord_one_completed_per_share" ON "DeliveryRecord"("shareId") WHERE "status" = 'delivered';
CREATE INDEX "DeliveryRecord_seasonId_deliveryType_status_idx" ON "DeliveryRecord"("seasonId", "deliveryType", "status");

CREATE TABLE "DeliveryPackageLink" (
  "deliveryRecordId" TEXT NOT NULL,
  "packageRecordId" TEXT NOT NULL,
  "scannedAt" TIMESTAMP(3) NOT NULL,
  "scannedByUserId" TEXT NOT NULL,
  "deviceId" TEXT,
  CONSTRAINT "DeliveryPackageLink_pkey" PRIMARY KEY ("deliveryRecordId", "packageRecordId"),
  CONSTRAINT "DeliveryPackageLink_deliveryRecordId_fkey" FOREIGN KEY ("deliveryRecordId") REFERENCES "DeliveryRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "DeliveryPackageLink_packageRecordId_fkey" FOREIGN KEY ("packageRecordId") REFERENCES "PackageRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "DeliveryPackageLink_packageRecordId_idx" ON "DeliveryPackageLink"("packageRecordId");

ALTER TABLE "DeliveryProof"
  ADD COLUMN "mimeType" TEXT,
  ADD COLUMN "sizeBytes" INTEGER,
  ADD COLUMN "checksumSha256" TEXT,
  ADD COLUMN "capturedByUserId" TEXT,
  ADD COLUMN "deviceId" TEXT;
ALTER TABLE "DeliveryProof" ADD CONSTRAINT "DeliveryProof_sizeBytes_check" CHECK ("sizeBytes" IS NULL OR "sizeBytes" > 0);

ALTER TABLE "OfflineQueueItem"
  ADD COLUMN "tenantInstanceId" TEXT,
  ADD COLUMN "seasonId" TEXT,
  ADD COLUMN "actorUserId" TEXT,
  ADD COLUMN "deviceId" TEXT,
  ADD COLUMN "sessionId" TEXT,
  ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "expectedVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "nextAttemptAt" TIMESTAMP(3),
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ADD COLUMN "lastErrorCode" TEXT,
  ADD COLUMN "conflictCode" TEXT,
  ADD COLUMN "serverResultId" TEXT;
ALTER TABLE "OfflineQueueItem" DROP CONSTRAINT "OfflineQueueItem_status_check";
ALTER TABLE "OfflineQueueItem" ADD CONSTRAINT "OfflineQueueItem_status_check" CHECK ("status" IN ('queued','syncing','synced','conflict','failed','poisoned','expired'));
ALTER TABLE "OfflineQueueItem" ADD CONSTRAINT "OfflineQueueItem_attempts_check" CHECK ("attempts" >= 0);
ALTER TABLE "OfflineQueueItem" ADD CONSTRAINT "OfflineQueueItem_sessionVersion_check" CHECK ("sessionVersion" > 0);
CREATE INDEX "OfflineQueueItem_seasonId_actorUserId_deviceId_status_idx" ON "OfflineQueueItem"("seasonId", "actorUserId", "deviceId", "status");

CREATE TABLE "OfflineQueueAttempt" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "offlineQueueItemId" TEXT NOT NULL,
  "attemptNo" INTEGER NOT NULL,
  "outcome" TEXT NOT NULL,
  "safeErrorCode" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OfflineQueueAttempt_offlineQueueItemId_fkey" FOREIGN KEY ("offlineQueueItemId") REFERENCES "OfflineQueueItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "OfflineQueueAttempt_item_attempt_key" ON "OfflineQueueAttempt"("offlineQueueItemId", "attemptNo");
