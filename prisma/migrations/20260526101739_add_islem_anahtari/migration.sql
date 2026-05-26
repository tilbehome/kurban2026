-- CreateTable
CREATE TABLE "IslemAnahtari" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "anahtar" TEXT NOT NULL,
    "islemTipi" TEXT NOT NULL,
    "sonucId" TEXT,
    "sonucJson" TEXT,
    "kullaniciId" TEXT,
    "ip" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "IslemAnahtari_anahtar_key" ON "IslemAnahtari"("anahtar");

-- CreateIndex
CREATE INDEX "IslemAnahtari_anahtar_idx" ON "IslemAnahtari"("anahtar");

-- CreateIndex
CREATE INDEX "IslemAnahtari_createdAt_idx" ON "IslemAnahtari"("createdAt");
