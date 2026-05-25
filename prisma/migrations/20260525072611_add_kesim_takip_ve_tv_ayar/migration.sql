-- CreateTable
CREATE TABLE "TvAyari" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "anahtarKey" TEXT NOT NULL,
    "deger" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "guncelleyenId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Hisse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kurbanId" TEXT NOT NULL,
    "no" INTEGER NOT NULL,
    "musteriId" TEXT,
    "hisseFiyati" REAL NOT NULL DEFAULT 0,
    "vekaletAlindi" BOOLEAN NOT NULL DEFAULT false,
    "vekaletTarihi" DATETIME,
    "notlar" TEXT,
    "kesimDurumu" TEXT NOT NULL DEFAULT 'beklemede',
    "siraNo" INTEGER,
    "asama" TEXT,
    "ilerlemeYuzde" INTEGER NOT NULL DEFAULT 0,
    "kalanSureDk" INTEGER,
    "kesimBaslama" DATETIME,
    "kesimBitis" DATETIME,
    "teslimNoktasi" TEXT,
    "teslimDurumu" TEXT,
    "silindiMi" BOOLEAN NOT NULL DEFAULT false,
    "silinmeTarihi" DATETIME,
    "olusturanId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Hisse_kurbanId_fkey" FOREIGN KEY ("kurbanId") REFERENCES "Kurban" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Hisse_musteriId_fkey" FOREIGN KEY ("musteriId") REFERENCES "Musteri" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Hisse" ("createdAt", "hisseFiyati", "id", "kurbanId", "musteriId", "no", "notlar", "olusturanId", "silindiMi", "silinmeTarihi", "updatedAt", "vekaletAlindi", "vekaletTarihi") SELECT "createdAt", "hisseFiyati", "id", "kurbanId", "musteriId", "no", "notlar", "olusturanId", "silindiMi", "silinmeTarihi", "updatedAt", "vekaletAlindi", "vekaletTarihi" FROM "Hisse";
DROP TABLE "Hisse";
ALTER TABLE "new_Hisse" RENAME TO "Hisse";
CREATE INDEX "Hisse_musteriId_idx" ON "Hisse"("musteriId");
CREATE INDEX "Hisse_silindiMi_idx" ON "Hisse"("silindiMi");
CREATE INDEX "Hisse_kesimDurumu_idx" ON "Hisse"("kesimDurumu");
CREATE INDEX "Hisse_siraNo_idx" ON "Hisse"("siraNo");
CREATE UNIQUE INDEX "Hisse_kurbanId_no_key" ON "Hisse"("kurbanId", "no");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "TvAyari_anahtarKey_key" ON "TvAyari"("anahtarKey");

-- CreateIndex
CREATE INDEX "TvAyari_aktif_idx" ON "TvAyari"("aktif");
