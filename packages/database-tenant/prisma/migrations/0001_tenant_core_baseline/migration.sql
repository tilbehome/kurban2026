CREATE TABLE "Season" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Season_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Season_status_check" CHECK ("status" IN ('preparation', 'sales', 'slaughter', 'delivery', 'reconciliation', 'archived'))
);

CREATE TABLE "Customer" (
  "id" TEXT NOT NULL,
  "seasonId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "phone" TEXT,
  "normalizedPhone" TEXT,
  "kvkkConsentAt" TIMESTAMP(3),
  "communicationConsentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Supplier" (
  "id" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "phone" TEXT,
  "taxNumber" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Animal" (
  "id" TEXT NOT NULL,
  "seasonId" TEXT NOT NULL,
  "supplierId" TEXT,
  "earTag" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "purchaseAmount" DECIMAL(18,4),
  "liveWeightKg" DECIMAL(12,3),
  "carcassWeightKg" DECIMAL(12,3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Animal_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Animal_status_check" CHECK ("status" IN ('draft', 'available', 'reserved', 'sold_out', 'slaughtered', 'delivered', 'cancelled'))
);

CREATE TABLE "ShareCard" (
  "id" TEXT NOT NULL,
  "seasonId" TEXT NOT NULL,
  "animalId" TEXT NOT NULL,
  "displayNo" TEXT,
  "targetShareCount" INTEGER NOT NULL DEFAULT 7,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShareCard_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ShareCard_target_count_check" CHECK ("targetShareCount" = 7)
);

CREATE TABLE "Share" (
  "id" TEXT NOT NULL,
  "shareCardId" TEXT NOT NULL,
  "sequenceNo" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "customerId" TEXT,
  "agreedPrice" DECIMAL(18,4),
  "reservedUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Share_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Share_sequence_check" CHECK ("sequenceNo" BETWEEN 1 AND 7),
  CONSTRAINT "Share_status_check" CHECK ("status" IN ('available', 'reserved', 'sold', 'cancelled', 'delivered'))
);

CREATE TABLE "Sale" (
  "id" TEXT NOT NULL,
  "seasonId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "priceSnapshot" DECIMAL(18,4) NOT NULL,
  "discountAmount" DECIMAL(18,4),
  "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Sale_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Sale_status_check" CHECK ("status" IN ('draft', 'confirmed', 'cancelled', 'reversed'))
);

CREATE TABLE "SaleShare" (
  "saleId" TEXT NOT NULL,
  "shareId" TEXT NOT NULL,
  CONSTRAINT "SaleShare_pkey" PRIMARY KEY ("saleId","shareId")
);

CREATE TABLE "LedgerEntry" (
  "id" TEXT NOT NULL,
  "seasonId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "amount" DECIMAL(18,4) NOT NULL,
  "currency" TEXT NOT NULL,
  "saleId" TEXT,
  "customerId" TEXT,
  "reversalOfEntryId" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LedgerEntry_type_check" CHECK ("type" IN ('sale', 'payment', 'discount', 'expense', 'refund', 'reversal', 'adjustment')),
  CONSTRAINT "LedgerEntry_currency_check" CHECK ("currency" = 'TRY')
);

CREATE TABLE "TenantAuditLog" (
  "id" TEXT NOT NULL,
  "actorUserId" TEXT,
  "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT,
  "requestId" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "metadata" JSONB,
  CONSTRAINT "TenantAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TenantOutboxMessage" (
  "id" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" TEXT NOT NULL,
  "idempotencyKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TenantOutboxMessage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TenantOutboxMessage_status_check" CHECK ("status" IN ('pending', 'processing', 'sent', 'failed', 'dead'))
);

CREATE UNIQUE INDEX "Animal_seasonId_earTag_key" ON "Animal"("seasonId", "earTag");
CREATE UNIQUE INDEX "Share_shareCardId_sequenceNo_key" ON "Share"("shareCardId", "sequenceNo");
CREATE UNIQUE INDEX "Sale_idempotencyKey_key" ON "Sale"("idempotencyKey");
CREATE INDEX "Customer_seasonId_idx" ON "Customer"("seasonId");
CREATE INDEX "Customer_normalizedPhone_idx" ON "Customer"("normalizedPhone");
CREATE INDEX "Animal_supplierId_idx" ON "Animal"("supplierId");
CREATE INDEX "ShareCard_seasonId_idx" ON "ShareCard"("seasonId");
CREATE INDEX "ShareCard_animalId_idx" ON "ShareCard"("animalId");
CREATE INDEX "Share_customerId_idx" ON "Share"("customerId");
CREATE INDEX "Sale_seasonId_idx" ON "Sale"("seasonId");
CREATE INDEX "Sale_customerId_idx" ON "Sale"("customerId");
CREATE INDEX "LedgerEntry_seasonId_idx" ON "LedgerEntry"("seasonId");
CREATE INDEX "LedgerEntry_saleId_idx" ON "LedgerEntry"("saleId");
CREATE INDEX "LedgerEntry_customerId_idx" ON "LedgerEntry"("customerId");
CREATE INDEX "LedgerEntry_reversalOfEntryId_idx" ON "LedgerEntry"("reversalOfEntryId");
CREATE INDEX "TenantAuditLog_requestId_idx" ON "TenantAuditLog"("requestId");
CREATE INDEX "TenantAuditLog_actorUserId_idx" ON "TenantAuditLog"("actorUserId");
CREATE INDEX "TenantOutboxMessage_status_idx" ON "TenantOutboxMessage"("status");
CREATE INDEX "TenantOutboxMessage_idempotencyKey_idx" ON "TenantOutboxMessage"("idempotencyKey");

ALTER TABLE "Customer" ADD CONSTRAINT "Customer_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ShareCard" ADD CONSTRAINT "ShareCard_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShareCard" ADD CONSTRAINT "ShareCard_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Share" ADD CONSTRAINT "Share_shareCardId_fkey" FOREIGN KEY ("shareCardId") REFERENCES "ShareCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Share" ADD CONSTRAINT "Share_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaleShare" ADD CONSTRAINT "SaleShare_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaleShare" ADD CONSTRAINT "SaleShare_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "Share"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_reversalOfEntryId_fkey" FOREIGN KEY ("reversalOfEntryId") REFERENCES "LedgerEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
