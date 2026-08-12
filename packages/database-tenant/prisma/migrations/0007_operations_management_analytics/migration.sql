ALTER TABLE "PackageRecord"
  ADD COLUMN IF NOT EXISTS "labelVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "reprintReason" TEXT,
  ADD COLUMN IF NOT EXISTS "coldRoomId" TEXT,
  ADD COLUMN IF NOT EXISTS "coldSectionId" TEXT,
  ADD COLUMN IF NOT EXISTS "coldRackId" TEXT,
  ADD COLUMN IF NOT EXISTS "locationStatus" TEXT NOT NULL DEFAULT 'not_stored';

ALTER TABLE "DeliveryRecord"
  ADD COLUMN IF NOT EXISTS "receiverName" TEXT,
  ADD COLUMN IF NOT EXISTS "debtOverrideReason" TEXT,
  ADD COLUMN IF NOT EXISTS "approvalRequestId" TEXT,
  ADD COLUMN IF NOT EXISTS "proofDocumentId" TEXT,
  ADD COLUMN IF NOT EXISTS "loadingListId" TEXT;

CREATE TABLE IF NOT EXISTS "PackageComponent" (
  "id" TEXT NOT NULL,
  "packageRecordId" TEXT NOT NULL,
  "componentType" TEXT NOT NULL,
  "weightKg" DECIMAL(12,3) NOT NULL,
  "estimatedValue" DECIMAL(18,4),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PackageComponent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PackageComponent_type_check" CHECK ("componentType" IN ('bone_in', 'boneless', 'offal', 'other')),
  CONSTRAINT "PackageComponent_weight_positive_check" CHECK ("weightKg" >= 0)
);

CREATE TABLE IF NOT EXISTS "ColdStorageRoom" (
  "id" TEXT NOT NULL,
  "facilityId" TEXT,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ColdStorageRoom_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ColdStorageSection" (
  "id" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "ColdStorageSection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ColdStorageRack" (
  "id" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "sectionId" TEXT,
  "code" TEXT NOT NULL,
  "name" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "ColdStorageRack_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PackageLocation" (
  "id" TEXT NOT NULL,
  "packageRecordId" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "sectionId" TEXT,
  "rackId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "placedAt" TIMESTAMP(3) NOT NULL,
  "removedAt" TIMESTAMP(3),
  "reason" TEXT,
  CONSTRAINT "PackageLocation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PackageLocation_status_check" CHECK ("status" IN ('active', 'removed'))
);

CREATE TABLE IF NOT EXISTS "DeliveryProof" (
  "id" TEXT NOT NULL,
  "deliveryRecordId" TEXT NOT NULL,
  "proofType" TEXT NOT NULL,
  "storageKey" TEXT,
  "note" TEXT,
  "capturedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DeliveryProof_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DeliveryProof_type_check" CHECK ("proofType" IN ('signature', 'photo', 'voice', 'note'))
);

CREATE TABLE IF NOT EXISTS "DeliveryVehicle" (
  "id" TEXT NOT NULL,
  "plateNo" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "DeliveryVehicle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "VehicleTask" (
  "id" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "seasonId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'planned',
  "assignedTo" TEXT,
  "startsAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "VehicleTask_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VehicleTask_status_check" CHECK ("status" IN ('planned', 'loading', 'in_transit', 'completed', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS "LoadingList" (
  "id" TEXT NOT NULL,
  "seasonId" TEXT NOT NULL,
  "vehicleId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "routeName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LoadingList_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LoadingList_status_check" CHECK ("status" IN ('draft', 'loading', 'loaded', 'dispatched', 'completed', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS "LoadingListItem" (
  "loadingListId" TEXT NOT NULL,
  "packageRecordId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'planned',
  "loadedAt" TIMESTAMP(3),
  CONSTRAINT "LoadingListItem_pkey" PRIMARY KEY ("loadingListId", "packageRecordId"),
  CONSTRAINT "LoadingListItem_status_check" CHECK ("status" IN ('planned', 'loaded', 'delivered', 'missing', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS "SavedDashboardView" (
  "id" TEXT NOT NULL,
  "organizationMembershipId" TEXT,
  "name" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "filters" JSONB NOT NULL,
  "layout" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SavedDashboardView_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PackageRecord_coldRoomId_coldSectionId_coldRackId_locationStatus_idx" ON "PackageRecord"("coldRoomId", "coldSectionId", "coldRackId", "locationStatus");
CREATE INDEX IF NOT EXISTS "DeliveryRecord_loadingListId_idx" ON "DeliveryRecord"("loadingListId");
CREATE INDEX IF NOT EXISTS "PackageComponent_packageRecordId_idx" ON "PackageComponent"("packageRecordId");
CREATE INDEX IF NOT EXISTS "PackageComponent_componentType_idx" ON "PackageComponent"("componentType");
CREATE UNIQUE INDEX IF NOT EXISTS "ColdStorageRoom_facilityId_code_key" ON "ColdStorageRoom"("facilityId", "code");
CREATE INDEX IF NOT EXISTS "ColdStorageRoom_facilityId_active_idx" ON "ColdStorageRoom"("facilityId", "active");
CREATE UNIQUE INDEX IF NOT EXISTS "ColdStorageSection_roomId_code_key" ON "ColdStorageSection"("roomId", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "ColdStorageRack_roomId_sectionId_code_key" ON "ColdStorageRack"("roomId", "sectionId", "code");
CREATE INDEX IF NOT EXISTS "PackageLocation_packageRecordId_status_idx" ON "PackageLocation"("packageRecordId", "status");
CREATE INDEX IF NOT EXISTS "PackageLocation_roomId_sectionId_rackId_status_idx" ON "PackageLocation"("roomId", "sectionId", "rackId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "PackageLocation_one_active_per_package_key" ON "PackageLocation"("packageRecordId") WHERE "status" = 'active';
CREATE INDEX IF NOT EXISTS "DeliveryProof_deliveryRecordId_idx" ON "DeliveryProof"("deliveryRecordId");
CREATE UNIQUE INDEX IF NOT EXISTS "DeliveryVehicle_plateNo_key" ON "DeliveryVehicle"("plateNo");
CREATE INDEX IF NOT EXISTS "VehicleTask_seasonId_status_idx" ON "VehicleTask"("seasonId", "status");
CREATE INDEX IF NOT EXISTS "LoadingList_seasonId_status_idx" ON "LoadingList"("seasonId", "status");
CREATE INDEX IF NOT EXISTS "SavedDashboardView_organizationMembershipId_scope_idx" ON "SavedDashboardView"("organizationMembershipId", "scope");

ALTER TABLE "PackageComponent" ADD CONSTRAINT "PackageComponent_packageRecordId_fkey" FOREIGN KEY ("packageRecordId") REFERENCES "PackageRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PackageRecord" ADD CONSTRAINT "PackageRecord_coldRoomId_fkey" FOREIGN KEY ("coldRoomId") REFERENCES "ColdStorageRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PackageRecord" ADD CONSTRAINT "PackageRecord_coldSectionId_fkey" FOREIGN KEY ("coldSectionId") REFERENCES "ColdStorageSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PackageRecord" ADD CONSTRAINT "PackageRecord_coldRackId_fkey" FOREIGN KEY ("coldRackId") REFERENCES "ColdStorageRack"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ColdStorageSection" ADD CONSTRAINT "ColdStorageSection_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ColdStorageRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ColdStorageRack" ADD CONSTRAINT "ColdStorageRack_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ColdStorageRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ColdStorageRack" ADD CONSTRAINT "ColdStorageRack_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ColdStorageSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PackageLocation" ADD CONSTRAINT "PackageLocation_packageRecordId_fkey" FOREIGN KEY ("packageRecordId") REFERENCES "PackageRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PackageLocation" ADD CONSTRAINT "PackageLocation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ColdStorageRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PackageLocation" ADD CONSTRAINT "PackageLocation_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ColdStorageSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PackageLocation" ADD CONSTRAINT "PackageLocation_rackId_fkey" FOREIGN KEY ("rackId") REFERENCES "ColdStorageRack"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DeliveryProof" ADD CONSTRAINT "DeliveryProof_deliveryRecordId_fkey" FOREIGN KEY ("deliveryRecordId") REFERENCES "DeliveryRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VehicleTask" ADD CONSTRAINT "VehicleTask_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "DeliveryVehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LoadingList" ADD CONSTRAINT "LoadingList_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "DeliveryVehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LoadingListItem" ADD CONSTRAINT "LoadingListItem_loadingListId_fkey" FOREIGN KEY ("loadingListId") REFERENCES "LoadingList"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LoadingListItem" ADD CONSTRAINT "LoadingListItem_packageRecordId_fkey" FOREIGN KEY ("packageRecordId") REFERENCES "PackageRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DeliveryRecord" ADD CONSTRAINT "DeliveryRecord_loadingListId_fkey" FOREIGN KEY ("loadingListId") REFERENCES "LoadingList"("id") ON DELETE SET NULL ON UPDATE CASCADE;
