-- CreateTable
CREATE TABLE "Not" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "musteriId" TEXT NOT NULL,
    "icerik" TEXT NOT NULL,
    "renk" TEXT NOT NULL DEFAULT 'bilgi',
    "sabitlendiMi" BOOLEAN NOT NULL DEFAULT false,
    "olusturanId" TEXT NOT NULL,
    "silindiMi" BOOLEAN NOT NULL DEFAULT false,
    "silinmeTarihi" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Not_musteriId_fkey" FOREIGN KEY ("musteriId") REFERENCES "Musteri" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vekalet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hisseId" TEXT NOT NULL,
    "dosyaUrl" TEXT NOT NULL,
    "dosyaTipi" TEXT NOT NULL,
    "dosyaBoyutu" INTEGER NOT NULL,
    "olusturanId" TEXT NOT NULL,
    "silindiMi" BOOLEAN NOT NULL DEFAULT false,
    "silinmeTarihi" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Vekalet_hisseId_fkey" FOREIGN KEY ("hisseId") REFERENCES "Hisse" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Not_musteriId_idx" ON "Not"("musteriId");

-- CreateIndex
CREATE INDEX "Not_silindiMi_idx" ON "Not"("silindiMi");

-- CreateIndex
CREATE INDEX "Not_renk_idx" ON "Not"("renk");

-- CreateIndex
CREATE UNIQUE INDEX "Vekalet_hisseId_key" ON "Vekalet"("hisseId");

-- CreateIndex
CREATE INDEX "Vekalet_silindiMi_idx" ON "Vekalet"("silindiMi");
