-- CreateTable
CREATE TABLE "Kullanici" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kullaniciAdi" TEXT NOT NULL,
    "sifreHash" TEXT NOT NULL,
    "adSoyad" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "sonGiris" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Ayar" (
    "anahtar" TEXT NOT NULL PRIMARY KEY,
    "deger" TEXT NOT NULL,
    "guncelTarih" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ModulDurum" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "versiyon" TEXT NOT NULL,
    "ayarlar" TEXT,
    "yuklemeT" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelTarih" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Musteri" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "adSoyad" TEXT NOT NULL,
    "telefon" TEXT,
    "tcKimlik" TEXT,
    "adres" TEXT,
    "notlar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Kurban" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kesimSirasi" INTEGER NOT NULL,
    "kesimSaati" TEXT,
    "kupeNo" TEXT,
    "hisseSayisi" INTEGER NOT NULL DEFAULT 7,
    "satisBedeli" REAL NOT NULL DEFAULT 0,
    "canliAgirlik" REAL DEFAULT 0,
    "karkasAgirlik" REAL DEFAULT 0,
    "durum" TEXT NOT NULL DEFAULT 'aktif',
    "notlar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Hisse" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kurbanId" INTEGER NOT NULL,
    "no" INTEGER NOT NULL,
    "musteriId" INTEGER,
    "hisseFiyati" REAL NOT NULL DEFAULT 0,
    "vekaletAlindi" BOOLEAN NOT NULL DEFAULT false,
    "vekaletTarihi" DATETIME,
    "notlar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Hisse_kurbanId_fkey" FOREIGN KEY ("kurbanId") REFERENCES "Kurban" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Hisse_musteriId_fkey" FOREIGN KEY ("musteriId") REFERENCES "Musteri" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Odeme" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hisseId" INTEGER NOT NULL,
    "tarih" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nakit" REAL NOT NULL DEFAULT 0,
    "havale" REAL NOT NULL DEFAULT 0,
    "kart" REAL NOT NULL DEFAULT 0,
    "toplamTutar" REAL NOT NULL,
    "yontem" TEXT NOT NULL,
    "notlar" TEXT,
    "dekontNo" TEXT NOT NULL,
    "kullaniciId" INTEGER NOT NULL,
    "iptal" BOOLEAN NOT NULL DEFAULT false,
    "iptalSebep" TEXT,
    "iptalTarihi" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Odeme_hisseId_fkey" FOREIGN KEY ("hisseId") REFERENCES "Hisse" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Odeme_kullaniciId_fkey" FOREIGN KEY ("kullaniciId") REFERENCES "Kullanici" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KasaHareketi" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tip" TEXT NOT NULL,
    "tutar" REAL NOT NULL,
    "yontem" TEXT NOT NULL,
    "aciklama" TEXT NOT NULL,
    "odemeId" INTEGER,
    "kullaniciId" INTEGER NOT NULL,
    "tarih" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KasaHareketi_kullaniciId_fkey" FOREIGN KEY ("kullaniciId") REFERENCES "Kullanici" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Kullanici_kullaniciAdi_key" ON "Kullanici"("kullaniciAdi");

-- CreateIndex
CREATE INDEX "Kullanici_kullaniciAdi_idx" ON "Kullanici"("kullaniciAdi");

-- CreateIndex
CREATE INDEX "Musteri_adSoyad_idx" ON "Musteri"("adSoyad");

-- CreateIndex
CREATE INDEX "Musteri_telefon_idx" ON "Musteri"("telefon");

-- CreateIndex
CREATE UNIQUE INDEX "Kurban_kesimSirasi_key" ON "Kurban"("kesimSirasi");

-- CreateIndex
CREATE INDEX "Kurban_kesimSirasi_idx" ON "Kurban"("kesimSirasi");

-- CreateIndex
CREATE INDEX "Kurban_durum_idx" ON "Kurban"("durum");

-- CreateIndex
CREATE INDEX "Hisse_musteriId_idx" ON "Hisse"("musteriId");

-- CreateIndex
CREATE UNIQUE INDEX "Hisse_kurbanId_no_key" ON "Hisse"("kurbanId", "no");

-- CreateIndex
CREATE UNIQUE INDEX "Odeme_dekontNo_key" ON "Odeme"("dekontNo");

-- CreateIndex
CREATE INDEX "Odeme_hisseId_idx" ON "Odeme"("hisseId");

-- CreateIndex
CREATE INDEX "Odeme_tarih_idx" ON "Odeme"("tarih");

-- CreateIndex
CREATE INDEX "Odeme_dekontNo_idx" ON "Odeme"("dekontNo");

-- CreateIndex
CREATE INDEX "KasaHareketi_tarih_idx" ON "KasaHareketi"("tarih");
