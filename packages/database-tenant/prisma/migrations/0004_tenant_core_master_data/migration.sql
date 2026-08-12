-- Faz 2D-4: firma çekirdeği, müşteri/sezon carisi, tedarik ve hayvan ana verisi.
-- Mevcut Faz 2C tabloları ve legacy uyumluluk kolonları korunur.

ALTER TABLE "Season"
  ADD COLUMN "locationId" TEXT,
  ADD COLUMN "year" INTEGER,
  ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE TABLE "BusinessProfile" (
  "id" TEXT NOT NULL,
  "legalName" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "taxOffice" TEXT,
  "taxNumber" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "defaultCurrency" TEXT NOT NULL DEFAULT 'TRY',
  "locale" TEXT NOT NULL DEFAULT 'tr-TR',
  "timeZone" TEXT NOT NULL DEFAULT 'Europe/Istanbul',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Location" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "addressLine" TEXT,
  "district" TEXT,
  "city" TEXT,
  "phone" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Location_code_key" ON "Location"("code");

CREATE TABLE "Setting" (
  "id" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "updatedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Setting_scope_key_key" ON "Setting"("scope", "key");

ALTER TABLE "Season" ADD CONSTRAINT "Season_locationId_fkey"
  FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Season_locationId_idx" ON "Season"("locationId");
CREATE INDEX "Season_status_idx" ON "Season"("status");

ALTER TABLE "Customer"
  ALTER COLUMN "seasonId" DROP NOT NULL,
  ADD COLUMN "normalizedName" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "identityNumber" TEXT,
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

UPDATE "Customer"
SET "normalizedName" = upper(trim(regexp_replace("displayName", '\s+', ' ', 'g')))
WHERE "normalizedName" = '';

CREATE INDEX "Customer_normalizedName_idx" ON "Customer"("normalizedName");
CREATE INDEX "Customer_active_idx" ON "Customer"("active");

CREATE TABLE "CustomerPhone" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "label" TEXT,
  "phone" TEXT NOT NULL,
  "normalizedPhone" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CustomerPhone_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CustomerPhone_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "CustomerPhone_customerId_idx" ON "CustomerPhone"("customerId");
CREATE INDEX "CustomerPhone_normalizedPhone_idx" ON "CustomerPhone"("normalizedPhone");
CREATE UNIQUE INDEX "CustomerPhone_one_primary_per_customer"
  ON "CustomerPhone"("customerId") WHERE "isPrimary" = true;

INSERT INTO "CustomerPhone" ("id", "customerId", "phone", "normalizedPhone", "isPrimary", "updatedAt")
SELECT 'phone_' || "id", "id", "phone", "normalizedPhone", true, CURRENT_TIMESTAMP
FROM "Customer" WHERE "phone" IS NOT NULL AND "normalizedPhone" IS NOT NULL;

CREATE TABLE "CustomerAddress" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "label" TEXT,
  "addressLine" TEXT NOT NULL,
  "district" TEXT,
  "city" TEXT,
  "postalCode" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CustomerAddress_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CustomerAddress_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "CustomerAddress_customerId_idx" ON "CustomerAddress"("customerId");
CREATE UNIQUE INDEX "CustomerAddress_one_primary_per_customer"
  ON "CustomerAddress"("customerId") WHERE "isPrimary" = true;

CREATE TABLE "CustomerSeasonAccount" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "seasonId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "debitTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "creditTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "balance" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CustomerSeasonAccount_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CustomerSeasonAccount_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CustomerSeasonAccount_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CustomerSeasonAccount_customerId_seasonId_key" ON "CustomerSeasonAccount"("customerId", "seasonId");
CREATE INDEX "CustomerSeasonAccount_seasonId_idx" ON "CustomerSeasonAccount"("seasonId");

INSERT INTO "CustomerSeasonAccount" ("id", "customerId", "seasonId", "updatedAt")
SELECT 'account_' || "id" || '_' || "seasonId", "id", "seasonId", CURRENT_TIMESTAMP
FROM "Customer" WHERE "seasonId" IS NOT NULL
ON CONFLICT ("customerId", "seasonId") DO NOTHING;

ALTER TABLE "Supplier"
  ADD COLUMN "normalizedName" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
UPDATE "Supplier" SET "normalizedName" = upper(trim(regexp_replace("displayName", '\s+', ' ', 'g')));
CREATE INDEX "Supplier_normalizedName_idx" ON "Supplier"("normalizedName");

CREATE TABLE "SupplierAccount" (
  "id" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "seasonId" TEXT NOT NULL,
  "debitTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "creditTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "balance" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupplierAccount_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SupplierAccount_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupplierAccount_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "SupplierAccount_supplierId_seasonId_key" ON "SupplierAccount"("supplierId", "seasonId");
CREATE INDEX "SupplierAccount_seasonId_idx" ON "SupplierAccount"("seasonId");

CREATE TABLE "PurchaseInvoice" (
  "id" TEXT NOT NULL, "supplierId" TEXT NOT NULL, "seasonId" TEXT NOT NULL,
  "invoiceNo" TEXT NOT NULL, "invoiceDate" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'posted', "currency" TEXT NOT NULL DEFAULT 'TRY',
  "subtotal" DECIMAL(18,4) NOT NULL, "taxTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "grandTotal" DECIMAL(18,4) NOT NULL, "idempotencyKey" TEXT NOT NULL,
  "reversalOfId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PurchaseInvoice_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PurchaseInvoice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PurchaseInvoice_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PurchaseInvoice_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "PurchaseInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PurchaseInvoice_idempotencyKey_key" ON "PurchaseInvoice"("idempotencyKey");
CREATE UNIQUE INDEX "PurchaseInvoice_supplierId_invoiceNo_key" ON "PurchaseInvoice"("supplierId", "invoiceNo");
CREATE INDEX "PurchaseInvoice_seasonId_idx" ON "PurchaseInvoice"("seasonId");

CREATE TABLE "ExpenseDocument" (
  "id" TEXT NOT NULL, "seasonId" TEXT NOT NULL, "documentNo" TEXT,
  "category" TEXT NOT NULL, "description" TEXT NOT NULL,
  "amount" DECIMAL(18,4) NOT NULL, "currency" TEXT NOT NULL DEFAULT 'TRY',
  "sourceType" TEXT NOT NULL, "sourceRef" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL, "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExpenseDocument_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ExpenseDocument_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ExpenseDocument_idempotencyKey_key" ON "ExpenseDocument"("idempotencyKey");
CREATE UNIQUE INDEX "ExpenseDocument_sourceType_sourceRef_key" ON "ExpenseDocument"("sourceType", "sourceRef");
CREATE INDEX "ExpenseDocument_seasonId_idx" ON "ExpenseDocument"("seasonId");

CREATE TABLE "PurchaseInvoiceLine" (
  "id" TEXT NOT NULL, "purchaseInvoiceId" TEXT NOT NULL, "lineNo" INTEGER NOT NULL,
  "description" TEXT NOT NULL, "animalId" TEXT, "quantity" DECIMAL(12,3) NOT NULL DEFAULT 1,
  "unitPrice" DECIMAL(18,4) NOT NULL, "lineTotal" DECIMAL(18,4) NOT NULL,
  "expenseDocumentId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PurchaseInvoiceLine_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PurchaseInvoiceLine_purchaseInvoiceId_fkey" FOREIGN KEY ("purchaseInvoiceId") REFERENCES "PurchaseInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PurchaseInvoiceLine_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PurchaseInvoiceLine_expenseDocumentId_fkey" FOREIGN KEY ("expenseDocumentId") REFERENCES "ExpenseDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PurchaseInvoiceLine_animalId_key" ON "PurchaseInvoiceLine"("animalId");
CREATE UNIQUE INDEX "PurchaseInvoiceLine_purchaseInvoiceId_lineNo_key" ON "PurchaseInvoiceLine"("purchaseInvoiceId", "lineNo");

CREATE TABLE "SupplierPayment" (
  "id" TEXT NOT NULL, "supplierId" TEXT NOT NULL, "seasonId" TEXT NOT NULL,
  "amount" DECIMAL(18,4) NOT NULL, "method" TEXT NOT NULL, "referenceNo" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL, "idempotencyKey" TEXT NOT NULL,
  "reversalOfId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupplierPayment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SupplierPayment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupplierPayment_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "SupplierPayment_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "SupplierPayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "SupplierPayment_idempotencyKey_key" ON "SupplierPayment"("idempotencyKey");
CREATE INDEX "SupplierPayment_supplierId_seasonId_idx" ON "SupplierPayment"("supplierId", "seasonId");

ALTER TABLE "Animal"
  ADD COLUMN "qurbanEligibility" TEXT NOT NULL DEFAULT 'undecided',
  ADD COLUMN "notes" TEXT;

CREATE TABLE "AnimalWeight" (
  "id" TEXT NOT NULL, "animalId" TEXT NOT NULL, "kind" TEXT NOT NULL,
  "weightKg" DECIMAL(12,3) NOT NULL, "measuredAt" TIMESTAMP(3) NOT NULL,
  "recordedByUserId" TEXT NOT NULL, "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnimalWeight_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AnimalWeight_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "AnimalWeight_animalId_measuredAt_idx" ON "AnimalWeight"("animalId", "measuredAt");

CREATE TABLE "AnimalHealthEvent" (
  "id" TEXT NOT NULL, "animalId" TEXT NOT NULL, "eventType" TEXT NOT NULL,
  "status" TEXT NOT NULL, "notes" TEXT, "occurredAt" TIMESTAMP(3) NOT NULL,
  "recordedByUserId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnimalHealthEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AnimalHealthEvent_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "AnimalHealthEvent_animalId_occurredAt_idx" ON "AnimalHealthEvent"("animalId", "occurredAt");

CREATE TABLE "QurbanAssignment" (
  "id" TEXT NOT NULL, "seasonId" TEXT NOT NULL, "animalId" TEXT NOT NULL,
  "qurbanNo" TEXT, "queueNo" INTEGER, "active" BOOLEAN NOT NULL DEFAULT true,
  "reason" TEXT, "assignedByUserId" TEXT NOT NULL, "assignedAt" TIMESTAMP(3) NOT NULL,
  "endedAt" TIMESTAMP(3), "previousId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QurbanAssignment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QurbanAssignment_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "QurbanAssignment_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "QurbanAssignment_previousId_fkey" FOREIGN KEY ("previousId") REFERENCES "QurbanAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "QurbanAssignment_seasonId_queueNo_idx" ON "QurbanAssignment"("seasonId", "queueNo");
CREATE INDEX "QurbanAssignment_animalId_active_idx" ON "QurbanAssignment"("animalId", "active");
CREATE UNIQUE INDEX "QurbanAssignment_one_active_per_animal" ON "QurbanAssignment"("animalId") WHERE "active" = true;
CREATE UNIQUE INDEX "QurbanAssignment_active_queue_per_season" ON "QurbanAssignment"("seasonId", "queueNo") WHERE "active" = true AND "queueNo" IS NOT NULL;

CREATE TABLE "TenantIdempotencyRecord" (
  "key" TEXT NOT NULL, "scope" TEXT NOT NULL, "actorUserId" TEXT NOT NULL,
  "requestId" TEXT NOT NULL, "requestHash" TEXT NOT NULL, "resultType" TEXT,
  "resultId" TEXT, "resultPayload" JSONB, "status" TEXT NOT NULL DEFAULT 'processing',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "completedAt" TIMESTAMP(3),
  CONSTRAINT "TenantIdempotencyRecord_pkey" PRIMARY KEY ("key")
);
CREATE INDEX "TenantIdempotencyRecord_scope_actorUserId_idx" ON "TenantIdempotencyRecord"("scope", "actorUserId");
