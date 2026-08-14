-- Faturalar 360 mevcut PurchaseInvoice aggregate'ini kontrollü biçimde genişletir.
-- Mevcut alış faturaları korunur; ikinci bir paralel fatura tablosu oluşturulmaz.

ALTER TABLE "PurchaseInvoice" ALTER COLUMN "supplierId" DROP NOT NULL;
ALTER TABLE "PurchaseInvoice"
  ADD COLUMN "organizationId" TEXT,
  ADD COLUMN "customerId" TEXT,
  ADD COLUMN "locationId" TEXT,
  ADD COLUMN "uuid" TEXT,
  ADD COLUMN "series" TEXT,
  ADD COLUMN "dueDate" TIMESTAMP(3),
  ADD COLUMN "direction" TEXT NOT NULL DEFAULT 'INBOUND',
  ADD COLUMN "tradeType" TEXT NOT NULL DEFAULT 'PURCHASE',
  ADD COLUMN "documentNature" TEXT NOT NULL DEFAULT 'STANDARD',
  ADD COLUMN "electronicChannel" TEXT NOT NULL DEFAULT 'NONE',
  ADD COLUMN "accountingStatus" TEXT NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
  ADD COLUMN "electronicStatus" TEXT NOT NULL DEFAULT 'NOT_APPLICABLE',
  ADD COLUMN "partyTaxIdentity" TEXT,
  ADD COLUMN "partySnapshot" JSONB,
  ADD COLUMN "discountTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
  ADD COLUMN "paidTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
  ADD COLUMN "requestId" TEXT,
  ADD COLUMN "providerKey" TEXT,
  ADD COLUMN "providerReference" TEXT,
  ADD COLUMN "originalInvoiceId" TEXT,
  ADD COLUMN "journalEntryId" TEXT,
  ADD COLUMN "createdByUserId" TEXT,
  ADD COLUMN "approvedByUserId" TEXT,
  ADD COLUMN "postedByUserId" TEXT,
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "postedAt" TIMESTAMP(3),
  ADD COLUMN "cancelledAt" TIMESTAMP(3);

UPDATE "PurchaseInvoice"
SET
  "organizationId" = 'tenant-local',
  "uuid" = "id",
  "partySnapshot" = jsonb_build_object('supplierId', "supplierId"),
  "requestId" = 'migration-0008',
  "createdByUserId" = 'migration-0008',
  "postedByUserId" = 'migration-0008',
  "postedAt" = "createdAt",
  "accountingStatus" = CASE WHEN lower("status") = 'posted' THEN 'POSTED' ELSE 'DRAFT' END;

ALTER TABLE "PurchaseInvoice" DROP COLUMN "status";

ALTER TABLE "PurchaseInvoice"
  ALTER COLUMN "organizationId" SET NOT NULL,
  ALTER COLUMN "uuid" SET NOT NULL,
  ALTER COLUMN "partySnapshot" SET NOT NULL,
  ALTER COLUMN "requestId" SET NOT NULL,
  ALTER COLUMN "createdByUserId" SET NOT NULL;

ALTER TABLE "PurchaseInvoice" DROP CONSTRAINT IF EXISTS "PurchaseInvoice_supplierId_invoiceNo_key";
CREATE UNIQUE INDEX "PurchaseInvoice_uuid_key" ON "PurchaseInvoice"("uuid");
CREATE UNIQUE INDEX "PurchaseInvoice_organizationId_invoiceNo_key" ON "PurchaseInvoice"("organizationId", "invoiceNo");
CREATE UNIQUE INDEX "PurchaseInvoice_journalEntryId_key" ON "PurchaseInvoice"("journalEntryId");
CREATE INDEX "PurchaseInvoice_seasonId_invoiceDate_idx" ON "PurchaseInvoice"("seasonId", "invoiceDate");
CREATE INDEX "PurchaseInvoice_locationId_idx" ON "PurchaseInvoice"("locationId");
CREATE INDEX "PurchaseInvoice_supplierId_idx" ON "PurchaseInvoice"("supplierId");
CREATE INDEX "PurchaseInvoice_customerId_idx" ON "PurchaseInvoice"("customerId");
CREATE INDEX "PurchaseInvoice_status_axes_idx" ON "PurchaseInvoice"("accountingStatus", "paymentStatus", "electronicStatus");
CREATE INDEX "PurchaseInvoice_provider_reference_idx" ON "PurchaseInvoice"("providerKey", "providerReference");

ALTER TABLE "PurchaseInvoice"
  ADD CONSTRAINT "PurchaseInvoice_party_check" CHECK (
    ("tradeType" = 'PURCHASE' AND "supplierId" IS NOT NULL AND "customerId" IS NULL)
    OR
    ("tradeType" = 'SALES' AND "customerId" IS NOT NULL AND "supplierId" IS NULL)
  ),
  ADD CONSTRAINT "PurchaseInvoice_nature_check" CHECK (
    ("documentNature" = 'STANDARD' AND "originalInvoiceId" IS NULL)
    OR
    ("documentNature" = 'RETURN' AND "originalInvoiceId" IS NOT NULL)
  ),
  ADD CONSTRAINT "PurchaseInvoice_amounts_check" CHECK (
    "subtotal" >= 0 AND "discountTotal" >= 0 AND "taxTotal" >= 0 AND "grandTotal" >= 0 AND "paidTotal" >= 0
  ),
  ADD CONSTRAINT "PurchaseInvoice_direction_check" CHECK ("direction" IN ('INBOUND','OUTBOUND')),
  ADD CONSTRAINT "PurchaseInvoice_electronic_channel_check" CHECK ("electronicChannel" IN ('NONE','EFATURA','EARSIV')),
  ADD CONSTRAINT "PurchaseInvoice_accounting_status_check" CHECK ("accountingStatus" IN ('DRAFT','APPROVAL_PENDING','APPROVED','POSTED','REVERSED','CANCELLED')),
  ADD CONSTRAINT "PurchaseInvoice_payment_status_check" CHECK ("paymentStatus" IN ('UNPAID','PARTIALLY_PAID','PAID','OVERPAID','REFUNDED')),
  ADD CONSTRAINT "PurchaseInvoice_electronic_status_check" CHECK ("electronicStatus" IN ('NOT_APPLICABLE','PREPARING','QUEUED','SENDING','SENT','DELIVERED','ACCEPTED','REJECTED','FAILED','CANCEL_REQUESTED','CANCELLED','OBJECTED'));

ALTER TABLE "PurchaseInvoice"
  ADD CONSTRAINT "PurchaseInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "PurchaseInvoice_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "PurchaseInvoice_originalInvoiceId_fkey" FOREIGN KEY ("originalInvoiceId") REFERENCES "PurchaseInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "PurchaseInvoice_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "FinancialAccount" ("id", "code", "name", "type", "normalSide", "currency", "active", "createdAt", "updatedAt")
VALUES
  ('financial_account_inventory', 'INVENTORY', 'Stok ve Hayvan Maliyeti', 'asset', 'debit', 'TRY', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('financial_account_accounts_payable', 'ACCOUNTS_PAYABLE', 'Tedarikçi Borçları', 'liability', 'credit', 'TRY', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "JournalEntry" ("id", "seasonId", "sourceType", "sourceId", "status", "currency", "memo", "idempotencyKey", "occurredAt", "postedAt", "createdAt")
SELECT 'journal_invoice_' || p."id", p."seasonId", 'invoice', p."id", 'posted', p."currency", 'PURCHASE_INVOICE_MIGRATED', 'migration:invoice:' || p."id", p."invoiceDate", COALESCE(p."postedAt", p."createdAt"), p."createdAt"
FROM "PurchaseInvoice" p
WHERE p."accountingStatus" = 'POSTED' AND p."journalEntryId" IS NULL
ON CONFLICT ("sourceType", "sourceId") DO NOTHING;

INSERT INTO "JournalLine" ("id", "journalEntryId", "accountId", "side", "amount", "currency", "memo")
SELECT 'journal_invoice_' || p."id" || '_debit', j."id", a."id", 'debit', p."grandTotal", p."currency", 'PURCHASE_COST_MIGRATED'
FROM "PurchaseInvoice" p
JOIN "JournalEntry" j ON j."sourceType" = 'invoice' AND j."sourceId" = p."id"
JOIN "FinancialAccount" a ON a."code" = 'INVENTORY'
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "JournalLine" ("id", "journalEntryId", "accountId", "side", "amount", "currency", "memo")
SELECT 'journal_invoice_' || p."id" || '_credit', j."id", a."id", 'credit', p."grandTotal", p."currency", 'SUPPLIER_PAYABLE_MIGRATED'
FROM "PurchaseInvoice" p
JOIN "JournalEntry" j ON j."sourceType" = 'invoice' AND j."sourceId" = p."id"
JOIN "FinancialAccount" a ON a."code" = 'ACCOUNTS_PAYABLE'
ON CONFLICT ("id") DO NOTHING;

UPDATE "PurchaseInvoice" p
SET "journalEntryId" = j."id"
FROM "JournalEntry" j
WHERE j."sourceType" = 'invoice' AND j."sourceId" = p."id" AND p."accountingStatus" = 'POSTED';

CREATE TABLE "UnitOfMeasure" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "symbol" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "decimalPrecision" INTEGER NOT NULL DEFAULT 0,
  "allowsFraction" BOOLEAN NOT NULL DEFAULT false,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdByUserId" TEXT NOT NULL,
  "updatedByUserId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UnitOfMeasure_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UnitOfMeasure_category_check" CHECK ("category" IN ('COUNT','WEIGHT','LENGTH','AREA','VOLUME','TIME','PACKAGE','SERVICE','CUSTOM')),
  CONSTRAINT "UnitOfMeasure_precision_check" CHECK ("decimalPrecision" BETWEEN 0 AND 6),
  CONSTRAINT "UnitOfMeasure_fraction_precision_check" CHECK ("allowsFraction" OR "decimalPrecision" = 0),
  CONSTRAINT "UnitOfMeasure_system_tenant_check" CHECK (("isSystem" = true AND "tenantId" = 'SYSTEM') OR ("isSystem" = false AND "tenantId" <> 'SYSTEM'))
);
CREATE UNIQUE INDEX "UnitOfMeasure_tenantId_code_key" ON "UnitOfMeasure"("tenantId", "code");
CREATE INDEX "UnitOfMeasure_tenant_category_active_idx" ON "UnitOfMeasure"("tenantId", "category", "isActive", "sortOrder");

INSERT INTO "UnitOfMeasure" ("id", "tenantId", "code", "name", "symbol", "category", "decimalPrecision", "allowsFraction", "isSystem", "isActive", "sortOrder", "createdByUserId", "updatedByUserId", "version", "createdAt", "updatedAt")
VALUES
  ('uom_system_adet', 'SYSTEM', 'ADET', 'Adet', 'ad', 'COUNT', 0, false, true, true, 10, 'system-seed', 'system-seed', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('uom_system_kg', 'SYSTEM', 'KG', 'Kilogram', 'kg', 'WEIGHT', 3, true, true, true, 20, 'system-seed', 'system-seed', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('uom_system_gr', 'SYSTEM', 'GR', 'Gram', 'g', 'WEIGHT', 3, true, true, true, 30, 'system-seed', 'system-seed', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('uom_system_ton', 'SYSTEM', 'TON', 'Ton', 't', 'WEIGHT', 3, true, true, true, 40, 'system-seed', 'system-seed', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('uom_system_lt', 'SYSTEM', 'LT', 'Litre', 'L', 'VOLUME', 3, true, true, true, 50, 'system-seed', 'system-seed', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('uom_system_ml', 'SYSTEM', 'ML', 'Mililitre', 'mL', 'VOLUME', 3, true, true, true, 60, 'system-seed', 'system-seed', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('uom_system_metre', 'SYSTEM', 'METRE', 'Metre', 'm', 'LENGTH', 3, true, true, true, 70, 'system-seed', 'system-seed', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('uom_system_cm', 'SYSTEM', 'CM', 'Santimetre', 'cm', 'LENGTH', 2, true, true, true, 80, 'system-seed', 'system-seed', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('uom_system_koli', 'SYSTEM', 'KOLİ', 'Koli', 'koli', 'PACKAGE', 0, false, true, true, 90, 'system-seed', 'system-seed', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('uom_system_paket', 'SYSTEM', 'PAKET', 'Paket', 'paket', 'PACKAGE', 0, false, true, true, 100, 'system-seed', 'system-seed', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('uom_system_kutu', 'SYSTEM', 'KUTU', 'Kutu', 'kutu', 'PACKAGE', 0, false, true, true, 110, 'system-seed', 'system-seed', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('uom_system_palet', 'SYSTEM', 'PALET', 'Palet', 'palet', 'PACKAGE', 0, false, true, true, 120, 'system-seed', 'system-seed', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('uom_system_takim', 'SYSTEM', 'TAKIM', 'Takım', 'takım', 'COUNT', 0, false, true, true, 130, 'system-seed', 'system-seed', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('uom_system_hizmet', 'SYSTEM', 'HİZMET', 'Hizmet', 'hiz.', 'SERVICE', 2, true, true, true, 140, 'system-seed', 'system-seed', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('uom_system_saat', 'SYSTEM', 'SAAT', 'Saat', 'sa', 'TIME', 2, true, true, true, 150, 'system-seed', 'system-seed', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('uom_system_gun', 'SYSTEM', 'GÜN', 'Gün', 'gün', 'TIME', 2, true, true, true, 160, 'system-seed', 'system-seed', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

CREATE OR REPLACE FUNCTION prevent_unit_code_scope_collision() RETURNS trigger AS $$
BEGIN
  IF NEW."tenantId" <> 'SYSTEM' AND EXISTS (
    SELECT 1 FROM "UnitOfMeasure" system_unit
    WHERE system_unit."tenantId" = 'SYSTEM' AND system_unit."code" = NEW."code" AND system_unit."id" <> NEW."id"
  ) THEN
    RAISE EXCEPTION 'UNIT_OF_MEASURE_CODE_COLLIDES_WITH_SYSTEM';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "UnitOfMeasure_prevent_scope_code_collision"
BEFORE INSERT OR UPDATE ON "UnitOfMeasure"
FOR EACH ROW EXECUTE FUNCTION prevent_unit_code_scope_collision();

CREATE TABLE "UnitProviderMapping" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "providerKey" TEXT NOT NULL,
  "mappingVersion" TEXT NOT NULL,
  "unitOfMeasureId" TEXT NOT NULL,
  "providerUnitCode" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UnitProviderMapping_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UnitProviderMapping_unit_fkey" FOREIGN KEY ("unitOfMeasureId") REFERENCES "UnitOfMeasure"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "UnitProviderMapping_scope_unit_key" ON "UnitProviderMapping"("tenantId", "providerKey", "mappingVersion", "unitOfMeasureId");
CREATE INDEX "UnitProviderMapping_scope_active_idx" ON "UnitProviderMapping"("tenantId", "providerKey", "mappingVersion", "isActive");

CREATE OR REPLACE FUNCTION enforce_unit_provider_mapping_scope() RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "UnitOfMeasure" unit
    WHERE unit."id" = NEW."unitOfMeasureId" AND unit."tenantId" IN ('SYSTEM', NEW."tenantId")
  ) THEN
    RAISE EXCEPTION 'UNIT_PROVIDER_MAPPING_TENANT_SCOPE_MISMATCH';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "UnitProviderMapping_enforce_tenant_scope"
BEFORE INSERT OR UPDATE ON "UnitProviderMapping"
FOR EACH ROW EXECUTE FUNCTION enforce_unit_provider_mapping_scope();

ALTER TABLE "PurchaseInvoiceLine"
  ADD COLUMN "unitId" TEXT,
  ADD COLUMN "unitCodeSnapshot" TEXT,
  ADD COLUMN "unitNameSnapshot" TEXT,
  ADD COLUMN "unitSymbolSnapshot" TEXT,
  ADD COLUMN "discountTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
  ADD COLUMN "taxTotal" DECIMAL(18,4) NOT NULL DEFAULT 0,
  ADD COLUMN "saleId" TEXT,
  ADD COLUMN "shareId" TEXT,
  ADD COLUMN "purchaseReference" TEXT;

UPDATE "PurchaseInvoiceLine"
SET "unitId" = 'uom_system_adet', "unitCodeSnapshot" = 'ADET', "unitNameSnapshot" = 'Adet', "unitSymbolSnapshot" = 'ad';
ALTER TABLE "PurchaseInvoiceLine"
  ALTER COLUMN "unitId" SET NOT NULL,
  ALTER COLUMN "unitCodeSnapshot" SET NOT NULL,
  ALTER COLUMN "unitNameSnapshot" SET NOT NULL,
  ALTER COLUMN "unitSymbolSnapshot" SET NOT NULL,
  ADD CONSTRAINT "PurchaseInvoiceLine_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "UnitOfMeasure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "PurchaseInvoiceLine_unitId_idx" ON "PurchaseInvoiceLine"("unitId");

CREATE OR REPLACE FUNCTION protect_used_unit_of_measure() RETURNS trigger AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM "PurchaseInvoiceLine" WHERE "unitId" = OLD."id")
     AND (NEW."code", NEW."name", NEW."symbol", NEW."category", NEW."decimalPrecision", NEW."allowsFraction")
         IS DISTINCT FROM
         (OLD."code", OLD."name", OLD."symbol", OLD."category", OLD."decimalPrecision", OLD."allowsFraction") THEN
    RAISE EXCEPTION 'UNIT_OF_MEASURE_IN_USE_IMMUTABLE';
  END IF;
  IF OLD."isSystem" AND
     (NEW."tenantId", NEW."code", NEW."name", NEW."symbol", NEW."category", NEW."decimalPrecision", NEW."allowsFraction", NEW."isSystem", NEW."isActive", NEW."sortOrder")
       IS DISTINCT FROM
     (OLD."tenantId", OLD."code", OLD."name", OLD."symbol", OLD."category", OLD."decimalPrecision", OLD."allowsFraction", OLD."isSystem", OLD."isActive", OLD."sortOrder") THEN
    RAISE EXCEPTION 'SYSTEM_UNIT_IMMUTABLE';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "UnitOfMeasure_protect_used_update"
BEFORE UPDATE ON "UnitOfMeasure"
FOR EACH ROW EXECUTE FUNCTION protect_used_unit_of_measure();

CREATE OR REPLACE FUNCTION prevent_unit_of_measure_delete() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'UNIT_OF_MEASURE_PHYSICAL_DELETE_FORBIDDEN';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "UnitOfMeasure_prevent_delete"
BEFORE DELETE ON "UnitOfMeasure"
FOR EACH ROW EXECUTE FUNCTION prevent_unit_of_measure_delete();

CREATE TABLE "InvoiceTaxComponent" (
  "id" TEXT NOT NULL,
  "purchaseInvoiceId" TEXT NOT NULL,
  "lineId" TEXT,
  "taxType" TEXT NOT NULL,
  "rate" DECIMAL(9,4) NOT NULL,
  "taxableAmount" DECIMAL(18,4) NOT NULL,
  "taxAmount" DECIMAL(18,4) NOT NULL,
  "exemptionCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvoiceTaxComponent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InvoiceTaxComponent_invoice_fkey" FOREIGN KEY ("purchaseInvoiceId") REFERENCES "PurchaseInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "InvoiceTaxComponent_line_fkey" FOREIGN KEY ("lineId") REFERENCES "PurchaseInvoiceLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "InvoiceTaxComponent_amount_check" CHECK ("rate" >= 0 AND "taxableAmount" >= 0 AND "taxAmount" >= 0)
);
CREATE INDEX "InvoiceTaxComponent_invoice_idx" ON "InvoiceTaxComponent"("purchaseInvoiceId");

CREATE TABLE "InvoiceAttachment" (
  "id" TEXT NOT NULL,
  "purchaseInvoiceId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "mediaType" TEXT NOT NULL,
  "checksum" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvoiceAttachment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InvoiceAttachment_invoice_fkey" FOREIGN KEY ("purchaseInvoiceId") REFERENCES "PurchaseInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "InvoiceAttachment_protected_storage_check" CHECK ("storageKey" !~* '^(public/|/public/|https?://)')
);
CREATE UNIQUE INDEX "InvoiceAttachment_invoice_kind_checksum_key" ON "InvoiceAttachment"("purchaseInvoiceId", "kind", "checksum");

CREATE TABLE "InvoiceTimelineEvent" (
  "id" TEXT NOT NULL,
  "purchaseInvoiceId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "outcome" TEXT NOT NULL,
  "actorUserId" TEXT,
  "requestId" TEXT NOT NULL,
  "safeMetadata" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvoiceTimelineEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InvoiceTimelineEvent_invoice_fkey" FOREIGN KEY ("purchaseInvoiceId") REFERENCES "PurchaseInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "InvoiceTimelineEvent_invoice_occurred_idx" ON "InvoiceTimelineEvent"("purchaseInvoiceId", "occurredAt");

CREATE TABLE "InvoicePaymentAllocation" (
  "id" TEXT NOT NULL,
  "purchaseInvoiceId" TEXT NOT NULL,
  "receiptId" TEXT,
  "supplierPaymentId" TEXT,
  "amount" DECIMAL(18,4) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'TRY',
  "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvoicePaymentAllocation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InvoicePaymentAllocation_invoice_fkey" FOREIGN KEY ("purchaseInvoiceId") REFERENCES "PurchaseInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "InvoicePaymentAllocation_receipt_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "InvoicePaymentAllocation_supplier_payment_fkey" FOREIGN KEY ("supplierPaymentId") REFERENCES "SupplierPayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "InvoicePaymentAllocation_source_check" CHECK (("receiptId" IS NOT NULL)::int + ("supplierPaymentId" IS NOT NULL)::int = 1),
  CONSTRAINT "InvoicePaymentAllocation_amount_check" CHECK ("amount" > 0)
);
CREATE UNIQUE INDEX "InvoicePaymentAllocation_idempotencyKey_key" ON "InvoicePaymentAllocation"("idempotencyKey");
CREATE INDEX "InvoicePaymentAllocation_invoice_idx" ON "InvoicePaymentAllocation"("purchaseInvoiceId");
CREATE INDEX "InvoicePaymentAllocation_receipt_idx" ON "InvoicePaymentAllocation"("receiptId");
CREATE INDEX "InvoicePaymentAllocation_supplier_payment_idx" ON "InvoicePaymentAllocation"("supplierPaymentId");

ALTER TABLE "TenantOutboxMessage"
  ADD COLUMN "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastErrorCode" TEXT;

CREATE TABLE "ElectronicDocumentConnection" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "providerKey" TEXT NOT NULL,
  "unitMappingVersion" TEXT NOT NULL,
  "connectionName" TEXT NOT NULL,
  "environment" TEXT NOT NULL,
  "apiEndpoint" TEXT,
  "credentialReference" TEXT,
  "credentialKeyVersion" TEXT,
  "credentialRotatedAt" TIMESTAMP(3),
  "companyTaxIdentity" TEXT NOT NULL,
  "senderUnit" TEXT,
  "mailbox" TEXT,
  "invoiceSeries" JSONB NOT NULL,
  "defaults" JSONB NOT NULL,
  "emailOptions" JSONB NOT NULL,
  "webhookVerificationRef" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT false,
  "capabilities" JSONB NOT NULL,
  "lastConnectionOutcome" TEXT,
  "lastConnectionTestedAt" TIMESTAMP(3),
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ElectronicDocumentConnection_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ElectronicDocumentConnection_environment_check" CHECK ("environment" IN ('TEST','PRODUCTION')),
  CONSTRAINT "ElectronicDocumentConnection_credential_ref_check" CHECK ("credentialReference" IS NULL OR "credentialReference" !~* '(password|secret|token)=')
);
CREATE UNIQUE INDEX "EDocConnection_org_provider_name_key" ON "ElectronicDocumentConnection"("organizationId", "providerKey", "connectionName");
CREATE INDEX "EDocConnection_org_active_idx" ON "ElectronicDocumentConnection"("organizationId", "active");

CREATE TABLE "ElectronicDocumentDelivery" (
  "id" TEXT NOT NULL,
  "purchaseInvoiceId" TEXT NOT NULL,
  "providerKey" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "providerReference" TEXT,
  "normalizedCode" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3),
  "lastSafeErrorCode" TEXT,
  "responseMetadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "ElectronicDocumentDelivery_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ElectronicDocumentDelivery_invoice_fkey" FOREIGN KEY ("purchaseInvoiceId") REFERENCES "PurchaseInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ElectronicDocumentDelivery_idempotencyKey_key" ON "ElectronicDocumentDelivery"("idempotencyKey");
CREATE INDEX "ElectronicDocumentDelivery_status_retry_idx" ON "ElectronicDocumentDelivery"("status", "nextAttemptAt");
CREATE INDEX "ElectronicDocumentDelivery_invoice_idx" ON "ElectronicDocumentDelivery"("purchaseInvoiceId");

CREATE TABLE "ElectronicDocumentWebhookInbox" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "providerKey" TEXT NOT NULL,
  "providerEventId" TEXT NOT NULL,
  "signatureOutcome" TEXT NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RECEIVED',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastSafeErrorCode" TEXT,
  "processedAt" TIMESTAMP(3),
  CONSTRAINT "ElectronicDocumentWebhookInbox_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ElectronicDocumentWebhookInbox_signature_check" CHECK ("signatureOutcome" IN ('VERIFIED','REJECTED'))
);
CREATE UNIQUE INDEX "EDocWebhook_org_provider_event_key" ON "ElectronicDocumentWebhookInbox"("organizationId", "providerKey", "providerEventId");
CREATE INDEX "EDocWebhook_status_received_idx" ON "ElectronicDocumentWebhookInbox"("status", "receivedAt");
