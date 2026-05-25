-- AlterTable
ALTER TABLE "Hisse" ADD COLUMN "paketDurumu" TEXT;
ALTER TABLE "Hisse" ADD COLUMN "paketKg" REAL;
ALTER TABLE "Hisse" ADD COLUMN "teslimTarihi" DATETIME;

-- CreateTable
CREATE TABLE "PushAbonelik" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "musteriId" TEXT,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "oturumKey" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PushAbonelik_musteriId_fkey" FOREIGN KEY ("musteriId") REFERENCES "Musteri" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BildirimLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "musteriId" TEXT,
    "abonelikId" TEXT,
    "kanal" TEXT NOT NULL,
    "sablon" TEXT,
    "baslik" TEXT NOT NULL,
    "mesaj" TEXT NOT NULL,
    "durum" TEXT NOT NULL DEFAULT 'gonderildi',
    "hata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BildirimLog_abonelikId_fkey" FOREIGN KEY ("abonelikId") REFERENCES "PushAbonelik" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Kurban" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kesimSirasi" INTEGER NOT NULL,
    "kesimSaati" TEXT,
    "kupeNo" TEXT,
    "hisseSayisi" INTEGER NOT NULL DEFAULT 7,
    "satisBedeli" REAL NOT NULL DEFAULT 0,
    "canliAgirlik" REAL DEFAULT 0,
    "karkasAgirlik" REAL DEFAULT 0,
    "durum" TEXT NOT NULL DEFAULT 'aktif',
    "notlar" TEXT,
    "kesimDurumu" TEXT NOT NULL DEFAULT 'beklemede',
    "operasyonSira" INTEGER,
    "asama" TEXT,
    "ilerlemeYuzde" INTEGER NOT NULL DEFAULT 0,
    "kalanSureDk" INTEGER,
    "kesimBaslama" DATETIME,
    "kesimBitis" DATETIME,
    "toplamKg" REAL,
    "karkasKg" REAL,
    "silindiMi" BOOLEAN NOT NULL DEFAULT false,
    "silinmeTarihi" DATETIME,
    "olusturanId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Kurban" ("canliAgirlik", "createdAt", "durum", "hisseSayisi", "id", "karkasAgirlik", "kesimSaati", "kesimSirasi", "kupeNo", "notlar", "olusturanId", "satisBedeli", "silindiMi", "silinmeTarihi", "updatedAt") SELECT "canliAgirlik", "createdAt", "durum", "hisseSayisi", "id", "karkasAgirlik", "kesimSaati", "kesimSirasi", "kupeNo", "notlar", "olusturanId", "satisBedeli", "silindiMi", "silinmeTarihi", "updatedAt" FROM "Kurban";
DROP TABLE "Kurban";
ALTER TABLE "new_Kurban" RENAME TO "Kurban";
CREATE UNIQUE INDEX "Kurban_kesimSirasi_key" ON "Kurban"("kesimSirasi");
CREATE INDEX "Kurban_kesimSirasi_idx" ON "Kurban"("kesimSirasi");
CREATE INDEX "Kurban_durum_idx" ON "Kurban"("durum");
CREATE INDEX "Kurban_silindiMi_idx" ON "Kurban"("silindiMi");
CREATE INDEX "Kurban_kesimDurumu_idx" ON "Kurban"("kesimDurumu");
CREATE INDEX "Kurban_operasyonSira_idx" ON "Kurban"("operasyonSira");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PushAbonelik_endpoint_key" ON "PushAbonelik"("endpoint");

-- CreateIndex
CREATE INDEX "PushAbonelik_musteriId_idx" ON "PushAbonelik"("musteriId");

-- CreateIndex
CREATE INDEX "PushAbonelik_oturumKey_idx" ON "PushAbonelik"("oturumKey");

-- CreateIndex
CREATE INDEX "PushAbonelik_aktif_idx" ON "PushAbonelik"("aktif");

-- CreateIndex
CREATE INDEX "BildirimLog_musteriId_idx" ON "BildirimLog"("musteriId");

-- CreateIndex
CREATE INDEX "BildirimLog_kanal_idx" ON "BildirimLog"("kanal");

-- CreateIndex
CREATE INDEX "BildirimLog_createdAt_idx" ON "BildirimLog"("createdAt");

-- CreateIndex
CREATE INDEX "Hisse_paketDurumu_idx" ON "Hisse"("paketDurumu");
