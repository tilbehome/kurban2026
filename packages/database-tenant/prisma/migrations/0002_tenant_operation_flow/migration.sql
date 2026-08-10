CREATE TABLE "ProxyDocument" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "storageKey" TEXT NOT NULL,
  "signedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProxyDocument_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProxyDocument_status_check" CHECK ("status" IN ('draft', 'signed', 'revoked', 'lost')),
  CONSTRAINT "ProxyDocument_storage_check" CHECK ("storageKey" NOT LIKE 'public/%')
);

CREATE TABLE "ProxyDocumentShare" (
  "proxyDocumentId" TEXT NOT NULL,
  "shareId" TEXT NOT NULL,
  CONSTRAINT "ProxyDocumentShare_pkey" PRIMARY KEY ("proxyDocumentId","shareId")
);

CREATE TABLE "QrToken" (
  "id" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "opaqueToken" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QrToken_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QrToken_purpose_check" CHECK ("purpose" IN ('proxyDocument', 'slaughterCheck', 'package', 'delivery', 'customerTracking'))
);

CREATE TABLE "SlaughterJob" (
  "id" TEXT NOT NULL,
  "seasonId" TEXT NOT NULL,
  "animalId" TEXT NOT NULL,
  "shareCardId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "queueNo" INTEGER,
  "assignedUserId" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SlaughterJob_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SlaughterJob_status_check" CHECK ("status" IN ('waiting', 'ready', 'slaughtering', 'weighing', 'packing', 'ready_for_delivery', 'delivered', 'exception'))
);

CREATE TABLE "WeighingRecord" (
  "id" TEXT NOT NULL,
  "animalId" TEXT NOT NULL,
  "carcassWeightKg" DECIMAL(12,3) NOT NULL,
  "recordedByUserId" TEXT NOT NULL,
  "recordedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WeighingRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PackageRecord" (
  "id" TEXT NOT NULL,
  "shareId" TEXT NOT NULL,
  "grossWeightKg" DECIMAL(12,3) NOT NULL,
  "labelNo" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PackageRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeliveryRecord" (
  "id" TEXT NOT NULL,
  "shareId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "deliveredAt" TIMESTAMP(3),
  "reversedAt" TIMESTAMP(3),
  "reversalReason" TEXT,
  CONSTRAINT "DeliveryRecord_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DeliveryRecord_status_check" CHECK ("status" IN ('pending', 'delivered', 'reversed'))
);

CREATE TABLE "OfflineQueueItem" (
  "id" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OfflineQueueItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OfflineQueueItem_status_check" CHECK ("status" IN ('queued', 'syncing', 'synced', 'conflict', 'failed'))
);

CREATE TABLE "DeviceAdapter" (
  "id" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "capabilities" JSONB NOT NULL,
  "enabled" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DeviceAdapter_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DeviceAdapter_kind_check" CHECK ("kind" IN ('scale', 'barcode_reader', 'qr_reader', 'label_printer', 'thermal_printer', 'tv_display'))
);

CREATE UNIQUE INDEX "QrToken_opaqueToken_key" ON "QrToken"("opaqueToken");
CREATE UNIQUE INDEX "PackageRecord_labelNo_key" ON "PackageRecord"("labelNo");
CREATE UNIQUE INDEX "OfflineQueueItem_idempotencyKey_key" ON "OfflineQueueItem"("idempotencyKey");
CREATE INDEX "ProxyDocument_customerId_idx" ON "ProxyDocument"("customerId");
CREATE INDEX "QrToken_purpose_idx" ON "QrToken"("purpose");
CREATE INDEX "QrToken_targetId_idx" ON "QrToken"("targetId");
CREATE INDEX "SlaughterJob_seasonId_idx" ON "SlaughterJob"("seasonId");
CREATE INDEX "SlaughterJob_animalId_idx" ON "SlaughterJob"("animalId");
CREATE INDEX "SlaughterJob_shareCardId_idx" ON "SlaughterJob"("shareCardId");
CREATE INDEX "SlaughterJob_queueNo_idx" ON "SlaughterJob"("queueNo");
CREATE INDEX "WeighingRecord_animalId_idx" ON "WeighingRecord"("animalId");
CREATE INDEX "PackageRecord_shareId_idx" ON "PackageRecord"("shareId");
CREATE INDEX "DeliveryRecord_shareId_idx" ON "DeliveryRecord"("shareId");
CREATE INDEX "DeliveryRecord_customerId_idx" ON "DeliveryRecord"("customerId");
CREATE INDEX "OfflineQueueItem_status_idx" ON "OfflineQueueItem"("status");
CREATE INDEX "DeviceAdapter_kind_idx" ON "DeviceAdapter"("kind");

ALTER TABLE "ProxyDocument" ADD CONSTRAINT "ProxyDocument_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProxyDocumentShare" ADD CONSTRAINT "ProxyDocumentShare_proxyDocumentId_fkey" FOREIGN KEY ("proxyDocumentId") REFERENCES "ProxyDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProxyDocumentShare" ADD CONSTRAINT "ProxyDocumentShare_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "Share"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SlaughterJob" ADD CONSTRAINT "SlaughterJob_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SlaughterJob" ADD CONSTRAINT "SlaughterJob_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SlaughterJob" ADD CONSTRAINT "SlaughterJob_shareCardId_fkey" FOREIGN KEY ("shareCardId") REFERENCES "ShareCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WeighingRecord" ADD CONSTRAINT "WeighingRecord_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PackageRecord" ADD CONSTRAINT "PackageRecord_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "Share"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DeliveryRecord" ADD CONSTRAINT "DeliveryRecord_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "Share"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DeliveryRecord" ADD CONSTRAINT "DeliveryRecord_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
