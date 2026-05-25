-- AlterTable
ALTER TABLE "BildirimLog" ADD COLUMN "kullaniciId" TEXT;

-- CreateIndex
CREATE INDEX "BildirimLog_kullaniciId_idx" ON "BildirimLog"("kullaniciId");
