-- CreateTable
CREATE TABLE "WhatsAppSablonu" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ad" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "icerik" TEXT NOT NULL,
    "aktifMi" BOOLEAN NOT NULL DEFAULT true,
    "varsayilan" BOOLEAN NOT NULL DEFAULT false,
    "olusturanId" TEXT,
    "silindiMi" BOOLEAN NOT NULL DEFAULT false,
    "silinmeTarihi" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WhatsAppGonderim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sablonId" TEXT NOT NULL,
    "baslamaTarihi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bitisTarihi" DATETIME,
    "hedefSayisi" INTEGER NOT NULL DEFAULT 0,
    "acilanSayisi" INTEGER NOT NULL DEFAULT 0,
    "atlananSayisi" INTEGER NOT NULL DEFAULT 0,
    "hataSayisi" INTEGER NOT NULL DEFAULT 0,
    "telefonsuzSayisi" INTEGER NOT NULL DEFAULT 0,
    "not" TEXT,
    "hedefler" TEXT NOT NULL,
    "kullaniciId" TEXT NOT NULL,
    "silindiMi" BOOLEAN NOT NULL DEFAULT false,
    "silinmeTarihi" DATETIME,
    "olusturanId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WhatsAppGonderim_sablonId_fkey" FOREIGN KEY ("sablonId") REFERENCES "WhatsAppSablonu" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WhatsAppGonderim_kullaniciId_fkey" FOREIGN KEY ("kullaniciId") REFERENCES "Kullanici" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "WhatsAppSablonu_aktifMi_silindiMi_idx" ON "WhatsAppSablonu"("aktifMi", "silindiMi");

-- CreateIndex
CREATE INDEX "WhatsAppSablonu_kategori_idx" ON "WhatsAppSablonu"("kategori");

-- CreateIndex
CREATE INDEX "WhatsAppGonderim_sablonId_idx" ON "WhatsAppGonderim"("sablonId");

-- CreateIndex
CREATE INDEX "WhatsAppGonderim_kullaniciId_idx" ON "WhatsAppGonderim"("kullaniciId");

-- CreateIndex
CREATE INDEX "WhatsAppGonderim_silindiMi_idx" ON "WhatsAppGonderim"("silindiMi");

-- CreateIndex
CREATE INDEX "WhatsAppGonderim_baslamaTarihi_idx" ON "WhatsAppGonderim"("baslamaTarihi");
