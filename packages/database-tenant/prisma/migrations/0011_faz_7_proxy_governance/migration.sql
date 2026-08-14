-- Faz 7: share-scoped proxy governance, multi-grantor evidence and immutable status history.

ALTER TABLE "ProxyDocument"
  ADD COLUMN "policyVersion" TEXT NOT NULL DEFAULT 'legacy',
  ADD COLUMN "receivedAt" TIMESTAMP(3),
  ADD COLUMN "receivedPlace" TEXT,
  ADD COLUMN "receivedByUserId" TEXT,
  ADD COLUMN "description" TEXT;

ALTER TABLE "ProxyDocument" ADD CONSTRAINT "ProxyDocument_status_check"
  CHECK ("status" IN ('draft', 'received', 'signed', 'revoked', 'invalid', 'lost'));
ALTER TABLE "ProxyDocument" ADD CONSTRAINT "ProxyDocument_method_check"
  CHECK ("method" IN ('face_to_face', 'phone', 'oral', 'written', 'other', 'voice_recording', 'face_to_face_oral', 'legacy_migrated'));

CREATE TABLE "ProxyGrantor" (
  "proxyDocumentId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "shareId" TEXT NOT NULL,
  "relationshipToShareholder" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProxyGrantor_pkey" PRIMARY KEY ("proxyDocumentId", "customerId", "shareId"),
  CONSTRAINT "ProxyGrantor_proxyDocumentId_fkey" FOREIGN KEY ("proxyDocumentId") REFERENCES "ProxyDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ProxyGrantor_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ProxyGrantor_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "Share"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "ProxyGrantor_customerId_idx" ON "ProxyGrantor"("customerId");
CREATE INDEX "ProxyGrantor_shareId_idx" ON "ProxyGrantor"("shareId");

INSERT INTO "ProxyGrantor" ("proxyDocumentId", "customerId", "shareId", "relationshipToShareholder")
SELECT link."proxyDocumentId", document."customerId", link."shareId", 'legacy_primary_grantor'
FROM "ProxyDocumentShare" AS link
JOIN "ProxyDocument" AS document ON document."id" = link."proxyDocumentId";

CREATE TABLE "ProxyDocumentHistory" (
  "id" TEXT NOT NULL,
  "proxyDocumentId" TEXT NOT NULL,
  "fromStatus" TEXT,
  "toStatus" TEXT NOT NULL,
  "reason" TEXT,
  "actorUserId" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProxyDocumentHistory_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProxyDocumentHistory_proxyDocumentId_fkey" FOREIGN KEY ("proxyDocumentId") REFERENCES "ProxyDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ProxyDocumentHistory_status_check" CHECK ("toStatus" IN ('draft', 'received', 'signed', 'revoked', 'invalid', 'lost'))
);
CREATE INDEX "ProxyDocumentHistory_proxyDocumentId_occurredAt_idx" ON "ProxyDocumentHistory"("proxyDocumentId", "occurredAt");

INSERT INTO "ProxyDocumentHistory" ("id", "proxyDocumentId", "fromStatus", "toStatus", "reason", "actorUserId", "occurredAt")
SELECT 'proxy_history_migrated_' || document."id", document."id", NULL, document."status", 'Faz 7 tarihçe başlangıç kaydı', document."createdByUserId", document."createdAt"
FROM "ProxyDocument" AS document;

ALTER TABLE "QrToken"
  ADD COLUMN "seasonId" TEXT,
  ADD COLUMN "createdByUserId" TEXT,
  ADD COLUMN "consumedAt" TIMESTAMP(3),
  ADD COLUMN "publicLabel" TEXT;
CREATE INDEX "QrToken_seasonId_purpose_idx" ON "QrToken"("seasonId", "purpose");
