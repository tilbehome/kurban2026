-- Faz 8: locked slaughter workflow, assignment history, exception desk and safe operation modes.

ALTER TABLE "SlaughterJob"
  ADD COLUMN "facilityId" TEXT,
  ADD COLUMN "teamId" TEXT,
  ADD COLUMN "stationId" TEXT,
  ADD COLUMN "assignedDeviceId" TEXT,
  ADD COLUMN "blockedReason" TEXT,
  ADD COLUMN "delayReason" TEXT,
  ADD COLUMN "startedAt" TIMESTAMP(3),
  ADD COLUMN "completedAt" TIMESTAMP(3),
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
CREATE UNIQUE INDEX "SlaughterJob_one_active_per_animal"
  ON "SlaughterJob"("seasonId", "animalId") WHERE "status" NOT IN ('delivered', 'done');
CREATE INDEX "SlaughterJob_seasonId_stationId_status_idx" ON "SlaughterJob"("seasonId", "stationId", "status");

CREATE TABLE "SlaughterJobHistory" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slaughterJobId" TEXT NOT NULL,
  "fromStatus" TEXT,
  "toStatus" TEXT NOT NULL,
  "reason" TEXT,
  "actorUserId" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SlaughterJobHistory_slaughterJobId_fkey" FOREIGN KEY ("slaughterJobId") REFERENCES "SlaughterJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "SlaughterJobHistory_slaughterJobId_occurredAt_idx" ON "SlaughterJobHistory"("slaughterJobId", "occurredAt");

INSERT INTO "SlaughterJobHistory" ("id", "slaughterJobId", "fromStatus", "toStatus", "reason", "actorUserId", "occurredAt")
SELECT 'slaughter_history_migrated_' || job."id", job."id", NULL, job."status", 'Faz 8 tarihçe başlangıç kaydı', COALESCE(job."assignedUserId", 'migration'), job."updatedAt"
FROM "SlaughterJob" AS job;

CREATE TABLE "SlaughterJobAssignment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slaughterJobId" TEXT NOT NULL,
  "facilityId" TEXT,
  "teamId" TEXT,
  "stationId" TEXT,
  "assignedUserId" TEXT,
  "assignedDeviceId" TEXT,
  "queueNo" INTEGER,
  "reason" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SlaughterJobAssignment_slaughterJobId_fkey" FOREIGN KEY ("slaughterJobId") REFERENCES "SlaughterJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "SlaughterJobAssignment_slaughterJobId_occurredAt_idx" ON "SlaughterJobAssignment"("slaughterJobId", "occurredAt");

CREATE TABLE "OperationTeam" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "seasonId" TEXT NOT NULL,
  "facilityId" TEXT,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OperationTeam_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "OperationTeam_seasonId_code_key" ON "OperationTeam"("seasonId", "code");

CREATE TABLE "OperationStation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "seasonId" TEXT NOT NULL,
  "facilityId" TEXT,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "stationType" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OperationStation_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "OperationStation_seasonId_code_key" ON "OperationStation"("seasonId", "code");

CREATE TABLE "OperationException" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "seasonId" TEXT NOT NULL,
  "slaughterJobId" TEXT,
  "category" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "assignedUserId" TEXT,
  "reportedByUserId" TEXT NOT NULL,
  "reportedAt" TIMESTAMP(3) NOT NULL,
  "resolvedByUserId" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "resolution" TEXT,
  CONSTRAINT "OperationException_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "OperationException_slaughterJobId_fkey" FOREIGN KEY ("slaughterJobId") REFERENCES "SlaughterJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "OperationException_severity_check" CHECK ("severity" IN ('low','medium','high','critical')),
  CONSTRAINT "OperationException_status_check" CHECK ("status" IN ('open','assigned','resolved','reopened'))
);
CREATE INDEX "OperationException_seasonId_status_severity_idx" ON "OperationException"("seasonId", "status", "severity");
CREATE INDEX "OperationException_slaughterJobId_idx" ON "OperationException"("slaughterJobId");

CREATE TABLE "OperationModeState" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "seasonId" TEXT NOT NULL,
  "mode" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OperationModeState_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "OperationModeState_mode_check" CHECK ("mode" IN ('normal','restricted','read_only','emergency_stop'))
);
CREATE INDEX "OperationModeState_seasonId_updatedAt_idx" ON "OperationModeState"("seasonId", "updatedAt");
